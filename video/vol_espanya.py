import bpy, math, sys, time, numpy as np
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
F0=int(args[0]) if args else 0; F1=int(args[1]) if len(args)>1 else F0; W=int(args[2]) if len(args)>2 else 960; SMP=int(args[3]) if len(args)>3 else 32
NF=60  # 10 s a 6 fps base, s'interpola a 24
bpy.ops.wm.read_factory_settings(use_empty=True)
sc=bpy.context.scene; sc.render.engine='CYCLES'; sc.cycles.samples=SMP; sc.cycles.use_denoising=True; sc.cycles.device='CPU'
sc.render.resolution_x=W; sc.render.resolution_y=int(W*9/16); sc.render.resolution_percentage=100; sc.render.film_transparent=False
sc.view_settings.view_transform='AgX'; sc.view_settings.look='AgX - Medium High Contrast'; sc.view_settings.exposure=-4.2
# ---------- terreny real (DEM) ----------
h=np.load('/tmp/bl/h.npy')            # (501,846) metres, lat1=44.4 top, lon0=-11.9 esq, pas .02
H,Wd=h.shape; lon0,lat1,st=-11.9,44.4,0.02
KMX=85.0*st; KMY=111.0*st             # km per píxel
EX=2.6                                # exageració vertical
step=1
hh=h[::step,::step]; Hs,Ws=hh.shape
verts=[];
for j in range(Hs):
  for i in range(Ws):
    verts.append((i*KMX*step, -j*KMY*step, max(hh[j,i],0)/1000.0*EX))
faces=[]
for j in range(Hs-1):
  b=j*Ws
  for i in range(Ws-1):
    faces.append((b+i,b+i+1,b+i+1+Ws,b+i+Ws))
