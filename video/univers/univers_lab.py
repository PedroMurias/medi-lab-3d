"""
Medi·Lab 3D · Vídeo «Viatge per l'univers» (Unitat 4: La Terra, el nostre planeta)

Escena 100 % generada per codi amb Blender (Cycles). Fa servir les mateixes dades
i textures que el laboratori web labs/univers.html: planetes (radi, distància i
període de la taula PL del lab), textures reals de la Terra i la Lluna, i els
textos i preguntes de cada apartat.

Capítols (segueixen els apartats del lab):
  1 bigbang     El big bang
  2 galaxia     La Via Làctia (braç d'Orió)
  3 sistema     El sistema solar (travelling pels planetes)
  4 rotacio     La rotació: el dia i la nit
  5 translacio  La translació: l'any i les estacions
  6 lluna       La Lluna i les fases
  7 zones      Les zones climàtiques
  8 final       Tot el sistema solar → «Explora-ho tu»

Ús (amb el mòdul bpy de pip o amb `blender -b -P univers_lab.py -- ...`):
  python univers_lab.py -- --cap all --w 1920 --spp 64 --gpu          # tot, 1080p, gràfica
  python univers_lab.py -- --cap 3 --frames 0:384:8 --w 640 --spp 12   # proves ràpides
  python univers_lab.py -- --meta                                        # només capitols.json
Després: python muntar.py   (ajunta els capítols, fosa, subtítols)
"""
import bpy, math, sys, os, time, json, random, argparse
import mathutils as mu
from bpy_extras.object_utils import world_to_camera_view

HERE = os.path.dirname(os.path.abspath(__file__))
TEX = os.path.join(HERE, 'textures')

# ------------------------------------------------------------------ arguments
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument('--cap', default='all', help="número de capítol (1-8), llista '1,3,5' o 'all'")
ap.add_argument('--frames', default='', help='rang dins del capítol: ini:fi[:pas]')
ap.add_argument('--w', type=int, default=1280, help='amplada en píxels (16:9)')
ap.add_argument('--spp', type=int, default=32, help='mostres per píxel (Cycles)')
ap.add_argument('--fps', type=int, default=24)
ap.add_argument('--gpu', action='store_true', help='renderitza amb la gràfica (OptiX/CUDA)')
ap.add_argument('--out', default=os.path.join(HERE, 'render'))
ap.add_argument('--meta', action='store_true', help='només escriu capitols.json')
A = ap.parse_args(argv)

CAPS = [  # id, durada (s)
    ('bigbang', 6), ('galaxia', 10), ('sistema', 18), ('rotacio', 8),
    ('translacio', 10), ('lluna', 9), ('zones', 7), ('final', 7)]

# ------------------------------------------------------------------ dades del lab (taula PL de univers.html)
PL = [  # id, nom, radi (Terra=1), distància (unitats del lab), període (dies)
    ('mercuri', 'Mercuri', .38, 7, 88), ('venus', 'Venus', .95, 10, 225),
    ('terra', 'La Terra', 1, 13.5, 365), ('mart', 'Mart', .53, 17, 687),
    ('jupiter', 'Júpiter', 3.6, 28, 4333), ('saturn', 'Saturn', 3.0, 39, 10759),
    ('ura', 'Urà', 1.9, 49, 30687), ('neptu', 'Neptú', 1.85, 57, 60190),
    ('pluto', 'Plutó', .25, 64, 90560)]
SUN_R = 4.2
TILT = math.radians(23.44)
BCN = (41.39, 2.17)  # Barcelona (lat, lon)

# ------------------------------------------------------------------ escena base
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = 'CYCLES'
sc.cycles.samples = A.spp
sc.cycles.use_denoising = True
sc.cycles.max_bounces = 4
sc.cycles.caustics_reflective = sc.cycles.caustics_refractive = False
sc.render.resolution_x = A.w
sc.render.resolution_y = int(A.w * 9 / 16)
sc.render.fps = A.fps
sc.view_settings.view_transform = 'AgX'
sc.view_settings.look = 'AgX - Medium High Contrast'
if A.gpu:
    prefs = bpy.context.preferences.addons['cycles'].preferences
    for kind in ('OPTIX', 'CUDA', 'HIP', 'ONEAPI'):
        try:
            prefs.compute_device_type = kind
            prefs.get_devices()
            devs = [d for d in prefs.devices if d.type == kind]
            if devs:
                for d in prefs.devices: d.use = d.type == kind
                sc.cycles.device = 'GPU'
                print('GPU:', kind, [d.name for d in devs])
                break
        except Exception:
            pass
    else:
        print('Cap GPU trobada: es renderitza amb CPU')

COLL = {}
def coll(name):
    c = bpy.data.collections.new(name); sc.collection.children.link(c); COLL[name] = c; return c
def put(o, c):
    for u in list(o.users_collection): u.objects.unlink(o)
    COLL[c].objects.link(o); return o
for n in ('bb', 'gal', 'ss', 'ast', 'orb', 'terra', 'lluna', 'zones', 'transl'):
    coll(n)

# ------------------------------------------------------------------ materials
def newmat(name):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; return m, nt, nt.nodes['Principled BSDF'], nt.nodes['Material Output']
def emis(name, col, strength):
    m, nt, b, out = newmat(name); nt.nodes.remove(b)
    e = nt.nodes.new('ShaderNodeEmission'); e.inputs['Color'].default_value = (*col, 1); e.inputs['Strength'].default_value = strength
    nt.links.new(e.outputs[0], out.inputs['Surface']); return m
def noise(nt, scale, detail=6, rough=.55, dist=0.0):
    n = nt.nodes.new('ShaderNodeTexNoise'); n.inputs['Scale'].default_value = scale
    n.inputs['Detail'].default_value = detail; n.inputs['Roughness'].default_value = rough; n.inputs['Distortion'].default_value = dist; return n
def ramp(nt, stops):
    r = nt.nodes.new('ShaderNodeValToRGB'); cr = r.color_ramp
    cr.elements[0].position, cr.elements[0].color = stops[0][0], stops[0][1]
    cr.elements[1].position, cr.elements[1].color = stops[-1][0], stops[-1][1]
    for p, c in stops[1:-1]:
        e = cr.elements.new(p); e.color = c
    return r
def img(nt, fn, non_color=False):
    t = nt.nodes.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(os.path.join(TEX, fn))
    if non_color: t.image.colorspace_settings.name = 'Non-Color'
    return t
