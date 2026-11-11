/* Paisatge per a Ecosistemes: cel amb sol, turons de fons, herba amb vent, aigua amb reflexos */
window.EcoLand=function(THREE,{scene,groundY}){
 const L={items:[]};
 const add=o=>{ L.items.push(o); return o; };
 L.clear=(world)=>{ for(const o of L.items){ if(o.parent) o.parent.remove(o); if(o.geometry) o.geometry.dispose(); } L.items=[]; };
 /* ---- cel ---- */
 L.sky=(world,E)=>{ const top=new THREE.Color(E.skyTop??0x4d9be8), hor=new THREE.Color(E.skyHor??0xcfe9ff), sun=new THREE.Vector3(.45,.55,.35).normalize();
  const m=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{top:{value:top},hor:{value:hor},sunDir:{value:sun},t:{value:0},sea:{value:E.sea?1:0},night:{value:0}},
   vertexShader:'varying vec3 vP; void main(){ vP=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
   fragmentShader:`uniform vec3 top,hor,sunDir; uniform float t,sea,night; varying vec3 vP;
    float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
    float n(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
    void main(){ float y=max(0.,vP.y); vec3 c=mix(hor,top,pow(y,.6)); float sd=max(0.,dot(vP,sunDir)); c+=vec3(1.,.95,.8)*pow(sd,180.)*1.2+vec3(1.,.9,.7)*pow(sd,8.)*.25;
     if(sea<.5){ float a=atan(vP.x,vP.z); float cl=n(vec2(a*3.+t*.012,y*8.))*n(vec2(a*7.-t*.02,y*14.+2.)); c=mix(c,vec3(1.),smoothstep(.32,.55,cl)*smoothstep(.08,.35,y)*.85); }
     else { c=mix(vec3(.02,.2,.35),vec3(.3,.65,.85),pow(y,.7)); c+=vec3(.6,.9,1.)*pow(sd,6.)*.3; }
     if(night>0.){ vec3 nc=mix(vec3(.06,.08,.16),vec3(.01,.02,.06),pow(y,.5)); float st=step(.998,h(floor(vP.xz*400.)+floor(vP.y*400.)))*pow(y,.5); nc+=vec3(st); float md=max(0.,dot(vP,normalize(vec3(-.5,.5,-.3)))); nc+=vec3(.9,.9,.8)*pow(md,400.)*1.2+vec3(.5,.55,.7)*pow(md,12.)*.2; c=mix(c,nc,night); }
     gl_FragColor=vec4(c,1.); }`});
  const d=add(new THREE.Mesh(new THREE.SphereGeometry(E.radius||120,32,20),m)); d.renderOrder=-20; d.frustumCulled=false; world.add(d); L.skyM=m; L.sunDir=sun; return d; };
 /* ---- turons de fons (anell fora de l'illa) ---- */
 L.hills=(world,E,R)=>{ const g=new THREE.RingGeometry(16,70,96,10); g.rotateX(-Math.PI/2); const p=g.attributes.position; const col=new Float32Array(p.count*3); const c1=new THREE.Color(E.hillLo??0x5f8f3f), c2=new THREE.Color(E.hillHi??0x8aa85a), c3=new THREE.Color(E.hillFar??0x9fb8c8);
  for(let i=0;i<p.count;i++){ const x=p.getX(i),z=p.getZ(i),d=Math.hypot(x,z); const t=(d-16)/54; const a=Math.atan2(z,x); let y=-1.3+t*1.3+ (Math.sin(a*3+1)+Math.sin(a*7+d*.1)*.6+Math.sin(a*13)*.3)*t*5.5*(.5+t); if(d<18) y=-1.3; p.setY(i,y); const c=new THREE.Color().copy(c1).lerp(c2,Math.min(1,Math.max(0,y/5))).lerp(c3,t*t*.9); col.set([c.r,c.g,c.b],i*3); }
  g.setAttribute('color',new THREE.BufferAttribute(col,3)); g.computeVertexNormals(); const m=add(new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true}))); m.receiveShadow=true; world.add(m); return m; };
 /* ---- herba instanciada amb vent ---- */
 L.grass=(world,R,opts={})=>{ const N=opts.n||2600, rMin=opts.rMin||.8, rMax=opts.rMax||15.2, gy=opts.groundY||groundY, cx=opts.cx||0, cz=opts.cz||0;
  const blade=new THREE.PlaneGeometry(.16,.42,1,4); blade.translate(0,.21,0); const pos=blade.attributes.position; for(let i=0;i<pos.count;i++){ const y=pos.getY(i); const k=y/.42; pos.setX(i,pos.getX(i)*(1-k*.85)); pos.setZ(i,Math.sin(k*1.4)*.06); } { const col=new Float32Array(pos.count*3); for(let i=0;i<pos.count;i++){ const k=pos.getY(i)/.42; const d=.55+k*.5; col[i*3]=d; col[i*3+1]=d; col[i*3+2]=d; } blade.setAttribute('color',new THREE.BufferAttribute(col,3)); }
  const mat=new THREE.MeshStandardMaterial({color:opts.color||0x6fae3f,side:THREE.DoubleSide,roughness:.95,vertexColors:true,transparent:true,opacity:.95}); mat.userData.t={value:0};
  mat.onBeforeCompile=sh=>{ sh.uniforms.t=mat.userData.t; sh.vertexShader='uniform float t;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n vec4 wp=instanceMatrix*vec4(0.,0.,0.,1.); float sw=sin(t*1.8+wp.x*.7+wp.z*.5)*.5+sin(t*3.1+wp.z*1.3)*.25; transformed.x+=sw*position.y*.55; transformed.z+=cos(t*1.3+wp.x)*position.y*.25;'); };
  mat.customProgramCacheKey=()=>'ecograss';
  const im=add(new THREE.InstancedMesh(blade,mat,N)); const M=new THREE.Matrix4(), q=new THREE.Quaternion(), s=new THREE.Vector3(), v=new THREE.Vector3(); const col=new THREE.Color(); const base=new THREE.Color(opts.color||0x6fae3f);
  let k=0; for(let i=0;i<N*3&&k<N;i++){ const a=R()*6.28, d=rMin+Math.sqrt(R())*(rMax-rMin); const x=cx+Math.cos(a)*d, z=cz+Math.sin(a)*d; if(opts.skip&&opts.skip(x,z)) continue; const y=gy(x,z); if(y<(opts.minY??-.5)) continue; v.set(x,y,z); q.setFromAxisAngle(new THREE.Vector3(0,1,0),R()*6.28); const h=(opts.h||1)*(.45+R()*.5); s.set(h*1.1,h,h*1.1); M.compose(v,q,s); im.setMatrixAt(k,M); col.copy(base).offsetHSL((R()-.5)*.05,(R()-.5)*.15,(R()-.5)*.18+.02); im.setColorAt(k,col); k++; }
  im.count=k; im.instanceMatrix.needsUpdate=true; if(im.instanceColor) im.instanceColor.needsUpdate=true; im.receiveShadow=true; im.frustumCulled=false; world.add(im); L.grassM=mat; return im; };
 /* ---- aigua amb reflexos (fresnel + onades) ---- */
 L.water=(world,r,y,E)=>{ const g=new THREE.CircleGeometry(r,96); g.rotateX(-Math.PI/2); const deep=new THREE.Color(E.deep??0x1a5f8f), shallow=new THREE.Color(E.shallow??0x4fb3e0);
  const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,fog:true,uniforms:Object.assign({t:{value:0},deep:{value:deep},shallow:{value:shallow},sunDir:{value:L.sunDir||new THREE.Vector3(.45,.55,.35)},op:{value:E.wop??.85},skyTop:{value:new THREE.Color(E.skyTop??0x4d9be8)},skyHor:{value:new THREE.Color(E.skyHor??0xcfe9ff)}},THREE.UniformsLib.fog),
   vertexShader:`uniform float t; varying vec3 vW; varying vec3 vN; varying float vD;
    #include <fog_pars_vertex>
    void main(){ vec3 p=position; float w=sin(p.x*1.6+t*1.4)*.05+sin(p.z*2.1-t*1.1)*.04+sin((p.x+p.z)*.8+t*.7)*.03; p.y+=w; vD=length(p.xz);
     float dx=cos(p.x*1.6+t*1.4)*.08+cos((p.x+p.z)*.8+t*.7)*.024, dz=-cos(p.z*2.1-t*1.1)*.084+cos((p.x+p.z)*.8+t*.7)*.024; vN=normalize(vec3(-dx,1.,-dz));
     vec4 mvPosition=modelViewMatrix*vec4(p,1.); vW=(modelMatrix*vec4(p,1.)).xyz; gl_Position=projectionMatrix*mvPosition;
     #include <fog_vertex>
    }`,
   fragmentShader:`uniform vec3 deep,shallow,sunDir,skyTop,skyHor; uniform float op,t; varying vec3 vW; varying vec3 vN; varying float vD;
    #include <fog_pars_fragment>
    void main(){ vec3 V=normalize(cameraPosition-vW); vec3 N=normalize(vN); float fr=pow(1.-max(0.,dot(V,N)),2.5); vec3 refl=mix(skyHor,skyTop,max(0.,N.y*.5+V.y*.5));
     vec3 H=normalize(V+normalize(sunDir)); float sp=pow(max(0.,dot(N,H)),240.)*1.4; float sp2=pow(max(0.,dot(N,H)),30.)*.15;
     vec3 c=mix(shallow,deep,smoothstep(0.,1.,vD/6.)*.6+fr*.3); c=mix(c,refl,fr*.75)+vec3(sp+sp2);
     float rip=sin(vW.x*12.+t*2.)*sin(vW.z*11.-t*1.6); c+=vec3(.06)*smoothstep(.75,1.,rip);
     gl_FragColor=vec4(c,op+fr*.15);
     #include <fog_fragment>
    }`});
  const w=add(new THREE.Mesh(g,m)); w.position.y=y; w.renderOrder=1; world.add(w); L.waterM=m; w.userData.landWater=1; return w; };
 L.groundTex=(size=256,scale=6,a=0x6f9f45,b=0x4f7f35)=>{ const cv=document.createElement('canvas'); cv.width=cv.height=size; const g=cv.getContext('2d'); const A=new THREE.Color(a),B=new THREE.Color(b); const img=g.createImageData(size,size); const rnd=[]; for(let i=0;i<(scale+1)*(scale+1);i++) rnd.push(Math.random()); const sm=t=>t*t*(3-2*t); for(let y=0;y<size;y++) for(let x=0;x<size;x++){ let v=0,amp=.5,fx=x/size*scale,fy=y/size*scale; for(let o=0;o<4;o++){ const xi=Math.floor(fx)%scale, yi=Math.floor(fy)%scale, tx=sm(fx-Math.floor(fx)), ty=sm(fy-Math.floor(fy)); const q=(i,j)=>rnd[((j%scale)+scale)%scale*(scale+1)+((i%scale)+scale)%scale]; v+=amp*((q(xi,yi)*(1-tx)+q(xi+1,yi)*tx)*(1-ty)+(q(xi,yi+1)*(1-tx)+q(xi+1,yi+1)*tx)*ty); amp*=.5; fx*=2; fy*=2; } const k=Math.min(1,Math.max(0,(v-.3)*1.6)); const i=(y*size+x)*4; img.data[i]=(A.r+(B.r-A.r)*k)*255; img.data[i+1]=(A.g+(B.g-A.g)*k)*255; img.data[i+2]=(A.b+(B.b-A.b)*k)*255; img.data[i+3]=255; } g.putImageData(img,0,0); const t=new THREE.CanvasTexture(cv); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.colorSpace=THREE.SRGBColorSpace; return t; };
 L.setNight=(v)=>{ if(L.skyM) L.skyM.uniforms.night.value=v; };
 L.tick=(T)=>{ if(L.skyM) L.skyM.uniforms.t.value=T; if(L.grassM) L.grassM.userData.t.value=T; if(L.waterM) L.waterM.uniforms.t.value=T; };
 return L; };
