/* El Gran Repte 6è · MINIJOCS
   Sis jocs curts que fan servir l'assignatura, les unitats i el nivell triats a la portada.
   Puntuen només els encerts (mai la velocitat). Vertader o fals es corregeix per l'atzar (encertar a l'atzar no puntua). */
window.Mini = (function () {
  const $ = id => document.getElementById(id);
  const E = s => escHTML(s == null ? '' : s);
  const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const sh = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const li = () => Math.max(0, ['facil', 'normal', 'dificil'].indexOf(curLevel().id));
  const L3 = (a, b, c) => [a, b, c][li()];
  const nf = x => String(Math.round(x * 1000) / 1000).replace('.', ',');

  /* ---------- textos segons la llengua del contingut (la interfície general sempre en català) ---------- */
  const TX = {
    ca: { t: 'Vertader', f: 'Fals', prop: 'Resposta proposada', check: 'Comprova', next: 'Següent', ok: 'Correcte!', ko: 'No és correcte', was: 'Era', clue: 'Pista', lives: 'Vides', ord: 'Toca els elements en l\'ordre correcte', cls: 'Toca una paraula i després la seva caixa', mem: 'Gira dues cartes i troba les parelles', col: 'Toca un element de cada columna per unir-los', hang: 'Endevina la paraula lletra a lletra', scr: 'Toca les lletres en l\'ordre correcte', alpha: 'Ordena alfabèticament', small: 'Ordena de més petit a més gran', sent: 'Ordena les paraules per formar la frase', tries: 'Intents', clear: 'Esborra', right: 'L\'ordre correcte' },
    es: { t: 'Verdadero', f: 'Falso', prop: 'Respuesta propuesta', check: 'Comprueba', next: 'Siguiente', ok: '¡Correcto!', ko: 'No es correcto', was: 'Era', clue: 'Pista', lives: 'Vidas', ord: 'Toca los elementos en el orden correcto', cls: 'Toca una palabra y después su caja', mem: 'Gira dos cartas y encuentra las parejas', col: 'Toca un elemento de cada columna para unirlos', hang: 'Adivina la palabra letra a letra', scr: 'Toca las letras en el orden correcto', alpha: 'Ordena alfabéticamente', small: 'Ordena de menor a mayor', sent: 'Ordena las palabras para formar la frase', tries: 'Intentos', clear: 'Borrar', right: 'El orden correcto' },
    en: { t: 'True', f: 'False', prop: 'Suggested answer', check: 'Check', next: 'Next', ok: 'Correct!', ko: 'Not quite', was: 'It was', clue: 'Clue', lives: 'Lives', ord: 'Tap the items in the right order', cls: 'Tap a word, then its box', mem: 'Flip two cards and find the pairs', col: 'Tap one item in each column to match them', hang: 'Guess the word letter by letter', scr: 'Tap the letters in the right order', alpha: 'Put them in alphabetical order', small: 'Order from smallest to biggest', sent: 'Put the words in order to make the sentence', tries: 'Tries', clear: 'Clear', right: 'The right order' }
  };
  const T = (lang, k) => (TX[lang] || TX.ca)[k];
  const LANG_OF = { medi: 'ca', ca: 'ca', ma: 'ca', cap: 'ca', es: 'es', en: 'en', irr: 'en' };
  const LBL = { medi: '🌿 Medi', ca: '📚 Català', es: '📖 Castellano', ma: '🧮 Mates', en: '🇬🇧 English', irr: '🇬🇧 English', cap: '🌍 Món', flag: '🏳️ Banderes', world: '🌍 World', gram: '🇬🇧 English', conj: '📝 Conjugació', mental: '🧮 Mates' };

  /* ---------- selecció actual ---------- */
  const sel = () => activeSources();
  const T_OF = id => { const s = sel().find(x => x.src.id === id); return s ? s.t : null; };
  const anyT = (id, keys) => { const t = T_OF(id); return !!t && keys.some(k => t.has(k)); };
  const has = id => !!T_OF(id);
  const contTopics = () => { const out = new Set(); ['flag', 'cap', 'world'].forEach(id => { const t = T_OF(id); if (t) t.forEach(k => out.add(k)); }); const en = T_OF('en'); if (en && en.has('en-world')) ['fl-eu', 'fl-am', 'fl-af', 'fl-as', 'fl-oc'].forEach(k => out.add(k)); return out; };
  const countries = () => { const ct = contTopics(); return (window.COUNTRIES || []).filter(c => ct.has('fl-' + c[3])); };
  const CONT_CA = { eu: 'Europa', as: 'Àsia', af: 'Àfrica', am: 'Amèrica', oc: 'Oceania' }, CONT_EN = { eu: 'Europe', as: 'Asia', af: 'Africa', am: 'America', oc: 'Oceania' };

  /* =================== CONTINGUT PER A CADA JOC =================== */
  /* -- paraules del Rosco de les assignatures triades -- */
  function roscoWords(filter) {
    const keys = new Set(); sel().forEach(({ src }) => (src.rosco || []).forEach(k => keys.add(k)));
    const L = curLevel(), lvOf = r => (window.ROSCO_LVL || {})[r[0] + '|' + r[5]] || 2;
    return (window.ROSCO_BANK || []).filter(r => keys.has(r[2]) && filter(r[5])).map(r => ({ w: r[5], clue: r[3], lang: LANG_OF[r[2]] || 'ca', lbl: LBL[r[2]] || r[2], k: Math.random() * ((L.w[lvOf(r)] || 0) + 0.15) })).sort((a, b) => b.k - a.k);
  }
  const letters = w => [...w].filter(ch => /\p{L}/u.test(ch));
  const okHang = w => !/\d/.test(w) && letters(w).length >= 3 && w.length <= 18;
  const okScr = w => /^\p{L}+$/u.test(w) && w.length >= 4 && w.length <= 11;

  /* -- parelles -- */
  function pairSets() {
    const S = [];
    const add = (title, lang, lbl, pairs, opt = {}) => { if (pairs.length >= 4) S.push({ title, lang, lbl, pairs, ...opt }); };
    const tm = T_OF('medi'); if (tm) tm.forEach(u => { const d = (window.MINI_DEF || {})[u]; if (d) add('Uneix cada concepte amb la seva definició', 'ca', LBL.medi, d, { col: 1 }); });
    if (has('flag')) { const cs = countries(); add('Uneix cada bandera amb el seu país', 'ca', LBL.flag, cs.map(c => [{ img: window.FLAGS[c[2]], flag: 1 }, c[0]])); }
    if (has('cap')) add('Uneix cada país amb la seva capital', 'ca', LBL.cap, countries().filter(c => c[1]).map(c => [c[0], c[1]]));
    if (has('irr') || anyT('en', ['en-irr'])) add('Match each verb with its past simple', 'en', LBL.en, (window.IRREG || []).map(v => [v[0], v[1]]));
    if (has('world') || anyT('en', ['en-world'])) { const ec = window.EN_COUNTRY || {}; add('Match each country with its nationality', 'en', LBL.en, countries().filter(c => ec[c[2]]).map(c => [ec[c[2]][0], ec[c[2]][1]])); }
    if ((has('gram') && T_OF('gram').has('en-comp')) || anyT('en', ['en-comp'])) add('Match each adjective with its comparative', 'en', LBL.en, (window.ADJ || []).map(a => [a[0], a[1]]));
    const ten = T_OF('en'); if (ten && [...ten].some(k => !k.startsWith('en-'))) add('Match the opposites', 'en', LBL.en, window.MINI_EN_OPP || []);
    if (T_OF('ca')) { const syn = Math.random() < .5; add(syn ? 'Uneix cada paraula amb el seu sinònim' : 'Uneix cada paraula amb el seu antònim', 'ca', LBL.ca, (window.CA_SYN || []).map(x => [x[0], syn ? x[1] : x[2]])); }
    if (T_OF('es')) { const syn = Math.random() < .5; add(syn ? 'Une cada palabra con su sinónimo' : 'Une cada palabra con su antónimo', 'es', LBL.es, (window.ES_SYN || []).map(x => [x[0], syn ? x[1] : x[2]])); }
    if (anyT('ma', ['ma-frac', 'ma-dec', 'ma-perc'])) { const m = pick([[0, 1, 'Uneix cada fracció amb el seu decimal'], [1, 2, 'Uneix cada decimal amb el seu percentatge'], [0, 2, 'Uneix cada fracció amb el seu percentatge']]); add(m[2], 'ca', LBL.ma, (window.MINI_FDP || []).map(x => [x[m[0]], x[m[1]]])); }
    if (anyT('ma', ['ma-mes'])) add('Uneix les mesures que són iguals', 'ca', LBL.ma, window.MINI_MES || []);
    if (anyT('ma', ['ma-geo'])) add('Uneix cada figura o angle amb la seva mida', 'ca', LBL.ma, window.MINI_GEO || []);
    if (has('mental') || anyT('ma', ['ma-calc', 'ma-num'])) { const ps = [], seen = new Set(); while (ps.length < 12) { const a = R(3, 9), b = R(3, 9); if (seen.has(a * b)) continue; seen.add(a * b); ps.push([`${a} × ${b}`, String(a * b)]); } add('Uneix cada multiplicació amb el seu resultat', 'ca', LBL.ma, ps); }
    return S;
  }

  /* -- ordena -- */
  function ordSets() {
    const S = [], n = L3(4, 5, 6);
    const tm = T_OF('medi');
    if (tm && tm.has('u7')) S.push(() => { const gap = L3(40, 12, 1), ev = sh(window.MINI_EVENTS || []), out = []; for (const e of ev) { if (out.every(o => Math.abs(o[0] - e[0]) >= gap)) out.push(e); if (out.length === n) break; } out.sort((a, b) => a[0] - b[0]); return { title: 'Ordena de més antic a més recent', lang: 'ca', lbl: LBL.medi, items: out.map(e => e[1]), extra: out.map(e => e[0]) }; });
    if (tm) (window.MINI_SEQ || []).filter(s => tm.has(s[0])).forEach(s => S.push(() => { let idx = s[2].map((_, i) => i); if (idx.length > n) idx = sh(idx).slice(0, n).sort((a, b) => a - b); return { title: s[1], lang: 'ca', lbl: LBL.medi, items: idx.map(i => s[2][i]) }; }));
    const tma = T_OF('ma');
    if (tma && ['ma-dec', 'ma-perc'].some(k => tma.has(k))) S.push(() => { const set = new Set(); const base = R(0, 4); while (set.size < n) set.add(li() === 2 ? Math.round((base + R(0, 99) / 100) * 100) / 100 : li() === 1 ? R(1, 99) / 10 : R(1, 20) / 2); const v = [...set].sort((a, b) => a - b); return { title: T('ca', 'small'), lang: 'ca', lbl: LBL.ma, items: v.map(nf) }; });
    if (tma && tma.has('ma-frac')) S.push(() => { const out = [], seen = new Set(); const den = R(5, 12); let guard = 0; while (out.length < n && guard++ < 200) { const d = li() === 0 ? den : R(2, 12), nu = R(1, li() === 2 ? 2 * d : d - 1); const v = nu / d; const k = Math.round(v * 1e6); if (seen.has(k)) continue; seen.add(k); out.push([nu, d, v]); } out.sort((a, b) => a[2] - b[2]); return { title: T('ca', 'small'), lang: 'ca', lbl: LBL.ma, items: out.map(f => `${f[0]}/${f[1]}`) }; });
    if ((tma && ['ma-num', 'ma-calc', 'ma-div'].some(k => tma.has(k))) || has('mental')) S.push(() => { const set = new Set(); while (set.size < n) set.add(li() === 2 ? R(-60, 60) : li() === 1 ? R(100, 9999) : R(1, 99)); const v = [...set].sort((a, b) => a - b); return { title: T('ca', 'small'), lang: 'ca', lbl: LBL.ma, items: v.map(x => x.toLocaleString('ca-ES')) }; });
    if (has('en') || has('gram') || has('irr') || has('world')) S.push(() => { const maxW = L3(5, 7, 12), minW = L3(3, 5, 7); let pool = (window.MINI_EN_SENT || []).filter(s => { const k = s.split(' ').length; return k >= minW && k <= maxW; }); if (!pool.length) pool = window.MINI_EN_SENT; const s = pick(pool), w = s.split(' '); if (w[0] !== 'I' && !/^I'/.test(w[0])) w[0] = w[0][0].toLowerCase() + w[0].slice(1); return { title: T('en', 'sent'), lang: 'en', lbl: LBL.en, items: w, sentence: s }; });
    ['ca', 'es'].forEach(lg => { if (!T_OF(lg)) return; S.push(() => { const words = [...new Set((window.ROSCO_BANK || []).filter(r => r[2] === lg && /^\p{L}+$/u.test(r[5])).map(r => r[5].toLowerCase()))]; let pool = words; if (li() === 2) { const by = {}; words.forEach(w => { (by[w[0]] = by[w[0]] || []).push(w); }); const big = Object.values(by).filter(a => a.length >= n); if (big.length) pool = pick(big); } const out = sh(pool).slice(0, n).sort((a, b) => a.localeCompare(b, lg, { sensitivity: 'base' })); return { title: T(lg, 'alpha'), lang: lg, lbl: LBL[lg], items: out }; }); });
    return S;
  }

  /* -- classifica -- */
  function clsSets() {
    const S = [];
    const fixed = (window.MINI_CLS || []).filter(s => { const t = T_OF(s[0]); if (!t) return false; return s[1] === '*' || t.has(s[1]); });
    fixed.forEach(s => S.push(() => ({ title: s[2], lang: LANG_OF[s[0]] || 'ca', lbl: LBL[s[0]], boxes: s[3], items: s[4] })));
    const tma = T_OF('ma');
    if ((tma && ['ma-num', 'ma-div', 'ma-calc'].some(k => tma.has(k))) || has('mental')) S.push(() => { const it = []; const seen = new Set(); while (it.length < 12) { const x = R(10, li() === 2 ? 9999 : 999); if (seen.has(x)) continue; seen.add(x); it.push([x.toLocaleString('ca-ES'), x % 2 ? 1 : 0]); } return { title: 'Parell o senar?', lang: 'ca', lbl: LBL.ma, boxes: ['Parell', 'Senar'], items: it }; });
    if (tma && ['ma-div', 'ma-num'].some(k => tma.has(k))) {
      S.push(() => { const pr = x => { if (x < 2) return false; for (let d = 2; d * d <= x; d++) if (x % d === 0) return false; return true; }; const it = sh(Array.from({ length: 59 }, (_, i) => i + 2)).slice(0, 12).map(x => [String(x), pr(x) ? 0 : 1]); return { title: 'Nombre primer o compost?', lang: 'ca', lbl: LBL.ma, boxes: ['Primer', 'Compost'], items: it }; });
      S.push(() => { const it = sh(Array.from({ length: 90 }, (_, i) => i + 10)).slice(0, 12).map(x => [String(x), x % 3 ? 1 : 0]); return { title: 'És múltiple de 3?', lang: 'ca', lbl: LBL.ma, boxes: ['Múltiple de 3', 'No múltiple de 3'], items: it }; });
    }
    if (tma && tma.has('ma-geo')) S.push(() => { const it = [['90°', 1]]; const seen = new Set([90]); while (it.length < 12) { const x = R(2, 34) * 5; if (seen.has(x) || x >= 180) continue; seen.add(x); it.push([x + '°', x < 90 ? 0 : x === 90 ? 1 : 2]); } return { title: 'Quin tipus d\'angle és?', lang: 'ca', lbl: LBL.ma, boxes: ['Agut', 'Recte', 'Obtús'], items: it }; });
    if (tma && tma.has('ma-frac')) S.push(() => { const it = []; const seen = new Set(); while (it.length < 12) { const d = R(2, 12), nu = R(1, 2 * d); const k = nu + '/' + d; if (seen.has(k)) continue; seen.add(k); it.push([k, nu < d ? 0 : nu === d ? 1 : 2]); } return { title: 'Com és la fracció comparada amb 1?', lang: 'ca', lbl: LBL.ma, boxes: ['Menor que 1', 'Igual a 1', 'Major que 1'], items: it }; });
    const accSet = (lg, data, lbl) => S.push(() => { const types = [...new Set(data.map(x => x[1]))]; return { title: lg === 'ca' ? 'Aguda, plana o esdrúixola?' : '¿Aguda, llana o esdrújula?', lang: lg, lbl, boxes: types.map(x => x[0].toUpperCase() + x.slice(1)), items: data.map(x => [x[0], types.indexOf(x[1])]) }; });
    if (anyT('ca', ['ca-acc', 'ca-orto'])) accSet('ca', window.CA_ACC || [], LBL.ca);
    if (anyT('es', ['es-acc', 'es-orto'])) accSet('es', window.ES_ACC || [], LBL.es);
    const synSet = (lg, data, lbl) => S.push(() => ({ title: lg === 'ca' ? 'Són sinònims o antònims?' : '¿Son sinónimos o antónimos?', lang: lg, lbl, boxes: lg === 'ca' ? ['Sinònims', 'Antònims'] : ['Sinónimos', 'Antónimos'], items: sh(data).slice(0, 12).map(x => Math.random() < .5 ? [`${x[0]} – ${x[1]}`, 0] : [`${x[0]} – ${x[2]}`, 1]) }));
    if (anyT('ca', ['ca-syn', 'ca-voc'])) synSet('ca', window.CA_SYN || [], LBL.ca);
    if (anyT('es', ['es-syn', 'es-voc'])) synSet('es', window.ES_SYN || [], LBL.es);
    if (has('irr') || anyT('en', ['en-irr', 'en-tense'])) S.push(() => { const irr = new Set((window.IRREG || []).map(v => v[0])); const reg = (window.VERBS_EN || []).map(v => v[0]).filter(v => !irr.has(v)); return { title: 'Regular or irregular verb?', lang: 'en', lbl: LBL.en, boxes: ['Regular', 'Irregular'], items: sh(reg).slice(0, 7).map(v => [v, 0]).concat(sh([...irr]).slice(0, 7).map(v => [v, 1])) }; });
    const cs = countries(); const tm = T_OF('medi');
    if (cs.length || (tm && tm.has('u9'))) { const pool = cs.length ? cs : window.COUNTRIES || []; const en = has('world') && !has('flag') && !has('cap'); S.push(() => { const ec = window.EN_COUNTRY || {}; const conts = sh([...new Set(pool.map(c => c[3]))]).slice(0, Math.min(L3(2, 3, 4), 5)); const it = pool.filter(c => conts.includes(c[3]) && (!en || ec[c[2]])).map(c => [en ? ec[c[2]][0] : c[0], conts.indexOf(c[3])]); return { title: en ? 'Which continent is it in?' : 'De quin continent és?', lang: en ? 'en' : 'ca', lbl: en ? LBL.world : LBL.cap, boxes: conts.map(k => (en ? CONT_EN : CONT_CA)[k]), items: it }; }); }
    return S;
  }

  /* =================== JOCS =================== */
  const GAMES = [
    { id: 'parelles', icon: '🃏', name: 'Parelles', desc: 'Troba les parelles: banderes, capitals, verbs, definicions…', avail: () => pairSets().length > 0, hint: 'Tria Medi, Banderes, Capitals, verbs irregulars, sinònims o Mates' },
    { id: 'penjat', icon: '🎈', name: 'Penjat', desc: 'Endevina la paraula del Rosco lletra a lletra', avail: () => roscoWords(okHang).length >= 5, hint: 'Tria Medi, Català, Castellano o Mates' },
    { id: 'vf', icon: '✅', name: 'Vertader o fals', desc: 'És correcta la resposta? Encertar a l\'atzar no puntua', avail: () => true },
    { id: 'lletres', icon: '🔀', name: 'Lletres desordenades', desc: 'Ordena les lletres per trobar la paraula', avail: () => roscoWords(okScr).length >= 6, hint: 'Tria Medi, Català, Castellano o Mates' },
    { id: 'ordena', icon: '📅', name: 'Ordena', desc: 'Línia del temps, nombres, frases i ordre alfabètic', avail: () => ordSets().length > 0, hint: 'Tria Medi, Mates, English, Català o Castellano' },
    { id: 'classifica', icon: '🗂️', name: 'Classifica', desc: 'Posa cada paraula a la seva caixa', avail: () => clsSets().length > 0, hint: 'Tria Medi, Mates, English, Català, Castellano o Banderes' }
  ];

  let G = null, S = null;
  const body = () => $('mini-body');
  const card = inner => `<div class="glass-panel rounded-3xl p-4 sm:p-6">${inner}</div>`;
  const bigBtn = (txt, act, cls = 'from-cyan-500 via-blue-500 to-indigo-600 border-indigo-900 text-white', extra = '') => `<button type="button" data-mact="${act}" ${extra} class="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r ${cls} font-display font-black text-base btn-arcade">${txt}</button>`;
  const grey = 'from-slate-200 to-slate-300 border-slate-400 text-slate-700';
  function show() { switchScreen('screen-mini'); const bb = $('btn-back'); bb.classList.remove('hidden'); bb.classList.add('flex'); window.scrollTo(0, 0); }
  function profile() { try { return loadProfile(); } catch (e) { return { badges: [] }; } }

  /* ---------- galeria ---------- */
  function open() {
    show(); G = null; S = null;
    const p = profile(), best = p.miniBest || {}, L = curLevel();
    const label = sel().map(s => s.src.short || s.src.name).join(' + ');
    body().innerHTML = card(`<div class="flex items-center gap-3 mb-1"><span class="text-4xl">🧩</span><div class="min-w-0"><h2 class="font-display font-black text-2xl text-white leading-tight">Minijocs</h2><p class="text-xs text-slate-400">${E(label)} · ${E(L.name)}</p></div></div>
      <p class="text-xs text-slate-400 mb-4">Partides curtes. Només compten els encerts, mai la velocitat.</p>
      <div class="grid grid-cols-2 lg:grid-cols-3 gap-3">${GAMES.map(g => { const ok = g.avail(); const b = best[g.id]; return `<button type="button" ${ok ? `data-mgame="${g.id}"` : 'disabled'} class="relative p-4 rounded-2xl border-2 text-left flex flex-col gap-1 transition btn-arcade ${ok ? 'bg-white/80 border-white/60 hover:border-blue-400' : 'bg-slate-950/30 border-slate-700 opacity-60 cursor-not-allowed'}">
        <span class="text-4xl">${g.icon}</span><span class="font-display font-black text-white text-base leading-tight">${g.name}</span><span class="text-[11px] text-slate-400 leading-snug">${ok ? g.desc : 'No disponible per a aquest tema. ' + g.hint + '.'}</span>
        ${b != null && ok ? `<span class="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-amber-400/20 border border-amber-400/50 text-[10px] font-black text-amber-600">★ ${b}%</span>` : ''}</button>`; }).join('')}</div>`);
  }

  /* ---------- inici i final comuns ---------- */
  function start(id) {
    G = GAMES.find(g => g.id === id); if (!G || !G.avail()) return open();
    S = { ok: 0, total: 0, adj: null, ans: [], round: 0 };
    playSFX('click');
    ({ vf: vfStart, parelles: pairsStart, penjat: hangStart, lletres: scrStart, ordena: ordStart, classifica: clsStart })[id]();
  }
  function head(sub, right) { return `<div class="flex items-center gap-3 mb-4"><span class="text-3xl">${G.icon}</span><div class="flex-1 min-w-0"><p class="font-display font-black text-white text-lg leading-tight">${G.name}</p><p class="text-[11px] text-slate-400">${E(sub)}</p></div>${right || ''}<span class="px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-400/40 font-display font-black text-emerald-600 text-sm tabular-nums">✓ ${S.ok}</span></div>`; }
  const tag = (lbl) => `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-700 font-display font-extrabold text-[11px]">${E(lbl)}</span>`;
  function rec(q, given, right, c, lbl) { S.ans.push({ q: String(q).slice(0, 160), a: given == null ? '' : String(given).slice(0, 80), ok: String(right).slice(0, 80), c: !!c, cat: lbl || '' }); }
  async function finish() {
    const pct = S.total ? Math.round(100 * (S.adj != null ? S.adj : S.ok / S.total)) : 0;
    const stars = pct >= 90 ? 3 : pct >= 60 ? 2 : pct >= 30 ? 1 : 0;
    // insígnies i rècord personal (en aquest dispositiu)
    const per = {}; S.ans.forEach(a => { const k = a.cat || '🧩'; per[k] = per[k] || [k, 0, 0]; per[k][2]++; if (a.c) per[k][1]++; });
    const st = { mode: 'mini', mg: G.name, lvl: curLevel().id, src: sel().map(s => s.src.id), ok: S.ok, total: S.total, adj: S.adj, rosco: null, gold: null, streak: 0, perTopic: Object.values(per), wrongQ: S.ans.filter(a => !a.c).map(a => a.q), answers: S.ans };
    let newBadge = null;
    try {
      awardBadges({ ...st });
      const p = loadProfile(); p.miniBest = p.miniBest || {}; const prev = p.miniBest[G.id]; if (prev == null || pct > prev) p.miniBest[G.id] = pct;
      if (GAMES.every(g => p.miniBest[g.id] != null) && !p.badges.includes('mini6')) { p.badges.push('mini6'); newBadge = 'mini6'; }
      saveProfile(p);
    } catch (e) { /* */ }
    let pts = null;
    const draw = () => {
      body().innerHTML = card(`<div class="text-center"><div class="text-6xl mb-1">${G.icon}</div><h2 class="font-display font-black text-3xl text-white">${pct >= 90 ? 'Impressionant!' : pct >= 60 ? 'Molt bé!' : pct >= 30 ? 'Bona feina!' : 'A per la següent!'}</h2>
        <p class="text-4xl mt-2 tracking-widest">${'★'.repeat(stars)}<span class="text-slate-300">${'★'.repeat(3 - stars)}</span></p>
        <p class="text-lg font-display font-black text-white mt-1">${S.ok} de ${S.total} · ${pct}%</p>
        ${S.adj != null ? '<p class="text-[11px] text-slate-400">A Vertader o fals, encertar a l\'atzar no suma: el percentatge descompta les respostes que es podrien endevinar.</p>' : ''}
        ${pts != null ? `<p class="text-sm font-bold text-amber-500 mt-1">+${pts} punts per a la classificació</p>` : ''}
        ${newBadge ? '<p class="mt-2 inline-block px-3 py-1 rounded-xl bg-amber-400/20 border border-amber-400 text-sm font-black text-amber-700">🧩 Nova insígnia: Tot terreny!</p>' : ''}</div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">${bigBtn('🔁 Tornar a jugar', 'again')}${bigBtn('🧩 Altres minijocs', 'gallery', grey)}</div>
        <details class="mt-4"><summary class="text-sm font-bold text-slate-300 cursor-pointer">Veure les respostes</summary><div class="space-y-1.5 mt-2">${S.ans.map(a => `<div class="flex items-start gap-2 px-3 py-2 rounded-xl ${a.c ? 'bg-emerald-500/10' : 'bg-rose-500/10'} text-xs"><span>${a.c ? '✅' : '❌'}</span><div class="flex-1 min-w-0"><p class="text-slate-200 leading-snug">${E(a.q)}</p><p class="text-[11px] text-slate-400">${a.c ? E(a.ok) : `Correcte: <b class="text-emerald-600">${E(a.ok)}</b>${a.a ? ` · tu: <b class="text-rose-500">${E(a.a)}</b>` : ''}`}</p></div></div>`).join('')}</div></details>`);
    };
    draw();
    if (stars >= 2 && typeof launchConfetti === 'function') { try { launchConfetti(); } catch (e) { /* */ } }
    playSFX(stars >= 2 ? 'correct' : 'click');
    if (window.GR && GR.acc && !GR.acc.teacher && GR.available()) { try { pts = await GR.record(st); if (window.Notif) Notif.check(true); draw(); } catch (e) { /* */ } }
  }

  /* ---------- 1 · Vertader o fals ---------- */
  function vfStart() { S.cards = buildPhase1Questions(12); S.i = 0; S.total = S.cards.length; vfAsk(); }
  function vfAsk() {
    if (S.i >= S.cards.length) { S.adj = Math.max(0, (2 * S.ok - S.total) / S.total); return finish(); }
    const c = S.cards[S.i], lg = c.lang || 'ca';
    S.truth = Math.random() < .5; const wrong = c.options.filter((_, i) => i !== c.answer);
    S.shown = S.truth ? c.options[c.answer] : pick(wrong);
    body().innerHTML = card(head(`${S.i + 1} de ${S.cards.length}`) + `${tag((c.icon || '') + ' ' + (c.cat || ''))}
      ${c.img ? `<div class="flex justify-center my-3"><img src="${c.img}" alt="" class="${c.flag || String(c.img).startsWith('data:image/svg') ? 'h-24 rounded-lg border border-slate-200' : 'max-h-44 rounded-2xl object-cover'}"></div>` : ''}
      <h3 class="font-display font-black text-xl sm:text-2xl text-white leading-snug my-3">${E(c.q)}</h3>
      <div class="p-4 rounded-2xl bg-white border-2 border-blue-200 text-center mb-4"><p class="text-[11px] font-bold uppercase tracking-wide text-slate-400">${T(lg, 'prop')}</p><p class="font-display font-black text-2xl text-white">${E(S.shown)}</p></div>
      <div class="grid grid-cols-2 gap-3"><button type="button" data-mvf="1" class="py-4 rounded-2xl bg-emerald-500 border-emerald-800 text-white font-display font-black text-lg btn-arcade">✓ ${T(lg, 't')}</button><button type="button" data-mvf="0" class="py-4 rounded-2xl bg-rose-500 border-rose-800 text-white font-display font-black text-lg btn-arcade">✗ ${T(lg, 'f')}</button></div><div id="m-fb"></div>`);
  }
  function vfAnswer(v) {
    const c = S.cards[S.i], lg = c.lang || 'ca', good = (v === 1) === S.truth;
    if (good) S.ok++;
    rec(`${c.q} → ${S.shown}`, v ? T(lg, 't') : T(lg, 'f'), S.truth ? T(lg, 't') : T(lg, 'f'), good, (c.icon || '') + ' ' + (c.cat || ''));
    playSFX(good ? 'correct' : 'wrong');
    body().querySelectorAll('[data-mvf]').forEach(b => { b.disabled = true; b.classList.add(b.dataset.mvf === (S.truth ? '1' : '0') ? 'ring-4' : 'opacity-40'); });
    $('m-fb').innerHTML = `<div class="mt-4 p-3 rounded-2xl ${good ? 'bg-emerald-500/10 border border-emerald-400/50' : 'bg-rose-500/10 border border-rose-400/50'}"><p class="font-display font-black ${good ? 'text-emerald-600' : 'text-rose-500'}">${good ? T(lg, 'ok') : T(lg, 'ko')}</p><p class="text-sm text-slate-200">${S.truth ? '' : `${T(lg, 'was')}: <b>${E(c.options[c.answer])}</b>. `}${E(c.info || '')}</p></div><div class="mt-3">${bigBtn(T(lg, 'next') + ' →', 'vfnext')}</div>`;
  }

  /* ---------- 2 · Parelles ---------- */
  function pairsStart() {
    const sets = pairSets(); const set = pick(sets);
    const memMode = !set.col && set.pairs.every(p => [p[0], p[1]].every(x => typeof x === 'object' || String(x).length <= 14));
    const n = memMode ? L3(4, 6, 8) : L3(4, 5, 6);
    const seenA = new Set(), seenB = new Set(); const pairs = [];
    for (const p of sh(set.pairs)) { const a = typeof p[0] === 'object' ? p[0].img : p[0]; if (seenA.has(a) || seenB.has(p[1])) continue; seenA.add(a); seenB.add(p[1]); pairs.push(p); if (pairs.length === n) break; }
    S.set = set; S.pairs = pairs; S.total = pairs.length; S.mem = memMode; S.done = new Set(); S.miss = 0; S.failed = new Set(); S.sel = null; S.lock = false;
    if (memMode) S.cards = sh(pairs.flatMap((p, i) => [{ pid: i, side: 0, v: p[0] }, { pid: i, side: 1, v: p[1] }])), S.open = [];
    else S.right = sh(pairs.map((p, i) => i));
    pairsRender();
  }
  const face = v => typeof v === 'object' ? `<img src="${v.img}" alt="" class="max-h-12 max-w-full rounded border border-slate-200">` : `<span>${E(v)}</span>`;
  function pairsRender() {
    const lg = S.set.lang;
    if (S.mem) {
      body().innerHTML = card(head(`${S.set.title} · ${T(lg, 'mem')}`, `<span class="text-[11px] text-slate-400 mr-1">✗ ${S.miss}</span>`) + `<div class="grid grid-cols-4 gap-2">${S.cards.map((c, i) => { const up = S.done.has(c.pid) || S.open.includes(i); return `<button type="button" data-mcard="${i}" class="aspect-[4/5] sm:aspect-square rounded-2xl border-2 flex items-center justify-center p-1.5 text-center font-display font-black text-xs sm:text-sm leading-tight transition ${S.done.has(c.pid) ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : up ? 'bg-white border-blue-400 text-slate-800' : 'bg-gradient-to-br from-sky-400 to-indigo-500 border-indigo-700 text-white text-2xl'}">${up ? face(c.v) : '?'}</button>`; }).join('')}</div>`);
    } else {
      const L = S.pairs.map((p, i) => i);
      body().innerHTML = card(head(`${S.set.title} · ${T(lg, 'col')}`) + `<div class="grid grid-cols-2 gap-2 sm:gap-3"><div class="space-y-2">${L.map(i => `<button type="button" data-mleft="${i}" class="w-full min-h-[52px] p-2.5 rounded-2xl border-2 text-left text-sm font-bold leading-snug transition ${S.done.has(i) ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : S.sel === i ? 'bg-blue-50 border-blue-500 text-slate-800' : 'bg-white border-slate-200 text-slate-800'}">${face(S.pairs[i][0])}</button>`).join('')}</div>
        <div class="space-y-2">${S.right.map(i => `<button type="button" data-mright="${i}" class="w-full min-h-[52px] p-2.5 rounded-2xl border-2 text-left text-sm leading-snug transition ${S.done.has(i) ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-white border-slate-200 text-slate-700'}">${face(S.pairs[i][1])}</button>`).join('')}</div></div>`);
    }
  }
  function memTap(i) {
    if (S.lock) return; const c = S.cards[i]; if (S.done.has(c.pid) || S.open.includes(i)) return;
    S.open.push(i); playSFX('click'); pairsRender();
    if (S.open.length === 2) {
      const [a, b] = S.open.map(k => S.cards[k]);
      if (a.pid === b.pid && a.side !== b.side) { S.done.add(a.pid); S.open = []; playSFX('correct'); const s0 = S; setTimeout(() => { if (S === s0) pairsRender(); }, 150); if (S.done.size === S.pairs.length) setTimeout(() => { if (S === s0) pairsEnd(); }, 700); }
      else { S.miss++; S.lock = true; const s0 = S; setTimeout(() => { if (S !== s0) return; S.open = []; S.lock = false; playSFX('wrong'); pairsRender(); }, 900); }
    }
  }
  function colTap(side, i) {
    if (S.done.has(i) && side === 'L') return;
    if (side === 'L') { S.sel = i; playSFX('click'); return pairsRender(); }
    if (S.sel == null || S.done.has(i)) return;
    if (S.sel === i) { S.done.add(i); playSFX('correct'); S.sel = null; pairsRender(); if (S.done.size === S.pairs.length) { const s0 = S; setTimeout(() => { if (S === s0) pairsEnd(); }, 600); } }
    else { S.failed.add(S.sel); playSFX('wrong'); const b = body().querySelector(`[data-mright="${i}"]`); if (b) { b.classList.add('animate-shake', 'border-rose-400'); setTimeout(() => b.classList.remove('animate-shake', 'border-rose-400'), 500); } }
  }
  function pairsEnd() {
    const n = S.pairs.length, txt = v => typeof v === 'object' ? 'bandera' : v;
    if (S.mem) { S.ok = Math.max(0, n - Math.floor(Math.max(0, S.miss - n) / 2)); S.pairs.forEach((p, i) => rec(`${txt(p[0])} ↔ ${p[1]}`, null, `${txt(p[0])} ↔ ${p[1]}`, i < S.ok, S.set.lbl)); if (S.miss > n) S.ans.push({ q: `Errors en girar cartes: ${S.miss}`, a: '', ok: `fins a ${n} errors no resten`, c: false, cat: S.set.lbl }); }
    else { S.ok = n - S.failed.size; S.pairs.forEach((p, i) => rec(`${txt(p[0])} ↔ ${p[1]}`, S.failed.has(i) ? 'primer intent equivocat' : null, p[1], !S.failed.has(i), S.set.lbl)); }
    finish();
  }

  /* ---------- 3 · Penjat ---------- */
  const base = (ch, lg) => { ch = ch.toLowerCase(); if ((lg === 'ca' && ch === 'ç') || (lg === 'es' && ch === 'ñ')) return ch; return ch.normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  function hangStart() { const w = []; const seen = new Set(); for (const x of roscoWords(okHang)) { if (seen.has(x.w)) continue; seen.add(x.w); w.push(x); if (w.length === 5) break; } S.words = w; S.i = 0; S.total = w.length; hangNew(); }
  function hangNew() { if (S.i >= S.words.length) return finish(); const x = S.words[S.i]; S.cur = { ...x, got: new Set(), bad: new Set(), lives: L3(7, 6, 5), end: false }; hangRender(); }
  function hangRender() {
    const c = S.cur, lg = c.lang, kb = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').concat(lg === 'ca' ? ['Ç'] : lg === 'es' ? ['Ñ'] : []);
    const slots = [...c.w].map(ch => /\p{L}/u.test(ch) ? `<span class="inline-flex items-end justify-center w-7 sm:w-9 h-10 sm:h-12 border-b-4 ${c.end && !c.got.has(base(ch, lg)) ? 'border-rose-400 text-rose-500' : 'border-slate-700 text-white'} font-display font-black text-2xl sm:text-3xl">${c.got.has(base(ch, lg)) || c.end ? E(ch.toUpperCase()) : ''}</span>` : ch === ' ' ? '<span class="w-4"></span>' : `<span class="font-display font-black text-2xl text-white">${E(ch)}</span>`).join('');
    const won = letters(c.w).every(ch => c.got.has(base(ch, lg)));
    body().innerHTML = card(head(`${S.i + 1} de ${S.words.length} · ${T(lg, 'hang')}`, `<span class="text-lg mr-1" title="${T(lg, 'lives')}">${'🎈'.repeat(c.lives)}<span class="opacity-30">${'🎈'.repeat(Math.max(0, L3(7, 6, 5) - c.lives))}</span></span>`) + `${tag(c.lbl)}
      <div class="my-4 p-4 rounded-2xl bg-white border-2 border-blue-200"><p class="text-[11px] font-bold uppercase tracking-wide text-slate-400">${T(lg, 'clue')}</p><p class="text-base sm:text-lg font-bold text-slate-800 leading-snug">${E(c.clue)}</p></div>
      <div class="flex flex-wrap justify-center gap-1.5 my-5">${slots}</div>
      ${c.end ? `<div class="p-3 rounded-2xl ${won ? 'bg-emerald-500/10 border border-emerald-400/50' : 'bg-rose-500/10 border border-rose-400/50'} text-center mb-3"><p class="font-display font-black ${won ? 'text-emerald-600' : 'text-rose-500'}">${won ? T(lg, 'ok') : `${T(lg, 'was')}: ${E(c.w)}`}</p></div>${bigBtn(T(lg, 'next') + ' →', 'hangnext')}` :
      `<div class="grid grid-cols-7 sm:grid-cols-9 gap-1.5">${kb.map(k => { const b = base(k, lg), used = c.got.has(b) || c.bad.has(b); return `<button type="button" ${used ? 'disabled' : `data-mkey="${k}"`} class="h-11 rounded-xl border-2 font-display font-black text-base transition ${c.got.has(b) ? 'bg-emerald-100 border-emerald-400 text-emerald-700' : c.bad.has(b) ? 'bg-slate-200 border-slate-300 text-slate-400' : 'bg-white border-slate-200 text-slate-800 hover:border-blue-400'}">${k}</button>`; }).join('')}</div>`}`);
  }
  function hangKey(k) {
    const c = S.cur; if (c.end) return; const lg = c.lang, b = base(k, lg);
    if (letters(c.w).some(ch => base(ch, lg) === b)) { c.got.add(b); playSFX('click'); } else { c.bad.add(b); c.lives--; playSFX('wrong'); }
    const won = letters(c.w).every(ch => c.got.has(base(ch, lg)));
    if (won || c.lives <= 0) { c.end = true; if (won) { S.ok++; playSFX('correct'); } rec(c.clue, won ? c.w : `${c.bad.size} errors`, c.w, won, c.lbl); }
    hangRender();
  }

  /* ---------- 4 · Lletres desordenades ---------- */
  function scrStart() { const w = []; const seen = new Set(); for (const x of roscoWords(okScr)) { if (seen.has(x.w.toLowerCase())) continue; seen.add(x.w.toLowerCase()); w.push(x); if (w.length === 6) break; } S.words = w; S.i = 0; S.total = w.length; scrNew(); }
  function scrNew() {
    if (S.i >= S.words.length) return finish();
    const x = S.words[S.i], up = [...x.w.toUpperCase()]; let tiles; let guard = 0;
    const fix = li() === 0 ? 1 : 0;
    do { tiles = sh(up.slice(fix).map((ch, i) => ({ ch, id: i }))); } while (tiles.map(t => t.ch).join('') === up.slice(fix).join('') && guard++ < 20);
    S.cur = { ...x, up, fix, tiles, picked: [], tries: 0, end: false, won: false }; scrRender();
  }
  function scrRender() {
    const c = S.cur, lg = c.lang, maxT = L3(3, 3, 2);
    const slots = c.up.map((ch, i) => { const v = i < c.fix ? ch : c.picked[i - c.fix] ? c.picked[i - c.fix].ch : ''; return `<button type="button" ${i >= c.fix && v && !c.end ? `data-mslot="${i - c.fix}"` : 'disabled'} class="w-9 h-11 sm:w-11 sm:h-12 rounded-xl border-2 font-display font-black text-xl ${c.end ? (c.won ? 'bg-emerald-100 border-emerald-500 text-emerald-700' : 'bg-rose-50 border-rose-400 text-rose-600') : i < c.fix ? 'bg-blue-100 border-blue-400 text-blue-800' : v ? 'bg-white border-blue-400 text-slate-800' : 'bg-white/40 border-dashed border-slate-300'}">${E(c.end && !c.won ? ch : v)}</button>`; }).join('');
    const used = new Set(c.picked.map(t => t.id));
    body().innerHTML = card(head(`${S.i + 1} de ${S.words.length} · ${T(lg, 'scr')}`, `<span class="text-[11px] text-slate-400 mr-1">${T(lg, 'tries')}: ${maxT - c.tries}</span>`) + `${tag(c.lbl)}
      <div class="my-4 p-4 rounded-2xl bg-white border-2 border-blue-200"><p class="text-[11px] font-bold uppercase tracking-wide text-slate-400">${T(lg, 'clue')}</p><p class="text-base sm:text-lg font-bold text-slate-800 leading-snug">${E(c.clue)}</p></div>
      <div id="m-slots" class="flex flex-wrap justify-center gap-1.5 mb-5">${slots}</div>
      ${c.end ? `<p class="text-center font-display font-black mb-3 ${c.won ? 'text-emerald-600' : 'text-rose-500'}">${c.won ? T(lg, 'ok') : `${T(lg, 'was')}: ${E(c.w)}`}</p>${bigBtn(T(lg, 'next') + ' →', 'scrnext')}` :
      `<div class="flex flex-wrap justify-center gap-2 mb-4">${c.tiles.map(t => `<button type="button" ${used.has(t.id) ? 'disabled' : `data-mtile="${t.id}"`} class="w-11 h-12 sm:w-12 sm:h-14 rounded-xl border-2 font-display font-black text-xl transition ${used.has(t.id) ? 'opacity-20 bg-slate-200 border-slate-300' : 'bg-amber-100 border-amber-400 text-amber-900 shadow-[0_3px_0_#d97706]'}">${E(t.ch)}</button>`).join('')}</div>
      <div class="flex justify-center"><button type="button" data-mact="scrclear" class="px-4 py-2 rounded-xl bg-white border-2 border-slate-200 text-slate-600 text-xs font-bold">⌫ ${T(lg, 'clear')}</button></div>`}`);
  }
  function scrTile(id) {
    const c = S.cur; if (c.end) return; const t = c.tiles.find(x => x.id === id); if (!t || c.picked.includes(t)) return;
    c.picked.push(t); playSFX('click');
    if (c.picked.length === c.tiles.length) {
      const word = c.up.slice(0, c.fix).join('') + c.picked.map(x => x.ch).join('');
      if (word === c.up.join('')) { c.end = true; c.won = true; S.ok++; playSFX('correct'); rec(c.clue, c.w, c.w, true, c.lbl); }
      else { c.tries++; playSFX('wrong'); if (c.tries >= L3(3, 3, 2)) { c.end = true; rec(c.clue, word.toLowerCase(), c.w, false, c.lbl); } else { scrRender(); const s = $('m-slots'); if (s) s.classList.add('animate-shake'); setTimeout(() => { if (S && S.cur === c) { c.picked = []; scrRender(); } }, 600); return; } }
    }
    scrRender();
  }

  /* ---------- 5 · Ordena ---------- */
  function ordStart() { S.makers = sh(ordSets()); S.rounds = 3; S.round = 0; ordNew(); }
  function ordNew() {
    if (S.round >= S.rounds) return finish();
    const mk = S.makers[S.round % S.makers.length]; const set = mk();
    S.cur = { ...set, pool: sh(set.items.map((v, i) => ({ v, i }))), placed: [], checked: false };
    if (S.cur.pool.every((p, k) => p.i === k)) S.cur.pool.reverse();
    ordRender();
  }
  function ordRender() {
    const c = S.cur, lg = c.lang, n = c.items.length;
    const slots = Array.from({ length: n }, (_, k) => { const p = c.placed[k]; const good = c.checked && p && p.i === k; return `<div class="flex items-center gap-2"><span class="w-7 h-7 shrink-0 rounded-lg bg-blue-100 text-blue-800 font-display font-black text-sm flex items-center justify-center">${k + 1}</span><button type="button" ${p && !c.checked ? `data-mplaced="${k}"` : 'disabled'} class="flex-1 min-h-[46px] px-3 py-2 rounded-xl border-2 text-left text-sm font-bold transition ${c.checked ? (good ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-rose-50 border-rose-400 text-rose-700') : p ? 'bg-white border-blue-400 text-slate-800' : 'bg-white/40 border-dashed border-slate-300 text-slate-400'}">${p ? E(p.v) : ''}${c.checked && c.extra ? ` <span class="text-[11px] font-black text-slate-500">(${c.extra[p.i]})</span>` : ''}</button></div>`; }).join('');
    const placedIds = new Set(c.placed.map(p => p.i));
    body().innerHTML = card(head(`Ronda ${S.round + 1} de ${S.rounds} · ${T(lg, 'ord')}`) + `${tag(c.lbl)}
      <h3 class="font-display font-black text-lg sm:text-xl text-white leading-snug my-3">${E(c.title)}</h3>
      ${c.checked ? '' : `<div class="flex flex-wrap gap-2 mb-4">${c.pool.map(p => `<button type="button" ${placedIds.has(p.i) ? 'disabled' : `data-mpool="${p.i}"`} class="px-3 py-2 rounded-xl border-2 text-sm font-bold transition ${placedIds.has(p.i) ? 'opacity-20 bg-slate-200 border-slate-300' : 'bg-amber-100 border-amber-400 text-amber-900 shadow-[0_3px_0_#d97706]'}">${E(p.v)}</button>`).join('')}</div>`}
      <div class="space-y-2 mb-4">${slots}</div>
      ${c.checked ? `${c.placed.every(p => p.i === c.placed.indexOf(p)) ? '' : `<div class="p-3 rounded-2xl bg-white border-2 border-emerald-300 mb-3 text-sm text-slate-700"><p class="text-[11px] font-bold uppercase text-emerald-600 mb-1">${T(lg, 'right')}</p>${c.sentence ? E(c.sentence) : c.items.map((v, k) => `${k + 1}. ${E(v)}${c.extra ? ` (${c.extra[k]})` : ''}`).join(' · ')}</div>`}${bigBtn(T(lg, 'next') + ' →', 'ordnext')}` : c.placed.length === n ? bigBtn(T(lg, 'check'), 'ordcheck') : ''}`);
  }
  function ordCheck() {
    const c = S.cur; c.checked = true; let good = 0;
    c.placed.forEach((p, k) => { if (p.i === k) good++; });
    S.ok += good; S.total += c.items.length;
    rec(c.title + (c.sentence ? ` (${c.sentence})` : ''), c.placed.map(p => p.v).join(' · '), c.items.join(' · '), good === c.items.length, c.lbl);
    playSFX(good === c.items.length ? 'correct' : 'wrong');
    ordRender();
  }

  /* ---------- 6 · Classifica ---------- */
  function clsStart() { S.makers = sh(clsSets()); S.rounds = 2; S.round = 0; clsNew(); }
  function clsNew() {
    if (S.round >= S.rounds) return finish();
    const set = S.makers[S.round % S.makers.length]();
    let boxes = set.boxes.map((b, i) => i);
    const want = Math.min(boxes.length, L3(2, 3, 4)); if (boxes.length > want) boxes = sh(boxes).slice(0, want).sort((a, b) => a - b);
    const nItems = L3(6, 8, 10), per = {}; boxes.forEach(b => { per[b] = sh(set.items.filter(x => x[1] === b)); });
    const items = []; let k = 0; while (items.length < nItems && boxes.some(b => per[b].length)) { const b = boxes[k++ % boxes.length]; if (per[b].length) items.push(per[b].pop()); }
    S.cur = { ...set, boxNames: set.boxes, boxes, items: sh(items).map((x, i) => ({ v: x[0], b: x[1], i })), put: {}, failed: new Set(), sel: null };
    S.total += S.cur.items.length;
    clsRender();
  }
  function clsRender() {
    const c = S.cur, lg = c.lang, left = c.items.filter(x => c.put[x.i] == null);
    const COLS = ['bg-sky-50 border-sky-300', 'bg-amber-50 border-amber-300', 'bg-emerald-50 border-emerald-300', 'bg-purple-50 border-purple-300', 'bg-rose-50 border-rose-300'];
    body().innerHTML = card(head(`Ronda ${S.round + 1} de ${S.rounds} · ${T(lg, 'cls')}`) + `${tag(c.lbl)}
      <h3 class="font-display font-black text-lg sm:text-xl text-white leading-snug my-3">${E(c.title)}</h3>
      <div class="flex flex-wrap gap-2 mb-4 min-h-[48px]">${left.map(x => `<button type="button" data-mitem="${x.i}" class="px-3 py-2 rounded-xl border-2 text-sm font-bold transition ${c.sel === x.i ? 'bg-blue-500 border-blue-700 text-white -translate-y-0.5' : c.failed.has(x.i) ? 'bg-rose-50 border-rose-400 text-rose-700' : 'bg-white border-slate-300 text-slate-800 shadow-[0_3px_0_#cbd5e1]'}">${E(x.v)}</button>`).join('') || `<p class="text-sm font-bold text-emerald-600">${T(lg, 'ok')}</p>`}</div>
      <div class="grid ${c.boxes.length > 2 ? 'grid-cols-2 lg:grid-cols-' + c.boxes.length : 'grid-cols-2'} gap-2 sm:gap-3">${c.boxes.map((b, k) => `<button type="button" data-mbox="${b}" class="min-h-[110px] p-2.5 rounded-2xl border-2 ${COLS[k % COLS.length]} text-left flex flex-col gap-1.5 transition hover:brightness-95"><span class="font-display font-black text-sm text-slate-800">${E(setBoxName(c, b))}</span><span class="flex flex-wrap gap-1">${c.items.filter(x => c.put[x.i] === b).map(x => `<span class="px-2 py-0.5 rounded-lg text-[11px] font-bold ${c.failed.has(x.i) ? 'bg-amber-100 text-amber-800' : 'bg-white/80 text-slate-700'}">${E(x.v)}</span>`).join('')}</span></button>`).join('')}</div>
      ${left.length ? '' : `<div class="mt-4">${bigBtn(T(lg, 'next') + ' →', 'clsnext')}</div>`}`);
  }
  const setBoxName = (c, b) => c.boxNames[b];
  function clsBox(b) {
    const c = S.cur; if (c.sel == null) return; const x = c.items[c.sel];
    if (x.b === b) { c.put[x.i] = b; if (!c.failed.has(x.i)) S.ok++; rec(`${c.title}: ${x.v}`, c.failed.has(x.i) ? 'primer intent equivocat' : setBoxName(c, b), setBoxName(c, x.b), !c.failed.has(x.i), c.lbl); c.sel = null; playSFX('correct'); clsRender(); }
    else { c.failed.add(x.i); playSFX('wrong'); const el = body().querySelector(`[data-mbox="${b}"]`); if (el) { el.classList.add('animate-shake'); setTimeout(() => el.classList.remove('animate-shake'), 500); } clsRender(); }
  }

  /* ---------- clics ---------- */
  document.addEventListener('click', e => {
    if (!$('screen-mini') || $('screen-mini').classList.contains('hidden')) return;
    let b;
    if ((b = e.target.closest('[data-mgame]'))) return start(b.dataset.mgame);
    if ((b = e.target.closest('[data-mvf]'))) return vfAnswer(+b.dataset.mvf);
    if ((b = e.target.closest('[data-mcard]'))) return memTap(+b.dataset.mcard);
    if ((b = e.target.closest('[data-mleft]'))) return colTap('L', +b.dataset.mleft);
    if ((b = e.target.closest('[data-mright]'))) return colTap('R', +b.dataset.mright);
    if ((b = e.target.closest('[data-mkey]'))) return hangKey(b.dataset.mkey);
    if ((b = e.target.closest('[data-mtile]'))) return scrTile(+b.dataset.mtile);
    if ((b = e.target.closest('[data-mslot]'))) { const c = S.cur; c.picked.splice(+b.dataset.mslot, 1); playSFX('click'); return scrRender(); }
    if ((b = e.target.closest('[data-mpool]'))) { const c = S.cur; const p = c.pool.find(x => x.i === +b.dataset.mpool); if (p && !c.placed.includes(p)) { c.placed.push(p); playSFX('click'); ordRender(); } return; }
    if ((b = e.target.closest('[data-mplaced]'))) { S.cur.placed.splice(+b.dataset.mplaced, 1); playSFX('click'); return ordRender(); }
    if ((b = e.target.closest('[data-mitem]'))) { S.cur.sel = +b.dataset.mitem; playSFX('click'); return clsRender(); }
    if ((b = e.target.closest('[data-mbox]'))) return clsBox(+b.dataset.mbox);
    if (!(b = e.target.closest('[data-mact]'))) return;
    const a = b.dataset.mact;
    if (a === 'vfnext') { S.i++; vfAsk(); }
    else if (a === 'hangnext') { S.i++; hangNew(); }
    else if (a === 'scrnext') { S.i++; scrNew(); }
    else if (a === 'scrclear') { S.cur.picked = []; scrRender(); }
    else if (a === 'ordcheck') ordCheck();
    else if (a === 'ordnext') { S.round++; ordNew(); }
    else if (a === 'clsnext') { S.round++; clsNew(); }
    else if (a === 'again') start(G.id);
    else if (a === 'gallery') open();
  });
  document.addEventListener('keydown', e => {
    if (!$('screen-mini') || $('screen-mini').classList.contains('hidden') || !G || !S || !S.cur) return;
    if (G.id === 'penjat' && /^\p{L}$/u.test(e.key)) hangKey(e.key.toUpperCase());
  });

  return { open, leave() { G = null; S = null; }, _sets: { pairSets, ordSets, clsSets, roscoWords }, _S: () => S, GAMES };
})();
