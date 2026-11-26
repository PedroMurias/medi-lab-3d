/* Cos humà: esquemes + completa + activitat */
(function(){
window.COS_CM={
 explora:{t:'El cos humà',ch:[
  {l:'està format per',t:"Nivells d'organització",ch:[{t:'Cèl·lules'},{t:'Teixits'},{t:'Òrgans'},{t:'Aparells i sistemes'},{t:'Organisme'}]},
  {l:'fa tres',t:'Funcions vitals',ch:[{t:'Nutrició'},{t:'Relació'},{t:'Reproducció'}]},
  {l:'per fora i per dins',t:'Capes del cos',ch:[{t:'Pell: ens protegeix'},{t:'Músculs: ens mouen'},{t:'Ossos: ens sostenen'},{t:'Òrgans: fan les funcions'}]}]},
 moviment:{t:"L'aparell locomotor",ch:[
  {l:'té',t:'Ossos',ch:[{t:"L'esquelet té 206 ossos"},{t:'Sostenen el cos'},{t:'Protegeixen òrgans'},{t:'Crani, columna, costelles'}]},
  {l:'té',t:'Músculs',ch:[{t:'Uns 650 músculs'},{t:'Es contreuen i es relaxen'},{t:"S'uneixen als ossos amb tendons"}]},
  {l:'on es troben els ossos',t:'Articulacions',ch:[{t:'Mòbils: genoll, colze'},{t:'Semimòbils: columna'},{t:'Fixes: crani'}]},
  {l:'per cuidar-lo',t:'Hàbits saludables',ch:[{t:'Fer exercici'},{t:'Bona postura'},{t:'Escalfar abans'}]}]},
 accio:{t:'Com ens movem?',ch:[
  {l:'1r',t:'El cervell dona l\'ordre',ch:[{t:'Pels nervis motors'}]},
  {l:'2n',t:'El múscul es contreu',ch:[{t:'Es fa més curt i gruixut'}]},
  {l:'3r',t:"El tendó estira l'os",ch:[{t:"L'articulació es mou"}]},
  {l:'treballen per',t:'Parells de músculs',ch:[{t:'Bíceps: doblega el braç'},{t:'Tríceps: l\'estira'},{t:"Si un es contreu, l'altre es relaxa"}]},
  {l:'si ens fem mal',t:'Lesions',ch:[{t:'Fractura: os trencat'},{t:'Esquinç: lligament'},{t:'Luxació: os desencaixat'},{t:'Contractura: múscul'}]}]},
 nervios:{t:'El sistema nerviós',ch:[
  {l:'té',t:'Sistema nerviós central',ch:[{t:'Encèfal: cervell, cerebel i tronc'},{t:'Medul·la espinal'},{t:'Protegits pel crani i la columna'}]},
  {l:'té',t:'Sistema nerviós perifèric',ch:[{t:'Nervis sensitius: porten informació'},{t:'Nervis motors: porten ordres'}]},
  {l:'fa',t:'Actes voluntaris',ch:[{t:'Els decideix el cervell'},{t:'Ex.: agafar un llapis'}]},
  {l:'fa',t:'Actes reflexos',ch:[{t:'Respon la medul·la'},{t:'Molt ràpids'},{t:'Ex.: treure la mà del foc'}]}]},
 sentits:{t:'Els sentits',ch:[
  {l:'amb els ulls',t:'Vista',ch:[{t:'La retina capta la llum'}]},
  {l:'amb les orelles',t:'Oïda',ch:[{t:'Capta els sons'},{t:"També controla l'equilibri"}]},
  {l:'amb el nas',t:'Olfacte',ch:[{t:'La pituïtària capta les olors'}]},
  {l:'amb la llengua',t:'Gust',ch:[{t:'Les papil·les capten els gustos'}]},
  {l:'amb la pell',t:'Tacte',ch:[{t:'Fred, calor, pressió, dolor'}]},
  {l:'funcionen així',t:'Recorregut',ch:[{t:'Estímul'},{t:'Receptor'},{t:'Nervi'},{t:'Cervell'}]}]}
};
const go=m=>{ const b=document.querySelector('#modes button[data-m="'+m+'"]'); if(b) b.click(); };
const PLAY=window.EspPlay({CM:COS_CM,go:()=>{},act:{explora:()=>go('repte'),moviment:()=>go('repte'),accio:()=>go('repte'),nervios:()=>go('repte'),sentits:()=>go('repte')}});
const ANCH={explora:['#left',':scope > div'],moviment:['#mov',null],accio:['#act',null],nervios:['#sen','#senTabs'],sentits:['#sen','#senTabs']};
const st=document.createElement('style'); st.textContent='.epbar3.cosb{margin:4px 0 8px}#act .epbar3.cosb{max-width:520px}#ep{z-index:80}';
document.head.appendChild(st);
function tick(){ const b=document.querySelector('#modes button.on'); const m=b?b.dataset.m:''; const A=ANCH[m];
 document.querySelectorAll('.epbar3.cosb').forEach(e=>{ if(e.dataset.k!==m) e.remove(); });
 if(!A) return; const box=document.querySelector(A[0]); if(!box||box.querySelector('.epbar3.cosb')) return;
 const bar=PLAY.bar3(m); if(!bar) return; bar.classList.add('cosb'); bar.dataset.k=m;
 if(A[1]){ const ref=box.querySelector(A[1]); if(ref){ if(A[1]===':scope > div') ref.insertBefore(bar,ref.firstChild); else ref.after(bar); return; } }
 box.insertBefore(bar,box.firstChild); }
setInterval(tick,700); tick();
window.__cosPlay=PLAY;
})();