def sphere(name, r, seg=96, c=None):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, segments=seg, ring_count=seg // 2)
    o = bpy.context.object; o.name = name; bpy.ops.object.shade_smooth()
    if c: put(o, c)
    return o

def mat_terra():
    m, nt, b, out = newmat('terra')
    tc = img(nt, 'earth.jpg'); tn = img(nt, 'earthN.jpg', True); tr = img(nt, 'earthR.jpg', True)
    nt.links.new(tc.outputs['Color'], b.inputs['Base Color'])
    nm = nt.nodes.new('ShaderNodeNormalMap'); nm.inputs['Strength'].default_value = .6
    nt.links.new(tn.outputs['Color'], nm.inputs['Color']); nt.links.new(nm.outputs[0], b.inputs['Normal'])
    rr = nt.nodes.new('ShaderNodeMapRange'); rr.inputs['To Min'].default_value = .28; rr.inputs['To Max'].default_value = .92
    nt.links.new(tr.outputs['Color'], rr.inputs['Value']); nt.links.new(rr.outputs[0], b.inputs['Roughness'])
    return m
def mat_nuvols():
    m, nt, b, out = newmat('nuvols')
    tc = nt.nodes.new('ShaderNodeTexCoord'); n = noise(nt, 2.6, 12, .62, 1.4); nt.links.new(tc.outputs['Object'], n.inputs['Vector'])
    r = ramp(nt, [(0, (0, 0, 0, 1)), (.56, (0, 0, 0, 1)), (.72, (.75, .75, .75, 1))]); nt.links.new(n.outputs['Fac'], r.inputs['Fac'])
    b.inputs['Base Color'].default_value = (1, 1, 1, 1); b.inputs['Roughness'].default_value = 1
    nt.links.new(r.outputs['Color'], b.inputs['Alpha']); return m
def mat_atm():
    m, nt, b, out = newmat('atm'); nt.nodes.remove(b)
    em = nt.nodes.new('ShaderNodeEmission'); em.inputs['Color'].default_value = (.32, .58, 1, 1); em.inputs['Strength'].default_value = 1.6
    lw = nt.nodes.new('ShaderNodeLayerWeight'); lw.inputs['Blend'].default_value = .1
    pw = nt.nodes.new('ShaderNodeMath'); pw.operation = 'POWER'; pw.inputs[1].default_value = 5
    tr = nt.nodes.new('ShaderNodeBsdfTransparent'); mx = nt.nodes.new('ShaderNodeMixShader')
    nt.links.new(lw.outputs['Facing'], pw.inputs[0]); nt.links.new(pw.outputs[0], mx.inputs[0])
    nt.links.new(tr.outputs[0], mx.inputs[1]); nt.links.new(em.outputs[0], mx.inputs[2]); nt.links.new(mx.outputs[0], out.inputs['Surface'])
    m.use_backface_culling = True; return m
def mat_lluna():
    m, nt, b, out = newmat('lluna'); t = img(nt, 'moon.jpg')
    nt.links.new(t.outputs['Color'], b.inputs['Base Color']); b.inputs['Roughness'].default_value = .97
    bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = .35
    nt.links.new(t.outputs['Color'], bp.inputs['Height']); nt.links.new(bp.outputs['Normal'], b.inputs['Normal']); return m
def mat_bandes(name, cols, scale=1.5, warp=.8, bands=12, spot=None):
    m, nt, b, out = newmat(name); tc = nt.nodes.new('ShaderNodeTexCoord')
    sep = nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(tc.outputs['Generated'], sep.inputs[0])
    n = noise(nt, scale, 8, .6, warp); nt.links.new(tc.outputs['Object'], n.inputs['Vector'])
    ma = nt.nodes.new('ShaderNodeMath'); ma.operation = 'MULTIPLY_ADD'; ma.inputs[1].default_value = bands
    nt.links.new(sep.outputs['Z'], ma.inputs[0]); nt.links.new(n.outputs['Fac'], ma.inputs[2])
    s = nt.nodes.new('ShaderNodeMath'); s.operation = 'SINE'; nt.links.new(ma.outputs[0], s.inputs[0])
    s2 = nt.nodes.new('ShaderNodeMath'); s2.operation = 'MULTIPLY_ADD'; s2.inputs[1].default_value = .5; s2.inputs[2].default_value = .5
    nt.links.new(s.outputs[0], s2.inputs[0]); r = ramp(nt, cols); nt.links.new(s2.outputs[0], r.inputs['Fac'])
    col = r.outputs['Color']
    if spot:  # taca (p. ex. la Gran Taca Vermella de Júpiter): punt en coordenades d'objecte normalitzades
        d = nt.nodes.new('ShaderNodeVectorMath'); d.operation = 'DISTANCE'; d.inputs[1].default_value = spot[0]
        sc_ = nt.nodes.new('ShaderNodeVectorMath'); sc_.operation = 'MULTIPLY'; sc_.inputs[1].default_value = (1, 1, 2.2)
        nt.links.new(tc.outputs['Generated'], sc_.inputs[0]); nt.links.new(sc_.outputs[0], d.inputs[0])
        mr = nt.nodes.new('ShaderNodeMapRange'); mr.inputs['From Min'].default_value = spot[1]; mr.inputs['From Max'].default_value = spot[1] * .55
        nt.links.new(d.outputs['Value'], mr.inputs['Value'])
        mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.inputs[7].default_value = (*spot[2], 1)
        nt.links.new(mr.outputs[0], mx.inputs[0]); nt.links.new(col, mx.inputs[6]); col = mx.outputs[2]
    nt.links.new(col, b.inputs['Base Color']); b.inputs['Roughness'].default_value = .85; return m
