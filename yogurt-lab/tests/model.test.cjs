const {test}=require('node:test');
const assert=require('node:assert/strict');
const M=require('../src/model.js');
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('All variants conserve mass and proportions when pan scaling selects whole eggs',()=>{
 for(const p of M.presets){
  const a=M.calculate(M.fromPreset(p.id,M.defaults)),b=M.calculate({...a.s,diameter:30});
  close(a.scale,1);close(b.geometryScale,1.5625);close(b.scale,5/3);assert.equal(b.eggCount,5);
  close(a.ingredients.reduce((n,i)=>n+i.g,0),a.total);
  for(const i of a.ingredients)close(b.ingredients.find(j=>j.key===i.key).g,i.g*5/3);
  const blend=a.ingredients.filter(i=>['flour','starch','nuts'].includes(i.key)).reduce((n,i)=>n+i.g,0);close(blend,a.blend);
 }
});
test('Original recipe retains quantities with explicit oil conversion and packet assumption',()=>{
 const r=M.calculate(M.fromPreset('original'));
 const values=Object.fromEntries(r.ingredients.map(i=>[i.key,i.g]));
 assert.equal(values.flour,300);assert.equal(values.sugar,250);assert.equal(values.yogurt,125);assert.equal(values.oil,92);assert.equal(values.eggs,150);assert.equal(values.leaven,16);
});
test('Pan area accounts for ring hole and rectangular pan, portions only divide',()=>{
 const ring=M.calculate({...M.defaults,shape:'ring',diameter:24,hole:8});close(ring.geometryScale,8/9);close(ring.scale,1);assert.equal(ring.eggCount,3);
 const loaf=M.calculate({...M.defaults,shape:'loaf',length:25,width:11});close(loaf.area,275);
 close(M.calculate({...M.defaults,portions:20}).total,M.calculate(M.defaults).total);
});
test('Input normalization rejects injection and invalid numbers and preserves thermometer preference',()=>{
 const r=M.sanitize({device:'<script>',flour:NaN,diameter:Infinity,protein:100,thermometer:false,preset:'nope'});
 assert.equal(r.device,'TM6');assert.equal(r.flour,300);assert.equal(r.diameter,24);assert.equal(r.protein,16);assert.equal(r.thermometer,false);assert.equal(r.preset,'signature');
 assert.equal(M.fromPreset('original',r).thermometer,false);
});
test('All device protocols remove butterfly before flour and never exceed whisk speed 4',()=>{
 for(const device of ['TM5','TM6','TM7'])for(const p of M.presets){
  const s={...M.fromPreset(p.id),device},steps=M.protocol(s);
  for(let i=0;i<steps.length;i++)if(steps[i].name.includes('Incorpora le polveri')){
   assert.ok(steps[i-1].name.includes('Rimuovi la farfalla'));assert.match(steps[i].setting,/SENZA FARFALLA/);
  }
  assert.ok(steps.every(x=>x.seconds>0&&Number.isFinite(x.seconds)));
  assert.match(steps.find(s=>s.kind==='bake').text,/sonda/);
 }
 assert.doesNotMatch(M.protocol({...M.defaults,thermometer:false}).find(s=>s.kind==='bake').text,/sonda/);
});
test('Large batches repeat the whole preparation with exact equal ingredient shares',()=>{
 const r=M.calculate({...M.defaults,diameter:30,batchLimit:700});assert.equal(r.batches,3);
 const steps=M.protocol(r.s);assert.equal(steps.filter(s=>s.name.includes('Pesa e prepara')).length,3);
 for(const i of r.ingredients)close(i.g/r.batches*r.batches,i.g);
});
test('Thermal illustration remains bounded and monotonic; no real measurement is synthesized',()=>{
 for(const oven of [150,170,190]){let prev=0;for(let t=0;t<=65;t++){
  const v=M.thermal({...M.defaults,oven},t);assert.ok(v.core>=prev&&v.core<=99);assert.ok(v.expansion>=1);prev=v.core;
 }}
 close(M.thermal(M.defaults,0).core,M.defaults.initial);close(M.thermal(M.defaults,0).expansion,1);
});
