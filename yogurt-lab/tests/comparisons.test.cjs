const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const M=require('../src/model.js'),N=require('../src/nutrition.js');
function ui(mobile=false){
 const elements=new Map(),el=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',hidden:false,addEventListener(){}});return elements.get(id);};
 const context={window:{YogurtLab:M,YogurtNutrition:N,YogurtI18n:{t:s=>s,locale:'en-GB'},matchMedia:()=>({matches:mobile})},document:{getElementById:el}};
 vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/comparisons.js'),'utf8'),context);
 context.window.YogurtComparisons.attach({state:()=>M.defaults,experiments:()=>[],refresh(){}});
 return {api:context.window.YogurtComparisons,el};
}
test('Radar uses the same radial percentage scale for all eight ingredients',()=>{
 const {api}=ui(),p=api.radarPoints([100,50,0,25,100,50,0,25],100,180,200,104);
 assert.equal(p.length,8);assert.equal(p[0][0],180);assert.equal(p[0][1],96);
 for(let i=0;i<p.length;i++)assert.ok(Math.abs(Math.hypot(p[i][0]-180,p[i][1]-200)-[100,50,0,25,100,50,0,25][i]/100*104)<1e-8);
});
test('Desktop and mobile radar retain the current and selected recipe, axes and exact-value table',()=>{
 for(const mobile of [false,true]){
  const {api,el}=ui(mobile);assert.equal(api.render('compare'),true);
  const html=el('chartArea').innerHTML;
  assert.match(html,/class="radar-chart"/);assert.match(html,mobile?/viewBox="0 0 360 400"/:/viewBox="0 0 740 450"/);
  assert.equal((html.match(/class="radar-axis"/g)||[]).length,8);
  assert.equal((html.match(/class="radar-grid"/g)||[]).length,4);
  assert.equal((html.match(/class="radar-profile"/g)||[]).length,2);
  assert.match(html,/data-recipe="current"/);assert.match(html,/data-recipe="original"/);
  assert.match(html,/compare-table/);assert.match(html,/Signature · limone &amp; vaniglia|La tua ricetta attuale/);
  assert.match(el('chartCaption').textContent,/stessa scala/);
 }
});
