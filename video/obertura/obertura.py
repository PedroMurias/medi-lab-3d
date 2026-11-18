"""
Medi·Lab 3D · Vídeo d'obertura de la Unitat 4 («De la porta de l'escola a tot l'univers»)
Escenes de l'espai (3-8) fetes amb Blender (Cycles). Guió: document «Guion · Vídeo de apertura».

  3 astronauta   Ets astronauta: la Terra a sota, la Lluna al fons
  4 gir360       Gir complet sobre nosaltres: Terra, Lluna, Sol, Orió, planetes, Ossa Major, Via Làctia
  5 planetes     Salts planeta a planeta (amb cinturó d'asteroides i un cometa) fins a Plutó
  6 foratnegre   Un forat negre ens atrau en espiral
  7 galaxia      Sortim al centre de la Via Làctia i ens allunyem fins a veure-la sencera
  8 univers      Galàxies, filaments… i tot s'encongeix fins a un punt: el big bang

Les escenes 1-2 (porta de l'escola i zoom fins a la Terra) són vídeo real + Google Earth Studio.

Ús:
  python obertura.py -- --esc 4 --frames 0:432:48 --w 640 --spp 12     # proves
  python obertura.py -- --esc all --w 1920 --spp 64 --gpu               # final
  python obertura.py -- --meta                                           # només guio.json
"""
import bpy, math, sys, os, time, json, random, argparse
import mathutils as mu
from bpy_extras.object_utils import world_to_camera_view

HERE = os.path.dirname(os.path.abspath(__file__))
TEX = os.path.join(HERE, '..', 'univers', 'textures')
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument('--esc', default='all'); ap.add_argument('--frames', default='')
ap.add_argument('--w', type=int, default=1280); ap.add_argument('--spp', type=int, default=32)
ap.add_argument('--fps', type=int, default=24); ap.add_argument('--gpu', action='store_true')
ap.add_argument('--out', default=os.path.join(HERE, 'render')); ap.add_argument('--meta', action='store_true')
A = ap.parse_args(argv)

ESC = [('astronauta', 8), ('gir360', 18), ('planetes', 37), ('foratnegre', 12), ('galaxia', 12), ('univers', 12)]
NUM0 = 3  # la primera escena d'aquest script és la 3 del guió

# ================================================================== escena base
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.samples = A.spp; sc.cycles.use_denoising = True; sc.cycles.max_bounces = 4
sc.cycles.caustics_reflective = sc.cycles.caustics_refractive = False
sc.render.resolution_x = A.w; sc.render.resolution_y = int(A.w * 9 / 16); sc.render.fps = A.fps
sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Medium High Contrast'
if A.gpu:
    prefs = bpy.context.preferences.addons['cycles'].preferences
    for kind in ('OPTIX', 'CUDA', 'HIP', 'ONEAPI'):
        try:
            prefs.compute_device_type = kind; prefs.get_devices()
            if any(d.type == kind for d in prefs.devices):
                for d in prefs.devices: d.use = d.type == kind
                sc.cycles.device = 'GPU'; print('GPU:', kind); break
        except Exception: pass
R = random.Random(11)
COLL = {}
def coll(n):
    c = bpy.data.collections.new(n); sc.collection.children.link(c); COLL[n] = c; return c
def put(o, c):
    for u in list(o.users_collection): u.objects.unlink(o)
    COLL[c].objects.link(o); return o
for n in ('terra', 'cel', 'ss', 'ast', 'cometa', 'fn', 'gal', 'uni', 'warp'): coll(n)

# ================================================================== materials (mateixos que el vídeo d'Univers)
def newmat(name):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree
    return m, nt, nt.nodes['Principled BSDF'], nt.nodes['Material Output']
def emis(name, col, strength):
    m, nt, b, out = newmat(name); nt.nodes.remove(b); e = nt.nodes.new('ShaderNodeEmission')
    e.inputs['Color'].default_value = (*col, 1); e.inputs['Strength'].default_value = strength
    nt.links.new(e.outputs[0], out.inputs['Surface']); return m
def noise(nt, scale, detail=6, rough=.55, dist=0.0):
    n = nt.nodes.new('ShaderNodeTexNoise'); n.inputs['Scale'].default_value = scale; n.inputs['Detail'].default_value = detail
    n.inputs['Roughness'].default_value = rough; n.inputs['Distortion'].default_value = dist; return n
def ramp(nt, stops):
    r = nt.nodes.new('ShaderNodeValToRGB'); cr = r.color_ramp
    cr.elements[0].position, cr.elements[0].color = stops[0][0], stops[0][1]
    cr.elements[1].position, cr.elements[1].color = stops[-1][0], stops[-1][1]
    for p, c in stops[1:-1]: cr.elements.new(p).color = c
    return r
def img(nt, fn, non_color=False):
    t = nt.nodes.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(os.path.join(TEX, fn))
    if non_color: t.image.colorspace_settings.name = 'Non-Color'
    return t
def sphere(name, r, seg=64, c=None, loc=(0, 0, 0)):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, segments=seg, ring_count=seg // 2, location=loc)
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
    nt.links.new(tr.outputs['Color'], rr.inputs['Value']); nt.links.new(rr.outputs[0], b.inputs['Roughness']); return m
def mat_nuvols():
    m, nt, b, out = newmat('nuvols'); tc = nt.nodes.new('ShaderNodeTexCoord'); n = noise(nt, 2.6, 12, .62, 1.4)
    nt.links.new(tc.outputs['Object'], n.inputs['Vector'])
    r = ramp(nt, [(0, (0, 0, 0, 1)), (.56, (0, 0, 0, 1)), (.72, (.75, .75, .75, 1))]); nt.links.new(n.outputs['Fac'], r.inputs['Fac'])
    b.inputs['Base Color'].default_value = (1, 1, 1, 1); b.inputs['Roughness'].default_value = 1; nt.links.new(r.outputs['Color'], b.inputs['Alpha']); return m
def mat_atm(col=(.32, .58, 1), strength=1.6):
    m, nt, b, out = newmat('atm'); nt.nodes.remove(b)
    em = nt.nodes.new('ShaderNodeEmission'); em.inputs['Color'].default_value = (*col, 1); em.inputs['Strength'].default_value = strength
    lw = nt.nodes.new('ShaderNodeLayerWeight'); lw.inputs['Blend'].default_value = .1
    pw = nt.nodes.new('ShaderNodeMath'); pw.operation = 'POWER'; pw.inputs[1].default_value = 5
    tr = nt.nodes.new('ShaderNodeBsdfTransparent'); mx = nt.nodes.new('ShaderNodeMixShader')
    nt.links.new(lw.outputs['Facing'], pw.inputs[0]); nt.links.new(pw.outputs[0], mx.inputs[0])
    nt.links.new(tr.outputs[0], mx.inputs[1]); nt.links.new(em.outputs[0], mx.inputs[2]); nt.links.new(mx.outputs[0], out.inputs['Surface'])
    m.use_backface_culling = True; return m
