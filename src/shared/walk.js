/* MediLab Walk: mode "passeig" en primera persona (tipus Street View). Compartit. */
window.Walk=(function(){
const W={on:false}; let THREE,cam,controls,canvas,cfg,saved=null,keys={},look=null,joy=null,bobT=0,ui=null,lastTap=0;
const $=s=>document.querySelector(s);
function mkUI(){ if(ui) return; ui=document.createElement('div'); ui.id='walkUI'; ui.innerHTML=`<div id="walkJoy"><i></i></div><div id="walkHint"><b>🚶 Mode passeig</b><span class="pc">Fletxes o WASD per caminar · arrossega per mirar · <b>Maj</b> per córrer</span><span class="mob">Palanca per caminar · arrossega la pantalla per mirar</span></div><button id="walkX" class="glass">✕ Surt del passeig</button><div id="walkCross"></div>`; document.body.appendChild(ui);
 $('#walkX').onclick=()=>W.stop();
 const J=$('#walkJoy'), K=J.querySelector('i'); let jid=null; const R=42;
 J.addEventListener('pointerdown',e=>{ jid=e.pointerId; J.setPointerCapture(jid); mv(e); e.stopPropagation(); });
 J.addEventListener('pointermove',e=>{ if(e.pointerId===jid) mv(e); });
 const end=e=>{ if(e.pointerId!==jid) return; jid=null; joy=null; K.style.transform=''; };
 J.addEventListener('pointerup',end); J.addEventListener('pointercancel',end);
 function mv(e){ const r=J.getBoundingClientRect(); let dx=e.clientX-(r.left+r.width/2), dy=e.clientY-(r.top+r.height/2); const d=Math.hypot(dx,dy); if(d>R){ dx*=R/d; dy*=R/d; } joy={x:dx/R,y:dy/R}; K.style.transform=`translate(${dx}px,${dy}px)`; } }
function onKey(e){ if(!W.on) return; if(e.target.matches('input,textarea')) return; const k=e.key.toLowerCase(); const map={arrowup:'f',w:'f',arrowdown:'b',s:'b',arrowleft:'l',a:'l',arrowright:'r',d:'r',shift:'run',q:'tl',e:'tr'}; const m=map[k]; if(!m) { if(e.key==='Escape') W.stop(); return; } keys[m]=e.type==='keydown'; e.preventDefault(); }
function onDown(e){ if(!W.on||e.target!==canvas) return; look={id:e.pointerId,x:e.clientX,y:e.clientY,moved:0}; }
function onMove(e){ if(!W.on||!look||e.pointerId!==look.id) return; const dx=e.clientX-look.x, dy=e.clientY-look.y; look.x=e.clientX; look.y=e.clientY; look.moved+=Math.abs(dx)+Math.abs(dy); W.yaw-=dx*.0045; W.pitch=Math.max(-1.2,Math.min(1.1,W.pitch-dy*.0035)); }
function onUp(e){ if(!W.on) return; if(look&&look.moved<8){ const t=performance.now(); if(t-lastTap<350&&cfg.onDouble) cfg.onDouble(); lastTap=t; } look=null; }
/* cfg: {camera,controls,canvas,ground:(x,z)=>y,start:[x,z],yaw,radius|bounds:(x,z)=>[x,z],speed,eye,onStop,onTick} */
W.start=function(T,c){ THREE=T; cfg=c; cam=c.camera; controls=c.controls; canvas=c.canvas; mkUI(); ui.classList.add('show'); document.body.classList.add('walking');
 saved={p:cam.position.clone(),t:controls.target.clone(),en:controls.enabled,fov:cam.fov}; controls.enabled=false;
 W.pos=new THREE.Vector3(c.start[0],0,c.start[1]); W.yaw=c.yaw??Math.PI; W.pitch=-.05; W.eye=c.eye??1.6; W.speed=c.speed??4; keys={}; joy=null; look=null; bobT=0; cam.fov=c.fov??62; cam.updateProjectionMatrix();
 addEventListener('keydown',onKey); addEventListener('keyup',onKey); canvas.addEventListener('pointerdown',onDown); addEventListener('pointermove',onMove); addEventListener('pointerup',onUp);
 W.on=true; const b=$('#tWalk'); if(b) b.classList.add('on'); if(window.UX){ UX.sfx.ok(); UX.toast('Mode passeig: camina amb les fletxes o la palanca','🚶',2600); } };
W.stop=function(){ if(!W.on) return; W.on=false; ui.classList.remove('show'); document.body.classList.remove('walking'); removeEventListener('keydown',onKey); removeEventListener('keyup',onKey); canvas.removeEventListener('pointerdown',onDown); removeEventListener('pointermove',onMove); removeEventListener('pointerup',onUp);
 controls.enabled=saved.en; cam.fov=saved.fov; cam.updateProjectionMatrix(); cam.position.copy(saved.p); controls.target.copy(saved.t); const b=$('#tWalk'); if(b) b.classList.remove('on'); if(cfg.onStop) cfg.onStop(); };
W.tick=function(dt){ if(!W.on) return; let f=0,s=0; if(keys.f) f+=1; if(keys.b) f-=1; if(keys.r) s+=1; if(keys.l) s-=1; if(keys.tl) W.yaw+=dt*1.6; if(keys.tr) W.yaw-=dt*1.6; if(joy){ f+=-joy.y; s+=joy.x; }
 const mv=Math.min(1,Math.hypot(f,s)); if(mv>0){ const sp=W.speed*(keys.run?2:1)*dt; const dir=new THREE.Vector3(Math.sin(W.yaw),0,Math.cos(W.yaw)); const right=new THREE.Vector3(-dir.z,0,dir.x); const np=W.pos.clone().addScaledVector(dir,f*sp).addScaledVector(right,s*sp);
  if(cfg.bounds){ const [bx,bz]=cfg.bounds(np.x,np.z); np.x=bx; np.z=bz; } else if(cfg.radius){ const cx=cfg.center?cfg.center[0]:0, cz=cfg.center?cfg.center[1]:0; const d=Math.hypot(np.x-cx,np.z-cz); if(d>cfg.radius){ np.x=cx+(np.x-cx)/d*cfg.radius; np.z=cz+(np.z-cz)/d*cfg.radius; } }
  if(!cfg.blocked||!cfg.blocked(np.x,np.z)) W.pos.copy(np); bobT+=dt*(keys.run?11:7)*mv; }
 const gy=cfg.ground?cfg.ground(W.pos.x,W.pos.z):0; W.pos.y+= (gy-W.pos.y)*Math.min(1,dt*10);
 const bob=Math.sin(bobT)*.035*(mv>0?1:0); cam.position.set(W.pos.x,W.pos.y+W.eye+bob,W.pos.z);
 const ld=new THREE.Vector3(Math.sin(W.yaw)*Math.cos(W.pitch),Math.sin(W.pitch),Math.cos(W.yaw)*Math.cos(W.pitch)); cam.lookAt(cam.position.clone().add(ld)); controls.target.copy(cam.position).add(ld.multiplyScalar(3));
 if(cfg.onTick) cfg.onTick(dt); };
/* botó per a la barra d'eines */
W.button=function(tools,onClick){ const b=document.createElement('button'); b.id='tWalk'; b.title='Passeja per l\'escena (mode passeig)'; b.setAttribute('aria-label','Mode passeig'); b.innerHTML='<svg viewBox="0 0 24 24" style="width:22px;height:22px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round"><circle cx="13" cy="4" r="2"/><path d="M10 22l2-7 3 3v4M13 9l-3 3-2 4M13 9l3 3 3 1M11 13l-3 6"/></svg>'; b.onclick=()=>{ if(W.on) W.stop(); else onClick(); }; tools.appendChild(b); return b; };
return W; })();
