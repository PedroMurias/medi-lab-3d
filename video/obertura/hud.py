"""
Casc d'astronauta (HUD) per al vídeo d'obertura: vora del visor, marques en cian,
comptador «Distància a l'escola» i rètols. Es dibuixa a sobre dels fotogrames,
així els textos es poden canviar sense tornar a renderitzar.

  python hud.py --demo entrada.png sortida.png --dist "384.400 km" --nom "La Lluna" --sub "El nostre satèl·lit"
"""
import argparse, math, os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

CIAN = (0, 229, 255)
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
FONTB = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
for cand in [r'C:\Windows\Fonts\segoeui.ttf', r'C:\Windows\Fonts\arial.ttf']:
    if not os.path.exists(FONT) and os.path.exists(cand): FONT = FONTB = cand

def visor(w, h):
    """Capa RGBA: vora fosca i difuminada del casc + reflex suau + marques en cian."""
    k = w / 1920
    m = Image.new('L', (w, h), 0); d = ImageDraw.Draw(m)
    d.rounded_rectangle((int(-60 * k), int(-40 * k), int(w + 60 * k), int(h + 40 * k)), radius=int(420 * k), fill=255)
    m = m.filter(ImageFilter.GaussianBlur(70 * k))
    edge = Image.new('RGBA', (w, h), (2, 4, 8, 255)); edge.putalpha(m.point(lambda v: int((255 - v) * .92)))
    lay = Image.new('RGBA', (w, h), (0, 0, 0, 0)); lay.alpha_composite(edge)
    # reflex del vidre (arc molt suau a dalt a l'esquerra)
    rf = Image.new('L', (w, h), 0); dr = ImageDraw.Draw(rf)
    dr.arc((int(-.3 * w), int(-.55 * h), int(.9 * w), int(.9 * h)), 200, 250, fill=40, width=int(60 * k))
    rf = rf.filter(ImageFilter.GaussianBlur(30 * k)); ref = Image.new('RGBA', (w, h), (200, 230, 255, 0)); ref.putalpha(rf); lay.alpha_composite(ref)
    d2 = ImageDraw.Draw(lay); L = int(46 * k); t = max(2, int(3 * k)); mx, my = int(120 * k), int(90 * k)
    for (x, y, sx, sy) in [(mx, my, 1, 1), (w - mx, my, -1, 1), (mx, h - my, 1, -1), (w - mx, h - my, -1, -1)]:
        d2.line([(x, y), (x + sx * L, y)], fill=CIAN + (170,), width=t); d2.line([(x, y), (x, y + sy * L)], fill=CIAN + (170,), width=t)
    cx, cy, r = w // 2, h // 2, int(14 * k)   # mira central molt discreta
    d2.ellipse((cx - r, cy - r, cx + r, cy + r), outline=CIAN + (90,), width=max(1, int(2 * k)))
    return lay

def textos(lay, dist=None, nom=None, sub=None, frase=None):
    w, h = lay.size; k = w / 1920; d = ImageDraw.Draw(lay)
    if dist:
        f1 = ImageFont.truetype(FONT, int(24 * k)); f2 = ImageFont.truetype(FONTB, int(38 * k))
        x = w - int(180 * k); y = int(128 * k)
        d.text((x, y), "DISTÀNCIA A L'ESCOLA", font=f1, fill=CIAN + (220,), anchor='ra')
        d.text((x, y + int(32 * k)), dist, font=f2, fill=(255, 255, 255, 240), anchor='ra', stroke_width=max(1, int(2 * k)), stroke_fill=(0, 0, 0, 170))
    if nom:
        f3 = ImageFont.truetype(FONTB, int(60 * k)); f4 = ImageFont.truetype(FONT, int(32 * k))
        y = h - int(230 * k)
        d.text((w // 2, y), nom, font=f3, fill=(255, 255, 255, 245), anchor='ma', stroke_width=max(1, int(2 * k)), stroke_fill=(0, 0, 0, 160))
        if sub:
            tw = d.textlength(nom, font=f3); d.line([(w // 2 - tw / 2, y + int(78 * k)), (w // 2 + tw / 2, y + int(78 * k))], fill=CIAN + (200,), width=max(2, int(3 * k)))
            d.text((w // 2, y + int(92 * k)), sub, font=f4, fill=(220, 240, 255, 240), anchor='ma', stroke_width=max(1, int(2 * k)), stroke_fill=(0, 0, 0, 200))
    if frase:
        f5 = ImageFont.truetype(FONT, int(40 * k))
        d.text((w // 2, h - int(140 * k)), frase, font=f5, fill=(255, 255, 255, 240), anchor='ma', stroke_width=max(1, int(2 * k)), stroke_fill=(0, 0, 0, 170))
    return lay

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--demo', nargs=2); ap.add_argument('--dist'); ap.add_argument('--nom'); ap.add_argument('--sub'); ap.add_argument('--frase')
    ap.add_argument('--sense-casc', action='store_true'); ap.add_argument('--capa', help='només desa la capa del casc (PNG transparent) amb aquesta mida: 1920x1080')
    A = ap.parse_args()
    if A.capa:
        w, h = map(int, A.capa.split('x')); visor(w, h).save('casc_%dx%d.png' % (w, h))
    if A.demo:
        im = Image.open(A.demo[0]).convert('RGBA'); lay = Image.new('RGBA', im.size, (0, 0, 0, 0)) if A.sense_casc else visor(*im.size)
        textos(lay, A.dist, A.nom, A.sub, A.frase); im.alpha_composite(lay); im.convert('RGB').save(A.demo[1])