def mat_lluna():
    m, nt, b, out = newmat('lluna'); t = img(nt, 'moon.jpg'); nt.links.new(t.outputs['Color'], b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = .97; bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = .35
    nt.links.new(t.outputs['Color'], bp.inputs['Height']); nt.links.new(bp.outputs['Normal'], b.inputs['Normal']); return m
def mat_bandes(name, cols, scale=1.5, warp=.8, bands=12, spot=None):
    m, nt, b, out = newmat(name); tc = nt.nodes.new('ShaderNodeTexCoord')
    sep = nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(tc.outputs['Generated'], sep.inputs[0])
    n = noise(nt, scale, 8, .6, warp); nt.links.new(tc.outputs['Object'], n.inputs['Vector'])
    ma = nt.nodes.new('ShaderNodeMath'); ma.operation = 'MULTIPLY_ADD'; ma.inputs[1].default_value = bands
    nt.links.new(sep.outputs['Z'], ma.inputs[0]); nt.links.new(n.outputs['Fac'], ma.inputs[2])
    s = nt.nodes.new('ShaderNodeMath'); s.operation = 'SINE'; nt.links.new(ma.outputs[0], s.inputs[0])
    s2 = nt.nodes.new('ShaderNodeMath'); s2.operation = 'MULTIPLY_ADD'; s2.inputs[1].default_value = .5; s2.inputs[2].default_value = .5
    nt.links.new(s.outputs[0], s2.inputs[0]); r = ramp(nt, cols); nt.links.new(s2.outputs[0], r.inputs['Fac']); col = r.outputs['Color']
    if spot:
        d = nt.nodes.new('ShaderNodeVectorMath'); d.operation = 'DISTANCE'; d.inputs[1].default_value = spot[0]
        k = nt.nodes.new('ShaderNodeVectorMath'); k.operation = 'MULTIPLY'; k.inputs[1].default_value = (1, 1, 2.2)
        nt.links.new(tc.outputs['Generated'], k.inputs[0]); nt.links.new(k.outputs[0], d.inputs[0])
        mr = nt.nodes.new('ShaderNodeMapRange'); mr.inputs['From Min'].default_value = spot[1]; mr.inputs['From Max'].default_value = spot[1] * .55
        nt.links.new(d.outputs['Value'], mr.inputs['Value'])
        mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.inputs[7].default_value = (*spot[2], 1)
        nt.links.new(mr.outputs[0], mx.inputs[0]); nt.links.new(col, mx.inputs[6]); col = mx.outputs[2]
    nt.links.new(col, b.inputs['Base Color']); b.inputs['Roughness'].default_value = .85; return m
def mat_roca(name, cols, scale=3, bump=.35):
    m, nt, b, out = newmat(name); tc = nt.nodes.new('ShaderNodeTexCoord'); n = noise(nt, scale, 10, .62, .3)
    nt.links.new(tc.outputs['Object'], n.inputs['Vector']); r = ramp(nt, cols)
    nt.links.new(n.outputs['Fac'], r.inputs['Fac']); nt.links.new(r.outputs['Color'], b.inputs['Base Color']); b.inputs['Roughness'].default_value = .95
    v = nt.nodes.new('ShaderNodeTexVoronoi'); v.inputs['Scale'].default_value = scale * 4; nt.links.new(tc.outputs['Object'], v.inputs['Vector'])
    bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = bump
    nt.links.new(v.outputs['Distance'], bp.inputs['Height']); nt.links.new(bp.outputs['Normal'], b.inputs['Normal']); return m
def mat_punts(name, strength):
    m, nt, b, out = newmat(name); nt.nodes.remove(b); at = nt.nodes.new('ShaderNodeAttribute'); at.attribute_name = 'col'
    e = nt.nodes.new('ShaderNodeEmission'); e.inputs['Strength'].default_value = strength
    nt.links.new(at.outputs['Color'], e.inputs['Color']); nt.links.new(e.outputs[0], out.inputs['Surface']); return m
def punts(name, coords, cols, rads, mat, c):
    me = bpy.data.meshes.new(name); me.from_pydata(coords, [], [])
    me.attributes.new('col', 'FLOAT_COLOR', 'POINT').data.foreach_set('color', [v for cc in cols for v in (*cc, 1)])
    me.attributes.new('rad', 'FLOAT', 'POINT').data.foreach_set('value', rads)
    o = bpy.data.objects.new(name, me); COLL[c].objects.link(o)
    ng = bpy.data.node_groups.new('gn_' + name, 'GeometryNodeTree')
    ng.interface.new_socket('Geometry', in_out='INPUT', socket_type='NodeSocketGeometry')
    ng.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')
    gi = ng.nodes.new('NodeGroupInput'); go = ng.nodes.new('NodeGroupOutput')
    mp = ng.nodes.new('GeometryNodeMeshToPoints'); na = ng.nodes.new('GeometryNodeInputNamedAttribute'); na.data_type = 'FLOAT'; na.inputs['Name'].default_value = 'rad'
    sm = ng.nodes.new('GeometryNodeSetMaterial'); sm.inputs['Material'].default_value = mat
    ng.links.new(gi.outputs[0], mp.inputs['Mesh']); ng.links.new(na.outputs['Attribute'], mp.inputs['Radius'])
    ng.links.new(mp.outputs['Points'], sm.inputs['Geometry']); ng.links.new(sm.outputs[0], go.inputs[0])
    o.modifiers.new('punts', 'NODES').node_group = ng
    return o
def no_shadow(o):
    o.visible_shadow = False; return o

# ================================================================== cel: estrelles + franja de la Via Làctia (pla galàctic real)
EPS = math.radians(23.44)
def eq2ecl(ra_h, dec_d):
    a = math.radians(ra_h * 15); d = math.radians(dec_d)
    v = mu.Vector((math.cos(d) * math.cos(a), math.cos(d) * math.sin(a), math.sin(d)))
    return (mu.Matrix.Rotation(-EPS, 3, 'X') @ v).normalized()
GAL_POL = eq2ecl(12.857, 27.13)  # pol nord galàctic
w = bpy.data.worlds.new('cel'); sc.world = w; w.use_nodes = True; wn = w.node_tree; bg = wn.nodes['Background']
tcw = wn.nodes.new('ShaderNodeTexCoord')
st = wn.nodes.new('ShaderNodeTexVoronoi'); st.inputs['Scale'].default_value = 520; wn.links.new(tcw.outputs['Generated'], st.inputs['Vector'])
sr = wn.nodes.new('ShaderNodeMapRange'); sr.inputs['From Min'].default_value = .04; sr.inputs['From Max'].default_value = 0; sr.inputs['To Max'].default_value = 1.4
wn.links.new(st.outputs['Distance'], sr.inputs['Value'])
spw = wn.nodes.new('ShaderNodeMath'); spw.operation = 'POWER'; spw.inputs[1].default_value = 3; wn.links.new(sr.outputs[0], spw.inputs[0])
# color de cada estrella: blaves, blanques, grogues, vermelles
sc_col = wn.nodes.new('ShaderNodeValToRGB'); wn.links.new(st.outputs['Color'], sc_col.inputs['Fac'])
for i, (p, c) in enumerate([(0, (.6, .7, 1)), (.45, (1, 1, 1)), (.75, (1, .85, .6)), (1, (1, .55, .45))]):
    e = sc_col.color_ramp.elements[i] if i < 2 else sc_col.color_ramp.elements.new(p)
    e.position = p; e.color = (*c, 1)
smul = wn.nodes.new('ShaderNodeMix'); smul.data_type = 'RGBA'; smul.blend_type = 'MULTIPLY'; smul.inputs[0].default_value = 1
wn.links.new(sc_col.outputs['Color'], smul.inputs[6]); wn.links.new(spw.outputs[0], smul.inputs[7])
# franja de la Via Làctia: brillantor segons la distància al pla galàctic
dot = wn.nodes.new('ShaderNodeVectorMath'); dot.operation = 'DOT_PRODUCT'; dot.inputs[1].default_value = GAL_POL
wn.links.new(tcw.outputs['Generated'], dot.inputs[0])
ab = wn.nodes.new('ShaderNodeMath'); ab.operation = 'ABSOLUTE'; wn.links.new(dot.outputs['Value'], ab.inputs[0])
band = wn.nodes.new('ShaderNodeMapRange'); band.inputs['From Min'].default_value = .22; band.inputs['From Max'].default_value = 0; wn.links.new(ab.outputs[0], band.inputs['Value'])
bn = wn.nodes.new('ShaderNodeTexNoise'); bn.inputs['Scale'].default_value = 6; bn.inputs['Detail'].default_value = 10; bn.inputs['Roughness'].default_value = .65
wn.links.new(tcw.outputs['Generated'], bn.inputs['Vector'])
bm = wn.nodes.new('ShaderNodeMath'); bm.operation = 'MULTIPLY'; wn.links.new(band.outputs[0], bm.inputs[0]); wn.links.new(bn.outputs['Fac'], bm.inputs[1])
bp_ = wn.nodes.new('ShaderNodeMath'); bp_.operation = 'POWER'; bp_.inputs[1].default_value = 2.2; wn.links.new(bm.outputs[0], bp_.inputs[0])
bstr = wn.nodes.new('ShaderNodeMath'); bstr.operation = 'MULTIPLY'; bstr.inputs[1].default_value = 0; wn.links.new(bp_.outputs[0], bstr.inputs[0])
VL_STR = bstr.inputs[1]
bcol = wn.nodes.new('ShaderNodeMix'); bcol.data_type = 'RGBA'; bcol.blend_type = 'MULTIPLY'; bcol.inputs[0].default_value = 1; bcol.inputs[7].default_value = (.85, .82, 1, 1)
wn.links.new(bstr.outputs[0], bcol.inputs[6])
add = wn.nodes.new('ShaderNodeMix'); add.data_type = 'RGBA'; add.blend_type = 'ADD'; add.inputs[0].default_value = 1
wn.links.new(smul.outputs[2], add.inputs[6]); wn.links.new(bcol.outputs[2], add.inputs[7]); wn.links.new(add.outputs[2], bg.inputs['Color'])
STAR_STR = bg.inputs['Strength']

# ================================================================== escenes 3-4: la Terra des de l'òrbita
SUN_DIR = None  # es calcula amb el cercle del gir
TERRA = sphere('Terra', 1, 128, 'terra'); TERRA.data.materials.append(mat_terra())
nuv = sphere('Nuvols', 1.012, 96); nuv.data.materials.append(mat_nuvols()); nuv.parent = TERRA; put(nuv, 'terra')
atm = sphere('Atmosfera', 1.035, 96); atm.data.materials.append(mat_atm()); atm.parent = TERRA; put(atm, 'terra'); no_shadow(atm)
LLUNA = sphere('Lluna', .8, 96, 'terra'); LLUNA.data.materials.append(mat_lluna())
sunlamp = bpy.data.lights.new('sol_dir', 'SUN'); sunlamp.energy = 4.5; sunlamp.angle = math.radians(.6)
SUNL = bpy.data.objects.new('sol_dir', sunlamp); COLL['terra'].objects.link(SUNL)
SOLDISC = sphere('Sol_disc', 30, 48, 'cel'); SOLDISC.data.materials.append(emis('soldisc', (1, .93, .8), 120))
for a in ('visible_diffuse', 'visible_glossy', 'visible_transmission', 'visible_shadow'): setattr(SOLDISC, a, False)

# constel·lacions (coordenades reals, AR en hores i Dec en graus)
CONST = {
    'Ossa Major': ([('Dubhe', 11.062, 61.75, 1.8), ('Merak', 11.031, 56.38, 2.3), ('Phecda', 11.897, 53.69, 2.4), ('Megrez', 12.257, 57.03, 3.3),
                    ('Alioth', 12.900, 55.96, 1.8), ('Mizar', 13.399, 54.93, 2.2), ('Alkaid', 13.792, 49.31, 1.9)],
                   [(0, 1), (1, 2), (2, 3), (3, 0), (3, 4), (4, 5), (5, 6)]),
    'Orió': ([('Betelgeuse', 5.919, 7.41, .5), ('Bellatrix', 5.419, 6.35, 1.6), ('Mintaka', 5.533, -.30, 2.2), ('Alnilam', 5.603, -1.20, 1.7),
              ('Alnitak', 5.679, -1.94, 1.8), ('Saiph', 5.796, -9.67, 2.1), ('Rigel', 5.242, -8.20, .1)],
             [(0, 1), (1, 2), (0, 4), (2, 3), (3, 4), (4, 5), (2, 6), (5, 6)])}
SCOL = {'Betelgeuse': (1, .55, .35), 'Rigel': (.65, .75, 1)}
CEL_R = 1500
CONST_OBJ = {}; CONST_DIR = {}
LINE_MATS = []
for cn, (stars, lines) in CONST.items():
    objs = []; dirs = [eq2ecl(ra, de) for _, ra, de, mag in stars]
    CONST_DIR[cn] = sum(dirs, mu.Vector()).normalized()
    for (nm, ra, de, mag), d in zip(stars, dirs):
        s = sphere(nm, CEL_R * .0028 * (1.6 - mag * .35), 16, 'cel'); s.location = d * CEL_R
        s.data.materials.append(emis('st_' + nm, SCOL.get(nm, (1, 1, 1)), 40)); no_shadow(s); objs.append(s)
    lm = emis('linia_' + cn, (0, .9, 1), 0); LINE_MATS.append(lm)
    for i, j in lines:
        a, b = dirs[i] * CEL_R, dirs[j] * CEL_R; mid = (a + b) / 2; v = b - a
        bpy.ops.mesh.primitive_cylinder_add(radius=CEL_R * .0007, depth=v.length * .86, location=mid, vertices=8)
        l = bpy.context.object; l.rotation_euler = v.to_track_quat('Z', 'Y').to_euler(); l.data.materials.append(lm); put(l, 'cel'); no_shadow(l); objs.append(l)
    CONST_OBJ[cn] = objs
CEL_ROOT = bpy.data.objects.new('cel_centre', None); COLL['cel'].objects.link(CEL_ROOT)
for o in list(COLL['cel'].objects):
    if o is not CEL_ROOT: o.parent = CEL_ROOT
# planetes vistos com a punts brillants
PDOTS = {}
for nm, col in [('Júpiter', (1, .93, .8)), ('Saturn', (1, .9, .7)), ('Mart', (1, .55, .4)), ('Venus', (1, 1, .95))]:
    s = sphere('punt_' + nm, CEL_R * .0035, 16, 'cel'); s.data.materials.append(emis('pd_' + nm, col, 70)); no_shadow(s); s.parent = CEL_ROOT; PDOTS[nm] = s

# cercle del gir de 360°: passa per Orió i per l'Ossa Major; hi col·loquem la Terra, la Lluna, el Sol i els planetes
U = CONST_DIR['Orió']; V = (CONST_DIR['Ossa Major'] - U * CONST_DIR['Ossa Major'].dot(U)).normalized(); NRM = U.cross(V)
ANG_UMA = math.degrees(math.atan2(CONST_DIR['Ossa Major'].dot(V), CONST_DIR['Ossa Major'].dot(U)))
def circ(deg, up=0.0):
    a = math.radians(deg); d = U * math.cos(a) + V * math.sin(a)
    return (d + NRM * math.tan(math.radians(up))).normalized()
GIR = dict(terra=200, lluna=245, sol=295, orio=0, jupiter=35, mart=ANG_UMA + 40, saturn=ANG_UMA + 85, venus=320)
CAM4 = mu.Vector((0, 0, 0))  # posició de la càmera a l'escena 4 (centre del cel)
EARTH4 = CAM4 + circ(GIR['terra']) * 2.6
SUN_DIR = circ(GIR['sol'])
for nm, k, up in [('Júpiter', 'jupiter', 6), ('Mart', 'mart', -8), ('Saturn', 'saturn', 5), ('Venus', 'venus', -6)]:
    PDOTS[nm].location = circ(GIR[k], up) * CEL_R

# ================================================================== escena 5: sistema solar (dades de la taula del lab)
PL = [('mercuri', 'Mercuri', .38, 7), ('venus', 'Venus', .95, 10), ('terra', 'La Terra', 1, 13.5), ('mart', 'Mart', .53, 17),
      ('jupiter', 'Júpiter', 3.6, 28), ('saturn', 'Saturn', 3.0, 39), ('ura', 'Urà', 1.9, 49), ('neptu', 'Neptú', 1.85, 57), ('pluto', 'Plutó', .25, 64)]
SUN_R = 4.2
sol = sphere('Sol', SUN_R, 64, 'ss')
sm_, snt, sb, sout = newmat('sol'); snt.nodes.remove(sb); se = snt.nodes.new('ShaderNodeEmission'); sn = noise(snt, 3, 6, .6, .5)
stc = snt.nodes.new('ShaderNodeTexCoord'); snt.links.new(stc.outputs['Object'], sn.inputs['Vector'])
srp = ramp(snt, [(0, (1, .3, .02, 1)), (.5, (1, .58, .1, 1)), (1, (1, .9, .55, 1))]); snt.links.new(sn.outputs['Fac'], srp.inputs['Fac'])
snt.links.new(srp.outputs['Color'], se.inputs['Color']); se.inputs['Strength'].default_value = 12; snt.links.new(se.outputs[0], sout.inputs['Surface'])
sol.data.materials.append(sm_)
for a in ('visible_diffuse', 'visible_glossy', 'visible_transmission', 'visible_shadow'): setattr(sol, a, False)
llum = bpy.data.lights.new('llum_sol', 'POINT'); llum.shadow_soft_size = 2.5; llum.color = (1, .97, .92); llum.use_nodes = True
lfo = llum.node_tree.nodes.new('ShaderNodeLightFalloff'); lfo.inputs['Strength'].default_value = 12
llum.node_tree.links.new(lfo.outputs['Constant'], llum.node_tree.nodes['Emission'].inputs['Strength'])
LO = bpy.data.objects.new('llum_sol', llum); COLL['ss'].objects.link(LO)
MATS = {
    'mercuri': lambda: mat_roca('mercuri', [(0, (.22, .21, .2, 1)), (1, (.55, .52, .48, 1))], 4, .45),
    'venus': lambda: mat_bandes('venus', [(0, (.72, .58, .34, 1)), (.5, (.92, .82, .6, 1)), (1, (.8, .68, .45, 1))], 2.5, 2.4, 5),
    'mart': lambda: mat_roca('mart', [(0, (.42, .16, .07, 1)), (.6, (.74, .36, .17, 1)), (1, (.86, .6, .44, 1))], 2.5, .4),
    'jupiter': lambda: mat_bandes('jupiter', [(0, (.5, .37, .26, 1)), (.3, (.86, .78, .64, 1)), (.5, (.68, .48, .33, 1)), (.7, (.92, .86, .76, 1)), (1, (.58, .43, .3, 1))], 1.2, .9, 16, spot=((.72, .3, .62), .09, (.7, .25, .12))),
    'saturn': lambda: mat_bandes('saturn', [(0, (.62, .5, .3, 1)), (.5, (.82, .72, .5, 1)), (1, (.7, .58, .36, 1))], 1.5, .6, 12),
    'ura': lambda: mat_bandes('ura', [(0, (.55, .8, .84, 1)), (1, (.68, .88, .9, 1))], 1, .3, 5),
    'neptu': lambda: mat_bandes('neptu', [(0, (.1, .2, .6, 1)), (.5, (.24, .4, .85, 1)), (1, (.14, .24, .64, 1))], 1.5, .8, 9),
    'pluto': lambda: mat_roca('pluto', [(0, (.45, .38, .32, 1)), (1, (.85, .78, .7, 1))], 3, .3)}
P = {}
PANG = {}
for i, (pid, nom, r, d) in enumerate(PL):
    PANG[pid] = .9 * i  # cada planeta en una direcció diferent: el salt és un viatge de veritat
    loc = mu.Vector((math.cos(PANG[pid]) * d, math.sin(PANG[pid]) * d, 0))
    if pid == 'terra':
        o = sphere('Terra_ss', 1, 96, 'ss', loc); o.data.materials.append(TERRA.data.materials[0])
        a2 = sphere('Atm_ss', 1.035, 64, 'ss', loc); a2.data.materials.append(atm.data.materials[0]); no_shadow(a2); a2.parent = o; a2.location = (0, 0, 0)
    else:
        o = sphere(nom, r, 96, 'ss', loc); o.data.materials.append(MATS[pid]())
    o.rotation_euler = (math.radians({'ura': 98, 'terra': 23.44, 'saturn': 27}.get(pid, 8)), 0, R.random() * 6.28); no_shadow(o); P[pid] = o
# anells de Saturn
bpy.ops.mesh.primitive_circle_add(vertices=256, radius=6.4, fill_type='NGON'); an = bpy.context.object; an.name = 'Anells'
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.inset(thickness=2.5, depth=0); bpy.ops.mesh.delete(type='FACE'); bpy.ops.object.mode_set(mode='OBJECT')
am, ant, ab_, aout = newmat('anells'); atc = ant.nodes.new('ShaderNodeTexCoord'); aln = ant.nodes.new('ShaderNodeVectorMath'); aln.operation = 'LENGTH'
ant.links.new(atc.outputs['Object'], aln.inputs[0]); amr = ant.nodes.new('ShaderNodeMapRange'); amr.inputs['From Min'].default_value = 3.9; amr.inputs['From Max'].default_value = 6.4
ant.links.new(aln.outputs['Value'], amr.inputs['Value']); acb = ant.nodes.new('ShaderNodeCombineXYZ'); ant.links.new(amr.outputs[0], acb.inputs[0])
ann = noise(ant, 55, 2, .5); ant.links.new(acb.outputs[0], ann.inputs['Vector'])
arp = ramp(ant, [(0, (0, 0, 0, 1)), (.3, (.78, .7, .56, 1)), (.55, (.25, .22, .18, 1)), (.6, (.88, .82, .7, 1)), (1, (.32, .29, .24, 1))])
ant.links.new(ann.outputs['Fac'], arp.inputs['Fac']); ant.links.new(arp.outputs['Color'], ab_.inputs['Base Color']); ab_.inputs['Roughness'].default_value = .9
ant.links.new(ann.outputs['Fac'], ab_.inputs['Alpha']); an.data.materials.append(am); an.parent = P['saturn']; an.location = (0, 0, 0); put(an, 'ss'); no_shadow(an)
# cinturó d'asteroides (punts) + roques grans a prop de la càmera
aco, acol, arad = [], [], []
for i in range(9000):
    rr = R.uniform(20.5, 23.5); a = R.random() * 6.283
    aco.append((math.cos(a) * rr, math.sin(a) * rr, R.gauss(0, .3))); g = R.uniform(.25, .45); acol.append((g, g * .95, g * .9)); arad.append(.006 + .022 * R.random() ** 3)
mast, mnt, mb, mout = newmat('asteroides'); mat_ = mnt.nodes.new('ShaderNodeAttribute'); mat_.attribute_name = 'col'; mnt.links.new(mat_.outputs['Color'], mb.inputs['Base Color'])
AST = punts('asteroides', aco, acol, arad, mast, 'ast')
AST_ANG = (PANG['mart'] + PANG['jupiter']) / 2
ROQ = []
mroca = mat_roca('roca', [(0, (.18, .17, .16, 1)), (1, (.48, .45, .42, 1))], 5, .6)
for i in range(7):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=4, radius=R.uniform(.15, .45)); r_ = bpy.context.object; r_.name = 'roca%d' % i
    dm = r_.modifiers.new('d', 'DISPLACE'); tx = bpy.data.textures.new('rx%d' % i, 'CLOUDS'); tx.noise_scale = .35; dm.texture = tx; dm.strength = .25
    r_.scale = (1, R.uniform(.6, .9), R.uniform(.5, .8)); r_.data.materials.append(mroca); put(r_, 'ast'); no_shadow(r_); ROQ.append(r_)
