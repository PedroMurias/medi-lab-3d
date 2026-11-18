# Vídeos renderitzats amb Blender (Medi·Lab 3D)

Escenes 100 % procedurals (sense assets externs) renderitzades amb Cycles.
Funcionen amb el mòdul `bpy` (pip) o amb Blender ≥ 4.2 en mode background.

## Requisits
```
pip install bpy numpy          # o bé: blender -b -P script.py -- args
pip install pillow             # només per preparar el DEM
ffmpeg                         # per muntar el vídeo
```

## Vol sobre Espanya (`vol_espanya.py`)
Relleu real a partir del mapa d'alçades (`dem_espanya_h.npy`, metres, 846×501, lon0=-11.9, lat1=44.4, pas 0.02°).
```
python vol_espanya.py -- <frame_ini> <frame_fi> <amplada_px> <mostres>
python vol_espanya.py -- 0 59 1920 64        # 60 fotogrames (NF a l'script), 1080p
ffmpeg -framerate 12 -i out/f%04d.png -vf "minterpolate=fps=24" -c:v libx264 -crf 18 vol_espanya.mp4
```
El script llegeix `/tmp/bl/h.npy` i escriu a `/tmp/bl/out/`: canvia les rutes al principi si cal.

## Viatge per l'Univers (`viatge_univers.py`)
```
python viatge_univers.py -- keys 1 5 1920 48      # 5 fotogrames clau (k1..k5)
python viatge_univers.py -- anim 0 224 1920 48    # animació (FPS i DUR a l'script)
ffmpeg -framerate 12 -i univ/a%04d.png -vf "minterpolate=fps=24" -c:v libx264 -crf 18 viatge_univers.mp4
```
Escenes: 1 Terra des de l'òrbita · 2 Terra i Lluna · 3 translació · 4 travelling de planetes · 5 sistema solar amb òrbites.
Per a la versió final: `FPS=12` i allargar `DUR[3]` (travelling) a 20 s.

## Rendiment orientatiu
- 2 nuclis CPU (sandbox): 20-45 s per fotograma a 960×540.
- RTX 4060 (Cycles OptiX/CUDA: `sc.cycles.device='GPU'` + preferències): 1-3 s per fotograma a 1080p.
