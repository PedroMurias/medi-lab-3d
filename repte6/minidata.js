/* El Gran Repte 6è · contingut dels MINIJOCS (Ordena, Classifica i Parelles de Medi). Basat en el llibre de Medi 6è i el temari de 6è. */

/* ---------- Línia del temps (Medi · unitat 7) ---------- */
window.MINI_EVENTS = [
  [1492, 'Colom arriba a Amèrica'], [1714, 'Barcelona cau a la Guerra de Successió'], [1769, 'James Watt millora la màquina de vapor'],
  [1789, 'Comença la Revolució Francesa'], [1848, 'Primer tren de la Península: Barcelona–Mataró'], [1879, 'Edison presenta la bombeta elèctrica'],
  [1888, 'Exposició Universal de Barcelona'], [1914, 'Comença la Primera Guerra Mundial'], [1929, 'Exposició Internacional de Barcelona'],
  [1931, 'Es proclama la Segona República'], [1936, 'Comença la Guerra Civil espanyola'], [1939, 'Acaba la Guerra Civil i comença la dictadura'],
  [1945, 'Acaba la Segona Guerra Mundial'], [1969, 'L\'ésser humà arriba a la Lluna'], [1975, 'Mor Franco'],
  [1978, 'S\'aprova la Constitució espanyola'], [1979, 'S\'aprova l\'Estatut d\'Autonomia de Catalunya'], [1986, 'Espanya entra a la Comunitat Europea'],
  [1992, 'Jocs Olímpics de Barcelona'], [2002, 'Comença a circular l\'euro']
];

/* ---------- Seqüències per ordenar: [tema, títol, elements en l'ordre correcte] ---------- */
window.MINI_SEQ = [
  ['u7', 'Ordena les etapes de la història, de la més antiga a la més recent', ['Prehistòria', 'Edat Antiga', 'Edat Mitjana', 'Edat Moderna', 'Edat Contemporània']],
  ['u4', 'Ordena els planetes, del més proper al Sol al més llunyà', ['Mercuri', 'Venus', 'Terra', 'Mart', 'Júpiter', 'Saturn', 'Urà', 'Neptú']],
  ['u4', 'Ordena de més petit a més gran', ['Lluna', 'Terra', 'Júpiter', 'Sol']],
  ['u1', 'Ordena del més senzill al més complex', ['Cèl·lula', 'Teixit', 'Òrgan', 'Aparell', 'Organisme']],
  ['u1', 'Ordena el recorregut de l\'aliment', ['Boca', 'Esòfag', 'Estómac', 'Intestí prim', 'Intestí gros']],
  ['u1', 'Ordena el recorregut de l\'aire quan respirem', ['Nas', 'Faringe', 'Laringe', 'Tràquea', 'Bronquis', 'Pulmons']],
  ['u2', 'Ordena les etapes de la vida', ['Infància', 'Adolescència', 'Edat adulta', 'Vellesa']],
  ['u3', 'Ordena la cadena alimentària, començant pel productor', ['Herba', 'Llagosta', 'Granota', 'Serp', 'Àguila']],
  ['u5', 'Ordena els cims, del més alt al més baix', ['Teide', 'Mulhacén', 'Aneto', 'Pica d\'Estats', 'Turó de l\'Home']],
  ['u8', 'Ordena els territoris, del més petit al més gran', ['Municipi', 'Comarca', 'Comunitat autònoma', 'Estat', 'Unió Europea']]
];

/* ---------- Frases en anglès per ordenar les paraules ---------- */
window.MINI_EN_SENT = [
  'My favourite subject is science.', 'He usually walks to school.', 'You must wear a helmet.', 'Can you help me, please?',
  'I have never been to London.', 'She is taller than her brother.', 'What time do you get up?', 'My grandmother lives in a small village.',
  'They didn\'t go to school yesterday.', 'Have you ever seen a whale?', 'The elephant is the biggest land animal.', 'Where did you go last summer?',
  'I\'m going to visit my cousins tomorrow.', 'There are three bedrooms in my house.', 'She has already finished her homework.', 'It was the best day of my life.',
  'Don\'t forget your umbrella.', 'How many students are there in your class?', 'We will travel to Italy next year.',
  'We were playing football when it started to rain.', 'I always brush my teeth before bed.', 'Is there a cinema near your house?'
];