# cometa: nucli de gel + cua que s'allunya del Sol
_ac = mu.Vector((math.cos(AST_ANG) * 22, math.sin(AST_ANG) * 22, 0)); _sd = (-_ac).normalized()
COM_POS = _ac + mu.Vector((-_sd.y, _sd.x, 0)) * 3.2 + _sd * 2.5 + mu.Vector((0, 0, 1.6))
nucli = sphere('cometa_nucli', .12, 24, 'cometa', COM_POS); nucli.data.materials.append(mat_roca('gel', [(0, (.6, .65, .7, 1)), (1, (.9, .95, 1, 1))], 6, .3))
anti = COM_POS.normalized()  # la cua sempre apunta en direcció contrària al Sol
_ax = anti.orthogonal().normalized(); _ay = anti.cross(_ax)
cco, ccol, crad = [], [], []
for i in range(16000):
    u = R.random() ** 1.6; L = u * 7.5; sp = .05 + u * .9
    q = COM_POS + anti * L + (_ax * R.gauss(0, 1) + _ay * R.gauss(0, 1)) * sp * .5 + _ax * (u * u * 1.2)  # una mica corbada
    f = (1 - u) ** 1.5; cco.append(q[:]); ccol.append((.55 * f + .05, .78 * f + .05, 1 * f + .08)); crad.append(.003 + .006 * R.random())
