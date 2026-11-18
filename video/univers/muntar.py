"""
Munta el vídeo «Viatge per l'univers» a partir dels fotogrames de univers_lab.py.

Surt a la carpeta sortida/:
  viatge_univers.mp4         vídeo net (per al reproductor interactiu: hi posa títols i preguntes)
  viatge_univers_subt.mp4    vídeo amb títols, subtítols i noms cremats (per veure'l sol a la pissarra)
  viatge_univers.vtt         subtítols en català (WebVTT)
  viatge_univers.ass         subtítols amb estil (els que es cremen)
  portada.jpg                fotograma de portada

Ús:
  python muntar.py                      # els fps del render es llegeixen de capitols.json; surt a 24 fps
  python muntar.py --fps 30             # una altra cadència de sortida (interpola si cal)
  python muntar.py --w 1280             # escala de sortida
Cal ffmpeg (amb libass) al PATH.
"""
import json, os, subprocess, argparse, glob, shutil

HERE = os.path.dirname(os.path.abspath(__file__))
ap = argparse.ArgumentParser()
ap.add_argument('--render', default=os.path.join(HERE, 'render'))
ap.add_argument('--out', default=os.path.join(HERE, 'sortida'))
ap.add_argument('--fps', type=int, default=24, help='fps del vídeo final (si el render en té menys, s\'interpola)')
ap.add_argument('--w', type=int, default=0, help='amplada de sortida (0 = la dels fotogrames)')
ap.add_argument('--crf', type=int, default=18)
A = ap.parse_args()

M = json.load(open(os.path.join(HERE, 'capitols.json'), encoding='utf8'))
SRC = M['fps']; FPS = max(A.fps, SRC); FOSA = M.get('fosa', .5)
os.makedirs(A.out, exist_ok=True); tmp = os.path.join(A.out, '_clips'); os.makedirs(tmp, exist_ok=True)

def run(cmd):
    print(' '.join(cmd)[:160]); subprocess.run(cmd, check=True)

# 1 · un clip per capítol (fosa d'entrada i sortida)
clips = []
for c in M['capitols']:
    d = os.path.join(A.render, '%02d_%s' % (c['num'], c['id']))
    fs = sorted(glob.glob(os.path.join(d, 'f*.png')))
    if not fs:
        print('FALTEN fotogrames:', d); continue
    dur = c['fi'] - c['ini']; first = int(os.path.basename(fs[0])[1:5])
    vf = []
    if SRC != FPS: vf.append(f'minterpolate=fps={FPS}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1')
    if A.w: vf.append(f'scale={A.w}:-2:flags=lanczos')
    vf.append('tpad=stop_mode=clone:stop_duration=1')  # la interpolació perd l'últim fotograma: el reomplim
    vf += [f'fade=t=in:st=0:d={FOSA}', f'fade=t=out:st={dur - FOSA}:d={FOSA}', 'format=yuv420p']
    out = os.path.join(tmp, '%02d.mp4' % c['num'])
    run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(SRC), '-start_number', str(first), '-i', os.path.join(d, 'f%04d.png'),
         '-vf', ','.join(vf), '-r', str(FPS), '-frames:v', str(int(round(dur * FPS))), '-c:v', 'libx264', '-crf', str(A.crf), '-preset', os.environ.get('PRESET', 'medium'), out])
    clips.append(out)

# 2 · concatenar
lst = os.path.join(tmp, 'llista.txt')
with open(lst, 'w') as f:
    for c in clips: f.write("file '%s'\n" % c.replace('\\', '/'))
net = os.path.join(A.out, 'viatge_univers.mp4')
run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', '-movflags', '+faststart', net])

# 3 · subtítols: VTT (reproductor) i ASS (cremats)
def ts_vtt(t):
    h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60; return '%02d:%02d:%06.3f' % (h, m, s)
def ts_ass(t):
    h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60; return '%d:%02d:%05.2f' % (h, m, s)
vtt = ['WEBVTT', '']; ass_ev = []
for c in M['capitols']:
    t0 = c['ini']
    vtt += [f"{ts_vtt(t0 + .2)} --> {ts_vtt(t0 + 2.6)} line:8% align:start position:4%", f"{c['num']} · {c['titol']}", '']
    ass_ev.append(f"Dialogue: 0,{ts_ass(t0 + .2)},{ts_ass(t0 + 2.8)},Titol,,0,0,0,,{c['num']} · {c['titol']}")
    for s_ in c['subtitols']:
        vtt += [f"{ts_vtt(t0 + s_['ini'])} --> {ts_vtt(t0 + s_['fi'])}", s_['text'], '']
        ass_ev.append(f"Dialogue: 0,{ts_ass(t0 + s_['ini'])},{ts_ass(t0 + s_['fi'])},Sub,,0,0,0,,{s_['text']}")
    for e in c['etiquetes']:
        vtt += [f"{ts_vtt(t0 + e['ini'])} --> {ts_vtt(t0 + e['fi'])} line:16%", e['text'], '']
        ass_ev.append(f"Dialogue: 1,{ts_ass(t0 + e['ini'])},{ts_ass(t0 + e['fi'])},Nom,,0,0,0,,{e['text']}")
open(os.path.join(A.out, 'viatge_univers.vtt'), 'w', encoding='utf8').write('\n'.join(vtt))
W_ = A.w or 1920; H_ = int(W_ * 9 / 16); k = H_ / 1080
ass = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W_}
PlayResY: {H_}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Sub,DejaVu Sans,{int(44*k)},&H00FFFFFF,&H00FFFFFF,&H00000000,&H90000000,0,0,0,0,100,100,0,0,4,{max(1,int(2*k))},0,2,{int(160*k)},{int(160*k)},{int(60*k)},1
Style: Titol,DejaVu Sans,{int(52*k)},&H00FFE500,&H00FFE500,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,{max(1,int(3*k))},{max(1,int(2*k))},7,{int(60*k)},{int(60*k)},{int(50*k)},1
Style: Nom,DejaVu Sans,{int(40*k)},&H00FFFFFF,&H00FFFFFF,&H00402000,&H00000000,1,0,0,0,100,100,1,0,1,{max(1,int(3*k))},{max(1,int(2*k))},8,{int(60*k)},{int(60*k)},{int(140*k)},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
""" + '\n'.join(ass_ev) + '\n'
ass_path = os.path.join(A.out, 'viatge_univers.ass'); open(ass_path, 'w', encoding='utf8').write(ass)

# 4 · versió amb subtítols cremats i portada
cwd = os.getcwd(); os.chdir(A.out)  # el filtre ass vol una ruta senzilla
try:
    run(['ffmpeg', '-y', '-loglevel', 'error', '-i', 'viatge_univers.mp4', '-vf', f'scale={W_}:{H_},ass=viatge_univers.ass',
         '-c:v', 'libx264', '-crf', str(A.crf), '-preset', 'medium', '-movflags', '+faststart', 'viatge_univers_subt.mp4'])
    t_port = next((c['ini'] + 7 for c in M['capitols'] if c['id'] == 'sistema'), 1)
    run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', str(t_port), '-i', 'viatge_univers.mp4', '-frames:v', '1', '-q:v', '3', 'portada.jpg'])
finally:
    os.chdir(cwd)
if not os.environ.get('KEEP'): shutil.rmtree(tmp, ignore_errors=True)
print('Fet:', A.out)
