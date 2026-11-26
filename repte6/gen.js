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

/* ---------- generadors ---------- */
function numQ(q,ans,cands,e,l){ const rr=x=>Math.round(x*1000)/1000; ans=rr(ans); cands=cands.map(rr); const set=new Set([ans]); const o=[ans]; for(const c of shuffle(cands)){ if(o.length>=4)break; if(c>0&&!set.has(c)){set.add(c);o.push(c)} } let k=1; while(o.length<4){ const c=ans+k*(k%2?1:-1)*Math.max(1,Math.round(ans*.1)); if(c>0&&!set.has(c)){set.add(c);o.push(c)} k++ } return {q,o:o.map(nf),e,l}; }
const GEN={
 'ma-calc':h=>{ const t=R(0,h?4:3);
  if(t===0){const a=R(3,12),b=R(3,12);return numQ(`Quant és ${a} × ${b}?`,a*b,[a*b+a,a*b-b,a*(b+1)+1,(a+1)*b],`${a} × ${b} = ${a*b}.`,1)}
  if(t===1){const a=R(23,89),b=R(12,79);return numQ(`Quant és ${a} + ${b}?`,a+b,[a+b+10,a+b-10,a+b+1,a+b-1],`${a} + ${b} = ${a+b}.`,1)}
  if(t===2){const b=R(15,60),a=b+R(12,70);return numQ(`Quant és ${a} − ${b}?`,a-b,[a-b+10,a-b-10,a-b+2,a+b],`${a} − ${b} = ${a-b}.`,1)}
  if(t===3){const b=R(3,12),c=R(3,12);return numQ(`Quant és ${b*c} : ${b}?`,c,[c+1,c-1,c+b,b],`${c} × ${b} = ${b*c}, per tant ${b*c} : ${b} = ${c}.`,2)}
  const x=R(12,99)/10,m=pickA([10,100,1000]);return numQ(`Quant és ${nf(x)} × ${nf(m)}?`,x*m,[x*m/10,x*m*10,x+m,x*m/100],`Multiplicar per ${nf(m)} mou la coma ${String(m).length-1} llocs a la dreta.`,3)},
 'ma-frac':h=>{ const t=R(0,2);
  if(t===0){const d=pickA([2,3,4,5,10]),n=R(1,d-1)||1,k=R(2,9),T=d*k;return numQ(`Quant és ${n}/${d} de ${T}?`,n*k,[k,T-n*k,n*k+k,n*d],`${T} : ${d} = ${k} i ${k} × ${n} = ${n*k}.`,2)}
  if(t===1){const d=R(5,12),a=R(1,d-3),b=R(1,d-a-1);return {q:`Quant és ${a}/${d} + ${b}/${d}?`,o:[`${a+b}/${d}`,`${a+b}/${2*d}`,`${a+b+1}/${d}`,`${a+b>2?a+b-1:a+b+2}/${d}`],e:`Amb el mateix denominador, sumem els numeradors: ${a} + ${b} = ${a+b}.`,l:2}}
  const d=pickA([3,4,5,7]),n=R(1,d-1),k=R(2,4);return {q:`Quina fracció és equivalent a ${n}/${d}?`,o:[`${n*k}/${d*k}`,`${n+k}/${d+k}`,`${n*k}/${d}`,`${d}/${n}`],e:`Multipliquem numerador i denominador per ${k}.`,l:3}},
 'ma-dec':h=>{ const t=R(0,2);
  if(t===0){const a=R(11,99)/10,b=R(101,499)/100;return numQ(`Quant és ${nf(a)} + ${nf(b)}?`,a+b,[a+b+1,a+b-.1,a+b+.1,a*10+b],`Posem les comes en columna: ${nf(a)} + ${nf(b)} = ${nf(a+b)}.`,2)}
  if(t===1){const x=R(101,999)/100;return numQ(`Arrodoneix ${nf(x)} a les unitats.`,Math.round(x),[Math.floor(x)+(Math.round(x)===Math.floor(x)?1:0),Math.round(x)+1,Math.round(x)+2],`Mirem les dècimes: si és 5 o més, arrodonim cap amunt.`,2)}
  const a=R(2,9)/10,b=a-R(1,3)/100+.05;return {q:`Quin nombre és més gran?`,o:[nf(Math.max(a,b)),nf(Math.min(a,b))],e:`Comparem primer les dècimes i després les centèsimes.`,l:3}},
 'ma-perc':h=>{ const p=pickA([10,20,25,50,75]),base=pickA([20,40,60,80,100,120,200,400]);const v=base*p/100;
  if(R(0,1)) return numQ(`Quant és el ${p}% de ${base}?`,v,[base-v,v*2,v/2,p],`El ${p}% vol dir ${p} de cada 100: ${base} × ${p} : 100 = ${nf(v)}.`,2);
  return numQ(`Una samarreta costa ${base} € i té un ${p}% de descompte. Quant pagues?`,base-v,[v,base,base-v/2,base+v],`El descompte és ${nf(v)} €; ${base} − ${nf(v)} = ${nf(base-v)} €.`,3)},
 'ma-mes':h=>{ const U=[["km","m",1000],["m","cm",100],["cm","mm",10],["kg","g",1000],["l","ml",1000],["h","min",60]];const [a,b,f]=pickA(U);const x=f===60?pickA([1.5,2,2.5,3,0.5]):R(12,95)/10;
  return numQ(`Quants ${b} són ${nf(x)} ${a}?`,x*f,[x*f/10,x*f*10,x*f+f,x*100],`1 ${a} = ${nf(f)} ${b}: ${nf(x)} × ${nf(f)} = ${nf(x*f)}.`,2)},
 'ma-geo':h=>{ if(R(0,2)===0) return null; if(R(0,1)){const a=R(3,15),b=R(3,12);return numQ(`Quina és l'àrea d'un rectangle de ${a} cm per ${b} cm? (en cm²)`,a*b,[2*(a+b),a+b,a*b+a,a*b-b],`Àrea del rectangle = base × altura = ${a} × ${b}.`,2)}
  const b=R(2,10)*2,hh=R(3,12);return numQ(`Quina és l'àrea d'un triangle de base ${b} cm i altura ${hh} cm? (en cm²)`,b*hh/2,[b*hh,b+hh,b*hh/2+b,(b+hh)*2],`Àrea = base × altura : 2 = ${b} × ${hh} : 2.`,3)},
 'en-irr':h=>{ const v=pickA(window.IRREG),others=shuffle(window.IRREG.filter(x=>x!==v)).slice(0,3),t=h?R(1,2):R(0,1);
  if(t===0) return {q:`What is the past simple of «${v[0]}»?`,o:[v[1],v[0]+(v[0].endsWith('e')?'d':'ed'),others[0][1],others[1][1]],e:`${v[0]} – ${v[1]} – ${v[2]}.`,l:1};
  if(t===1) return {q:`What is the past participle of «${v[0]}»?`,o:[v[2],v[0]+(v[0].endsWith('e')?'d':'ed'),others[0][2],others[1][2]],e:`${v[0]} – ${v[1]} – ${v[2]}.`,l:2};
  return {q:`Complete: I have never ___ (${v[0]}) that before.`,o:[v[2],v[1],v[0],others[0][2]],e:`After «have» we use the past participle: ${v[0]} – ${v[1]} – ${v[2]}.`,l:3}},
 flag:(h,tops)=>{ const pool=window.COUNTRIES.filter(c=>tops.has('fl-'+c[3])); const c=pickA(pool); const same=shuffle(window.COUNTRIES.filter(x=>x!==c&&x[3]===c[3])); const rest=shuffle(window.COUNTRIES.filter(x=>x!==c&&x[3]!==c[3]));
  return {q:'De quin país és aquesta bandera?',o:[c[0],...same.concat(rest).slice(0,3).map(x=>x[0])],e:`És la bandera ${de(c[0])}${c[1]?'; la capital és '+c[1]:''}.`,img:window.FLAGS[c[2]],flag:1,l:2}},
 cap:(h,tops)=>{ const pool=window.COUNTRIES.filter(c=>c[1]&&tops.has('fl-'+c[3])); const c=pickA(pool); const ds=shuffle(window.COUNTRIES.filter(x=>x!==c&&x[1]&&x[3]===c[3])).concat(shuffle(window.COUNTRIES.filter(x=>x[1]&&x[3]!==c[3]))).slice(0,3);
  if(h||R(0,2)===0) return {q:`De quin país és capital ${c[1]}?`,o:[c[0],...ds.map(x=>x[0])],e:`${c[1]} és la capital ${de(c[0])}.`,l:3};
  return {q:`Quina és la capital ${de(c[0])}?`,o:[c[1],...ds.map(x=>x[1])],e:`La capital ${de(c[0])} és ${c[1]}.`,l:2}}
};

return {GEN,shuffle,pickA};
})();
