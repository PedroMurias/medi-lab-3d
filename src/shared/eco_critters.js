/* ===== MODELS 3D (Kenney Cube Pets + Quaternius Nature, CC0) i animals fets a mà ===== */
const MODELS={};
async function loadModels(){ const mgr=new THREE.LoadingManager(); mgr.setURLModifier(u=>u.includes('colormap')?ECOASSETS.__colormap:u); const L=new GLTFLoader(mgr); L.setMeshoptDecoder(MeshoptDecoder);
 for(const [k,v] of Object.entries(ECOASSETS)){ if(k.startsWith('__')) continue; const bin=atob(v), buf=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) buf[i]=bin.charCodeAt(i);
  MODELS[k]=await new Promise((res,rej)=>L.parse(buf.buffer,'',res,rej)); if(/Tree|Bush|Rock|Grass|Flowers|Stump|Willow|Lily|Plant/.test(k)) MODELS[k].scene.traverse(m=>{ if(m.isMesh){ m.material.color.multiplyScalar(k.startsWith('Rock')?1.3:1.9); m.material.roughness=.85; } }); } }
function modelInst(name,h,byLen){ const g=MODELS[name]; const o=g.animations.length?SkeletonUtils.clone(g.scene):g.scene.clone(true); const wrap=new THREE.Group(); wrap.add(o);
 o.updateMatrixWorld(true); o.traverse(m=>{ if(m.isSkinnedMesh){ m.skeleton.update(); m.computeBoundingBox&&m.computeBoundingBox(); } }); const bb=new THREE.Box3().setFromObject(o), sz=bb.getSize(new THREE.Vector3()); const s=h/(byLen?Math.max(sz.x,sz.z):sz.y); o.scale.setScalar(s); o.position.y=byLen?-(bb.min.y+bb.max.y)/2*s:-bb.min.y*s; o.position.x=byLen?-(bb.min.x+bb.max.x)/2*s:0; o.position.z=byLen?-(bb.min.z+bb.max.z)/2*s:0;
 o.traverse(m=>{ if(m.isMesh){ m.castShadow=true; m.receiveShadow=true; if(m.isSkinnedMesh) m.frustumCulled=false; } });
 let mixer=null, acts={}; if(g.animations.length){ mixer=new THREE.AnimationMixer(o); g.animations.forEach(a=>acts[a.name]=mixer.clipAction(a)); }
 return {o:wrap,mixer,acts}; }
