"""
Genera la capa del casc (vora, contador i rètols) com a fotogrames PNG transparents
seguint guio.json, i la targeta final amb les preguntes.

  python capa_hud.py --out hud_frames --w 1920
  ffmpeg -framerate 24 -i hud_frames/h%04d.png -c:v qtrle hud.mov
"""
import argparse, json, os, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import hud

def fade(t, a, b, f=.35):
    if t < a or t > b: return 0.
    return max(0., min(1., (t - a) / f, (b - t) / f))

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--out', default='hud_frames'); ap.add_argument('--w', type=int, default=1920)
    ap.add_argument('--only', type=str, default=None, help='llista de fotogrames, per provar')
    A = ap.parse_args(); W = A.w; H = W * 9 // 16
    G = json.load(open(os.path.join(os.path.dirname(__file__), 'guio.json'))); fps = G['fps']; N = int(round(G['durada'] * fps))
    os.makedirs(A.out, exist_ok=True)
    base = hud.visor(W, H)
    cache = {}
    frames = range(N) if not A.only else [int(x) for x in A.only.split(',')]
    for i in frames:
        t = i / fps
        esc = next(e for e in G['escenes'] if e['ini'] <= t < e['fi'] + 1e-6)
        lt = t - esc['ini']
        # casc: entra en fosa durant el primer segon
        ka = min(1., t / 1.2)
        # comptador: valor vigent (esglaonat)
        dist = None
        dur = esc['fi'] - esc['ini']
        for (tt, v) in esc['comptador']:
            if lt >= min(tt, dur - 1.0) - 1e-6: dist = v
        # rètol actiu
        lab = None; la = 0.
        for e in esc['etiquetes']:
            a = fade(lt, e['ini'], e['fi'])
            if a > la: lab, la = e, a
        key = (round(ka, 2), dist, lab['text'] if lab else None, round(la, 2))
        out = os.path.join(A.out, 'h%04d.png' % i)
        if key in cache:
            # enllaç dur: mateixa imatge (estalvia temps i disc)
            if os.path.exists(out): os.remove(out)
            os.link(cache[key], out); continue
        lay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        b = base.copy()
        if ka < 1: b.putalpha(b.getchannel('A').point(lambda v: int(v * ka)))
        lay.alpha_composite(b)
        if dist: hud.textos(lay, dist=dist)
        if lab and la > 0:
            tl = Image.new('RGBA', (W, H), (0, 0, 0, 0))
            if lab.get('estil') == 'sub': hud.textos(tl, frase=lab['text'])
            else: hud.textos(tl, nom=lab['text'])
            tl.putalpha(tl.getchannel('A').point(lambda v: int(v * la)))
            lay.alpha_composite(tl)
        lay.save(out, compress_level=1); cache[key] = out
    print('fets', len(frames), 'fotogrames;', len(cache), 'diferents')

def targeta(path, W=1920, preguntes=None, peu=None, titol=None):
    """Fons negre amb estrelles i les preguntes finals (o el títol inicial)."""
    import random; random.seed(4)
    H = W * 9 // 16; k = W / 1920
    im = Image.new('RGB', (W, H), (2, 4, 10)); d = ImageDraw.Draw(im)
    for _ in range(900):
        x, y = random.random() * W, random.random() * H; r = random.random() ** 3 * 2.2 * k + .4
        c = int(120 + random.random() * 135); d.ellipse((x - r, y - r, x + r, y + r), fill=(c, c, min(255, c + 20)))
    im = im.filter(ImageFilter.GaussianBlur(.6 * k)); d = ImageDraw.Draw(im)
    FB = ImageFont.truetype(hud.FONTB, int(54 * k)); F = ImageFont.truetype(hud.FONT, int(46 * k)); FS = ImageFont.truetype(hud.FONT, int(30 * k))
    if titol:
        d.text((W // 2, H // 2 - int(40 * k)), titol[0], font=ImageFont.truetype(hud.FONTB, int(72 * k)), fill=(255, 255, 255), anchor='mm')
        d.line([(W // 2 - int(260 * k), H // 2 + int(20 * k)), (W // 2 + int(260 * k), H // 2 + int(20 * k))], fill=hud.CIAN, width=int(3 * k))
        d.text((W // 2, H // 2 + int(62 * k)), titol[1], font=FS, fill=(190, 225, 240), anchor='mm')
    if preguntes:
        y = H // 2 - int(len(preguntes) * 60 * k)
        for q in preguntes:
            d.text((W // 2, y), q, font=F, fill=(255, 255, 255), anchor='mm'); y += int(110 * k)
        if peu:
            d.rounded_rectangle((W // 2 - int(330 * k), y + int(10 * k), W // 2 + int(330 * k), y + int(100 * k)), radius=int(45 * k), outline=hud.CIAN, width=int(4 * k))
            d.text((W // 2, y + int(55 * k)), peu, font=FB, fill=hud.CIAN, anchor='mm')
    im.save(path)

if __name__ == '__main__':
    main()
