/* MediLab UX kit: so, guia d'entrada, col·lecció, mode pissarra, dibuix, pausa, dreceres, alumne. Compartit per tots els laboratoris. */
window.UX=(function(){
const $=s=>document.querySelector(s), K=window.Kit;
let PFX='medilab_ux_'; function store(k,v){ if(K&&K.store) return K.store(k,v); try{ if(v===undefined) return localStorage.getItem(PFX+k); localStorage.setItem(PFX+k,String(v)); }catch(e){ return null; } }
/* ---------- SO (WebAudio, sense fitxers) ---------- */
let AC=null, muted=store('mute')==='1';
function ac(){ if(!AC){ try{ AC=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } if(AC&&AC.state==='suspended') AC.resume(); return AC; }
function tone(f,t0,dur,type='sine',g=.08,slide=0){ const c=ac(); if(!c||muted) return; const o=c.createOscillator(), v=c.createGain(); o.type=type; o.frequency.setValueAtTime(f,c.currentTime+t0); if(slide) o.frequency.exponentialRampToValueAtTime(slide,c.currentTime+t0+dur); v.gain.setValueAtTime(0,c.currentTime+t0); v.gain.linearRampToValueAtTime(g,c.currentTime+t0+.01); v.gain.exponentialRampToValueAtTime(.0001,c.currentTime+t0+dur); o.connect(v).connect(c.destination); o.start(c.currentTime+t0); o.stop(c.currentTime+t0+dur+.05); }
const sfx={
 tap(){ tone(660,0,.08,'sine',.05); },
 ok(){ tone(523,0,.12,'triangle',.07); tone(784,.1,.18,'triangle',.07); },
 ko(){ tone(220,0,.18,'square',.03,180); },
 found(){ tone(659,0,.1,'triangle',.06); tone(880,.09,.1,'triangle',.06); tone(1319,.18,.25,'triangle',.07); },
 star(){ [523,659,784,1047].forEach((f,i)=>tone(f,i*.07,.2,'triangle',.06)); },
 tick(){ tone(1200,0,.03,'sine',.03); },
 mute(m){ muted=m===undefined?!muted:m; store('mute',muted?'1':'0'); return muted; }, get muted(){ return muted; }
};
/* ---------- TOAST ---------- */
let toastT=null;
function toast(msg,ic='',ms=2200){ let t=$('#uxToast'); if(!t){ t=document.createElement('div'); t.id='uxToast'; document.body.appendChild(t); } t.innerHTML=(ic?`<b>${ic}</b>`:'')+`<span>${msg}</span>`; t.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'),ms); }
/* ---------- CONFETI (canvas 2D breu) ---------- */
function confetti(n=80){ const cv=document.createElement('canvas'); cv.className='uxConf'; cv.width=innerWidth; cv.height=innerHeight; document.body.appendChild(cv); const g=cv.getContext('2d'); const C=['#00e5ff','#b6ff3b','#ffd23f','#ff3b5c','#2f8cff','#fff'];
 const P=Array.from({length:n},()=>({x:innerWidth/2+(Math.random()-.5)*200,y:innerHeight*.4,vx:(Math.random()-.5)*14,vy:-Math.random()*12-4,r:4+Math.random()*5,c:C[Math.random()*C.length|0],a:Math.random()*6,w:Math.random()*.3}));
 let t0=performance.now(); (function f(now){ const dt=(now-t0)/1000; t0=now; g.clearRect(0,0,cv.width,cv.height); let alive=0; for(const p of P){ p.vy+=22*dt; p.x+=p.vx; p.y+=p.vy; p.a+=p.w; if(p.y<cv.height+20) alive++; g.save(); g.translate(p.x,p.y); g.rotate(p.a); g.fillStyle=p.c; g.fillRect(-p.r,-p.r*.6,p.r*2,p.r*1.2); g.restore(); } if(alive) requestAnimationFrame(f); else cv.remove(); })(t0); setTimeout(()=>cv.remove(),4000); }
/* ---------- ALUMNE (nom + avatar) ---------- */
const AVS=['🦊','🐼','🦉','🐸','🦋','🐬','🦁','🐙','🦄','🐢','🦜','🐨'];
function student(){ return {name:store('st_name')||'',av:store('st_av')||''}; }
function askStudent(force,cb){ const s=student(); if(s.name&&!force){ cb&&cb(s); return; }
 const d=document.createElement('div'); d.id='uxStudent'; d.innerHTML=`<div class="glass"><h2>Qui ets?</h2><p>Escriu el teu nom i tria un avatar. Així guardem els teus descobriments i les estrelles dels reptes.</p><input id="stName" maxlength="24" placeholder="El teu nom" value="${s.name.replace(/"/g,'')}"><div class="avs">${AVS.map(a=>`<button data-a="${a}" class="${a===s.av?'on':''}">${a}</button>`).join('')}</div><div class="row"><button class="big" id="stGo">Endavant!</button><button class="mini" id="stSkip">Ara no</button></div></div>`;
 document.body.appendChild(d); let av=s.av||AVS[Math.random()*AVS.length|0]; d.querySelectorAll('.avs button').forEach(b=>{ b.classList.toggle('on',b.dataset.a===av); b.onclick=()=>{ av=b.dataset.a; sfx.tap(); d.querySelectorAll('.avs button').forEach(x=>x.classList.toggle('on',x===b)); }; });
 const go=()=>{ const n=$('#stName').value.trim(); if(n){ store('st_name',n); store('st_av',av); } d.remove(); sfx.ok(); updChip(); cb&&cb(student()); };
 $('#stGo').onclick=go; $('#stSkip').onclick=()=>{ d.remove(); cb&&cb(student()); }; $('#stName').onkeydown=e=>{ if(e.key==='Enter') go(); }; setTimeout(()=>$('#stName').focus(),50); }
/* ---------- COL·LECCIÓ ---------- */
let COL={items:[],found:new Set(),title:'Descobriments'};
function collection(items,title){ COL.items=items; COL.title=title||COL.title; try{ COL.found=new Set(JSON.parse(store('col')||'[]')); }catch(e){ COL.found=new Set(); } updChip(); }
function discover(k){ if(!COL.items.find(i=>i.k===k)||COL.found.has(k)) return false; COL.found.add(k); store('col',JSON.stringify([...COL.found])); const it=COL.items.find(i=>i.k===k); sfx.found(); toast(`Nou descobriment: <b>${it.n}</b> · ${COL.found.size}/${COL.items.length}`,it.ic||'🔎'); updChip(true);
 const n=COL.found.size, N=COL.items.length; if(n===N){ setTimeout(()=>{ sfx.star(); confetti(140); toast('Col·lecció completa! Ets un crac.','🏆',3500); },600); } else if(n===Math.ceil(N/2)){ setTimeout(()=>{ sfx.star(); toast('Ja tens la meitat! Insígnia de plata.','🥈',3000); },600); } return true; }
function updChip(pulse){ let c=$('#uxChip'); if(!c){ c=document.createElement('button'); c.id='uxChip'; c.className='glass'; c.title='Els teus descobriments'; ($('#top')||document.body).appendChild(c); c.onclick=openCol; } const s=student(); const n=COL.found.size,N=COL.items.length; c.innerHTML=`<span class="av">${s.av||'🔎'}</span><span class="nm">${s.name||'Descobriments'}</span><i><b style="width:${N?n/N*100:0}%"></b></i><span class="ct">${n}/${N}</span>`; if(pulse){ c.classList.remove('pulse'); void c.offsetWidth; c.classList.add('pulse'); } }
function openCol(){ sfx.tap(); let d=$('#uxCol'); if(d) d.remove(); d=document.createElement('div'); d.id='uxCol'; const s=student(); const n=COL.found.size,N=COL.items.length;
 d.innerHTML=`<div class="glass"><button class="hx" aria-label="Tancar">×</button><h2>${s.av||'🔎'} ${s.name?s.name+', ':''}${COL.title.toLowerCase()}</h2><p class="sub">${n} de ${N} · ${n===N?'🏆 Col·lecció completa!':n>=N/2?'🥈 Insígnia de plata':'🥉 Continua explorant'}</p><div class="bar"><b style="width:${N?n/N*100:0}%"></b></div><div class="grid">${COL.items.map(i=>`<div class="it ${COL.found.has(i.k)?'on':''}" data-k="${i.k}"><span>${i.ic||'●'}</span><small>${COL.found.has(i.k)?i.n:'???'}</small></div>`).join('')}</div><div class="row"><button class="mini" id="colName">Canvia el nom</button><button class="mini" id="colReset">Comença de nou</button></div></div>`;
 document.body.appendChild(d); d.querySelector('.hx').onclick=()=>d.remove(); d.onclick=e=>{ if(e.target===d) d.remove(); }; $('#colName').onclick=()=>{ d.remove(); askStudent(true); }; $('#colReset').onclick=()=>{ if(confirm('Vols esborrar els descobriments i tornar a començar?')){ COL.found.clear(); store('col','[]'); updChip(); d.remove(); } };
 d.querySelectorAll('.it.on').forEach(el=>el.onclick=()=>{ d.remove(); if(COL.onPick) COL.onPick(el.dataset.k); }); }
/* ---------- GUIA D'ENTRADA (tour) ---------- */
let TOUR=null;
function tour(steps,key='tour'){ if(TOUR) endTour(); const ring=document.createElement('div'); ring.id='uxRing'; const bub=document.createElement('div'); bub.id='uxBub'; bub.className='glass'; document.body.append(ring,bub); TOUR={steps,i:-1,key,ring,bub,raf:0};
 function place(){ const st=steps[TOUR.i]; if(!st) return; let p=null; if(typeof st.at==='function') p=st.at(); else if(st.at){ const el=$(st.at); if(el){ const r=el.getBoundingClientRect(); p={x:r.left+r.width/2,y:r.top+r.height/2,r:Math.max(r.width,r.height)/2+10}; } }
  if(p){ ring.style.display=''; ring.style.left=p.x+'px'; ring.style.top=p.y+'px'; ring.style.setProperty('--r',(p.r||34)+'px'); const bw=Math.min(320,innerWidth-24); let bx=p.x-bw/2, by=p.y+(p.r||34)+16; if(by+120>innerHeight) by=p.y-(p.r||34)-16-bub.offsetHeight; bx=Math.max(12,Math.min(innerWidth-bw-12,bx)); bub.style.left=bx+'px'; bub.style.top=by+'px'; bub.style.width=bw+'px'; } else { ring.style.display='none'; const bw=Math.min(360,innerWidth-24); bub.style.left=(innerWidth-bw)/2+'px'; bub.style.top='40%'; bub.style.width=bw+'px'; }
  TOUR.raf=requestAnimationFrame(place); }
 function show(){ const st=steps[TOUR.i]; bub.innerHTML=`<p>${st.text}</p><div class="row"><small>${TOUR.i+1}/${steps.length}</small><button class="mini" id="tSkip">Salta la guia</button>${st.done?'':'<button class="big" id="tNext">'+(TOUR.i===steps.length-1?'Llestos!':'Següent')+'</button>'}</div>`; if($('#tNext')) $('#tNext').onclick=next; $('#tSkip').onclick=endTour; if(st.on) st.on(); sfx.tick(); }
 function next(){ TOUR.i++; if(TOUR.i>=steps.length){ endTour(true); return; } show(); }
 TOUR.next=next; TOUR.check=()=>{ const st=steps[TOUR.i]; if(TOUR.busy) return; if(st&&st.done&&st.done()){ TOUR.busy=true; sfx.ok(); setTimeout(()=>{ if(!TOUR) return; TOUR.busy=false; next(); },600); } };
 next(); place(); TOUR.iv=setInterval(()=>TOUR&&TOUR.check(),300); return TOUR; }
function endTour(done){ if(!TOUR) return; cancelAnimationFrame(TOUR.raf); clearInterval(TOUR.iv); TOUR.ring.remove(); TOUR.bub.remove(); store(TOUR.key,'1'); TOUR=null; if(done){ toast('Ja ho tens. Ara explora tu!','🚀'); } }
function tourSeen(key='tour'){ return store(key)==='1'; }
/* ---------- MODE PISSARRA, PAUSA, DIBUIX, DRECERES ---------- */
const ST={paused:false,board:false,draw:false,hidden:false};
function setPaused(v){ ST.paused=v; document.body.classList.toggle('paused',v); const b=$('#ttPause'); if(b) b.classList.toggle('on',v); toast(v?'Pausa':'Continua',v?'⏸':'▶',900); }
function setBoard(v){ ST.board=v; document.body.classList.toggle('board',v); const b=$('#ttBoard'); if(b) b.classList.toggle('on',v); if(v&&!document.fullscreenElement&&document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(()=>{}); }
function setHidden(v){ ST.hidden=v; document.body.classList.toggle('hidetext',v); const b=$('#ttHide'); if(b) b.classList.toggle('on',v); }
function toggleFS(){ if(document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen().catch(()=>{}); }
let DR=null;
function setDraw(v){ ST.draw=v; const b=$('#ttDraw'); if(b) b.classList.toggle('on',v); if(v){ if(!DR){ const cv=document.createElement('canvas'); cv.id='uxDraw'; document.body.appendChild(cv); const bar=document.createElement('div'); bar.id='uxDrawBar'; bar.className='glass'; bar.innerHTML=['#ffd23f','#ff3b5c','#00e5ff','#b6ff3b','#ffffff'].map((c,i)=>`<button data-c="${c}" class="${i?'':'on'}" style="background:${c}"></button>`).join('')+'<button id="drClr" title="Esborra-ho tot">🧹</button><button id="drX" title="Deixa de dibuixar">✕</button>'; document.body.appendChild(bar); DR={cv,bar,g:cv.getContext('2d'),col:'#ffd23f',pts:[]};
   const rs=()=>{ const img=DR.g.getImageData(0,0,cv.width||1,cv.height||1); cv.width=innerWidth; cv.height=innerHeight; try{ DR.g.putImageData(img,0,0); }catch(e){} }; cv.width=innerWidth; cv.height=innerHeight; addEventListener('resize',rs);
   let on=false; const P=e=>({x:e.clientX,y:e.clientY}); cv.onpointerdown=e=>{ on=true; try{ cv.setPointerCapture(e.pointerId); }catch(_){} const p=P(e); DR.g.strokeStyle=DR.col; DR.g.lineWidth=6; DR.g.lineCap='round'; DR.g.lineJoin='round'; DR.g.shadowColor=DR.col; DR.g.shadowBlur=8; DR.g.beginPath(); DR.g.moveTo(p.x,p.y); }; cv.onpointermove=e=>{ if(!on) return; const p=P(e); DR.g.lineTo(p.x,p.y); DR.g.stroke(); }; cv.onpointerup=cv.onpointercancel=()=>{ on=false; };
   bar.querySelectorAll('button[data-c]').forEach(b=>b.onclick=()=>{ DR.col=b.dataset.c; bar.querySelectorAll('button[data-c]').forEach(x=>x.classList.toggle('on',x===b)); }); $('#drClr').onclick=()=>DR.g.clearRect(0,0,cv.width,cv.height); $('#drX').onclick=()=>setDraw(false); }
  DR.cv.style.display=''; DR.bar.style.display=''; } else if(DR){ DR.cv.style.display='none'; DR.bar.style.display='none'; } }
/* barra del mestre */
function teacherBar(opts={}){ const bar=document.createElement('div'); bar.id="uxTeach"; bar.className='glass';
 bar.innerHTML=`<button id="ttBoard" title="Mode pissarra (P)"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20h8M12 16v4"/></svg><span>Pissarra</span></button><button id="ttHide" title="Amaga el text (T)"><svg viewBox="0 0 24 24"><path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 21 12a10.6 10.6 0 0 1-2.3 3.3M6.3 6.3A10.6 10.6 0 0 0 3 12s3.5 6 9 6a8.6 8.6 0 0 0 3.4-.7"/><circle cx="12" cy="12" r="3"/></svg><span>Text</span></button><button id="ttPause" title="Pausa (espai)"><svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg><span>Pausa</span></button><button id="ttDraw" title="Dibuixa a sobre (D)"><svg viewBox="0 0 24 24"><path d="M4 20l4-1 11-11-3-3L5 16l-1 4z"/><path d="M13 7l3 3"/></svg><span>Dibuixa</span></button><button id="ttFS" title="Pantalla completa (F)"><svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg><span>Pantalla</span></button><button id="ttMute" title="So"><svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/></svg><span>So</span></button>`;
 document.body.appendChild(bar);
 $('#ttBoard').onclick=()=>{ sfx.tap(); setBoard(!ST.board); }; $('#ttHide').onclick=()=>{ sfx.tap(); setHidden(!ST.hidden); }; $('#ttPause').onclick=()=>{ sfx.tap(); setPaused(!ST.paused); }; $('#ttDraw').onclick=()=>{ sfx.tap(); setDraw(!ST.draw); }; $('#ttFS').onclick=()=>{ sfx.tap(); toggleFS(); };
 const mb=$('#ttMute'); mb.classList.toggle('off',sfx.muted); mb.onclick=()=>{ const m=sfx.mute(); mb.classList.toggle('off',m); if(!m) sfx.ok(); };
 /* botó per obrir/tancar la barra */
 const tg=document.createElement('button'); tg.id='uxTeachTg'; tg.title='Eines del mestre'; tg.innerHTML='👩‍🏫'; ($('#top')||document.body).appendChild(tg); tg.onclick=()=>{ sfx.tap(); const v=bar.classList.toggle('show'); tg.classList.toggle('on',v); document.body.classList.toggle('teach',v); };
 addEventListener('keydown',e=>{ if(e.target.matches('input,textarea')||e.metaKey||e.ctrlKey||e.altKey||document.body.classList.contains('walking')) return; const k=e.key; if(k===' '){ e.preventDefault(); setPaused(!ST.paused); } else if(k==='p'||k==='P') setBoard(!ST.board); else if(k==='t'||k==='T') setHidden(!ST.hidden); else if(k==='d'||k==='D') setDraw(!ST.draw); else if(k==='f'||k==='F') toggleFS(); else if(k==='Escape'){ if(ST.draw) setDraw(false); } else if(/^[1-9]$/.test(k)&&opts.modes){ const b=document.querySelectorAll('#modes button')[+k-1]; if(b) b.click(); } else if((k==='r'||k==='R')&&opts.reset) opts.reset(); });
 return bar; }
/* ---------- RESUM DELS REPTES (per al mestre) ---------- */
function logResult(game,nota){ let L=[]; try{ L=JSON.parse(store('log')||'[]'); }catch(e){} const s=student(); L.push({n:s.name||'(sense nom)',g:game,nota,d:new Date().toISOString().slice(0,16).replace('T',' ')}); if(L.length>400) L=L.slice(-400); store('log',JSON.stringify(L)); }
function resultsPanel(){ let L=[]; try{ L=JSON.parse(store('log')||'[]'); }catch(e){} const d=document.createElement('div'); d.className='uxRes';
 d.innerHTML=`<p class="h">Resultats dels reptes en aquest dispositiu</p>${L.length?`<table><tr><th>Alumne</th><th>Repte</th><th>Nota</th><th>Quan</th></tr>${L.slice().reverse().slice(0,60).map(r=>`<tr><td>${r.n}</td><td>${r.g}</td><td><b>${String(r.nota).replace('.',',')}</b></td><td>${r.d}</td></tr>`).join('')}</table>`:'<p class="t">Encara no hi ha cap repte acabat.</p>'}<div class="row"><button class="mini" id="resCopy">Copia (per enganxar a un full)</button><button class="mini" id="resCSV">Descarrega CSV</button><button class="mini" id="resClr">Esborra</button></div>`;
 const csv=()=>'Alumne;Repte;Nota;Quan\n'+L.map(r=>[r.n,r.g,String(r.nota).replace('.',','),r.d].join(';')).join('\n');
 d.querySelector('#resCopy').onclick=()=>{ navigator.clipboard&&navigator.clipboard.writeText(csv().replace(/;/g,'\t')).then(()=>toast('Copiat!','📋')); }; d.querySelector('#resCSV').onclick=()=>{ const a=document.createElement('a'); a.href='data:text/csv;charset=utf-8,﻿'+encodeURIComponent(csv()); a.download='resultats_medilab.csv'; a.click(); }; d.querySelector('#resClr').onclick=()=>{ if(confirm('Esborrar tots els resultats?')){ store('log','[]'); d.replaceWith(resultsPanel()); } };
 return d; }
/* ---------- RESPOSTA VISUAL AL TOC (ones al punt tocat) ---------- */
function ripple(x,y,col='#00e5ff'){ const r=document.createElement('i'); r.className='uxRip'; r.style.left=x+'px'; r.style.top=y+'px'; r.style.borderColor=col; document.body.appendChild(r); setTimeout(()=>r.remove(),600); }
/* ---------- GANXO DE LES FITXES: descobrir per nom ---------- */
let lastCardName=null, lastCardT=0;
function onCard(I){ if(!I) return; lastCardName=I.n; lastCardT=performance.now(); const it=COL.items.find(x=>x.k===I.n||x.n===I.n); if(it){ if(!discover(it.k)) sfx.ok(); } else sfx.ok(); }
if(K&&K.showCard){ const orig=K.showCard; K.showCard=function(I){ orig(I); onCard(I); }; }
/* toc al canvas: ona + so */
let tapDown=null; addEventListener('pointerdown',e=>{ if(e.target&&e.target.tagName==='CANVAS'&&e.target.id==='c') tapDown={x:e.clientX,y:e.clientY,t:performance.now()}; else tapDown=null; },true);
addEventListener('pointerup',e=>{ if(!tapDown) return; const d=Math.hypot(e.clientX-tapDown.x,e.clientY-tapDown.y); const td=tapDown; tapDown=null; if(d>6||ST.draw) return; ripple(e.clientX,e.clientY,'rgba(0,229,255,.6)'); setTimeout(()=>{ if(performance.now()-lastCardT>400) sfx.tap(); },120); },true);
/* guia genèrica */
function autoTour(o={}){ const n0=COL.found.size; let moved=false; const onMove=()=>{moved=true;}; const c=$('#c'); let md=null; const pd=e=>{md={x:e.clientX,y:e.clientY};}, pm=e=>{ if(md&&Math.hypot(e.clientX-md.x,e.clientY-md.y)>20) moved=true; }; if(c){ c.addEventListener('pointerdown',pd); c.addEventListener('pointermove',pm); }
 const steps=[{text:o.intro||'Hola! Això és un laboratori 3D. En 30 segons et dic com va.'}];
 if(o.before) steps.push(...o.before);
 steps.push({text:o.drag||'Arrossega el model per girar-lo. Amb dos dits (o la roda) t\'hi apropes.',at:()=>({x:innerWidth>860?(394+innerWidth-60)/2:innerWidth/2,y:innerHeight*.45,r:70}),on:()=>{moved=false;},done:()=>moved});
 steps.push({text:o.tap||'Toca una peça del model per veure la seva fitxa.',at:o.tapAt||null,on:()=>{lastCardT=0;},done:()=>performance.now()-lastCardT<3000&&lastCardT>0});
 if(o.after) steps.push(...o.after);
 steps.push({text:`Cada cosa que descobreixes es guarda aquí. N\'hi ha ${COL.items.length} per trobar!`,at:'#uxChip'});
 if($('#modes [data-m=repte]')) steps.push({text:'Quan vulguis posar-te a prova, entra al Repte. I si et perds, el botó «?» t\'ajuda.',at:'#modes [data-m=repte]'});
 tour(steps,'tour'); const iv=setInterval(()=>{ if(!document.getElementById('uxBub')){ clearInterval(iv); if(c){ c.removeEventListener('pointerdown',pd); c.removeEventListener('pointermove',pm); } } },500); }
/* arrencada estàndard: alumne → guia */
function boot(o={}){ if(o.prefix) PFX=o.prefix; if(o.items) collection(o.items,o.title); teacherBar({modes:true,reset:o.reset}); window.__tour=()=>autoTour(o.tour||{});
 if(!tourSeen('tour')){ const H=$('#help'); if(H) H.classList.remove('show'); askStudent(false,()=>setTimeout(()=>window.__tour(),400)); } }
return {sfx,toast,confetti,onCard,autoTour,boot,student,askStudent,collection,discover,openCol,COL,tour,endTour,tourSeen,ST,setPaused,setBoard,setHidden,setDraw,toggleFS,teacherBar,logResult,resultsPanel,ripple};
})();
