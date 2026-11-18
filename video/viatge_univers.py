import bpy, math, sys, time, random
import mathutils as mu
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
MODE=args[0] if args else 'keys'   # keys | anim
F0=int(args[1]) if len(args)>1 else 0; F1=int(args[2]) if len(args)>2 else F0
W=int(args[3]) if len(args)>3 else 960; SMP=int(args[4]) if len(args)>4 else 24
bpy.ops.wm.read_factory_settings(use_empty=True)
sc=bpy.context.scene; sc.render.engine='CYCLES'; sc.cycles.samples=SMP; sc.cycles.use_denoising=True; sc.cycles.device='CPU'
sc.render.resolution_x=W; sc.render.resolution_y=int(W*9/16); sc.view_settings.view_transform='AgX'; sc.view_settings.look='AgX - Medium High Contrast'
sc.cycles.max_bounces=4; sc.cycles.caustics_reflective=False; sc.cycles.caustics_refractive=False
C=sc.collection
def link(o): C.objects.link(o); return o
# ---------- utilitats de material ----------
def newmat(name):
  m=bpy.data.materials.new(name); m.use_nodes=True; nt=m.node_tree; return m,nt,nt.nodes['Principled BSDF'],nt.nodes['Material Output']
def noise(nt,scale,detail=6,rough=.55,dist=0.0):
  n=nt.nodes.new('ShaderNodeTexNoise'); n.inputs['Scale'].default_value=scale; n.inputs['Detail'].default_value=detail; n.inputs['Roughness'].default_value=rough; n.inputs['Distortion'].default_value=dist; return n
def ramp(nt,stops):
  r=nt.nodes.new('ShaderNodeValToRGB'); cr=r.color_ramp; cr.elements[0].position=stops[0][0]; cr.elements[0].color=stops[0][1]; cr.elements[1].position=stops[-1][0]; cr.elements[1].color=stops[-1][1]
  for p,c in stops[1:-1]: e=cr.elements.new(p); e.color=c
  return r