/* animals low poly fets a mà, al mateix estil que els de Quaternius (facetat, colors naturals) */
const LM={}; const lmat=c=>LM[c]||(LM[c]=new THREE.MeshStandardMaterial({color:c,roughness:.9,flatShading:true}));
function blob(r,c,x=0,y=0,z=0,sx=1,sy=1,sz=1,det=1){ const m=new THREE.Mesh(new THREE.IcosahedronGeometry(r,det),lmat(c)); m.position.set(x,y,z); m.scale.set(sx,sy,sz); m.castShadow=true; return m; }
function cn(r,h,c,x,y,z,rx=0,ry=0,rz=0,seg=5){ const m=new THREE.Mesh(new THREE.ConeGeometry(r,h,seg),lmat(c)); m.position.set(x,y,z); m.rotation.set(rx,ry,rz); m.castShadow=true; return m; }
function cyl(rt,rb,h,c,x,y,z,rx=0,seg=6){ const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),lmat(c)); m.position.set(x,y,z); m.rotation.x=rx; m.castShadow=true; return m; }
function eye2(g,x,y,z,r=.035){ g.add(blob(r,0x15100c,x,y,z,1,1,1,0)); g.add(blob(r*.35,0xffffff,x+r*.3,y+r*.35,z+r*.6,1,1,1,0)); }
function legs(g,P,pos,len,r,c,foot){ P.legs=[]; pos.forEach(([x,z],i)=>{ const p=new THREE.Group(); p.position.set(x,len,z); p.add(cyl(r*.8,r,len,c,0,-len/2,0)); if(foot) p.add(blob(r*1.2,foot,0,-len,r*.4,1,.6,1.4,0)); g.add(p); P.legs.push([p,i===0||i===3?0:Math.PI]); }); }
function cubeCritter(kind){ const g=new THREE.Group(), P={};
 if(kind==='conill'){ const B=new THREE.Group(); g.add(B); P.body=B; B.add(blob(.32,0x8f7a62,0,.38,-.05,1,.9,1.3)); B.add(blob(.2,0xd8cdbd,0,.3,.12,1,.8,1)); B.add(blob(.21,0x8f7a62,0,.62,.33,1,1,1.1)); B.add(blob(.09,0xd8cdbd,0,.55,.5,1,.8,.8,0)); B.add(blob(.03,0x3a2a22,0,.58,.55,1,1,1,0));
  eye2(B,-.12,.68,.46); eye2(B,.12,.68,.46); for(const sx of [-1,1]){ const e=new THREE.Group(); e.position.set(sx*.08,.78,.3); e.rotation.set(-.35,0,sx*.25); e.add(blob(.07,0x8f7a62,0,.2,0,1,3.2,.45,0)); e.add(blob(.045,0xd9a8a0,0,.2,.03,1,3,.3,0)); B.add(e); }
  B.add(blob(.1,0xf2ece3,0,.42,-.45,1,1,1,0)); legs(g,P,[[-.15,.18],[.15,.18],[-.16,-.22],[.16,-.22]],.16,.05,0x7a6652); P.hop=1; }
 if(kind==='senglar'){ const B=new THREE.Group(); g.add(B); P.body=B; B.add(blob(.45,0x4a3a2c,0,.55,0,1,.95,1.5)); B.add(blob(.32,0x3d2f24,0,.6,.62,1,.95,1.1)); B.add(cyl(.12,.14,.25,0x6b5444,0,.52,.88,Math.PI/2)); B.add(cyl(.12,.12,.02,0x8a6a5a,0,.52,1.01,Math.PI/2,8));
  for(const sx of [-1,1]){ B.add(cn(.03,.18,0xf2ece3,sx*.12,.46,.85,-.6,0,sx*.3,4)); B.add(cn(.07,.16,0x3d2f24,sx*.18,.88,.55,-.3,0,sx*.4,4)); } eye2(B,-.16,.7,.82,.03); eye2(B,.16,.7,.82,.03);
  for(let i=0;i<5;i++) B.add(cn(.06,.18,0x2e231b,0,.98-i*.02,.45-i*.22,-.3,0,0,4)); B.add(cyl(.02,.01,.25,0x2e231b,0,.55,-.7,-.6)); legs(g,P,[[-.2,.38],[.2,.38],[-.2,-.38],[.2,-.38]],.3,.07,0x2e231b,0x1e1712); }
 if(kind==='esquirol'){ const B=new THREE.Group(); g.add(B); P.body=B; B.add(blob(.2,0xb4532a,0,.3,0,1,1.1,1.2)); B.add(blob(.12,0xeedcc6,0,.27,.13,1,1.2,.8)); B.add(blob(.15,0xb4532a,0,.55,.18,1,1,1.1)); eye2(B,-.08,.6,.3,.025); eye2(B,.08,.6,.3,.025);
  for(const sx of [-1,1]) B.add(cn(.04,.12,0xa34a24,sx*.07,.72,.15,0,0,sx*.2,4)); const t=new THREE.Group(); t.position.set(0,.25,-.2); t.add(blob(.15,0xc4632f,0,.2,-.08,1,1.6,.9)); t.add(blob(.14,0xc4632f,0,.48,.02,1,1.3,.9)); g.add(t); P.tail=t; legs(g,P,[[-.09,.12],[.09,.12],[-.1,-.1],[.1,-.1]],.1,.03,0x8a3f20); P.hop=1; }
 if(kind==='aguila'){ g.add(blob(.32,0x5a3a20,0,0,0,1,.85,1.6)); g.add(blob(.2,0xf2ece3,0,.15,.48,1,1,1.1)); g.add(cn(.07,.2,0xf2b91f,0,.1,.7,Math.PI/2,0,0,4)); eye2(g,-.1,.2,.6,.025); eye2(g,.1,.2,.6,.025);
  for(const sx of [-1,1]){ const p=new THREE.Group(); p.position.set(sx*.25,.05,0); const w=new THREE.Mesh(new THREE.BoxGeometry(1.3,.05,.5),lmat(0x4a2f18)); w.position.x=sx*.65; w.castShadow=true; p.add(w); const t=new THREE.Mesh(new THREE.BoxGeometry(.4,.04,.38),lmat(0x2e1d0f)); t.position.set(sx*1.35,0,-.05); t.rotation.y=sx*.25; p.add(t); g.add(p); P[sx<0?'wl':'wr']=p; }
  const tl=new THREE.Mesh(new THREE.BoxGeometry(.38,.04,.42),lmat(0xf2ece3)); tl.position.set(0,0,-.68); g.add(tl); }
 if(kind==='ocell'){ g.add(blob(.14,0x3b6fb0,0,0,0,1,1,1.3)); g.add(blob(.1,0xf2c21f,0,-.03,.07,1,1,.9)); g.add(blob(.1,0x1c2230,0,.1,.12,1,.9,1)); g.add(blob(.05,0xffffff,0,.08,.19,1.6,.6,.6,0)); g.add(cn(.025,.07,0x333333,0,.08,.24,Math.PI/2,0,0,4)); eye2(g,-.05,.12,.2,.015); eye2(g,.05,.12,.2,.015);
  for(const sx of [-1,1]){ const p=new THREE.Group(); p.position.set(sx*.1,.03,0); const w=new THREE.Mesh(new THREE.BoxGeometry(.3,.03,.18),lmat(0x2d5a92)); w.position.x=sx*.15; p.add(w); g.add(p); P[sx<0?'wl':'wr']=p; } g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(.1,.02,.2),lmat(0x2d5a92)),{})); g.children.at(-1).position.set(0,.02,-.22); }
 if(kind==='serp'){ const segs=[]; for(let i=0;i<12;i++){ const s=.09-i*.005; const m=blob(s,i%3===0?0x5c4a1e:0x7a6a2a,0,s*.9,-i*.15,1,.8,1.3,0); g.add(m); segs.push(m);} const h=blob(.11,0x7a6a2a,0,.1,.16,1,.7,1.4,0); g.add(h); eye2(h,-.06,.04,.06,.02); eye2(h,.06,.04,.06,.02); g.add(cyl(.008,.004,.12,0xc0392b,0,.08,.33,Math.PI/2,3)); P.segs=segs; }
 if(kind==='eruga'){ const segs=[]; for(let i=0;i<7;i++){ const m=blob(.07,i===0?0x7fae3a:0x9ccc45,0,.07,-i*.1,1,1,1,0); g.add(m); segs.push(m);} eye2(segs[0],-.035,.03,.05,.012); eye2(segs[0],.035,.03,.05,.012); P.segs=segs; }
 if(kind==='formiga'){ g.add(blob(.05,0x2a1a12,0,.06,.09,1,1,1.1,0)); g.add(blob(.035,0x2a1a12,0,.06,0,1,1,1.3,0)); g.add(blob(.07,0x3a2418,0,.08,-.11,1,.9,1.3,0)); for(let i=0;i<3;i++) for(const sx of [-1,1]){ const l=cyl(.006,.006,.12,0x2a1a12,sx*.06,.04,.02-i*.03,0,3); l.rotation.z=sx*1.1; g.add(l);} P.ant=1; }
 if(kind==='cuc'){ const segs=[]; for(let i=0;i<8;i++){ const m=blob(.035,0xc97b7b,0,.035,-i*.05,1,1,1.2,0); g.add(m); segs.push(m);} P.segs=segs; }
 if(kind==='bolet'){ g.add(cyl(.07,.09,.22,0xf0e6d2,0,.11,0,0,7)); g.add(blob(.18,0x8a5a2b,0,.24,0,1,.55,1,1)); }

 if(kind==='granota'){ const B=new THREE.Group(); g.add(B); P.body=B; B.add(blob(.26,0x5b9a32,0,.2,0,1.15,.7,1.1)); B.add(blob(.2,0xd9d68a,0,.14,.08,1,.55,.9)); for(const sx of [-1,1]){ B.add(blob(.08,0x5b9a32,sx*.13,.36,.15)); eye2(B,sx*.13,.4,.2,.04); B.add(blob(.1,0x4a8428,sx*.25,.1,-.12,1.1,.6,1.8,0)); B.add(blob(.05,0x4a8428,sx*.2,.06,.2,1,.6,1.4,0)); } B.add(cyl(.12,.12,.01,0x2a3a14,0,.22,.27,Math.PI/2.6,8)); P.hop=2; }
 if(kind==='anec'){ const B=new THREE.Group(); g.add(B); P.body=B; B.add(blob(.26,0x8a7a6a,0,.15,0,1,.75,1.35)); B.add(blob(.12,0xf2ece3,0,.32,.22,1.2,.3,1.2,0)); B.add(blob(.15,0x1f6b3a,0,.48,.3)); B.add(cn(.05,.16,0xf2a23a,0,.45,.48,Math.PI/2,0,0,4)); eye2(B,-.07,.52,.39,.02); eye2(B,.07,.52,.39,.02); B.add(cn(.08,.18,0x3a3a3a,0,.28,-.38,-1.1,0,0,4)); for(const sx of [-1,1]) B.add(blob(.12,0x6a5a4a,sx*.2,.18,-.02,.4,.6,1.3,0)); P.bob=1; }
 if(kind==='flamenc'){ const B=new THREE.Group(); g.add(B); P.body=B; B.add(blob(.26,0xf28aa0,0,1.05,0,1,.8,1.4)); B.add(cn(.1,.3,0x1a1a1a,0,1.08,-.4,-1.4,0,0,4)); const nk=new THREE.Group(); nk.position.set(0,1.15,.3); B.add(nk); nk.add(cyl(.04,.05,.5,0xf5a3b5,0,.22,.05,.3)); nk.add(cyl(.035,.04,.35,0xf5a3b5,0,.55,.18,-.5)); nk.add(blob(.09,0xf5a3b5,0,.72,.3)); nk.add(cn(.04,.18,0x1a1a1a,0,.66,.42,Math.PI/1.6,0,0,4)); eye2(nk,-.06,.75,.35,.015); eye2(nk,.06,.75,.35,.015); P.neck=nk;
  P.legs=[]; for(const sx of [-1,1]){ const l=new THREE.Group(); l.position.set(sx*.08,.85,0); l.add(cyl(.015,.015,.85,0xe0708a,0,-.42,0)); l.add(blob(.04,0xe0708a,0,-.85,.04,1,.4,1.6,0)); B.add(l); P.legs.push([l,sx<0?0:Math.PI]); } }
 if(kind==='llodriga'){ const B=new THREE.Group(); g.add(B); P.body=B; B.add(blob(.2,0x5a3a24,0,.22,0,1,.9,2.2)); B.add(blob(.15,0x6a4a30,0,.3,.45,1,.9,1.1)); B.add(blob(.1,0xcfb79a,0,.25,.56,1.2,.7,.8,0)); B.add(blob(.025,0x111111,0,.28,.64,1,1,1,0)); eye2(B,-.07,.36,.55,.022); eye2(B,.07,.36,.55,.022); for(const sx of [-1,1]) B.add(blob(.035,0x5a3a24,sx*.1,.42,.42,1,1,1,0));
  const t=new THREE.Group(); t.position.set(0,.22,-.42); t.add(cn(.08,.55,0x4a2f1c,0,0,-.25,-Math.PI/2,0,0,5)); B.add(t); P.tail=t; legs(g,P,[[-.12,.25],[.12,.25],[-.12,-.25],[.12,-.25]],.1,.04,0x4a2f1c); P.swimmy=1; }
 if(kind==='cargol'){ g.add(blob(.07,0xb8a890,0,.04,.05,1,.6,2.6,0)); for(const sx of [-1,1]) g.add(cyl(.008,.008,.1,0xb8a890,sx*.025,.1,.2,-.4,3)); const sh=new THREE.Group(); sh.position.set(0,.14,-.02); g.add(sh); sh.add(blob(.11,0x8a5a32,0,0,0,.8,1,1)); sh.add(blob(.07,0xa87040,.03,.04,.02,.8,1,1)); sh.add(blob(.035,0xc08a58,.05,.07,.04,.8,1,1,0)); }
 if(kind==='mosquit'){ g.add(blob(.04,0x4a4a4a,0,0,0,1,1,2,0)); for(const sx of [-1,1]){ const p=new THREE.Group(); const w=new THREE.Mesh(new THREE.BoxGeometry(.12,.005,.05),new THREE.MeshStandardMaterial({color:0xddeeff,transparent:true,opacity:.6})); w.position.x=sx*.06; p.add(w); g.add(p); P[sx<0?'wl':'wr']=p; } for(let i=0;i<3;i++) for(const sx of [-1,1]){ const l=cyl(.003,.003,.12,0x333333,sx*.03,-.05,-.03+i*.03,0,3); l.rotation.z=sx*.6; g.add(l);} }
 if(kind==='algues'||kind==='posidonia'){ const col=kind==='algues'?[0x4f9a3a,0x6ab04a,0x3f7f2e]:[0x2f6a3a,0x3f7f45,0x285a30]; P.blades=[]; const n=kind==='algues'?6:9; for(let i=0;i<n;i++){ const bl=new THREE.Group(); const a=i/n*6.28; bl.position.set(Math.cos(a)*.12,0,Math.sin(a)*.12); bl.rotation.y=a; const L=kind==='algues'?5:7; let prev=bl; for(let k=0;k<L;k++){ const sg=new THREE.Group(); sg.position.y=k?.18:0; const m=new THREE.Mesh(new THREE.BoxGeometry(kind==='algues'?.07:.1,.2,.015),lmat(col[(i+k)%3])); m.position.y=.1; sg.add(m); prev.add(sg); prev=sg; P.blades.push([sg,i*.7+k*.4]); } g.add(bl);} }
 if(kind==='canyis'){ P.blades=[]; for(let i=0;i<9;i++){ const a=i*2.4, r=.08+(i%3)*.06; const bl=new THREE.Group(); bl.position.set(Math.cos(a)*r,0,Math.sin(a)*r); const h=1.1+(i%4)*.25; bl.add(cyl(.012,.02,h,0x6a8a3a,0,h/2,0,0,4)); if(i%2) bl.add(cyl(.035,.035,.22,0x6a4a2a,0,h-.05,0,0,6)); else bl.add(cn(.04,.5,0x7aa04a,0,h*.6,0,0,0,.3,3)); g.add(bl); P.blades.push([bl,i]); } }
 if(kind==='bacteri'){ for(let i=0;i<6;i++){ const m=new THREE.Mesh(new THREE.CapsuleGeometry(.025,.06,3,6),new THREE.MeshStandardMaterial({color:0x9be37a,emissive:0x2a6a1a,transparent:true,opacity:.85})); m.position.set((Math.random()-.5)*.25,.03,(Math.random()-.5)*.25); m.rotation.z=Math.random()*3; g.add(m);} P.spin=1; }
 if(kind==='escopinya'){ g.add(blob(.12,0xd8c8a8,0,.04,0,1,.35,1)); const top=new THREE.Group(); top.position.set(0,.05,-.1); top.add(blob(.12,0xc8a878,0,.03,.1,1,.38,1)); g.add(top); P.lid=top; }
 if(kind==='medusa'){ const bell=new THREE.Mesh(new THREE.SphereGeometry(.28,10,6,0,Math.PI*2,0,Math.PI/2),new THREE.MeshStandardMaterial({color:0xf0a8d8,emissive:0x50203a,transparent:true,opacity:.7,flatShading:true,side:THREE.DoubleSide})); g.add(bell); P.bell=bell; P.ten=[]; for(let i=0;i<8;i++){ const a=i/8*6.28; const t=new THREE.Mesh(new THREE.CylinderGeometry(.008,.004,.6,3),new THREE.MeshBasicMaterial({color:0xf8c8e8,transparent:true,opacity:.7})); t.position.set(Math.cos(a)*.18,-.3,Math.sin(a)*.18); g.add(t); P.ten.push(t);} }
 if(kind==='cranc'){ const B=new THREE.Group(); g.add(B); P.body=B; B.add(blob(.2,0xd9572a,0,.15,0,1.4,.5,1)); eye2(B,-.07,.28,.14,.025); eye2(B,.07,.28,.14,.025); for(const sx of [-1,1]){ B.add(cyl(.012,.012,.12,0xd9572a,sx*.07,.22,.13,0,3)); const cl=new THREE.Group(); cl.position.set(sx*.26,.15,.15); cl.add(blob(.08,0xe0683a,sx*.05,0,.06,1.2,.7,1,0)); B.add(cl); P[sx<0?'cl':'cr']=cl; }
  P.legs=[]; for(let i=0;i<3;i++) for(const sx of [-1,1]){ const l=new THREE.Group(); l.position.set(sx*.22,.12,-.05+i*.08-.05); const m=cyl(.015,.012,.22,0xc0482a,sx*.09,-.04,0,0,3); m.rotation.z=sx*1.1; l.add(m); B.add(l); P.legs.push([l,(i+(sx>0?1:0))%2?0:Math.PI]); } P.side=1; }
 if(kind==='pop'){ const B=new THREE.Group(); g.add(B); P.body=B; B.add(blob(.28,0xb8475a,0,.42,-.08,1,1.15,1.2)); eye2(B,-.12,.42,.18,.035); eye2(B,.12,.42,.18,.035); P.ten=[]; for(let i=0;i<8;i++){ const a=i/8*6.28; const t=new THREE.Group(); t.position.set(Math.cos(a)*.16,.18,Math.sin(a)*.16); t.rotation.y=-a; let prev=t; for(let k=0;k<4;k++){ const sg=new THREE.Group(); sg.position.x=k?.14:0; sg.add(blob(.055-k*.01,0xa83a4e,.07,0,0,1.3,1,1,0)); prev.add(sg); prev=sg; P.ten.push([sg,i+k*.6]); } B.add(t);} }
 if(kind==='tortuga'){ const B=new THREE.Group(); g.add(B); P.body=B; B.add(blob(.38,0x5a6a3a,0,.18,0,1,.45,1.2)); B.add(blob(.3,0xc8b88a,0,.1,0,1,.25,1.1)); B.add(blob(.13,0x8a9a5a,0,.18,.5,1,.85,1.2)); eye2(B,-.07,.23,.6,.022); eye2(B,.07,.23,.6,.022); P.flip=[]; for(const [x,z,s] of [[-.33,.22,1],[.33,.22,1],[-.25,-.32,.6],[.25,-.32,.6]]){ const f=new THREE.Group(); f.position.set(x,.12,z); const m=blob(.14*s,0x8a9a5a,Math.sign(x)*.12*s,0,0,2,.25,.9,0); f.add(m); B.add(f); P.flip.push([f,Math.sign(x)]); } }
 g.userData.parts=P; g.userData.kind=kind; return g; }
