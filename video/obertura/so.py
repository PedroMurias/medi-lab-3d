"""
Música i efectes del vídeo d'obertura, generats per programa (sense drets d'autor, cost zero).
  python so.py --demo out.wav       -> 40 s de mostra
  python so.py --guio guio.json --out banda.wav   -> banda sonora sencera seguint el guió
"""
import numpy as np, wave, argparse, json
SR = 44100
rng = np.random.default_rng(7)

def note(m): return 440 * 2 ** ((m - 69) / 12)

def lp(x, a):  # filtre passa-baixos d'un pol (a: 0..1, més petit = més fosc); a pot ser un vector
    y = np.empty_like(x); s = 0.0
    a = np.broadcast_to(a, x.shape)
    for i in range(len(x)): s += a[i] * (x[i] - s); y[i] = s
    return y

def lp_fast(x, cutoff):
    # passa-baixos en freqüència (per a senyals llargs)
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X / (1 + (f / cutoff) ** 4), len(x))

def pad(dur, chord, amp=.12, bright=900, seed=0):
    t = np.arange(int(dur * SR)) / SR; out = np.zeros_like(t)
    r = np.random.default_rng(seed)
    for m in chord:
        for det in (-.07, 0, .06):
            f = note(m) * 2 ** (det / 12); ph = r.random() * 6.28
            # dent de serra suau (pocs harmònics)
            s = sum(np.sin(2 * np.pi * f * k * t + ph * k) / k for k in range(1, 7))
            out += s
    out = lp_fast(out, bright) / (len(chord) * 3)
    env = np.minimum(1, t / 3) * np.minimum(1, (dur - t) / 3)
    return out * env * amp

def shimmer(dur, root=86, amp=.03, seed=1):
    t = np.arange(int(dur * SR)) / SR; out = np.zeros_like(t); r = np.random.default_rng(seed)
    for _ in range(int(dur * 1.2)):
        t0 = r.random() * dur; f = note(root + r.choice([0, 3, 7, 10, 12, 15]))
        e = np.exp(-np.maximum(0, t - t0) * 1.3) * (t >= t0)
        out += np.sin(2 * np.pi * f * t) * e * .5
    return lp_fast(out, 5000) * amp

def sub(dur, m=38, amp=.10):
    t = np.arange(int(dur * SR)) / SR
    return np.sin(2 * np.pi * note(m) * t) * amp * np.minimum(1, t / 4) * np.minimum(1, (dur - t) / 4)

def whoosh(dur=1.8, amp=.5):
    n = int(dur * SR); t = np.arange(n) / SR; x = rng.standard_normal(n)
    a = .004 + .11 * np.sin(np.pi * t / dur) ** 2         # obre i tanca el filtre
    y = lp(x, a) - lp(x, a * .25)                        # banda que s'escombra
    env = np.sin(np.pi * t / dur) ** 1.5
    return y * env * amp

def boom(dur=5, amp=.5):
    t = np.arange(int(dur * SR)) / SR; f = 55 * np.exp(-t * .5) + 22
    ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) + .3 * np.sin(2 * ph)) * np.exp(-t * .7) * np.minimum(1, t / .05) * amp

def rumble(dur, amp=.25):
    n = int(dur * SR); t = np.arange(n) / SR; x = lp_fast(rng.standard_normal(n), 90)
    return x / np.abs(x).max() * amp * np.minimum(1, t / dur) ** 2

def flash(dur=3, amp=.4):
    n = int(dur * SR); t = np.arange(n) / SR; x = rng.standard_normal(n)
    return lp_fast(x, 7000) * np.exp(-t * 2.5) * amp

def mix_at(buf, x, t, gain=1.0):
    i = int(t * SR); j = min(len(buf), i + len(x)); buf[i:j] += x[:j - i] * gain

PROG = [[50, 57, 62, 65], [46, 53, 58, 62], [43, 50, 55, 58, 62], [45, 52, 57, 61]]   # Rem - Sib - Solm - La (èpic suau)

def banda(dur, events, intens):
    """events: [(t, 'whoosh'|'boom'|'flash'|'rumble:durada')]; intens: [(t, 0..1)] intensitat musical"""
    buf = np.zeros(int(dur * SR) + SR)
    seg = 8.0; t = 0; k = 0
    while t < dur:
        ch = PROG[k % 4]; d = min(seg + 3, dur - t + 3)
        it = np.interp(t, *zip(*intens)) if intens else .7
        mix_at(buf, pad(d, ch, amp=.05 + .09 * it, bright=500 + 1400 * it, seed=k), max(0, t - 1.5))
        mix_at(buf, sub(d, ch[0] - 12, .04 + .06 * it), max(0, t - 1.5))
        if it > .35: mix_at(buf, shimmer(d, 86, .015 + .03 * it, seed=k + 9), max(0, t - 1.5))
        t += seg; k += 1
    for (te, kind) in events:
        if kind == 'whoosh': mix_at(buf, whoosh(), te - .8)
        elif kind == 'boom': mix_at(buf, boom(), te)
        elif kind == 'flash': mix_at(buf, flash(), te)
        elif kind.startswith('rumble'): d_ = float(kind.split(':')[1]); mix_at(buf, rumble(d_), te)
        elif kind.startswith('silenci'):   # silenci abans del big bang
            d_ = float(kind.split(':')[1]); i = int(te * SR); j = int((te + d_) * SR)
            buf[i:j] *= np.linspace(1, .05, j - i)
    buf = buf[:int(dur * SR)]
    # estèreo amb un petit retard (amplada) i normalització
    L = buf; R = np.concatenate([np.zeros(int(.012 * SR)), buf[:-int(.012 * SR)]])
    st = np.stack([L, R], 1); st /= max(1e-6, np.abs(st).max()) / .8
    return st

def save(path, st):
    x = (np.clip(st, -1, 1) * 32767).astype('<i2')
    with wave.open(path, 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(x.tobytes())

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--demo'); ap.add_argument('--guio'); ap.add_argument('--out', default='banda.wav')
    A = ap.parse_args()
    if A.demo:
        ev = [(8, 'whoosh'), (13, 'whoosh'), (18, 'whoosh'), (24, 'rumble:6'), (30, 'boom'), (33, 'flash')]
        save(A.demo, banda(40, ev, [(0, .2), (20, .7), (30, 1), (40, .6)]))
    if A.guio:
        G = json.load(open(A.guio)); save(A.out, banda(G['durada_total'], [tuple(e) for e in G['so']], [tuple(x) for x in G['intensitat']]))
