const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('pizza-computational-lab/index.html','utf8');
const read=(h,id)=>h.match(new RegExp('<script id="'+id+'">([\\s\\S]*?)</script>'))[1];
for(const id of ['pizza-engine','pizza-math','pizza-ui'])new vm.Script(read(html,id));vm.runInThisContext(read(html,'pizza-engine'));vm.runInThisContext(read(html,'pizza-math'));
const L=globalThis.PizzaLab,render=globalThis.PizzaMath.render,docs=[];
for(const autolysis of [false,true])for(const method of ['diretto','poolish','biga'])for(const model of ['empirico','termico'])for(const oil of [0,.2,40]){
 const r=L.calculate({...L.defaults,autolysis,method,model,olio:oil,prefHydro:method==='biga'?50:100}),doc=render(r,'<p>Provenienza di prova</p>');
 assert.ok(doc.includes('Simboli e unità'));assert.ok(doc.includes('Notazione LaTeX'));assert.ok(doc.includes('<mfrac>'));assert.ok(doc.includes('Formula')||doc.includes('Poolish')||doc.includes('Biga'));
 assert.ok(!doc.includes('undefined'));assert.ok(!doc.includes('NaN'));assert.ok(!doc.includes('[object Object]'));
 const ids=Array.from(doc.matchAll(/\bid="([^"]+)"/g),x=>x[1]);assert.equal(ids.length,new Set(ids).size,'ID univoci');
 const dd=doc.match(/Preparazione \+ prefermento d_prep<\/dt><dd>([^<]+)<\/dd>/)[1];const shown=Number(dd.replace(/\s?h$/,'').replaceAll('.','').replace(',','.'));
 const plan=L.plan(r,L.parseRome('2026-11-08T12:00'));
 assert.ok(Math.abs(shown-(plan.fermentationStart-plan.start)/3600000)<1e-7,'Durata documentata uguale alla timeline');
 docs.push({method,model,oil,html:doc});
}
fs.writeFileSync('.test-output/math-cases.json',JSON.stringify(docs));
console.log(`${docs.length} scenari: documentazione generata, risultati della ricetta, durate effettive e ID univoci verificati.`);