function animCritter(g,t,state){ const P=g.userData.parts, k=g.userData.kind; const mv=state==='walk'?1:state==='run'?2.2:0;
 if(P.wl){ const f=state==='glide'?Math.sin(t*1.5)*.12:Math.sin(t*(k==='ocell'?20:6))*.6; P.wl.rotation.z=f; P.wr.rotation.z=-f; }
 if(P.segs){ const sp=state==='run'?9:state==='idle'?1.2:4.5; P.segs.forEach((m,i)=>m.position.x=Math.sin(t*sp-i*.9)*(k==='serp'?.07:.025)*(i/3+.4)); if(k==='eruga') P.segs.forEach((m,i)=>m.position.y=.07+Math.max(0,Math.sin(t*sp-i*.9))*.04); }
 if(P.legs){ const sp=state==='run'?14:9; P.legs.forEach(([p,ph])=>p.rotation.x=mv?Math.sin(t*sp+ph)*.55:0); }
 if(P.body){ P.body.position.y=P.hop&&mv?Math.abs(Math.sin(t*(state==='run'?7:4.5)))*.12*mv:(state==='eat'?-.04+Math.sin(t*6)*.02:0); P.body.rotation.x=state==='eat'?.25:0; }
 if(P.tail) P.tail.rotation.x=P.swimmy?Math.sin(t*4)*.3:Math.sin(t*3)*.15-.1;
 if(P.blades) P.blades.forEach(([sg,ph])=>{ sg.rotation.z=Math.sin(t*1.3+ph)*.12; sg.rotation.x=Math.cos(t*1.1+ph)*.08; });
 if(P.spin) g.rotation.y=t*.5;
 if(P.lid) P.lid.rotation.x=-Math.max(0,Math.sin(t*.8))*.5;
 if(P.bell){ const s=1+Math.sin(t*3)*.12; P.bell.scale.set(s,1/s,s); P.ten.forEach((m,i)=>m.rotation.x=Math.sin(t*3+i)*.25); }
 if(P.ten&&!P.bell) P.ten.forEach(([sg,ph])=>sg.rotation.z=Math.sin(t*2+ph)*.35);
 if(P.flip) P.flip.forEach(([f,sx])=>f.rotation.z=sx*Math.sin(t*(state==='run'?6:3))*.5);
 if(P.cl){ P.cl.rotation.y=Math.sin(t*2)*.3; P.cr.rotation.y=-Math.sin(t*2)*.3; }
 if(P.neck) P.neck.rotation.x=state==='eat'?.9+Math.sin(t*4)*.1:Math.sin(t)*.05;
 if(P.bob&&P.body) P.body.position.y=Math.sin(t*2)*.02;
 if(P.hop===2&&P.body) P.body.position.y=mv?Math.max(0,Math.sin(t*(state==='run'?8:5)))*.25*mv:0;
 if(P.ant) g.position.y=Math.abs(Math.sin(t*20))*.01*mv; }

