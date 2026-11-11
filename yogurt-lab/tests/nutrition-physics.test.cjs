const {test}=require('node:test');
const assert=require('node:assert/strict');
const M=require('../src/model.js'),N=require('../src/nutrition.js'),P=require('../src/physics.js');
const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);
test('Nutrition independently reconciles original ingredients and EU energy factors',()=>{
 const n=N.calculate(M.fromPreset('original'));
 // Independently calculated from grams and published source rows, rather than another UI helper.
 const protein=300*.11+150*.1256+125*.0347+16*.001+4*.015;
 const fat=300*.0098+150*.0951+125*.0325+92+4*.003;
 const carbs=300*.7361+150*.0072+125*.0466+250*.9998+16*.239+4*.054;
 const fiber=300*.027+16*.002+4*.106;
 near(n.total.protein,protein);near(n.total.fat,fat);near(n.total.carbs,carbs);near(n.total.fiber,fiber);
 near(n.total.kcal,4*(protein+carbs)+9*fat+2*fiber);
 near(n.total.kJ,17*(protein+carbs)+37*fat+8*fiber);
});
test('Cooking loss changes concentration, not total nutrient mass or total energy',()=>{
 const a=N.calculate({...M.defaults,bakeLoss:0}),b=N.calculate({...M.defaults,bakeLoss:20});
 near(a.total.kcal,b.total.kcal);near(b.per100.kcal,a.per100.kcal/0.8);
 const weighed=N.calculate({...M.defaults,cookedWeight:800});assert.equal(weighed.measured,true);near(weighed.per100.protein,weighed.total.protein/8);
 const invalid=N.calculate({...M.defaults,cookedWeight:2000});assert.equal(invalid.measured,false);assert.equal(invalid.invalidWeight,true);
});
test('Whole-egg scaling preserves nutrients per100g; portion counts change only portions',()=>{
 for(const p of M.presets){const s=M.fromPreset(p.id),a=N.calculate(s),b=N.calculate({...s,diameter:30});
  near(a.per100.kcal,b.per100.kcal);near(b.total.kcal,a.total.kcal*5/3);
 }
 const n=N.calculate({...M.defaults,portions:20});near(n.portion.kcal,n.total.kcal/20);
});
test('Missing sugar data stays missing, and sodium from baking powder is included',()=>{
 const orange=N.calculate(M.fromPreset('olive'));assert.equal(orange.total.sugars,null);assert.ok(orange.missing.includes('sugars'));
 const n=N.calculate(M.defaults);const powderSalt=12*19.7325/100;assert.ok(n.total.salt>1.5+powderSalt);
});
test('Custom labels are validated, preserved and used, never allowing executable content',()=>{
 const config=M.sanitize({...M.defaults,nutritionOverrides:{'oil-sunflower':{fat:100,sat:8,carbs:0,sugars:0,fiber:0,protein:0,salt:0},'<script>':{}}});
 assert.equal(Object.keys(config.nutritionOverrides).length,1);
 const n=N.calculate(config);assert.equal(n.rows.find(r=>r.key==='oil').nutrients.sat,8);
 const bad=M.sanitize({...M.defaults,nutritionOverrides:{'oil-sunflower':{fat:1,sat:8,carbs:0,sugars:0,fiber:0,protein:0,salt:0}}});assert.deepEqual(bad.nutritionOverrides,{});
});
test('Population solver conserves CO2 through transfers, mergers and openings',()=>{
 const run=P.run(M.defaults);assert.equal(run.snapshots.length,131);
 for(const f of run.snapshots){assert.ok(Math.abs(f.gasBalanceError)<1e-12);assert.ok(f.expansion>0);assert.ok(f.setting>=0&&f.setting<=1);assert.ok(f.pores.every(b=>Number.isFinite(b.r)&&b.r>0));}
 assert.ok(run.snapshots.at(-1).merged>0);assert.ok(run.snapshots.at(-1).count<run.snapshots[0].count);
});
test('Leavening, mixing, setting and pan shape change solver outcomes',()=>{
 const base=P.frame(M.defaults,40),low=P.frame({...M.defaults,leaven:6},40),mix=P.frame({...M.defaults,mix:80},40),setting=P.frame({...M.defaults,setTemp:75},40);
 assert.notEqual(base.expansion,low.expansion);assert.notEqual(base.count,mix.count);assert.notEqual(base.expansion,setting.expansion);
 assert.notEqual(M.thermal({...M.defaults,shape:'ring'},20).core,M.thermal(M.defaults,20).core);
 assert.notEqual(P.frame({...M.defaults,seed:43},40).medianDiameter,base.medianDiameter);
});
test('All flour catalogue profiles enter mass and nutrition calculations',()=>{
 for(const [flourId,profile] of Object.entries(M.flourProfiles)){
  const s={...M.defaults,flourId,protein:profile.protein},n=N.calculate(s);assert.ok(Number.isFinite(n.total.kcal)&&n.total.kcal>0);assert.ok(n.total.protein>0);
 }
});