CUA = punts('cometa_cua', cco, ccol, crad, mat_punts('cua', 1.6), 'cometa')
coma = sphere('cometa_coma', .22, 24, 'cometa', COM_POS); coma.data.materials.append(mat_atm((.6, .85, 1), 1.0)); no_shadow(coma)
no_shadow(nucli)

# ================================================================== escena 6: forat negre
FN = sphere('forat_negre', 2.0, 96, 'fn'); FN.data.materials.append(emis('negre', (0, 0, 0), 0))
def mat_disc(name, inner, outer, strength):
    m, nt, b, out = newmat(name); nt.nodes.remove(b); tc = nt.nodes.new('ShaderNodeTexCoord')
    sep = nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(tc.outputs['Object'], sep.inputs[0])
    ln = nt.nodes.new('ShaderNodeVectorMath'); ln.operation = 'LENGTH'; nt.links.new(tc.outputs['Object'], ln.inputs[0])
    at2 = nt.nodes.new('ShaderNodeMath'); at2.operation = 'ARCTAN2'; nt.links.new(sep.outputs['Y'], at2.inputs[0]); nt.links.new(sep.outputs['X'], at2.inputs[1])
    lg = nt.nodes.new('ShaderNodeMath'); lg.operation = 'LOGARITHM'; lg.inputs[1].default_value = 2.718; nt.links.new(ln.outputs['Value'], lg.inputs[0])
    sw = nt.nodes.new('ShaderNodeMath'); sw.operation = 'MULTIPLY_ADD'; sw.inputs[1].default_value = 3.0; nt.links.new(lg.outputs[0], sw.inputs[0]); nt.links.new(at2.outputs[0], sw.inputs[2])
    cb_ = nt.nodes.new('ShaderNodeCombineXYZ'); nt.links.new(sw.outputs[0], cb_.inputs[0]); nt.links.new(ln.outputs['Value'], cb_.inputs[1])
    nz = noise(nt, 3.5, 6, .6); nt.links.new(cb_.outputs[0], nz.inputs['Vector'])
    mr = nt.nodes.new('ShaderNodeMapRange'); mr.inputs['From Min'].default_value = inner; mr.inputs['From Max'].default_value = outer; nt.links.new(ln.outputs['Value'], mr.inputs['Value'])
    rp = ramp(nt, [(0, (1, .97, .9, 1)), (.25, (1, .75, .35, 1)), (.7, (.85, .3, .05, 1)), (1, (.2, .03, 0, 1))]); nt.links.new(mr.outputs[0], rp.inputs['Fac'])
    fall = nt.nodes.new('ShaderNodeMath'); fall.operation = 'SUBTRACT'; fall.inputs[0].default_value = 1; nt.links.new(mr.outputs[0], fall.inputs[1])
    k1 = nt.nodes.new('ShaderNodeMath'); k1.operation = 'MULTIPLY'; nt.links.new(fall.outputs[0], k1.inputs[0]); nt.links.new(nz.outputs['Fac'], k1.inputs[1])
    k2 = nt.nodes.new('ShaderNodeMath'); k2.operation = 'MULTIPLY'; k2.inputs[1].default_value = strength; nt.links.new(k1.outputs[0], k2.inputs[0])
    em = nt.nodes.new('ShaderNodeEmission'); nt.links.new(rp.outputs['Color'], em.inputs['Color']); nt.links.new(k2.outputs[0], em.inputs['Strength'])
    tr = nt.nodes.new('ShaderNodeBsdfTransparent'); ad_ = nt.nodes.new('ShaderNodeAddShader')
    nt.links.new(tr.outputs[0], ad_.inputs[0]); nt.links.new(em.outputs[0], ad_.inputs[1]); nt.links.new(ad_.outputs[0], out.inputs['Surface']); return m