/* espècie → aparença i hàbitat, per ecosistema */
const VIS={
 bosc:{guineu:{m:'Fox',h:.75},cervol:{m:'Deer',h:1.6},llop:{m:'Wolf',h:1.0},conill:{m:'Rabbit',h:.5,hop:1},senglar:{k:1.15},esquirol:{k:1},eruga:{k:1},formiga:{k:1.4},cuc:{k:1.4},bolet:{k:1.3,st:1},aguila:{m:'Hawk',h:2.0,len:1,hab:'air',alt:7.5,fly:1},ocell:{m:'Parrot',h:.6,len:1,hab:'air',alt:4,fly:1},serp:{k:1.4},herba:{plant:['Bush_1','BushBerries_1'],h:.9,st:1}},
 bassa:{algues:{k:1.1,hab:'pondfloor',st:1},canyis:{k:1,hab:'shore',st:1},nenufar:{m:'Lilypad',h:.12,hab:'surface',st:1,s:1.4},mosquit:{k:1.6,hab:'air',alt:1.2},cargol:{k:1.5,hab:'shore'},peix:{m:'Goldfish',h:.45,len:1,hab:'water'},anec:{k:1.2,hab:'surface'},granota:{m:'Frog',h:.4,hab:'shore',amph:1},flamenc:{m:'Flamingo',h:1.5,len:1,hab:'air',alt:2.2,fly:1},serp:{k:1.3,hab:'shore',amph:1},llodriga:{k:1.3,hab:'shore',amph:1},bacteri:{k:1.6,hab:'pondfloor',st:1}},
 mar:{posidonia:{k:1.3,hab:'floor',st:1},algues:{k:1.3,hab:'floor',st:1},escopinya:{k:1.5,hab:'floor',st:1},peix:{m:'Clownfish',h:.5,len:1,hab:'water',school:1},medusa:{k:1.2,hab:'water'},cranc:{k:1.4,hab:'floor'},pop:{k:1.3,hab:'floor'},tortuga:{m:'Turtle',h:1.1,len:1,hab:'water'},peixgran:{m:'Tuna',h:1.4,len:1,hab:'water'},dofi:{m:'Dolphin',h:2.2,len:1,hab:'water'},tauro:{m:'Shark',h:2.8,len:1,hab:'water'}}};
