const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');const html=fs.readFileSync('pizza-computational-lab/index.html','utf8');const engine=html.match(/<script id="pizza-engine">([\s\S]*?)<\/script>/)[1];vm.runInThisContext(engine);const L=globalThis.PizzaLab;
const start=100000,end=120000;
assert.deepEqual([L.temporalState(start,end,start-1).state,L.temporalState(start,end,start).state,L.temporalState(start,end,end).state],['upcoming','active','elapsed']);
assert.equal(L.temporalState(start,end,start+10000).percent,50);
assert.equal(L.temporalState(start,end,start+10000).remainingMs,10000);
assert.equal(L.temporalState(start,end,start-200000).ratio,0);
assert.equal(L.temporalState(start,end,end+200000).ratio,1);
assert.equal(L.temporalState(start,start,start).percent,100);
assert.equal(L.clockDuration(20000),'20 s');assert.equal(L.clockDuration(1),'1 s');assert.equal(L.clockDuration(-10),'0 s');assert.equal(L.clockDuration(65000),'1 min 5 s');
const recipe=L.calculate(L.defaults),plan=L.plan(recipe,L.parseRome('2026-11-08T12:00'));
const first=plan.events.findIndex(e=>e.steps),e=plan.events[first];
let confirmed={};
const begin=L.chooseLiveAction(plan,e.start,confirmed);assert.equal(begin.focus.key,`step:${first}:0`);
const transition=e.start+e.steps[1].minute*60000;assert.equal(L.chooseLiveAction(plan,transition,confirmed).focus.key,`step:${first}:1`);
assert.equal(L.chooseLiveAction(plan,plan.start-10000).focus,null);assert.equal(L.chooseLiveAction(plan,plan.start-10000).next.key,`step:${first}:0`);
confirmed=L.confirmAction(plan,confirmed,`event:${first}`,true);assert.equal(confirmed[`step:${first}:0`],true);assert.notEqual(L.chooseLiveAction(plan,e.start,confirmed).focus?.event,first);
confirmed=L.confirmAction(plan,confirmed,`step:${first}:1`,false);assert.equal(confirmed[`event:${first}`],false);assert.equal(confirmed[`step:${first}:0`],true);assert.equal(confirmed[`step:${first}:1`],false);
const late=L.chooseLiveAction(plan,plan.end+1000,{});assert.equal(late.focus,null);assert.equal(late.next,null);assert.ok(late.unconfirmed>0);
assert.deepEqual(L.chooseLiveAction(plan,plan.end+1000,{}),late); // Nessuna conferma implicita al trascorrere del tempo.
const fold=plan.events.find(e=>e.title.startsWith('Piega'));assert.equal(L.chooseLiveAction(plan,fold.start).focus.title,fold.title);
const heat=plan.events.find(e=>e.title==='Preriscalda il forno');assert.equal(L.chooseLiveAction(plan,heat.start).focus.title,heat.title);
// La visualizzazione riparte dall'orologio assoluto anche dopo una lunga pausa.
assert.equal(L.temporalState(start,end,start+1000).percent,5);assert.equal(L.temporalState(start,end,start+19000).percent,95);
assert.throws(()=>L.temporalState(10,5,7),/Intervallo/);
for(const id of ['pizza-engine','pizza-ui'])new vm.Script(html.match(new RegExp('<script id="'+id+'">([\\s\\S]*?)</script>'))[1]);
assert.ok(html.includes('data-now-line'));assert.ok(html.includes('data-step-check'));assert.ok(html.includes('window.setInterval(updateLive,1000)'));
console.log('Avanzamento: confini inizio/fine, countdown al secondo, percentuali, ripresa orologio, azioni in parallelo e conferme esplicite verificati.');
