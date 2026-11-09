// Copyright (C) 2026 Luca Amore — SPDX-License-Identifier: GPL-3.0-only
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync('pizza-computational-lab/index.html','utf8');
for(const id of ['pizza-engine','pizza-schedule','pizza-fermentation'])vm.runInThisContext(html.match(new RegExp('<script id="'+id+'">([\\s\\S]*?)</script>'))[1]);
const L=PizzaLab,F=PizzaFermentation,H=3600000;let checks=0;
for(const method of ['diretto','poolish','biga'])for(const anchor of ['start','bake'])for(const autolysis of [false,true])for(const fridge of [false,true]){
 const r=L.calculate({...L.defaults,method,anchor,autolysis,useFridge:fridge,pizzaStyle:'tradizionale',when:'2026-11-12T19:00',prefHydro:method==='poolish'?100:50}),plan=L.plan(r,L.parseRome(r.p.when)),before=JSON.stringify({r,plan});
 const phases=method==='diretto'?['final']:['final','preferment'];
 for(const phase of phases){const h=phase==='preferment'?16:fridge?20:18.5;
 const c=F.scheduledDurationChoice(r,plan,h,phase,plan.start-100*H);assert(c.ok);assert(c.changed);
 assert.equal(c.recipe.p.anchor,anchor);assert.equal(c.recipe.p.when,r.p.when);
 if(anchor==='start'){assert.equal(c.plan.start,plan.start);assert.notEqual(c.plan.firstBake,plan.firstBake);}else{assert.equal(c.plan.firstBake,plan.firstBake);assert.equal(c.plan.end,plan.end);assert.notEqual(c.plan.start,plan.start);}
 if(phase==='final')assert.equal(c.plan.fermentationStart-c.plan.start,plan.fermentationStart-plan.start);
 for(const k of ['Y','F','W','S','O'])assert.equal(c.recipe[k],r[k]);
 const rebuilt=L.plan(L.calculate(JSON.parse(JSON.stringify(c.recipe.p))),L.parseRome(c.recipe.p.when));assert.equal(rebuilt.firstBake,c.firstBake);assert.equal(rebuilt.start,c.start);
 assert(c.start<c.plan.fermentationStart);assert.equal(c.start,Math.min(...c.plan.events.filter(e=>e.type==='active').map(e=>e.start)));
 assert(F.scheduledDurationChoice(r,plan,h,phase,c.start-1).ok);
 for(const now of [c.start,c.start+1,c.start+H]){const denied=F.scheduledDurationChoice(r,plan,h,phase,now);assert(!denied.ok);assert.equal(denied.reason,'past');}
 assert.equal(JSON.stringify({r,plan}),before);
 // Applying another chart duration must not change the reference or accumulate drift.
 const again=F.scheduledDurationChoice(c.recipe,c.plan,phase==='preferment'?12:24,phase,plan.start-100*H);assert(again.ok);assert.equal(again.recipe.p.when,r.p.when);assert.equal(again.recipe.p.anchor,anchor);assert.equal(again.recipe.Y,r.Y);assert.equal(anchor==='start'?again.start:again.firstBake,anchor==='start'?plan.start:plan.firstBake);
 if(phase==='final'){const a=F.build(r,plan),b=F.build(c.recipe,c.plan);assert.equal(a.total,b.total);assert(Math.abs(a.peak-b.peak)<1e-8);assert.equal(a.points.length,b.points.length);for(let i=0;i<a.points.length;i++)assert(Math.abs(a.points[i].u-b.points[i].u)<1e-10);}
 checks++;
 }
}
// With a fixed start both shorter and longer durations retain the selected date/time.
const now=Date.parse('2026-11-09T13:00:00Z'),r=L.calculate({...L.defaults,when:'2026-11-09T14:30'}),plan=L.plan(r,L.parseRome(r.p.when));
for(const duration of [18,25,48]){const c=F.scheduledDurationChoice(r,plan,duration,'final',now);assert(c.ok);assert.equal(c.recipe.p.when,'2026-11-09T14:30');assert.equal(c.start,plan.start);}
// With a fixed first bake, an overlong duration that moves start into the past is blocked.
const bake=L.calculate({...r.p,anchor:'bake',when:L.romeInput(plan.firstBake,true)}),bp=L.plan(bake,plan.firstBake);
assert(F.scheduledDurationChoice(bake,bp,18,'final',now).ok);assert.equal(F.scheduledDurationChoice(bake,bp,25,'final',now).reason,'past');
assert.equal(F.scheduledDurationChoice(r,plan,2,'final',now).reason,'range');assert.equal(F.scheduledDurationChoice(r,plan,18,'final',NaN).reason,'schedule');
// Minute-only user fields, while machine actions keep internal second precision.
assert(/id="startTime"[^>]*step="60"/.test(html));
assert.deepEqual(PizzaSchedule.split('2026-11-11T08:24:20'),{day:'2026-11-11',time:'08:24'});
for(const when of ['2026-11-12T19:00:30','2026-03-29T03:30:30','2026-12-31T23:59:59'])assert.equal(L.romeInput(L.parseRome(when),true),when);
for(const when of ['2026-10-25T02:30:30','2026-03-29T02:30:30','2026-11-12T19:00:60'])assert.throws(()=>L.parseRome(when));
for(const when of ['2026-03-29T06:00','2026-10-25T06:00','2027-01-01T06:00'])for(const anchor of ['start','bake']){
 const r=L.calculate({...L.defaults,anchor,hours:6,when}),plan=L.plan(r,L.parseRome(when)),c=F.scheduledDurationChoice(r,plan,4,'final',plan.start-24*H);assert(c.ok);assert.equal(c.recipe.p.when,when);assert.equal(c.recipe.p.anchor,anchor);assert.equal(anchor==='start'?c.start:c.firstBake,anchor==='start'?plan.start:plan.firstBake);
}
const one=L.calculate({...L.defaults,n:1,anchor:'bake',hours:6,when:'2026-11-11T19:00'}),onePlan=L.plan(one,L.parseRome(one.p.when)),oneChoice=F.scheduledDurationChoice(one,onePlan,4,'final',now);
assert(oneChoice.ok);assert.equal(oneChoice.recipe.p.when,'2026-11-11T19:00');assert.notEqual(oneChoice.start%60000,0);assert.equal(oneChoice.plan.firstBake,onePlan.firstBake);
console.log(`${checks} anchor scenarios passed: fixed reference date/time/type, repeat confirmations, unchanged yeast/ingredients/curve, future-only start, direct/poolish/biga, autolyse/fridge, minute fields, precise machine actions, DST/year rollover.`);