const ANIMNAMES={idle:['Frog_Idle','Idle','Swim','Swimming_Normal'],walk:['Frog_Jump','Walk','Swim','Swimming_Normal'],run:['Frog_Jump','Gallop','Swim','Swimming_Fast'],eat:['Frog_Attack','Eating','Swim','Swimming_Normal'],death:['Frog_Death','Death']};
const SPEED={llop:[1,3.6],guineu:[.9,3.3],conill:[.7,3.0],senglar:[.7,2.2],cervol:[.8,2.8],eruga:[.15,.2],esquirol:[.8,2.6],formiga:[.35,.5],cuc:[.12,.15],serp:[.5,2.2],ocell:[1.6,2.4],aguila:[2,6.5],
 mosquit:[1,1.5],cargol:[.08,.1],peix:[.8,2.6],anec:[.4,1.2],granota:[.5,2],flamenc:[.4,1.4],llodriga:[.7,2.6],medusa:[.25,.4],cranc:[.4,1],pop:[.3,1.4],tortuga:[.5,1.2],peixgran:[1,3.2],dofi:[1.2,3.8],tauro:[1,3.6]};
const vis=id=>(VIS[eco]||{})[id];
const groundY=(x,z)=>{ let y=(Math.sin(x*.5)+Math.cos(z*.4))*.15; if(eco==='bassa'){ const d=Math.hypot(x,z); if(d<6.5) y-=1.2*(1-d/6.5); } if(eco==='mar') y=(Math.sin(x*.3)*Math.cos(z*.35))*.5; return y; };
let wlev=0, wrad=1; const WATERY=()=>eco==='bassa'?-.12-wlev:9;
function habPt(hab){ const a=Math.random()*6.28; let d,y;
 if(hab==='water'){ if(eco==='bassa'){ d=Math.random()*4.6; y=-.95+Math.random()*.6; } else { d=Math.random()*12; y=1.2+Math.random()*6; } }
 else if(hab==='surface'){ d=Math.random()*4.8; y=WATERY(); }
 else if(hab==='pondfloor'){ d=Math.random()*4.6; const p=new THREE.Vector3(Math.cos(a)*d,0,Math.sin(a)*d); p.y=groundY(p.x,p.z)+.02; return p; }
 else if(hab==='shore'){ d=6.3+Math.random()*3; }
 else if(hab==='floor'){ d=1+Math.random()*12; }
 else { d=2+Math.random()*11; if(eco==='bassa') d=6.6+Math.random()*7; }
 const p=new THREE.Vector3(Math.cos(a)*d,0,Math.sin(a)*d); p.y=(y!=null)?y:groundY(p.x,p.z); return p; }
