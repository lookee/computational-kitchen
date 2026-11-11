const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'../../pizza-computational-lab.html'),'utf8');
const scripts=[...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
const context=vm.createContext({console,Intl,Date});
const core=scripts.find(m=>m[2].includes('const defaults={method:'));
assert.ok(core,'existing calculator script');vm.runInContext(core[2],context);
vm.runInContext(scripts.find(m=>m[1].includes('id="pizza-fermentation"'))[2],context);
const L=context.PizzaLab,F=context.PizzaFermentation,P=require('../src/crumb-model.js');
const recipe=changes=>L.calculate({...L.defaults,...changes});
const run=(changes={},settings={})=>{const r=recipe(changes);return P.run(r,L.plan(r,Date.UTC(2027,0,1)),settings,F);};
const final=r=>r.snapshots.at(-1);
test('3D solver conserves CO2 through transfer, merger, shaping and baking',()=>{
 const sim=run();assert.equal(sim.supported,true);assert.ok(sim.snapshots.length>100);
 for(const f of sim.snapshots){
  const scale=Math.max(f.generatedCO2,1e-9);assert.ok(Math.abs(f.balanceError)<scale*1e-10);
  for(const k of ['generatedCO2','retainedCO2','reservoirCO2','lostCO2'])assert.ok(f[k]>=-1e-15,k);
  assert.ok(f.porosity>0&&f.porosity<1);assert.ok(f.expansion>0&&Number.isFinite(f.expansion));
  assert.ok(f.pores.every(b=>b.r>0&&Number.isFinite(b.r)&&b.x>=0&&b.x<=f.width&&b.y>=0&&b.y<=f.height&&b.z>=0&&b.z<=f.depth));
  assert.ok(f.setting>=0&&f.setting<=1);assert.ok(f.temperature<=99);
 }
 assert.ok(final(sim).merged>0);assert.ok(final(sim).setting>.7);
 const before=sim.snapshots[sim.fermentationEnd],after=sim.snapshots[sim.shapingIndex];
 assert.ok(Math.abs(after.retainedCO2-before.retainedCO2*.78)<1e-12);
 assert.ok(after.expansion<before.expansion);
 assert.equal(final(sim).generatedCO2,after.generatedCO2);
});
test('actual yeast dose and cold history affect gas, not a normalised curve maximum',()=>{
 const short=run({hours:6,yeastMode:'fixed',yeastRatio:.001}),long=run({hours:24,yeastMode:'fixed',yeastRatio:.001});
 assert.ok(final(long).generatedCO2>final(short).generatedCO2);
 const cold=run({hours:24,useFridge:true,cold:16,yeastMode:'fixed',yeastRatio:.001});
 assert.ok(final(cold).generatedCO2<final(long).generatedCO2);
 const lower=run({yeastMode:'fixed',yeastRatio:.0001});assert.ok(final(lower).generatedCO2<final(long).generatedCO2);
 const zero=run({yeastMode:'fixed',yeastRatio:0});assert.equal(final(zero).generatedCO2,0);
});
test('recipe and editable process assumptions alter outcomes reproducibly',()=>{
 const base=run();
 assert.equal(run(),base,'cached deterministic run');
 assert.deepEqual(final(run({}, {seed:43})),final(run({}, {seed:43})));
 assert.notEqual(final(run({}, {seed:43})).medianDiameter,final(base).medianDiameter);
 assert.notEqual(final(run({H:75})).porosity,final(base).porosity);
 assert.notEqual(final(run({autolysis:true})).porosity,final(base).porosity);
 assert.ok(final(run({}, {retention:40})).retainedCO2<final(base).retainedCO2);
 assert.ok(final(run({}, {shapingLoss:70})).retainedCO2<final(base).retainedCO2);
 const weak=run({}, {development:25});assert.ok(final(weak).retainedCO2<final(base).retainedCO2);
 assert.notEqual(final(run({}, {drainage:2})).merged,final(run({}, {drainage:90})).merged);
 const low=run({}, {ovenTemp:180,heatTau:8});assert.ok(final(low).setting<final(base).setting);
 assert.notEqual(final(run({}, {diameter:36})).medianDiameter,final(base).medianDiameter);
 const light=run({peso:150});assert.notEqual(light.parameters.height,base.parameters.height);
});
test('direct, poolish and biga retain recipe quantities; unsupported flours do not fabricate cells',()=>{
 for(const method of ['diretto','poolish','biga']) {
  const r=recipe({method,prefHydro:method==='biga'?50:100}),before=JSON.stringify(r);
  const out=P.run(r,L.plan(r,Date.UTC(2027,0,1)),{},F);assert.equal(out.supported,true);
  assert.equal(JSON.stringify(r),before);assert.ok(final(out).generatedCO2>0);
  if(method!=='diretto')assert.ok(out.snapshots[0].generatedCO2>0);
 }
 const profile=F.profiles.find(p=>p.model===false);assert.ok(profile);
 assert.equal(run({flourProfile:profile.id,farina:profile.name}).supported,false);
});
test('input ranges and long cold/hot schedules remain finite',()=>{
 const s=P.sanitize({seed:NaN,steam:99,nuclei:-5,heatTau:0});
 assert.equal(s.seed,42);assert.equal(s.steam,.6);assert.equal(s.nuclei,80);assert.equal(s.heatTau,.4);
 for(const [changes,settings] of [[{hours:96,useFridge:true,cold:88},{nuclei:80}], [{hours:3,temp:35,H:85},{ovenTemp:500,heatTau:.4,nuclei:80}], [{hours:96,temp:35},{nuclei:80}]]){
  const sim=run(changes,settings);assert.ok(Number.isFinite(final(sim).porosity));
  assert.ok(Math.abs(final(sim).balanceError)<1e-12);
 }
});
test('custom flour W and tolerance follow the same assumptions as the fermentation graph',()=>{
 const r=recipe({flourProfile:'custom',farina:'My flour'}),plan=L.plan(r,Date.UTC(2027,0,1));
 const a=P.run(r,plan,{},F,{customW:200,capFactor:1});
 const b=P.run(r,plan,{},F,{customW:350,capFactor:1.3});
 assert.equal(a.parameters.w,200);assert.equal(b.parameters.w,350);
 assert.notEqual(a.parameters.C,b.parameters.C);assert.notEqual(final(a).retainedCO2,final(b).retainedCO2);
});
test('baking duration invalidates the cache and reaches the exact requested final time',()=>{
 const short=run({bakeMinutes:2}),long=run({bakeMinutes:12}),fractional=run({bakeMinutes:2.05});
 assert.equal(final(short).minute,2);assert.equal(final(long).minute,12);assert.equal(final(fractional).minute,2.05);
 assert.ok(final(long).setting>=final(short).setting);assert.notEqual(short,long);
});
test('embedded sources match the downloadable HTML',()=>{
 for(const [id,file] of [['pizza-crumb-model','crumb-model.js'],['pizza-crumb-ui','crumb-ui.js']]){
  assert.equal(scripts.find(m=>m[1].includes(`id="${id}"`))[2].trim(),fs.readFileSync(path.join(__dirname,'../src/'+file),'utf8').trim());
 }
});
