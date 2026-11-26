/* Generadors de llengües: English (world, comparatius, temps verbals, preposicions, question words),
   Català i Castellà (conjugació, accentuació, sinònims/antònims). S'afegeixen a window.GENQ.GEN */
(function(){
const GEN=window.GENQ.GEN, shuffle=window.GENQ.shuffle, pickA=window.GENQ.pickA;
const R=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const uniq=(arr,n)=>{const o=[],s=new Set();for(const x of arr){if(x==null||s.has(x))continue;s.add(x);o.push(x);if(o.length>=n)break}return o};
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);

/* ---------- ENGLISH · world ---------- */
const CC=window.COUNTRIES, EC=window.EN_COUNTRY;
const byCont=c=>CC.filter(x=>x[3]===c[3]&&x!==c), others=c=>CC.filter(x=>x[3]!==c[3]);
const tierOf=c=>(window.FLAG_TIER||{})[c[2]]||2;
const pool=t=>{ const base=CC.filter(c=>!t||!t.size||[...t].some(k=>k==='en-world'||k==='fl-'+c[3])); const lv=window.GENQ.level; const f=lv==='facil'?base.filter(c=>tierOf(c)===1):lv==='dificil'?base.filter(c=>tierOf(c)>=2&&(tierOf(c)===3||Math.random()<0.4)):base.filter(c=>tierOf(c)<=2); return f.length?f:base.length?base:CC; };
GEN['en-world']=(h,t)=>{
 const lv=window.GENQ.level, c=pickA(pool(t)), e=EC[c[2]], ds=shuffle(byCont(c)).concat(shuffle(others(c))), k=lv==='facil'?pickA([0,3]):h?pickA([1,2,4,5,4]):R(0,4);
 if(k===0) return {q:'Which country is this flag from?',o:uniq([e[0],...ds.map(x=>EC[x[2]][0])],4),e:`It's the flag of ${e[0]}.`,img:window.FLAGS[c[2]],flag:1,l:1};
 if(k===1&&e[2]) return {q:`What is the capital of ${e[0]}?`,o:uniq([e[2],...ds.map(x=>EC[x[2]][2])],4),e:`${e[2]} is the capital of ${e[0]}.`,l:2};
 if(k===2) return {q:`People from ${e[0]} are...`,o:uniq([e[1],...ds.map(x=>EC[x[2]][1])],4),e:`${cap(e[1])} is the nationality; the country is ${e[0]}.`,l:2};
 if(k===3) return {q:`Where is ${e[0]}?`,o:uniq([window.EN_CONT[c[3]],...shuffle(Object.values(window.EN_CONT))],4),e:`${e[0]} is in ${window.EN_CONT[c[3]]}.`,l:1};
 if(k===4&&e[2]) return {q:`${e[2]} is the capital of...`,o:uniq([e[0],...ds.map(x=>EC[x[2]][0])],4),e:`${e[2]} is the capital of ${e[0]}.`,l:3};
 const o=others(c); return {q:`Which of these countries is in ${window.EN_CONT[c[3]]}?`,o:uniq([e[0],...shuffle(o).map(x=>EC[x[2]][0])],4),e:`${e[0]} is in ${window.EN_CONT[c[3]]}.`,l:2};
};

/* ---------- ENGLISH · comparatives & superlatives ---------- */
GEN['en-comp']=h=>{
 const a=pickA(window.ADJ), oth=shuffle(window.ADJ.filter(x=>x!==a)), k=window.GENQ.level==='facil'?pickA([0,2]):h?pickA([1,3,4,4,3]):R(0,3);
 const isLong=a[1].startsWith('more '), isIrr=['good','bad','far'].includes(a[0]);
 const wrongComp=isIrr?a[0]+'er':isLong?a[0]+'er':'more '+a[0];
 const wrongSup=isIrr?'the '+a[0]+'est':isLong?'the '+a[0]+'est':'the most '+a[0];
 if(k===0) return {q:`Complete: ${a[3]} (${a[0]})`,o:[a[1],wrongComp,a[2],a[0]],e:`Comparative of "${a[0]}": ${a[1]} + than.`,l:1};
 if(k===1) return {q:`Complete: ${a[4]} (${a[0]})`,o:[a[2],wrongSup,a[1],'most '+a[0]],e:`Superlative of "${a[0]}": ${a[2]}.`,l:2};
 if(k===2) return {q:`What is the comparative of "${a[0]}"?`,o:[a[1],wrongComp,oth[0][1],a[2]],e:`${a[0]} – ${a[1]} – ${a[2]}.`,l:1};
 if(k===3) return {q:`Which sentence is correct?`,o:[a[3].replace('___',a[1]),a[3].replace('___',wrongComp),a[3].replace('___',a[2]),a[3].replace('___',a[1]).replace(' than ',' that ')],e:`We say "${a[1]} than".`,l:3};
 return {q:`Which sentence is correct?`,o:[a[4].replace('___',a[2]),a[4].replace('___',wrongSup),a[4].replace('___',a[1]),a[4].replace('___',a[2].replace('the ',''))],e:`Superlatives take "the": ${a[2]}.`,l:3};
};

/* ---------- ENGLISH · tenses ---------- */
const beOf=p=>p==='1'?'am':p==='3'?'is':'are';
GEN['en-tense']=h=>{
 const v=pickA(window.VERBS_EN), [S0,p]=pickA(window.SUBJ_EN), C=v[5], k=window.GENQ.level==='facil'?R(0,1):h?pickA([2,3,4,5,6,5,6]):R(0,4);
 const S=S0, s=(S0==='I'||S0==='Anna and Pau')?S0:S0.toLowerCase();
 const third=p==='3', base=v[0], s3=v[1], ing=v[2], past=v[3], be=beOf(p);
 const reg=past===base+'ed'||past===base+'d'||past===base.slice(0,-1)+'ied'||past===base+base.slice(-1)+'ed';
 if(k===0) return {q:`Complete: ${S} ___ (${base}) ${C} ${pickA(['every day','at the weekend','on Saturdays','in the morning','in summer'])}.`,o:uniq([third?s3:base,third?base:s3,ing,past,`${be} ${ing}`],4),e:third?`With he, she and it we add -s: ${s3}.`:`With ${S.toLowerCase()} we use the base form: ${base}.`,l:1};
 if(k===1) return {q:`Complete: Look! ${S} ___ (${base}) ${C} now.`,o:uniq([`${be} ${ing}`,third?s3:base,`${be} ${base}`,`${be} ${s3}`,past],4),e:`Present continuous: ${be} + ${ing}.`,l:1};
 if(k===2) return {q:`Complete: Yesterday ${s} ___ (${base}) ${C}.`,o:uniq([past,reg?s3:base+'ed',third?s3:base,ing,`${be} ${ing}`],4),e:reg?`Regular past: ${base} → ${past}.`:`Irregular past: ${base} → ${past}.`,l:2};
 if(k===3) return {q:`Complete: Tomorrow ${s} ___ (${base}) ${C}.`,o:[`${be} going to ${base}`,`${be} going to ${s3}`,`going to ${base}`,`${be} going ${base}`],e:`Future plans: ${be} going to + ${base}.`,l:2};
 if(k===4){ const t=R(0,2); const aux=t===0?(third?'Does':'Do'):t===1?'Did':cap(be); const tail=t===0?`${base} ${C} every day?`:t===1?`${base} ${C} yesterday?`:`${ing} ${C} now?`;
   return {q:`Complete: ___ ${s} ${tail}`,o:uniq([aux,third?'Do':'Does','Did','Is','Are','Was'],4),e:t===0?`Present simple question: ${aux} + subject + ${base}.`:t===1?`Past question: Did + subject + ${base}.`:`Present continuous question: ${aux} + subject + ${ing}.`,l:2}; }
 if(k===5) return {q:`Complete: ${S} ___ (not ${base}) ${C} every day.`,o:uniq([third?`doesn't ${base}`:`don't ${base}`,third?`don't ${base}`:`doesn't ${base}`,`doesn't ${s3}`,`not ${base}`],4),e:third?`Negative with he/she/it: doesn't + ${base}.`:`Negative: don't + ${base}.`,l:3};
 return {q:`Complete: Last week ${s} ___ (not ${base}) ${C}.`,o:[`didn't ${base}`,`didn't ${past}`,`don't ${past}`,`wasn't ${base}`],e:`Past negative: didn't + ${base} (never the past form).`,l:3};
};

/* ---------- ENGLISH · prepositions & question words ---------- */
GEN['en-prep']=h=>{
 if(R(0,1)){ const [x,pr]=pickA(window.PREP_T); const yr=/\d{4}|century/.test(x); const f=yr?pickA([`She was born ___ ${x}.`,`My parents got married ___ ${x}.`,`The school opened ___ ${x}.`]):pickA([`See you ___ ${x}.`,`The party is ___ ${x}.`,`We usually play football ___ ${x}.`,`I always get up early ___ ${x}.`]);
   return {q:`Complete: ${f}`,o:[pr,...['at','on','in'].filter(p=>p!==pr)],e:`We say "${pr} ${x}".`,l:pr==='at'?2:1}; }
 const [q,w]=pickA(window.QW); return {q:`Complete: ${q}`,o:uniq([w,...shuffle(['Who','Where','When','Why','How','What','Whose','Which']).filter(x=>x!==w)],4),e:`The answer tells us ${w==='Who'?'a person':w==='Where'?'a place':w==='When'?'a time':w==='Why'?'a reason':w==='Whose'?'an owner':'what we asked about'}: ${w}.`,l:2};
};

/* ---------- CATALÀ · conjugació ---------- */
const caForms=(inf,c,tense)=>{
 let st=inf.replace(/(ar|re|er|ir)$/,''); const fut=inf.replace(/er$/,'r');
 const jg=s=>s.replace(/j(?=[ei])/g,'g');
 if(tense==='futur') return ['é','às','à','em','eu','an'].map(e=>(c===2?fut:inf)+e);
 if(tense==='passat perifràstic') return ['vaig','vas','va','vam','vau','van'].map(a=>a+' '+inf);
 if(c===1) return tense==='present'?['o','es','a','em','eu','en'].map(e=>jg(st+e)):['ava','aves','ava','àvem','àveu','aven'].map(e=>st+e);
 if(c===2) return tense==='present'?[st+'o',st+'s',st,st+'em',st+'eu',st+'en']:['ia','ies','ia','íem','íeu','ien'].map(e=>st+e);
 if(c===3) return tense==='present'?[st+'o',st+'s',st,st+'im',st+'iu',st+'en']:['ia','ies','ia','íem','íeu','ien'].map(e=>st+e);
 return tense==='present'?[st+'eixo',st+'eixes',st+'eix',st+'im',st+'iu',st+'eixen']:['ia','ies','ia','íem','íeu','ien'].map(e=>st+e);
};
const CA_T=['present','imperfet','futur','passat perifràstic'];
GEN['ca-conj']=h=>{
 const easy=window.GENQ.level==='facil'; // fàcil: només present i persones del singular · difícil: tots els temps i sobretot plurals
 const [inf,c]=pickA(window.CA_VERBS), t=easy?'present':pickA(h?CA_T:CA_T.slice(0,3)), p=easy?R(0,2):h?(Math.random()<0.7?R(3,5):R(0,2)):R(0,5), f=caForms(inf,c,t), ok=f[p];
 const otherT=CA_T.filter(x=>x!==t).map(x=>caForms(inf,c,x)[p]);
 const k=easy?0:h?R(1,2):R(0,2);
 if(k===0) return {q:`Com es conjuga «${inf}» en ${t} per a «${window.CA_PRON[p]}»?`,o:uniq([ok,...shuffle(f.filter(x=>x!==ok)).slice(0,2),...shuffle(otherT)],4),e:`${cap(window.CA_PRON[p])} ${ok} (${t} del verb ${inf}).`,l:t==='present'?1:2};
 if(k===1) return {q:`En quin temps verbal està «${window.CA_PRON[p].split(' ')[0]} ${ok}»?`,o:uniq([cap(t),...shuffle(CA_T.filter(x=>x!==t)).map(cap)],4),e:`«${ok}» és el ${t} del verb ${inf}.`,l:2};
 return {q:`Quina forma correspon a «${window.CA_PRON[p]}» (${t})? Verb: ${inf}`,o:uniq([ok,...shuffle(f.filter(x=>x!==ok))],4),e:`Les persones del ${t}: ${f.join(', ')}.`,l:3};
};

/* ---------- CASTELLANO · conjugación ---------- */
const esForms=(inf,c,tense)=>{
 const st=inf.slice(0,-2);
 if(tense==='futuro') return ['é','ás','á','emos','éis','án'].map(e=>inf+e);
 if(c===1){ if(tense==='presente') return ['o','as','a','amos','áis','an'].map(e=>st+e); if(tense==='pretérito perfecto simple') return ['é','aste','ó','amos','asteis','aron'].map(e=>st+e); return ['aba','abas','aba','ábamos','abais','aban'].map(e=>st+e); }
 if(tense==='presente') return c===2?['o','es','e','emos','éis','en'].map(e=>st+e):['o','es','e','imos','ís','en'].map(e=>st+e);
 if(tense==='pretérito perfecto simple') return ['í','iste','ió','imos','isteis','ieron'].map(e=>st+e);
 return ['ía','ías','ía','íamos','íais','ían'].map(e=>st+e);
};
const ES_T=['presente','pretérito perfecto simple','pretérito imperfecto','futuro'];
GEN['es-conj']=h=>{
 const easy=window.GENQ.level==='facil';
 const [inf,c]=pickA(window.ES_VERBS), t=easy?'presente':pickA(h?ES_T:[ES_T[0],ES_T[1],ES_T[3]]), p=easy?R(0,2):h?(Math.random()<0.7?R(3,5):R(0,2)):R(0,5), f=esForms(inf,c,t), ok=f[p];
 const otherT=ES_T.filter(x=>x!==t).map(x=>esForms(inf,c,x)[p]);
 const k=easy?0:h?R(1,2):R(0,2);
 if(k===0) return {q:`¿Cómo se conjuga «${inf}» en ${t} para «${window.ES_PRON[p]}»?`,o:uniq([ok,...shuffle(f.filter(x=>x!==ok)).slice(0,2),...shuffle(otherT)],4),e:`${cap(window.ES_PRON[p])} ${ok} (${t} del verbo ${inf}).`,l:t==='presente'?1:2};
 if(k===1) return {q:`¿En qué tiempo verbal está «${window.ES_PRON[p].split(' ')[0]} ${ok}»?`,o:uniq([cap(t),...shuffle(ES_T.filter(x=>x!==t)).map(cap)],4),e:`«${ok}» es el ${t} del verbo ${inf}.`,l:2};
 return {q:`¿Qué forma corresponde a «${window.ES_PRON[p]}» (${t})? Verbo: ${inf}`,o:uniq([ok,...shuffle(f.filter(x=>x!==ok))],4),e:`Las personas del ${t}: ${f.join(', ')}.`,l:3};
};

/* ---------- accentuació / tildes ---------- */
const moveAcc=(w,avoid)=>{ const plain=w.normalize('NFD').replace(/[\u0300-\u036f]/g,''); const vi=[...plain].map((ch,i)=>'aeiou'.includes(ch)?i:-1).filter(i=>i>=0); const forms=vi.map(i=>plain.slice(0,i)+{a:'á',e:'é',i:'í',o:'ó',u:'ú'}[plain[i]]+plain.slice(i+1)); const order=plain===w?forms.slice().reverse():forms; return order.find(f=>f!==w&&f!==avoid)||null; };
const accGen=(list,types,lang)=>h=>{
 const [w,t,wrong]=pickA(list), k=R(0,h?2:1);
 if(k===0) return {q:lang==='ca'?`Quin tipus de paraula és «${w}»?`:`¿Qué tipo de palabra es «${w}»?`,o:[cap(t),...types.filter(x=>x!==t).map(cap)],e:lang==='ca'?`«${w}» és ${t}.`:`«${w}» es ${t}.`,l:1};
 if(k===1) return {q:lang==='ca'?'Quina paraula està ben escrita?':'¿Cuál está bien escrita?',o:uniq([w,wrong,moveAcc(w,wrong)],3),e:lang==='ca'?`La forma correcta és «${w}» (${t}).`:`La forma correcta es «${w}» (${t}).`,l:2};
 const same=shuffle(list.filter(x=>x[1]===t&&x[0]!==w)).slice(0,1).map(x=>x[0]), diff=shuffle(list.filter(x=>x[1]!==t)).slice(0,2).map(x=>x[0]);
 return {q:lang==='ca'?`Quina d'aquestes paraules NO és ${t}?`:`¿Cuál de estas palabras NO es ${t}?`,o:[diff[0],w,...same,diff[1]].filter(Boolean).slice(0,4),e:lang==='ca'?`«${diff[0]}» no és ${t}; les altres sí.`:`«${diff[0]}» no es ${t}; las otras sí.`,l:3};
};
GEN['ca-acc']=accGen(window.CA_ACC,['aguda','plana','esdrúixola'],'ca');
GEN['es-acc']=accGen(window.ES_ACC,['aguda','llana','esdrújula'],'es');

/* ---------- sinònims i antònims ---------- */
const synGen=(list,lang)=>h=>{
 const e=pickA(list), oth=shuffle(list.filter(x=>x!==e)), k=R(0,h?2:1);
 if(k===0) return {q:lang==='ca'?`Quin és un sinònim de «${e[0]}»?`:`¿Cuál es un sinónimo de «${e[0]}»?`,o:[e[1],e[2],oth[0][1],oth[1][2]],e:lang==='ca'?`«${e[1]}» vol dir el mateix que «${e[0]}»; «${e[2]}» és l'antònim.`:`«${e[1]}» significa lo mismo que «${e[0]}»; «${e[2]}» es el antónimo.`,l:1};
 if(k===1) return {q:lang==='ca'?`Quin és l'antònim de «${e[0]}»?`:`¿Cuál es el antónimo de «${e[0]}»?`,o:[e[2],e[1],oth[0][2],oth[1][1]],e:lang==='ca'?`«${e[2]}» és el contrari de «${e[0]}».`:`«${e[2]}» es lo contrario de «${e[0]}».`,l:1};
 if(k===2&&R(0,1)) return {q:lang==='ca'?`Quina parella NO són sinònims?`:`¿Qué pareja NO son sinónimos?`,o:[`${e[0]} – ${e[2]}`,`${e[0]} – ${e[1]}`,`${oth[0][0]} – ${oth[0][1]}`,`${oth[1][0]} – ${oth[1][1]}`],e:lang==='ca'?`«${e[0]}» i «${e[2]}» són antònims, no sinònims.`:`«${e[0]}» y «${e[2]}» son antónimos, no sinónimos.`,l:3};
 return {q:lang==='ca'?`Quina parella són antònims?`:`¿Qué pareja son antónimos?`,o:[`${e[0]} – ${e[2]}`,`${e[0]} – ${e[1]}`,`${oth[0][0]} – ${oth[0][1]}`,`${oth[1][0]} – ${oth[2][1]}`],e:lang==='ca'?`«${e[0]}» i «${e[2]}» volen dir el contrari.`:`«${e[0]}» y «${e[2]}» significan lo contrario.`,l:3};
};
GEN['ca-syn']=synGen(window.CA_SYN,'ca');
GEN['es-syn']=synGen(window.ES_SYN,'es');
})();