def anell(name, r1, r2, mat, c):
    bpy.ops.mesh.primitive_circle_add(vertices=256, radius=r2, fill_type='NGON'); o = bpy.context.object; o.name = name
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.inset(thickness=r2 - r1, depth=0); bpy.ops.mesh.delete(type='FACE'); bpy.ops.object.mode_set(mode='OBJECT')
    o.data.materials.append(mat); put(o, c); no_shadow(o); return o
DISC = anell('disc_acrecio', 2.6, 9, mat_disc('disc', 2.6, 9, 9), 'fn'); DISC.rotation_euler = (math.radians(4), 0, 0)
LENS = anell('imatge_lent', 2.05, 3.6, mat_disc('lent', 2.05, 3.6, 7), 'fn')   # la llum del darrere del disc, corbada per la gravetat
FOTO = anell('anell_fotons', 2.0, 2.12, emis('fotons', (1, .9, .75), 18), 'fn')

# ================================================================== escena 7: la Via Làctia (com al lab: 4 braços)
gco, gcol, grad = [], [], []
for i in range(150000):
    if R.random() < .22:
        r = abs(R.gauss(0, 3.2)); a = R.random() * 6.283; z = R.gauss(0, .9) * max(.2, 1 - r / 6); c = (1, .82 + .1 * R.random(), .55)
    else:
        arm = R.randrange(4); r = 2.5 + (R.random() ** .8) * 28; a = arm * math.pi / 2 + math.log(r) * 2.2 + R.gauss(0, .1 + 1.3 / r); z = R.gauss(0, .25)
        k = R.random(); c = (.62, .76, 1) if k < .55 else (1, .95, .85) if k < .9 else (1, .45, .65)
    gco.append((math.cos(a) * r, math.sin(a) * r, z)); gcol.append(c); grad.append(.012 + .03 * R.random() ** 5)
