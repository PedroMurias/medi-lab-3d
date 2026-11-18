# Vídeo «Viatge per l'univers» · Medi·Lab 3D

Vídeo de 75 s que fa d'entrada al laboratori `labs/univers.html` (Coneixement del Medi 6è, Unitat 4).
Segueix els mateixos apartats que el lab i en fa servir les mateixes dades i textures:
la taula de planetes (radi, distància, període), les textures reals de la Terra i la Lluna,
i els textos i preguntes de cada apartat.

| # | Capítol | Durada | Què es veu | Pregunta (del lab) |
|---|---|---|---|---|
| 1 | El big bang | 6 s | Un esclat de llum que s'expandeix en milers d'estrelles | — |
| 2 | La Via Làctia | 10 s | Galàxia espiral de 4 braços; la càmera baixa fins al braç d'Orió | Com es diu la nostra galàxia? |
| 3 | El sistema solar | 18 s | Travelling del Sol a Plutó, amb el cinturó d'asteroides | Quants planetes té el sistema solar? |
| 4 | La rotació | 8 s | La Terra gira i Barcelona passa de la nit al dia | Què provoca la rotació? |
| 5 | La translació | 10 s | Volta al Sol amb l'eix inclinat: març, juny, setembre, desembre | Què provoca les estacions? |
| 6 | La Lluna i les fases | 9 s | Des de la Terra veiem la Lluna de nova a plena i a minvant | En quina fase no veiem la Lluna? |
| 7 | Les zones climàtiques | 7 s | Equador, tròpics i cercles polars; franges càlida, temperades i fredes | Quina zona hi ha entre els dos tròpics? |
| 8 | Explora-ho tu | 7 s | Tot el sistema solar amb les òrbites | — |

## Fitxers

- `univers_lab.py` — construeix l'escena a Blender i renderitza els fotogrames de cada capítol.
- `muntar.py` — ajunta els capítols amb fosa, i fa la versió amb subtítols i la portada.
- `capitols.json` — guió generat pel script: temps de cada capítol, subtítols en català,
  noms que surten a la pantalla (sincronitzats amb la càmera) i la pregunta de cada capítol.
  És el que llegirà el reproductor interactiu.
- `textures/` — les textures de la Terra (color, relleu, terra/mar) i de la Lluna, extretes del lab.

## Com es fa (al PC amb la RTX 4060)

```
pip install bpy            # Blender com a mòdul de Python (o instal·la Blender i fes servir blender -b -P)
# ffmpeg al PATH

# 1 · proves ràpides d'un capítol (1 fotograma de cada 24)
python univers_lab.py -- --cap 3 --frames 0:432:24 --w 960 --spp 16 --gpu

# 2 · el vídeo sencer, 1080p
python univers_lab.py -- --cap all --w 1920 --spp 64 --gpu

# 3 · muntatge
python muntar.py
```

- Si s'atura a mitges, torna a llançar la mateixa ordre: salta els fotogrames que ja existeixen.
- Per anar més ràpid: `--fps 12` al render (muntar.py interpola fins a 24).
- Temps orientatiu: CPU de 2 nuclis, uns 6 s per fotograma a 448 px; amb la RTX 4060 a 1080p,
  cal mesurar-ho (s'espera entre 1 i 4 s per fotograma, és a dir 30-120 min per a tot el vídeo a 24 fps).

## Per canviar coses

- Durades: llista `CAPS` al principi de `univers_lab.py`.
- Textos i preguntes: diccionari `GUIO` (després torna a fer `--meta` o el render complet).
- Càmeres i moviments: funció `pose()`, un bloc per capítol.
- Llum del Sol: `lfo.inputs['Strength']` (la llum no s'apaga amb la distància, com al lab).

Les distàncies i les mides no són a escala real (igual que al lab): el sistema solar real no cabria a la pantalla.
