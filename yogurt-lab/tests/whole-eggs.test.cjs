const {test}=require('node:test');
const assert=require('node:assert/strict');
const M=require('../src/model.js'),N=require('../src/nutrition.js'),P=require('../src/physics.js');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('All recipe and pan suggestions use whole eggs and retain every ingredient ratio',()=>{
 for(const p of M.presets)for(const shape of ['round','ring','loaf'])for(const diameter of [16,20,24,26,28,30]){
  const reference=M.calculate(M.fromPreset(p.id)),r=M.calculate({...reference.s,shape,diameter});
  assert.ok(Number.isInteger(r.eggCount)&&r.eggCount>=1);
  near(r.eggMass,r.eggCount*50);near(r.ingredients.find(i=>i.key==='eggs').g,r.eggMass);
  for(const i of reference.ingredients)near(r.ingredients.find(x=>x.key===i.key).g,i.g*r.scale);
  near(r.total,reference.total*r.scale);near(r.depthRatio,r.scale/r.geometryScale);
 }
});
test('Selecting a count or weighing all eggs rescales the entire recipe, including nutrition',()=>{
 const reference=M.calculate(M.defaults),four=M.calculate({...M.defaults,eggCount:4});
 assert.equal(four.eggCount,4);near(four.eggMass,200);
 const weighed=M.calculate({...M.defaults,eggCount:3,eggWeight:167});
 assert.equal(weighed.eggCount,3);assert.equal(weighed.eggEstimated,false);near(weighed.eggMass,167);
 for(const i of reference.ingredients)near(weighed.ingredients.find(x=>x.key===i.key).g,i.g*167/150);
 near(N.calculate(weighed.s).total.kcal,N.calculate(M.defaults).total.kcal*167/150);
 near(N.calculate(weighed.s).per100.kcal,N.calculate(M.defaults).per100.kcal);
 assert.notEqual(M.thermal(weighed.s,20).core,M.thermal(M.defaults,20).core);
});
test('Count validation, restored historical entries and preset changes preserve their intended meaning',()=>{
 assert.equal(M.sanitize({eggCount:2.5}).eggCount,3);
 assert.equal(M.sanitize({eggCount:Infinity,eggWeight:NaN}).eggCount,0);
 assert.equal(M.sanitize({eggCount:-10,eggWeight:-2}).eggWeight,0);
 const historical=M.calculate({...M.defaults,diameter:30,wholeEggs:false});near(historical.scale,1.5625);
 const next=M.fromPreset('cocoa',{...M.defaults,eggCount:4,eggWeight:215});assert.equal(next.eggCount,4);assert.equal(next.eggWeight,0);assert.equal(next.wholeEggs,true);
 assert.notEqual(P.key(M.defaults),P.key({...M.defaults,eggCount:4}));
 assert.notEqual(P.key(M.defaults),P.key({...M.defaults,eggWeight:167}));
 assert.notEqual(P.key(M.defaults),P.key({...M.defaults,wholeEggs:false}));
});
test('Multiple batches consume the full egg weight and very small pans get a fill-level notice',()=>{
 const s={...M.defaults,diameter:30,batchLimit:700},r=M.calculate(s),steps=M.protocol(s);
 assert.equal(r.eggCount,5);assert.equal(r.batches,3);
 near(r.ingredients.find(i=>i.key==='eggs').g/r.batches*r.batches,250);
 assert.match(steps[0].text,/5 uova intere: 250 g/);
 assert.match(steps[0].text,/sbatti insieme tutte le uova/);
 const tiny=M.calculate({...M.defaults,shape:'ring',diameter:16,hole:14});assert.equal(tiny.eggCount,1);assert.ok(tiny.warnings.some(x=>x.includes('supera 2/3')));
});