function rndPt(){ return habPt('land'); }

/* ===== COMPORTAMENT ===== */
let natura=true, huntT=6, toastT=0;
function setAnim(b,name){ if(!b.acts||!Object.keys(b.acts).length) { b.cur=name; return; } let a=null; for(const n of (ANIMNAMES[name]||[name])){ const key=Object.keys(b.acts).find(k=>k===n||k.endsWith('|'+n)||k.startsWith(n)); if(key){a=b.acts[key];break;} } if(!a){ const k0=Object.keys(b.acts)[0]; a=b.acts.Idle||b.acts[k0]; }
 a.timeScale=name==='run'?2:name==='idle'?.6:1; if(!a||b.curA===a){ b.cur=name; return; } if(b.curA) b.curA.fadeOut(.2); a.reset().setEffectiveWeight(1).fadeIn(.2).play(); b.curA=a; b.cur=name; }
function initBehav(b){ const v=b.v; b.state='idle'; b.timer=Math.random()*3; b.target=null; b.mover=1; b.hab=v.hab||'land';
 if(b.hab==='air'){ b.alt=(v.alt||4)+Math.random()*1.5; b.ang=Math.random()*6.28; b.rad=b.id==='aguila'?9:eco==='bassa'?2+Math.random()*4:4+Math.random()*6; } setAnim(b,'idle'); }
function toast(t){ const el=$('#toast'); if(!el) return; el.textContent=t; el.classList.add('show'); toastT=3.2; }
function nearestAlive(id,pos){ let best=null,bd=1e9; for(const b of beings){ if(b.id!==id||b.dead||b.dying||!b.mover||b.hidden||b.state==='flee') continue; const d=b.obj.position.distanceTo(pos); if(d<bd){bd=d;best=b;} } return best; }
function startHunt(predId,preyId,force){ const S=ECOS[eco].sp; const preds=beings.filter(b=>b.id===predId&&b.mover&&!b.dead&&!b.dying&&!b.hidden&&b.state!=='chase'&&b.state!=='eat'); if(!preds.length) return false;
 const pred=preds[Math.floor(Math.random()*preds.length)];
 if(S[preyId].r==='prod'||!MOVERS(preyId)){ const plants=beings.filter(b=>b.id===preyId&&!b.dead&&!b.dying); if(!plants.length) return false; const tgt=plants[Math.floor(Math.random()*plants.length)].obj.position.clone(); if(S[preyId].tree) tgt.add(new THREE.Vector3(1,0,1));
  pred.state='graze'; pred.target=tgt; pred.timer=9; if(force) toast(`${S[predId].e} ${S[predId].n} va a menjar ${S[preyId].n.toLowerCase()}.`); return true; }
 const prey=nearestAlive(preyId,pred.obj.position); if(!prey) return false;
 pred.state='chase'; pred.prey=prey; pred.timer=8; prey.state='flee'; prey.from=pred; prey.timer=8;
 if(force||Math.random()<.5) toast(`${S[predId].e} ${S[predId].n} persegueix ${S[preyId].n.toLowerCase()}!`); return true; }
