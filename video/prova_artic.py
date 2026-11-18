import bpy, time, math
bpy.ops.wm.read_factory_settings(use_empty=True)
sc=bpy.context.scene; sc.render.engine='CYCLES'; sc.cycles.samples=48; sc.cycles.use_denoising=True; sc.cycles.device='CPU'
sc.render.resolution_x=960; sc.render.resolution_y=540; sc.render.resolution_percentage=100
# terrain
bpy.ops.mesh.primitive_grid_add(x_subdivisions=400,y_subdivisions=400,size=60)
t=bpy.context.object
m=t.modifiers.new('d','DISPLACE'); tex=bpy.data.textures.new('n','CLOUDS'); tex.noise_scale=6; tex.noise_depth=6; m.texture=tex; m.strength=9
m2=t.modifiers.new('d2','DISPLACE'); tex2=bpy.data.textures.new('n2','MUSGRAVE') if hasattr(bpy.types,'MusgraveTexture') else bpy.data.textures.new('n2','CLOUDS'); tex2.noise_scale=1.2; m2.texture=tex2; m2.strength=1.5
bpy.ops.object.shade_smooth()
mat=bpy.data.materials.new('rock'); mat.use_nodes=True; nt=mat.node_tree; bsdf=nt.nodes['Principled BSDF']
geo=nt.nodes.new('ShaderNodeNewGeometry'); sep=nt.nodes.new('ShaderNodeSeparateXYZ'); ramp=nt.nodes.new('ShaderNodeValToRGB')
nt.links.new(geo.outputs['Position'],sep.inputs[0]); nt.links.new(sep.outputs['Z'],ramp.inputs['Fac'])
ramp.color_ramp.elements[0].position=0.0; ramp.color_ramp.elements[0].color=(0.08,0.16,0.05,1); ramp.color_ramp.elements[1].position=0.08; ramp.color_ramp.elements[1].color=(0.35,0.3,0.22,1)
e=ramp.color_ramp.elements.new(0.16); e.color=(0.9,0.9,0.92,1)
nt.links.new(ramp.outputs['Color'],bsdf.inputs['Base Color']); bsdf.inputs['Roughness'].default_value=.9
t.data.materials.append(mat)
# sea
bpy.ops.mesh.primitive_plane_add(size=400,location=(0,0,2.5)); sea=bpy.context.object
sm=bpy.data.materials.new('sea'); sm.use_nodes=True; b=sm.node_tree.nodes['Principled BSDF']; b.inputs['Base Color'].default_value=(0.02,0.12,0.2,1); b.inputs['Roughness'].default_value=.05
nz=sm.node_tree.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value=40; bump=sm.node_tree.nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value=.15
sm.node_tree.links.new(nz.outputs['Fac'],bump.inputs['Height']); sm.node_tree.links.new(bump.outputs['Normal'],b.inputs['Normal']); sea.data.materials.append(sm)
# sky
w=bpy.data.worlds.new('w'); sc.world=w; w.use_nodes=True; wn=w.node_tree; sky=wn.nodes.new('ShaderNodeTexSky'); sky.sky_type='MULTIPLE_SCATTERING'; sky.sun_elevation=math.radians(8); sky.sun_rotation=math.radians(200); sky.sun_intensity=.6; sky.altitude=50
wn.links.new(sky.outputs['Color'],wn.nodes['Background'].inputs['Color'])
# camera
cam=bpy.data.cameras.new('c'); co=bpy.data.objects.new('cam',cam); sc.collection.objects.link(co); sc.camera=co
co.location=(-20,-28,9); co.rotation_euler=(math.radians(80),0,math.radians(-35)); cam.lens=28
sc.view_settings.view_transform='AgX' if 'AgX' in [i.identifier for i in sc.view_settings.bl_rna.properties['view_transform'].enum_items] else 'Filmic'
sc.render.filepath='/tmp/bl/t1.png'; t0=time.time(); bpy.ops.render.render(write_still=True); print('render s',round(time.time()-t0,1))
