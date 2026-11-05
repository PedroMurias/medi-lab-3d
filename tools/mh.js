// MakeHuman (CC0 base mesh + targets) morphable person: age 1..90, noi/noia.
// Data = gzip binary produced by build_mh.py (4 age states: baby, child, young, old).
const MH={data:{},tex:{}};
async function mhUnzip(src){
  const buf=await (await fetch(src)).arrayBuffer();
  return await new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
}
function mhParse(ab){
  const dv=new DataView(ab); const hl=dv.getUint32(0,true);
  const hdr=JSON.parse(new TextDecoder().decode(new Uint8Array(ab,4,hl)));
  let o=4+hl; const take=(T,n)=>{ const a=new T(ab,o,n); o+=a.byteLength; o+=(4-o%4)%4; return a; };
  return hdr.map(p=>{ const n=p.n;
    const s0=take(Int16Array,n*3), d=[1,2,3].map(()=>take(Int16Array,n*3));
    const nr=[0,1,2,3].map(()=>take(Int8Array,n*3));
    const uv=take(Uint16Array,n*2), ix=take(Uint16Array,p.t*3);
    return {name:p.name,n,s0,d,nr,uv,ix}; });
}
function mhGeo(THREE,p){
  const g=new THREE.BufferGeometry(), n=p.n, F=1e-4;
  const pos=new Float32Array(n*3), nb=new Float32Array(n*3), uv=new Float32Array(n*2);
  for(let i=0;i<n*3;i++){ pos[i]=p.s0[i]*F; nb[i]=p.nr[0][i]/127; }
  for(let i=0;i<n*2;i++) uv[i]=p.uv[i]/65535;
  g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  g.setAttribute('normal',new THREE.BufferAttribute(nb,3));
  g.setAttribute('uv',new THREE.BufferAttribute(uv,2));
  g.setIndex(new THREE.BufferAttribute(new Uint16Array(p.ix),1));
  g.morphTargetsRelative=true;
  g.morphAttributes.position=p.d.map(d=>{ const a=new Float32Array(n*3); for(let i=0;i<n*3;i++) a[i]=d[i]*F; return new THREE.BufferAttribute(a,3); });
  g.morphAttributes.normal=[1,2,3].map(k=>{ const a=new Float32Array(n*3); for(let i=0;i<n*3;i++) a[i]=(p.nr[k][i]-p.nr[0][i])/127; return new THREE.BufferAttribute(a,3); });
  g.boundingSphere=new THREE.Sphere(new THREE.Vector3(0,0,0),2.2);
  return g;
}
// age (years) -> influences [child,young,old] relative to baby (MakeHuman age macro)
function mhAgeW(y){
  const a=y<=11?(y-1)/10*.1875: y<=25?.1875+(y-11)/14*.3125 : .5+(y-25)/65*.5;
  if(a<.1875) return [a/.1875,0,0];
  if(a<.5){ const t=(a-.1875)/.3125; return [1-t,t,0]; }
  const t=(a-.5)/.5; return [0,1-t,t];
}
// load + cache one sex: src = gzip url; returns {geos, minY[4], topY[4]}
async function mhLoad(THREE,sex,src){
  if(MH.data[sex]) return MH.data[sex];
  const parts=mhParse(await mhUnzip(src));
  const ext=(name,mx)=>{ const p=parts.find(q=>q.name===name); return [0,1,2,3].map(k=>{ let m=mx?-1e9:1e9; for(let i=1;i<p.n*3;i+=3){ const y=p.s0[i]+(k?p.d[k-1][i]:0); m=mx?Math.max(m,y):Math.min(m,y); } return m*1e-4; }); };
  const D={geos:{},minY:ext('shoes',0),topY:ext('body',1)};
  for(const p of parts) D.geos[p.name]=mhGeo(THREE,p);
  return MH.data[sex]=D;
}
function mhTex(THREE,src){ if(!MH.tex[src]){ const t=new THREE.TextureLoader().load(src); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=4; MH.tex[src]=t; } return MH.tex[src]; }
// TEX: {skinY,skinO,suit,shoes,hair,eye,brow,lash}; opts {dim:0..1 (for background figures)}
function mhPerson(THREE,sex,TEX,opts={}){
  const D=MH.data[sex]; const root=new THREE.Group(), inner=new THREE.Group(); root.add(inner);
  const U={uOld:{value:0}}, dim=opts.dim??1;
  const std=(o)=>new THREE.MeshStandardMaterial(Object.assign({roughness:.75,metalness:0},o));
  const skin=std({map:mhTex(THREE,TEX.skinY),roughness:.6}); const tOld=mhTex(THREE,TEX.skinO);
  skin.onBeforeCompile=sh=>{ sh.uniforms.uOld=U.uOld; sh.uniforms.mapOld={value:tOld};
    sh.fragmentShader='uniform float uOld; uniform sampler2D mapOld;\n'+sh.fragmentShader.replace('#include <map_fragment>',
      '#include <map_fragment>\n diffuseColor.rgb=mix(diffuseColor.rgb, texture2D(mapOld,vMapUv).rgb*diffuse, uOld);'); };
  skin.customProgramCacheKey=()=>'mhskin';
  const mats={body:skin, eyes:std({map:mhTex(THREE,TEX.eye),roughness:.15}),
    brows:std({map:mhTex(THREE,TEX.brow),transparent:true,depthWrite:false}),
    lashes:std({map:mhTex(THREE,TEX.lash),transparent:true,depthWrite:false,side:THREE.DoubleSide,color:0x222222}),
    suit:std({map:mhTex(THREE,TEX.suit),roughness:.85,side:THREE.DoubleSide}), shoes:std({map:mhTex(THREE,TEX.shoes),roughness:.6}),
    hair:std({map:mhTex(THREE,TEX.hair),alphaTest:.4,side:THREE.DoubleSide,roughness:.5})};
  const meshes={};
  for(const k in D.geos){ const m=new THREE.Mesh(D.geos[k],mats[k]); m.morphTargetInfluences=[0,0,0]; m.castShadow=true;
    m.renderOrder=k==='brows'||k==='lashes'?2:k==='hair'?1:0; m.userData.mhPart=k; meshes[k]=m; inner.add(m); }
  const HAIR=new THREE.Color(sex==='female'?0x6b4228:0x4a3020), GREY=new THREE.Color(0xdcd8d0), tint=new THREE.Color(1,1,1), tmp=new THREE.Color();
  const P={root,meshes,mats,age:25,height:1,
    setTint(c){ tint.set(c); P.setAge(P.age,P.tH); },
    setHair(c){ HAIR.set(c); P.setAge(P.age,P.tH); },
    // targetH: if given, scale uniformly so the top of the head is at targetH metres
    setAge(y,targetH){ P.age=y; P.tH=targetH; const w=mhAgeW(y), w0=1-w[0]-w[1]-w[2];
      for(const k in meshes) meshes[k].morphTargetInfluences.splice(0,3,...w);
      const lerp4=a=>a[0]*w0+a[1]*w[0]+a[2]*w[1]+a[3]*w[2];
      const mn=lerp4(D.minY), top=lerp4(D.topY); inner.position.y=-mn; P.natH=top-mn;
      const s=targetH?targetH/P.natH:1; root.scale.setScalar(s); P.height=P.natH*s;
      U.uOld.value=Math.min(1,Math.max(0,(y-45)/30));
      const g=Math.min(1,Math.max(0,(y-50)/25));
      skin.color.copy(tint).multiplyScalar(dim*.8);
      mats.hair.color.copy(HAIR).lerp(GREY,g).multiplyScalar(dim);
      mats.brows.color.copy(tmp.set(0x5a3a24)).lerp(GREY,g*.7).multiplyScalar(dim);
      for(const k of ['eyes','suit','shoes']) mats[k].color.setScalar(dim);
      meshes.hair.visible=y>=2;
    }};
  P.setAge(25);
  return P;
}
