const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('pizza-computational-lab/index.html','utf8');vm.runInThisContext(html.match(/<script id="pizza-engine">([\s\S]*?)<\/script>/)[1]);
const L=globalThis.PizzaLab;
let count=0;
for(const method of ['diretto','poolish','biga'])for(const H of [50,65,80])for(const n of [1,4,12])for(const oil of [0,40]){
 const r=L.calculate({...L.defaults,method,H,n,olio:oil,prefHydro:method==='biga'?50:100,when:'2026-11-07T12:00'});
 assert.ok(Math.abs(r.mass-r.M)<1e-7);assert.ok(Math.abs(r.S/r.F-.025)<1e-12);assert.ok(Math.abs(r.W/r.F-H/100)<1e-10);assert.ok(r.finalW>=0);assert.ok(r.F/r.batches<=r.p.batchFlour+1e-7);assert.ok(r.M/r.batches<=900+1e-7);
 if(method!=='diretto'){assert.ok(Math.abs(r.prefF+r.finalF-r.F)<1e-7);assert.ok(Math.abs(r.prefW+r.finalW-r.W)<1e-7);assert.ok(Math.abs(r.prefY+r.finalY-r.Y)<1e-7)}
 const anchor=L.parseRome('2026-11-07T12:00'),forward=L.plan(r,anchor);assert.equal(forward.start,anchor);const rb={...r,p:{...r.p,anchor:'bake'}},back=L.plan(rb,anchor);assert.equal(back.firstBake,anchor);assert.ok(back.events.every(e=>e.end>=e.start));assert.equal(back.events.filter(e=>e.title.startsWith('Infornata')).length,n);
 for(const e of back.events.filter(e=>e.steps)){assert.ok(Math.abs(Math.max(...e.steps.map(s=>s.minute+s.duration))-(e.end-e.start)/60000)<1e-8)}
 count++;
}
assert.throws(()=>L.calculate({...L.defaults,method:'poolish',prefPct:60,H:50}),/più acqua/);
assert.throws(()=>L.calculate({...L.defaults,useFridge:true,hours:10,cold:8,proof:3,manualProof:true}),/totale/);
assert.throws(()=>L.calculate({...L.defaults,n:2.5}),/intero/);
assert.equal(L.romeInput(L.parseRome('2026-11-07T20:30')),'2026-11-07T20:30');
assert.throws(()=>L.parseRome('2027-03-28T02:30'),/non valida/);assert.throws(()=>L.parseRome('2027-10-31T02:30'),/ambiguo/);
const thermal=L.calculate({...L.defaults,model:'termico',useFridge:false,cold:0,temp:20,initialTemp:20});assert.ok(Math.abs(thermal.E-24)<1e-7);
assert.ok(Math.abs(thermal.q-L.qOriginal(65,thermal.p.sale,0,20,24,0))<1e-10);
console.log(`${count} scenari: massa, ripartizione, lotti, orari avanti/indietro, passi Bimby OK. Limiti, DST e modello termico OK.`);

// Frigorifero esplicito, appretto suggerito e modifica manuale.
const off=L.calculate({...L.defaults,useFridge:false,cold:16});
assert.equal(off.p.cold,0);
assert.equal(off.p.proof,3);
assert.ok(!L.plan(off,L.parseRome('2026-11-07T12:00')).events.some(e=>e.title.startsWith('Frigorifero')));
const automatic=L.calculate({...L.defaults,useFridge:true});assert.equal(automatic.p.proof,6);
const manual=L.calculate({...L.defaults,manualProof:true,proof:4});assert.equal(manual.p.proof,4);
assert.equal(L.calculate({...L.defaults,bimby:'TM7'}).p.bimby,'TM7');
assert.equal(L.fmtY(.728),'0,7');
assert.throws(()=>L.calculate({...L.defaults,useFridge:true,cold:0}),/maggiore di zero/);
for(const hours of [3,4,8,24,48])for(const temp of [15,22,30,35]){const r=L.calculate({...L.defaults,useFridge:false,hours,temp});assert.ok(r.p.proof>=.5);assert.ok(r.p.bulk>=1/6-1e-9);assert.ok(Math.abs(r.p.bulk+r.p.cold+r.p.proof+1/6-hours)<1e-8);}
console.log('Frigo on/off, appretto automatico/manuale, budget breve, temperatura, TM7 e decimi verificati.');

// Riconcilia le pesate effettive e verifica ogni singola istruzione.
for(const method of ['diretto','poolish','biga'])for(const oil of [0,40])for(const n of [1,4,12]){
 const r=L.calculate({...L.defaults,method,n,olio:oil,prefHydro:method==='biga'?50:100}),tot=L.weighedTotals(r);
 for(const phase of ['prefermento','finale']){const N=phase==='prefermento'?r.prefBatches:r.batches;if(!N)continue;const keys=['farina','acqua','lievito','sale','olio','prefermento'];const sums=Object.fromEntries(keys.map(k=>[k,0]));
 for(let i=1;i<=N;i++){const protocol=L.makeProtocol(r,phase,i);for(const k of keys)sums[k]+=protocol.weighed[k];let cursor=0;for(const step of protocol.steps){assert.ok(step.title&&step.text&&step.setting);assert.ok(Math.abs(step.minute-cursor)<1e-8);cursor+=step.duration;}assert.ok(Math.abs(cursor-protocol.minutes)<1e-8);
 const machines=protocol.steps.filter(s=>s.kind==='macchina');if(phase==='finale'){assert.equal(machines.filter(s=>s.setting.includes('Spiga')).reduce((sum,s)=>sum+s.duration,0),2);assert.ok(!machines.some(s=>/a filo/.test(s.text)));}else if(method==='biga'){assert.ok(!machines.some(s=>s.setting.includes('Spiga')));assert.ok(protocol.steps.some(s=>s.title.includes('biga grezza')));}
 }
 const expected=phase==='prefermento'?{farina:tot.prefF,acqua:tot.prefW,lievito:tot.prefY,sale:0,olio:0,prefermento:0}:{farina:tot.finalF,acqua:tot.finalW,lievito:tot.finalY,sale:tot.S,olio:tot.O,prefermento:tot.prefMass};for(const k of keys)assert.ok(Math.abs(sums[k]-expected[k])<1e-7,method+' '+phase+' '+k);
 }
}
console.log('18 ricette e 30 profili di fase: pesate riconciliate tra lotti, istruzioni complete, tempi contigui, 2 minuti Spiga nel finale, biga grezza a mano.');
console.log(L.makeProtocol(L.calculate(L.defaults),'finale',1).steps.map(s=>s.title+': '+s.text+' ['+s.setting+']').join('\n'));