/* ---------- Classifica: [font, tema(s), títol, caixes, [element, caixa]] ---------- */
window.MINI_CLS = [
  ['medi', 'u3', 'Vertebrats o invertebrats?', ['Vertebrats', 'Invertebrats'], [['àliga', 0], ['dofí', 0], ['granota', 0], ['sargantana', 0], ['tauró', 0], ['gos', 0], ['pingüí', 0], ['salmó', 0], ['cargol', 1], ['aranya', 1], ['papallona', 1], ['medusa', 1], ['cuc de terra', 1], ['pop', 1], ['estrella de mar', 1], ['formiga', 1]]],
  ['medi', 'u3', 'A quin grup pertany cada animal?', ['Mamífers', 'Ocells', 'Rèptils', 'Amfibis', 'Peixos'], [['dofí', 0], ['ratpenat', 0], ['balena', 0], ['cavall', 0], ['pingüí', 1], ['estruç', 1], ['àliga', 1], ['gallina', 1], ['tortuga', 2], ['serp', 2], ['cocodril', 2], ['sargantana', 2], ['granota', 3], ['salamandra', 3], ['tritó', 3], ['gripau', 3], ['tauró', 4], ['salmó', 4], ['tonyina', 4], ['cavallet de mar', 4]]],
  ['medi', 'u3', 'Quin paper fa a l\'ecosistema?', ['Productors', 'Consumidors', 'Descomponedors'], [['alzina', 0], ['herba', 0], ['alga', 0], ['pi', 0], ['conill', 1], ['guineu', 1], ['àliga', 1], ['llagosta', 1], ['fongs', 2], ['bacteris', 2], ['floridura', 2], ['bolets', 2]]],
  ['medi', 'u6', 'Energia renovable o no renovable?', ['Renovable', 'No renovable'], [['solar', 0], ['eòlica', 0], ['hidràulica', 0], ['geotèrmica', 0], ['biomassa', 0], ['mareomotriu', 0], ['petroli', 1], ['carbó', 1], ['gas natural', 1], ['nuclear (urani)', 1]]],
  ['medi', 'u1', 'A quin aparell pertany cada òrgan?', ['Digestiu', 'Respiratori', 'Circulatori', 'Excretor'], [['estómac', 0], ['fetge', 0], ['intestí prim', 0], ['esòfag', 0], ['pulmons', 1], ['tràquea', 1], ['bronquis', 1], ['laringe', 1], ['cor', 2], ['artèries', 2], ['venes', 2], ['capil·lars', 2], ['ronyons', 3], ['bufeta', 3], ['urèters', 3], ['uretra', 3]]],
  ['medi', 'u4', 'Planeta rocós o gasós?', ['Rocosos', 'Gasosos'], [['Mercuri', 0], ['Venus', 0], ['Terra', 0], ['Mart', 0], ['Júpiter', 1], ['Saturn', 1], ['Urà', 1], ['Neptú', 1]]],
  ['medi', 'u5', 'Serralada o riu d\'Espanya?', ['Serralades', 'Rius'], [['Pirineus', 0], ['Sistema Central', 0], ['Serralada Bètica', 0], ['Sistema Ibèric', 0], ['Serralada Cantàbrica', 0], ['Ebre', 1], ['Tajo', 1], ['Duero', 1], ['Guadalquivir', 1], ['Guadiana', 1], ['Segura', 1]]],
  ['medi', 'u2', 'Canvi físic o canvi emocional de l\'adolescència?', ['Físics', 'Emocionals'], [['canvia la veu', 0], ['surt pèl nou', 0], ['es creix molt de pressa', 0], ['apareix l\'acne', 0], ['canvis d\'humor', 1], ['més ganes d\'intimitat', 1], ['els amics són molt importants', 1], ['inseguretat amb la imatge', 1]]],
  ['medi', 'u7', 'Segle XIX o segle XX?', ['Segle XIX', 'Segle XX'], [['Renaixença', 0], ['primer tren Barcelona–Mataró', 0], ['Exposició Universal de Barcelona (1888)', 0], ['bombeta d\'Edison', 0], ['Guerra Civil espanyola', 1], ['Segona República', 1], ['Constitució espanyola', 1], ['Jocs Olímpics de Barcelona', 1]]],
  ['medi', 'u8', 'Quin poder és?', ['Legislatiu', 'Executiu', 'Judicial'], [['fa les lleis', 0], ['el Parlament', 0], ['les Corts Generals', 0], ['governa i aplica les lleis', 1], ['el Govern', 1], ['el president del Govern', 1], ['els jutges', 2], ['els tribunals', 2], ['jutja si es compleixen les lleis', 2]]],
  ['ca', '*', 'Nom, verb o adjectiu?', ['Nom', 'Verb', 'Adjectiu'], [['taula', 0], ['gos', 0], ['ciutat', 0], ['llibre', 0], ['alegria', 0], ['muntanya', 0], ['córrer', 1], ['escriure', 1], ['menjar', 1], ['saltar', 1], ['llegir', 1], ['dormir', 1], ['blau', 2], ['alt', 2], ['feliç', 2], ['ràpid', 2], ['petit', 2], ['valent', 2]]],
  ['es', '*', '¿Sustantivo, verbo o adjetivo?', ['Sustantivo', 'Verbo', 'Adjetivo'], [['mesa', 0], ['perro', 0], ['ciudad', 0], ['libro', 0], ['alegría', 0], ['montaña', 0], ['correr', 1], ['escribir', 1], ['comer', 1], ['saltar', 1], ['leer', 1], ['dormir', 1], ['azul', 2], ['alto', 2], ['feliz', 2], ['rápido', 2], ['pequeño', 2], ['valiente', 2]]],
  ['en', '*', 'Noun, verb or adjective?', ['Noun', 'Verb', 'Adjective'], [['table', 0], ['dog', 0], ['city', 0], ['book', 0], ['river', 0], ['teacher', 0], ['run', 1], ['write', 1], ['eat', 1], ['jump', 1], ['read', 1], ['sleep', 1], ['blue', 2], ['tall', 2], ['happy', 2], ['fast', 2], ['small', 2], ['brave', 2]]],
  ['en', '*', 'Countable or uncountable?', ['Countable', 'Uncountable'], [['apple', 0], ['chair', 0], ['book', 0], ['egg', 0], ['bottle', 0], ['pencil', 0], ['water', 1], ['milk', 1], ['rice', 1], ['bread', 1], ['money', 1], ['music', 1]]]
];