MGAL = mat_punts('gal', 5)
GAL = punts('galaxia', gco, gcol, grad, MGAL, 'gal')
halo = sphere('halo', 3.4, 48, 'gal'); halo.scale = (1, 1, .4); no_shadow(halo)
hm, hnt, hb, hout = newmat('halo'); hnt.nodes.remove(hb)
he = hnt.nodes.new('ShaderNodeEmission'); he.inputs['Color'].default_value = (1, .78, .45, 1); he.inputs['Strength'].default_value = .6
hlw = hnt.nodes.new('ShaderNodeLayerWeight'); hlw.inputs['Blend'].default_value = .5
hinv = hnt.nodes.new('ShaderNodeMath'); hinv.operation = 'SUBTRACT'; hinv.inputs[0].default_value = 1; hnt.links.new(hlw.outputs['Facing'], hinv.inputs[1])
hpw = hnt.nodes.new('ShaderNodeMath'); hpw.operation = 'POWER'; hpw.inputs[1].default_value = 3; hnt.links.new(hinv.outputs[0], hpw.inputs[0])
htr = hnt.nodes.new('ShaderNodeBsdfTransparent'); hmx = hnt.nodes.new('ShaderNodeMixShader')
hnt.links.new(hpw.outputs[0], hmx.inputs[0]); hnt.links.new(htr.outputs[0], hmx.inputs[1]); hnt.links.new(he.outputs[0], hmx.inputs[2]); hnt.links.new(hmx.outputs[0], hout.inputs['Surface'])
halo.data.materials.append(hm)
SM_A = math.pi / 2 + math.log(20) * 2.2 + .08; SOLAR = mu.Vector((math.cos(SM_A) * 20, math.sin(SM_A) * 20, 0))
MARCA = sphere('som_aqui', .3, 24, 'gal'); MARCA.location = SOLAR; MARCA.data.materials.append(emis('cian', (0, .9, 1), 25)); no_shadow(MARCA)
SGR = sphere('forat_central', .35, 32, 'gal'); SGR.data.materials.append(emis('negre2', (0, 0, 0), 0))

# ================================================================== escena 8: l'univers (galàxies petites + filaments)
mco, mcol, mrad = [], [], []
for i in range(9000):
    if R.random() < .3: r = abs(R.gauss(0, 2.5)); a = R.random() * 6.283; c = (1, .85, .6)
    else: arm = R.randrange(2); r = 1.5 + R.random() ** .8 * 14; a = arm * math.pi + math.log(r) * 2.4 + R.gauss(0, .15 + 1 / r); c = (.7, .8, 1)
    mco.append((math.cos(a) * r, math.sin(a) * r, R.gauss(0, .2))); mcol.append(c); mrad.append(.04 + .05 * R.random() ** 4)
MINI = punts('mini_galaxia', mco, mcol, mrad, mat_punts('mini', 6), 'uni'); MINI.hide_render = True
UNI_ROOT = bpy.data.objects.new('univers', None); COLL['uni'].objects.link(UNI_ROOT)
GALS = []
def galaxia_copia(pos, s, rot):
    o = MINI.copy(); COLL['uni'].objects.link(o); o.hide_render = False; o.location = pos; o.scale = (s, s, s); o.rotation_euler = rot; o.parent = UNI_ROOT; GALS.append(o); return o
ANDRO = galaxia_copia((140, 60, 30), 3.0, (1.2, .3, .5))   # Andròmeda
for i in range(70):
    d = mu.Vector((R.gauss(0, 1), R.gauss(0, 1), R.gauss(0, .6))).normalized() * R.uniform(220, 900)
    galaxia_copia(d, R.uniform(.8, 2.5), (R.random() * 3, R.random() * 3, R.random() * 3))
# xarxa còsmica: nusos (cúmuls) units per filaments
NUS = [mu.Vector((R.gauss(0, 1), R.gauss(0, 1), R.gauss(0, .7))) * 2600 for _ in range(55)]
wco, wcol, wrad = [], [], []
for i, a in enumerate(NUS):
    vei = sorted(NUS, key=lambda b: (b - a).length)[1:4]
    for b in vei:
        for k in range(260):
            t = R.random(); p = a.lerp(b, t) + mu.Vector((R.gauss(0, 1), R.gauss(0, 1), R.gauss(0, 1))) * 45
            wco.append(p[:]); c = R.random(); wcol.append((.45, .5, .95) if c < .5 else (.75, .6, 1) if c < .85 else (1, .8, .6)); wrad.append(1.4 + 3 * R.random() ** 3)
    for k in range(500):
        p = a + mu.Vector((R.gauss(0, 1), R.gauss(0, 1), R.gauss(0, 1))) * 110; wco.append(p[:]); wcol.append((1, .88, .75)); wrad.append(1.6 + 3.5 * R.random() ** 3)
WEB = punts('xarxa_cosmica', wco, wcol, wrad, mat_punts('web', 2.6), 'uni'); WEB.parent = UNI_ROOT
GALU = GAL.copy(); COLL['uni'].objects.link(GALU); GALU.parent = UNI_ROOT  # la nostra galàxia, al centre
BIGBANG = sphere('punt_bigbang', 1, 32, 'uni'); BIGBANG.data.materials.append(emis('bb', (1, .95, .85), 80)); no_shadow(BIGBANG)

# ================================================================== línies de velocitat (salts entre planetes)
import bmesh
bm = bmesh.new()
for i in range(500):
    a = R.random() * 6.283; rr = R.uniform(.25, 2.2); z0 = -R.uniform(3, 40); L = R.uniform(3, 12)
    x, y = math.cos(a) * rr, math.sin(a) * rr
    v1 = bm.verts.new((x, y, z0)); v2 = bm.verts.new((x + .004, y, z0)); v3 = bm.verts.new((x + .004, y, z0 - L)); v4 = bm.verts.new((x, y, z0 - L))
    bm.faces.new((v1, v2, v3, v4))
wme = bpy.data.meshes.new('warp'); bm.to_mesh(wme); bm.free()
WARP = bpy.data.objects.new('warp', wme); COLL['warp'].objects.link(WARP); WARP.data.materials.append(emis('warp', (.75, .88, 1), 6)); no_shadow(WARP)

# ================================================================== càmera i compositor
cam = bpy.data.cameras.new('cam'); co = bpy.data.objects.new('cam', cam); sc.collection.objects.link(co); sc.camera = co
cam.clip_start = .01; cam.clip_end = 20000
WARP.parent = co
def look_up(pos, tgt, upv, lens=35):
    """Càmera mirant tgt amb la vertical de la imatge alineada amb upv."""
    f = (mu.Vector(tgt) - mu.Vector(pos)).normalized(); r = f.cross(mu.Vector(upv)).normalized(); u = r.cross(f)
    m = mu.Matrix((r, u, -f)).transposed(); co.location = pos; co.rotation_euler = m.to_euler(); cam.lens = lens
def look(pos, tgt, lens=35, roll=0.0):
    co.location = pos; d = mu.Vector(tgt) - mu.Vector(pos)
    q = d.to_track_quat('-Z', 'Y')
    if roll: q = q @ mu.Quaternion((0, 0, 1), roll)
    co.rotation_euler = q.to_euler(); cam.lens = lens
ct = bpy.data.node_groups.new('comp', 'CompositorNodeTree'); sc.compositing_node_group = ct
rl = ct.nodes.new('CompositorNodeRLayers'); ct.interface.new_socket('Image', in_out='OUTPUT', socket_type='NodeSocketColor'); cout = ct.nodes.new('NodeGroupOutput')
gl = ct.nodes.new('CompositorNodeGlare'); gl.inputs['Type'].default_value = 'Bloom'; gl.inputs['Threshold'].default_value = 1.2
if 'Strength' in gl.inputs: gl.inputs['Strength'].default_value = .45
ct.links.new(rl.outputs['Image'], gl.inputs[0]); ct.links.new(gl.outputs[0], cout.inputs[0])

# ================================================================== moviments
def ease(t): return t * t * (3 - 2 * t)
def lerp(a, b, t): return a + (b - a) * t
def vl(a, b, t): return mu.Vector(a).lerp(mu.Vector(b), t)
def show(*names):
    for n, c in COLL.items(): c.hide_render = n not in names

