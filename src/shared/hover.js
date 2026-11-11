/* Ressaltat en passar el ratolí (compartit). Hover(THREE,{canvas,camera,ray,targets:()=>[{objs,label:(o)=>str,root:(o)=>obj}], walkOn:()=>bool}) */
window.Hover=function(THREE,cfg){
 const H={cur:null,lbl:null,t:0,cache:[]};
 const lbl=document.createElement('div'); lbl.id='hovLbl'; lbl.style.cssText='position:fixed;z-index:30;pointer-events:none;display:none;padding:6px 12px;border-radius:12px;background:rgba(6,12,26,.9);border:1px solid rgba(0,229,255,.5);color:#fff;font:600 14px system-ui,sans-serif;white-space:nowrap;transform:translate(14px,-50%);max-width:260px;overflow:hidden;text-overflow:ellipsis'; document.body.appendChild(lbl); H.lbl=lbl;
 const glow=(root,on)=>{ root.traverse(o=>{ if(o.isMesh&&o.material){ const ms=Array.isArray(o.material)?o.material:[o.material]; ms.forEach((m,i)=>{ if(!m.emissive) return; if(on){ if(o.userData._em===undefined){ const c=m.clone(); if(Array.isArray(o.material)) o.material[i]=c; else o.material=c; o.userData._em=c.emissive.getHex(); o.userData._ei=c.emissiveIntensity; c.emissive.setHex(0x1a6fa0); c.emissiveIntensity=.8; } } else if(o.userData._em!==undefined){ const c=Array.isArray(o.material)?o.material[i]:o.material; c.emissive.setHex(o.userData._em); c.emissiveIntensity=o.userData._ei; delete o.userData._em; } }); } if(o.isSprite&&o.material){ if(on){ if(o.userData._sc===undefined){ o.userData._sc=o.scale.x; o.scale.multiplyScalar(1.18); } } else if(o.userData._sc!==undefined){ o.scale.setScalar(o.userData._sc); delete o.userData._sc; } } }); };
 H.set=(root,text)=>{ if(H.cur===root) return; if(H.cur) glow(H.cur,false); H.cur=root; if(root){ glow(root,true); lbl.textContent=text||''; lbl.style.display=text?'block':'none'; cfg.canvas.style.cursor='pointer'; } else { lbl.style.display='none'; cfg.canvas.style.cursor=''; } };
 H.clear=()=>H.set(null);
 cfg.canvas.addEventListener('pointermove',e=>{ if(e.pointerType==='touch') return; const lock=!!document.pointerLockElement; if(cfg.walkOn&&cfg.walkOn()&&!lock) return;
  const px=lock?innerWidth/2:e.clientX, py=lock?innerHeight/2:e.clientY; lbl.style.left=px+'px'; lbl.style.top=py+'px';
  const now=performance.now(); if(now-H.t<70) return; H.t=now;
  cfg.ray.setFromCamera(new THREE.Vector2(px/innerWidth*2-1,-(py/innerHeight)*2+1),cfg.camera);
  let best=null,bd=1e9,bt=null; for(const T of cfg.targets()){ if(!T||!T.objs||!T.objs.length) continue; const h=cfg.ray.intersectObjects(T.objs,!!T.deep); if(h.length&&h[0].distance<bd){ bd=h[0].distance; best=h[0].object; bt=T; } }
  if(!best){ H.set(null); return; } const root=bt.root?bt.root(best):best; const text=bt.label?bt.label(best,root):''; if(root===false){ H.set(null); return; } H.set(root,text); });
 cfg.canvas.addEventListener('pointerleave',()=>H.set(null));
 return H; };
