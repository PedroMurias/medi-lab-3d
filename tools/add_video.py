"""Injecta src/shared/video.js + la configuració de vídeos a cada labs/*.html (idempotent).
Ús: python3 tools/add_video.py   (des de l'arrel del repo)"""
import json, re, os

def q(t,o,ok,why): return {'t':t,'o':o,'ok':ok,'why':why}
FORMES = [
 {'src':'../clips/espelma.mp4','poster':'../clips/espelma.jpg','title':'Espelma','cap':'Encenem una espelma amb un llumí',
  'q':q("Quina transformació d'energia has vist a l'espelma?",['Química → tèrmica i lluminosa','Elèctrica → lluminosa','Mecànica → tèrmica'],0,"L'energia química de la cera es transforma en energia tèrmica (calor) i lluminosa (llum).")},
 {'src':'../clips/radiador.mp4','poster':'../clips/radiador.jpg','title':'Radiador','cap':'Endollem un radiador elèctric',
  'q':q('Quina transformació fa el radiador?',['Química → tèrmica','Elèctrica → tèrmica','Elèctrica → mecànica'],1,"L'electricitat passa per la resistència, que s'escalfa: energia elèctrica → tèrmica.")},
 {'src':'../clips/ventilador.mp4','poster':'../clips/ventilador.jpg','title':'Ventilador','cap':'Engeguem un ventilador',
  'q':q('Quina transformació fa el ventilador?',['Tèrmica → elèctrica','Elèctrica → lluminosa','Elèctrica → mecànica'],2,"El motor transforma l'energia elèctrica en energia mecànica: les aspes giren i mouen l'aire.")},
 {'src':'../clips/llanterna.mp4','poster':'../clips/llanterna.jpg','title':'Llanterna','cap':'Posem piles a una llanterna',
  'q':q('Quina cadena de transformacions hi ha a la llanterna?',['Química → elèctrica → lluminosa','Elèctrica → química','Lluminosa → elèctrica'],0,"Les piles guarden energia química, que es converteix en elèctrica i, a la bombeta, en lluminosa.")},
 {'src':'../clips/aerogenerador.mp4','poster':'../clips/aerogenerador.jpg','title':'Aerogenerador','cap':'Un molí de vent que fa electricitat',
  'q':q("Quina transformació fa l'aerogenerador?",['Elèctrica → mecànica','Mecànica (vent) → elèctrica','Lluminosa → elèctrica'],1,"El vent fa girar les aspes (energia mecànica) i el generador la transforma en energia elèctrica.")},
]
CFG = {
 'cos': {'intro': {'src':'../clips/cos.mp4','poster':'../clips/cos.jpg','unit':'Medi·Lab 3D · Unitat 1','title':'🫀 El cos humà','sub':'Una màquina perfecta que treballa sense parar'}},
 'ecosistemes': {'intro': {'src':'../clips/ecosistemes.mp4','poster':'../clips/ecosistemes.jpg','unit':'Medi·Lab 3D · Unitat 3','title':'🌳 Els ecosistemes','sub':'Del bosc a la bassa i al fons del mar'}},
 'univers': {'intro': {'src':'../clips/univers.mp4','poster':'../clips/univers.jpg','unit':'Medi·Lab 3D · Unitat 4','title':'🌌 L\'univers','sub':'Un viatge des del Sol fins a la Terra'}},
 'espanya': {'intro': {'src':'../clips/espanya.mp4','poster':'../clips/espanya.jpg','unit':'Medi·Lab 3D · Unitat 5','title':'⛰️ Espanya i Europa','sub':'Muntanyes, rius i paisatges'}},
 'energia': {
   'intro': {'src':'../clips/energia.mp4','poster':'../clips/energia.jpg','unit':'Medi·Lab 3D · Unitat 6','title':'⚡ L\'energia','sub':'D\'on ve l\'energia que fem servir cada dia?'},
   'cards': {'formes': FORMES, 'fonts': [{'src':'../clips/energia.mp4','poster':'../clips/energia.jpg','title':'Un parc d\'energia renovable','cap':'Molins i plaques solars de veritat','dur':8,
      'q':{'t':'Quines dues fonts d\'energia renovable hi has vist?','o':['El vent i el Sol','El carbó i el petroli','L\'urani i el gas natural'],'ok':0,
           'why':'Els aerogeneradors aprofiten el vent i les plaques solars, la llum del Sol.'}}]}},
}
JS = open('src/shared/video.js').read()
for lab, cfg in CFG.items():
    p = f'labs/{lab}.html'; s = open(p).read()
    s = re.sub(r'\n?<!--VIDEO-->.*?<!--/VIDEO-->\n?', '', s, flags=re.S)
    block = '\n<!--VIDEO--><script>window.VCLIPS=' + json.dumps(cfg, ensure_ascii=False) + ';</script><script>' + JS + '</script><!--/VIDEO-->'
    i = s.rfind('</body>'); s = s[:i] + block + '\n' + s[i:]
    open(p, 'w').write(s); print(lab, 'ok')
