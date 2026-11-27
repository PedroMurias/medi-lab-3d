"""Injecta src/shared/video.js + la configuració de vídeos a cada labs/*.html (idempotent).
Ús: python3 tools/add_video.py   (des de l'arrel del repo)"""
import json, re, os

def q(t,o,ok,why): return {'t':t,'o':o,'ok':ok,'why':why}
FORMES = [
 {'src':'../clips/espelma.mp4','poster':'../clips/espelma.jpg','title':'Espelma','cap':'La flama d\'una espelma','dur':5,
  'q':q("Quina transformació d'energia has vist a l'espelma?",['Química → tèrmica i lluminosa','Elèctrica → lluminosa','Mecànica → tèrmica'],0,"L'energia química de la cera es transforma en energia tèrmica (calor) i lluminosa (llum).")},
 {'src':'../clips/radiador.mp4','poster':'../clips/radiador.jpg','title':'Radiador','cap':'Endollem un radiador elèctric',
  'q':q('Quina transformació fa el radiador?',['Química → tèrmica','Elèctrica → tèrmica','Elèctrica → mecànica'],1,"L'electricitat passa per la resistència, que s'escalfa: energia elèctrica → tèrmica.")},
 {'src':'../clips/ventilador.mp4','poster':'../clips/ventilador.jpg','title':'Ventilador','cap':'Engeguem un ventilador',
  'q':q('Quina transformació fa el ventilador?',['Tèrmica → elèctrica','Elèctrica → lluminosa','Elèctrica → mecànica'],2,"El motor transforma l'energia elèctrica en energia mecànica: les aspes giren i mouen l'aire.")},
 {'src':'../clips/llanterna.mp4','poster':'../clips/llanterna.jpg','title':'Llanterna','cap':'Posem piles a una llanterna',
  'q':q('Quina cadena de transformacions hi ha a la llanterna?',['Química → elèctrica → lluminosa','Elèctrica → química','Lluminosa → elèctrica'],0,"Les piles guarden energia química, que es converteix en elèctrica i, a la bombeta, en lluminosa.")},
 {'src':'../clips/aerogenerador.mp4','poster':'../clips/aerogenerador.jpg','title':'Aerogenerador','cap':'Un molí de vent que fa electricitat',
  'q':q("Quina transformació fa l'aerogenerador?",['Elèctrica → mecànica','Mecànica (vent) → elèctrica','Lluminosa → elèctrica'],1,"El vent fa girar les aspes (energia mecànica) i el generador la transforma en energia elèctrica.")},

 {'src':'../clips/cotxe.mp4','poster':'../clips/cotxe.jpg','title':'Cotxe','cap':'Un cotxe arrenca','dur':5,
  'q':q('Quina transformació fa el motor del cotxe?',['Química (combustible) → mecànica i tèrmica','Elèctrica → lluminosa','Mecànica → química'],0,"La gasolina guarda energia química. Al motor es crema i es transforma en energia mecànica (les rodes giren) i tèrmica (el motor s'escalfa).")},
 {'src':'../clips/planta.mp4','poster':'../clips/planta.jpg','title':'Planta','cap':'Una planta creix amb la llum del Sol','dur':5,
  'q':q('Quina transformació fa la planta?',['Tèrmica → elèctrica','Lluminosa → química','Química → lluminosa'],1,"Amb la fotosíntesi, la planta transforma l'energia lluminosa del Sol en energia química, que guarda en el seu aliment.")},
 {'src':'../clips/nen_corrent.mp4','poster':'../clips/nen_corrent.jpg','title':'Nen corrent','cap':'Un nen surt a córrer','dur':5,
  'q':q("D'on treu l'energia el nen per córrer?",["De l'energia química dels aliments, que es transforma en mecànica",'De la llum del Sol directament',"De l'electricitat"],0,"Els aliments guarden energia química. El cos la transforma en energia mecànica (moviment) i també en calor.")},
 {'src':'../clips/placa_solar.mp4','poster':'../clips/placa_solar.jpg','title':'Placa solar','cap':'Plaques solars a la sortida del Sol','dur':5,
  'q':q('Quina transformació fa la placa solar?',['Lluminosa → elèctrica','Elèctrica → tèrmica','Química → elèctrica'],0,"Les cèl·lules fotovoltaiques transformen l'energia lluminosa del Sol en energia elèctrica.")},
 {'src':'../clips/torradora.mp4','poster':'../clips/torradora.jpg','title':'Torradora','cap':'Torrem una llesca de pa','dur':5,
  'q':q('Quina transformació fa la torradora?',['Mecànica → elèctrica','Elèctrica → tèrmica','Lluminosa → química'],1,"L'electricitat escalfa els filaments, que es posen vermells: energia elèctrica → tèrmica (i una mica de lluminosa).")},
 {'src':'../clips/foguera.mp4','poster':'../clips/foguera.jpg','title':'Foguera','cap':'Una foguera al capvespre','dur':5,
  'q':q('Quina transformació hi ha a la foguera?',['Química → tèrmica i lluminosa','Elèctrica → tèrmica','Mecànica → lluminosa'],0,"La fusta guarda energia química. En cremar es transforma en calor (tèrmica) i llum (lluminosa).")},
 {'src':'../clips/mobil_carregant.mp4','poster':'../clips/mobil_carregant.jpg','title':'Mòbil carregant','cap':'Carreguem el mòbil','dur':5,
  'q':q('Què passa quan carreguem el mòbil?',["L'energia elèctrica es guarda a la bateria com a energia química",'La bateria fabrica electricitat del no-res',"L'energia lluminosa de la pantalla carrega la bateria"],0,"La bateria transforma l'energia elèctrica en química per guardar-la. Quan fem servir el mòbil, torna a ser elèctrica.")},
]
CFG = {
 'cos': {'intro': {'src':'../clips/cos.mp4','poster':'../clips/cos.jpg','unit':'Medi·Lab 3D · Unitat 1','title':'🫀 El cos humà','sub':'Una màquina perfecta que treballa sense parar'},
   'cards': {'moviment': [{'src':'../clips/cos_moviment.mp4','poster':'../clips/cos_moviment.jpg','title':'La cama en moviment','cap':'Ossos i músculs quan correm','dur':5,
      'q':q('Què fa moure els ossos de la cama?',["Els músculs, que s'encongeixen i s'estiren",'Els ossos es mouen sols','La pell'],0,"Els músculs estan units als ossos. Quan s'encongeixen, estiren l'os i el fan moure; treballen per parelles.")}],
     'accio': [{'src':'../clips/cos_lesions.mp4','poster':'../clips/cos_lesions.jpg','title':'Una torçada de turmell','cap':'Què fem després d\'una torçada?','dur':5,
      'q':q("Què cal fer després d'una torçada?",['Gel, repòs i el peu enlairat','Continuar jugant','Moure molt el turmell'],0,"El gel baixa la inflamació, el repòs evita fer-se més mal i aixecar el peu ajuda que no s'infli.")}],
     'nervios': [{'src':'../clips/cos_nervis.mp4','poster':'../clips/cos_nervis.jpg','title':'Un acte reflex','cap':'La mà toca una cosa calenta','dur':5,
      'q':q('Com es diu aquesta resposta tan ràpida?',['Un acte reflex','Un acte voluntari','Un moviment de la sang'],0,"El senyal va pels nervis fins a la medul·la espinal i torna de seguida al braç, abans que el cervell ho pensi: és un acte reflex.")}]}},
 'adolescencia': {'intro': {'src':'../clips/adolescencia.mp4','poster':'../clips/adolescencia.jpg','unit':'Medi·Lab 3D · Unitat 2','title':"🌱 L'adolescència",'sub':'Créixer, canviar i fer-se gran'}},
 'ciutadania': {'intro': {'src':'../clips/ciutadania.mp4','poster':'../clips/ciutadania.jpg','unit':'Medi·Lab 3D','title':'🌍 Ciutadania i món','sub':'Vivim junts: al poble, al país i al món'}},
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
