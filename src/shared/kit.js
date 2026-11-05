/* MediLab kit: utilitats compartides per a tots els laboratoris */
window.Kit=(function(){
const $=s=>document.querySelector(s);
const shuf=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const html=s=>{const d=document.createElement('div');d.innerHTML=s;return d;};
let PFX='medilab_';
function store(k,v){try{if(v===undefined)return localStorage.getItem(PFX+k);localStorage.setItem(PFX+k,String(v));}catch(e){return null;}}
/* fitxa */
function showCard(I){const card=$('#card');if(!card)return;card.querySelector('.tag').textContent=I.tipus||'';card.querySelector('h2').textContent=I.n;
 card.querySelector('.facts').innerHTML=Object.entries(I.f||{}).map(([k,v])=>`<div><small>${k}</small>${v}</div>`).join('');
 card.querySelector('.facts').style.display=I.f&&Object.keys(I.f).length?'':'none';
 card.querySelector('.desc').innerHTML=I.t||'';const c=card.querySelector('.cur');c.innerHTML=I.c?'<b>Saps que…?</b>':'';if(I.c)c.appendChild(document.createTextNode(I.c));c.style.display=I.c?'':'none';
 card.classList.add('show');}
/* qüestionari curt del panell */
function quiz(list){const box=document.createElement('div');box.className='sbox';box.innerHTML='<p class="h">Comprova-ho</p>';
 list.forEach(([q,opts,ok])=>{const d=document.createElement('div');d.className='q';d.innerHTML='<p></p>';d.querySelector('p').textContent=q;const fb=document.createElement('div');fb.className='fb';let tries=0,done=false;
  opts.forEach((o,i)=>{const b=document.createElement('button');b.textContent=o;b.onclick=()=>{if(done)return;const U=window.UX;if(i===ok){done=true;d.querySelectorAll('button').forEach(x=>x.classList.remove('ko'));b.classList.add('ok');fb.textContent=tries?'Ara sí! Molt bé.':'Molt bé!';fb.style.color='var(--li)';U&&U.sfx.ok();}
   else{tries++;b.classList.add('ko');if(tries>=2){done=true;d.querySelectorAll('button')[ok].classList.add('ok');fb.textContent='La resposta era «'+opts[ok]+'». Fixa-t\'hi per a la propera.';fb.style.color='var(--ye)';}else{fb.textContent='Gairebé… torna-ho a provar.';fb.style.color='var(--ye)';}U&&U.sfx.ko();}};d.appendChild(b);});d.appendChild(fb);box.appendChild(d);});return box;}
function subtabs(list,cur,cb){const d=document.createElement('div');d.className='sub';list.forEach(([k,ico,n])=>{const b=document.createElement('button');b.innerHTML=`<b>${ico}</b>${n}`;b.classList.toggle('on',k===cur);b.onclick=()=>cb(k);d.appendChild(b);});return d;}
/* ajuda */
function initHelp(seenKey){const H=$('#help');const open=t=>{H.classList.add('show');document.querySelectorAll('.htabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===t));document.querySelectorAll('.hpage').forEach(p=>p.style.display=p.dataset.p===t?'':'none');};
 const close=()=>{H.classList.remove('show');store(seenKey,'1');};
 $('#helpBtn').onclick=()=>open('com');const tb=$('.htour');if(tb)tb.onclick=()=>{close();if(window.__tour)window.__tour();};const rp=$('.hpage[data-p="res"]');if(rp&&window.UX)document.querySelectorAll('.htabs button[data-t="res"]').forEach(b=>b.addEventListener('click',()=>{rp.innerHTML='';rp.appendChild(window.UX.resultsPanel());}));document.querySelectorAll('.htabs button').forEach(b=>b.onclick=()=>open(b.dataset.t));$('.hx').onclick=close;$('.hgo').onclick=close;
 H.addEventListener('click',e=>{if(e.target===H)close();});addEventListener('keydown',e=>{if(e.key==='Escape')close();});
 const c=$('#card');if(c)c.querySelector('.x').onclick=()=>c.classList.remove('show');
 if(!store(seenKey))open('com');}
/* motor de reptes de resposta múltiple.
   games: {key:{ic,n,d,N,make:()=>[{q,sub,opts:[text],ok:index,exp}]}} */
function Repte(RP,games,opts={}){
 let S={};
 const best=k=>{const v=parseFloat(store('best_'+k));return isNaN(v)?null:v;};
 function menu(){S={};if(opts.onExit)opts.onExit();RP.innerHTML='<p class="h">Tria un repte</p>';for(const [k,g] of Object.entries(games)){const b=best(k);const el=document.createElement('button');el.className='rc';el.innerHTML=`<span class="ic">${g.ic}</span><span><b>${g.n}</b><small>${g.d}</small></span><span class="best">${b!=null?'★ '+b.toFixed(1).replace('.',','):''}</span>`;el.onclick=()=>start(k);RP.appendChild(el);}}
 function ui(){RP.innerHTML=`<div class="rtop"><button class="mini" id="rExit">← Sortir</button><span id="rProg"></span><b id="rScore"></b></div><div class="rbar"><i id="rBar"></i></div><h3 id="rQ"></h3><div id="rSub"></div><div id="rOpts"></div><p id="rFb"></p><button class="big" id="rNext">Següent →</button>`;$('#rExit').onclick=menu;$('#rNext').onclick=next;}
 function hud(){const N=S.qs.length;$('#rProg').textContent=`${Math.min(S.i+1,N)} / ${N}`;$('#rScore').textContent='★ '+(Math.round(S.score*10)/10).toString().replace('.',',');$('#rBar').style.width=(S.i/N*100)+'%';}
 function start(k){const g=games[k];S={k,i:0,score:0,qs:g.make()};ui();if(g.custom){g.custom(S,{done:finish,hud,fb});return;}next();}
 function fb(t,ok){const f=$('#rFb');f.textContent=t;f.className=ok?'ok':'ko';}
 function next(){$('#rNext').style.display='none';$('#rFb').textContent='';if(S.i>=S.qs.length)return finish();hud();const q=S.qs[S.i],O=$('#rOpts');O.innerHTML='';let locked=false,tries=0;const U=window.UX;
  $('#rQ').innerHTML=q.q;$('#rSub').innerHTML=q.sub||'';if(q.onShow)q.onShow();
  q.opts.forEach((t,i)=>{const b=document.createElement('button');b.innerHTML='<i></i><span></span>';b.querySelector('i').textContent='ABCD'[i];b.querySelector('span').innerHTML=t;
   b.onclick=()=>{if(locked||b.classList.contains('ko'))return;const ok=i===q.ok;
    if(!ok&&tries===0){tries=1;b.classList.add('ko');fb('Gairebé… '+(q.hint||'pensa-hi un moment i torna-ho a provar.'),false);U&&U.sfx.ko();return;}
    locked=true;if(!ok)b.classList.add('ko');O.children[q.ok].classList.add('ok');if(ok)S.score+=tries?.5:1;U&&(ok?U.sfx.ok():U.sfx.ko());
    fb((ok?(tries?'Ara sí! ':'Correcte! '):'La bona era la '+'ABCD'[q.ok]+'. ')+(q.exp||''),ok);S.i++;hud();$('#rNext').style.display='block';$('#rNext').textContent=S.i>=S.qs.length?'Veure la nota →':'Següent →';};O.appendChild(b);});}
 function finish(nota){if(nota==null)nota=Math.round(S.score/S.qs.length*100)/10;const b=best(S.k);if(b==null||nota>b)store('best_'+S.k,nota);const k=S.k;if(opts.onExit)opts.onExit();const U=window.UX;if(U){U.logResult(games[k].n,nota);if(nota>=9){U.sfx.star();U.confetti();}else if(nota>=5)U.sfx.ok();}
  RP.innerHTML=`<div id="rBig">${nota.toFixed(1).replace('.',',')}<small>de 10</small></div><p style="text-align:center;font-size:17px">${nota>=9?'🏆 Excel·lent!':nota>=7?'🎉 Molt bé!':nota>=5?'👍 Bé, i la propera millor!':'💪 Cap problema: torna-hi i veuràs com puges!'}</p><p style="text-align:center;color:var(--mu)">${'★'.repeat(Math.max(1,Math.round(nota/10*3)))+'☆'.repeat(3-Math.max(1,Math.round(nota/10*3)))} · ${b==null||nota>b?'Nou rècord!':'El teu rècord: '+b.toFixed(1).replace('.',',')}</p><div class="row" style="justify-content:center"><button class="big" id="rA">Torna-hi</button><button class="pill" id="rM">Altres reptes</button></div>`;
  $('#rA').onclick=()=>start(k);$('#rM').onclick=menu;}
 return {menu,start};}
/* genera preguntes de "a quina categoria pertany" */
function classify(items,cats,N,qfn,expfn){return shuf(items).slice(0,N).map(it=>{const right=it.cat;let others=shuf(cats.filter(c=>c!==right)).slice(0,Math.min(2,cats.length-1));const o=shuf([right,...others]);return {q:qfn(it),opts:o,ok:o.indexOf(right),exp:expfn?expfn(it):''};});}
function mc(list,N){return shuf(list).slice(0,N).map(([q,opts,ok,exp])=>{const idx=shuf(opts.map((_,i)=>i));return {q,opts:idx.map(i=>opts[i]),ok:idx.indexOf(ok),exp:exp||''};});}
return {$,shuf,html,store,setPrefix:p=>PFX=p,showCard,quiz,subtabs,initHelp,Repte,classify,mc};
})();
