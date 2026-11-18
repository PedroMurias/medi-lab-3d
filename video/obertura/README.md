# Vídeo d'obertura «De la porta de l'escola a tot l'univers» · Unitat 4

Guió: document «Guion · Vídeo de apertura "Univers"» (claude.ai). Durada total prevista: uns 2 minuts.

| Escena | Què | Com es fa |
|---|---|---|
| 1 | Porta del Centre d'Estudis Jaume Balmes | Vídeo amb el mòbil (Pedro) |
| 2 | Zoom out de l'escola fins a la Terra | Google Earth Studio (gratuït per a educació, amb atribució visible) |
| 3-8 | Astronauta, gir de 360°, planetes, forat negre, galàxia, univers i big bang | `obertura.py` (Blender) |
| 9 | Tornada a la porta i preguntes | Vídeo de l'escena 1 |

## Fitxers
- `obertura.py` — escenes 3-8 amb Blender. Fa servir les textures de `../univers/textures`.
- `hud.py` — casc d'astronauta, comptador «Distància a l'escola» i rètols, a sobre dels fotogrames.
- `guio.json` — temps de cada escena, rètols (sincronitzats amb la càmera) i valors del comptador.

## Ús
```
python obertura.py -- --esc 4 --frames 95,147,199 --w 960 --spp 16    # fotogrames solts
python obertura.py -- --esc all --w 1920 --spp 64 --gpu                # tot, a la RTX 4060
```
Si s'atura, torna a llançar l'ordre: salta els fotogrames fets.
