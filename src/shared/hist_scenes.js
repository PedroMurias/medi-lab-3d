/* Diorames 3D de la Història: taller vs fàbrica, tron vs parlament, carrers de 4 èpoques */
window.HistScenes=function(THREE,scene,opts){
 const fm=(c,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.8,flatShading:true},o));
 const bx=(w,h,d,c,x=0,y=0,z=0,o)=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),fm(c,o)); m.position.set(x,y+h/2,z); m.castShadow=m.receiveShadow=true; return m; };
 const cyl=(r1,r2,h,c,x=0,y=0,z=0,seg=10)=>{ const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,seg),fm(c)); m.position.set(x,y+h/2,z); m.castShadow=true; return m; };
 const person=(c,skin=0xf2c7a5,s=1)=>{ const g=new THREE.Group(); g.userData.person={h:1.7*s,anim:'Idle',tint:c}; const b=new THREE.Mesh(new THREE.CapsuleGeometry(.28,.8,4,8),fm(c)); b.position.y=.85; g.add(b); const h=new THREE.Mesh(new THREE.SphereGeometry(.26,10,8),fm(skin)); h.position.y=1.65; g.add(h); g.scale.setScalar(s); g.traverse(o=>{ if(o.isMesh) o.castShadow=true; }); return g; };
 const tree=(x,z,s=1,col=0x3f8f3f)=>{ const g=new THREE.Group(); g.add(cyl(.18,.25,1.6,0x6b4a2b,0,0,0,6)); const c=new THREE.Mesh(new THREE.IcosahedronGeometry(1.3,1),fm(col)); c.position.y=2.4; c.scale.y=1.3; c.castShadow=true; g.add(c); g.position.set(x,0,z); g.scale.setScalar(s); return g; };
 const label=(txt,col='#ffffff')=>{ const cv=document.createElement('canvas'); cv.width=512; cv.height=96; const g=cv.getContext('2d'); g.fillStyle='rgba(8,14,30,.85)'; g.beginPath(); g.roundRect(4,4,504,88,24); g.fill(); g.strokeStyle=col; g.lineWidth=4; g.stroke(); g.fillStyle='#fff'; g.font='700 44px Space Grotesk, sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(txt,256,50); const t=new THREE.CanvasTexture(cv); t.colorSpace=THREE.SRGBColorSpace; const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false})); sp.scale.set(6,1.1,1); return sp; };
 const anims=[]; const S={};
 /* ---------- REVOLUCIÓ INDUSTRIAL ---------- */
 { const G=new THREE.Group(); G.visible=false; scene.add(G); S.revol=G;
   const ground=new THREE.Mesh(new THREE.CircleGeometry(26,48),fm(0x6a8a4a)); ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; G.add(ground);
   /* taller artesà (esquerra) */
   const W=new THREE.Group(); W.position.x=-11; G.add(W);
   W.add(bx(7,3.2,5,0xd9c7a0)); const roof=new THREE.Mesh(new THREE.ConeGeometry(5.2,2.2,4),fm(0x8a4b3a)); roof.rotation.y=Math.PI/4; roof.position.y=4.3; roof.castShadow=true; W.add(roof);
   W.add(bx(2.2,.1,1.2,0x7a5a3a,0,1.0,3.4)); W.add(bx(.12,1,.12,0x7a5a3a,-1,0,3.9)); W.add(bx(.12,1,.12,0x7a5a3a,1,0,3.9)); W.add(bx(.12,1,.12,0x7a5a3a,-1,0,2.9)); W.add(bx(.12,1,.12,0x7a5a3a,1,0,2.9));
   const wheel=new THREE.Mesh(new THREE.TorusGeometry(.7,.08,8,20),fm(0x7a5a3a)); wheel.position.set(2.2,1.0,3.4); W.add(wheel); anims.push(t=>wheel.rotation.y=t*.8);
   const art=person(0x8a6a4a); art.position.set(0,0,4.6); W.add(art); const art2=person(0x5a6a8a); art2.position.set(-2.6,0,4.2); W.add(art2);
   W.add(bx(.8,.6,.5,0xa8865a,-.4,1.1,3.4)); const ham=bx(.1,.6,.1,0x444,.5,1.1,3.4); W.add(ham); anims.push(t=>ham.rotation.z=Math.sin(t*5)*.5-.3);
   const lw=label('Taller artesà','#ffd23f'); lw.position.set(0,6.2,0); W.add(lw);
   W.add(tree(-5,-3,1.1)); W.add(tree(4.5,-3.5,.9));
   /* fàbrica (dreta) */
   const F=new THREE.Group(); F.position.x=10; G.add(F);
   F.add(bx(12,5,7,0x9a4a3a)); F.add(bx(12.4,.4,7.4,0x5a3a2a,0,5,0)); for(let i=0;i<3;i++){ const r=new THREE.Mesh(new THREE.BoxGeometry(4,2.2,7.2),fm(0x6a5a5a)); r.position.set(-4+i*4,6.4,0); r.rotation.z=Math.PI/4; r.scale.x=.55; F.add(r); }
   for(let i=0;i<5;i++){ F.add(bx(1.2,1.6,.1,0xffe08a,-4.8+i*2.4,1.6,3.55,{emissive:0xffb040,emissiveIntensity:.5})); }
   const chim=cyl(.6,.8,7,0x4a3a3a,4.5,5,-2,10); F.add(chim); const chim2=cyl(.5,.7,6,0x4a3a3a,-3,5,-2.2,10); F.add(chim2);
   /* fum */
   const N=120, pos=new Float32Array(N*3), life=new Float32Array(N); for(let i=0;i<N;i++){ life[i]=Math.random(); }
   const sg=new THREE.BufferGeometry(); sg.setAttribute('position',new THREE.BufferAttribute(pos,3)); const smoke=new THREE.Points(sg,new THREE.PointsMaterial({color:0xcfd4dd,size:1.2,transparent:true,opacity:.55,depthWrite:false})); F.add(smoke);
   anims.push((t,dt)=>{ for(let i=0;i<N;i++){ life[i]+=dt*.25; if(life[i]>1) life[i]=0; const src=i%2?[4.5,12,-2]:[-3,11,-2.2]; const l=life[i]; pos[i*3]=src[0]+Math.sin(l*7+i)*l*1.5+l*2.5; pos[i*3+1]=src[1]+l*7; pos[i*3+2]=src[2]+Math.cos(l*5+i)*l*1.2; } sg.attributes.position.needsUpdate=true; });
   /* màquina de vapor: volant i biela */
   const M=new THREE.Group(); M.position.set(-2,0,5.5); F.add(M); M.add(bx(2.4,1.2,1.2,0x3a3a44,0,0,0)); const boiler=new THREE.Mesh(new THREE.CylinderGeometry(.6,.6,2.6,12),fm(0x555566,{metalness:.5,roughness:.4})); boiler.rotation.z=Math.PI/2; boiler.position.set(0,1.7,0); M.add(boiler);
   const fly=new THREE.Mesh(new THREE.TorusGeometry(1.1,.12,8,24),fm(0x222,{metalness:.6,roughness:.4})); fly.position.set(2.2,1.3,0); M.add(fly); for(let i=0;i<4;i++){ const sp=bx(.08,2.1,.08,0x222,2.2,.25,0); sp.rotation.z=i*Math.PI/4; sp.position.y=1.3; M.add(sp); fly.userData.sp=fly.userData.sp||[]; fly.userData.sp.push(sp); }
   const rod=bx(.1,.1,2.2,0x999,0,0,0); rod.position.set(1.6,1.9,.9); M.add(rod);
   anims.push(t=>{ fly.rotation.x=t*2.2; fly.userData.sp.forEach((s,i)=>s.rotation.x=t*2.2+i*Math.PI/4); rod.position.y=1.9+Math.sin(t*2.2)*.5; });
   /* gears */
   const g1=new THREE.Mesh(new THREE.CylinderGeometry(.8,.8,.2,12),fm(0x8a7a40,{metalness:.5,roughness:.4})); g1.rotation.x=Math.PI/2; g1.position.set(4.5,1.5,5.6); F.add(g1); const g2=g1.clone(); g2.scale.setScalar(.6); g2.position.set(5.7,2.2,5.6); F.add(g2); anims.push(t=>{ g1.rotation.z=t*1.5; g2.rotation.z=-t*2.5; });
   for(let i=0;i<7;i++){ const p=person([0x4a4a5a,0x6a5a4a,0x3a4a6a][i%3],0xf2c7a5,.85); p.position.set(-5+i*1.6,0,4.8+(i%2)*1.2); F.add(p); anims.push(t=>p.position.y=Math.abs(Math.sin(t*3+i))*.06); }
   const lf=label('Fàbrica amb màquina de vapor','#ff8a5c'); lf.position.set(0,10.5,0); F.add(lf);
   const road=new THREE.Mesh(new THREE.PlaneGeometry(40,3),fm(0x7a6a5a)); road.rotation.x=-Math.PI/2; road.position.set(0,.02,9.5); G.add(road);
   /* carro vs tren */
   const cart=new THREE.Group(); cart.add(bx(1.8,.6,1,0x7a5a3a,0,.5,0)); for(const s of [-1,1]){ const w=new THREE.Mesh(new THREE.TorusGeometry(.35,.06,6,12),fm(0x4a3a2a)); w.rotation.y=Math.PI/2; w.position.set(s*.7,.4,.55); cart.add(w); const w2=w.clone(); w2.position.z=-.55; cart.add(w2); } const horse=bx(1.2,.7,.5,0x6a4a2a,1.6,.6,0); cart.add(horse); cart.add(bx(.4,.5,.3,0x6a4a2a,2.3,1.1,0)); cart.position.set(-14,0,9.5); G.add(cart); anims.push(t=>{ cart.position.x=-20+((t*1.2)%16); });
   const tr=new THREE.Group(); tr.add(bx(2.4,1,1,0x222,0,.4,0)); tr.add(cyl(.22,.22,.9,0x222,.8,1.4,0,8)); tr.add(bx(1,1.1,1,0x333,-.9,1.4,0)); for(let i=0;i<2;i++){ const wag=bx(2,.9,.9,[0x8a2a2a,0x2a5a8a][i],-3-i*2.3,.45,0); tr.add(wag); } tr.position.set(0,0,12.5); G.add(tr); anims.push(t=>{ tr.position.x=-8+((t*3)%30); });
   const rail=new THREE.Mesh(new THREE.PlaneGeometry(44,1.2),fm(0x4a4a4a)); rail.rotation.x=-Math.PI/2; rail.position.set(0,.03,12.5); G.add(rail);
   G.userData.cam=[new THREE.Vector3(0,2,2),new THREE.Vector3(0,22,48)];
 }
 /* ---------- FORMES DE GOVERN ---------- */
 { const G=new THREE.Group(); G.visible=false; scene.add(G); S.govern=G;
   const ground=new THREE.Mesh(new THREE.CircleGeometry(26,48),fm(0x3a3a4a)); ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; G.add(ground);
   /* sala del tron */
   const T=new THREE.Group(); T.position.x=-11; G.add(T);
   const floor=new THREE.Mesh(new THREE.BoxGeometry(14,.3,12),fm(0x7a1a2a)); floor.position.y=.15; floor.receiveShadow=true; T.add(floor);
   const carpet=new THREE.Mesh(new THREE.PlaneGeometry(2.4,10),fm(0xc01a2a)); carpet.rotation.x=-Math.PI/2; carpet.position.set(0,.32,1); T.add(carpet);
   for(let i=0;i<4;i++) for(const s of [-1,1]){ T.add(cyl(.35,.4,6,0xe8e0d0,s*5.5,.3,-4+i*2.8,10)); }
   T.add(bx(14,.6,12,0xe8e0d0,0,6.3,0));
   const dais=bx(4,.8,3,0xd4a017,0,.3,-4,{metalness:.5,roughness:.4}); T.add(dais);
   const throne=new THREE.Group(); throne.position.set(0,1.1,-4.6); throne.add(bx(1.4,1,1.2,0xd4a017,0,0,0,{metalness:.6,roughness:.3})); throne.add(bx(1.4,2.6,.3,0xd4a017,0,0,-.5,{metalness:.6,roughness:.3})); throne.add(bx(1.0,1.4,.3,0xc01a2a,0,1,-.4)); T.add(throne);
   const king=person(0x7a1a7a,0xf2c7a5,1.1); king.position.set(0,1.1,-4.2); T.add(king); const crown=new THREE.Mesh(new THREE.CylinderGeometry(.32,.26,.3,8,1,true),fm(0xffd23f,{metalness:.8,roughness:.2,side:THREE.DoubleSide})); crown.position.set(0,3.05,-4.2); T.add(crown); anims.push(t=>crown.position.y=3.05+Math.sin(t*2)*.02);
   for(let i=0;i<6;i++){ const p=person([0x6a5a4a,0x4a4a4a,0x8a7a6a][i%3],0xf2c7a5,.9); p.position.set(-3+(i%3)*3,0,1+Math.floor(i/3)*2.5); p.rotation.x=.5; p.position.y=-.3; T.add(p); }
   const lt=label('Monarquia absoluta: el rei mana','#c08bff'); lt.position.set(0,9,0); T.add(lt);
   /* parlament */
   const Pm=new THREE.Group(); Pm.position.x=11; G.add(Pm);
   const pf=new THREE.Mesh(new THREE.CylinderGeometry(9,9,.3,48,1,false,0,Math.PI)); pf.rotation.y=Math.PI; pf.position.y=.15; pf.receiveShadow=true; pf.material=fm(0x2a3a5a); Pm.add(pf);
   const seats=[]; for(let r=0;r<4;r++){ const n=8+r*4, rad=3+r*1.5; for(let i=0;i<n;i++){ const a=Math.PI*(i+.5)/n; const x=Math.cos(a)*rad, z=Math.sin(a)*rad; const st=bx(.6,.5,.6,0x2f8cff,x,.3+r*.5,z); st.rotation.y=-a+Math.PI/2; Pm.add(st); if(Math.random()<.85){ const p=person([0x3a86ff,0xf15bb5,0xffd23f,0x2ec4b6,0xff6b35,0x8338ec][i%6],0xf2c7a5,.6); p.position.set(x,.3+r*.5+.5,z); Pm.add(p); seats.push(p); } } for(let r2=0;r2<1;r2++){} Pm.add(bx(20,.5,.4,0x1a2a4a,0,.3+r*.5,0)); }
   const pod=bx(1.4,1.2,.8,0x8a6a3a,0,.3,-.5); Pm.add(pod); const spk=person(0xffffff,0xf2c7a5,.8); spk.position.set(0,.3,-1.2); Pm.add(spk); anims.push(t=>{ spk.rotation.y=Math.sin(t*1.2)*.5; seats.forEach((p,i)=>{ p.position.y=p.userData.y0=(p.userData.y0??p.position.y); if(Math.sin(t*.7+i)>.97) p.position.y=p.userData.y0+.2; }); });
   const urn=bx(1.2,1,.8,0xe9e9f2,-3,.3,-1); Pm.add(urn); const flag=new THREE.Mesh(new THREE.PlaneGeometry(1.6,1),fm(0xc8102e,{side:THREE.DoubleSide})); flag.position.set(3.2,2.2,-1.2); Pm.add(flag); Pm.add(cyl(.05,.05,2.6,0xdddddd,2.4,.3,-1.2,6));
   const lp=label('Democràcia: el poble tria els representants','#00e5ff'); lp.position.set(0,7.5,2); Pm.add(lp);
   G.userData.cam=[new THREE.Vector3(0,2,0),new THREE.Vector3(0,20,44)];
 }
 /* ---------- SOCIETAT: carrers de 4 èpoques ---------- */
 { const G=new THREE.Group(); G.visible=false; scene.add(G); S.soc=G; const vign=[];
   const ERA=[{n:'Cap al 1850',sky:0xc9b58a,road:0x8a7a5a,house:0xd9c7a0,lamp:'oil',veh:'cart',ppl:[0x6a5a4a,0x4a4a4a]},{n:'Cap al 1931',sky:0xb8c4cc,road:0x6a6a6a,house:0xc9b9a8,lamp:'elec',veh:'tram',ppl:[0x3a3a4a,0x8a7a6a]},{n:'Cap al 1960',sky:0xa8d0e8,road:0x4a4a4a,house:0xe0d8c8,lamp:'elec',veh:'600',ppl:[0x3a86ff,0xffd23f]},{n:'Avui',sky:0x8fd0ff,road:0x3a3a40,house:0xeaeaea,lamp:'led',veh:'ecar',ppl:[0x2ec4b6,0xf15bb5,0xff6b35]}];
   ERA.forEach((E,i)=>{ const V=new THREE.Group(); V.position.x=-24+i*16; G.add(V); vign.push(V);
     const gr=new THREE.Mesh(new THREE.CircleGeometry(7.5,40),fm(E.road)); gr.rotation.x=-Math.PI/2; gr.receiveShadow=true; V.add(gr);
     const back=new THREE.Mesh(new THREE.CylinderGeometry(7.6,7.6,7,40,1,true,Math.PI*1.05,Math.PI*.9),fm(E.sky,{side:THREE.BackSide})); back.position.y=3.5; V.add(back);
     for(let k=0;k<3;k++){ const h=i===3?5+k*1.5:3+(k%2); const b=bx(3.2,h,3,E.house,-4+k*4,0,-4); V.add(b); if(i<3){ const r=new THREE.Mesh(new THREE.ConeGeometry(2.4,1.2,4),fm(0x8a4b3a)); r.rotation.y=Math.PI/4; r.position.set(-4+k*4,h+.6,-4); V.add(r); } for(let w=0;w<2;w++) V.add(bx(.7,.9,.1,i===0?0x5a4a3a:0xffe08a,-4.8+k*4+w*1.6,1.2,-2.45,{emissive:i?0xffc040:0x000000,emissiveIntensity:i?.4:0})); }
     const lp=new THREE.Group(); lp.position.set(3.5,0,1); lp.add(cyl(.08,.1,3.2,0x333,0,0,0,6)); const bulb=new THREE.Mesh(new THREE.SphereGeometry(.25,8,6),fm(E.lamp==='oil'?0xffb060:E.lamp==='led'?0xffffff:0xffe9a0,{emissive:E.lamp==='oil'?0xff8020:E.lamp==='led'?0xffffff:0xffd060,emissiveIntensity:1})); bulb.position.y=3.3; lp.add(bulb); V.add(lp); if(E.lamp==='oil') anims.push(t=>bulb.material.emissiveIntensity=.8+Math.sin(t*12+i)*.25);
     const veh=new THREE.Group(); V.add(veh);
     if(E.veh==='cart'){ veh.add(bx(1.6,.5,.9,0x7a5a3a,0,.5,0)); veh.add(bx(1.1,.6,.45,0x6a4a2a,1.5,.5,0)); veh.add(bx(.35,.45,.3,0x6a4a2a,2.1,1,0)); for(const s of [-1,1]){ const w=new THREE.Mesh(new THREE.TorusGeometry(.32,.05,6,12),fm(0x4a3a2a)); w.rotation.y=Math.PI/2; w.position.set(s*.6,.35,.5); veh.add(w); const w2=w.clone(); w2.position.z=-.5; veh.add(w2);} }
     else if(E.veh==='tram'){ veh.add(bx(3.2,1.4,1.1,0xd9a030,0,.4,0)); veh.add(bx(3.4,.2,1.3,0x8a2a2a,0,1.8,0)); for(let k=0;k<4;k++) veh.add(bx(.55,.6,.05,0xbfe8ff,-1.1+k*.75,.9,.56)); veh.add(cyl(.03,.03,1.2,0x333,0,2,0,6)); }
     else if(E.veh==='600'){ veh.add(bx(2.2,.6,1.1,0xeeeeee,0,.35,0)); veh.add(bx(1.3,.6,1,0xeeeeee,-.1,.95,0)); for(let k=0;k<2;k++) veh.add(bx(.5,.4,.05,0xbfe8ff,-.5+k*.7,1.05,.52)); for(const s of [-1,1]) for(const z of [-.5,.5]){ const w=cyl(.22,.22,.15,0x222,s*.75,.1,z,10); w.rotation.x=Math.PI/2; w.position.y=.22; veh.add(w);} }
     else { veh.add(bx(2.6,.6,1.2,0x2ec4b6,0,.35,0,{metalness:.4,roughness:.3})); veh.add(bx(1.7,.6,1.1,0x2ec4b6,-.1,.95,0,{metalness:.4,roughness:.3})); veh.add(bx(1.5,.5,1.12,0x8fd0ff,-.1,1.0,0,{metalness:.2,roughness:.1})); for(const s of [-1,1]) for(const z of [-.55,.55]){ const w=cyl(.24,.24,.18,0x222,s*.9,.1,z,12); w.rotation.x=Math.PI/2; w.position.y=.24; veh.add(w);} const bike=new THREE.Group(); for(const x of [-.4,.4]){ const w=new THREE.Mesh(new THREE.TorusGeometry(.3,.03,6,14),fm(0x222)); w.position.set(x,.3,0); bike.add(w);} bike.add(bx(.8,.05,.05,0x444,0,.5,0)); bike.position.set(-3.5,0,2.5); V.add(bike); const bp=person(0xf15bb5,0xf2c7a5,.6); bp.position.set(-3.5,.3,2.5); V.add(bp); }
     veh.position.set(-1,0,1.5); anims.push(t=>{ veh.position.x=-6+((t*(i===0?.6:i===3?2:1.2))%12); });
     E.ppl.forEach((c,k)=>{ const p=person(c,0xf2c7a5,.8); p.position.set(-5+k*2.2,0,3.5); V.add(p); anims.push(t=>p.position.y=Math.abs(Math.sin(t*3+k+i))*.05); });
     if(i>=2){ const pole=cyl(.05,.05,3,0x555,-6,0,-1,6); V.add(pole); V.add(bx(.3,.5,.1,0x444,-6,2.4,-1)); }
     if(i===3){ V.add(bx(1.8,.1,1,0x1a3a7a,-2,5.5,-4,{metalness:.3,roughness:.3})); }
     const lb=label(E.n,'#ffd23f'); lb.position.set(0,8.2,0); V.add(lb); V.userData.cam=[new THREE.Vector3(V.position.x,2,0),new THREE.Vector3(V.position.x,7,21)];
   });
   G.userData.vign=vign; G.userData.cam=[new THREE.Vector3(0,2,0),new THREE.Vector3(0,14,42)];
 }
 for(const k in S){ S[k].position.set(opts.x||0,opts.y||0,opts.z||0); S[k].traverse(o=>{ if(o.isMesh){ o.castShadow=true; o.receiveShadow=true; } }); }
 return {S,tick:(t,dt)=>{ for(const a of anims) a(t,dt); },show:(k)=>{ for(const j in S) S[j].visible=j===k; }};
};
