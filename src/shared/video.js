/* Medi·Lab 3D · vídeos: intro d'entrada + targetes «Mira-ho de veritat» amb pregunta.
   Config a window.VCLIPS = { intro:{src,poster,unit,title,sub}, cards:{ <mode>:[{src,poster,title,cap,q:{t,o:[...],ok:index}}] } }
   Els vídeos són fitxers a part (../clips/) i només es descarreguen quan cal. */
(function(){
const C=window.VCLIPS||{}; if(!C.intro&&!C.cards) return;
const $=s=>document.querySelector(s);
const LAB=(location.pathname.split('/').pop()||'lab').replace('.html','');
const KEY='vintro_'+LAB;
const store=(k,v)=>{ try{ if(v===undefined) return localStorage.getItem('ml_'+k); localStorage.setItem('ml_'+k,v); }catch(e){ return null; } };
const css=document.createElement('style'); css.textContent=`
body.vPlaying canvas{visibility:hidden}
#vIntro{position:fixed;inset:0;z-index:100000;background:#000;color:#e6f1ff;font-family:Inter,"Space Grotesk",system-ui,sans-serif;opacity:1;transition:opacity .6s}
#vIntro.out{opacity:0;pointer-events:none}
#vIntro video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
#vIntro .sh{position:absolute;inset:0;background:linear-gradient(0deg,rgba(0,0,0,.7) 0%,rgba(0,0,0,0) 45%)}
#vIntro .tt{position:absolute;left:clamp(18px,4vw,48px);bottom:clamp(60px,9vh,80px);max-width:70vw;opacity:0;transform:translateY(12px);transition:all .8s .6s}
#vIntro.on .tt{opacity:1;transform:none}
#vIntro .u{font-size:14px;letter-spacing:3px;color:#7fe9ff;text-transform:uppercase}
#vIntro h1{font-size:clamp(34px,6vw,58px);margin:4px 0;font-weight:800;text-shadow:0 4px 20px rgba(0,0,0,.7)}
#vIntro .s{font-size:clamp(15px,2vw,19px);opacity:.92;text-shadow:0 2px 10px #000}
#vIntro .bt{position:absolute;right:clamp(14px,3vw,40px);bottom:clamp(60px,9vh,80px);display:flex;gap:10px}
@media(max-width:640px){#vIntro .bt{top:16px;bottom:auto}#vIntro .vGh,#vIntro .vBtn{padding:8px 12px;font-size:13px}}
#vIntro .bar{position:absolute;left:0;right:0;bottom:0;height:6px;background:rgba(255,255,255,.15)}#vIntro .bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#00e5ff,#2f8cff)}
.vBtn{background:linear-gradient(90deg,#00d4ff,#2f8cff);color:#fff;border:0;border-radius:12px;padding:10px 18px;font-weight:700;font-size:15px;cursor:pointer;font-family:inherit}
.vGh{background:rgba(255,255,255,.1);color:#e6f1ff;border:1px solid rgba(255,255,255,.25);border-radius:12px;padding:9px 16px;font-size:14px;cursor:pointer;font-family:inherit}
.vCard{margin:10px 0 12px;border-radius:14px;background:rgba(0,229,255,.07);border:1px solid rgba(0,229,255,.35);padding:10px;cursor:pointer;transition:transform .15s,border-color .15s}
.vCard:hover{transform:translateY(-2px);border-color:#00e5ff}
.vCard .k{font-size:12px;letter-spacing:2px;color:#7fe9ff;font-weight:700;margin-bottom:8px}
.vCard .k b{color:#b6ff3b;letter-spacing:0;font-weight:600}
.vTh{position:relative;height:118px;border-radius:10px;overflow:hidden;background:#000}
.vTh img{width:100%;height:100%;object-fit:cover;display:block}
.vTh span{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:50px;height:50px;border-radius:50%;background:rgba(0,0,0,.55);border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:20px;color:#fff;padding-left:4px}
.vCard .c{font-size:13px;margin-top:8px;color:#cfe6f5}
.vGal{margin:10px 0 12px;border-radius:14px;background:rgba(0,229,255,.07);border:1px solid rgba(0,229,255,.35);padding:10px}
.vGal .k{font-size:12px;letter-spacing:2px;color:#7fe9ff;font-weight:700;margin-bottom:8px}
.vGal .g{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.vTile{position:relative;border-radius:10px;overflow:hidden;cursor:pointer;background:#000;aspect-ratio:16/10;transition:transform .15s}
.vTile:hover{transform:translateY(-2px)}
.vTile img{width:100%;height:100%;object-fit:cover;display:block}
.vTile b{position:absolute;left:0;right:0;bottom:0;padding:14px 6px 5px;font-size:12px;font-weight:600;background:linear-gradient(0deg,rgba(0,0,0,.85),rgba(0,0,0,0));color:#fff}
.vTile i{position:absolute;top:6px;right:6px;font-style:normal;font-size:11px;background:rgba(0,0,0,.6);border-radius:6px;padding:2px 5px}
.vTile.done i{background:#3a7a1a}
#vModal{position:fixed;inset:0;overflow:auto;z-index:99999;background:rgba(2,6,16,.94);display:flex;align-items:center;justify-content:center;color:#e6f1ff;font-family:Inter,"Space Grotesk",system-ui,sans-serif;padding:16px}
#vModal .w{width:min(900px,92vw)}
#vModal video{width:100%;aspect-ratio:16/9;max-height:62vh;transition:max-height .4s;border-radius:16px;background:#000;display:block;box-shadow:0 20px 60px rgba(0,0,0,.6),0 0 0 1px rgba(0,229,255,.35)}
#vModal.vq video{max-height:40vh}
#vModal .row button{white-space:nowrap}
#vModal .row{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-top:14px;flex-wrap:wrap}
#vModal h3{margin:0;font-size:clamp(17px,2.2vw,21px)}
#vModal .hint{font-size:14px;opacity:.8}
#vModal .ops{display:flex;flex-direction:column;gap:8px;margin-top:12px}
#vModal .ops button{text-align:left;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.2);color:#e6f1ff;border-radius:12px;padding:11px 14px;font-size:15px;cursor:pointer;font-family:inherit}
#vModal .ops button.ok{background:rgba(182,255,59,.18);border-color:#b6ff3b}
#vModal .ops button.ko{background:rgba(255,59,92,.15);border-color:#ff3b5c}
#vModal .fb{min-height:22px;margin-top:8px;font-size:15px}
`; document.head.appendChild(css);

/* ---------- intro ---------- */
function intro(force){
 const I=C.intro; if(!I) return; if(!force&&store(KEY)==='1') return;
 const d=document.createElement('div'); d.id='vIntro';
 d.innerHTML=`<video playsinline muted autoplay preload="auto" ${I.poster?`poster="${I.poster}"`:''}><source src="${I.src}" type="video/mp4"></video><div class="sh"></div>
  <div class="tt"><div class="u">${I.unit||'Medi·Lab 3D'}</div><h1>${I.title||''}</h1><div class="s">${I.sub||''}</div></div>
  <div class="bt"><button class="vGh" data-a="so">🔊 Activa el so</button><button class="vBtn" data-a="go">Entra ⏭</button></div><div class="bar"><i></i></div>`;
 document.body.appendChild(d); document.body.classList.add('vPlaying'); const v=d.querySelector('video'), bar=d.querySelector('.bar i'), so=d.querySelector('[data-a=so]');
 let done=false; const end=()=>{ if(done) return; done=true; store(KEY,'1'); d.classList.add('out'); document.body.classList.remove('vPlaying'); try{v.pause();}catch(e){} setTimeout(()=>d.remove(),650); };
 requestAnimationFrame(()=>d.classList.add('on'));
 v.addEventListener('timeupdate',()=>{ if(v.duration) bar.style.width=(v.currentTime/v.duration*100)+'%'; });
 v.addEventListener('ended',()=>setTimeout(end,500));
 v.addEventListener('error',end,true); v.querySelector('source').addEventListener('error',end);
 const p=v.play(); if(p&&p.catch) p.catch(()=>{});
 setTimeout(()=>{ if(!done&&v.readyState<2) end(); },9000);   /* si no carrega, no fem esperar */
 d.querySelector('[data-a=go]').onclick=end;
 so.onclick=()=>{ v.muted=!v.muted; so.textContent=v.muted?'🔊 Activa el so':'🔇 Treu el so'; if(v.paused) v.play().catch(()=>{}); };
 addEventListener('keydown',function k(e){ if(e.key==='Escape'||e.key==='Enter'){ end(); removeEventListener('keydown',k); } });
}
window.VIDEO_INTRO=()=>intro(true);

/* ---------- targetes «Mira-ho de veritat» ---------- */
const curMode=()=>{ const b=document.querySelector('#modes button.on'); return b?b.dataset.m:''; };
function cardHTML(c,i){ return `<div class="vCard" data-i="${i}" role="button" tabindex="0" aria-label="Mira el vídeo: ${c.title}">
 <div class="k">🎬 MIRA-HO DE VERITAT <b>· ${c.dur||8} s</b></div>
 <div class="vTh">${c.poster?`<img src="${c.poster}" alt="" loading="lazy">`:''}<span>▶</span></div>
 <div class="c">${c.cap||c.title}</div></div>`; }
function decorate(){
 const pb=$('#panel .pbody'); if(!pb||!C.cards) return; const L=C.cards[curMode()]; if(!L||!L.length) return;
 if(pb.querySelector('.vCard,.vGal')) return;
 const anchor=pb.querySelector('p.t')||pb.querySelector('.lead');
 if(L.length>2){ const g=document.createElement('div'); g.className='vGal';
  g.innerHTML=`<div class="k">🎬 MIRA-HO DE VERITAT · ${L.length} VÍDEOS</div><div class="g">${L.map((c,i)=>`<div class="vTile${store('vseen_'+c.title)?' done':''}" data-i="${i}" role="button" tabindex="0" aria-label="Mira el vídeo: ${c.title}">${c.poster?`<img src="${c.poster}" alt="" loading="lazy">`:''}<i>${store('vseen_'+c.title)?'✔':'▶ '+(c.dur||8)+' s'}</i><b>${c.title}</b></div>`).join('')}</div>`;
  g.querySelectorAll('.vTile').forEach(t=>{ const c=L[+t.dataset.i]; t.onclick=()=>openClip(c); t.onkeydown=e=>{ if(e.key==='Enter') openClip(c); }; });
  if(anchor) anchor.after(g); else pb.prepend(g); return; }
 L.forEach((c,i)=>{ const w=document.createElement('div'); w.innerHTML=cardHTML(c,i); const el=w.firstElementChild;
  el.onclick=()=>openClip(c); el.onkeydown=e=>{ if(e.key==='Enter') openClip(c); };
  if(anchor) anchor.after(el); else pb.prepend(el); });
}
function openClip(c){
 if(window.UX&&UX.sfx&&UX.sfx.tap) UX.sfx.tap();
 const m=document.createElement('div'); m.id='vModal';
 m.innerHTML=`<div class="w"><video controls playsinline autoplay preload="auto" ${c.poster?`poster="${c.poster}"`:''}><source src="${c.src}" type="video/mp4"></video>
  <div class="row"><div><h3>${c.q?'🤔 '+c.q.t:c.title}</h3><div class="hint">${c.q?'Mira el vídeo i després tria la resposta.':(c.cap||'')}</div></div>
  <div style="display:flex;gap:8px"><button class="vGh" data-a="re">↻ Torna-ho a veure</button><button class="vBtn" data-a="x">Tanca ✕</button></div></div>
  <div class="ops"></div><div class="fb"></div></div>`;
 document.body.appendChild(m); document.body.classList.add('vPlaying'); const v=m.querySelector('video'), ops=m.querySelector('.ops'), fb=m.querySelector('.fb');
 const close=()=>{ try{v.pause();}catch(e){} m.remove(); document.body.classList.remove('vPlaying'); };
 m.querySelector('[data-a=x]').onclick=close; m.onclick=e=>{ if(e.target===m) close(); };
 m.querySelector('[data-a=re]').onclick=()=>{ v.currentTime=0; v.play().catch(()=>{}); };
 addEventListener('keydown',function k(e){ if(e.key==='Escape'){ close(); removeEventListener('keydown',k); } });
 v.querySelector('source').addEventListener('error',()=>{ fb.textContent='No s\'ha pogut carregar el vídeo. Comprova la connexió.'; });
 const ask=()=>{ if(!c.q||ops.childElementCount) return; let tried=false; m.classList.add('vq');
  c.q.o.forEach((t,i)=>{ const b=document.createElement('button'); b.textContent=t; ops.appendChild(b);
   b.onclick=()=>{ if(i===c.q.ok){ b.classList.add('ok'); store('vseen_'+c.title,'1'); fb.innerHTML='✅ <b>Molt bé!</b> '+(c.q.why||''); ops.querySelectorAll('button').forEach(x=>x.disabled=true);
      if(window.UX){ const k='🎬 '+c.title; if(UX.COL&&UX.COL.items&&!UX.COL.items.find(x=>x.k===k)) UX.COL.items.push({k,n:c.title,ic:'🎬'}); if(!UX.discover(k)&&UX.sfx&&UX.sfx.ok) UX.sfx.ok(); if(UX.logResult) UX.logResult('Vídeo: '+c.title,tried?5:10); }
     } else { b.classList.add('ko'); b.disabled=true; tried=true; fb.textContent='Gairebé! Torna a mirar el vídeo i prova una altra resposta.'; if(window.UX&&UX.sfx&&UX.sfx.ko) UX.sfx.ko(); } };
  }); };
 v.addEventListener('ended',ask); v.addEventListener('timeupdate',()=>{ if(v.duration&&v.currentTime>v.duration-1.2) ask(); });
}
function initCards(){
 if(!C.cards) return; const pb=$('#panel .pbody'); if(!pb){ setTimeout(initCards,500); return; }
 /* els vídeos amb pregunta compten com a descobriments */
 const addItems=()=>{ if(!window.UX||!UX.COL||!UX.COL.items||!UX.COL.items.length){ setTimeout(addItems,600); return; }
  Object.values(C.cards).flat().forEach(c=>{ if(c.q){ const k='🎬 '+c.title; if(!UX.COL.items.find(x=>x.k===k)) UX.COL.items.push({k,n:c.title,ic:'🎬'}); } }); };
 addItems();
 new MutationObserver(()=>decorate()).observe(pb,{childList:true,subtree:true});
 const nav=$('#modes'); if(nav) nav.addEventListener('click',()=>setTimeout(decorate,60));
 decorate();
}
/* objectes amb vídeo real: el botó «càmera lenta» obre el vídeo de veritat */
function hookObjects(){
 if(!C.cards) return; const byName={}; Object.values(C.cards).flat().forEach(c=>{ byName[c.title]=c; });
 const relabel=()=>document.querySelectorAll('button[onclick*="openSlow("]').forEach(b=>{ const m=(b.getAttribute('onclick')||'').match(/openSlow\('([^']+)'\)/); if(m&&byName[m[1]]&&!b.dataset.vreal){ b.dataset.vreal='1'; b.innerHTML='🎬 Mira-ho de veritat'; b.removeAttribute('onclick'); b.onclick=()=>openClip(byName[m[1]]); } });
 new MutationObserver(relabel).observe(document.body,{childList:true,subtree:true}); relabel();
 const wrap=()=>{ const o=window.openSlow; if(typeof o!=='function'||o.__v) return; const w=function(name){ return byName[name]?openClip(byName[name]):o.apply(this,arguments); }; w.__v=1; window.openSlow=w; }; wrap(); setTimeout(wrap,1500);
}
/* botó per tornar a veure la intro, a l'ajuda */
function helpBtn(){ if(!C.intro) return; const g=document.querySelector('.hgo'); if(!g||document.querySelector('.vReplay')) return;
 const b=document.createElement('button'); b.className='vGh vReplay'; b.style.margin='0 8px 0 0'; b.textContent='🎬 Torna a veure el vídeo d\'entrada';
 b.onclick=()=>{ const h=document.querySelector('#help'); if(h) h.classList.remove('show'); intro(true); }; g.before(b); }
intro(false);
if(document.readyState==='loading') addEventListener('DOMContentLoaded',()=>{ initCards(); helpBtn(); hookObjects(); }); else { initCards(); helpBtn(); hookObjects(); }
})();