function autoHunt(){ const S=ECOS[eco].sp; const pairs=[]; for(const [id,s] of Object.entries(S)) if(alive.has(id)&&MOVERS(id)) for(const p of (s.eats||[])) if(alive.has(p)) pairs.push([id,p]);
 if(!pairs.length) return; const pr=pairs.filter(([a,p])=>MOVERS(p)); const pick=(pr.length&&Math.random()<.6?pr:pairs); const [a,p]=pick[Math.floor(Math.random()*pick.length)]; startHunt(a,p); }
const MOVERS=id=>beings.some(b=>b.id===id&&b.mover);
const tmpV=new THREE.Vector3();
function steer(b,dest,speed,dt,fly3){ const p=b.obj.position; tmpV.copy(dest).sub(p); if(!fly3) tmpV.y=0; const d=tmpV.length(); if(d<.05) return d; tmpV.normalize(); const step=Math.min(d,speed*dt); p.x+=tmpV.x*step; p.z+=tmpV.z*step; if(fly3) p.y+=tmpV.y*step;
 if(Math.abs(tmpV.x)+Math.abs(tmpV.z)>.05){ const want=Math.atan2(tmpV.x,tmpV.z)+(b.side?Math.PI/2:0); let dr=want-b.obj.rotation.y; dr=Math.atan2(Math.sin(dr),Math.cos(dr)); b.obj.rotation.y+=dr*Math.min(1,dt*6); } if(fly3) b.obj.rotation.x=-Math.asin(Math.max(-.6,Math.min(.6,tmpV.y)))*.6; return d; }
function clampHab(b){ const p=b.obj.position, h=b.hab;
 if(h==='water'){ const R=eco==='bassa'?4.8:12.5, r=Math.hypot(p.x,p.z); if(r>R){ p.x*=R/r; p.z*=R/r; } if(eco==='bassa') p.y=Math.max(groundY(p.x,p.z)+.15,Math.min(-.3,p.y)); else p.y=Math.max(groundY(p.x,p.z)+.6,Math.min(8.2,p.y)); }
 else if(h==='surface'){ const r=Math.hypot(p.x,p.z), R5=5*wrad; if(r>R5){ p.x*=R5/r; p.z*=R5/r; } p.y=Math.max(groundY(p.x,p.z),WATERY()-.02); }
 else if(h==='shore'&&!b.amph){ const r=Math.hypot(p.x,p.z); if(r<6.2){ p.x*=6.2/r; p.z*=6.2/r; } p.y=groundY(p.x,p.z); }
 else if(h==='shore'&&b.amph){ const r=Math.hypot(p.x,p.z); const gy=groundY(p.x,p.z); p.y= r<5.6? Math.max(gy+.1,Math.min(WATERY()-.15,p.y)) : gy; b.swimming=r<5.6; }
 else if(h!=='air'){ p.y=groundY(p.x,p.z)+(b.lift||0); if(eco==='bassa'&&h==='land'){ const r=Math.hypot(p.x,p.z); if(r<6.5){ p.x*=6.5/r; p.z*=6.5/r; } } }
 const rr=Math.hypot(p.x,p.z); if(rr>14.5){ p.x*=14.5/rr; p.z*=14.5/rr; } }