me=bpy.data.meshes.new('esp'); me.from_pydata(verts,[],faces); me.update()
ob=bpy.data.objects.new('esp',me); sc.collection.objects.link(ob)
for p in me.polygons: p.use_smooth=True
sub=ob.modifiers.new('sub','SUBSURF'); sub.subdivision_type='SIMPLE'; sub.levels=1; sub.render_levels=1
dm=ob.modifiers.new('det','DISPLACE'); dtex=bpy.data.textures.new('det','CLOUDS'); dtex.noise_scale=1.1; dtex.noise_depth=4; dtex.noise_basis='VORONOI_F2_F1'; dm.texture=dtex; dm.strength=.9; dm.mid_level=.5
dm2=ob.modifiers.new('det2','DISPLACE'); dtex2=bpy.data.textures.new('det2','CLOUDS'); dtex2.noise_scale=4.5; dtex2.noise_depth=3; dm2.texture=dtex2; dm2.strength=1.6; dm2.mid_level=.5
# que el detall creixi amb l'alçada: grup de vèrtexs per alçada
vg=ob.vertex_groups.new(name='alt'); 
for i,v in enumerate(me.vertices): vg.add([i],min(1.0,max(0.0,(v.co.z-0.3)/4.0)),'REPLACE')
dm.vertex_group='alt'; dm2.vertex_group='alt'
# material per alçada i pendent
mat=bpy.data.materials.new('terra'); mat.use_nodes=True; nt=mat.node_tree; bsdf=nt.nodes['Principled BSDF']; bsdf.inputs['Roughness'].default_value=.95
geo=nt.nodes.new('ShaderNodeNewGeometry'); sep=nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(geo.outputs['Position'],sep.inputs[0])
ramp=nt.nodes.new('ShaderNodeValToRGB'); dv=nt.nodes.new('ShaderNodeMath'); dv.operation='DIVIDE'; dv.inputs[1].default_value=9.0
nt.links.new(sep.outputs['Z'],dv.inputs[0]); nt.links.new(dv.outputs[0],ramp.inputs['Fac'])
cr=ramp.color_ramp; cr.elements[0].position=0.0; cr.elements[0].color=(0.08,0.22,0.05,1)
cr.elements[1].position=0.09; cr.elements[1].color=(0.36,0.27,0.10,1)
e=cr.elements.new(0.30); e.color=(0.24,0.17,0.10,1)
e=cr.elements.new(0.52); e.color=(0.33,0.32,0.33,1)
e=cr.elements.new(0.68); e.color=(0.95,0.96,1.0,1)
# textura de detall
nz=nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value=.6; nz.inputs['Detail'].default_value=8
mix=nt.nodes.new('ShaderNodeMix'); mix.data_type='RGBA'; mix.inputs['Factor'].default_value=.35
nt.links.new(ramp.outputs['Color'],mix.inputs[6]);
dark=nt.nodes.new('ShaderNodeMix'); dark.data_type='RGBA'; dark.blend_type='MULTIPLY'; dark.inputs['Factor'].default_value=1.0
nt.links.new(ramp.outputs['Color'],dark.inputs[6]); nt.links.new(nz.outputs['Color'],dark.inputs[7]); nt.links.new(dark.outputs[2],mix.inputs[7])
nt.links.new(mix.outputs[2],bsdf.inputs['Base Color'])
bump=nt.nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value=.6; nz2=nt.nodes.new('ShaderNodeTexNoise'); nz2.inputs['Scale'].default_value=1.4; nz2.inputs['Detail'].default_value=10
nt.links.new(nz2.outputs['Fac'],bump.inputs['Height']); nt.links.new(bump.outputs['Normal'],bsdf.inputs['Normal'])
me.materials.append(mat)
# ---------- mar ----------
bpy.ops.mesh.primitive_plane_add(size=6000,location=(Ws*KMX/2,-Hs*KMY/2,0.012)); sea=bpy.context.object
sm=bpy.data.materials.new('mar'); sm.use_nodes=True; st_=sm.node_tree; b=st_.nodes['Principled BSDF']
b.inputs['Base Color'].default_value=(0.01,0.07,0.14,1); b.inputs['Roughness'].default_value=.08; b.inputs['Metallic'].default_value=.1
nz3=st_.nodes.new('ShaderNodeTexNoise'); nz3.inputs['Scale'].default_value=12; nz3.inputs['Detail'].default_value=6; bp=st_.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value=.12
st_.links.new(nz3.outputs['Fac'],bp.inputs['Height']); st_.links.new(bp.outputs['Normal'],b.inputs['Normal']); sea.data.materials.append(sm)
# ---------- cel ----------
w=bpy.data.worlds.new('w'); sc.world=w; w.use_nodes=True; wn=w.node_tree; sky=wn.nodes.new('ShaderNodeTexSky'); sky.sky_type='MULTIPLE_SCATTERING'
sky.sun_elevation=math.radians(6); sky.sun_rotation=math.radians(282); sky.sun_intensity=.5; sky.altitude=2500; sky.air_density=1.2; sky.aerosol_density=1.8
wn.links.new(sky.outputs['Color'],wn.nodes['Background'].inputs['Color']); wn.nodes['Background'].inputs['Strength'].default_value=1.0
# ---------- boira atmosfèrica dins del shader (es fon amb el color real del cel) ----------
def addfog(material,start=40,depth=420,amount=.85):
  nt_=material.node_tree; out=[n for n in nt_.nodes if n.type=='OUTPUT_MATERIAL'][0]; bs=[n for n in nt_.nodes if n.type=='BSDF_PRINCIPLED'][0]
  skyn=nt_.nodes.new('ShaderNodeTexSky'); skyn.sky_type='MULTIPLE_SCATTERING'; skyn.sun_elevation=sky.sun_elevation; skyn.sun_rotation=sky.sun_rotation; skyn.sun_intensity=sky.sun_intensity; skyn.altitude=sky.altitude; skyn.air_density=sky.air_density; skyn.aerosol_density=sky.aerosol_density; skyn.sun_disc=False
  g_=nt_.nodes.new('ShaderNodeNewGeometry'); neg=nt_.nodes.new('ShaderNodeVectorMath'); neg.operation='SCALE'; neg.inputs['Scale'].default_value=-1.0; nt_.links.new(g_.outputs['Incoming'],neg.inputs[0])
  sp=nt_.nodes.new('ShaderNodeSeparateXYZ'); nt_.links.new(neg.outputs[0],sp.inputs[0]); mz=nt_.nodes.new('ShaderNodeMath'); mz.operation='MAXIMUM'; mz.inputs[1].default_value=0.02; nt_.links.new(sp.outputs['Z'],mz.inputs[0])
  cb=nt_.nodes.new('ShaderNodeCombineXYZ'); nt_.links.new(sp.outputs['X'],cb.inputs[0]); nt_.links.new(sp.outputs['Y'],cb.inputs[1]); nt_.links.new(mz.outputs[0],cb.inputs[2]); nrm=nt_.nodes.new('ShaderNodeVectorMath'); nrm.operation='NORMALIZE'; nt_.links.new(cb.outputs[0],nrm.inputs[0]); nt_.links.new(nrm.outputs[0],skyn.inputs['Vector'])
  em=nt_.nodes.new('ShaderNodeEmission'); nt_.links.new(skyn.outputs['Color'],em.inputs['Color']); em.inputs['Strength'].default_value=1.0
  cd=nt_.nodes.new('ShaderNodeCameraData'); m1=nt_.nodes.new('ShaderNodeMath'); m1.operation='SUBTRACT'; m1.inputs[1].default_value=start
  m2=nt_.nodes.new('ShaderNodeMath'); m2.operation='DIVIDE'; m2.inputs[1].default_value=depth; m3=nt_.nodes.new('ShaderNodeMath'); m3.operation='MULTIPLY'; m3.inputs[1].default_value=amount; m3.use_clamp=True
  nt_.links.new(cd.outputs['View Distance'],m1.inputs[0]); nt_.links.new(m1.outputs[0],m2.inputs[0]); nt_.links.new(m2.outputs[0],m3.inputs[0])
  mx=nt_.nodes.new('ShaderNodeMixShader'); nt_.links.new(m3.outputs[0],mx.inputs[0]); nt_.links.new(bs.outputs[0],mx.inputs[1]); nt_.links.new(em.outputs[0],mx.inputs[2]); nt_.links.new(mx.outputs[0],out.inputs['Surface'])