/* ---------- Parelles de Medi: concepte ↔ definició, per unitat ---------- */
window.MINI_DEF = {
  u1: [['Fèmur', 'L\'os més llarg del cos'], ['Cor', 'Bomba la sang per tot el cos'], ['Pulmons', 'On es fa l\'intercanvi de gasos'], ['Neurona', 'Cèl·lula del sistema nerviós'], ['Estómac', 'Barreja l\'aliment amb els sucs gàstrics'], ['Ronyons', 'Filtren la sang i fan l\'orina'], ['Tendó', 'Uneix el múscul amb l\'os'], ['Articulació', 'Unió entre dos ossos']],
  u2: [['Pubertat', 'Inici dels canvis de l\'adolescència'], ['Hormones', 'Substàncies que provoquen els canvis'], ['Autoestima', 'Valorar-se i estimar-se un mateix'], ['Higiene', 'Cura i neteja del cos'], ['Empatia', 'Posar-se al lloc dels altres'], ['Assertivitat', 'Dir el que penses amb respecte']],
  u3: [['Ecosistema', 'Éssers vius i el medi on viuen'], ['Biòtop', 'Part no viva de l\'ecosistema'], ['Biocenosi', 'Conjunt d\'éssers vius de l\'ecosistema'], ['Productor', 'Fabrica el seu propi aliment'], ['Descomponedor', 'Transforma les restes en sals minerals'], ['Hàbitat', 'Lloc on viu una espècie'], ['Fotosíntesi', 'Les plantes fan aliment amb la llum']],
  u4: [['Galàxia', 'Conjunt enorme d\'estrelles'], ['Rotació', 'Gir de la Terra sobre ella mateixa'], ['Translació', 'Volta de la Terra al voltant del Sol'], ['Satèl·lit', 'Astre que gira al voltant d\'un planeta'], ['Eclipsi', 'Un astre en tapa un altre'], ['Atmosfera', 'Capa de gasos que envolta la Terra'], ['Estrella', 'Astre amb llum pròpia']],
  u5: [['Península', 'Terra envoltada d\'aigua menys per un costat'], ['Serralada', 'Conjunt de muntanyes'], ['Desembocadura', 'On un riu arriba al mar'], ['Meseta', 'Gran plana elevada al centre de la Península'], ['Arxipèlag', 'Conjunt d\'illes'], ['Afluent', 'Riu que desemboca en un altre riu'], ['Golf', 'Entrant gran del mar a la costa']],
  u6: [['Energia', 'Capacitat de produir canvis'], ['Eòlica', 'Energia del vent'], ['Solar', 'Energia del Sol'], ['Hidràulica', 'Energia de l\'aigua en moviment'], ['Combustible fòssil', 'Petroli, carbó o gas natural'], ['Renovable', 'Font d\'energia que no s\'esgota'], ['Estalvi energètic', 'Gastar només l\'energia necessària']],
  u7: [['Renaixença', 'Recuperació de la llengua i la cultura catalanes'], ['Revolució Industrial', 'Pas de la feina a mà a les màquines'], ['Modernisme', 'Estil artístic de Gaudí'], ['Transició', 'Pas de la dictadura a la democràcia'], ['Constitució', 'La llei més important d\'un país'], ['Dictadura', 'Govern sense llibertats ni eleccions'], ['Sindicat', 'Organització que defensa els treballadors'], ['República', 'Forma de govern sense rei']],
  u8: [['Democràcia', 'El poble escull els seus governants'], ['Ajuntament', 'Govern d\'un municipi'], ['Generalitat', 'Govern de Catalunya'], ['Parlament', 'On es fan i s\'aproven les lleis'], ['Vot', 'Manera d\'escollir els representants'], ['Drets humans', 'Drets de totes les persones'], ['Impostos', 'Diners per pagar els serveis públics']],
  u9: [['Continent', 'Gran extensió de terra'], ['Oceà', 'Gran extensió d\'aigua salada'], ['Equador', 'Línia que divideix la Terra en dos hemisferis'], ['Emigrar', 'Marxar a viure a un altre país'], ['Globalització', 'Connexió entre tots els països del món'], ['Desenvolupament sostenible', 'Créixer sense fer malbé el planeta'], ['Meridià de Greenwich', 'Línia de longitud 0°']]
};

