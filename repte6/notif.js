/* El Gran Repte 6è · AVISOS (campana de la capçalera)
   - Duels: invitacions en directe, reptes rebuts i resultats dels reptes enviats (venen del mòdul Duel).
   - Classificació de la setmana: companys nous, qui t'avança, qui entra al top 3, nou líder…
   La classificació es compara amb l'última que vas veure (guardada en aquest dispositiu). Per no gastar
   lectures de Firebase, només es consulta en entrar i, com a molt, cada 10 minuts en obrir la campana. */
window.Notif = (function () {
  const $ = id => document.getElementById(id);
  const E = s => escHTML(s == null ? '' : s);
  const MIN_GAP = 10 * 60e3, KEEP = 40;
  let busy = false;
  const acc = () => window.GR && GR.acc;
  const key = k => 'egr6_' + k + '_' + (acc() ? acc().uid : 'x');
  const load = (k, d) => { try { return JSON.parse(localStorage.getItem(key(k))) || d; } catch (e) { return d; } };
  const save = (k, v) => { try { localStorage.setItem(key(k), JSON.stringify(v)); } catch (e) { /* */ } };
  const first = n => String(n || '').split(' ')[0];
  const ord = n => n + (n === 1 ? 'r' : n === 2 ? 'n' : n === 3 ? 'r' : n === 4 ? 't' : 'è');
  const ago = t => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'ara' : m < 60 ? `fa ${m} min` : m < 1440 ? `fa ${Math.round(m / 60)} h` : `fa ${Math.round(m / 1440)} d`; };

  /* ---------- avisos de la classificació (comparant amb l'última foto) ---------- */
  function add(list, icon, text, act) { list.unshift({ id: Date.now() + '_' + Math.random().toString(36).slice(2, 6), t: Date.now(), icon, text, act: act || 'board', read: false }); }
  async function checkBoard(force) {
    const a = acc(); if (!a || a.teacher || !a.cls || !GR.available() || busy) return;
    const last = load('nb_t', 0); if (!force && Date.now() - last < MIN_GAP) return;
    busy = true;
    try {
      const wk = GR.weekKey();
      const rows = (await GR.classBoard(a.cls)).map(r => ({ uid: r.uid, name: r.name, p: r.wk === wk ? (r.ptsW || 0) : 0 })).filter(r => r.p > 0).sort((x, y) => y.p - x.p);
      const pos = {}; rows.forEach((r, i) => { pos[r.uid] = i + 1; });
      const prev = load('snap', null), list = load('list', []), before = list.length;
      const names = {}; rows.forEach(r => { names[r.uid] = r.name; });
      if (prev && prev.wk === wk) {
        const me = a.uid, myNow = pos[me], myPrev = prev.pos[me];
        // companys que entren a la classificació d'aquesta setmana
        const fresh = rows.filter(r => r.uid !== me && !prev.pos[r.uid]);
        if (fresh.length === 1) add(list, '🆕', `${first(fresh[0].name)} ha entrat a la classificació de la setmana`);
        else if (fresh.length > 1) add(list, '🆕', `${fresh.slice(0, 3).map(r => first(r.name)).join(', ')}${fresh.length > 3 ? ` i ${fresh.length - 3} més` : ''} han entrat a la classificació`);
        // nou líder
        const lead = rows[0] && rows[0].uid, prevLead = Object.keys(prev.pos).find(u => prev.pos[u] === 1);
        if (lead && lead !== prevLead) add(list, '👑', lead === me ? 'Ets el nou líder de la setmana! 🎉' : `${first(names[lead])} és el nou líder de la setmana`);
        // entrades al top 3 (sense repetir el líder)
        rows.slice(0, 3).forEach((r, i) => { if (r.uid === lead && lead !== prevLead) return; if (!prev.pos[r.uid] || prev.pos[r.uid] > 3) add(list, '🏅', r.uid === me ? `Has entrat al top 3! Vas ${ord(i + 1)}` : `${first(r.name)} ha entrat al top 3`); });
        // qui t'ha avançat / a qui has avançat
        if (myNow && myPrev) {
          const passedMe = rows.filter(r => r.uid !== me && pos[r.uid] < myNow && (!prev.pos[r.uid] || prev.pos[r.uid] > myPrev));
          const iPassed = rows.filter(r => r.uid !== me && pos[r.uid] > myNow && prev.pos[r.uid] && prev.pos[r.uid] < myPrev);
          if (passedMe.length) add(list, '⚠️', `${passedMe.slice(0, 2).map(r => first(r.name)).join(' i ')}${passedMe.length > 2 ? ` i ${passedMe.length - 2} més` : ''} t'${passedMe.length > 1 ? 'han' : 'ha'} avançat. Ara vas ${ord(myNow)}`);
          if (iPassed.length) add(list, '🚀', `Has avançat ${iPassed.slice(0, 2).map(r => first(r.name)).join(' i ')}${iPassed.length > 2 ? ` i ${iPassed.length - 2} més` : ''}. Ara vas ${ord(myNow)}`);
        }
      } else if (prev && prev.wk !== wk) add(list, '📅', 'Nova setmana: la classificació torna a començar. A per totes!');
      save('snap', { wk, pos }); save('nb_t', Date.now());
      save('list', list.slice(0, KEEP));
      if (list.length > before) ding();
    } catch (e) { /* sense connexió: ja ho mirarem més tard */ }
    busy = false; render();
  }

  /* ---------- avisos de duels (en viu, del mòdul Duel) ---------- */
  function duelItems() {
    if (!window.Duel || !Duel.state) return [];
    const s = Duel.state(), now = Date.now(), out = [];
    s.invites.forEach(i => out.push({ live: 1, t: i.t, icon: '⚔️', text: `${first(i.hostName)} et convida a un duel en directe (${i.cfg.label})`, act: 'duel' }));
    s.got.filter(x => x.st === 'pending' && x.exp > now).forEach(x => out.push({ live: 1, t: x.t, icon: '📨', text: `${first(x.fromName)} t'ha reptat · ${x.cfg.label}`, act: 'duel' }));
    s.sent.filter(x => x.st === 'done' && !x.seenFrom).forEach(x => { const r = x.okFrom > x.okTo ? 'Has guanyat' : x.okFrom < x.okTo ? 'Has perdut' : 'Empat'; out.push({ live: 1, t: x.tTo || x.t, icon: '🏁', text: `${first(x.toName)} ha jugat el teu repte: ${r} (${x.okFrom}–${x.okTo})`, act: 'duel' }); });
    return out;
  }

  /* ---------- interfície ---------- */
  let lastLive = 0;
  function ding() { try { playSFX('correct'); } catch (e) { /* */ } const b = $('btn-notif'); if (b) { b.classList.remove('animate-shake'); void b.offsetWidth; b.classList.add('animate-shake'); } }
  function count() { return duelItems().length + load('list', []).filter(n => !n.read).length; }
  function render() {
    const b = $('btn-notif'), a = acc(); if (!b) return;
    const on = !!(a && !a.teacher);
    b.classList.toggle('hidden', !on); b.classList.toggle('flex', on);
    if (!on) return;
    const n = count(), badge = $('notif-count');
    badge.textContent = n > 9 ? '9+' : n; badge.classList.toggle('hidden', !n);
    const live = duelItems().length; if (live > lastLive) ding(); lastLive = live;
    if (!$('notif-panel').classList.contains('hidden')) fill();
  }
  function fill() {
    const live = duelItems(), list = load('list', []);
    const row = (n, unread) => `<button type="button" data-nact="${n.act}" class="w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-2xl border ${unread ? 'bg-blue-500/10 border-blue-400/40' : 'bg-white/70 border-white/60'} hover:border-blue-400 transition">
        <span class="text-2xl leading-none mt-0.5">${n.icon}</span><span class="flex-1 min-w-0"><span class="block text-sm font-bold text-slate-200 leading-snug">${E(n.text)}</span><span class="block text-[11px] text-slate-400 mt-0.5">${n.live ? 'Pendent · toca per anar-hi' : ago(n.t)}</span></span>${unread ? '<span class="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1.5 shrink-0"></span>' : ''}</button>`;
    $('notif-list').innerHTML = (live.length ? `<p class="text-[11px] font-bold uppercase tracking-wide text-slate-400 px-1">Duels</p>${live.map(n => row(n, true)).join('')}` : '')
      + (list.length ? `<p class="text-[11px] font-bold uppercase tracking-wide text-slate-400 px-1 ${live.length ? 'pt-2' : ''}">Classificació</p>${list.map(n => row(n, !n.read)).join('')}` : '')
      || `<div class="text-center py-8"><div class="text-5xl mb-2">🔔</div><p class="text-sm font-bold text-slate-300">Cap avís de moment</p><p class="text-xs text-slate-400 mt-1">Aquí sortiran els duels que et facin i els canvis de la classificació.</p></div>`;
  }
  function open() {
    if (!acc()) return;
    playSFX('click');
    $('notif-panel').classList.remove('hidden'); fill();
    checkBoard(false);
    if (window.Duel && Duel.refresh) Duel.refresh();
  }
  function close(markRead) {
    $('notif-panel').classList.add('hidden');
    if (markRead !== false) { const list = load('list', []); if (list.some(n => !n.read)) { list.forEach(n => { n.read = true; }); save('list', list); } }
    render();
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-nact]'); if (!b) return;
    const act = b.dataset.nact; close();
    if (act === 'duel') { if (typeof selModeId !== 'undefined') { selModeId = 'duel'; } if (window.Duel) Duel.open(); }
    else if (act === 'board') { if (typeof boardTab !== 'undefined') boardTab = 'comp'; openBoard(); }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('notif-panel') && !$('notif-panel').classList.contains('hidden')) close(); });

  /* en entrar amb el compte: una consulta de la classificació (si fa més de 10 min de l'última) */
  function onLogin() { render(); checkBoard(false); }
  return { open, close, render, onLogin, check: checkBoard };
})();