addfog(mat,25,480,.78); addfog(sm,60,560,.75)
# ---------- compositor ----------
vl=sc.view_layers[0]; sc.render.film_transparent=False; w.mist_settings.start=40; w.mist_settings.depth=420; w.mist_settings.falloff='LINEAR'
if hasattr(sc,'compositing_node_group'):
  ct=bpy.data.node_groups.new('comp','CompositorNodeTree'); sc.compositing_node_group=ct
else:
  sc.use_nodes=True; ct=sc.node_tree; ct.nodes.clear()
rl=ct.nodes.new('CompositorNodeRLayers')
if hasattr(sc,'compositing_node_group'):
  ct.interface.new_socket('Image',in_out='OUTPUT',socket_type='NodeSocketColor'); comp=ct.nodes.new('NodeGroupOutput')
else: comp=ct.nodes.new('CompositorNodeComposite')
try:
  glare=ct.nodes.new('CompositorNodeGlare')
  try: glare.inputs['Type'].default_value='Fog Glow'
  except Exception as e2: print('type',e2)
  for k in ('threshold',): 
    if hasattr(glare,k): setattr(glare,k,1.0)
  if 'Threshold' in glare.inputs: glare.inputs['Threshold'].default_value=1.0
  if 'Strength' in glare.inputs: glare.inputs['Strength'].default_value=.25
  ct.links.new(rl.outputs['Image'],glare.inputs[0]); ct.links.new(glare.outputs[0],comp.inputs[0])
except Exception as ex:
  print('glare off',ex); ct.links.new(rl.outputs['Image'],comp.inputs[0])
# ---------- càmera: vol de SE (Mediterrani) cap al NO sobre la Meseta ----------
def km(lon,lat): return ((lon-lon0)/st*KMX, -(lat1-lat)/st*KMY)
cam=bpy.data.cameras.new('c'); co=bpy.data.objects.new('cam',cam); sc.collection.objects.link(co); sc.camera=co; cam.lens=28; cam.clip_end=6000; cam.sensor_width=36
def pose(t):
  import mathutils
  x0,y0=km(0.7,39.1); x1,y1=km(-0.7,39.8)
  x=x0+(x1-x0)*t; y=y0+(y1-y0)*t; z=17+3*t
  tx,ty=km(-0.6-0.9*t,39.9+0.25*t); tz=0.8
  co.location=(x,y,z); d=(tx-x,ty-y,tz-z)
  co.rotation_euler=mathutils.Vector(d).to_track_quat('-Z','Y').to_euler()
import os
if os.environ.get('RAW'): 
  for l in list(ct.links): ct.links.remove(l)
  ct.links.new(rl.outputs[os.environ.get('RAW') if os.environ.get('RAW')!='1' else 'Image'],comp.inputs[0])
if os.environ.get('FLAT'):
  for l in list(nt.links):
    if l.to_socket==bsdf.inputs['Base Color']: nt.links.remove(l)
  bsdf.inputs['Base Color'].default_value=(0.2,0.12,0.05,1)
sc.frame_start=0; sc.frame_end=NF-1
for f in range(F0,F1+1):
  pose(f/(NF-1)); sc.render.filepath=f'/tmp/bl/out/f{f:04d}.png'; t0=time.time(); bpy.ops.render.render(write_still=True); print('FRAME',f,round(time.time()-t0,1),'s',flush=True)