/* ---------- Altres parelles ---------- */
window.MINI_EN_OPP = [['big', 'small'], ['hot', 'cold'], ['fast', 'slow'], ['happy', 'sad'], ['old', 'young'], ['tall', 'short'], ['open', 'closed'], ['easy', 'difficult'], ['light', 'dark'], ['clean', 'dirty'], ['strong', 'weak'], ['early', 'late'], ['full', 'empty'], ['noisy', 'quiet'], ['cheap', 'expensive'], ['heavy', 'light']];
window.MINI_MES = [['1 km', '1.000 m'], ['1 m', '100 cm'], ['1 cm', '10 mm'], ['1 kg', '1.000 g'], ['1 t', '1.000 kg'], ['1 l', '1.000 ml'], ['1 h', '60 min'], ['1 min', '60 s'], ['1 dia', '24 h'], ['1 m²', '10.000 cm²']];
window.MINI_GEO = [['Triangle', '3 costats'], ['Quadrilàter', '4 costats'], ['Pentàgon', '5 costats'], ['Hexàgon', '6 costats'], ['Octàgon', '8 costats'], ['Decàgon', '10 costats'], ['Angle recte', '90°'], ['Angle pla', '180°']];
window.MINI_FDP = [['1/2', '0,5', '50%'], ['1/4', '0,25', '25%'], ['3/4', '0,75', '75%'], ['1/5', '0,2', '20%'], ['2/5', '0,4', '40%'], ['3/5', '0,6', '60%'], ['4/5', '0,8', '80%'], ['1/10', '0,1', '10%'], ['3/10', '0,3', '30%'], ['7/10', '0,7', '70%'], ['9/10', '0,9', '90%'], ['1/20', '0,05', '5%']];
