/* Generadors de preguntes (mates, verbs, banderes, capitals) */
window.GENQ=(function(){
const esc=s=>String(s);
const R=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const pickA=a=>a[Math.random()*a.length|0];
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const de=x=>/^[AEIOUÀÈÉÍÒÓÚH]/i.test(x)?"d'"+x:'de '+x;
const fmt=n=>{const r=Math.round(n*1000)/1000;return String(r).replace('.',',').replace(/\B(?=(\d{3})+(?!\d))/g,m=>m)};
const nf=n=>{const [i,d]=String(Math.round(n*1000)/1000).split('.');return i.replace(/\B(?=(\d{3})+(?!\d))/g,'.')+(d?','+d:'')};
const ICO={
 cos:'<path d="M12 21s-7-4.4-9.3-9C1 8.5 3 4.5 6.8 4.5c2.2 0 3.6 1.3 5.2 3.2 1.6-1.9 3-3.2 5.2-3.2C21 4.5 23 8.5 21.3 12 19 16.6 12 21 12 21Z"/>',
 nat:'<path d="M20 3C9 3 4 8.5 4 15c0 2 .6 3.6 1.4 5L4 21.5l1.2 1L7 20.8c1.3.8 2.9 1.2 4.6 1.2C18 22 21 15 20 3Zm-9 15c1-4 3.5-7 7-9-2.6 2.6-4.6 5.3-6 9Z"/>',
 cie:'<circle cx="12" cy="12" r="6"/><path d="M2.5 15.5c-1-2 4-5.8 9.3-7.8s10-2 10.8 0" fill="none" stroke="currentColor" stroke-width="2"/>',
 geo:'<path d="M2 20 9 7l4 6 3-4 6 11Z"/>',
 his:'<path d="M6 2h12v2l-4.5 7v2L18 20v2H6v-2l4.5-7v-2L6 4Z"/>',
 soc:'<path d="M12 2 2 7v2h20V7Zm-8 9h3v7H4Zm6.5 0h3v7h-3ZM17 11h3v7h-3ZM2 20h20v2H2Z"/>',
 crown:'<path d="M2 7l5 4 5-7 5 7 5-4-2 12H4Zm2 13h16v2H4Z"/>'
};
const svgI=(k,col='currentColor')=>`<svg viewBox="0 0 24 24" fill="${col}" style="color:${col}">${ICO[k]}</svg>`;
const SCOL=['#e8484a','#2f7de1','#2fa84f','#f08a00','#9b4fd0','#e2468e'];

/* ---------- preguntes fixes ---------- */
const MEDI=window.RQ.filter(q=>!q[5]);           // sense les imatges de captura (pendent: fotos reals)
const fx=(q,lvl)=>({q:q[2],o:q[3],e:q[4]||'',l:q[1]});
const fromArr=(arr,tops,crown)=>{ let p=arr.filter(q=>tops.has(q[0])); return p; };

/* ---------- banderes: nivell i opcions enganyoses ---------- */
const tier=c=>(window.FLAG_TIER||{})[c[2]]||2;
/* Fàcil: només països molt coneguts · Normal: coneguts i mitjans · Difícil: mitjans i difícils (sobretot difícils) */
function pickCountry(h,tops,needCap){ const all=window.COUNTRIES.filter(c=>tops.has('fl-'+c[3])&&(!needCap||c[1])); if(!all.length) return null;
  const easyMode=window.GENQ.level==='facil';
  let pool=easyMode?all.filter(c=>tier(c)===1):h?all.filter(c=>tier(c)>=2):all.filter(c=>tier(c)<=2);
  if(h){ const hard=pool.filter(c=>tier(c)===3); if(hard.length&&Math.random()<0.7) pool=hard; }
  return pickA(pool.length?pool:all); }
/* Fàcil: opcions d'altres continents (noms ben diferents) · Normal: mateix continent · Difícil: banderes semblants primer */
function flagDistractors(c,h){ const same=shuffle(window.COUNTRIES.filter(x=>x!==c&&x[3]===c[3])), rest=shuffle(window.COUNTRIES.filter(x=>x!==c&&x[3]!==c[3]));
  const easyMode=window.GENQ.level==='facil';
  if(easyMode) return rest.filter(x=>tier(x)<=2).concat(same);
  if(!h) return same.concat(rest);
  const grp=(window.FLAG_LIKE||[]).filter(gp=>gp.includes(c[2])).flat(); const like=shuffle(window.COUNTRIES.filter(x=>x!==c&&grp.includes(x[2])));
  const seen=new Set([c[2]]); return like.concat(same,rest).filter(x=>!seen.has(x[2])&&seen.add(x[2])); }

/* ---------- generadors ---------- */
function numQ(q,ans,cands,e,l){ const rr=x=>Math.round(x*1000)/1000; ans=rr(ans); cands=cands.map(rr); const set=new Set([ans]); const o=[ans]; for(const c of shuffle(cands)){ if(o.length>=4)break; if(c>0&&!set.has(c)){set.add(c);o.push(c)} } let k=1; while(o.length<4){ const c=ans+k*(k%2?1:-1)*Math.max(1,Math.round(ans*.1)); if(c>0&&!set.has(c)){set.add(c);o.push(c)} k++ } return {q,o:o.map(nf),e,l}; }
const GEN={
 'ma-calc':h=>{ const t=h?R(3,8):R(0,3);
  if(t===5){const a=R(12,49),b=R(12,39);return numQ(`Quant és ${a} × ${b}?`,a*b,[a*b+a,a*b-b,a*b+10,(a+1)*b],`${a} × ${b} = ${a*b}.`,3)}
  if(t===6){const b=R(4,9),c=R(12,60),r=R(1,b-1),a=b*c+r;return numQ(`Quin és el residu de ${a} : ${b}?`,r,[r+1,r-1,c,b-r],`${b} × ${c} = ${b*c} i ${a} − ${b*c} = ${r}. Quocient ${c}, residu ${r}.`,3)}
  if(t===7){const a=R(2,9),b=R(2,9),c=R(2,9);return numQ(`Quant és ${a} + ${b} × ${c}?`,a+b*c,[(a+b)*c,a*b+c,a+b+c,a*(b+c)],`Primer la multiplicació: ${b} × ${c} = ${b*c}; després ${a} + ${b*c} = ${a+b*c}.`,3)}
  if(t===8){const a=R(3,9),b=R(2,9),c=R(2,6);return numQ(`Quant és (${a} + ${b}) × ${c}?`,(a+b)*c,[a+b*c,a*c+b,(a+b)+c,a*b*c],`Primer el parèntesi: ${a} + ${b} = ${a+b}; després × ${c} = ${(a+b)*c}.`,3)}
  if(t===0){const a=R(3,12),b=R(3,12);return numQ(`Quant és ${a} × ${b}?`,a*b,[a*b+a,a*b-b,a*(b+1)+1,(a+1)*b],`${a} × ${b} = ${a*b}.`,1)}
  if(t===1){const a=R(23,89),b=R(12,79);return numQ(`Quant és ${a} + ${b}?`,a+b,[a+b+10,a+b-10,a+b+1,a+b-1],`${a} + ${b} = ${a+b}.`,1)}
  if(t===2){const b=R(15,60),a=b+R(12,70);return numQ(`Quant és ${a} − ${b}?`,a-b,[a-b+10,a-b-10,a-b+2,a+b],`${a} − ${b} = ${a-b}.`,1)}
  if(t===3){const b=R(3,12),c=R(3,12);return numQ(`Quant és ${b*c} : ${b}?`,c,[c+1,c-1,c+b,b],`${c} × ${b} = ${b*c}, per tant ${b*c} : ${b} = ${c}.`,2)}
  const x=R(12,99)/10,m=pickA([10,100,1000]);return numQ(`Quant és ${nf(x)} × ${nf(m)}?`,x*m,[x*m/10,x*m*10,x+m,x*m/100],`Multiplicar per ${nf(m)} mou la coma ${String(m).length-1} llocs a la dreta.`,3)},
 'ma-frac':h=>{ const t=window.GENQ.level==='facil'?R(0,1):h?R(2,4):R(0,2);
  if(t===3){const d=pickA([6,8,12,15]),n=R(2,d-2),k=R(3,12),T=d*k;return numQ(`Quant és ${n}/${d} de ${T}?`,n*k,[k,T-n*k,n*k+k,n*d],`${T} : ${d} = ${k} i ${k} × ${n} = ${n*k}.`,3)}
  if(t===4){const a=pickA([[1,2],[2,3],[3,4],[1,3],[3,5],[2,5]]),b=pickA([[3,8],[5,12],[1,4],[5,6],[7,10],[4,9]]);const A=a[0]/a[1],B=b[0]/b[1];const big=A>B?a:b,sm=A>B?b:a;return {q:`Quina fracció és més gran: ${a[0]}/${a[1]} o ${b[0]}/${b[1]}?`,o:[`${big[0]}/${big[1]}`,`${sm[0]}/${sm[1]}`,'Són iguals'],e:`${a[0]}/${a[1]} = ${nf(Math.round(A*100)/100)} i ${b[0]}/${b[1]} = ${nf(Math.round(B*100)/100)}.`,l:3}}
  if(t===0){const d=pickA([2,3,4,5,10]),n=R(1,d-1)||1,k=R(2,9),T=d*k;return numQ(`Quant és ${n}/${d} de ${T}?`,n*k,[k,T-n*k,n*k+k,n*d],`${T} : ${d} = ${k} i ${k} × ${n} = ${n*k}.`,2)}
  if(t===1){const d=R(5,12),a=R(1,d-3),b=R(1,d-a-1);return {q:`Quant és ${a}/${d} + ${b}/${d}?`,o:[`${a+b}/${d}`,`${a+b}/${2*d}`,`${a+b+1}/${d}`,`${a+b>2?a+b-1:a+b+2}/${d}`],e:`Amb el mateix denominador, sumem els numeradors: ${a} + ${b} = ${a+b}.`,l:2}}
  const d=pickA([3,4,5,7]),n=R(1,d-1),k=R(2,4);return {q:`Quina fracció és equivalent a ${n}/${d}?`,o:[`${n*k}/${d*k}`,`${n+k}/${d+k}`,`${n*k}/${d}`,`${d}/${n}`],e:`Multipliquem numerador i denominador per ${k}.`,l:3}},
 'ma-dec':h=>{ const t=window.GENQ.level==='facil'?R(0,1):h?R(3,5):R(0,2);
  if(t===3){const a=R(11,49)/10,b=R(2,9)/10;return numQ(`Quant és ${nf(a)} × ${nf(b)}?`,a*b,[a*b*10,a*b/10,a+b,a*b+1],`Multipliquem sense coma (${nf(a*10)} × ${nf(b*10)} = ${nf(a*b*100)}) i posem dos decimals: ${nf(Math.round(a*b*1000)/1000)}.`,3)}
  if(t===4){const x=R(12,999),m=pickA([10,100,1000]);return numQ(`Quant és ${nf(x)} : ${nf(m)}?`,x/m,[x/m*10,x/m/10,x*m,x/m+1],`Dividir per ${nf(m)} mou la coma ${String(m).length-1} llocs a l'esquerra.`,3)}
  if(t===5){const base=R(2,8);const v=shuffle([base+0.5,base+0.45,base+0.05,base+0.5+0.0]).slice(0,3);const u=[...new Set(v)];if(u.length<3)u.push(base+0.3);const sorted=u.slice().sort((a,b)=>a-b);return {q:`Ordena de petit a gran: ${shuffle(u).map(nf).join('  ·  ')}`,o:[sorted.map(nf).join(' < '),sorted.slice().reverse().map(nf).join(' < '),[sorted[1],sorted[0],sorted[2]].map(nf).join(' < ')],e:`Comparem primer les unitats, després les dècimes i les centèsimes: ${sorted.map(nf).join(' < ')}.`,l:3}}
  if(t===0){const a=R(11,99)/10,b=R(101,499)/100;return numQ(`Quant és ${nf(a)} + ${nf(b)}?`,a+b,[a+b+1,a+b-.1,a+b+.1,a*10+b],`Posem les comes en columna: ${nf(a)} + ${nf(b)} = ${nf(a+b)}.`,2)}
  if(t===1){const x=R(101,999)/100;return numQ(`Arrodoneix ${nf(x)} a les unitats.`,Math.round(x),[Math.floor(x)+(Math.round(x)===Math.floor(x)?1:0),Math.round(x)+1,Math.round(x)+2],`Mirem les dècimes: si és 5 o més, arrodonim cap amunt.`,2)}
  const a=R(2,9)/10,b=a-R(1,3)/100+.05;return {q:`Quin nombre és més gran?`,o:[nf(Math.max(a,b)),nf(Math.min(a,b))],e:`Comparem primer les dècimes i després les centèsimes.`,l:3}},
 'ma-perc':h=>{ const p=h?pickA([5,15,30,40,60,80]):pickA([10,20,25,50,75]),base=h?pickA([60,150,240,300,500,800]):pickA([20,40,60,80,100,120,200,400]);const v=base*p/100;
  if(h&&R(0,1)){const tot=pickA([20,25,40,50]),k=R(2,tot-2),pp=Math.round(100*k/tot);if(Number.isInteger(100*k/tot))return numQ(`A una classe de ${tot} alumnes, ${k} porten ulleres. Quin percentatge és?`,pp,[pp+10,pp-10,k,100-pp],`${k} : ${tot} × 100 = ${pp}%.`,3)}
  if(window.GENQ.level==='facil'||R(0,1)) return numQ(`Quant és el ${p}% de ${base}?`,v,[base-v,v*2,v/2,p],`El ${p}% vol dir ${p} de cada 100: ${base} × ${p} : 100 = ${nf(v)}.`,2);
  return numQ(`Una samarreta costa ${base} € i té un ${p}% de descompte. Quant pagues?`,base-v,[v,base,base-v/2,base+v],`El descompte és ${nf(v)} €; ${base} − ${nf(v)} = ${nf(base-v)} €.`,3)},
 'ma-mes':h=>{ const U=h?[["km","cm",100000],["m","mm",1000],["kg","g",1000],["t","kg",1000],["h","s",3600],["dies","h",24],["l","cl",100],["hl","l",100]]:[["km","m",1000],["m","cm",100],["cm","mm",10],["kg","g",1000],["l","ml",1000],["h","min",60]];const [a,b,f]=pickA(U);const x=f===3600||f===24?pickA([1.5,2,2.5,3,0.5]):f===60?pickA([1.5,2,2.5,3,0.5]):R(12,95)/10;
  if(h) return numQ(`Quants ${b} són ${nf(x)} ${a}?`,x*f,[x*f/10,x*f*10,x*f+f,x*100],`1 ${a} = ${nf(f)} ${b}: ${nf(x)} × ${nf(f)} = ${nf(x*f)}.`,3);
  return numQ(`Quants ${b} són ${nf(x)} ${a}?`,x*f,[x*f/10,x*f*10,x*f+f,x*100],`1 ${a} = ${nf(f)} ${b}: ${nf(x)} × ${nf(f)} = ${nf(x*f)}.`,2)},
 'ma-geo':h=>{ if(R(0,2)===0) return null; const EZ=window.GENQ.level==='facil';
  if(h){const t=R(0,2);
   if(t===0){const r=R(2,10);return numQ(`Quina és la longitud d'una circumferència de radi ${r} cm? (π = 3,14; en cm)`,2*3.14*r,[3.14*r,3.14*r*r,2*r,4*r],`Longitud = 2 × π × r = 2 × 3,14 × ${r} = ${nf(2*3.14*r)} cm.`,3)}
   if(t===1){const l=R(3,12);return numQ(`Un quadrat té un perímetre de ${4*l} cm. Quina és la seva àrea? (en cm²)`,l*l,[4*l,l*4*4,l*2,l*l+l],`Costat = ${4*l} : 4 = ${l} cm; àrea = ${l} × ${l} = ${l*l} cm².`,3)}
   const a=R(3,9),b=a+R(2,8);return numQ(`Un rectangle fa ${a} cm d'ample i ${b} cm de llarg. Quin és el seu perímetre? (en cm)`,2*(a+b),[a*b,a+b,2*a+b,4*(a+b)],`Perímetre = 2 × (${a} + ${b}) = ${2*(a+b)} cm.`,3)}
  if(EZ||R(0,1)){const a=R(3,15),b=R(3,12);return numQ(`Quina és l'àrea d'un rectangle de ${a} cm per ${b} cm? (en cm²)`,a*b,[2*(a+b),a+b,a*b+a,a*b-b],`Àrea del rectangle = base × altura = ${a} × ${b}.`,2)}
  const b=R(2,10)*2,hh=R(3,12);return numQ(`Quina és l'àrea d'un triangle de base ${b} cm i altura ${hh} cm? (en cm²)`,b*hh/2,[b*hh,b+hh,b*hh/2+b,(b+hh)*2],`Àrea = base × altura : 2 = ${b} × ${hh} : 2.`,3)},
 'en-irr':h=>{ const lv=window.GENQ.level, IR=window.IRREG, ti=i=>i<20?1:i<34?2:3; // els 20 primers verbs són els més freqüents, els últims els més difícils
  let pool=lv==='facil'?IR.filter((x,i)=>ti(i)===1):h?IR.filter((x,i)=>ti(i)>=2&&(ti(i)===3||Math.random()<0.4)):IR.filter((x,i)=>ti(i)<=2); if(!pool.length) pool=IR;
  const v=pickA(pool),others=shuffle(IR.filter(x=>x!==v)).slice(0,3),t=lv==='facil'?0:h?R(1,2):R(0,1);
  if(t===0) return {q:`What is the past simple of «${v[0]}»?`,o:[v[1],v[0]+(v[0].endsWith('e')?'d':'ed'),others[0][1],others[1][1]],e:`${v[0]} – ${v[1]} – ${v[2]}.`,l:1};
  if(t===1) return {q:`What is the past participle of «${v[0]}»?`,o:[v[2],v[0]+(v[0].endsWith('e')?'d':'ed'),others[0][2],others[1][2]],e:`${v[0]} – ${v[1]} – ${v[2]}.`,l:2};
  const uq=a=>{const o=[],s=new Set();for(const x of a){if(x&&!s.has(x)){s.add(x);o.push(x)}if(o.length>=4)break}return o};
  return {q:`Complete: I have never ___ (${v[0]}) that before.`,o:uq([v[2],v[1],v[0],v[0]+'ing',others[0][2],others[1][2]]),e:`After «have» we use the past participle: ${v[0]} – ${v[1]} – ${v[2]}.`,l:3}},
 flag:(h,tops)=>{ const c=pickCountry(h,tops); if(!c) return null; const ds=flagDistractors(c,h);
  if(h&&c[1]&&R(0,1)){ const dd=ds.filter(x=>x[1]).slice(0,3); return {q:'Quina és la capital del país d\'aquesta bandera?',o:[c[1],...dd.map(x=>x[1])],e:`És la bandera ${de(c[0])}; la capital és ${c[1]}.`,img:window.FLAGS[c[2]],flag:1,l:3}; }
  return {q:'De quin país és aquesta bandera?',o:[c[0],...ds.slice(0,3).map(x=>x[0])],e:`És la bandera ${de(c[0])}${c[1]?'; la capital és '+c[1]:''}.`,img:window.FLAGS[c[2]],flag:1,l:h?3:tier(c)===1?1:2}},
 cap:(h,tops)=>{ const c=pickCountry(h,tops,true); if(!c) return null; const ds=flagDistractors(c,h).filter(x=>x[1]).slice(0,3);
  if(h||R(0,2)===0) return {q:`De quin país és capital ${c[1]}?`,o:[c[0],...ds.map(x=>x[0])],e:`${c[1]} és la capital ${de(c[0])}.`,l:3};
  return {q:`Quina és la capital ${de(c[0])}?`,o:[c[1],...ds.map(x=>x[1])],e:`La capital ${de(c[0])} és ${c[1]}.`,l:tier(c)===1?1:2}}
};

return {GEN,shuffle,pickA,level:'normal'};
})();
