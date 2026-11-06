/* Persones animades (Quaternius, CC0): carrega, clona i anima; substitueix les càpsules */
window.People=function(THREE,GLTFLoader,SkeletonUtils,MeshoptDecoder){
 const P={M:{},ready:false,list:[]}; const KEYS=Object.keys(window.PEOPLEASSETS||{});
 P.load=async()=>{ const L=new GLTFLoader(); L.setMeshoptDecoder(MeshoptDecoder); for(const k of KEYS){ const bin=atob(PEOPLEASSETS[k]), buf=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) buf[i]=bin.charCodeAt(i); P.M[k]=await new Promise((res,rej)=>L.parse(buf.buffer,'',res,rej)); } P.ready=true; return P; };
 /* make(h, opts{kind, anim:'Idle'|'Walk'|'Wave'|'Interact', tint}) -> {o, mixer, play(name)} */
 P.make=(h=1.7,opts={})=>{ const k=opts.kind||KEYS[Math.floor(Math.random()*KEYS.length)]; const g=P.M[k]; if(!g) return null; const o=SkeletonUtils.clone(g.scene); o.updateMatrixWorld(true); const bb=new THREE.Box3().setFromObject(o); const s=h/(bb.max.y-bb.min.y); const wrap=new THREE.Group(); o.scale.setScalar(s); o.position.y=-bb.min.y*s; wrap.add(o);
  o.traverse(m=>{ if(m.isMesh){ m.castShadow=true; m.frustumCulled=false; if(m.material&&m.material.metalness>.1){ m.material=m.material.clone(); m.material.metalness=0; m.material.roughness=.75; } if(opts.tint){ m.material=m.material.clone(); m.material.color.lerp(new THREE.Color(opts.tint),.35); } } });
  const mixer=new THREE.AnimationMixer(o); const acts={}; for(const a of g.animations){ const n=a.name.split('|').pop().replace(/^Man_/,''); acts[n]=mixer.clipAction(a); if(n==='Clapping'&&!acts.Wave) acts.Wave=acts[n]; } let cur=null;
  const play=(n,fade=.25)=>{ const a=acts[n]||acts.Idle; if(!a||a===cur) return; if(cur) cur.fadeOut(fade); a.reset().fadeIn(fade).play(); cur=a; };
  play(opts.anim||'Idle'); mixer.update(Math.random()*2); const person={o:wrap,mixer,play,acts,kind:k}; P.list.push(person); return person; };
 P.tick=dt=>{ for(const p of P.list) if(p.o.parent&&p.mixer) p.mixer.update(dt); };
 P.clear=()=>{ P.list=[]; };
 /* substitueix tots els objectes amb userData.person={h,anim,tint} dins de root */
 P.swap=(root)=>{ const todo=[]; root.traverse(o=>{ if(o.userData&&o.userData.person) todo.push(o); }); for(const o of todo){ const d=o.userData.person; const q=P.make(d.h||1.7,{anim:d.anim||'Idle',tint:d.tint}); if(!q) continue; q.o.position.copy(o.position); q.o.rotation.copy(o.rotation); q.o.scale.copy(o.scale); q.o.userData=Object.assign({},o.userData,{person:null,real:1}); if(d.anim==='Idle'&&Math.random()<.3) q.play('Idle_Neutral'); o.parent.add(q.o); o.parent.remove(o); } return todo.length; };
 return P; };
