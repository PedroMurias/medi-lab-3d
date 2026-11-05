# Medi·Lab 3D

Laboratoris 3D interactius de **Coneixement del Medi · 6è de Primària** (llibre Santillana), en català.
Fets amb three.js, sense servidor: cada laboratori és un únic fitxer HTML que es pot obrir directament.

## Laboratoris (`labs/`)

| Fitxer | Unitat |
|---|---|
| `cos.html` | 1 · El cos humà: ossos, músculs, accions i lesions, nervis, sentits |
| `adolescencia.html` | 2 · L'adolescència: etapes de la vida, fecundació, embaràs, cicle |
| `ecosistemes.html` | 3 · Els ecosistemes: bosc, bassa, mar; cadenes, relacions, canvi climàtic |
| `univers.html` | 4 · L'univers, el sistema solar, la Terra, climes i paisatges |
| `espanya.html` | 5 · Espanya i Europa: territori, relleu, rius, climes, població |
| `energia.html` | 6 · L'energia: fonts, electricitat, circuits, a casa |
| `historia.html` | 7 · Viatge en el temps: línia del temps, Museu del temps, revolucions, govern, societat |
| `ciutadania.html` | 8-9 · Ciutadania i món: institucions, UE, riquesa, ODS, consum |

`index.html` és el hub amb l'accés a tots.

## Com funciona cada lab

- **Guia d'entrada** de 30 segons, nom i avatar de l'alumne, **col·lecció de descobriments** amb insígnies.
- **Reptes** amb segona oportunitat i pista; resultats guardats al navegador i exportables (pestanya *Resultats* de l'ajuda).
- **Eines del mestre** (👩‍🏫): mode pissarra, amagar text, pausa, dibuixar a sobre, pantalla completa.
  Dreceres: `1-6` seccions · `espai` pausa · `P` pissarra · `D` dibuixa · `T` text · `F` pantalla completa.
- **Mode passeig** (🚶) a Energia, Ecosistemes, Història i Ciutadania: primera persona amb fletxes/WASD o palanca tàctil.

## Compilar des dels fonts (`src/`)

Els labs es generen a partir de `src/labs/*.src.html` + mòduls compartits de `src/shared/` (kit, UX, visual, passeig, escenes).

```bash
# labs de la carpeta src/labs (cal ajustar les rutes dins de tools/build_labs.py)
python3 tools/build_labs.py adolescencia
# univers i cos tenen el seu propi build.py a src/univ i src/cos
```

Els actius grans (model del cos `assets/cos.js`, personatge MakeHuman `assets/mhdata.js`, textures NASA `src/univ/utex.js`) s'incrusten en base64 dins de l'HTML.

## Crèdits i llicències

- Model anatòmic: Z-Anatomy (CC BY-SA 4.0) · BodyParts3D (CC BY-SA 2.1 JP)
- Personatge realista: MakeHuman / MPFB (CC0)
- Animals i arbres low poly: Quaternius (CC0)
- Textures de la Terra i la Lluna: NASA (domini públic), via three.js
- Mapes: Natural Earth (domini públic)
- Codi: three.js (MIT)

Il·lustracions esquemàtiques generades per ordinador. Fet amb Claude per a l'aula.