function behave(b,dt,T){ if(b.mixer) b.mixer.update(dt); if(b.v.hop&&!b.mixer){ const k=b.obj.children[0]; if(k) k.position.y=(b.cur==='walk'||b.cur==='run')?Math.abs(Math.sin((T+b.ph)*(b.cur==='run'?9:6)))*.14:0; } const S=ECOS[eco].sp, sp=SPEED[b.id]||[.6,2]; const in3d=b.hab==='water'||(b.amph&&b.swimming);
 if(b.critter) animCritter(b.obj.children[0],T+b.ph,b.cur);
 if(b.deadT!=null){ b.deadT-=dt; if(b.deadT<=0){ b.deadT=null; b.obj.visible=false; puff(b.obj.position); b.curA=null; b.mixer.stopAllAction(); } }
 if(b.hidden){ b.timer-=dt; if(b.timer<=0){ b.hidden=false; const p=habPt(b.hab); b.obj.position.copy(p); b.obj.visible=true; b.obj.scale.setScalar(.01); b.pop=0; b.state='idle'; b.timer=2; } return; }
 if(b.pop!=null){ b.pop+=dt*3; b.obj.scale.setScalar(Math.min(1,b.pop)); if(b.pop>=1) b.pop=null; }
 if(b.hab==='air'){ const p=b.obj.position;
  if(b.state==='chase'&&b.prey&&!b.prey.dead&&!b.prey.hidden){ const q=b.prey.obj.position; const hd=Math.hypot(q.x-p.x,q.z-p.z); steer(b,q,sp[1],dt); const ty=hd<3.5?q.y+.4:b.alt; p.y+=(ty-p.y)*Math.min(1,dt*(hd<3.5?4:1.5)); b.cur='fly';
   if(hd<.8&&Math.abs(p.y-q.y)<1) catchPrey(b); b.timer-=dt; if(b.timer<=0){ b.state='fly'; if(b.prey.state==='flee') { b.prey.state='idle'; b.prey.timer=1; } b.prey=null; } return; }
  b.ang+=dt*sp[0]/b.rad; const tx=Math.cos(b.ang)*b.rad, tz=Math.sin(b.ang)*b.rad; const ox=p.x,oz=p.z; p.x+=(tx-p.x)*Math.min(1,dt*2); p.z+=(tz-p.z)*Math.min(1,dt*2); p.y+=(b.alt+Math.sin(T+b.ph)*.4-p.y)*Math.min(1,dt*1.5);
  b.obj.rotation.y=Math.atan2(p.x-ox,p.z-oz)||b.obj.rotation.y; b.obj.rotation.z=b.id==='aguila'?-.3:0; if(b.v.pitch) b.obj.rotation.x=b.v.pitch; b.cur=b.id==='aguila'?'glide':'fly'; return; }
 const p=b.obj.position;
 if(b.state==='chase'){ const q=b.prey; if(!q||q.dead||q.hidden||q.dying){ b.state='idle'; b.timer=1; return; } setAnim(b,'run'); const d=steer(b,q.obj.position,sp[1],dt,in3d||q.hab==='water'); if(d<(b.hab==='water'?.6:.7)) catchPrey(b); b.timer-=dt; if(b.timer<=0){ b.state='idle'; b.timer=1.5; if(q.state==='flee'){q.state='idle';q.timer=1;} } }
 else if(b.state==='flee'){ setAnim(b,'run'); const f=b.from; tmpV.copy(p).sub(f?f.obj.position:p); if(!in3d) tmpV.y=0; if(tmpV.lengthSq()<.01) tmpV.set(1,0,0); tmpV.normalize(); const out=p.clone().addScaledVector(tmpV,3); const R=b.hab==='water'?(eco==='bassa'?4.5:12):13; const r=Math.hypot(out.x,out.z); if(r>R){ const tg=new THREE.Vector3(-p.z,0,p.x).normalize(); out.copy(p).addScaledVector(tg,3); }
  steer(b,out,sp[1]*.92,dt,in3d); b.timer-=dt; if(b.timer<=0||!f||f.state!=='chase'){ b.state='idle'; b.timer=1+Math.random()*2; } }
 else if(b.state==='graze'){ setAnim(b,'walk'); const d=steer(b,b.target,sp[0]*1.4,dt,in3d); b.timer-=dt; if(d<.45||b.timer<=0){ b.state='eat'; b.timer=3; } }
 else if(b.state==='walk'){ setAnim(b,'walk'); const d=steer(b,b.target,sp[0],dt,in3d||b.hab==='water'); if(d<.3){ b.state=Math.random()<.4&&S[b.id].r!=='desc'?'eat':'idle'; b.timer=1.5+Math.random()*3; } }
 else { setAnim(b,b.state==='eat'?'eat':'idle'); b.timer-=dt; if(b.hab==='water'&&b.target){ steer(b,b.target,sp[0]*.4,dt,true); } if(b.timer<=0){ b.state='walk'; b.target=habPt(b.amph&&Math.random()<.4?'water':b.hab==='shore'&&b.amph?'shore':b.hab); if(b.v.school&&b.leader&&b.leader!==b) b.target=b.leader.obj.position.clone().add(new THREE.Vector3((Math.random()-.5)*1.5,(Math.random()-.5),(Math.random()-.5)*1.5)); } }
 clampHab(b); }
function catchPrey(pred){ const q=pred.prey; if(!q) return; const S=ECOS[eco].sp; pred.state='eat'; pred.timer=2.5; pred.prey=null; setAnim(pred,'eat');
 q.state='idle'; q.hidden=true; q.timer=10+Math.random()*6; if(q.acts&&q.acts.Death){ q.mixer.stopAllAction(); const d=q.acts.Death; d.reset().setLoop(THREE.LoopOnce).play(); d.clampWhenFinished=true; q.curA=d; q.cur='death'; q.deadT=1.6; } else { q.obj.visible=false; puff(q.obj.position); }
 toast(`${S[pred.id].e} ${S[pred.id].n} s'ha menjat ${S[q.id].n.toLowerCase()}.`); }
let puffs=[];
const puffGeo=new THREE.IcosahedronGeometry(.1,0);
function puff(pos){ const wet=eco!=='bosc'&&pos.y<WATERY(); for(let i=0;i<10;i++){ const m=new THREE.Mesh(puffGeo,new THREE.MeshBasicMaterial({color:wet?0xcfefff:0xffffff,transparent:true,opacity:.9})); m.position.copy(pos).add(new THREE.Vector3(0,.3,0)); m.userData.v=new THREE.Vector3((Math.random()-.5)*2,Math.random()*1.5+.5,(Math.random()-.5)*2); m.userData.t=0; world.add(m); puffs.push(m);} }
function updPuffs(dt){ puffs=puffs.filter(m=>{ m.userData.t+=dt; m.position.addScaledVector(m.userData.v,dt); m.material.opacity=Math.max(0,.9-m.userData.t*1.2); m.scale.setScalar(1+m.userData.t*2); if(m.userData.t>.8){ m.parent&&m.parent.remove(m); m.material.dispose(); return false;} return true; }); }
function stepNature(dt,T){ for(const b of beings){ if(b.mover&&!b.dead&&!b.dying) behave(b,dt,T); else if(b.critter&&!b.dead) animCritter(b.obj.children[0],T+b.ph,'idle'); }
 updPuffs(dt); if(toastT>0){ toastT-=dt; if(toastT<=0) $('#toast')&&$('#toast').classList.remove('show'); }
 if(natura&&['elements','bio','relacions'].includes(mode)&&MODELS.__ok){ huntT-=dt; if(huntT<=0){ autoHunt(); huntT=7+Math.random()*7; } } }
