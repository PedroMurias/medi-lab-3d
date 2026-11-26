/* El Gran Repte 6è · comptes d'Explora, resultats i classificació (Firebase del projecte balmesonlinecom)
   Només funciona quan el joc està en una web pròpia (GitHub Pages / Cloudflare). Dins de Claude no hi ha connexió a Firebase. */
window.GR = (function () {
  const CFG = { apiKey: "AIzaSyCtj2tZQdRfrEscevXyzeMwQiaOY57iGAU", authDomain: "balmesonlinecom.firebaseapp.com", projectId: "balmesonlinecom",
    storageBucket: "balmesonlinecom.firebasestorage.app", messagingSenderId: "740748900490", appId: "1:740748900490:web:3b1c724d0143c683245573" };
  const DOMAIN = 'balmesonline.com', SDK = 'https://www.gstatic.com/firebasejs/10.12.2/', KEY = 'egr6_acc';
  let fb = null, auth = null, db = null, ACC = null, listeners = [];
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
      if (/popup-blocked|operation-not-supported|web-storage-unsupported/.test(c)) { await auth.signInWithRedirect(p); return null; }
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
    if (cls) { try { const c = await db.collection('classes').doc(cls).get(); if (c.exists) clsName = c.data().name || c.data().course || cls; } catch (e) { /* */ } }
    ACC = { uid: u.uid, email, name, cls, clsName, teacher, admin };
    save(); emit(); return ACC;
  }
  async function logout() { try { await sdk(); await auth.signOut(); } catch (e) { /* */ } ACC = null; save(); emit(); }
  async function resume() { if (!ACC) return null; try { await sdk(); const u = await new Promise(res => { const off = auth.onAuthStateChanged(x => { off(); res(x); }); }); if (u) return afterLogin(u); } catch (e) { /* sense connexió: es manté el compte desat */ } return ACC; }

  /* ---- setmana escolar (clau AAAA-WW) ---- */
  function weekKey(d = new Date()) { const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = x.getUTCDay() || 7; x.setUTCDate(x.getUTCDate() + 4 - day); const y = x.getUTCFullYear(); const w = Math.ceil((((x - Date.UTC(y, 0, 1)) / 864e5) + 1) / 7); return y + '-' + String(w).padStart(2, '0'); }
  function monthKey(d = new Date()) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
  const hash = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };

  /* ---- punts: per encerts, mai per velocitat ni per or. +15 per jugar. ---- */
  /* Nivell difícil: +25 % (les preguntes són d'ampliació). Fàcil i normal: igual. */
  function points(st) { const base = 15 + 10 * (st.ok || 0) + 4 * (st.rosco || 0) + (st.total && st.ok === st.total ? 20 : 0); return Math.round(base * (st.lvl === 'dificil' ? 1.25 : 1)); }

  /* ---- registrar una partida: historial + totals de l'alumne ---- */
  async function record(st) {
    if (!ACC || ACC.teacher) return null;
    await sdk();
    const pts = points(st), wk = weekKey(), mk = monthKey(), now = Date.now();
    const ref = db.collection('gr_users').doc(ACC.uid);
    await ref.collection('games').add({ t: now, mode: st.mode, lvl: st.lvl, src: st.src || [], ok: st.ok || 0, total: st.total || 0, rosco: st.rosco == null ? null : st.rosco, gold: st.gold == null ? null : st.gold, streak: st.streak || 0, pts,
      answers: (st.answers || []).slice(0, 60), roscoA: st.roscoA || null });
    await db.runTransaction(async tx => {
      const s = await tx.get(ref); const d = s.exists ? s.data() : {};
      const topics = d.topics || {}, wrong = d.wrong || {};
      (st.perTopic || []).forEach(([k, ok, n]) => { const t = topics[k] || { ok: 0, n: 0 }; t.ok += ok; t.n += n; topics[k] = t; });
      (st.wrongQ || []).forEach(q => { const id = hash(q); wrong[id] = { q: q.slice(0, 120), n: ((wrong[id] || {}).n || 0) + 1 }; });
      const keep = Object.entries(wrong).sort((a, b) => b[1].n - a[1].n).slice(0, 40); const wrong2 = Object.fromEntries(keep);
      tx.set(ref, { uid: ACC.uid, email: ACC.email, name: ACC.name, cls: ACC.cls || null, updated: now,
        games: (d.games || 0) + 1, pts: (d.pts || 0) + pts, ok: (d.ok || 0) + (st.ok || 0), total: (d.total || 0) + (st.total || 0),
        wk, ptsW: (d.wk === wk ? (d.ptsW || 0) : 0) + pts, gamesW: (d.wk === wk ? (d.gamesW || 0) : 0) + 1,
        mk, ptsM: (d.mk === mk ? (d.ptsM || 0) : 0) + pts,
        bestRosco: Math.max(d.bestRosco || 0, st.rosco || 0), bestGold: Math.max(d.bestGold || 0, st.gold || 0),
        topics, wrong: wrong2 }, { merge: true });
    });
    return pts;
  }

  /* ---- lectures per al tauler ---- */
  async function classBoard(cls) {
    await sdk(); const q = await db.collection('gr_users').where('cls', '==', cls).get();
    const rows = []; q.forEach(d => rows.push(d.data()));
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

  return { get acc() { return ACC; }, login, loginGoogle, logout, resume, record, points, classBoard, myGames, me, student, studentGames, teacherClasses, weekKey, onChange: f => listeners.push(f), available: () => location.protocol === 'https:' && !/claude\.ai|claudeusercontent/.test(location.hostname) };
})();
