"""Injecta src/shared/video.js + la configuració de vídeos a cada labs/*.html (idempotent).
Ús: python3 tools/add_video.py   (des de l'arrel del repo)"""
import json, re, os
CFG = {
 'cos': {'intro': {'src':'../clips/cos.mp4','poster':'../clips/cos.jpg','unit':'Medi·Lab 3D · Unitat 1','title':'🫀 El cos humà','sub':'Una màquina perfecta que treballa sense parar'}},
 'ecosistemes': {'intro': {'src':'../clips/ecosistemes.mp4','poster':'../clips/ecosistemes.jpg','unit':'Medi·Lab 3D · Unitat 3','title':'🌳 Els ecosistemes','sub':'Del bosc a la bassa i al fons del mar'}},
 'univers': {'intro': {'src':'../clips/univers.mp4','poster':'../clips/univers.jpg','unit':'Medi·Lab 3D · Unitat 4','title':'🌌 L\'univers','sub':'Un viatge des del Sol fins a la Terra'}},
 'espanya': {'intro': {'src':'../clips/espanya.mp4','poster':'../clips/espanya.jpg','unit':'Medi·Lab 3D · Unitat 5','title':'⛰️ Espanya i Europa','sub':'Muntanyes, rius i paisatges'}},
 'energia': {
   'intro': {'src':'../clips/energia.mp4','poster':'../clips/energia.jpg','unit':'Medi·Lab 3D · Unitat 6','title':'⚡ L\'energia','sub':'D\'on ve l\'energia que fem servir cada dia?'},
   'cards': {'fonts': [{'src':'../clips/energia.mp4','poster':'../clips/energia.jpg','title':'Un parc d\'energia renovable','cap':'Molins i plaques solars de veritat','dur':8,
      'q':{'t':'Quines dues fonts d\'energia renovable hi has vist?','o':['El vent i el Sol','El carbó i el petroli','L\'urani i el gas natural'],'ok':0,
           'why':'Els aerogeneradors aprofiten el vent i les plaques solars, la llum del Sol.'}}]}},
}
JS = open('src/shared/video.js').read()
for lab, cfg in CFG.items():
    p = f'labs/{lab}.html'; s = open(p).read()
    s = re.sub(r'\n?<!--VIDEO-->.*?<!--/VIDEO-->', '', s, flags=re.S)
    block = '\n<!--VIDEO--><script>window.VCLIPS=' + json.dumps(cfg, ensure_ascii=False) + ';</script><script>' + JS + '</script><!--/VIDEO-->'
    i = s.rfind('</body>'); s = s[:i] + block + '\n' + s[i:]
    open(p, 'w').write(s); print(lab, 'ok')
