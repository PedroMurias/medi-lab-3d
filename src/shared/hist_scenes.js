/* Diorames 3D de la Història: taller vs fàbrica, tron vs parlament, carrers de 4 èpoques (versió realista amb CityKit/EcoLand) */
window.HistScenes=function(THREE,scene,opts,X={}){
 const {CK,LAND,NK}=X; let sd=21; const R=()=>{sd=(sd*16807)%2147483647; return sd/2147483647;};
 const fm=(c,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.8,flatShading:true},o));
 const std=(o)=>new THREE.MeshStandardMaterial(Object.assign({roughness:.85},o));
 const bx=(w,h,d,c,x=0,y=0,z=0,o)=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),(c&&(c.isMaterial||Array.isArray(c)))?c:fm(c,o)); m.position.set(x,y+h/2,z); m.castShadow=m.receiveShadow=true; return m; };
 const cyl=(r1,r2,h,c,x=0,y=0,z=0,seg=10)=>{ const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,seg),(c&&(c.isMaterial||Array.isArray(c)))?c:fm(c)); m.position.set(x,y+h/2,z); m.castShadow=true; return m; };
 const person=(c,skin=0xf2c7a5,s=1,anim='Idle')=>{ const g=new THREE.Group(); g.userData.person={h:1.7*s,anim,tint:c}; const b=new THREE.Mesh(new THREE.CapsuleGeometry(.28,.8,4,8),fm(c)); b.position.y=.85; g.add(b); const h=new THREE.Mesh(new THREE.SphereGeometry(.26,10,8),fm(skin)); h.position.y=1.65; g.add(h); g.scale.setScalar(s); g.traverse(o=>{ if(o.isMesh) o.castShadow=true; }); return g; };
 const label=(txt,col='#ffffff')=>{ const cv=document.createElement('canvas'); cv.width=512; cv.height=96; const g=cv.getContext('2d'); g.fillStyle='rgba(8,14,30,.85)'; g.beginPath(); g.roundRect(4,4,504,88,24); g.fill(); g.strokeStyle=col; g.lineWidth=4; g.stroke(); g.fillStyle='#fff'; g.font='700 44px Space Grotesk, sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(txt,256,50); const t=new THREE.CanvasTexture(cv); t.colorSpace=THREE.SRGBColorSpace; const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false})); sp.scale.set(6,1.1,1); return sp; };
 const flat=(G,w,d,tex,x,z,rx,ry,y=.02,round=false)=>{ const m=tex.clone(); m.needsUpdate=true; m.repeat.set(rx,ry); const mesh=new THREE.Mesh(round?new THREE.CircleGeometry(w,48):new THREE.PlaneGeometry(w,d),std({map:m,roughness:.95})); mesh.rotation.x=-Math.PI/2; mesh.position.set(x,y,z); mesh.receiveShadow=true; G.add(mesh); return mesh; };
 const treeSpots=[]; const tree=(G,x,z,h=3)=>{ treeSpots.push([G,x,z,h]); };
 const sky=(G,top=0x4a95e6,hor=0xd8ecff)=>{ if(!LAND) return; LAND.sky(G,{skyTop:top,skyHor:hor,radius:260}); const hl=LAND.hills(G,{hillLo:0x5f8f3f,hillHi:0x8aa85a,hillFar:0xa9c0cf}); hl.scale.set(2.2,1.3,2.2); hl.position.y=-.8; };
 const anims=[]; const S={}; const flags=[];
 const smokeSys=(G,srcs,n=120,size=1.2,col=0xcfd4dd)=>{ const pos=new Float32Array(n*3), life=new Float32Array(n); for(let i=0;i<n;i++) life[i]=Math.random(); const sg=new THREE.BufferGeometry(); sg.setAttribute('position',new THREE.BufferAttribute(pos,3)); const pts=new THREE.Points(sg,new THREE.PointsMaterial({color:col,size,transparent:true,opacity:.5,depthWrite:false})); G.add(pts); anims.push((t,dt)=>{ for(let i=0;i<n;i++){ life[i]+=dt*.22; if(life[i]>1) life[i]=0; const src=srcs[i%srcs.length]; const l=life[i]; pos[i*3]=src[0]+Math.sin(l*7+i)*l*1.5+l*2.5; pos[i*3+1]=src[1]+l*7; pos[i*3+2]=src[2]+Math.cos(l*5+i)*l*1.2; } sg.attributes.position.needsUpdate=true; }); };
 /* ---------- REVOLUCIÓ INDUSTRIAL ---------- */
 { const G=new THREE.Group(); G.visible=false; scene.add(G); S.revol=G; sky(G);
   const ground=flat(G,30,0,LAND?LAND.groundTex(256,6,0x7fb055,0x5a8a3c):CK.T.dirt,0,0,8,8,0,true); ground.userData.ground=true;
   flat(G,46,3.6,CK.T.dirt,0,9.5,10,1,.03);
   /* poble artesà (esquerra) */
   const W=new THREE.Group(); W.position.x=-11; G.add(W);
   const stucco=(w,h,d)=>CK.wallMat('#d9c7a0','rect',{ashlar:true,ww:.3,wh:.42},w,h,d);
   const shop=bx(7,3.4,5,stucco(7,3.4,5)); W.add(shop); const roof=CK.hipRoof(8,6,2.2); roof.position.y=3.4; W.add(roof);
   const open=bx(5,2.6,.3,fm(0x2a2018),0,0,2.5); W.add(open); W.add(bx(.3,2.6,.3,0x6b4a2b,-2.5,0,2.55)); W.add(bx(.3,2.6,.3,0x6b4a2b,2.5,0,2.55)); W.add(bx(5.4,.3,.5,0x6b4a2b,0,2.6,2.6));
   W.add(bx(2.2,.12,1.2,0x7a5a3a,0,1.0,3.6)); for(const [x,z] of [[-1,4.1],[1,4.1],[-1,3.1],[1,3.1]]) W.add(bx(.12,1,.12,0x7a5a3a,x,0,z));
   const wheel=new THREE.Mesh(new THREE.TorusGeometry(.7,.08,8,20),fm(0x7a5a3a)); wheel.position.set(2.4,1.0,3.6); W.add(wheel); for(let i=0;i<4;i++){ const sp=bx(.06,1.3,.06,0x7a5a3a,0,-.65,0); sp.rotation.z=i*Math.PI/4; wheel.add(sp); } anims.push(t=>wheel.rotation.y=t*.8);
   const art=person(0x8a6a4a,0xf2c7a5,1,'Interact'); art.position.set(0,0,4.8); W.add(art); const art2=person(0x5a6a8a,0xf2c7a5,1,'Idle'); art2.position.set(-2.6,0,4.4); W.add(art2);
   W.add(bx(.8,.6,.5,0xa8865a,-.4,1.12,3.6)); const ham=bx(.1,.6,.1,0x444,.5,1.12,3.6); W.add(ham); anims.push(t=>ham.rotation.z=Math.sin(t*5)*.5-.3);
   /* cases del poble */
   for(const [x,z,w,h,d,ry] of [[-7,-6,5,3.2,4.5,.3],[1,-7,4.5,3,4,-.25],[6.5,-2,4,2.8,3.8,-.9]]){ const H=new THREE.Group(); H.position.set(x,0,z); H.rotation.y=ry; H.add(bx(w,h,d,stucco(w,h,d))); const r=CK.hipRoof(w+1,d+1,1.6); r.position.y=h; H.add(r); H.add(bx(.9,1.6,.1,fm(0x4a2f1a),0,0,d/2)); W.add(H); }
   /* pou i tanca */
   const well=new THREE.Group(); well.position.set(-4,0,-1); well.add(cyl(1,1.05,1,std({map:CK.T.stoneSlab.clone(),roughness:.9}),0,0,0,14)); well.add(bx(.12,2.2,.12,0x6b4a2b,-.9,1,0)); well.add(bx(.12,2.2,.12,0x6b4a2b,.9,1,0)); const wr=CK.hipRoof(2.6,2.2,.8); wr.position.y=3.2; well.add(wr); well.add(cyl(.05,.05,2,0x333,0,2.1,0,6)).rotation.z=Math.PI/2; W.add(well);
   for(let i=0;i<7;i++){ W.add(bx(.08,.8,.08,0x8a6a4a,-9+i*1.2,0,6.5)); } W.add(bx(7.4,.08,.08,0x8a6a4a,-5.4,.6,6.5));
   tree(W,-5.5,3,3.2); tree(W,5.5,-6,3.6); tree(W,-9,-4,3);
   const lw=label('Taller artesà','#ffd23f'); lw.position.set(0,6.6,0); W.add(lw);
   /* fàbrica (dreta) */
   const F=new THREE.Group(); F.position.x=10; G.add(F);
   const brick=(w,h,d)=>CK.wallMat('#9a4a3a','arch',{ww:.3,wh:.5,wy:.2,frame:'#5a3a2a'},w,h,d);
   F.add(bx(13,5.5,7.5,brick(13,5.5,7.5))); F.add(bx(13.4,.4,7.9,fm(0x5a3a2a),0,5.5,0));
   for(let i=0;i<3;i++){ const r=CK.pediment(4.3,2.2,7.6,std({map:CK.T.slate,roughness:.9})); r.position.set(-4.3+i*4.3,5.9,0); r.rotation.y=Math.PI/2; r.rotation.y=0; F.add(r); const gl=bx(3.6,1.6,.08,fm(0x9fd3ff,{roughness:.2,metalness:.3,transparent:true,opacity:.7}),-4.3+i*4.3,6.2,-3.75); F.add(gl); }
   for(let i=0;i<5;i++){ F.add(bx(1.0,1.4,.08,0xffe08a,-5+i*2.5,1.4,3.79,{emissive:0xffb040,emissiveIntensity:.5})); }
   F.add(bx(2.2,3,.2,fm(0x3a2a1a),4.5,0,3.78));
   const chim=cyl(.6,.8,8,std({map:CK.T.brick.clone(),roughness:.9}),4.5,5.5,-2,12); chim.material.map.repeat.set(2,6); chim.material.map.needsUpdate=true; F.add(chim); const chim2=cyl(.5,.7,7,chim.material,-3,5.5,-2.2,12); F.add(chim2);
   smokeSys(F,[[4.5,13.5,-2],[-3,12.5,-2.2]]);
   /* màquina de vapor: volant i biela */
   const M=new THREE.Group(); M.position.set(-2,0,5.9); F.add(M); M.add(bx(2.4,1.2,1.2,0x3a3a44,0,0,0)); const boiler=new THREE.Mesh(new THREE.CylinderGeometry(.6,.6,2.6,16),fm(0x555566,{metalness:.5,roughness:.4})); boiler.rotation.z=Math.PI/2; boiler.position.set(0,1.7,0); M.add(boiler);
   const fly=new THREE.Mesh(new THREE.TorusGeometry(1.1,.12,8,24),fm(0x222,{metalness:.6,roughness:.4})); fly.position.set(2.2,1.3,0); M.add(fly); fly.userData.sp=[]; for(let i=0;i<4;i++){ const sp=bx(.08,2.1,.08,0x222,2.2,.25,0); sp.rotation.z=i*Math.PI/4; sp.position.y=1.3; M.add(sp); fly.userData.sp.push(sp); }
   const rod=bx(.1,.1,2.2,0x999,0,0,0); rod.position.set(1.6,1.9,.9); M.add(rod);
   anims.push(t=>{ fly.rotation.x=t*2.2; fly.userData.sp.forEach((s,i)=>s.rotation.x=t*2.2+i*Math.PI/4); rod.position.y=1.9+Math.sin(t*2.2)*.5; });
   const g1=new THREE.Mesh(new THREE.CylinderGeometry(.8,.8,.2,12),fm(0x8a7a40,{metalness:.5,roughness:.4})); g1.rotation.x=Math.PI/2; g1.position.set(4.5,1.5,6); F.add(g1); const g2=g1.clone(); g2.scale.setScalar(.6); g2.position.set(5.7,2.2,6); F.add(g2); anims.push(t=>{ g1.rotation.z=t*1.5; g2.rotation.z=-t*2.5; });
   for(let i=0;i<7;i++){ const p=person([0x4a4a5a,0x6a5a4a,0x3a4a6a][i%3],0xf2c7a5,.9,i%2?'Walk':'Idle'); p.position.set(-5.5+i*1.7,0,5.2+(i%2)*1.3); F.add(p); }
   const lf=label('Fàbrica amb màquina de vapor','#ff8a5c'); lf.position.set(0,11,0); F.add(lf);
   /* carro vs tren */
   const cart=new THREE.Group(); cart.add(bx(1.8,.6,1,0x7a5a3a,0,.5,0)); cart.add(bx(1.9,.08,1.1,0x9a7a5a,0,1.1,0)); for(const s of [-1,1]){ const w=new THREE.Mesh(new THREE.TorusGeometry(.35,.06,6,12),fm(0x4a3a2a)); w.rotation.y=Math.PI/2; w.position.set(s*.7,.4,.55); cart.add(w); const w2=w.clone(); w2.position.z=-.55; cart.add(w2); } const horse=bx(1.2,.7,.5,0x6a4a2a,1.6,.6,0); cart.add(horse); cart.add(bx(.4,.5,.3,0x6a4a2a,2.3,1.1,0)); for(const [x,z] of [[1.2,.18],[1.2,-.18],[2,.18],[2,-.18]]) cart.add(bx(.12,.6,.12,0x5a3a1a,x,0,z)); cart.position.set(-14,0,9.5); G.add(cart); anims.push(t=>{ cart.position.x=-20+((t*1.2)%16); });
   const tr=new THREE.Group(); const loco=new THREE.Group(); tr.add(loco); const bo=cyl(.5,.5,2.4,fm(0x1a1a1e,{metalness:.5,roughness:.4}),0,.0,0,14); bo.rotation.z=Math.PI/2; bo.position.set(.3,1.1,0); loco.add(bo); loco.add(bx(2.8,.5,1.1,0x2a2a2e,-.2,.35,0)); loco.add(cyl(.18,.24,.9,0x111,1.1,1.5,0,10)); loco.add(bx(1.1,1.3,1.1,fm(0x8a2a2a),-1.2,.85,0)); loco.add(bx(1.3,.1,1.3,0x222,-1.2,2.15,0)); for(const x of [-1.1,-.1,.9]) for(const z of [.5,-.5]){ const w=cyl(.32,.32,.12,0x222,x,.0,z,12); w.rotation.x=Math.PI/2; w.position.y=.35; loco.add(w);} for(let i=0;i<2;i++){ const wag=bx(2.2,1.1,1,[0x8a3a2a,0x2a4a7a][i],-3.4-i*2.5,.45,0); tr.add(wag); for(const x of [-.7,.7]) for(const z of [.5,-.5]){ const w=cyl(.25,.25,.12,0x222,-3.4-i*2.5+x,0,z,12); w.rotation.x=Math.PI/2; w.position.y=.3; tr.add(w);} } tr.position.set(0,0,12.8); G.add(tr); anims.push(t=>{ tr.position.x=-8+((t*3)%30); });
   smokeSys(tr,[[1.1,2.4,0]],40,.8,0xdddddd);
   flat(G,46,1.6,CK.T.dirt,0,12.8,12,1,.025); for(let x=-22;x<=22;x+=1.1) G.add(bx(.25,.1,1.6,0x5a4a3a,x,.03,12.8)); for(const z of [12.2,13.4]) G.add(bx(46,.08,.1,fm(0x777,{metalness:.6,roughness:.4}),0,.12,z));
   tree(G,-22,-8,3.4); tree(G,22,-9,3.2); tree(G,-18,15,3); tree(G,20,16,3.4); tree(G,0,-14,3.8);
   G.userData.cam=[new THREE.Vector3(0,2,2),new THREE.Vector3(0,20,46)];
 }
 /* ---------- FORMES DE GOVERN ---------- */
 { const G=new THREE.Group(); G.visible=false; scene.add(G); S.govern=G; sky(G,0x3f8fe0,0xd6ecff);
   flat(G,30,0,CK.T.cobble,0,0,16,16,0,true);
   /* sala del tron: pòrtic de palau */
   const T=new THREE.Group(); T.position.x=-11; G.add(T);
   const floor=bx(14,.3,12,std({map:CK.T.marble?CK.T.marble:CK.T.stoneSlab,roughness:.4})); floor.receiveShadow=true; T.add(floor);
   const carpet=new THREE.Mesh(new THREE.PlaneGeometry(2.6,10),fm(0xb0122a,{roughness:1})); carpet.rotation.x=-Math.PI/2; carpet.position.set(0,.32,1); T.add(carpet);
   for(let i=0;i<4;i++) for(const s of [-1,1]){ const c=CK.column(6,.4); c.position.set(s*5.8,.3,-4+i*2.8); T.add(c); }
   T.add(bx(14.4,.7,12.4,fm(0xf1ece0),0,6.3,0)); const ped=CK.pediment(14.4,2.2,12.4); ped.position.set(0,7,0); ped.rotation.y=Math.PI/2; T.add(ped); const back=bx(14,6,.5,CK.wallMat('#d9c6a3','arch',{wy:.18},14,6,.5),0,.3,-6); T.add(back);
   const dais=bx(4.4,.8,3,fm(0xd4a017,{metalness:.5,roughness:.4}),0,.3,-4); T.add(dais);
   const throne=new THREE.Group(); throne.position.set(0,1.1,-4.6); throne.add(bx(1.4,1,1.2,0xd4a017,0,0,0,{metalness:.6,roughness:.3})); throne.add(bx(1.4,2.6,.3,0xd4a017,0,0,-.5,{metalness:.6,roughness:.3})); throne.add(bx(1.0,1.4,.3,0xc01a2a,0,1,-.4)); T.add(throne);
   const king=person(0x7a1a7a,0xf2c7a5,1.1); king.position.set(0,1.1,-4.2); T.add(king); const crown=new THREE.Mesh(new THREE.CylinderGeometry(.32,.26,.3,8,1,true),fm(0xffd23f,{metalness:.8,roughness:.2,side:THREE.DoubleSide})); crown.position.set(0,3.05,-4.2); T.add(crown); anims.push(t=>crown.position.y=3.05+Math.sin(t*2)*.02);
   for(let i=0;i<6;i++){ const p=person([0x6a5a4a,0x4a4a4a,0x8a7a6a][i%3],0xf2c7a5,.9,'Interact'); p.position.set(-3+(i%3)*3,.3,1+Math.floor(i/3)*2.5); T.add(p); }
   for(const s of [-1,1]){ const g=person(0x3a3a5a,0xf2c7a5,1,'Idle'); g.position.set(s*3.2,.3,-3.6); T.add(g); const sp=bx(.06,2.6,.06,0x999,s*3.5,.3,-3.6); T.add(sp); }
   const lt=label('Monarquia absoluta: el rei mana','#c08bff'); lt.position.set(0,10,0); T.add(lt);
   /* parlament */
   const Pm=new THREE.Group(); Pm.position.x=11; G.add(Pm);
   const pf=new THREE.Mesh(new THREE.CylinderGeometry(9.5,9.5,.3,48,1,false,0,Math.PI),std({map:CK.T.parquet||CK.T.stoneSlab,roughness:.6})); pf.rotation.y=Math.PI; pf.position.y=.15; pf.receiveShadow=true; Pm.add(pf);
   const pb=CK.parliament({c1:0xc8102e,c2:0xf6c01b}); pb.scale.setScalar(.85); pb.position.set(0,0,8.5); pb.rotation.y=Math.PI; Pm.add(pb); if(pb.userData.flags) flags.push(...pb.userData.flags);
   const seats=[]; for(let r=0;r<4;r++){ const n=8+r*4, rad=3+r*1.5; for(let i=0;i<n;i++){ const a=Math.PI*(i+.5)/n; const x=Math.cos(a)*rad, z=Math.sin(a)*rad; const st=bx(.6,.5,.6,0x2f8cff,x,.3+r*.5,z); st.rotation.y=-a+Math.PI/2; Pm.add(st); if(R()<.85){ const p=person([0x3a86ff,0xf15bb5,0xffd23f,0x2ec4b6,0xff6b35,0x8338ec][i%6],0xf2c7a5,.6); p.position.set(x,.3+r*.5+.5,z); Pm.add(p); seats.push(p); } } Pm.add(bx(20,.5,.4,0x1a2a4a,0,.3+r*.5,0)); }
   const pod=bx(1.4,1.2,.8,0x8a6a3a,0,.3,-.5); Pm.add(pod); const spk=person(0xffffff,0xf2c7a5,.8,'Wave'); spk.position.set(0,.3,-1.2); Pm.add(spk); anims.push(t=>{ spk.rotation.y=Math.sin(t*1.2)*.5; seats.forEach((p,i)=>{ p.userData.y0=(p.userData.y0??p.position.y); p.position.y=p.userData.y0+(Math.sin(t*.7+i)>.97?.2:0); }); });
   const urn=bx(1.2,1,.8,0xe9e9f2,-3,.3,-1); Pm.add(urn); const fl=CK.flag(0xc8102e,0xf6c01b,'band',3.2); fl.position.set(3,.3,-1.2); Pm.add(fl); flags.push(fl);
   const lp=label('Democràcia: el poble tria els representants','#00e5ff'); lp.position.set(0,8.5,2); Pm.add(lp);
   for(const [x,z] of [[-20,-10],[20,-10],[-20,12],[20,12]]){ const L=CK.lamp(); L.position.set(x,0,z); G.add(L); } tree(G,-24,4,3.2); tree(G,24,4,3.2); tree(G,0,-16,3.6);
   G.userData.cam=[new THREE.Vector3(0,2,0),new THREE.Vector3(0,20,46)];
 }
 /* ---------- SOCIETAT: carrers de 4 èpoques ---------- */
 { const G=new THREE.Group(); G.visible=false; scene.add(G); S.soc=G; const vign=[]; sky(G);
   flat(G,46,0,LAND?LAND.groundTex(256,6,0x7fb055,0x5a8a3c):CK.T.dirt,0,0,10,10,0,true);
   const ERA=[{n:'Cap al 1850',road:CK.T.dirt,house:['#d9c7a0','rect',{ashlar:true,ww:.28,wh:.4}],roof:'tiles',lamp:'oil',veh:'cart',ppl:[0x6a5a4a,0x4a4a4a]},{n:'Cap al 1931',road:CK.T.cobble,house:['#c9b9a8','arch',{balcony:true,wy:.18}],roof:'tiles',lamp:'elec',veh:'tram',ppl:[0x3a3a4a,0x8a7a6a]},{n:'Cap al 1960',road:CK.T.asphalt,house:['#e0d8c8','rect',{balcony:true,ww:.4,wh:.5}],roof:'flat',lamp:'elec',veh:'600',ppl:[0x3a86ff,0xffd23f]},{n:'Avui',road:CK.T.asphalt,house:['#dfe6ea','rect',{ww:.55,wh:.6,wy:.15,frame:'#8aa0b0',sill:false}],roof:'flat',lamp:'led',veh:'ecar',ppl:[0x2ec4b6,0xf15bb5,0xff6b35]}];
   ERA.forEach((E,i)=>{ const V=new THREE.Group(); V.position.x=-24+i*16; G.add(V); vign.push(V);
     flat(V,7.5,0,E.road,0,0,i===0?2:4,i===0?2:4,.02,true); if(i>0){ flat(V,15,2,CK.T.stoneSlab,0,-2.2,6,1,.05); }
     for(let k=0;k<3;k++){ const h=i===3?6+k*2:i===2?5+(k%2)*1.5:3.2+(k%2); const w=3.4,d=3; const b=bx(w,h,d,CK.wallMat(E.house[0],E.house[1],E.house[2],w,h,d),-4+k*4,0,-4.5); V.add(b); if(E.roof==='tiles'){ const r=CK.hipRoof(w+.8,d+.8,1.3); r.position.set(-4+k*4,h,-4.5); V.add(r); } else { V.add(bx(w+.3,.3,d+.3,fm(0x6a6a70),-4+k*4,h,-4.5)); if(i===3&&k===1) V.add(bx(2.4,.1,1.4,0x1a3a7a,-4+k*4,h+.35,-4.5,{metalness:.3,roughness:.3})); } V.add(bx(.9,1.7,.1,fm(i===3?0x334455:0x4a2f1a),-4+k*4,0,-4.5+d/2)); }
     if(E.lamp==='oil'){ const lp=new THREE.Group(); lp.position.set(3.5,0,1); lp.add(cyl(.08,.1,3.2,0x333,0,0,0,6)); const bulb=new THREE.Mesh(new THREE.SphereGeometry(.22,8,6),fm(0xffb060,{emissive:0xff8020,emissiveIntensity:1})); bulb.position.y=3.3; lp.add(bulb); V.add(lp); anims.push(t=>bulb.material.emissiveIntensity=.8+Math.sin(t*12+i)*.25); }
     else { const L=CK.lamp(); L.position.set(3.6,.05,-1.4); L.rotation.y=Math.PI/2; V.add(L); if(E.lamp==='led') L.traverse(o=>{ if(o.material&&o.material.emissive) o.material=o.material.clone(), o.material.emissive.set(0xffffff); }); }
     const veh=new THREE.Group(); V.add(veh);
     if(E.veh==='cart'){ veh.add(bx(1.6,.5,.9,0x7a5a3a,0,.5,0)); veh.add(bx(1.1,.6,.45,0x6a4a2a,1.5,.5,0)); veh.add(bx(.35,.45,.3,0x6a4a2a,2.1,1,0)); for(const s of [-1,1]){ const w=new THREE.Mesh(new THREE.TorusGeometry(.32,.05,6,12),fm(0x4a3a2a)); w.rotation.y=Math.PI/2; w.position.set(s*.6,.35,.5); veh.add(w); const w2=w.clone(); w2.position.z=-.5; veh.add(w2);} for(const [x,z] of [[1.2,.15],[1.2,-.15],[1.9,.15],[1.9,-.15]]) veh.add(bx(.1,.5,.1,0x5a3a1a,x,0,z)); }
     else if(E.veh==='tram'){ veh.add(bx(3.2,1.4,1.1,0xd9a030,0,.4,0)); veh.add(bx(3.4,.2,1.3,0x8a2a2a,0,1.8,0)); for(let k=0;k<4;k++) veh.add(bx(.55,.6,.05,0xbfe8ff,-1.1+k*.75,.9,.56)); veh.add(cyl(.03,.03,1.2,0x333,0,2,0,6)); for(const x of [-1,1]) for(const z of [.5,-.5]){ const w=cyl(.2,.2,.1,0x222,x,0,z,10); w.rotation.x=Math.PI/2; w.position.y=.2; veh.add(w);} }
     else if(E.veh==='600'){ veh.add(bx(2.2,.6,1.1,0xeeeeee,0,.35,0)); veh.add(bx(1.3,.6,1,0xeeeeee,-.1,.95,0)); for(let k=0;k<2;k++) veh.add(bx(.5,.4,.05,0xbfe8ff,-.5+k*.7,1.05,.52)); for(const s of [-1,1]) for(const z of [-.5,.5]){ const w=cyl(.22,.22,.15,0x222,s*.75,.1,z,10); w.rotation.x=Math.PI/2; w.position.y=.22; veh.add(w);} }
     else { veh.add(bx(2.6,.6,1.2,0x2ec4b6,0,.35,0,{metalness:.4,roughness:.3})); veh.add(bx(1.7,.6,1.1,0x2ec4b6,-.1,.95,0,{metalness:.4,roughness:.3})); veh.add(bx(1.5,.5,1.12,0x8fd0ff,-.1,1.0,0,{metalness:.2,roughness:.1})); for(const s of [-1,1]) for(const z of [-.55,.55]){ const w=cyl(.24,.24,.18,0x222,s*.9,.1,z,12); w.rotation.x=Math.PI/2; w.position.y=.24; veh.add(w);} const bike=new THREE.Group(); for(const x of [-.4,.4]){ const w=new THREE.Mesh(new THREE.TorusGeometry(.3,.03,6,14),fm(0x222)); w.position.set(x,.3,0); bike.add(w);} bike.add(bx(.8,.05,.05,0x444,0,.5,0)); bike.position.set(-3.5,0,2.5); V.add(bike); const bp=person(0xf15bb5,0xf2c7a5,.6); bp.position.set(-3.5,.3,2.5); V.add(bp); }
     veh.position.set(-1,0,1.5); anims.push(t=>{ veh.position.x=-6+((t*(i===0?.6:i===3?2:1.2))%12); });
     E.ppl.forEach((c,k)=>{ const p=person(c,0xf2c7a5,.8,k?'Walk':'Idle'); p.position.set(-5+k*2.2,0,3.5); V.add(p); });
     if(i>=2){ const pole=cyl(.05,.05,3,0x555,-6,0,-1,6); V.add(pole); V.add(bx(.3,.5,.1,0x444,-6,2.4,-1)); }
     if(i>=1){ const B=CK.bench(); B.position.set(-3,.05,-1.8); V.add(B); } tree(V,6.2,-3.2,2.6+i*.3); if(i===0) tree(V,-6.5,-2.5,3);
     const lb=label(E.n,'#ffd23f'); lb.position.set(0,8.6,0); V.add(lb); V.userData.cam=[new THREE.Vector3(V.position.x,2,0),new THREE.Vector3(V.position.x,7,21)];
   });
   G.userData.vign=vign; G.userData.cam=[new THREE.Vector3(0,2,0),new THREE.Vector3(0,14,42)];
 }
 for(const k in S){ S[k].position.set(opts.x||0,opts.y||0,opts.z||0); S[k].traverse(o=>{ if(o.isMesh){ o.castShadow=true; o.receiveShadow=true; } }); }
 if(NK) NK.load().then(()=>{ for(const [G,x,z,h] of treeSpots){ const o=NK.inst('CommonTree_'+(1+Math.floor(R()*3)),h); o.position.set(x,.02,z); G.add(o); } }).catch(e=>console.warn('trees',e));
 return {S,tick:(t,dt)=>{ for(const a of anims) a(t,dt); for(const f of flags) CK.waveFlag(f,t); },show:(k)=>{ for(const j in S) S[j].visible=j===k; }};
};