def sphere(name,r,loc=(0,0,0),seg=96):
  bpy.ops.mesh.primitive_uv_sphere_add(radius=r,segments=seg,ring_count=seg//2,location=loc); o=bpy.context.object; o.name=name; bpy.ops.object.shade_smooth(); return o
def texco(nt):
  t=nt.nodes.new('ShaderNodeTexCoord'); return t
# ---------- planetes ----------
def banded(name,r,loc,cols,scale=2.0,warp=1.2,bands=12):
  o=sphere(name,r,loc); m,nt,b,out=newmat(name); tc=texco(nt); sep=nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(tc.outputs['Object'],sep.inputs[0])
  n=noise(nt,scale,8,.6,warp); nt.links.new(tc.outputs['Object'],n.inputs['Vector'])
  mm=nt.nodes.new('ShaderNodeMath'); mm.operation='MULTIPLY_ADD'; mm.inputs[1].default_value=bands; nt.links.new(sep.outputs['Z'],mm.inputs[0]); nt.links.new(n.outputs['Fac'],mm.inputs[2])
  w=nt.nodes.new('ShaderNodeMath'); w.operation='SINE'; nt.links.new(mm.outputs[0],w.inputs[0]); w2=nt.nodes.new('ShaderNodeMath'); w2.operation='MULTIPLY_ADD'; w2.inputs[1].default_value=.5; w2.inputs[2].default_value=.5; nt.links.new(w.outputs[0],w2.inputs[0])
  rp=ramp(nt,cols); nt.links.new(w2.outputs[0],rp.inputs['Fac']); nt.links.new(rp.outputs['Color'],b.inputs['Base Color']); b.inputs['Roughness'].default_value=.8; o.data.materials.append(m); return o
def rocky(name,r,loc,cols,scale=3.0,bump=.3,detail=10):
  o=sphere(name,r,loc); m,nt,b,out=newmat(name); tc=texco(nt); n=noise(nt,scale,detail,.62,.3); nt.links.new(tc.outputs['Object'],n.inputs['Vector'])
  rp=ramp(nt,cols); nt.links.new(n.outputs['Fac'],rp.inputs['Fac']); nt.links.new(rp.outputs['Color'],b.inputs['Base Color']); b.inputs['Roughness'].default_value=.95
  n2=noise(nt,scale*6,12,.7); nt.links.new(tc.outputs['Object'],n2.inputs['Vector']); bp=nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value=bump; nt.links.new(n2.outputs['Fac'],bp.inputs['Height']); nt.links.new(bp.outputs['Normal'],b.inputs['Normal'])
  # cràters: voronoi
  v=nt.nodes.new('ShaderNodeTexVoronoi'); v.inputs['Scale'].default_value=scale*4; nt.links.new(tc.outputs['Object'],v.inputs['Vector']); cr=nt.nodes.new('ShaderNodeMath'); cr.operation='SMOOTH_MIN'; cr.inputs[1].default_value=.25; cr.inputs[2].default_value=.05
  nt.links.new(v.outputs['Distance'],cr.inputs[0]); bp2=nt.nodes.new('ShaderNodeBump'); bp2.inputs['Strength'].default_value=bump*.8; nt.links.new(cr.outputs[0],bp2.inputs['Height']); nt.links.new(bp.outputs['Normal'],bp2.inputs['Normal']); nt.links.new(bp2.outputs['Normal'],b.inputs['Normal'])
  o.data.materials.append(m); return o
def earth(r,loc):
  o=sphere('Terra',r,loc,128); m,nt,b,out=newmat('terra'); tc=texco(nt)
  n=noise(nt,1.6,9,.58,.9); nt.links.new(tc.outputs['Object'],n.inputs['Vector'])
  land=ramp(nt,[(0.0,(0.01,0.06,0.25,1)),(0.52,(0.02,0.12,0.38,1)),(0.575,(0.06,0.32,0.62,1)),(0.585,(0.60,0.55,0.35,1)),(0.60,(0.08,0.26,0.07,1)),(0.65,(0.16,0.24,0.08,1)),(0.72,(0.40,0.33,0.20,1)),(0.84,(0.92,0.94,0.96,1))])
  nt.links.new(n.outputs['Fac'],land.inputs['Fac']); nt.links.new(land.outputs['Color'],b.inputs['Base Color'])
  # rugositat: mar llis, terra rugosa
  rr=ramp(nt,[(0.0,(0.3,0.3,0.3,1)),(0.575,(0.32,0.32,0.32,1)),(0.59,(0.9,0.9,0.9,1))]); nt.links.new(n.outputs['Fac'],rr.inputs['Fac']); nt.links.new(rr.outputs['Color'],b.inputs['Roughness'])
  # casquets polars
  sep=nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(tc.outputs['Object'],sep.inputs[0]); ab=nt.nodes.new('ShaderNodeMath'); ab.operation='ABSOLUTE'; nt.links.new(sep.outputs['Z'],ab.inputs[0])
  pol=nt.nodes.new('ShaderNodeMath'); pol.operation='SMOOTH_MAX'; pol.inputs[1].default_value=0; mp=nt.nodes.new('ShaderNodeMapRange'); mp.inputs['From Min'].default_value=.90*r; mp.inputs['From Max'].default_value=.96*r; nt.links.new(ab.outputs[0],mp.inputs['Value'])
  mix=nt.nodes.new('ShaderNodeMix'); mix.data_type='RGBA'; mix.inputs[7].default_value=(0.95,0.97,1,1); nt.links.new(mp.outputs[0],mix.inputs[0]); nt.links.new(land.outputs['Color'],mix.inputs[6]); nt.links.new(mix.outputs[2],b.inputs['Base Color'])
  o.data.materials.append(m)
  # núvols
  c=sphere('Nuvols',r*1.012,loc,128); cm,cnt,cb,cout=newmat('nuvols'); cn=noise(cnt,2.4,10,.62,1.6); ctc=texco(cnt); cnt.links.new(ctc.outputs['Object'],cn.inputs['Vector'])
  crp=ramp(cnt,[(0.0,(0,0,0,1)),(0.50,(0,0,0,1)),(0.64,(1,1,1,1))]); cnt.links.new(cn.outputs['Fac'],crp.inputs['Fac'])
  cb.inputs['Base Color'].default_value=(1,1,1,1); cb.inputs['Roughness'].default_value=1; cnt.links.new(crp.outputs['Color'],cb.inputs['Alpha']); cm.blend_method='HASHED' if hasattr(cm,'blend_method') else None
  c.data.materials.append(cm); c.parent=o
  # atmosfera (fresnel emissiu lleu)
  a=sphere('Atm',r*1.03,loc,96); am,ant,ab_,aout=newmat('atm'); ant.nodes.remove(ab_); em=ant.nodes.new('ShaderNodeEmission'); em.inputs['Color'].default_value=(0.35,0.6,1.0,1); em.inputs['Strength'].default_value=1.2
  lw=ant.nodes.new('ShaderNodeLayerWeight'); lw.inputs['Blend'].default_value=.08; tr=ant.nodes.new('ShaderNodeBsdfTransparent'); mx=ant.nodes.new('ShaderNodeMixShader')
  pw=ant.nodes.new('ShaderNodeMath'); pw.operation='POWER'; pw.inputs[1].default_value=6; ant.links.new(lw.outputs['Facing'],pw.inputs[0])
  ant.links.new(pw.outputs[0],mx.inputs[0]); ant.links.new(tr.outputs[0],mx.inputs[1]); ant.links.new(em.outputs[0],mx.inputs[2]); ant.links.new(mx.outputs[0],aout.inputs['Surface'])
  if hasattr(am,'blend_method'): am.blend_method='BLEND'
  am.use_backface_culling=True; a.data.materials.append(am); a.parent=o; a.visible_shadow=False
  return o
def rings(parent,r1,r2):
  bpy.ops.mesh.primitive_circle_add(vertices=256,radius=r2,fill_type='NGON'); o=bpy.context.object; o.name='Anells'
  bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.inset(thickness=r2-r1,depth=0); bpy.ops.mesh.delete(type='FACE'); bpy.ops.object.mode_set(mode='OBJECT')
  m,nt,b,out=newmat('anells'); tc=texco(nt); ln=nt.nodes.new('ShaderNodeVectorMath'); ln.operation='LENGTH'; nt.links.new(tc.outputs['Object'],ln.inputs[0])
  mp=nt.nodes.new('ShaderNodeMapRange'); mp.inputs['From Min'].default_value=r1; mp.inputs['From Max'].default_value=r2; nt.links.new(ln.outputs['Value'],mp.inputs['Value'])
  n=noise(nt,60,2,.5); cb=nt.nodes.new('ShaderNodeCombineXYZ'); nt.links.new(mp.outputs[0],cb.inputs[0]); nt.links.new(cb.outputs[0],n.inputs['Vector'])
  rp=ramp(nt,[(0.0,(0.0,0.0,0.0,1)),(0.3,(0.75,0.68,0.55,1)),(0.55,(0.2,0.18,0.15,1)),(0.6,(0.85,0.8,0.7,1)),(1.0,(0.3,0.28,0.24,1))]); nt.links.new(n.outputs['Fac'],rp.inputs['Fac'])
  nt.links.new(rp.outputs['Color'],b.inputs['Base Color']); b.inputs['Roughness'].default_value=.9
  al=nt.nodes.new('ShaderNodeMath'); al.operation='MULTIPLY'; al.inputs[1].default_value=.9; nt.links.new(n.outputs['Fac'],al.inputs[0]); nt.links.new(al.outputs[0],b.inputs['Alpha'])
  if hasattr(m,'blend_method'): m.blend_method='HASHED'
  o.data.materials.append(m); o.parent=parent; o.location=(0,0,0); o.rotation_euler=(math.radians(27),0,0); return o
# ---------- escena ----------
# Sol
sun=sphere('Sol',8,(0,0,0),64); sm,snt,sb,sout=newmat('sol'); snt.nodes.remove(sb); em=snt.nodes.new('ShaderNodeEmission'); n=noise(snt,3,6,.6,.4); tc=texco(snt); snt.links.new(tc.outputs['Object'],n.inputs['Vector'])
rp=ramp(snt,[(0.0,(1.0,0.35,0.02,1)),(0.5,(1.0,0.6,0.1,1)),(1.0,(1.0,0.9,0.5,1))]); snt.links.new(n.outputs['Fac'],rp.inputs['Fac']); snt.links.new(rp.outputs['Color'],em.inputs['Color']); em.inputs['Strength'].default_value=14; snt.links.new(em.outputs[0],sout.inputs['Surface'])
sun.data.materials.append(sm); sun.visible_diffuse=False; sun.visible_glossy=False; sun.visible_transmission=False; sun.visible_shadow=False
lamp=bpy.data.lights.new('sunl','SUN'); lamp.energy=5.5; lamp.angle=math.radians(1.2); lamp.color=(1,.97,.92); lo=link(bpy.data.objects.new('sunl',lamp)); lo.location=(0,0,0); lo.rotation_euler=mu.Vector((1,0,0)).to_track_quat('-Z','Y').to_euler()
# món: estrelles
w=bpy.data.worlds.new('w'); sc.world=w; w.use_nodes=True; wn=w.node_tree; bg=wn.nodes['Background']
st=wn.nodes.new('ShaderNodeTexNoise'); st.inputs['Scale'].default_value=900; st.inputs['Detail'].default_value=2; st.inputs['Roughness'].default_value=.3
tcw=wn.nodes.new('ShaderNodeTexCoord'); wn.links.new(tcw.outputs['Generated'],st.inputs['Vector'])
sr=wn.nodes.new('ShaderNodeValToRGB'); sr.color_ramp.elements[0].position=.74; sr.color_ramp.elements[0].color=(0,0,0,1); sr.color_ramp.elements[1].position=.80; sr.color_ramp.elements[1].color=(1,1,1,1); wn.links.new(st.outputs['Fac'],sr.inputs['Fac'])
mw=wn.nodes.new('ShaderNodeTexNoise'); mw.inputs['Scale'].default_value=2.5; mw.inputs['Detail'].default_value=8; wn.links.new(tcw.outputs['Generated'],mw.inputs['Vector'])
mr=wn.nodes.new('ShaderNodeValToRGB'); mr.color_ramp.elements[0].position=.45; mr.color_ramp.elements[0].color=(0.002,0.003,0.006,1); mr.color_ramp.elements[1].position=.75; mr.color_ramp.elements[1].color=(0.03,0.03,0.05,1); wn.links.new(mw.outputs['Fac'],mr.inputs['Fac'])
ad=wn.nodes.new('ShaderNodeMix'); ad.data_type='RGBA'; ad.blend_type='ADD'; ad.inputs[0].default_value=1; wn.links.new(mr.outputs['Color'],ad.inputs[6]); wn.links.new(sr.outputs['Color'],ad.inputs[7]); wn.links.new(ad.outputs[2],bg.inputs['Color']); bg.inputs['Strength'].default_value=1.0
# planetes (distàncies comprimides, radis relatius exagerats per veure'ls)
P={}
P['Mercuri']=rocky('Mercuri',.6,(14,0,0),[(0,(0.25,0.24,0.23,1)),(1,(0.55,0.52,0.48,1))],4,.4)
P['Venus']=banded('Venus',1.1,(20,-2,0),[(0,(0.75,0.6,0.35,1)),(0.5,(0.92,0.82,0.6,1)),(1,(0.8,0.68,0.45,1))],3,2.5,6)
P['Terra']=earth(1.15,(28,1.5,0))
P['Lluna']=rocky('Lluna',.32,(30.4,2.6,0.3),[(0,(0.3,0.3,0.3,1)),(1,(0.7,0.7,0.68,1))],5,.5)
P['Mart']=rocky('Mart',.75,(36,-3,0),[(0,(0.45,0.2,0.1,1)),(0.6,(0.75,0.4,0.2,1)),(1,(0.85,0.6,0.45,1))],2.5,.35)
P['Jupiter']=banded('Jupiter',4.2,(52,4,0),[(0,(0.55,0.42,0.3,1)),(0.3,(0.85,0.78,0.65,1)),(0.5,(0.7,0.5,0.35,1)),(0.7,(0.9,0.85,0.75,1)),(1,(0.6,0.45,0.32,1))],1.2,.9,16)
P['Saturn']=banded('Saturn',3.5,(70,-9,0),[(0,(0.55,0.42,0.22,1)),(0.5,(0.78,0.66,0.42,1)),(1,(0.62,0.48,0.26,1))],1.5,.6,12); rings(P['Saturn'],4.4,7.2)
P['Ura']=banded('Urà',2.2,(86,6,0),[(0,(0.55,0.8,0.85,1)),(1,(0.7,0.9,0.92,1))],1,.3,6)
P['Neptu']=banded('Neptú',2.1,(98,-6,0),[(0,(0.1,0.2,0.6,1)),(0.5,(0.25,0.4,0.85,1)),(1,(0.15,0.25,0.65,1))],1.5,.8,10)
for k,o in P.items(): o.rotation_euler=(math.radians(23 if k=='Terra' else 10),0,random.random()*6)
# òrbites (línies fines emissives) — només a escena 5
orb=[]
for k,o in P.items():
  if k=='Lluna': continue
  r=o.location.x; bpy.ops.mesh.primitive_torus_add(major_radius=r,minor_radius=.03,major_segments=256,minor_segments=6); t=bpy.context.object; t.name='orb_'+k
  om,ont,ob_,oout=newmat('orb'); ont.nodes.remove(ob_); e=ont.nodes.new('ShaderNodeEmission'); e.inputs['Color'].default_value=(0.4,0.7,1,1); e.inputs['Strength'].default_value=2; ont.links.new(e.outputs[0],oout.inputs['Surface']); t.data.materials.append(om); t.hide_render=True; orb.append(t)
# càmera
cam=bpy.data.cameras.new('c'); co=link(bpy.data.objects.new('cam',cam)); sc.camera=co; cam.lens=35; cam.clip_end=5000
def look(pos,tgt,lens=35):
  co.location=pos; d=mu.Vector(tgt)-mu.Vector(pos); co.rotation_euler=d.to_track_quat('-Z','Y').to_euler(); cam.lens=lens
# compositor: resplendor
ct=bpy.data.node_groups.new('comp','CompositorNodeTree'); sc.compositing_node_group=ct; rl=ct.nodes.new('CompositorNodeRLayers'); ct.interface.new_socket('Image',in_out='OUTPUT',socket_type='NodeSocketColor'); out=ct.nodes.new('NodeGroupOutput')
g=ct.nodes.new('CompositorNodeGlare'); g.inputs['Type'].default_value='Bloom'; g.inputs['Threshold'].default_value=1.5; g.inputs['Strength'].default_value=.35 if 'Strength' in g.inputs else None
ct.links.new(rl.outputs['Image'],g.inputs[0]); ct.links.new(g.outputs[0],out.inputs[0])
# ---------- escenes clau ----------
E=P['Terra'].location; L=P['Lluna'].location
def key(i):
  for t in orb: t.hide_render=True
  if i==1:  # alba des de l'òrbita: Terra gran, terminador
    look((E.x-2.4,E.y-2.4,1.0),(E.x-.1,E.y,.15),50)
  if i==2:  # Terra i Lluna
    look((E.x-1.0,E.y-6.5,2.2),(E.x+1.0,E.y+.8,.2),40)
  if i==3:  # òrbita de la Terra al voltant del Sol, eix inclinat
    look((E.x+6,-24,9),(E.x-12,0,0),35)
  if i==4:  # Saturn de prop
    S=P['Saturn'].location; look((S.x-7,S.y-11,5),(S.x+.5,S.y,0),40)
  if i==5:  # sistema solar sencer amb òrbites
    for t in orb: t.hide_render=False
    look((40,-150,70),(45,0,0),30)
if MODE=='keys':
  for i in range(F0 or 1,(F1 or 5)+1):
    key(i); sc.render.filepath=f'/tmp/bl/univ/k{i}.png'; t0=time.time(); bpy.ops.render.render(write_still=True); print('KEY',i,round(time.time()-t0,1),flush=True)

# ---------- animació ----------
FPS=5; DUR=[6,8,8,14,9]; NF=sum(DUR)*FPS
def ease(t): return t*t*(3-2*t)
E0=mu.Vector(P['Terra'].location); L0=mu.Vector(P['Lluna'].location); rE=E0.length; aE=math.atan2(E0.y,E0.x)
def pose(f):
  for t in orb: t.hide_render=True
  P['Terra'].location=E0; P['Lluna'].location=L0
  P['Terra'].rotation_euler=(math.radians(23),0,f*0.035)
  acc=0; i=0; t=0
  for k,d in enumerate(DUR):
    if f<acc+d*FPS: i=k; t=(f-acc)/(d*FPS); break
    acc+=d*FPS
  else: i=4; t=1
  e=ease(t)
  if i==0:
    a=-0.9+1.1*e; r=3.2-.5*e
    look((E0.x+math.cos(a+math.pi*1.25)*r,E0.y+math.sin(a+math.pi*1.25)*r,1.0-.4*e),(E0.x,E0.y,.1),50-6*e)
  if i==1:
    am=0.4+e*2.6; P['Lluna'].location=(E0.x+math.cos(am)*2.9,E0.y+math.sin(am)*2.9,.3)
    look((E0.x-1.0-1.5*e,E0.y-6.5-2.5*e,2.2+.8*e),(E0.x+.6,E0.y+.5,.2),40)
  if i==2:
    a=aE+e*1.25; P['Terra'].location=(math.cos(a)*rE,math.sin(a)*rE,0); P['Lluna'].location=(math.cos(a)*rE+2.4,math.sin(a)*rE+1.2,.3)
    Ex,Ey=P['Terra'].location.x,P['Terra'].location.y
    look((Ex+8-4*e,Ey-26,10+2*e),(Ex-12+6*e,Ey*.5,0),35)
  if i==3:
    x=11+e*92
    look((x,-17,5.5),(x+9,-2,0),38)
  if i==4:
    for o_ in orb: o_.hide_render=False
    look((60-20*e,-70-80*e,28+42*e),(45,0,0),30)
if MODE=='anim':
  for f in range(F0,F1+1):
    pose(f); sc.render.filepath=f'/tmp/bl/univ/a{f:04d}.png'; t0=time.time(); bpy.ops.render.render(write_still=True); print('FRAME',f,round(time.time()-t0,1),flush=True)
