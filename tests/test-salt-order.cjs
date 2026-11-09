const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('pizza-computational-lab/index.html','utf8');
for(const id of ['pizza-engine','pizza-math','pizza-ui'])new vm.Script(html.match(new RegExp('<script id="'+id+'">([\\s\\S]*?)</script>'))[1]);
vm.runInThisContext(html.match(/<script id="pizza-engine">([\s\S]*?)<\/script>/)[1]);
const L=globalThis.PizzaLab,anchor=L.parseRome('2026-11-08T12:00');
assert.equal(L.defaults.saltAfterMix,true);assert.equal(L.defaults.useFridge,false);
let count=0;
for(const method of ['diretto','poolish','biga'])for(const autolysis of [false,true])for(const saltAfterMix of [false,true])for(const bimby of ['TM5','TM6','TM7'])for(const olio of [0,40]){
 const input={...L.defaults,method,autolysis,saltAfterMix,bimby,olio,prefHydro:method==='biga'?50:100};
 const r=L.calculate(input),alt=L.calculate({...input,saltAfterMix:!saltAfterMix});
 for(const key of ['F','W','S','O','Y'])assert.equal(r[key],alt[key]);
 const plan=L.plan(r,anchor),other=L.plan(alt,anchor);
 assert.equal(plan.firstBake,other.firstBake,'2 minuti complessivi invariati');
 const reverse=L.plan({...r,p:{...r.p,anchor:'bake'}},anchor);assert.equal(reverse.firstBake,anchor);
 for(let b=1;b<=r.batches;b++){
  const p=L.makeProtocol(r,'finale',b),salt=p.steps.findIndex(s=>s.ingredients.sale>0),oil=p.steps.findIndex(s=>s.ingredients.olio>0);
  const spiga=p.steps.map((s,i)=>({...s,i})).filter(s=>s.kind==='macchina'&&s.setting.includes('Spiga'));
  assert.equal(spiga.reduce((sum,s)=>sum+s.duration,0),2);
  assert.equal(spiga.length,saltAfterMix?2:1);
  if(saltAfterMix){assert.ok(spiga[0].i<salt&&salt<spiga[1].i);assert.equal(spiga[0].duration,1);assert.equal(spiga[1].duration,1);if(olio)assert.ok(spiga[0].i<oil&&oil<spiga[1].i);}
  else{assert.ok(salt<spiga[0].i);assert.equal(spiga[0].duration,2);}
  assert.ok(p.steps[salt].text.includes('attendi lo sblocco'));
  assert.ok(p.steps[salt].text.includes(L.fmt(p.weighed.sale)));
  const events=plan.events.filter(e=>/^(Impasto Bimby|Rinnovo Bimby)/.test(e.title)),e=events[b-1];
  const saltStart=e.start+p.steps[salt].minute*60000;
  assert.equal(L.chooseLiveAction(plan,saltStart).focus.title,'Pesa e aggiungi il sale');
 }
 if(method!=='diretto')for(let b=1;b<=r.prefBatches;b++)assert.equal(L.makeProtocol(r,'prefermento',b).steps.some(s=>s.ingredients.sale>0),false);
 if(autolysis)for(let b=1;b<=r.batches;b++)assert.equal(L.makeProtocol(r,'autolisi',b).steps.some(s=>s.ingredients.sale>0),false);
 count++;
}
assert.throws(()=>L.calculate({...L.defaults,saltAfterMix:'true'}),/opzioni/);
console.log(`${count} scenari: ordine sale on/off, autolisi, diretto/poolish/biga, TM5/6/7, olio, dosi, 2 minuti Spiga totali, timeline e azione attiva verificati.`);