# escena 5: parades del viatge
STOPS = [('mercuri', 3.3), ('venus', 3.6), ('mart', 3.6), ('asteroides', 4.6), ('jupiter', 4.4), ('saturn', 4.6), ('ura', 3.8), ('neptu', 3.8), ('pluto', 5.3)]
assert abs(sum(d for _, d in STOPS) - 37) < .01
WARP_T = .9  # segons de salt al principi de cada parada
def stop_target(sid):
    if sid == 'asteroides': return (mu.Vector((math.cos(AST_ANG) * 22, math.sin(AST_ANG) * 22, 0)) * .55 + COM_POS * .45), 1.2
    pid = sid; r = [x[2] for x in PL if x[0] == pid][0]; return P[pid].location.copy(), r
def stop_cam(sid, u):
    """u: 0..1 dins de la parada (després del salt). Mig gir al voltant de l'astre, sempre amb el Sol de costat."""
    c, r = stop_target(sid); sdir = (-c).normalized(); side = mu.Vector((-sdir.y, sdir.x, 0))
    dist = {'saturn': 15, 'asteroides': 6}.get(sid, max(2.6, r * 3.6))
    a = lerp(-.9, .5, u)
    off = (side * math.cos(a) + sdir * math.sin(a)) * dist + mu.Vector((0, 0, dist * .22))
    return c + off, c

def pose(esc, t, T):
    e = ease(t)
    sc.cycles.use_denoising = esc not in ('galaxia', 'univers')
    WARP.hide_render = True; VL_STR.default_value = 0; STAR_STR.default_value = 1
    SOLDISC.hide_render = esc not in ('astronauta', 'gir360')
    if esc == 'astronauta':
        show('terra', 'cel'); CEL_ROOT.location = co.location
        TERRA.location = (0, 0, 0)
        sdir = circ(GIR['sol']); SUNL.rotation_euler = (-sdir).to_track_quat('-Z', 'Y').to_euler()
        up = mu.Vector((0, 0, 1))
        up = (up - sdir * up.dot(sdir)).normalized()                     # vertical perpendicular a la llum del Sol
        side = sdir.cross(up).normalized()
        pn = (sdir * .55 + up * .8 - side * .25).normalized()          # punt sobre la cara de dia
        h = lerp(1.32, 1.55, e); p = pn * h                                # com des de l'Estació Espacial i pujant
        fwd = (side - pn * side.dot(pn)).normalized()
        dip = math.acos(1 / h)                                            # angle de l'horitzó per sota de l'horitzontal
        def dirdown(a): return (fwd * math.cos(a) - pn * math.sin(a)).normalized()
        LLUNA.location = p + dirdown(dip - math.radians(7)) * 9           # la Lluna, just per sobre de l'horitzó
        vd = dirdown(dip + math.radians(8))
        look_up(p, p + vd, pn, 22)                                        # l'horitzó a la part de dalt de la imatge
        # girem la Terra perquè sota la càmera quedi Europa (venim de Barcelona)
        b_ = p.dot(vd); hit = p - vd * (b_ + math.sqrt(max(0, b_ * b_ - p.length_squared + 1)))
        TERRA.rotation_euler = (math.radians(23.44), 0, europa_z(hit.normalized()) + T * .015)
        CEL_ROOT.location = co.location; SOLDISC.location = co.location + sdir * CEL_R * .95
        for m in LINE_MATS: m.node_tree.nodes['Emission'].inputs['Strength'].default_value = 0
    elif esc == 'gir360':
        show('terra', 'cel'); VL_STR.default_value = 1.6
        TERRA.location = EARTH4; TERRA.rotation_euler = (math.radians(23.44), 0, 1.9 + T * .03)
        sdir = SUN_DIR; SUNL.rotation_euler = (-sdir).to_track_quat('-Z', 'Y').to_euler()
        LLUNA.location = CAM4 + circ(GIR['lluna']) * 9
        CEL_ROOT.location = CAM4; SOLDISC.location = CAM4 + sdir * CEL_R * .95
        deg = GIR['terra'] + 360 * e
        fwd = circ(deg, 0)
        look(CAM4, CAM4 + fwd, 24, roll=0)
        # les línies de les constel·lacions s'encenen quan les mirem
        for cn, m in zip(CONST, LINE_MATS):
            vis = max(0, fwd.dot(CONST_DIR[cn]) - .85) / .15
            m.node_tree.nodes['Emission'].inputs['Strength'].default_value = 6 * min(1, vis * 1.6)
    elif esc == 'planetes':
        show('ss', 'ast', 'cometa', 'warp')
        acc = 0
        for k, (sid, dur) in enumerate(STOPS):
            if T < acc + dur or k == len(STOPS) - 1: break
            acc += dur
        tl = T - acc
        p1, c1 = stop_cam(sid, 0)
        if tl < WARP_T and k > 0:   # salt des de la parada anterior
            pp, cp = stop_cam(STOPS[k - 1][0], 1); w_ = ease(tl / WARP_T)
            look(vl(pp, p1, w_), vl(cp, c1, min(1, w_ * 1.5)), 32); WARP.hide_render = False
            WARP.scale = (1, 1, 1 + 3 * math.sin(math.pi * w_))
        else:
            u = (tl - (WARP_T if k > 0 else 0)) / (dur - (WARP_T if k > 0 else 0))
            p, c = stop_cam(sid, ease(min(1, u))); look(p, c, 32)
        for i, r_ in enumerate(ROQ):  # roques que passen a prop durant la parada dels asteroides
            ca, _ = stop_target('asteroides'); r_.location = ca + mu.Vector((math.cos(i * 1.7) * (1.2 + i * .3), math.sin(i * 2.3) * (1.4 + i * .25), math.sin(i) * .5))
            r_.rotation_euler = (T * .3 + i, T * .2, i)
        P['terra'].rotation_euler.z = T * .5; P['jupiter'].rotation_euler.z = T * .3
    elif esc == 'foratnegre':
        show('fn'); STAR_STR.default_value = 1
        ang = T * lerp(.2, 2.2, e); dist = lerp(42, 1.6, e ** 1.6)
        p = mu.Vector((math.cos(ang) * dist, math.sin(ang) * dist, dist * lerp(.16, .03, e)))
        look(p, (0, 0, 0), lerp(30, 22, e), roll=e * 1.2)
        to_cam = (p - FN.location).normalized()
        q = to_cam.to_track_quat('Z', 'Y')
        LENS.rotation_euler = q.to_euler(); FOTO.rotation_euler = q.to_euler()
        DISC.rotation_euler = (math.radians(4), 0, -T * .4)
    elif esc == 'galaxia':
        show('gal'); STAR_STR.default_value = .7
        GAL.rotation_euler = (0, 0, T * .015); MARCA.location = mu.Matrix.Rotation(T * .015, 4, 'Z') @ SOLAR
        p = vl((5, -15, 7), (0, -18, 62), e); tgt = vl((0, 0, 0), (0, 0, 0), 1)
        look(p, tgt, lerp(22, 30, e))
        ms = 1 + .6 * math.sin(T * 4) ** 2; MARCA.scale = (ms,) * 3
    elif esc == 'univers':
        show('uni'); STAR_STR.default_value = .25
        k = min(1, t / .82); kk = ease(k)
        dist = 60 * math.exp(kk * math.log(9000 / 60))
        p = mu.Vector((0, -dist * .75, dist * .55)); look(p, (0, 0, 0), 30)
        if t > .82:   # l'univers s'encongeix fins a un punt: el big bang
            s = max(.002, 1 - ease((t - .82) / .18)); UNI_ROOT.scale = (s,) * 3
            BIGBANG.scale = (dist * .004 * (1 - s) + .001,) * 3
        else:
            UNI_ROOT.scale = (1, 1, 1); BIGBANG.scale = (.001,) * 3
        UNI_ROOT.rotation_euler = (0, 0, T * .02)

