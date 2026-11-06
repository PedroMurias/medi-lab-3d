/* CiuScenes: ODS en 3D (globus + 17 fitxes) i Consum (carrer amb contenidors) */
window.CiuScenes=function(THREE,CK,LAND,NK){
 const S={};
 const std=(o)=>new THREE.MeshStandardMaterial(Object.assign({roughness:.8},o));
 const label=(w,h,fn)=>{ const cv=document.createElement('canvas'); cv.width=w; cv.height=h; fn(cv.getContext('2d'),w,h); const t=new THREE.CanvasTexture(cv); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=4; return t; };
 const wrap=(g,txt,x,y,maxW,lh)=>{ const words=txt.split(' '); let line='',yy=y; for(const w of words){ const t=line?line+' '+w:w; if(g.measureText(t).width>maxW&&line){ g.fillText(line,x,yy); line=w; yy+=lh; } else line=t; } g.fillText(line,x,yy); return yy; };
 /* ================= ODS ================= */
 S.ods=(ODS)=>{ const G=new THREE.Group(); G.visible=false; const tiles=[];
  const tex=new THREE.TextureLoader().load(ODSTEX); tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=8;
  const earth=new THREE.Mesh(new THREE.SphereGeometry(6,48,32),std({map:tex,roughness:.75})); earth.castShadow=true; G.add(earth);
  const glow=new THREE.Mesh(new THREE.SphereGeometry(6.35,48,32),new THREE.ShaderMaterial({transparent:true,side:THREE.BackSide,depthWrite:false,uniforms:{},vertexShader:'varying vec3 vN;varying vec3 vP;void main(){vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vP=mv.xyz;gl_Position=projectionMatrix*mv;}',fragmentShader:'varying vec3 vN;varying vec3 vP;void main(){float f=pow(1.-abs(dot(normalize(vN),normalize(-vP))),2.2);gl_FragColor=vec4(.45,.75,1.,f*.9);}'})); G.add(glow);
  const clouds=new THREE.Mesh(new THREE.SphereGeometry(6.08,40,28),std({color:0xffffff,transparent:true,opacity:.18,roughness:1,alphaMap:window.Vis&&Vis.noiseTex?Vis.noiseTex(THREE,256,6,.5):null})); G.add(clouds);
  ODS.forEach((o,i)=>{ const t=label(256,256,(g,w,h)=>{ g.fillStyle=o[1]; g.beginPath(); g.roundRect(0,0,w,h,28); g.fill(); g.fillStyle='rgba(255,255,255,.14)'; g.fillRect(0,0,w,70); g.fillStyle='#fff'; g.font='800 64px Orbitron, Space Grotesk, sans-serif'; g.textBaseline='top'; g.fillText(String(i+1),20,10); g.font='700 30px Space Grotesk, sans-serif'; wrap(g,o[0].toUpperCase(),20,96,216,36); });
   const m=new THREE.Mesh(new THREE.BoxGeometry(2.6,2.6,.25),[std({color:o[1]}),std({color:o[1]}),std({color:o[1]}),std({color:o[1]}),std({map:t,roughness:.6}),std({color:o[1]})]); m.userData={i,base:1}; m.castShadow=true; G.add(m); tiles.push(m); });
  let T=0; S.odsTick=(dt,camera)=>{ if(!G.visible) return; T+=dt; earth.rotation.y+=dt*.06; clouds.rotation.y+=dt*.08;
   tiles.forEach((m,i)=>{ const ring=i<9?0:1, n=ring?8:9, k=ring?i-9:i; const a=k/n*Math.PI*2+T*(ring?-.09:.12)+ring*.3; const r=ring?15.5:10.5; const y=ring?Math.sin(a*2)*2.2:Math.sin(a*3)*1.2; m.position.set(Math.cos(a)*r,y,Math.sin(a)*r); m.lookAt(camera.position); const s=m.userData.base+(m.userData.pop?Math.sin(m.userData.pop*Math.PI)*.35:0); m.scale.setScalar(s); if(m.userData.pop){ m.userData.pop+=dt*2; if(m.userData.pop>=1) m.userData.pop=0; } }); };
  G.userData.tiles=tiles; return G; };
 /* ================= CONSUM ================= */
 S.consum=(BINS)=>{ const G=new THREE.Group(); G.visible=false; const bins=[];
  const cob=std({map:CK.T.cobble.clone(),roughness:.9}); cob.map.repeat.set(14,8); cob.map.needsUpdate=true; const gr=new THREE.Mesh(new THREE.PlaneGeometry(40,22),cob); gr.rotation.x=-Math.PI/2; gr.receiveShadow=true; G.add(gr);
  const sw=std({map:CK.T.stoneSlab.clone(),roughness:.9}); sw.map.repeat.set(14,1.2); sw.map.needsUpdate=true; const walk=new THREE.Mesh(new THREE.PlaneGeometry(40,3.4),sw); walk.rotation.x=-Math.PI/2; walk.position.set(0,.05,-6.5); walk.receiveShadow=true; G.add(walk); const curb=CK.box(40,.18,.25,std({color:0xb8b2a4}),0,0,-4.75); G.add(curb);
  for(let i=0;i<3;i++){ const b=CK.block(11,6+i%2*2,8,i+2); b.position.set(-13+i*13,0,-13); G.add(b); }
  for(const x of [-14,14]){ const L=CK.lamp(); L.position.set(x,.1,-5.6); G.add(L); } const B=CK.bench(); B.position.set(-9,.1,-6.2); G.add(B); const K=CK.kiosk(); K.position.set(15,.1,-7); K.rotation.y=-.5; G.add(K);
  if(NK){ NK.load().then(()=>{ for(const [x,h] of [[-16,3.4],[9,3.6],[17.5,3]]){ const o=NK.inst('CommonTree_'+(1+(Math.abs(x)|0)%3),h); o.position.set(x,.05,-8.3); G.add(o); } }).catch(()=>{}); }
  BINS.forEach(([k,n,c,e],i)=>{ const col=new THREE.Color(c); const g=new THREE.Group(); const x=-11.25+i*4.5; g.position.set(x,0,1);
   const body=new THREE.Mesh(new THREE.BoxGeometry(2.2,2.3,1.8),std({color:col,roughness:.55,metalness:.08})); body.position.y=1.15; body.castShadow=body.receiveShadow=true; g.add(body);
   const lid=new THREE.Mesh(new THREE.BoxGeometry(2.35,.3,1.95),std({color:col.clone().multiplyScalar(.75),roughness:.5})); lid.position.set(0,2.45,0); lid.castShadow=true; g.add(lid); const hole=new THREE.Mesh(new THREE.BoxGeometry(1.1,.2,.5),std({color:0x111418})); hole.position.set(0,2.62,.4); g.add(hole);
   for(const s of [-.8,.8]){ const w=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.2,12),std({color:0x222})); w.rotation.z=Math.PI/2; w.position.set(s,.2,-.85); g.add(w); }
   const t=label(256,256,(g2,w,h)=>{ g2.fillStyle='rgba(255,255,255,.92)'; g2.beginPath(); g2.roundRect(18,18,220,220,24); g2.fill(); g2.font='120px sans-serif'; g2.textAlign='center'; g2.textBaseline='middle'; g2.fillText(e,128,100); g2.fillStyle='#111'; g2.font='700 34px Space Grotesk, sans-serif'; g2.fillText(n,128,200); });
   const lab=new THREE.Mesh(new THREE.PlaneGeometry(1.7,1.7),new THREE.MeshBasicMaterial({map:t,transparent:true})); lab.position.set(0,1.25,.92); g.add(lab);
   g.userData={k,i}; g.traverse(o=>{ o.userData.k=k; }); G.add(g); bins.push(g); });
  /* objecte flotant */
  const spr=new THREE.Sprite(new THREE.SpriteMaterial({transparent:true})); spr.scale.set(3.4,3.4,1); spr.position.set(0,3.9,4); G.add(spr); const sh=new THREE.Mesh(new THREE.CircleGeometry(1.1,24),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.25})); sh.rotation.x=-Math.PI/2; sh.position.set(0,.03,5); G.add(sh);
  S.consumItem=(it)=>{ if(!it){ spr.visible=false; sh.visible=false; return; } spr.visible=sh.visible=true; const t=label(512,512,(g,w,h)=>{ g.font='300px sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(it[0],256,200); g.fillStyle='rgba(8,18,38,.85)'; g.beginPath(); g.roundRect(40,392,432,86,30); g.fill(); g.fillStyle='#fff'; g.font='700 44px Space Grotesk, sans-serif'; g.fillText(it[1],256,436); }); spr.material.map=t; spr.material.needsUpdate=true; };
  S.consumFx=(bin,ok)=>{ bin.userData.fx={t:0,ok}; };
  let T=0; S.consumTick=(dt)=>{ if(!G.visible) return; T+=dt; spr.position.y=3.9+Math.sin(T*2)*.25; for(const b of bins){ const f=b.userData.fx; if(f){ f.t+=dt*2.2; const s=1+Math.sin(Math.min(1,f.t)*Math.PI)*(f.ok?.18:.06); b.scale.set(s,s,s); b.rotation.z=f.ok?0:Math.sin(f.t*18)*.06*(1-Math.min(1,f.t)); if(f.t>=1){ b.scale.set(1,1,1); b.rotation.z=0; b.userData.fx=null; } } } };
  G.userData.bins=bins; return G; };
 return S; };
