/* MediLab visual kit: fons amb profunditat, pols en suspensió, ombres de contacte, transicions. Compartit. */
window.Vis=(function(){
const V={};
/* fons: cúpula amb degradat + vinyeta; kinds: lab (fred), warm, space, nature(sky), map */
V.backdrop=function(THREE,scene,kind='lab',opts={}){
  const K={lab:[0x0a1a33,0x03070f,0x12305a],warm:[0x2a1420,0x07040a,0x4a2030],space:[0x02050c,0x000000,0x0a1430],nature:[0x9fd0f2,0x3f7fc4,0xe7f3ff],map:[0x0b1f3a,0x040a16,0x143a66],time:[0x1a1430,0x05030a,0x3a2a60]}[kind]||[0x0a1a33,0x03070f,0x12305a];
  const top=new THREE.Color(opts.top??K[0]), bot=new THREE.Color(opts.bot??K[1]), glow=new THREE.Color(opts.glow??K[2]);
  const R=opts.radius||60;
  const g=new THREE.SphereGeometry(R,32,24); const m=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,
    uniforms:{top:{value:top},bot:{value:bot},glow:{value:glow},t:{value:0},k:{value:kind==='nature'?1:0}},
    vertexShader:'varying vec3 vP; void main(){ vP=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader:`uniform vec3 top,bot,glow; uniform float t,k; varying vec3 vP;
      float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float n(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
      void main(){ float y=vP.y*.5+.5; vec3 c=mix(bot,top,smoothstep(0.,1.,y));
        float a=atan(vP.x,vP.z); float g=exp(-pow((y-.55)*3.,2.))*(.5+.5*n(vec2(a*2.+t*.02,y*3.)));
        c+=glow*g*.35;
        if(k>.5){ float cl=n(vec2(a*3.+t*.01,y*6.))*n(vec2(a*7.-t*.02,y*12.)); c=mix(c,vec3(1.),smoothstep(.35,.6,cl)*smoothstep(.45,.7,y)*.8); }
        gl_FragColor=vec4(c,1.); }`});
  const mesh=new THREE.Mesh(g,m); mesh.name='backdrop'; mesh.renderOrder=-10; mesh.frustumCulled=false; scene.add(mesh);
  scene.background=null;
  V.bd=mesh; return mesh; };
/* pols/partícules en suspensió: vida sense tocar res */
V.dust=function(THREE,scene,n=220,box=[6,4,6],opts={}){
  const pos=new Float32Array(n*3), ph=new Float32Array(n);
  for(let i=0;i<n;i++){ pos[i*3]=(Math.random()-.5)*box[0]; pos[i*3+1]=Math.random()*box[1]; pos[i*3+2]=(Math.random()-.5)*box[2]; ph[i]=Math.random()*6.28; }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setAttribute('ph',new THREE.BufferAttribute(ph,1));
  const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,
    uniforms:{t:{value:0},col:{value:new THREE.Color(opts.color||0x9fe7ff)},sz:{value:opts.size||3.5},H:{value:box[1]}},
    vertexShader:`attribute float ph; uniform float t,sz,H; varying float va; void main(){ vec3 p=position; p.y=mod(p.y+t*.08+ph,H); p.x+=sin(t*.3+ph)*.15; p.z+=cos(t*.25+ph*1.3)*.15; vec4 mv=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv; gl_PointSize=min(14.,sz*(1.+.5*sin(t*2.+ph*3.))*(12./-mv.z)); va=.35+.35*sin(t*1.5+ph*2.); }`,
    fragmentShader:`uniform vec3 col; varying float va; void main(){ float d=length(gl_PointCoord-.5); if(d>.5) discard; gl_FragColor=vec4(col,va*(1.-d*2.)); }`});
  const pts=new THREE.Points(g,m); pts.frustumCulled=false; pts.name='dust'; if(opts.y!=null) pts.position.y=opts.y; scene.add(pts); V.dusts=(V.dusts||[]); V.dusts.push(pts); return pts; };
/* ombra de contacte suau sota un objecte (sense shadowMap): disc degradat */
V.contactShadow=function(THREE,parent,r=.6,opacity=.45,y=.005){
  if(!V._shTex){ const c=document.createElement('canvas'); c.width=c.height=128; const g=c.getContext('2d'); const gr=g.createRadialGradient(64,64,0,64,64,64); gr.addColorStop(0,'rgba(0,0,0,1)'); gr.addColorStop(.5,'rgba(0,0,0,.55)'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(0,0,128,128); V._shTex=new THREE.CanvasTexture(c); }
  const m=new THREE.Mesh(new THREE.PlaneGeometry(r*2,r*2),new THREE.MeshBasicMaterial({map:V._shTex,transparent:true,opacity,depthWrite:false})); m.rotation.x=-Math.PI/2; m.position.y=y; m.renderOrder=-1; parent.add(m); return m; };
/* ombres reals: activa i configura el llum */
V.shadows=function(THREE,renderer,light,size=2048,box=6){ renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFShadowMap; light.castShadow=true; light.shadow.mapSize.set(size,size); const c=light.shadow.camera; c.left=-box; c.right=box; c.top=box; c.bottom=-box; c.near=.5; c.far=box*8; light.shadow.bias=-.0005; light.shadow.radius=4; return light; };
V.shadowFloor=function(THREE,scene,size=20,opacity=.35,y=0){ const m=new THREE.Mesh(new THREE.PlaneGeometry(size,size),new THREE.ShadowMaterial({opacity})); m.rotation.x=-Math.PI/2; m.position.y=y; m.receiveShadow=true; scene.add(m); return m; };
/* transició: flaix suau en canviar de mode */
V.fade=function(){ let o=document.getElementById('visFade'); if(!o){ o=document.createElement('div'); o.id='visFade'; o.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:4;background:radial-gradient(circle at 50% 50%,rgba(0,229,255,.18),rgba(3,7,18,.75) 70%);opacity:0;transition:opacity .35s'; document.body.appendChild(o); } o.style.transition='none'; o.style.opacity='1'; requestAnimationFrame(()=>requestAnimationFrame(()=>{ o.style.transition='opacity .55s'; o.style.opacity='0'; })); };
/* tick: anima fons i pols */
V.tick=function(T,camera){ if(V.bd){ V.bd.material.uniforms.t.value=T; if(camera) V.bd.position.copy(camera.position); } if(V.dusts) for(const d of V.dusts) d.material.uniforms.t.value=T; };
/* textura procedimental de soroll (per donar vida a materials plans) */
V.noiseTex=function(THREE,size=256,scale=8,contrast=.35){ const c=document.createElement('canvas'); c.width=c.height=size; const g=c.getContext('2d'); const img=g.createImageData(size,size); const d=img.data;
  const rnd=new Float32Array((scale+1)*(scale+1)); for(let i=0;i<rnd.length;i++) rnd[i]=Math.random();
  const sm=t=>t*t*(3-2*t);
  for(let y=0;y<size;y++) for(let x=0;x<size;x++){ let v=0,amp=.5,fx=x/size*scale,fy=y/size*scale; for(let o=0;o<3;o++){ const xi=Math.floor(fx)%scale, yi=Math.floor(fy)%scale, tx=sm(fx-Math.floor(fx)), ty=sm(fy-Math.floor(fy)); const a=rnd[yi*(scale+1)+xi],b=rnd[yi*(scale+1)+xi+1],cc=rnd[(yi+1)*(scale+1)+xi],dd=rnd[(yi+1)*(scale+1)+xi+1]; v+=amp*((a*(1-tx)+b*tx)*(1-ty)+(cc*(1-tx)+dd*tx)*ty); amp*=.5; fx*=2; fy*=2; }
    const q=Math.round(128+(v-.5)*255*contrast); const i=(y*size+x)*4; d[i]=d[i+1]=d[i+2]=q; d[i+3]=255; }
  g.putImageData(img,0,0); const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; return t; };
return V; })();