_EUZ = {}
def uv_point(obj, lat, lon):
    me = obj.data; uvl = me.uv_layers.active.data; u0, v0 = (lon + 180) / 360, (lat + 90) / 180; best, bp = 9, None
    for pg in me.polygons:
        u = sum(uvl[i].uv.x for i in pg.loop_indices) / pg.loop_total; v = sum(uvl[i].uv.y for i in pg.loop_indices) / pg.loop_total
        dd = (u - u0) ** 2 + (v - v0) ** 2
        if dd < best: best, bp = dd, pg.center.copy()
    return bp.normalized()
EUROPA = None
def europa_z(target):
    """Rotació de la Terra (eix inclinat) que acosta el sud d'Europa (40° N, 5° E) a la direcció target."""
    global EUROPA
    key = tuple(round(x, 1) for x in target)
    if key in _EUZ: return _EUZ[key]
    if EUROPA is None: EUROPA = uv_point(TERRA, 40, 5)
    best = None
    for k in range(360):
        z = k / 360 * 2 * math.pi; m = mu.Euler((math.radians(23.44), 0, z)).to_matrix()
        v = (m @ EUROPA).dot(target)
        if best is None or v > best[0]: best = (v, z)
    _EUZ[key] = best[1]; return best[1]

def nframes(esc): return [d for e, d in ESC if e == esc][0] * A.fps

# ================================================================== guió (rètols i comptador) → guio.json
TEXTS = {
    'astronauta': [("Ara ets astronauta.", 1.0, 6.5)],
    'gir360': [], 'planetes': [], 'foratnegre': [("Un forat negre!", 1.0, 4.5), ("Imagina que ens pogués portar a l'altra punta de la galàxia…", 5.0, 11.0)],
    'galaxia': [("La Via Làctia, la nostra galàxia", 2.5, 7.0), ("Al centre hi ha un forat negre gegant", 7.5, 11.5)],
    'univers': [("Hi ha milers de milions de galàxies", 1.5, 7.5), ("Tot va començar fa uns 14.000 milions d'anys: el big bang", 8.0, 11.8)]}
DADES = {'mercuri': "Planeta rocós · el més proper al Sol", 'venus': "Planeta rocós · el més calent, uns 460 °C", 'mart': "Planeta rocós · el planeta vermell",
         'asteroides': "Milers de roques entre Mart i Júpiter", 'jupiter': "Gegant gasós · el planeta més gran", 'saturn': "Gegant gasós · anells de gel i roca",
         'ura': "Gegant de gel · gira de costat", 'neptu': "Gegant de gel · el planeta més llunyà", 'pluto': "Planeta nan · més enllà de Neptú"}
NOMS = {'asteroides': "Cinturó d'asteroides", **{p[0]: p[1] for p in PL}}
DIST = {'mercuri': 77, 'venus': 41, 'mart': 78, 'asteroides': 300, 'jupiter': 628, 'saturn': 1275, 'ura': 2720, 'neptu': 4350, 'pluto': 5900}  # milions de km (aprox., quan està més a prop de la Terra; Plutó: distància mitjana)

def etiquetes(esc):
    out = []
    D = nframes(esc) / A.fps
    if esc == 'gir360':
        objs = [('La Terra', lambda: TERRA.matrix_world.translation), ('La Lluna, el nostre satèl·lit', lambda: LLUNA.matrix_world.translation),
                ('El Sol, una estrella', lambda: SOLDISC.matrix_world.translation), ('Orió', lambda: CAM4 + CONST_DIR['Orió'] * CEL_R),
                ("L'Ossa Major", lambda: CAM4 + CONST_DIR['Ossa Major'] * CEL_R)] + [(nm, (lambda o=o: o.matrix_world.translation)) for nm, o in PDOTS.items()]
        actiu = {}
        n = nframes(esc)
        for f in range(0, n, 3):
            pose(esc, f / (n - 1), f / A.fps); bpy.context.view_layer.update()
            for nm, fn in objs:
                v = world_to_camera_view(sc, co, fn()); vis = v.z > 0 and .3 < v.x < .7 and .15 < v.y < .85
                if vis and nm not in actiu: actiu[nm] = f / A.fps
                if not vis and nm in actiu:
                    t0 = actiu.pop(nm)
                    if f / A.fps - t0 > .6: out.append(dict(text=nm, ini=round(t0, 2), fi=round(f / A.fps, 2)))
        out.append(dict(text="Tot això ens envolta.", ini=round(D - 3.2, 2), fi=round(D - .3, 2), estil='sub'))
    if esc == 'planetes':
        acc = 0
        for k, (sid, dur) in enumerate(STOPS):
            a0 = acc + (WARP_T if k else 0) + .2
            out.append(dict(text=NOMS[sid], sub=DADES[sid], ini=round(a0, 2), fi=round(acc + dur - .15, 2)))
            acc += dur
    for txt, a, b in TEXTS.get(esc, []): out.append(dict(text=txt, ini=a, fi=b, estil='sub'))
    return sorted(out, key=lambda d: d['ini'])

def comptador(esc):
    """Valors del comptador «Distància a l'escola» al llarg de l'escena: [(segons, text)]."""
    D = nframes(esc) / A.fps
    if esc == 'astronauta': return [(0, '20.000 km'), (D, '36.000 km')]
    if esc == 'gir360': return [(0, '36.000 km'), (D, '384.400 km')]
    if esc == 'planetes':
        out, acc = [], 0
        for k, (sid, dur) in enumerate(STOPS):
            out.append((acc + (WARP_T if k else 0), '%s milions de km' % format(DIST[sid], ',').replace(',', '.'))); acc += dur
        return out
    if esc == 'foratnegre': return [(0, '6.000 milions de km'), (D, '???')]
    if esc == 'galaxia': return [(0, '26.000 anys llum (del centre)'), (D, '26.000 anys llum (del centre)')]
    if esc == 'univers': return [(0, '2,5 milions d\'anys llum (Andròmeda)'), (D * .6, 'milers de milions d\'anys llum'), (D, '∞')]
    return []

def escriu_meta():
    caps, t0 = [], 0.0
    for i, (eid, dur) in enumerate(ESC):
        caps.append(dict(num=NUM0 + i, id=eid, ini=round(t0, 2), fi=round(t0 + dur, 2), etiquetes=etiquetes(eid), comptador=comptador(eid))); t0 += dur
    json.dump(dict(titol="De la porta de l'escola a tot l'univers", unitat="Coneixement del Medi 6è · Unitat 4", fps=A.fps, durada=t0, escenes=caps),
              open(os.path.join(HERE, 'guio.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    print('guio.json escrit:', t0, 's')

# ================================================================== render
if A.meta: escriu_meta(); sys.exit(0)
sel = [e for e, _ in ESC] if A.esc == 'all' else [ESC[int(x) - NUM0][0] for x in A.esc.split(',')]
for i, (eid, dur) in enumerate(ESC):
    if eid not in sel: continue
    n = dur * A.fps
    if A.frames:
        if ',' in A.frames or ':' not in A.frames: rng = [int(x) for x in A.frames.split(',') if int(x) < n]
        else:
            p_ = [int(x) for x in A.frames.split(':')]; rng = range(p_[0], min(n, p_[1]), p_[2] if len(p_) > 2 else 1)
    else: rng = range(n)
    od = os.path.join(A.out, '%02d_%s' % (NUM0 + i, eid)); os.makedirs(od, exist_ok=True)
    for f in rng:
        fn = os.path.join(od, 'f%04d.png' % f)
        if os.path.exists(fn) and not A.frames: continue
        pose(eid, f / max(1, n - 1), f / A.fps); sc.render.filepath = fn
        t0 = time.time(); bpy.ops.render.render(write_still=True); print('ESC', NUM0 + i, eid, 'FRAME', f, '/', n, round(time.time() - t0, 1), 's', flush=True)
if A.esc == 'all' and not A.frames: escriu_meta()
