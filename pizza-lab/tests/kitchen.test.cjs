const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../../pizza-computational-lab.html'),'utf8');
const scripts=[...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)],context=vm.createContext({console,Intl,Date});
vm.runInContext(scripts.find(m=>m[2].includes('const defaults={method:'))[2],context);
vm.runInContext(scripts.find(m=>m[1].includes('id="pizza-language"'))[2],context);
const L=context.PizzaLab,I=context.PizzaLanguage,K=require('../src/kitchen-model.js');
function recipe(p={}){const r=L.calculate({...L.defaults,...p}),plan=L.plan(r,Date.UTC(2027,0,1,12));return{r,plan};}
test('agenda preserves each original action and total schedule across all cooking protocols',()=>{
 for(const method of ['diretto','poolish','biga'])for(const bimby of ['TM5','TM6','TM7'])for(const autolysis of [false,true]){
  const {r,plan}=recipe({method,bimby,autolysis,prefHydro:method==='biga'?50:100,n:3,H:70,useFridge:true,cold:12,gap:6});
  const before=JSON.stringify({r,plan}),cards=K.build(r,plan,'it',I),original=L.liveActions(plan);
  assert.equal(JSON.stringify({r,plan}),before);
  assert.equal(cards[0].start,Math.round(Math.min(...original.map(s=>s.start))));
  assert.equal(cards.at(-1).end,Math.round(plan.end));
  let seconds=0;const completions=[];
  for(let i=0;i<cards.length;i++){
   const c=cards[i];assert.ok(c.seconds>0);assert.equal(c.seconds,Math.round(c.seconds));seconds+=c.seconds;
   if(i)assert.equal(c.start,cards[i-1].end,'no gaps or duplicate elapsed time');
   for(const key of c.confirmKeys){const s=original.find(x=>x.key===key);assert.ok(s);assert.equal(c.end,Math.round(s.end),'only complete an action at its end');completions.push(key);}
  }
  assert.equal(seconds,(cards.at(-1).end-cards[0].start)/1000);
  assert.deepEqual([...completions].sort(),Array.from(original,x=>x.key).sort());
  assert.ok(cards.some(c=>c.primary.some(s=>/Piega/.test(s.title))),'folds stay accessible during bulk fermentation');
  assert.ok(cards.some(c=>c.primary.some(s=>s.title==='Preriscalda il forno')),'preheat is not hidden behind proofing');
 }
});
test('partial waits and overlapping bakes require manual confirmation at the correct boundary',()=>{
 const {r,plan}=recipe({n:4,bakeMinutes:4,gap:1}),cards=K.build(r,plan,'it',I);
 const bulk=plan.events.findIndex(e=>e.title.startsWith('Puntata')),firstWait=cards.find(c=>c.contributors.some(s=>s.key===`event:${bulk}`));
 assert.ok(firstWait.interrupted);assert.ok(!firstWait.confirmKeys.includes(`event:${bulk}`));
 assert.equal(K.completed(firstWait,{},[]),false);assert.equal(K.completed(firstWait,{},[firstWait.id]),true);
 assert.ok(cards.some(c=>c.parallel&&c.primary.some(s=>s.title.startsWith('Infornata'))&&c.primary.some(s=>s.title.startsWith('Stendi'))));
 const bake=plan.events.findIndex(e=>e.title==='Infornata 1/4');
 const during=cards.find(c=>c.primary.some(s=>s.key===`event:${bake}`)&&c.end<plan.events[bake].end);
 assert.ok(during);assert.ok(!during.confirmKeys.includes(`event:${bake}`));
});
test('English cards use the same dose, timing and device-specific instructions as the existing recipe',()=>{
 for(const method of ['diretto','poolish','biga']){
  const {r,plan}=recipe({method,prefHydro:method==='biga'?50:100,bimby:'TM7',autolysis:true,H:70});
  const it=K.build(r,plan,'it',I),en=K.build(r,plan,'en',I);
  assert.deepEqual(en.map(c=>[c.id,c.start,c.end,c.confirmKeys]),it.map(c=>[c.id,c.start,c.end,c.confirmKeys]));
  const raw=plan.events.find(e=>e.steps),translated=I.englishEvent(raw,r).steps[0];
  assert.equal(en.find(c=>c.primary.some(s=>s.title===translated.title)).primary[0].text,translated.text);
  assert.ok(!en.map(c=>c.title).join(' ').includes('Pesa'));
 }
});
test('timer uses elapsed wall time, pauses exactly and never confirms or changes a recipe',()=>{
 let t=K.timer(30);assert.equal(K.clock(K.remaining(t,1000)),'00:30');
 t=K.toggle(t,30,1000);assert.equal(K.remaining(t,12000),19);
 t=K.toggle(t,30,12000);assert.equal(t.running,false);assert.equal(K.remaining(t,999999),19);
 t=K.toggle(t,30,999999);assert.equal(K.remaining(t,1004999),14);
 t=K.expire(t,2000000);assert.equal(t.running,false);assert.equal(K.remaining(t),0);
 assert.deepEqual(K.toggle(t,30,2000000),{running:true,deadline:2030000,remaining:30});
 assert.equal(K.clock(3661),'01:01:01');assert.equal(K.clock(96*3600),'96:00:00');
 const {r,plan}=recipe(),card=K.build(r,plan)[0];assert.equal(K.completed(card,{},[]),false);
 const child=card.contributors.find(s=>s.parent);assert.equal(K.completed(card,{[child.parent]:true},[]),true);
});
test('oven-recovery gaps are represented without completing non-existent actions',()=>{
 const {r,plan}=recipe({n:2,gap:10}),cards=K.build(r,plan),gap=cards.find(c=>c.id.endsWith(':gap'));
 assert.ok(gap);assert.equal(gap.seconds,8*60);assert.deepEqual(gap.confirmKeys,[]);assert.equal(K.completed(gap,{},[]),false);
});
test('unchecking the shared checklist restores the corresponding cooking steps',()=>{
 const {r,plan}=recipe(),cards=K.build(r,plan),card=cards[0],key=card.contributors[0].key,parent=card.contributors[0].parent;
 assert.equal(K.firstPending(cards,{},[card.id]),1);
 const done=K.reconcile(cards,[card.id],{[key]:true,[parent]:true},{[key]:false,[parent]:false});
 assert.deepEqual(done,[]);assert.equal(K.firstPending(cards,{},done),0);
});
test('downloadable HTML embeds cooking sources and dialog without external dependencies',()=>{
 for(const [id,file] of [['pizza-kitchen-model','kitchen-model.js'],['pizza-kitchen-ui','kitchen-ui.js']])assert.equal(scripts.find(m=>m[1].includes(`id="${id}"`))[2].trim(),fs.readFileSync(path.join(__dirname,'../src/'+file),'utf8').trim());
 const dialog=fs.readFileSync(path.join(__dirname,'../src/kitchen-dialog.html'),'utf8').trim();assert.ok(html.includes(dialog));
 assert.equal((html.match(/id="kitchenDialog"/g)||[]).length,1);
});
