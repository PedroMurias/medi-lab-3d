// El Gran Repte 6è: primer intenta la xarxa (per tenir sempre l'última versió) i, sense connexió, fa servir la còpia guardada.
const V='granrepte-v19';
const CORE=['./','./index.html','./manifest.webmanifest','./q.js','./content.js','./flags.js','./photos.js','./gen.js','./gen2.js','./rosco.js','./en6.js','./en6_en.js','./gr.js','./duel.js','./q_llengues6.js','./q_mates6.js','./bg.jpg','./bg-v.jpg','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||!r.url.startsWith(self.location.origin))return;
  e.respondWith(caches.open(V).then(async c=>{
    try{const res=await fetch(r);if(res&&res.ok)c.put(r,res.clone());return res}
    catch(err){const hit=await c.match(r,{ignoreSearch:true});if(hit)return hit;throw err}}))});