def mat_roca(name, cols, scale=3, bump=.35):
    m, nt, b, out = newmat(name); tc = nt.nodes.new('ShaderNodeTexCoord')
    n = noise(nt, scale, 10, .62, .3); nt.links.new(tc.outputs['Object'], n.inputs['Vector'])
    r = ramp(nt, cols); nt.links.new(n.outputs['Fac'], r.inputs['Fac']); nt.links.new(r.outputs['Color'], b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = .95
    v = nt.nodes.new('ShaderNodeTexVoronoi'); v.inputs['Scale'].default_value = scale * 4; nt.links.new(tc.outputs['Object'], v.inputs['Vector'])
    bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = bump
    nt.links.new(v.outputs['Distance'], bp.inputs['Height']); nt.links.new(bp.outputs['Normal'], b.inputs['Normal']); return m
def mat_punts(name, strength):  # emissiu amb color per punt (atribut 'col')
    m, nt, b, out = newmat(name); nt.nodes.remove(b)
    at = nt.nodes.new('ShaderNodeAttribute'); at.attribute_name = 'col'
    e = nt.nodes.new('ShaderNodeEmission'); e.inputs['Strength'].default_value = strength
    nt.links.new(at.outputs['Color'], e.inputs['Color']); nt.links.new(e.outputs[0], out.inputs['Surface']); return m

# ------------------------------------------------------------------ núvols de punts (Geometry Nodes)
def punts(name, coords, cols, rads, mat, c):
    me = bpy.data.meshes.new(name); me.from_pydata(coords, [], [])
    a = me.attributes.new('col', 'FLOAT_COLOR', 'POINT'); a.data.foreach_set('color', [v for cc in cols for v in (*cc, 1)])
    r = me.attributes.new('rad', 'FLOAT', 'POINT'); r.data.foreach_set('value', rads)
    o = bpy.data.objects.new(name, me); COLL[c].objects.link(o)
    ng = bpy.data.node_groups.new(name, 'GeometryNodeTree')
    ng.interface.new_socket('Geometry', in_out='INPUT', socket_type='NodeSocketGeometry')
    ng.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')
    gi = ng.nodes.new('NodeGroupInput'); go = ng.nodes.new('NodeGroupOutput')
    mp = ng.nodes.new('GeometryNodeMeshToPoints'); na = ng.nodes.new('GeometryNodeInputNamedAttribute'); na.data_type = 'FLOAT'; na.inputs['Name'].default_value = 'rad'
    sm = ng.nodes.new('GeometryNodeSetMaterial'); sm.inputs['Material'].default_value = mat
    ng.links.new(gi.outputs[0], mp.inputs['Mesh']); ng.links.new(na.outputs['Attribute'], mp.inputs['Radius'])
    ng.links.new(mp.outputs['Points'], sm.inputs['Geometry']); ng.links.new(sm.outputs[0], go.inputs[0])
    o.modifiers.new('punts', 'NODES').node_group = ng
    return o

# ------------------------------------------------------------------ món: estrelles de fons
w = bpy.data.worlds.new('cel'); sc.world = w; w.use_nodes = True; wn = w.node_tree; bg = wn.nodes['Background']
tcw = wn.nodes.new('ShaderNodeTexCoord')
st = wn.nodes.new('ShaderNodeTexVoronoi'); st.inputs['Scale'].default_value = 420; wn.links.new(tcw.outputs['Generated'], st.inputs['Vector'])
sr = wn.nodes.new('ShaderNodeMapRange'); sr.inputs['From Min'].default_value = .045; sr.inputs['From Max'].default_value = .0; sr.inputs['To Max'].default_value = 1.6
wn.links.new(st.outputs['Distance'], sr.inputs['Value'])
pw = wn.nodes.new('ShaderNodeMath'); pw.operation = 'POWER'; pw.inputs[1].default_value = 3; wn.links.new(sr.outputs[0], pw.inputs[0])
neb = wn.nodes.new('ShaderNodeTexNoise'); neb.inputs['Scale'].default_value = 2.2; neb.inputs['Detail'].default_value = 8; wn.links.new(tcw.outputs['Generated'], neb.inputs['Vector'])
nr = wn.nodes.new('ShaderNodeValToRGB'); nr.color_ramp.elements[0].position = .5; nr.color_ramp.elements[0].color = (.0015, .002, .005, 1)
nr.color_ramp.elements[1].position = .78; nr.color_ramp.elements[1].color = (.02, .015, .04, 1); wn.links.new(neb.outputs['Fac'], nr.inputs['Fac'])
ad = wn.nodes.new('ShaderNodeMix'); ad.data_type = 'RGBA'; ad.blend_type = 'ADD'; ad.inputs[0].default_value = 1
wn.links.new(nr.outputs['Color'], ad.inputs[6]); wn.links.new(pw.outputs[0], ad.inputs[7]); wn.links.new(ad.outputs[2], bg.inputs['Color'])

# ------------------------------------------------------------------ 1 · big bang
R = random.Random(7)
BBN = 30000
BBdir, BBcol, BBrad = [], [], []
for i in range(BBN):
    v = mu.Vector((R.gauss(0, 1), R.gauss(0, 1), R.gauss(0, 1))).normalized() * (R.random() ** .45)
    BBdir.append(v)
    t = R.random(); BBcol.append((1, .55 + .45 * t, .25 + .75 * t * t) if R.random() < .7 else (.55, .7, 1))
    BBrad.append(.004 + .012 * R.random() ** 3)
BB = punts('bigbang', [(0, 0, 0)] * BBN, BBcol, BBrad, mat_punts('bb', 9), 'bb')
flash = sphere('flaix', 1, 32, 'bb'); flash.data.materials.append(emis('flaix', (1, .92, .75), 60))
flash.visible_shadow = False

# ------------------------------------------------------------------ 2 · Via Làctia (galàxia espiral de 4 braços, com al lab)
GN = 140000
gco, gcol, grad = [], [], []
for i in range(GN):
    if R.random() < .22:  # bulb central
        r = abs(R.gauss(0, 3.2)); a = R.random() * 6.283; z = R.gauss(0, .9) * max(.2, 1 - r / 6)
        c = (1, .82 + .1 * R.random(), .55)
    else:
        arm = R.randrange(4); r = 2.5 + (R.random() ** .8) * 28
        a = arm * math.pi / 2 + math.log(r) * 2.2 + R.gauss(0, .1 + 1.3 / r)
        z = R.gauss(0, .25)
        k = R.random()
        c = (.62, .76, 1) if k < .55 else (1, .95, .85) if k < .9 else (1, .45, .65)
    gco.append((math.cos(a) * r, math.sin(a) * r, z)); gcol.append(c); grad.append(.012 + .03 * R.random() ** 5)
GAL = punts('galaxia', gco, gcol, grad, mat_punts('gal', 5), 'gal')
# halo del nucli
halo = sphere('halo', 3.4, 48, 'gal'); halo.scale = (1, 1, .4)
hm, hnt, hb, hout = newmat('halo'); hnt.nodes.remove(hb)
he = hnt.nodes.new('ShaderNodeEmission'); he.inputs['Color'].default_value = (1, .78, .45, 1); he.inputs['Strength'].default_value = .6
hlw = hnt.nodes.new('ShaderNodeLayerWeight'); hlw.inputs['Blend'].default_value = .5
hinv = hnt.nodes.new('ShaderNodeMath'); hinv.operation = 'SUBTRACT'; hinv.inputs[0].default_value = 1
htr = hnt.nodes.new('ShaderNodeBsdfTransparent'); hmx = hnt.nodes.new('ShaderNodeMixShader')
hnt.links.new(hlw.outputs['Facing'], hinv.inputs[1]); hnt.links.new(hinv.outputs[0], hmx.inputs[0])
hnt.links.new(htr.outputs[0], hmx.inputs[1]); hnt.links.new(he.outputs[0], hmx.inputs[2]); hnt.links.new(hmx.outputs[0], hout.inputs['Surface'])
halo.data.materials.append(hm); halo.visible_shadow = False
SM_A = math.pi / 2 + math.log(20) * 2.2 + .08  # posició del sistema solar (igual que al lab)
SOLAR = mu.Vector((math.cos(SM_A) * 20, math.sin(SM_A) * 20, 0))
marca = sphere('marca_sistema_solar', .25, 24, 'gal'); marca.location = SOLAR; marca.data.materials.append(emis('cian', (0, .9, 1), 25))

# ------------------------------------------------------------------ 3 · sistema solar
sol = sphere('Sol', SUN_R, 64, 'ss')
sm_, snt, sb, sout = newmat('sol'); snt.nodes.remove(sb)
se = snt.nodes.new('ShaderNodeEmission'); sn = noise(snt, 3, 6, .6, .5); stc = snt.nodes.new('ShaderNodeTexCoord'); snt.links.new(stc.outputs['Object'], sn.inputs['Vector'])
srp = ramp(snt, [(0, (1, .3, .02, 1)), (.5, (1, .58, .1, 1)), (1, (1, .9, .55, 1))]); snt.links.new(sn.outputs['Fac'], srp.inputs['Fac'])
snt.links.new(srp.outputs['Color'], se.inputs['Color']); se.inputs['Strength'].default_value = 12; snt.links.new(se.outputs[0], sout.inputs['Surface'])
sol.data.materials.append(sm_)
for attr in ('visible_diffuse', 'visible_glossy', 'visible_transmission', 'visible_shadow'): setattr(sol, attr, False)
llum = bpy.data.lights.new('llum_sol', 'POINT'); llum.shadow_soft_size = SUN_R * .6; llum.color = (1, .97, .92)
llum.use_nodes = True  # sense atenuació amb la distància: tots els planetes ben il·luminats (com al lab)
lnt = llum.node_tree; lfo = lnt.nodes.new('ShaderNodeLightFalloff'); lfo.inputs['Strength'].default_value = 12
lnt.links.new(lfo.outputs['Constant'], lnt.nodes['Emission'].inputs['Strength'])
lo = bpy.data.objects.new('llum_sol', llum); sc.collection.objects.link(lo)

M_TERRA = mat_terra()
P = {}
for pid, nom, r, d, per in PL:
    if pid == 'terra':
        o = sphere('Terra', 1, 128, 'terra'); o.data.materials.append(M_TERRA)
        nuv = sphere('Nuvols', 1.012, 96); nuv.data.materials.append(mat_nuvols()); nuv.parent = o; put(nuv, 'terra')
        at = sphere('Atmosfera', 1.035, 96); at.data.materials.append(mat_atm()); at.parent = o; at.visible_shadow = False; put(at, 'terra')
    else:
        o = sphere(nom, r, 96, 'ss')
        mats = {
            'mercuri': lambda: mat_roca('mercuri', [(0, (.22, .21, .2, 1)), (1, (.55, .52, .48, 1))], 4, .45),
            'venus': lambda: mat_bandes('venus', [(0, (.72, .58, .34, 1)), (.5, (.92, .82, .6, 1)), (1, (.8, .68, .45, 1))], 2.5, 2.4, 5),
            'mart': lambda: mat_roca('mart', [(0, (.42, .16, .07, 1)), (.6, (.74, .36, .17, 1)), (1, (.86, .6, .44, 1))], 2.5, .4),
            'jupiter': lambda: mat_bandes('jupiter', [(0, (.5, .37, .26, 1)), (.3, (.86, .78, .64, 1)), (.5, (.68, .48, .33, 1)), (.7, (.92, .86, .76, 1)), (1, (.58, .43, .3, 1))], 1.2, .9, 16, spot=((.72, .3, .62), .09, (.7, .25, .12))),
            'saturn': lambda: mat_bandes('saturn', [(0, (.62, .5, .3, 1)), (.5, (.82, .72, .5, 1)), (1, (.7, .58, .36, 1))], 1.5, .6, 12),
            'ura': lambda: mat_bandes('ura', [(0, (.55, .8, .84, 1)), (1, (.68, .88, .9, 1))], 1, .3, 5),
            'neptu': lambda: mat_bandes('neptu', [(0, (.1, .2, .6, 1)), (.5, (.24, .4, .85, 1)), (1, (.14, .24, .64, 1))], 1.5, .8, 9),
            'pluto': lambda: mat_roca('pluto', [(0, (.45, .38, .32, 1)), (1, (.85, .78, .7, 1))], 3, .3)}
        o.data.materials.append(mats[pid]())
    o.rotation_euler = (math.radians({'ura': 98, 'terra': 23.44}.get(pid, 8)), 0, R.random() * 6.28)
    P[pid] = o
# anells de Saturn
bpy.ops.mesh.primitive_circle_add(vertices=256, radius=6.4, fill_type='NGON'); an = bpy.context.object; an.name = 'Anells'
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.inset(thickness=6.4 - 3.9, depth=0)
bpy.ops.mesh.delete(type='FACE'); bpy.ops.object.mode_set(mode='OBJECT')
am, ant, ab, aout = newmat('anells'); atc = ant.nodes.new('ShaderNodeTexCoord'); aln = ant.nodes.new('ShaderNodeVectorMath'); aln.operation = 'LENGTH'
ant.links.new(atc.outputs['Object'], aln.inputs[0]); amr = ant.nodes.new('ShaderNodeMapRange'); amr.inputs['From Min'].default_value = 3.9; amr.inputs['From Max'].default_value = 6.4
ant.links.new(aln.outputs['Value'], amr.inputs['Value']); acb = ant.nodes.new('ShaderNodeCombineXYZ'); ant.links.new(amr.outputs[0], acb.inputs[0])
ann = noise(ant, 55, 2, .5); ant.links.new(acb.outputs[0], ann.inputs['Vector'])
arp = ramp(ant, [(0, (0, 0, 0, 1)), (.3, (.78, .7, .56, 1)), (.55, (.25, .22, .18, 1)), (.6, (.88, .82, .7, 1)), (1, (.32, .29, .24, 1))])
ant.links.new(ann.outputs['Fac'], arp.inputs['Fac']); ant.links.new(arp.outputs['Color'], ab.inputs['Base Color']); ab.inputs['Roughness'].default_value = .9
ant.links.new(ann.outputs['Fac'], ab.inputs['Alpha']); an.data.materials.append(am)
an.parent = P['saturn']; an.rotation_euler = (0, 0, 0); put(an, 'ss')
P['saturn'].rotation_euler = (math.radians(27), 0, 0)
# cinturó d'asteroides (entre Mart i Júpiter)
aco, acol, arad = [], [], []
for i in range(5000):
    rr = R.uniform(20.5, 23.5); a = R.random() * 6.283
    aco.append((math.cos(a) * rr, math.sin(a) * rr, R.gauss(0, .25))); g = R.uniform(.35, .6); acol.append((g * .6, g * .57, g * .52)); arad.append(.012 + .04 * R.random() ** 3)
mast, mnt, mb, mout = newmat('asteroides'); mat_ = mnt.nodes.new('ShaderNodeAttribute'); mat_.attribute_name = 'col'; mnt.links.new(mat_.outputs['Color'], mb.inputs['Base Color'])
AST = punts('asteroides', aco, acol, arad, mast, 'ast')
# Lluna
LL = sphere('Lluna', .27, 96, 'lluna'); LL.data.materials.append(mat_lluna())
# òrbites
for pid, nom, r, d, per in PL:
    bpy.ops.mesh.primitive_torus_add(major_radius=d, minor_radius=.045, major_segments=384, minor_segments=6)
    t = bpy.context.object; t.name = 'orbita_' + pid; t.data.materials.append(emis('orb_' + pid, (.35, .7, 1) if pid != 'terra' else (.3, 1, .7), 3)); put(t, 'orb')
    t.visible_shadow = False

# ------------------------------------------------------------------ 5 · translació: eix i òrbita
bpy.ops.mesh.primitive_cylinder_add(radius=.025, depth=3.2); eix = bpy.context.object; eix.name = 'eix'
eix.data.materials.append(emis('eix', (1, 1, 1), 4)); eix.visible_shadow = False; put(eix, 'transl')
bpy.ops.mesh.primitive_torus_add(major_radius=16, minor_radius=.06, major_segments=384, minor_segments=8); orbT = bpy.context.object; orbT.name = 'orbita_transl'
orbT.data.materials.append(emis('orbT', (.4, .75, 1), 2.5)); orbT.visible_shadow = False; put(orbT, 'transl')
FITES = []
for k in range(4):  # 21 març, 21 juny, 23 setembre, 21 desembre
    f = sphere('fita%d' % k, .22, 24, 'transl'); f.data.materials.append(emis('fita%d' % k, (1, .85, .3), 12)); FITES.append(f)

# ------------------------------------------------------------------ 7 · zones climàtiques: paral·lels
ZLAT = [(0, (1, .35, .2)), (23.44, (1, .78, .25)), (-23.44, (1, .78, .25)), (66.56, (.45, .8, 1)), (-66.56, (.45, .8, 1))]
ZONES = []
for lat, colr in ZLAT:
    rr = 1.045 * math.cos(math.radians(lat))
    bpy.ops.mesh.primitive_torus_add(major_radius=rr, minor_radius=.008, major_segments=256, minor_segments=6, location=(0, 0, 1.045 * math.sin(math.radians(lat))))
    z = bpy.context.object; z.name = 'paral·lel_%g' % lat; z.data.materials.append(emis('par%g' % lat, colr, 8)); z.visible_shadow = False
    z.parent = P['terra']; put(z, 'zones'); ZONES.append(z)
# franges tènues de color: càlida (vermella), temperades (verdes), fredes (blaves)
fr = sphere('franges', 1.02, 128, 'zones'); fr.parent = P['terra']
fm, fnt, fb, fout = newmat('franges'); fnt.nodes.remove(fb)
ftc = fnt.nodes.new('ShaderNodeTexCoord'); fsep = fnt.nodes.new('ShaderNodeSeparateXYZ'); fnt.links.new(ftc.outputs['Object'], fsep.inputs[0])
fab = fnt.nodes.new('ShaderNodeMath'); fab.operation = 'ABSOLUTE'; fnt.links.new(fsep.outputs['Z'], fab.inputs[0])
s23, s66 = math.sin(math.radians(23.44)) * 1.02, math.sin(math.radians(66.56)) * 1.02
frp = ramp(fnt, [(0, (1, .25, .1, 1)), (s23 - .002, (1, .25, .1, 1)), (s23 + .002, (.2, 1, .35, 1)), (s66 - .002, (.2, 1, .35, 1)), (s66 + .002, (.35, .65, 1, 1)), (1, (.35, .65, 1, 1))])
frp.color_ramp.interpolation = 'CONSTANT'; fnt.links.new(fab.outputs[0], frp.inputs['Fac'])
fem = fnt.nodes.new('ShaderNodeEmission'); fem.inputs['Strength'].default_value = .9; fnt.links.new(frp.outputs['Color'], fem.inputs['Color'])
ftr = fnt.nodes.new('ShaderNodeBsdfTransparent'); fmx = fnt.nodes.new('ShaderNodeAddShader')
fnt.links.new(ftr.outputs[0], fmx.inputs[0]); fnt.links.new(fem.outputs[0], fmx.inputs[1]); fnt.links.new(fmx.outputs[0], fout.inputs['Surface'])
fem.inputs['Strength'].default_value = 0
fr.data.materials.append(fm); fr.visible_shadow = False
FR_MIX = fem.inputs['Strength']

# ------------------------------------------------------------------ Barcelona: punt sobre la Terra (busquem la cara amb la UV més propera)
def uv_point(obj, lat, lon):
    me = obj.data; uvl = me.uv_layers.active.data
    u0, v0 = (lon + 180) / 360, (lat + 90) / 180
    best, bp = 9, None
    for p in me.polygons:
        u = sum(uvl[i].uv.x for i in p.loop_indices) / p.loop_total; v = sum(uvl[i].uv.y for i in p.loop_indices) / p.loop_total
        dd = (u - u0) ** 2 + (v - v0) ** 2
        if dd < best: best, bp = dd, p.center.copy()
    return bp
bcn = sphere('Barcelona', .028, 16); bcn.location = uv_point(P['terra'], *BCN).normalized() * 1.016
bcn.data.materials.append(emis('bcn', (1, .2, .35), 30)); bcn.parent = P['terra']; put(bcn, 'terra'); bcn.visible_shadow = False

# ------------------------------------------------------------------ càmera i compositor
cam = bpy.data.cameras.new('cam'); co = bpy.data.objects.new('cam', cam); sc.collection.objects.link(co); sc.camera = co
cam.clip_start = .01; cam.clip_end = 5000
def look(pos, tgt, lens=35):
    co.location = pos; d = mu.Vector(tgt) - mu.Vector(pos)
    co.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler(); cam.lens = lens
ct = bpy.data.node_groups.new('comp', 'CompositorNodeTree'); sc.compositing_node_group = ct
rl = ct.nodes.new('CompositorNodeRLayers'); ct.interface.new_socket('Image', in_out='OUTPUT', socket_type='NodeSocketColor'); cout = ct.nodes.new('NodeGroupOutput')
gl = ct.nodes.new('CompositorNodeGlare'); gl.inputs['Type'].default_value = 'Bloom'; gl.inputs['Threshold'].default_value = 1.2
if 'Strength' in gl.inputs: gl.inputs['Strength'].default_value = .4
ct.links.new(rl.outputs['Image'], gl.inputs[0]); ct.links.new(gl.outputs[0], cout.inputs[0])

# ------------------------------------------------------------------ posicions per capítol
def ease(t): return t * t * (3 - 2 * t)
def lerp(a, b, t): return a + (b - a) * t
def inv_ease(y):
    lo_, hi_ = 0., 1.
    for _ in range(40):
        mid = (lo_ + hi_) / 2
        if ease(mid) < y: lo_ = mid
        else: hi_ = mid
    return lo_
def vlerp(a, b, t): return mu.Vector(a).lerp(mu.Vector(b), t)
YOFF = dict(mercuri=1.5, venus=-1.8, terra=2.0, mart=-1.2, jupiter=4.5, saturn=6.0, ura=-1.0, neptu=3.0, pluto=-.5)  # travelling
ANG = {pid: math.asin(YOFF[pid] / d) for pid, nom, r, d, per in PL}
def orbit_pos(pid, ang):
    d = [x for x in PL if x[0] == pid][0][3]; return mu.Vector((math.cos(ang) * d, math.sin(ang) * d, 0))
def show(*names):
    for n, c in COLL.items(): c.hide_render = n not in names
    lo.hide_render = not any(n in names for n in ('ss', 'terra', 'lluna', 'transl'))

def pose(cap, t, T):
    """cap: id del capítol · t: 0..1 dins del capítol · T: segons dins del capítol"""
    e = ease(t)
    sc.cycles.use_denoising = cap not in ('bigbang', 'galaxia')
    sol.hide_render = cap == 'lluna'
    P['terra'].scale = (1, 1, 1); eix.parent = None; LL.location = (0, 0, -500); FR_MIX.default_value = 0
    for pid, *_ in PL:
        P[pid].hide_render = False; P[pid].location = orbit_pos(pid, ANG[pid])
    if cap in ('rotacio', 'lluna', 'zones', 'translacio'):  # només la Terra (i la Lluna): la resta taparia la llum
        for pid, *_ in PL:
            if pid != 'terra': P[pid].hide_render = True
    an.hide_render = P['saturn'].hide_render
    if cap == 'bigbang':
        show('bb')
        rr = 14 * (1 - (1 - t) ** 2.4)
        me = BB.data; me.vertices.foreach_set('co', [c for v in BBdir for c in (v * rr * (.85 + .15 * math.sin(T * 3 + v.x * 5)))]); me.update()
        fs = max(.001, 2.2 * math.exp(-t * 5) + .08 * (1 - t)); flash.scale = (fs, fs, fs)
        look((0, -26 + 6 * e, 4 - 2 * e), (0, 0, 0), 32)
        BB.rotation_euler = (0, 0, T * .12)
    elif cap == 'galaxia':
        show('gal')
        GAL.rotation_euler = (0, 0, T * .02); marca.location = mu.Matrix.Rotation(T * .02, 4, 'Z') @ SOLAR
        p0 = mu.Vector((0, -6, 68)); p1 = marca.location + mu.Vector((-6, -9, 4.5))
        tgt = vlerp((0, 0, 0), marca.location, ease(min(1, t * 1.25)))
        look(vlerp(p0, p1, e), tgt, lerp(28, 35, e))
        ms = .25 + .2 * math.sin(T * 4) ** 2; marca.scale = (ms / .25,) * 3
    elif cap == 'sistema':
        show('ss', 'terra', 'ast')
        for pid, *_ in PL: P[pid].location = orbit_pos(pid, ANG[pid])
        P['terra'].rotation_euler.z = T * .5
        x = lerp(-2, 52, e)
        look((x, -17 - 3 * math.sin(e * math.pi), 5.0), (x + 12, 2.0, -.5), 36)
    elif cap == 'rotacio':
        show('ss', 'terra')
        E = orbit_pos('terra', .35); P['terra'].location = E
        sd = -E.normalized()  # direcció cap al Sol
        sgn, zc = alba_bcn()
        P['terra'].rotation_euler = (TILT, 0, zc + (T - frames_of('rotacio') / A.fps * .4) * .3)  # l'alba arriba al 40 %
        side = mu.Vector((-sd.y, sd.x, 0)) * sgn
        look(E + side * lerp(3.5, 3.0, e) + sd * 1.0 + mu.Vector((0, 0, .9)), E + mu.Vector((0, 0, .25)), 45)
    elif cap == 'translacio':
        show('ss', 'terra', 'transl')
        a = math.pi / 2 + e * 2 * math.pi * .999
        E = mu.Vector((math.cos(a) * 16, math.sin(a) * 16, 0)); P['terra'].location = E; P['terra'].scale = (2.8, 2.8, 2.8)
        P['terra'].rotation_euler = (0, TILT, T * 1.4)  # eix sempre inclinat cap a +x: al juny el pol nord mira al Sol
        eix.location = E; eix.rotation_euler = (0, TILT, 0); eix.scale = (1.4, 1.4, 2.0)
        for k, f in enumerate(FITES):
            ak = math.pi / 2 + k * math.pi / 2; f.location = (math.cos(ak) * 16, math.sin(ak) * 16, 0)
        look((0, -17 + 3 * e, 50), (0, -.5, 0), 30)
    elif cap == 'lluna':
        show('ss', 'terra', 'lluna')
        E = orbit_pos('terra', .35); P['terra'].location = E; P['terra'].rotation_euler = (TILT, 0, T * .2)
        sd = -E.normalized()
        a0 = math.atan2(sd.y, sd.x)  # Lluna nova: entre la Terra i el Sol
        am = a0 + .25 + e * 2 * math.pi * .93
        LL.location = E + mu.Vector((math.cos(am) * 4.2, math.sin(am) * 4.2, 1.5))
        LL.rotation_euler = (0, 0, am + math.pi)
        # la càmera mira la Lluna des de just al costat de la Terra (com nosaltres)
        cp = E + (LL.location - E).normalized() * 1.25 + mu.Vector((0, 0, .9))
        look(cp, LL.location, 70)
    elif cap == 'zones':
        show('ss', 'terra', 'zones')
        E = orbit_pos('terra', .35); P['terra'].location = E
        sd = -E.normalized()
        cpos = E + sd * 4.3 + mu.Vector((0, 0, .45)) + mu.Vector((-sd.y, sd.x, 0)) * .6
        P['terra'].rotation_euler = (0, 0, cara_bcn((cpos - E).normalized()) - .35 + T * .1)
        FR_MIX.default_value = .07 * ease(min(1, max(0, (t - .15) / .4)))
        look(cpos, E, 40)
    elif cap == 'final':
        show('ss', 'terra', 'ast', 'orb')
        R2 = random.Random(3)
        for pid, nom, r, d, per in PL: P[pid].location = orbit_pos(pid, R2.random() * 6.283 + T * 2 * math.pi / per * 6)
        look(vlerp((10, -50, 18), (0, -120, 85), e), (0, 0, 0), 30)

_ALBA = []
def alba_bcn():
    """Rotació en què Barcelona passa de la nit al dia i des de quin costat la càmera ho veu."""
    if _ALBA: return _ALBA[0]
    E = orbit_pos('terra', .35); sd = -E.normalized(); T_ = P['terra']; T_.location = E; best = None
    def at(z):
        T_.rotation_euler = (TILT, 0, z); bpy.context.view_layer.update()
        return (bcn.matrix_world.translation - E).normalized()
    for sgn in (1, -1):
        cd = (mu.Vector((-sd.y, sd.x, 0)) * sgn * 3.2 + sd * 1.0 + mu.Vector((0, 0, .9))).normalized()
        for k in range(360):
            z = k / 360 * 2 * math.pi; b = at(z); l = b.dot(sd); l2 = at(z + .02).dot(sd)
            if abs(l) < .04 and l2 > l:
                v = b.dot(cd)
                if best is None or v > best[0]: best = (v, sgn, z)
    _ALBA.append((best[1], best[2])); print('alba Barcelona: costat', best[1], 'z', round(best[2], 3), 'visibilitat', round(best[0], 2))
    return _ALBA[0]

def cara_bcn(cd):
    """Rotació (eix vertical) que posa Barcelona de cara a la direcció cd."""
    T_ = P['terra']; best = None
    for k in range(360):
        z = k / 360 * 2 * math.pi; T_.rotation_euler = (0, 0, z); bpy.context.view_layer.update()
        v = (bcn.matrix_world.translation - T_.location).normalized().dot(cd)
        if best is None or v > best[0]: best = (v, z)
    return best[1]

def frames_of(cap):
    return [c for c in CAPS if c[0] == cap][0][1] * A.fps

# ------------------------------------------------------------------ guió: capitols.json (subtítols, etiquetes i preguntes del lab)
GUIO = {
    'bigbang': dict(titol="El big bang", sub=["Fa uns 14.000 milions d'anys es va produir una gran explosió: el big bang.", "D'aquí van sortir les estrelles, les galàxies i tots els astres."], lab=dict(mode='univers', sub='bigbang')),
    'galaxia': dict(titol="La Via Làctia", sub=["Les galàxies són agrupacions de milions d'estrelles, planetes, gas i pols.", "Vivim a la Via Làctia, una galàxia espiral. El sistema solar és al braç d'Orió."], lab=dict(mode='univers', sub='galaxia'),
                    pregunta=["Com es diu la nostra galàxia?", ["Andròmeda", "La Via Làctia", "El braç d'Orió"], 1]),
    'sistema': dict(titol="El sistema solar", sub=["El Sol és una estrella. Al seu voltant giren vuit planetes.", "Primer els rocosos; després del cinturó d'asteroides, els gegants."], lab=dict(mode='sistema'),
                    pregunta=["Quants planetes té el sistema solar?", ["Set", "Vuit", "Nou"], 1]),
    'rotacio': dict(titol="La rotació: el dia i la nit", sub=["La Terra gira sobre si mateixa: és el moviment de rotació.", "Una volta dura un dia. La cara que mira el Sol és de dia; l'altra, de nit."], lab=dict(mode='terra', sub='rotacio'),
                    pregunta=["Què provoca la rotació?", ["Les estacions", "El dia i la nit", "Les fases de la Lluna"], 1]),
    'translacio': dict(titol="La translació: l'any i les estacions", sub=["La Terra fa la volta al Sol en un any: és el moviment de translació.", "Com que l'eix està inclinat, tenim estacions."], lab=dict(mode='terra', sub='translacio'),
                       pregunta=["Què provoca les estacions?", ["La distància al Sol", "La inclinació de la Terra i la translació", "La Lluna"], 1]),
    'lluna': dict(titol="La Lluna i les fases", sub=["La Lluna no té llum pròpia: reflecteix la llum del Sol.", "Segons on és, en veiem il·luminada una part o una altra: són les fases."], lab=dict(mode='terra', sub='lluna'),
                  pregunta=["En quina fase no veiem la Lluna?", ["Plena", "Nova", "Quart creixent"], 1]),
    'zones': dict(titol="Les zones climàtiques", sub=["Entre els tròpics hi ha la zona càlida.", "Després hi ha les dues zones temperades i, als pols, les dues zones fredes."], lab=dict(mode='climes', sub='zones'),
                  pregunta=["Quina zona hi ha entre els dos tròpics?", ["La zona càlida", "Una zona temperada", "Una zona freda"], 0]),
    'final': dict(titol="Ara, explora-ho tu", sub=["Al laboratori pots girar, apropar-te i tocar cada astre."], lab=dict(mode='sistema')),
}

def etiquetes(cap):
    """Calcula quan surt cada nom a la pantalla (per al reproductor i els subtítols)."""
    n = frames_of(cap); out = []
    if cap == 'sistema':
        actiu = {}
        for f in range(0, n, 2):
            pose(cap, f / (n - 1), f / A.fps); bpy.context.view_layer.update()
            for pid, nom, *_ in PL:
                v = world_to_camera_view(sc, co, P[pid].matrix_world.translation)
                vis = v.z > 0 and .2 < v.x < .8 and .1 < v.y < .9
                if vis and pid not in actiu: actiu[pid] = f
                if not vis and pid in actiu: out.append(dict(text=nom, ini=round(actiu.pop(pid) / A.fps, 2), fi=round(f / A.fps, 2)))
        for pid, f0 in actiu.items(): out.append(dict(text=[x[1] for x in PL if x[0] == pid][0], ini=round(f0 / A.fps, 2), fi=round(n / A.fps, 2)))
        out.append(dict(text="Cinturó d'asteroides", ini=round(n / A.fps * .33, 2), fi=round(n / A.fps * .45, 2)))
        out.sort(key=lambda d: d['ini'])
    if cap == 'translacio':
        D = n / A.fps
        for k, txt in enumerate(["21 de març · primavera al nord", "21 de juny · estiu al nord, hivern al sud", "23 de setembre · tardor al nord", "21 de desembre · hivern al nord, estiu al sud"]):
            ti = inv_ease(k / 4); out.append(dict(text=txt, ini=round(D * ti, 2), fi=round(D * min(1, ti + .17), 2)))
    if cap == 'lluna':
        D = n / A.fps; noms = ['Lluna nova', 'Lluna creixent', 'Quart creixent', 'Gibosa creixent', 'Lluna plena', 'Gibosa minvant', 'Quart minvant', 'Lluna minvant']
        for k, nm in enumerate(noms):
            e_k = ((k / 8) * 2 * math.pi - .25) / (2 * math.pi * .93)  # quan l'angle Sol-Terra-Lluna arriba a la fase k
            ti = 0 if e_k < 0 else inv_ease(e_k) if e_k <= 1 else None
            if ti is not None: out.append(dict(text=nm, ini=round(D * max(0, ti - .05), 2), fi=round(D * min(1, ti + .07), 2)))
        for a_, b_ in zip(out, out[1:]): a_['fi'] = min(a_['fi'], b_['ini'])
    if cap == 'zones':
        D = n / A.fps
        for k, txt in enumerate(["Equador", "Tròpics de Càncer i de Capricorn", "Cercles polars"]):
            out.append(dict(text=txt, ini=round(D * (.3 + .2 * k), 2), fi=round(D * (.5 + .2 * k), 2)))
    if cap == 'rotacio':
        out.append(dict(text="Barcelona", ini=1.0, fi=round(n / A.fps - .5, 2)))
    if cap == 'galaxia':
        out.append(dict(text="Sistema solar · braç d'Orió", ini=round(n / A.fps * .55, 2), fi=round(n / A.fps, 2)))
    return out

def escriu_meta():
    caps, t0 = [], 0.0
    for i, (cid, dur) in enumerate(CAPS):
        g = GUIO[cid]; c = dict(num=i + 1, id=cid, titol=g['titol'], ini=round(t0, 2), fi=round(t0 + dur, 2), subtitols=[], etiquetes=etiquetes(cid), lab=g['lab'])
        half = dur / max(1, len(g['sub']))
        for k, s in enumerate(g['sub']): c['subtitols'].append(dict(text=s, ini=round(k * half + .3, 2), fi=round((k + 1) * half - .2, 2)))
        if 'pregunta' in g: c['pregunta'] = dict(text=g['pregunta'][0], opcions=g['pregunta'][1], correcta=g['pregunta'][2], quan=round(t0 + dur, 2))
        caps.append(c); t0 += dur
    meta = dict(titol="Viatge per l'univers", unitat="Coneixement del Medi 6è · Unitat 4: La Terra, el nostre planeta", fps=A.fps, durada=t0,
                fosa=.5, capitols=caps)
    with open(os.path.join(HERE, 'capitols.json'), 'w', encoding='utf8') as f: json.dump(meta, f, ensure_ascii=False, indent=1)
    print('capitols.json escrit:', len(caps), 'capítols,', t0, 's')

# ------------------------------------------------------------------ render
if A.meta:
    escriu_meta(); sys.exit(0)
sel = [c for c, _ in CAPS] if A.cap == 'all' else [CAPS[int(x) - 1][0] for x in A.cap.split(',')]
for i, (cid, dur) in enumerate(CAPS):
    if cid not in sel: continue
    n = dur * A.fps
    if A.frames:
        p = [int(x) for x in A.frames.split(':')]; rng = range(p[0], min(n, p[1]), p[2] if len(p) > 2 else 1)
    else:
        rng = range(n)
    od = os.path.join(A.out, '%02d_%s' % (i + 1, cid)); os.makedirs(od, exist_ok=True)
    for f in rng:
        fn = os.path.join(od, 'f%04d.png' % f)
        if os.path.exists(fn) and not A.frames: continue  # permet reprendre si s'atura
        pose(cid, f / max(1, n - 1), f / A.fps)
        sc.render.filepath = fn; t0 = time.time(); bpy.ops.render.render(write_still=True)
        print('CAP', i + 1, cid, 'FRAME', f, '/', n, round(time.time() - t0, 1), 's', flush=True)
if A.cap == 'all' and not A.frames:
    escriu_meta()
