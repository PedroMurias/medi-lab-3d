/* MediLab Walk: mode "passeig" en primera persona (tipus Street View). Compartit. */
window.Walk=(function(){
const W={on:false}; let vel=null,vy=0,air=false,crouchK=0,dip=0,runK=0,baseFov=62,THREE,cam,controls,canvas,cfg,saved=null,keys={},look=null,joy=null,bobT=0,ui=null,lastTap=0;
const $=s=>document.querySelector(s);
function mkUI(){ if(ui) return; { const st=document.createElement('style'); st.textContent='body.walking #uxDraw,body.walking #uxDrawBar{display:none!important}'; document.head.appendChild(st); } ui=document.createElement('div'); ui.id='walkUI'; ui.innerHTML=`<div id="walkJoy"><i></i></div><div id="walkHint"><b>🚶 Mode passeig</b><span class="pc">Fletxes o WASD per caminar · mou el ratolí per mirar (Esc l\'allibera) · <b>Maj</b> corre · <b>Espai</b> salta · <b>C</b> ajupeix-te</span><span class="mob">Palanca per caminar · arrossega la pantalla per mirar</span></div><button id="walkX" class="glass">✕ Surt del passeig</button><div id="walkCross"></div>`; document.body.appendChild(ui); { const h=document.createElement('div'); h.id='walkLock'; h.innerHTML='🖱️ <b>Fes clic</b> a l\'escena per mirar movent el ratolí<br><small>Esc per tornar a tenir el ratolí</small>'; h.style.cssText='position:fixed;left:50%;top:58%;transform:translateX(-50%);z-index:30;display:none;padding:12px 18px;border-radius:14px;background:rgba(6,12,26,.82);border:1px solid rgba(0,229,255,.45);color:#e6f1ff;font:15px system-ui;text-align:center;pointer-events:none'; document.body.appendChild(h); }
 $('#walkX').onclick=()=>W.stop();
 const J=$('#walkJoy'), K=J.querySelector('i'); let jid=null; const R=42;
 J.addEventListener('pointerdown',e=>{ jid=e.pointerId; J.setPointerCapture(jid); mv(e); e.stopPropagation(); });
 J.addEventListener('pointermove',e=>{ if(e.pointerId===jid) mv(e); });
 const end=e=>{ if(e.pointerId!==jid) return; jid=null; joy=null; K.style.transform=''; };
 J.addEventListener('pointerup',end); J.addEventListener('pointercancel',end);
 function mv(e){ const r=J.getBoundingClientRect(); let dx=e.clientX-(r.left+r.width/2), dy=e.clientY-(r.top+r.height/2); const d=Math.hypot(dx,dy); if(d>R){ dx*=R/d; dy*=R/d; } joy={x:dx/R,y:dy/R}; K.style.transform=`translate(${dx}px,${dy}px)`; } }
function onKey(e){ if(!W.on) return; if(e.target.matches('input,textarea')) return; const k=e.key.toLowerCase(); const map={arrowup:'f',w:'f',arrowdown:'b',s:'b',arrowleft:'l',a:'l',arrowright:'r',d:'r',shift:'run',q:'tl',e:'tr',' ':'jump',c:'crouch'}; const m=map[k]; if(!m) { if(e.key==='Escape') W.stop(); return; } keys[m]=e.type==='keydown'; e.preventDefault(); e.stopImmediatePropagation(); }

/* ratolí: mirar sense clicar (pointer lock). Esc allibera el ratolí; un altre Esc surt del passeig */
const FINE=matchMedia('(pointer:fine)').matches; let locked=false, freeLook=false, fwd=false;
function lockReq(){ try{ const r=canvas.requestPointerLock({unadjustedMovement:false}); if(r&&r.catch) r.catch(()=>{ freeLook=true; lockHint(); }); }catch(e){ freeLook=true; lockHint(); } }
function onLockChange(){ locked=document.pointerLockElement===canvas; document.body.classList.toggle('mlook',locked); lockHint(); }
function onLockErr(){ freeLook=true; lockHint(); }
function lockHint(){ const h=document.getElementById('walkLock'); if(!h) return; h.style.display=W.on&&FINE&&!locked&&!freeLook?'block':'none'; }
function onMouseLook(e){ if(!W.on) return; if(!(locked||(freeLook&&e.target===canvas&&!e.buttons))) return; W.yawT-=(e.movementX||0)*.0026; W.pitchT=Math.max(-1.2,Math.min(1.1,W.pitchT-(e.movementY||0)*.0022)); }
/* amb el ratolí bloquejat, els clics van al centre de la pantalla (punt de mira) */
function reroute(e){ if(!locked||fwd||!e.isTrusted||e.target!==canvas) return; e.stopImmediatePropagation(); e.preventDefault(); const r=canvas.getBoundingClientRect(); const o={bubbles:true,cancelable:true,clientX:r.left+r.width/2,clientY:r.top+r.height/2,button:e.button,buttons:e.buttons,pointerId:e.pointerId||1,pointerType:'mouse',isPrimary:true}; fwd=true; try{ canvas.dispatchEvent(e.type.startsWith('pointer')?new PointerEvent(e.type,o):new MouseEvent(e.type,o)); } finally{ fwd=false; } }
function firstClick(e){ if(!W.on||!FINE||locked||freeLook||e.target!==canvas||e.pointerType!=='mouse') return; e.stopImmediatePropagation(); e.preventDefault(); lockReq(); }
function onDown(e){ if(!W.on||e.target!==canvas) return; look={id:e.pointerId,x:e.clientX,y:e.clientY,moved:0}; }
function onMove(e){ if(!W.on||!look||e.pointerId!==look.id||locked) return; const dx=e.clientX-look.x, dy=e.clientY-look.y; look.x=e.clientX; look.y=e.clientY; look.moved+=Math.abs(dx)+Math.abs(dy); W.yawT-=dx*.0045; W.pitchT=Math.max(-1.2,Math.min(1.1,W.pitchT-dy*.0035)); }
function onUp(e){ if(!W.on) return; if(look&&look.moved<8){ const t=performance.now(); if(t-lastTap<350&&cfg.onDouble) cfg.onDouble(); lastTap=t; } look=null; }
/* cfg: {camera,controls,canvas,ground:(x,z)=>y,start:[x,z],yaw,radius|bounds:(x,z)=>[x,z],speed,eye,onStop,onTick} */
W.start=function(T,c){ THREE=T; cfg=c; cam=c.camera; controls=c.controls; canvas=c.canvas; mkUI(); ui.classList.add('show'); document.body.classList.add('walking');
 saved={p:cam.position.clone(),t:controls.target.clone(),en:controls.enabled,fov:cam.fov}; controls.enabled=false;
 W.pos=new THREE.Vector3(c.start[0],0,c.start[1]); W.yaw=W.yawT=c.yaw??Math.PI; W.pitch=W.pitchT=-.05; vel=new THREE.Vector3(); vy=0; air=false; crouchK=0; dip=0; runK=0; baseFov=c.fov??62; W.eye=c.eye??1.6; W.speed=c.speed??4; keys={}; joy=null; look=null; bobT=0; cam.fov=c.fov??62; cam.updateProjectionMatrix();
 addEventListener('keydown',onKey); addEventListener('keyup',onKey); canvas.addEventListener('pointerdown',onDown); addEventListener('pointermove',onMove); addEventListener('pointerup',onUp);
 for(const t of ['pointerdown','pointerup','click','mousedown','mouseup','pointermove','mousemove']) addEventListener(t,reroute,true); addEventListener('pointerdown',firstClick,true); addEventListener('mousemove',onMouseLook); document.addEventListener('pointerlockchange',onLockChange); document.addEventListener('pointerlockerror',onLockErr);
 W.on=true; freeLook=false; setTimeout(lockHint,0); const b=$('#tWalk'); if(b) b.classList.add('on'); if(window.UX){ UX.sfx.ok(); UX.toast('Mode passeig: camina amb les fletxes o la palanca','🚶',2600); } };
W.stop=function(){ if(!W.on) return; W.on=false; if(document.pointerLockElement) document.exitPointerLock(); for(const t of ['pointerdown','pointerup','click','mousedown','mouseup','pointermove','mousemove']) removeEventListener(t,reroute,true); removeEventListener('pointerdown',firstClick,true); removeEventListener('mousemove',onMouseLook); document.removeEventListener('pointerlockchange',onLockChange); document.removeEventListener('pointerlockerror',onLockErr); locked=false; document.body.classList.remove('mlook'); lockHint(); ui.classList.remove('show'); document.body.classList.remove('walking'); removeEventListener('keydown',onKey); removeEventListener('keyup',onKey); canvas.removeEventListener('pointerdown',onDown); removeEventListener('pointermove',onMove); removeEventListener('pointerup',onUp);
 controls.enabled=saved.en; cam.fov=saved.fov; cam.up.set(0,1,0); cam.updateProjectionMatrix(); cam.position.copy(saved.p); controls.target.copy(saved.t); const b=$('#tWalk'); if(b) b.classList.remove('on'); if(cfg.onStop) cfg.onStop(); };
W.tick=function(dt){ if(!W.on) return; dt=Math.min(dt,.05); if(!vel) vel=new THREE.Vector3();
 /* mirada suau */ const lk=Math.min(1,dt*20); W.yawT+=((keys.tl?1:0)-(keys.tr?1:0))*dt*1.6; W.yaw+=(W.yawT-W.yaw)*lk; W.pitch+=(W.pitchT-W.pitch)*lk;
 let f=0,s=0; if(keys.f) f+=1; if(keys.b) f-=1; if(keys.r) s+=1; if(keys.l) s-=1; if(joy){ f+=-joy.y; s+=joy.x; }
 const mv=Math.min(1,Math.hypot(f,s)); const wantRun=keys.run&&mv>0&&!keys.crouch; runK+=((wantRun?1:0)-runK)*Math.min(1,dt*6); crouchK+=((keys.crouch?1:0)-crouchK)*Math.min(1,dt*9);
 const top=W.speed*(1+.9*runK)*(1-.45*crouchK); const dir=new THREE.Vector3(Math.sin(W.yaw),0,Math.cos(W.yaw)); const right=new THREE.Vector3(-dir.z,0,dir.x);
 const tgt=new THREE.Vector3().addScaledVector(dir,f).addScaledVector(right,s); if(tgt.length()>1) tgt.normalize(); tgt.multiplyScalar(top);
 const ac=air?2.2:(mv>0?10:12); vel.x+=(tgt.x-vel.x)*Math.min(1,dt*ac); vel.z+=(tgt.z-vel.z)*Math.min(1,dt*ac);
 /* col·lisions amb lliscament */ const R=.38; const free=(x,z)=>{ if(cfg.bounds){ const [bx,bz]=cfg.bounds(x,z); if(Math.abs(bx-x)>1e-4||Math.abs(bz-z)>1e-4) return false; } else if(cfg.radius){ const cx=cfg.center?cfg.center[0]:0, cz=cfg.center?cfg.center[1]:0; if(Math.hypot(x-cx,z-cz)>cfg.radius) return false; }
  if(cfg.blocked){ if(cfg.blocked(x,z)||cfg.blocked(x+R,z)||cfg.blocked(x-R,z)||cfg.blocked(x,z+R)||cfg.blocked(x,z-R)) return false; } if(cfg.dynamic&&cfg.dynamic(x,z,R)) return false; return true; };
 const px=W.pos.x, pz=W.pos.z; let nx=px+vel.x*dt, nz=pz+vel.z*dt; let hitX=false,hitZ=false;
 if(!free(nx,pz)){ nx=px; hitX=true; } if(!free(nx,nz)){ nz=pz; hitZ=true; } if(hitX) vel.x*=.2; if(hitZ) vel.z*=.2;
 /* petit empenyiment si ens quedem dins d'un cotxe */ if(cfg.dynamic&&cfg.dynamic(nx,nz,R)&&cfg.push){ const p=cfg.push(nx,nz,R); if(p){ nx+=p[0]*dt; nz+=p[1]*dt; } }
 W.pos.x=nx; W.pos.z=nz; const spd=Math.hypot(vel.x,vel.z);
 /* terra, salt i gravetat */ const gy=cfg.ground?cfg.ground(W.pos.x,W.pos.z):0;
 if(keys.jump&&!air&&!keys.crouch){ vy=4.4; air=true; keys.jump=false; }
 if(air){ vy-=13*dt; W.pos.y+=vy*dt; if(W.pos.y<=gy){ W.pos.y=gy; if(vy<-2) dip=Math.min(.14,-vy*.022); vy=0; air=false; } }
 else { const d=gy-W.pos.y; if(d>.45||d<-.6){ /* graó gran o caiguda: cau */ if(d<-.6){ air=true; vy=0; } else W.pos.y=gy; } else W.pos.y+=d*Math.min(1,dt*16); }
 /* càmera: balanceig segons velocitat real */ bobT+=dt*(5.2+spd*.55)*(air?0:1); const k=air?0:Math.min(1,spd/Math.max(.1,W.speed));
 dip+=(0-dip)*Math.min(1,dt*9); const bob=Math.sin(bobT*2)*.042*k*(1+runK*.6), sway=Math.cos(bobT)*.022*k, roll=Math.cos(bobT)*.006*k;
 const eye=W.eye*(1-.38*crouchK); cam.position.set(W.pos.x+right.x*sway,W.pos.y+eye+bob-dip,W.pos.z+right.z*sway);
 const targetFov=baseFov+7*runK*Math.min(1,spd/(W.speed*1.4)); if(Math.abs(cam.fov-targetFov)>.05){ cam.fov+=(targetFov-cam.fov)*Math.min(1,dt*7); cam.updateProjectionMatrix(); }
 const ld=new THREE.Vector3(Math.sin(W.yaw)*Math.cos(W.pitch),Math.sin(W.pitch),Math.cos(W.yaw)*Math.cos(W.pitch)); cam.up.set(Math.sin(roll),Math.cos(roll),0); cam.lookAt(cam.position.clone().add(ld)); controls.target.copy(cam.position).add(ld.multiplyScalar(3));
 if(cfg.onTick) cfg.onTick(dt); };
/* botó per a la barra d'eines */
W.button=function(tools,onClick){ const b=document.createElement('button'); b.id='tWalk'; b.title='Passeja per l\'escena (mode passeig)'; b.setAttribute('aria-label','Mode passeig'); b.innerHTML='<svg viewBox="0 0 24 24" style="width:22px;height:22px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round"><circle cx="13" cy="4" r="2"/><path d="M10 22l2-7 3 3v4M13 9l-3 3-2 4M13 9l3 3 3 1M11 13l-3 6"/></svg>'; b.onclick=()=>{ if(W.on) W.stop(); else onClick(); }; tools.appendChild(b); return b; };
return W; })();
