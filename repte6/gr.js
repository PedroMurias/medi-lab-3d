/* El Gran Repte 6è · comptes d'Explora, resultats i classificació (Firebase del projecte balmesonlinecom)
   Només funciona quan el joc està en una web pròpia (GitHub Pages / Cloudflare). Dins de Claude no hi ha connexió a Firebase. */
window.GR = (function () {
  const CFG = { apiKey: "AIzaSyCtj2tZQdRfrEscevXyzeMwQiaOY57iGAU", authDomain: "balmesonlinecom.firebaseapp.com", projectId: "balmesonlinecom",
    storageBucket: "balmesonlinecom.firebasestorage.app", messagingSenderId: "740748900490", appId: "1:740748900490:web:3b1c724d0143c683245573" };
  const DOMAIN = 'balmesonline.com', SDK = 'https://www.gstatic.com/firebasejs/10.12.2/', KEY = 'egr6_acc';
  let fb = null, auth = null, db = null, ACC = null, listeners = [], lastErr = '';
  try { ACC = JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { ACC = null; }

  const loadScript = src => new Promise((ok, ko) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => ko(new Error('script ' + src)); document.head.appendChild(s); });
  async function sdk() {
    if (db) return;
    await loadScript(SDK + 'firebase-app-compat.js');
    await Promise.all([loadScript(SDK + 'firebase-auth-compat.js'), loadScript(SDK + 'firebase-firestore-compat.js')]);
    fb = window.firebase; if (!fb.apps.length) fb.initializeApp(CFG); auth = fb.auth(); db = fb.firestore();
  }
  const nameOf = em => String(em || '').split('@')[0].split(/[._-]+/).filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(ACC)); } catch (e) { /* sense emmagatzematge */ } };
  const emit = () => listeners.forEach(f => { try { f(ACC); } catch (e) { /* */ } });

  /* ---- entrada (mateix flux que Explora: 1r cop crea el compte i comprova la contrasenya amb la llista del mestre) ---- */
  async function login(em, pw) {
    em = String(em || '').trim().toLowerCase(); pw = String(pw || '').trim().toLowerCase();
    if (!em.includes('@')) em += '@' + DOMAIN;
    if (!pw) throw new Error('Escriu la contrasenya.');
    await sdk();
    const BAD = 'El correu o la contrasenya no són correctes. Mira l\'agenda.';
    let u = null;
    try { u = (await auth.signInWithEmailAndPassword(em, pw)).user; }
    catch (e) {
      const c = (e && e.code) || '';
      if (!/invalid-credential|wrong-password|user-not-found|invalid-login/.test(c)) throw new Error(/too-many-requests/.test(c) ? 'Massa intents. Torna-ho a provar d\'aquí a una estona.' : /network/.test(c) ? 'No hi ha connexió.' : 'No s\'ha pogut entrar (' + c + ').');
      try { u = (await auth.createUserWithEmailAndPassword(em, pw)).user; }
      catch (e2) { throw new Error(/email-already-in-use|weak-password/.test((e2 && e2.code) || '') ? BAD : 'No s\'ha pogut entrar (' + (e2.code || e2.message) + ').'); }
      try { await db.collection('claims').doc(u.uid).set({ email: em, pw, t: Date.now() }); }
      catch (e3) { try { await u.delete(); } catch (x) { try { await auth.signOut(); } catch (y) { /* */ } } throw new Error(BAD); }
    }
    return afterLogin(u);
  }
  /* ---- entrada amb Google (mestres i administradors, com a Explora) ---- */
  async function loginGoogle() {
    await sdk();
    const p = new fb.auth.GoogleAuthProvider(); p.setCustomParameters({ prompt: 'select_account' });
    let u = null;
    try { u = (await auth.signInWithPopup(p)).user; }
    catch (e) { const c = (e && e.code) || '';
      if (/popup-blocked/.test(c)) throw new Error('El navegador ha bloquejat la finestra de Google. Permet les finestres emergents per a aquesta web i torna-ho a provar.');
      if (/operation-not-supported|web-storage-unsupported/.test(c)) { await auth.signInWithRedirect(p); return null; }
      if (/popup-closed|cancelled/.test(c)) return null;
      throw new Error('No s\'ha pogut entrar amb Google (' + c + ').'); }
    const acc = await afterLogin(u);
    if (!acc.teacher && !acc.email.endsWith('@' + DOMAIN)) { await logout(); throw new Error('Aquest compte de Google (' + acc.email + ') no és de cap mestre/a donat d\'alta a Explora.'); }
    return acc;
  }
  async function afterLogin(u) {
    const email = (u.email || '').toLowerCase();
    let teacher = false, admin = false, name = nameOf(email), cls = null, clsName = '';
    const ADMINS = ['pmurias6@gmail.com', 'pedro.murias@balmesonline.com'];
    try { const t = await db.collection('teachers').doc(email).get(); teacher = t.exists; admin = teacher && !!((t.data() || {}).admin); } catch (e) { /* */ }
    if (ADMINS.includes(email)) { teacher = true; admin = true; }
    if (!teacher) {
      let r = null; try { r = await db.collection('roster').doc(email).get(); } catch (e) { /* */ }
      if (r && r.exists) { const d = r.data(); if (d.name) name = d.name; if (d.classId) cls = d.classId; }
      else { try { const s = await db.collection('students').doc(u.uid).get(); if (s.exists && s.data().classId) cls = s.data().classId; } catch (e) { /* */ } }
    }
    let noDuels = false;
    if (cls) { try { const c = await db.collection('classes').doc(cls).get(); if (c.exists) { clsName = c.data().name || c.data().course || cls; noDuels = !!c.data().noDuels; } } catch (e) { /* */ } }
    ACC = { uid: u.uid, email, name, cls, clsName, teacher, admin, noDuels };
    save(); emit(); return ACC;
  }
  async function logout() { try { await sdk(); await auth.signOut(); } catch (e) { /* */ } ACC = null; save(); emit(); }
  /* Reprèn la sessió: compte desat, o tornada de l'entrada amb Google per redirecció (mòbil) */
  async function resume() {
    try { await sdk();
      try { const rr = await auth.getRedirectResult(); if (rr && rr.user) { const acc = await afterLogin(rr.user); if (!acc.teacher && !acc.email.endsWith('@' + DOMAIN)) { await logout(); ACC = null; } return ACC; } } catch (e) { lastErr = 'Google: ' + ((e && e.code) || e.message || e); }
      const u = await new Promise(res => { const off = auth.onAuthStateChanged(x => { off(); res(x); }); });
      if (u) return afterLogin(u);
    } catch (e) { /* sense connexió: es manté el compte desat */ }
    return ACC;
  }

  /* ---- setmana escolar (clau AAAA-WW) ---- */
  function weekKey(d = new Date()) { const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = x.getUTCDay() || 7; x.setUTCDate(x.getUTCDate() + 4 - day); const y = x.getUTCFullYear(); const w = Math.ceil((((x - Date.UTC(y, 0, 1)) / 864e5) + 1) / 7); return y + '-' + String(w).padStart(2, '0'); }
  function monthKey(d = new Date()) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
  const hash = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };

  /* ---- punts: per encerts, mai per velocitat ni per or. +15 per jugar. ---- */
  /* Nivell difícil: +25 % (les preguntes són d'ampliació). Fàcil i normal: igual. */
  /* Minijocs: tenen llargades diferents, així que puntuen pel percentatge d'encerts (com una Ràfega de 10). A Vertader o fals es descompta l'atzar. */
  function points(st) {
    let base;
    if (st.mode === 'mini') { const p = st.adj != null ? st.adj : (st.total ? st.ok / st.total : 0); base = 15 + Math.round(100 * p) + (st.total && st.ok === st.total ? 20 : 0); }
    else base = 15 + 10 * (st.ok || 0) + 4 * (st.rosco || 0) + (st.total && st.ok === st.total ? 20 : 0);
    return Math.round(base * (st.lvl === 'dificil' ? 1.25 : 1));
  }

  /* ---- registrar una partida: historial + totals de l'alumne ---- */
  const today = () => new Date().toISOString().slice(0, 10);
  const DUEL_CAP = 5; // només els 5 primers duels/reptes del dia sumen punts
  async function record(st) {
    if (!ACC || ACC.teacher) return null;
    await sdk();
    const isDuel = st.mode === 'duel' || st.mode === 'repte';
    let pts = points(st) + (st.bonus || 0);
    const wk = weekKey(), mk = monthKey(), now = Date.now();
    const ref = db.collection('gr_users').doc(ACC.uid), gref = ref.collection('games').doc();
    await db.runTransaction(async tx => {
      const s = await tx.get(ref); const d = s.exists ? s.data() : {};
      const dN = d.dDay === today() ? (d.dN || 0) : 0;
      if (isDuel && dN >= DUEL_CAP) pts = 0;
      tx.set(gref, { t: now, mode: st.mode, lvl: st.lvl, src: st.src || [], ok: st.ok || 0, total: st.total || 0, rosco: st.rosco == null ? null : st.rosco, gold: st.gold == null ? null : st.gold, streak: st.streak || 0, pts,
        answers: (st.answers || []).slice(0, 60), roscoA: st.roscoA || null, vs: st.vs || null, mg: st.mg || null, res: st.res || null, capped: isDuel && dN >= DUEL_CAP });
      const duelX = isDuel ? { dDay: today(), dN: dN + 1, dW: (d.dW || 0) + (st.res === 'W' ? 1 : 0), dD: (d.dD || 0) + (st.res === 'D' ? 1 : 0), dL: (d.dL || 0) + (st.res === 'L' ? 1 : 0) } : {};
      const topics = d.topics || {}, wrong = d.wrong || {};
      (st.perTopic || []).forEach(([k, ok, n]) => { const t = topics[k] || { ok: 0, n: 0 }; t.ok += ok; t.n += n; topics[k] = t; });
      (st.wrongQ || []).forEach(q => { const id = hash(q); wrong[id] = { q: q.slice(0, 120), n: ((wrong[id] || {}).n || 0) + 1 }; });
      const keep = Object.entries(wrong).sort((a, b) => b[1].n - a[1].n).slice(0, 40); const wrong2 = Object.fromEntries(keep);
      tx.set(ref, { uid: ACC.uid, email: ACC.email, name: ACC.name, cls: ACC.cls || null, updated: now,
        games: (d.games || 0) + 1, pts: (d.pts || 0) + pts, ok: (d.ok || 0) + (st.ok || 0), total: (d.total || 0) + (st.total || 0),
        wk, ptsW: (d.wk === wk ? (d.ptsW || 0) : 0) + pts, gamesW: (d.wk === wk ? (d.gamesW || 0) : 0) + 1,
        mk, ptsM: (d.mk === mk ? (d.ptsM || 0) : 0) + pts,
        bestRosco: Math.max(d.bestRosco || 0, st.rosco || 0), bestGold: Math.max(d.bestGold || 0, st.gold || 0),
        topics, wrong: wrong2, ...duelX }, { merge: true });
    });
    return pts;
  }
  /* Resultat d'un repte que vaig enviar jo (la partida ja es va guardar quan el vaig jugar): només bonus i V/E/D */
  async function duelBonus(res, bonus) {
    if (!ACC || ACC.teacher) return 0; await sdk();
    const ref = db.collection('gr_users').doc(ACC.uid), wk = weekKey(), mk = monthKey();
    await db.runTransaction(async tx => { const s = await tx.get(ref); const d = s.exists ? s.data() : {};
      tx.set(ref, { uid: ACC.uid, email: ACC.email, name: ACC.name, cls: ACC.cls || null, pts: (d.pts || 0) + bonus,
        wk, ptsW: (d.wk === wk ? (d.ptsW || 0) : 0) + bonus, mk, ptsM: (d.mk === mk ? (d.ptsM || 0) : 0) + bonus,
        dW: (d.dW || 0) + (res === 'W' ? 1 : 0), dD: (d.dD || 0) + (res === 'D' ? 1 : 0), dL: (d.dL || 0) + (res === 'L' ? 1 : 0) }, { merge: true }); });
    return bonus;
  }

  /* ================= DUELS ================= */
  const meStub = () => ({ uid: ACC.uid, email: ACC.email, name: ACC.name, cls: ACC.cls || null });
  /* qui està connectat: es marca en obrir el joc i cada 2 minuts mentre la pestanya és visible */
  async function presence(extra) { if (!ACC || ACC.teacher) return; try { await sdk(); await db.collection('gr_users').doc(ACC.uid).set({ ...meStub(), seen: Date.now(), ...(extra || {}) }, { merge: true }); } catch (e) { /* */ } }
  const setAcceptCh = on => presence({ acceptCh: !!on });
  async function classMates() { if (!ACC || !ACC.cls) return []; await sdk(); const q = await db.collection('gr_users').where('cls', '==', ACC.cls).get(); const a = []; q.forEach(d => a.push(d.data())); return a.filter(x => x.uid !== ACC.uid); }
  const LET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  async function duelCreate(data) {
    await sdk();
    for (let i = 0; i < 8; i++) {
      const code = Array.from({ length: 4 }, () => LET[Math.floor(Math.random() * LET.length)]).join('');
      const ref = db.collection('gr_duels').doc(code);
      try { const ex = await ref.get(); if (ex.exists) continue; } catch (e) { /* */ }
      await ref.set({ code, cls: ACC.cls || '', hostUid: ACC.uid, hostName: ACC.name, hostAv: data.av || '', guestUid: null, guestName: '', guestAv: '',
        invUid: data.invUid || null, invName: data.invName || '', qs: data.qs, n: data.n, cfg: data.cfg, st: 'lobby', aH: [], aG: [], seenH: Date.now(), seenG: 0, goneUid: null, t: Date.now() });
      return code;
    }
    throw new Error('No s\'ha pogut crear el duel. Torna-ho a provar.');
  }
  async function duelJoin(code, av) {
    await sdk(); code = String(code || '').trim().toUpperCase();
    const ref = db.collection('gr_duels').doc(code);
    return db.runTransaction(async tx => {
      const s = await tx.get(ref); if (!s.exists) throw new Error('No hi ha cap duel amb aquest codi.');
      const d = s.data();
      if (d.hostUid === ACC.uid) throw new Error('Aquest duel l\'has creat tu. Espera que s\'hi apunti el rival.');
      if (d.st !== 'lobby' || d.guestUid) throw new Error('Aquest duel ja ha començat o s\'ha acabat.');
      if (Date.now() - d.t > 2 * 3600e3) throw new Error('Aquest codi ha caducat.');
      tx.update(ref, { guestUid: ACC.uid, guestName: ACC.name, guestAv: av || '', st: 'play', seenG: Date.now() });
      return code;
    });
  }
  async function duelWatch(code, cb) { await sdk(); return db.collection('gr_duels').doc(code).onSnapshot(s => cb(s.exists ? s.data() : null), () => cb(null)); }
  async function duelSet(code, fields) { await sdk(); return db.collection('gr_duels').doc(code).update(fields); }
  async function watchInvites(cb) { if (!ACC) return () => {}; await sdk(); return db.collection('gr_duels').where('invUid', '==', ACC.uid).where('st', '==', 'lobby').onSnapshot(q => { const a = []; q.forEach(d => a.push(d.data())); cb(a.filter(x => Date.now() - x.t < 15 * 60e3)); }, () => cb([])); }
  /* ---- reptes (cadascú quan pot) ---- */
  async function chalCreate(c) { await sdk(); const ref = db.collection('gr_chal').doc(); await ref.set({ ...c, id: ref.id, fromUid: ACC.uid, fromName: ACC.name, cls: ACC.cls || '', st: 'pending', aTo: null, okTo: null, t: Date.now(), exp: Date.now() + 3 * 864e5, seenFrom: false }); return ref.id; }
  async function chalList() {
    if (!ACC) return { sent: [], got: [] }; await sdk();
    const [a, b] = await Promise.all([db.collection('gr_chal').where('fromUid', '==', ACC.uid).limit(40).get(), db.collection('gr_chal').where('toUid', '==', ACC.uid).limit(40).get()]);
    const sent = [], got = []; a.forEach(d => sent.push(d.data())); b.forEach(d => got.push(d.data()));
    const by = (x, y) => y.t - x.t; return { sent: sent.sort(by), got: got.sort(by) };
  }
  /* ---- escoltes en directe (Firestore només cobra una lectura per document que canvia) ---- */
  async function watchChal(cb) {
    if (!ACC) return () => {}; await sdk();
    let s = [], g = []; const by = (x, y) => y.t - x.t, emit = () => cb({ sent: s.slice().sort(by), got: g.slice().sort(by) });
    const u1 = db.collection('gr_chal').where('fromUid', '==', ACC.uid).limit(40).onSnapshot(q => { s = []; q.forEach(d => s.push(d.data())); emit(); }, () => {});
    const u2 = db.collection('gr_chal').where('toUid', '==', ACC.uid).limit(40).onSnapshot(q => { g = []; q.forEach(d => g.push(d.data())); emit(); }, () => {});
    return () => { u1(); u2(); };
  }
  async function watchClass(cb) {
    if (!ACC || !ACC.cls) return () => {}; await sdk();
    return db.collection('gr_users').where('cls', '==', ACC.cls).onSnapshot(q => { const rows = []; q.forEach(d => { const x = d.data(); if (x.games) rows.push(x); }); cb(rows); }, () => {});
  }
  async function chalSet(id, fields) { await sdk(); return db.collection('gr_chal').doc(id).update(fields); }
  async function setClassDuels(cid, on) { await sdk(); return db.collection('classes').doc(cid).update({ noDuels: !on }); }

  /* ---- lectures per al tauler ---- */
  async function classBoard(cls) {
    await sdk(); const q = await db.collection('gr_users').where('cls', '==', cls).get();
    const rows = []; q.forEach(d => { const x = d.data(); if (x.games) rows.push(x); });
    const wk = weekKey(), mk = monthKey();
    rows.forEach(r => { if (r.wk !== wk) { r.ptsW = 0; r.gamesW = 0; } if (r.mk !== mk) r.ptsM = 0; });
    return rows;
  }
  async function myGames(limit = 30) { await sdk(); if (!ACC) return []; const q = await db.collection('gr_users').doc(ACC.uid).collection('games').orderBy('t', 'desc').limit(limit).get(); const a = []; q.forEach(d => a.push(d.data())); return a; }
  async function me() { await sdk(); if (!ACC) return null; const d = await db.collection('gr_users').doc(ACC.uid).get(); return d.exists ? d.data() : null; }
  /* ---- fitxa d'un alumne (mestres i admin; les regles de Firestore ho limiten a teachers/) ---- */
  async function student(uid) { await sdk(); if (!ACC || !ACC.teacher) return null; const d = await db.collection('gr_users').doc(uid).get(); return d.exists ? d.data() : null; }
  async function studentGames(uid, limit = 40) { await sdk(); if (!ACC || !ACC.teacher) return []; const q = await db.collection('gr_users').doc(uid).collection('games').orderBy('t', 'desc').limit(limit).get(); const a = []; q.forEach(d => a.push({ id: d.id, ...d.data() })); return a; }
  async function teacherClasses() { await sdk(); if (!ACC || !ACC.teacher) return []; const out = []; const q = ACC.admin ? await db.collection('classes').get() : await db.collection('classes').where('teacher', '==', ACC.email).get(); q.forEach(d => out.push({ id: d.id, ...d.data() })); return out; }

  return { get acc() { return ACC; }, get lastErr() { return lastErr; }, preload: () => sdk().catch(() => {}), login, loginGoogle, logout, resume, record, points, duelBonus,
    presence, setAcceptCh, classMates, duelCreate, duelJoin, duelWatch, duelSet, watchInvites, chalCreate, chalList, chalSet, setClassDuels, watchChal, watchClass, classBoard, myGames, me, student, studentGames, teacherClasses, weekKey, onChange: f => listeners.push(f), available: () => location.protocol === 'https:' && !/claude\.ai|claudeusercontent/.test(location.hostname) };
})();
