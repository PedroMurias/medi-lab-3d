// El Gran Repte 6è: funciona sense connexió un cop obert una vegada.
const V='granrepte-v3';
const CORE=['./','./index.html','./manifest.webmanifest','./q.js','./content.js','./flags.js','./photos.js','./gen.js','./gen2.js','./rosco.js','./en6.js','./en6_en.js','./gr.js','./q_llengues6.js','./q_mates6.js','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;
  e.respondWith(caches.open(V).then(async c=>{const hit=await c.match(r,{ignoreSearch:true});
    const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque'))c.put(r,res.clone());return res}).catch(()=>hit);
    return hit||net}))});
