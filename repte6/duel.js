/* El Gran Repte 6è · DUELS
   - En directe: dos alumnes responen les mateixes preguntes alhora (codi de 4 lletres o invitació a un company connectat).
   - Repte: jugues 10 preguntes i reptes un company, que les juga quan pot.
   Guanya qui encerta més (la velocitat no compta). Empat → una pregunta de mort sobtada. */
window.Duel = (function () {
  const $ = id => document.getElementById(id);
  const E = s => escHTML(s == null ? '' : s);
  const N_Q = 10, BONUS = { W: 15, D: 5, L: 0 }, REVEAL_MS = 2600, GONE_MS = 45000, MAX_SENT = 3;
  let view = 'hub', D = null, unsub = null, unsubInv = null, invites = [], CH = { sent: [], got: [] }, mates = [];
  let me = 'H', qStart = 0, tick = null, beat = null, revealed = -1, revealUntil = 0, lastOpSeen = 0, lastOpSeenAt = 0, recorded = false, earned = null;
  let solo = null; // partida d'un repte: { kind:'send'|'answer', chal, qs, a:[], idx, to }

  /* ---------- preguntes: només text i una referència a la imatge (no la imatge sencera) ---------- */
  let revImg = null;
  function imgRef(src) {
    if (!src) return null;
    if (!revImg) { revImg = new Map(); Object.entries(window.RQIMG || {}).forEach(([k, v]) => revImg.set(v, 'p:' + k)); Object.entries(window.FLAGS || {}).forEach(([k, v]) => revImg.set(v, 'f:' + k)); }
    return revImg.get(src) || null;
  }
  const imgOf = r => !r ? null : r.startsWith('p:') ? (window.RQIMG || {})[r.slice(2)] : r.startsWith('f:') ? (window.FLAGS || {})[r.slice(2)] : null;
  const pack = c => ({ q: c.q, o: c.options, a: c.answer, i: c.info || '', c: c.cat, ic: c.icon, l: c.lang || 'ca', r: imgRef(c.img), cr: c.credit || null, lv: c.lvl || 2, fl: c.img && String(c.img).startsWith('data:image/svg') ? 1 : 0 });
  const unpack = p => ({ q: p.q, options: p.o, answer: p.a, info: p.i, cat: p.c, icon: p.ic, lang: p.l, img: imgOf(p.r), credit: p.cr, lvl: p.lv, flag: p.fl });
  function cfgNow() { const L = curLevel(); return { lvl: L.id, lvlName: L.name, time: L.p1Time + 5, src: activeSources().map(s => s.src.id), label: activeSources().map(s => s.src.short || s.src.name).join(' + ') }; }
  function makeQs() { return buildPhase1Questions(N_Q + 1).map(pack); }

  /* ---------- utilitats ---------- */
  const acc = () => window.GR && GR.acc;
  const av = () => game.avatar || '🦊';
  const myName = () => (acc() && acc().name) || game.playerName || 'Jo';
  const first = n => String(n || '').split(' ')[0];
  const score = (qs, a, upto) => a.slice(0, upto).reduce((s, x, i) => s + (qs[i] && x === qs[i].a ? 1 : 0), 0);
  const resOf = (mine, theirs) => mine > theirs ? 'W' : mine < theirs ? 'L' : 'D';
  const RES_TXT = { W: 'Has guanyat!', D: 'Empat!', L: 'Has perdut' }, RES_ICO = { W: '🏆', D: '🤝', L: '💪' };
  function stopTimers() { clearInterval(tick); tick = null; }
  function stopAll() { stopTimers(); clearInterval(beat); beat = null; if (unsub) { try { unsub(); } catch (e) { /* */ } unsub = null; } }
  function show() { switchScreen('screen-duel'); const bb = $('btn-back'); bb.classList.remove('hidden'); bb.classList.add('flex'); }
  function el() { return $('duel-body'); }
  const card = (inner, cls = '') => `<div class="glass-panel rounded-3xl p-4 sm:p-6 ${cls}">${inner}</div>`;
  const btn = (txt, act, cls = 'from-cyan-500 via-blue-500 to-indigo-600 border-indigo-900 text-white', extra = '') => `<button type="button" data-dact="${act}" ${extra} class="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r ${cls} font-display font-black text-base btn-arcade">${txt}</button>`;
  const sbtn = (txt, act, extra = '') => `<button type="button" data-dact="${act}" ${extra} class="px-3 py-2 rounded-xl mj-w border-2 border-slate-200 text-slate-700 text-xs font-bold hover:border-blue-400 shrink-0">${txt}</button>`;
  const head = (title, sub) => `<div class="flex items-center gap-3 mb-4"><span class="text-4xl">⚔️</span><div class="min-w-0"><h2 class="font-display font-black text-2xl text-white leading-tight">${title}</h2>${sub ? `<p class="text-xs text-slate-400">${sub}</p>` : ''}</div></div>`;
  const ago = t => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'ara mateix' : m < 60 ? `fa ${m} min` : m < 1440 ? `fa ${Math.round(m / 60)} h` : `fa ${Math.round(m / 1440)} d`; };

  /* =================== HUB =================== */
  async function open() {
    const a = acc();
    show(); view = 'hub';
    if (!a || !GR.available()) { el().innerHTML = card(head('Duel', '1 contra 1') + `<p class="text-sm text-slate-300 mb-4">Per jugar duels cal entrar amb el compte de l'escola: així el rival et pot trobar i el resultat es guarda.</p>` + btn('Entrar amb el compte', 'login')); return; }
    if (a.noDuels) { el().innerHTML = card(head('Duel', '1 contra 1') + `<p class="text-sm text-slate-300">El teu mestre o mestra ha desactivat els duels per a la teva classe.</p>`); return; }
    GR.presence();
    renderHub(true);
    try { let meD; [CH, mates, meD] = await Promise.all([GR.chalList(), GR.classMates(), GR.me()]); if (meD) { try { localStorage.setItem('egr6_acceptch', meD.acceptCh ? '1' : '0'); } catch (e) { /* */ } } } catch (e) { CH = { sent: [], got: [] }; mates = []; }
    if (view === 'hub') renderHub(false);
    startInvites();
  }
  function renderHub(loading) {
    const typed = ($('duel-code') || {}).value || '', focused = document.activeElement && document.activeElement.id === 'duel-code';
    setTimeout(() => { const i = $('duel-code'); if (i && typed) { i.value = typed; if (focused) i.focus(); } }, 0);
    const a = acc(), c = cfgNow(), now = Date.now();
    const online = mates.filter(m => m.seen && now - m.seen < 3 * 60e3);
    const accepting = mates.filter(m => m.acceptCh);
    const pendGot = CH.got.filter(x => x.st === 'pending' && x.exp > now);
    const doneSent = CH.sent.filter(x => x.st === 'done' && !x.seenFrom);
    const pendSent = CH.sent.filter(x => x.st === 'pending' && x.exp > now);
    const accOn = localStorage.getItem('egr6_acceptch') === '1';
    el().innerHTML = card(head('Duel', `${E(c.label)} · ${E(c.lvlName)} · ${N_Q} preguntes`) +
      `<p class="text-xs text-slate-400 -mt-2 mb-4">Guanya qui encerta més: la velocitat no compta. Si empateu, hi ha una pregunta de mort sobtada.</p>
      ${invites.length ? invites.map(i => `<div class="mb-3 p-3 rounded-2xl border-2 border-blue-400 bg-blue-500/10 flex items-center gap-3"><span class="text-3xl">${E(i.hostAv || '⚔️')}</span><div class="flex-1 min-w-0"><p class="font-display font-black text-white text-sm">${E(first(i.hostName))} et convida a un duel</p><p class="text-[11px] text-slate-400">${E(i.cfg.label)} · ${E(i.cfg.lvlName)}</p></div>${sbtn('Acceptar', 'join', `data-code="${E(i.code)}"`)}</div>`).join('') : ''}
      ${pendGot.map(x => `<div class="mb-3 p-3 rounded-2xl border-2 border-amber-400 bg-amber-400/10 flex items-center gap-3"><span class="text-3xl">🔔</span><div class="flex-1 min-w-0"><p class="font-display font-black text-white text-sm">${E(first(x.fromName))} t'ha reptat</p><p class="text-[11px] text-slate-400">${E(x.cfg.label)} · ${E(x.cfg.lvlName)} · caduca ${new Date(x.exp).toLocaleDateString('ca-ES', { weekday: 'long' })}</p></div>${sbtn('Jugar', 'chplay', `data-id="${E(x.id)}"`)}${sbtn('No', 'chno', `data-id="${E(x.id)}"`)}</div>`).join('')}
      ${doneSent.map(x => { const r = resOf(x.okFrom, x.okTo); return `<div class="mb-3 p-3 rounded-2xl border-2 border-emerald-400 bg-emerald-500/10 flex items-center gap-3"><span class="text-3xl">${RES_ICO[r]}</span><div class="flex-1 min-w-0"><p class="font-display font-black text-white text-sm">${E(first(x.toName))} ha jugat el teu repte</p><p class="text-[11px] text-slate-400">${x.okFrom} – ${x.okTo} · ${RES_TXT[r]}</p></div>${sbtn('Veure', 'chsee', `data-id="${E(x.id)}"`)}</div>`; }).join('')}
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div class="p-4 rounded-2xl bg-white/80 border border-white/60">
          <p class="font-display font-black text-white text-lg">⚡ En directe</p><p class="text-xs text-slate-400 mb-3">Tots dos alhora, cadascú amb el seu dispositiu.</p>
          ${btn('Crear duel', 'create')}
          <div class="flex gap-2 mt-3"><input id="duel-code" maxlength="4" autocapitalize="characters" autocomplete="off" placeholder="CODI" class="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-slate-950 border-2 border-slate-700 focus:border-cyan-400 text-white font-display font-black text-lg tracking-[.3em] text-center uppercase focus:outline-none">${sbtn('Unir-me', 'joincode')}</div>
          <p id="duel-err" class="text-xs text-rose-400 font-bold mt-2"></p>
          ${online.length ? `<p class="text-[11px] font-bold uppercase text-slate-400 mt-3 mb-1">Ara mateix a Duels</p><div class="flex flex-wrap gap-1.5">${online.slice(0, 12).map(m => `<span class="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-400/40 text-[11px] font-bold text-slate-200">🟢 ${E(first(m.name))}</span>`).join('')}</div>` : ''}
        </div>
        <div class="p-4 rounded-2xl bg-white/80 border border-white/60">
          <p class="font-display font-black text-white text-lg">📨 Repte</p><p class="text-xs text-slate-400 mb-3">Tu jugues ara; el company, quan pugui (3 dies).</p>
          ${!a.cls ? '<p class="text-xs text-slate-400">Els reptes són entre companys de classe.</p>' : loading ? '<p class="text-xs text-slate-400">Carregant companys…</p>' :
            accepting.length ? `<div class="space-y-1.5 max-h-56 overflow-y-auto pr-1">${accepting.map(m => { const busy = pendSent.some(x => x.toUid === m.uid); return `<div class="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-950/40 border border-white/10"><span class="flex-1 text-sm font-bold text-slate-200 truncate">${E(m.name)}</span>${busy ? '<span class="text-[11px] text-slate-400">pendent</span>' : sbtn('Reptar', 'chsend', `data-uid="${E(m.uid)}"`)}</div>`; }).join('')}</div>` : '<p class="text-xs text-slate-400">Encara cap company accepta reptes. Digues-los que activin l\'interruptor de sota!</p>'}
          <p class="text-[11px] text-slate-400 mt-2">${pendSent.length}/${MAX_SENT} reptes enviats pendents</p>
        </div>
      </div>
      <label class="mt-4 flex items-center gap-3 p-3 rounded-2xl bg-white/70 border border-white/60 cursor-pointer"><input id="duel-accept" type="checkbox" ${accOn ? 'checked' : ''} class="w-5 h-5 accent-blue-600"><span class="text-sm font-bold text-slate-200">Accepto reptes dels companys</span><span class="text-[11px] text-slate-400 ml-auto hidden sm:inline">Sense xat: només preguntes.</span></label>
      ${CH.sent.length + CH.got.length ? `<details class="mt-3"><summary class="text-xs font-bold text-slate-400 cursor-pointer">Historial de reptes</summary><div class="space-y-1 mt-2">${CH.sent.concat(CH.got).sort((x, y) => y.t - x.t).slice(0, 15).map(x => { const mine = x.fromUid === a.uid, who = first(mine ? x.toName : x.fromName); const st = x.st === 'done' ? (() => { const r = mine ? resOf(x.okFrom, x.okTo) : resOf(x.okTo, x.okFrom); return `${RES_ICO[r]} ${mine ? x.okFrom + '–' + x.okTo : x.okTo + '–' + x.okFrom}`; })() : x.st === 'rejected' ? 'rebutjat' : x.exp < Date.now() ? 'caducat' : 'pendent'; return `<div class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/60 text-xs"><span>${mine ? '➡️' : '⬅️'}</span><span class="flex-1 text-slate-200 truncate">${mine ? 'A' : 'De'} ${E(who)} · ${E(x.cfg.label)}</span><span class="text-slate-400">${ago(x.t)}</span><span class="font-bold text-slate-200">${st}</span>${x.st === 'done' ? sbtn('Veure', 'chsee', `data-id="${E(x.id)}"`) : ''}</div>`; }).join('')}</div></details>` : ''}`);
  }
  function err(m) { const e = $('duel-err'); if (e) e.textContent = m || ''; }

  /* =================== EN DIRECTE =================== */
  async function create(invUid, invName) {
    try {
      const qs = makeQs(), cfg = cfgNow();
      const code = await GR.duelCreate({ qs, n: N_Q, cfg, av: av(), invUid: invUid || null, invName: invName || '' });
      me = 'H'; watch(code);
    } catch (e) { err(e.message || 'No s\'ha pogut crear el duel.'); }
  }
  async function join(code) {
    code = String(code || '').trim().toUpperCase();
    if (code.length !== 4) { err('El codi té 4 lletres.'); return; }
    try { await GR.duelJoin(code, av()); me = 'G'; watch(code); playSFX('correct'); }
    catch (e) { err(e.message || 'No t\'hi has pogut unir.'); playSFX('wrong'); }
  }
  async function watch(code) {
    stopAll(); view = 'live'; recorded = false; earned = null; revealed = -1; revealUntil = 0; qStart = 0; lastOpSeen = 0; lastOpSeenAt = Date.now(); D = null;
    el().innerHTML = card('<p class="text-center text-slate-400 py-8">Connectant…</p>');
    unsub = await GR.duelWatch(code, d => { if (!d) return; const was = D; D = d; if (was && was.st === 'lobby' && d.st === 'play') { playSFX('correct'); qStart = 0; } renderLive(); });
    beat = setInterval(() => { if (D && (D.st === 'play' || D.st === 'lobby')) GR.duelSet(D.code, { [me === 'H' ? 'seenH' : 'seenG']: Date.now() }).catch(() => {}); }, 15000);
    if (me === 'H') loadOnline();
  }
  async function loadOnline() { try { mates = await GR.classMates(); } catch (e) { mates = []; } if (D && D.st === 'lobby') renderLive(); }
  const myA = () => (D ? (me === 'H' ? D.aH : D.aG) : []) || [];
  const opA = () => (D ? (me === 'H' ? D.aG : D.aH) : []) || [];
  const opName = () => D ? (me === 'H' ? D.guestName : D.hostName) : '';
  const opAv = () => D ? (me === 'H' ? D.guestAv : D.hostAv) || '🙂' : '🙂';
  function totalQ() { const a = myA(), b = opA(); if (a.length >= D.n && b.length >= D.n && score(D.qs, a, D.n) === score(D.qs, b, D.n)) return D.n + 1; return D.n; }

  function renderLive() {
    if (!D || view !== 'live') return;
    if (D.st === 'lobby') return renderLobby();
    // senyal de vida del rival (amb el rellotge d'aquest dispositiu, per si els rellotges no coincideixen)
    const os = me === 'H' ? D.seenG : D.seenH; if (os !== lastOpSeen) { lastOpSeen = os; lastOpSeenAt = Date.now(); }
    const a = myA(), b = opA(), N = totalQ();
    const k = a.length, j = b.length;
    if (D.st === 'gone' || (D.st === 'done' && (k < D.n || j < D.n))) return renderLiveEnd();
    // revelació: tots dos han respost la pregunta k-1
    if (k === j && k > 0 && revealed < k - 1) { revealed = k - 1; revealUntil = Date.now() + REVEAL_MS; const ok = a[k - 1] === D.qs[k - 1].a; playSFX(ok ? 'correct' : 'wrong'); }
    if (k === j && k > 0 && Date.now() < revealUntil) { renderQuestion(k - 1, 'reveal'); stopTimers(); setTimeout(renderLive, revealUntil - Date.now() + 30); return; }
    if (k >= N && j >= N) { if (D.st !== 'done') GR.duelSet(D.code, { st: 'done' }).catch(() => {}); return renderLiveEnd(); }
    if (k >= N) return renderQuestion(k - 1, 'wait');
    if (k > j) return renderQuestion(k - 1, 'wait');
    renderQuestion(k, 'ask');
  }
  function renderLobby() {
    const isHost = me === 'H', now = Date.now();
    const online = mates.filter(m => m.seen && now - m.seen < 3 * 60e3);
    el().innerHTML = card(head('Duel en directe', `${E(D.cfg.label)} · ${E(D.cfg.lvlName)} · ${D.n} preguntes`) + (isHost ? `
      <div class="text-center p-5 rounded-3xl mj-w border-2 border-blue-200 mb-4"><p class="text-xs font-bold uppercase tracking-widest text-slate-400">Codi del duel</p><p class="font-display font-black text-6xl tracking-[.25em] text-white leading-none mt-1">${E(D.code)}</p><p class="text-xs text-slate-400 mt-2">El rival l'escriu a «Duel → Unir-me».</p></div>
      ${D.invUid ? `<p class="text-center text-sm font-bold text-blue-300 mb-3">📨 Has convidat ${E(first(D.invName))}. Esperant que accepti…</p>` : ''}
      ${online.length ? `<p class="text-[11px] font-bold uppercase text-slate-400 mb-1.5">O convida algú que és ara a Duels</p><div class="space-y-1.5 mb-3">${online.map(m => `<div class="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/70 border border-white/60"><span class="text-emerald-500">●</span><span class="flex-1 text-sm font-bold text-slate-200">${E(m.name)}</span>${D.invUid === m.uid ? '<span class="text-[11px] text-blue-300 font-bold">convidat</span>' : sbtn('Convidar', 'invite', `data-uid="${E(m.uid)}" data-name="${E(m.name)}"`)}</div>`).join('')}</div>` : '<p class="text-xs text-slate-400 text-center mb-3">Ara mateix no hi ha cap company a Duels: digues-li el codi.</p>'}
      <div class="flex items-center justify-center gap-2 text-slate-400 text-sm"><span class="animate-pulse">⏳</span> Esperant rival…</div>` : `<p class="text-center text-slate-400 py-6">Entrant al duel…</p>`) + `<div class="mt-4">${btn('Cancel·lar', 'cancel', 'from-slate-200 to-slate-300 border-slate-400 text-slate-700')}</div>`);
  }
  function hud(idx, N) {
    const a = myA(), b = opA(), upto = Math.min(a.length, b.length, N);
    const sm = score(D.qs, a, upto), so = score(D.qs, b, upto);
    const opDone = b.length > idx;
    return `<div class="glass-panel rounded-2xl p-3 flex items-center gap-3">
      <div class="flex items-center gap-2 flex-1 min-w-0"><span class="text-3xl">${E(av())}</span><div class="min-w-0"><p class="font-display font-black text-white text-sm truncate">${E(first(myName()))}</p><p class="text-[11px] text-slate-400">Tu</p></div></div>
      <div class="text-center"><p class="font-display font-black text-3xl text-white tabular-nums leading-none">${sm} – ${so}</p><p class="text-[10px] font-bold uppercase text-slate-400 mt-1">${idx >= D.n ? '⚡ Mort sobtada' : `Pregunta ${idx + 1}/${D.n}`}</p></div>
      <div class="flex items-center gap-2 flex-1 min-w-0 flex-row-reverse text-right"><span class="text-3xl">${E(opAv())}</span><div class="min-w-0"><p class="font-display font-black text-white text-sm truncate">${E(first(opName()))}</p><p class="text-[11px] ${opDone ? 'text-emerald-400 font-bold' : 'text-slate-400'}">${opDone ? '✓ ha respost' : 'pensant…'}</p></div></div>
    </div>`;
  }
  function qCard(c, idx, mode, mine, theirs, time, opLabel) {
    const L = ['A', 'B', 'C', 'D'];
    const opts = c.options.map((o, i) => {
      let cls = '', tag = '';
      if (mode === 'reveal') { if (i === c.answer) cls = 'd-ok'; else if (i === mine || i === theirs) cls = 'd-ko'; else cls = 'd-dim'; }
      else if (mode === 'wait' && i === mine) cls = 'd-sel';
      const who = [];
      if ((mode === 'reveal' || mode === 'wait') && i === mine) who.push(`<span class="d-chip">${E(av())} tu</span>`);
      if (mode === 'reveal' && theirs != null && i === theirs) who.push(`<span class="d-chip">${E(opAv())} ${E(opLabel)}</span>`);
      return `<button type="button" ${mode === 'ask' ? `data-dans="${i}"` : 'disabled'} class="d-opt ${cls}"><span class="d-let">${L[i]}</span><span class="flex-1 text-left">${E(o)}</span>${who.join('')}</button>`;
    }).join('');
    const note = mode === 'wait' ? `<p class="text-center text-sm font-bold text-blue-300 mt-3"><span class="animate-pulse">⏳</span> Esperant ${E(opLabel)}…</p>`
      : mode === 'reveal' ? `<p class="text-center text-sm mt-3 ${mine === c.answer ? 'text-emerald-400' : 'text-rose-400'} font-bold">${mine === c.answer ? '✅ Correcte!' : mine === -1 ? '⏰ Temps esgotat' : '❌ Incorrecte'} <span class="text-slate-400 font-normal">· ${E(c.info || '')}</span></p>` : '';
    return `<div class="glass-panel rounded-3xl p-4 sm:p-6">
      <div class="flex items-center justify-between gap-3 mb-3"><span class="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 font-display font-extrabold text-xs">${E(c.icon || '')} ${E(c.cat || '')}</span>${mode === 'ask' && time ? `<span id="d-time" class="font-display font-black text-xl text-white tabular-nums">${time}s</span>` : ''}</div>
      ${mode === 'ask' && time ? `<div class="h-2 rounded-full bg-slate-800 overflow-hidden mb-4"><div id="d-bar" class="h-full rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500" style="width:100%"></div></div>` : ''}
      ${c.img ? `<div class="flex justify-center mb-3"><img src="${c.img}" alt="" class="${c.flag ? 'h-24 sm:h-28 rounded-lg border border-slate-200' : 'max-h-44 rounded-2xl object-cover'}"></div>${c.credit ? `<p class="text-center text-[10px] text-slate-400 -mt-2 mb-2">Foto: ${E(c.credit)}</p>` : ''}` : ''}
      <h3 class="font-display font-black text-xl sm:text-2xl text-white leading-snug mb-4">${E(c.q)}</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">${opts}</div>${note}</div>`;
  }
  function renderQuestion(idx, mode) {
    const c = unpack(D.qs[idx]), N = totalQ(), a = myA(), b = opA();
    if (mode === 'ask') {
      if (qStart === 0 || qStart.idx !== idx) qStart = { idx, t: Date.now() };
      stopTimers();
      const T = D.cfg.time || 20;
      const upd = () => { const left = Math.max(0, T - (Date.now() - qStart.t) / 1000); const s = $('d-time'), bar = $('d-bar'); if (s) s.textContent = Math.ceil(left) + 's'; if (bar) bar.style.width = (100 * left / T) + '%'; if (left <= 0) { stopTimers(); answer(-1); } };
      el().innerHTML = hud(idx, N) + '<div class="h-3"></div>' + qCard(c, idx, 'ask', null, null, T, first(opName())) + quitRow();
      upd(); tick = setInterval(upd, 250);
      if (c.lang && typeof speak === 'function') speak(c.q, c.lang);
      return;
    }
    stopTimers();
    el().innerHTML = hud(idx, N) + '<div class="h-3"></div>' + qCard(c, idx, mode, a[idx], mode === 'reveal' ? b[idx] : null, 0, first(opName())) + quitRow();
    if (mode === 'wait') { tick = setInterval(() => { if (Date.now() - lastOpSeenAt > GONE_MS) { stopTimers(); GR.duelSet(D.code, { st: 'gone', goneUid: me === 'H' ? D.guestUid : D.hostUid }).catch(() => {}); } }, 3000); }
  }
  const quitRow = () => `<div class="mt-3 text-center"><button type="button" data-dact="quit" class="text-xs text-slate-400 underline underline-offset-4">Abandonar el duel</button></div>`;
  function answer(i) {
    if (!D || D.st !== 'play') return;
    const a = myA().slice(); const idx = a.length; const N = totalQ(); if (idx >= N) return;
    a.push(i); playSFX('click');
    if (me === 'H') D.aH = a; else D.aG = a; // resposta immediata a la pantalla
    renderLive();
    GR.duelSet(D.code, { [me === 'H' ? 'aH' : 'aG']: a, [me === 'H' ? 'seenH' : 'seenG']: Date.now() }).catch(() => {});
  }
  async function renderLiveEnd() {
    stopTimers(); clearInterval(beat); beat = null;
    if (unsub) { try { unsub(); } catch (e) { /* */ } unsub = null; }
    if (D.st !== 'gone') D.st = 'done';
    const a = myA(), b = opA(), N = Math.min(Math.max(a.length, b.length), D.n + 1);
    const gone = D.st === 'gone', iLeft = gone && D.goneUid === acc().uid, opLeft = gone && !iLeft;
    const upto = Math.min(a.length, b.length);
    const sm = score(D.qs, a, gone ? upto : a.length), so = score(D.qs, b, gone ? upto : b.length);
    const res = opLeft ? 'W' : iLeft ? 'L' : resOf(sm, so);
    if (!recorded) {
      recorded = true;
      const qs = D.qs.slice(0, a.length).map(unpack);
      const st = statsFrom(qs, a, 'duel', D.cfg, res, opName());
      try { earned = await GR.record(st); if (window.Notif) Notif.check(true); } catch (e) { earned = null; }
      if (typeof awardBadges === 'function') { try { awardBadges({ ...st, gold: null, rosco: null }); } catch (e) { /* */ } }
    }
    endScreen({ title: opLeft ? `${first(opName())} ha abandonat` : RES_TXT[res], res, sm, so, myN: first(myName()), opN: first(opName()), opAvS: opAv(), qs: D.qs.map(unpack), a, b, n: Math.max(a.length, b.length), again: 'rematch', note: opLeft ? 'Guanyes per abandonament.' : (D.n < Math.max(a.length, b.length) ? 'Desempat a la mort sobtada.' : '') });
  }
  function statsFrom(qs, a, mode, cfg, res, vs) {
    const ok = qs.reduce((s, c, i) => s + (a[i] === c.answer ? 1 : 0), 0);
    const per = {}; qs.forEach((c, i) => { const k = c.icon + ' ' + c.cat; per[k] = per[k] || [k, 0, 0]; per[k][2]++; if (a[i] === c.answer) per[k][1]++; });
    return { mode, lvl: cfg.lvl, src: cfg.src, ok, total: qs.length, rosco: null, gold: null, streak: 0, perTopic: Object.values(per),
      wrongQ: qs.filter((c, i) => a[i] !== c.answer).map(c => c.q),
      answers: qs.map((c, i) => ({ q: String(c.q).slice(0, 160), cat: c.cat, a: a[i] == null ? null : a[i] < 0 ? '' : String(c.options[a[i]]).slice(0, 80), ok: String(c.options[c.answer]).slice(0, 80), c: a[i] === c.answer })),
      res, bonus: res ? BONUS[res] : 0, vs };
  }
  function endScreen(o) {
    const row = (arr, n) => Array.from({ length: n }, (_, i) => `<span class="w-5 h-5 sm:w-6 sm:h-6 rounded-md ${arr[i] == null ? 'bg-slate-700' : arr[i] === o.qs[i].answer ? 'bg-emerald-500' : 'bg-rose-500'}"></span>`).join('');
    const ptsLine = o.bonusOnly ? (earned ? `+${earned} punts per ${o.res === 'W' ? 'la victòria' : 'l\'empat'}` : '') : o.res ? (earned == null ? (acc() && !acc().teacher ? 'Guardant…' : '') : earned === 0 && o.res ? 'Avui ja has jugat 5 duels: aquest no suma punts.' : `+${earned} punts${BONUS[o.res] ? ` (inclou +${BONUS[o.res]} per ${o.res === 'W' ? 'la victòria' : 'l\'empat'})` : ''}`) : '';
    const review = o.qs.slice(0, o.n).map((c, i) => `<div class="flex items-start gap-2 px-3 py-2 rounded-xl ${o.a[i] === c.answer ? 'bg-emerald-500/10' : 'bg-rose-500/10'} text-xs"><span class="shrink-0">${o.a[i] === c.answer ? '✅' : '❌'}</span><div class="flex-1 min-w-0"><p class="text-slate-200 leading-snug">${i >= N_Q ? '⚡ ' : ''}${E(c.q)}</p><p class="text-[11px] text-slate-400">Correcta: <b class="text-emerald-500">${E(c.options[c.answer])}</b>${o.a[i] !== c.answer ? ` · tu: <b class="text-rose-400">${o.a[i] == null ? '–' : o.a[i] < 0 ? 'sense resposta' : E(c.options[o.a[i]])}</b>` : ''}${o.b && o.b[i] != null ? ` · ${E(o.opN)}: ${o.b[i] === c.answer ? '✅' : '❌'}` : ''}</p></div></div>`).join('');
    el().innerHTML = card(`<div class="text-center"><div class="text-6xl mb-1">${RES_ICO[o.res] || '⚔️'}</div><h2 class="font-display font-black text-3xl text-white">${E(o.title)}</h2>${o.note ? `<p class="text-sm text-slate-400">${E(o.note)}</p>` : ''}<p class="text-sm font-bold text-amber-500 mt-1">${E(ptsLine)}</p></div>
      <div class="grid grid-cols-2 gap-3 my-5">
        <div class="p-3 rounded-2xl text-center ${o.res === 'W' ? 'bg-amber-400/20 border-2 border-amber-400' : 'bg-white/80 border border-white/60'}"><div class="text-3xl">${E(av())}</div><p class="font-display font-bold text-white text-sm">${E(o.myN)}</p><p class="font-display font-black text-4xl text-white">${o.sm}</p></div>
        <div class="p-3 rounded-2xl text-center ${o.res === 'L' ? 'bg-amber-400/20 border-2 border-amber-400' : 'bg-white/80 border border-white/60'}"><div class="text-3xl">${E(o.opAvS || '🙂')}</div><p class="font-display font-bold text-white text-sm">${E(o.opN)}</p><p class="font-display font-black text-4xl text-white">${o.so == null ? '?' : o.so}</p></div>
      </div>
      <div class="flex flex-col items-center gap-1.5 mb-5"><div class="flex gap-1 flex-wrap justify-center">${row(o.a, o.n)}</div>${o.b ? `<div class="flex gap-1 flex-wrap justify-center">${row(o.b, o.n)}</div>` : ''}<p class="text-[10px] text-slate-400">a dalt tu${o.b ? ', a baix ' + E(o.opN) : ''}</p></div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">${o.again ? btn(o.again === 'rematch' ? '🔁 Revenja' : '📨 Repte a un altre', o.again) : ''}${btn('⚔️ Tornar als duels', 'hub', 'from-slate-200 to-slate-300 border-slate-400 text-slate-700')}</div>
      <details class="mt-4"><summary class="text-sm font-bold text-slate-300 cursor-pointer">Veure les respostes</summary><div class="space-y-1.5 mt-2">${review}</div></details>`);
    if (o.res === 'W' && typeof launchConfetti === 'function') { try { launchConfetti(); } catch (e) { /* */ } }
  }

  /* =================== REPTES =================== */
  async function chalSend(uid) {
    const m = mates.find(x => x.uid === uid); if (!m) return;
    const pend = CH.sent.filter(x => x.st === 'pending' && x.exp > Date.now());
    if (pend.length >= MAX_SENT) { alertMsg(`Ja tens ${MAX_SENT} reptes enviats sense respondre. Espera que els juguin o que caduquin.`); return; }
    const qs = buildPhase1Questions(N_Q).map(pack);
    solo = { kind: 'send', qs, a: [], to: m, cfg: cfgNow() };
    playSolo();
  }
  function chalAnswer(id) { const x = CH.got.find(c => c.id === id); if (!x) return; solo = { kind: 'answer', qs: x.qs, a: [], chal: x, cfg: x.cfg }; playSolo(); }
  function playSolo() { stopAll(); view = 'solo'; qStart = 0; recorded = false; earned = null; soloAsk(); }
  function soloHud(idx) {
    const opN = solo.kind === 'send' ? first(solo.to.name) : first(solo.chal.fromName);
    const sm = score(solo.qs, solo.a, solo.a.length);
    return `<div class="glass-panel rounded-2xl p-3 flex items-center gap-3"><div class="flex items-center gap-2 flex-1 min-w-0"><span class="text-3xl">${E(av())}</span><p class="font-display font-black text-white text-sm truncate">${E(first(myName()))}</p></div>
      <div class="text-center"><p class="font-display font-black text-3xl text-white tabular-nums leading-none">${sm} – ?</p><p class="text-[10px] font-bold uppercase text-slate-400 mt-1">Repte · ${idx + 1}/${solo.qs.length}</p></div>
      <div class="flex items-center gap-2 flex-1 min-w-0 flex-row-reverse text-right"><span class="text-3xl">📨</span><p class="font-display font-black text-white text-sm truncate">${E(opN)}</p></div></div>`;
  }
  function soloAsk() {
    const idx = solo.a.length;
    if (idx >= solo.qs.length) return soloEnd();
    const c = unpack(solo.qs[idx]), T = solo.cfg.time || 20;
    qStart = { idx, t: Date.now() };
    const opN = solo.kind === 'send' ? first(solo.to.name) : first(solo.chal.fromName);
    el().innerHTML = soloHud(idx) + '<div class="h-3"></div>' + qCard(c, idx, 'ask', null, null, T, opN) + quitRow();
    stopTimers();
    const upd = () => { const left = Math.max(0, T - (Date.now() - qStart.t) / 1000); const s = $('d-time'), bar = $('d-bar'); if (s) s.textContent = Math.ceil(left) + 's'; if (bar) bar.style.width = (100 * left / T) + '%'; if (left <= 0) { stopTimers(); soloAnswer(-1); } };
    upd(); tick = setInterval(upd, 250);
  }
  function soloAnswer(i) {
    stopTimers(); const idx = solo.a.length; solo.a.push(i);
    const c = unpack(solo.qs[idx]); const ok = i === c.answer; playSFX(ok ? 'correct' : 'wrong');
    const opN = solo.kind === 'send' ? first(solo.to.name) : first(solo.chal.fromName);
    el().innerHTML = soloHud(idx) + '<div class="h-3"></div>' + qCard(c, idx, 'reveal', i, null, 0, opN) + quitRow();
    setTimeout(() => { if (view === 'solo') soloAsk(); }, 2000);
  }
  async function soloEnd() {
    const qs = solo.qs.map(unpack), sm = score(solo.qs, solo.a, solo.a.length);
    if (solo.kind === 'send') {
      el().innerHTML = card('<p class="text-center text-slate-400 py-8">Enviant el repte…</p>');
      try {
        await GR.chalCreate({ toUid: solo.to.uid, toName: solo.to.name, fromAv: av(), qs: solo.qs, cfg: solo.cfg, aFrom: solo.a, okFrom: sm });
        if (!recorded) { recorded = true; try { earned = await GR.record(statsFrom(qs, solo.a, 'repte', solo.cfg, null, solo.to.name)); } catch (e) { earned = null; } }
        el().innerHTML = card(`<div class="text-center"><div class="text-6xl mb-2">📨</div><h2 class="font-display font-black text-3xl text-white">Repte enviat!</h2><p class="text-sm text-slate-300 mt-1">Has fet <b>${sm} de ${qs.length}</b>. Quan ${E(first(solo.to.name))} el jugui, veuràs qui ha guanyat a «Duel».</p>${earned != null ? `<p class="text-sm font-bold text-amber-500 mt-1">+${earned} punts per la partida</p>` : ''}</div><div class="mt-5">${btn('⚔️ Tornar als duels', 'hub')}</div>`);
        playSFX('correct');
      } catch (e) { el().innerHTML = card(`<p class="text-center text-rose-400 font-bold py-6">No s'ha pogut enviar el repte (${E(e.message || e)}).</p>${btn('Tornar', 'hub')}`); }
      return;
    }
    const x = solo.chal, so = x.okFrom, res = resOf(sm, so);
    try { await GR.chalSet(x.id, { aTo: solo.a, okTo: sm, st: 'done', tTo: Date.now() }); } catch (e) { /* */ }
    if (!recorded) { recorded = true; try { earned = await GR.record(statsFrom(qs, solo.a, 'repte', x.cfg, res, x.fromName)); } catch (e) { earned = null; } }
    endScreen({ title: RES_TXT[res], res, sm, so, myN: first(myName()), opN: first(x.fromName), opAvS: x.fromAv, qs, a: solo.a, b: x.aFrom, n: qs.length, again: null });
  }
  async function chalSee(id) {
    const x = CH.sent.find(c => c.id === id) || CH.got.find(c => c.id === id); if (!x) return;
    const mine = x.fromUid === acc().uid, qs = x.qs.map(unpack);
    const sm = mine ? x.okFrom : x.okTo, so = mine ? x.okTo : x.okFrom, res = resOf(sm, so);
    earned = null; view = 'see';
    if (mine && !x.seenFrom) { x.seenFrom = true; try { await GR.chalSet(x.id, { seenFrom: true }); earned = await GR.duelBonus(res, BONUS[res]); } catch (e) { /* */ } badge(); }
    endScreen({ title: RES_TXT[res], res, sm, so, myN: first(myName()), opN: first(mine ? x.toName : x.fromName), opAvS: mine ? '🙂' : x.fromAv, qs, a: mine ? x.aFrom : x.aTo, b: mine ? x.aTo : x.aFrom, n: qs.length, again: null, bonusOnly: true });
  }
  function alertMsg(m) { const e = $('duel-err'); if (e) e.textContent = m; else alert(m); }

  /* =================== invitacions i avisos =================== */
  let unsubCh = null, starting = false;
  const hubVisible = () => view === 'hub' && $('screen-duel') && !$('screen-duel').classList.contains('hidden');
  async function startInvites() {
    if (starting || unsubInv || !acc() || acc().teacher || !GR.available()) return;
    starting = true;
    try {
      unsubInv = await GR.watchInvites(list => { const had = invites.length; invites = list; if (list.length > had) playSFX('correct'); if (hubVisible()) renderHub(false); badge(); });
      unsubCh = await GR.watchChal(c => { CH = c; if (hubVisible()) renderHub(false); badge(); });
    } catch (e) { /* */ }
    starting = false;
  }
  function badge() {
    if (window.Notif) Notif.render();
    const b = $('duel-badge'); if (!b) return;
    const now = Date.now();
    const n = invites.length + CH.got.filter(x => x.st === 'pending' && x.exp > now).length + CH.sent.filter(x => x.st === 'done' && !x.seenFrom).length;
    b.textContent = n; b.classList.toggle('hidden', !n);
  }
  async function refresh() { if (!acc() || acc().teacher || !GR.available()) return; await startInvites(); if (!unsubCh) { try { CH = await GR.chalList(); } catch (e) { /* */ } } badge(); }
  function leave() {
    if (view === 'live' && D && (D.st === 'play' || D.st === 'lobby')) GR.duelSet(D.code, D.st === 'lobby' ? { st: 'done' } : { st: 'gone', goneUid: acc().uid }).catch(() => {});
    stopAll(); view = 'hub'; solo = null;
  }

  /* =================== clics =================== */
  document.addEventListener('click', e => {
    if (!$('screen-duel') || $('screen-duel').classList.contains('hidden')) return;
    const o = e.target.closest('[data-dans]'); if (o) { const i = +o.dataset.dans; if (view === 'live') answer(i); else if (view === 'solo') soloAnswer(i); return; }
    const b = e.target.closest('[data-dact]'); if (!b) return;
    const act = b.dataset.dact; playSFX('click');
    if (act === 'login') { leave(); showLanding(); }
    else if (act === 'create') create();
    else if (act === 'joincode') join(($('duel-code') || {}).value);
    else if (act === 'join') join(b.dataset.code);
    else if (act === 'invite') GR.duelSet(D.code, { invUid: b.dataset.uid, invName: b.dataset.name }).catch(() => {});
    else if (act === 'cancel') { leave(); open(); }
    else if (act === 'quit') { if (confirm('Segur que vols abandonar? Perdràs el duel.')) { if (view === 'live') { GR.duelSet(D.code, { st: 'gone', goneUid: acc().uid }).catch(() => {}); } else { stopAll(); open(); } } }
    else if (act === 'hub') { leave(); open(); }
    else if (act === 'rematch') { const op = me === 'H' ? { uid: D.guestUid, name: D.guestName } : { uid: D.hostUid, name: D.hostName }; leave(); create(op.uid, op.name); }
    else if (act === 'chsend') chalSend(b.dataset.uid);
    else if (act === 'chplay') chalAnswer(b.dataset.id);
    else if (act === 'chno') { GR.chalSet(b.dataset.id, { st: 'rejected', tTo: Date.now() }).then(open).catch(() => {}); }
    else if (act === 'chsee') chalSee(b.dataset.id);
  });
  document.addEventListener('change', e => { if (e.target && e.target.id === 'duel-accept') { const on = e.target.checked; try { localStorage.setItem('egr6_acceptch', on ? '1' : '0'); } catch (x) { /* */ } GR.setAcceptCh(on); } });
  document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target && e.target.id === 'duel-code') join(e.target.value); });
  /* «connectat»: només mentre ets a la pantalla de duels (així no es desperten les escoltes de tota la classe) */
  setInterval(() => { if (document.visibilityState === 'visible' && acc() && !acc().teacher && GR.available() && $('screen-duel') && !$('screen-duel').classList.contains('hidden') && (view === 'hub' || (view === 'live' && D && D.st === 'lobby'))) GR.presence(); }, 60000);

  return { open, leave, refresh, badge, state: () => ({ invites, got: CH.got, sent: CH.sent }), get view() { return view; }, _pack: pack, _unpack: unpack };
})();
