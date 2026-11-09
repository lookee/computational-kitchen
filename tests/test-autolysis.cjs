const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('pizza-computational-lab/index.html','utf8');
vm.runInThisContext(html.match(/<script id="pizza-engine">([\s\S]*?)<\/script>/)[1]);
const L=globalThis.PizzaLab,anchor=L.parseRome('2026-11-08T12:00');
assert.equal(L.defaults.useFridge,false);
assert.equal(L.calculate(L.defaults).p.cold,0);
assert.equal(L.defaults.autolysis,false);
let count=0;
for(const method of ['diretto','poolish','biga'])for(const H of [65,85])for(const n of [1,4,30])for(const useFridge of [false,true])for(const model of ['empirico','termico']){
 const input={...L.defaults,method,H,n,useFridge,model,prefHydro:method==='biga'?50:100,olio:.2};
 const off=L.calculate(input),r=L.calculate({...input,autolysis:true}),tot=L.weighedTotals(r);
 for(const key of ['F','W','Y','S','O'])assert.equal(r[key],off[key],key+' invariato');
 const plan=L.plan(r,anchor),back=L.plan({...r,p:{...r.p,anchor:'bake'}},anchor);
 assert.equal(plan.start,anchor);assert.equal(back.firstBake,anchor);
 const auto=plan.events.filter(e=>/^Autolisi · preparazione/.test(e.title));
 const rest=plan.events.find(e=>e.title==='Riposo di autolisi');
 const final=plan.events.filter(e=>/^(Impasto Bimby|Rinnovo Bimby)/.test(e.title));
 assert.equal(auto.length,r.batches);assert.equal(final.length,r.batches);
 assert.equal(rest.start,auto.at(-1).end);
 assert.equal(rest.end-rest.start,30*60000);
 assert.equal(final[0].start,rest.end);
 if(method!=='diretto'){
  const mature=plan.events.find(e=>e.title.startsWith('Maturazione'));
  assert.equal(mature.end,rest.end,'autolisi pronta al rinnovo');
  assert.ok(auto[0].start>=mature.start,'autolisi durante la maturazione');
 }
 const sums={farina:0,acqua:0,lievito:0,sale:0,olio:0};
 for(let b=1;b<=r.batches;b++){
  const a=L.makeProtocol(r,'autolisi',b),f=L.makeProtocol(r,'finale',b);
  for(const k of Object.keys(sums))sums[k]+=a.weighed[k]+f.weighed[k];
  assert.equal(a.weighed.lievito+a.weighed.sale+a.weighed.olio+a.weighed.prefermento,0);
  assert.equal(f.weighed.farina,0,'farina non aggiunta due volte');
  assert.ok(Math.abs(a.weighed.farina+a.weighed.acqua-f.weighed.autolisi)<1e-8);
  assert.ok(f.weighed.acqua>=0);
  const salt=f.steps.findIndex(s=>s.ingredients.sale>0);
  assert.ok(f.steps.slice(0,salt).some(s=>s.kind==='macchina'),'prima amalgama, poi sale');
  for(const protocol of [a,f]){
   let t=0;for(const s of protocol.steps){assert.ok(Math.abs(s.minute-t)<1e-7);t+=s.duration;}
   assert.ok(Math.abs(t-protocol.minutes)<1e-7);
  }
 }
 for(const [k,v]of Object.entries({farina:tot.finalF,acqua:tot.finalW,lievito:tot.finalY,sale:tot.S,olio:tot.O}))assert.ok(Math.abs(sums[k]-v)<1e-7,k+' riconciliato');
 const firstAuto=L.makeProtocol(r,'autolisi',1),firstFinal=final[0];
 const selected=L.chooseLiveAction(plan,rest.start+60000,{});
 assert.ok(selected.focus.title==='Riposo di autolisi'||selected.focus.title.startsWith('Maturazione'));
 assert.equal(L.temporalState(rest.start,rest.end,rest.start+15*60000).percent,50);
 assert.ok(!plan.events.some(e=>e.title.startsWith('Frigorifero'))===!useFridge);
 count++;
}
for(const autolysisMinutes of [20,45,60]){
 const r=L.calculate({...L.defaults,autolysis:true,autolysisMinutes});
 const rest=L.plan(r,anchor).events.find(e=>e.title==='Riposo di autolisi');
 assert.equal(rest.end-rest.start,autolysisMinutes*60000);
}
assert.throws(()=>L.calculate({...L.defaults,autolysis:true,method:'poolish',prefPct:50,H:65}),/Autolisi: serve acqua/);
assert.throws(()=>L.calculate({...L.defaults,autolysis:true,autolysisMinutes:0}),/riposo di autolisi/);
assert.throws(()=>L.calculate({...L.defaults,autolysis:true,autolysisMinutes:61}),/riposo di autolisi/);
assert.ok(L.calculate({...L.defaults,autolysis:true,H:50}).F>0);
console.log(`${count} scenari autolisi: ingredienti senza duplicazioni, sale dopo amalgama, lotti, parallelismo prefermento, frigo, modelli, orari avanti/indietro e avanzamento verificati. Limiti e riposo personalizzato OK.`);
