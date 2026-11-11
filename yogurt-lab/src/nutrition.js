/* Estimated nutrition, per edible ingredient mass. © 2026 Luca Amore · GPL-3.0-only */
(function(root){
 'use strict';
 const M=typeof module!=='undefined'&&module.exports?require('./model.js'):root.YogurtLab;
 const DB=typeof module!=='undefined'&&module.exports?require('./nutrition-data.js'):root.YogurtNutrients;
 const keys=['fat','sat','carbs','sugars','fiber','protein','salt'];
 const names={kcal:'Energia (kcal)',kJ:'Energia (kJ)',fat:'Grassi',sat:'di cui saturi',carbs:'Carboidrati',sugars:'di cui zuccheri',fiber:'Fibre',protein:'Proteine',salt:'Sale'};
 function ingredientRows(input){
  const r=M.calculate(input),s=r.s,fp=M.flourProfiles[s.flourId];
  const flourDb=DB[s.flourId]?s.flourId:({rice:'rice',oat:'oatFlourPartiallyDebranned',whole:'wholeWheatFlour',spelt:'speltGrainUncooked'}[s.flourId]||'wheatGeneric');
  const map={flour:flourDb,starch:'cornstarch',nuts:s.preset==='coffee'?'hazelnut':'almondBlanched',eggs:'egg',sugar:s.sweetener==='honey'?'honey':'sugar',yogurt:{whole:'yogurtWhole',greek:'fage5',greek0:'greek0',lactosefree:'yogurtWhole',soy:'soy'}[s.yogurtType],oil:{seed:'sunflower',olive:'olive',coconut:'coconutOil'}[s.oilType],leaven:'bakingPowder',salt:'salt',milk:'milk',extra:{lemon:'lemonPeel',orange:'orangePeel',poppy:'poppySeed',cocoa:'cocoa',blueberries:'blueberry',coffee:'espresso'}[s.extras]};
  return r.ingredients.map(i=>{
   const dbid=map[i.key],data={...DB[dbid]},id=i.key==='flour'?`flour-${s.flourId}`:`${i.key}-${dbid}`;
   let note=data.sourceType,source=data.source||'',approximate=data.sourceType!=='Etichetta del produttore';
   if(i.key==='flour'){
    data.protein=s.protein;
    if(DB[s.flourId]){source=fp.source;note='Tabella del produttore; proteine come impostate';approximate=s.protein!==fp.protein;}
    else{note=fp.brand?`Macro generici USDA; proteine ${fp.proteinAssumed?'ipotizzate':'da scheda'} come impostate. Non è la tabella ufficiale ${fp.brand}.`:'Profilo generico USDA; proteine come impostate.';approximate=true;}
   }
   if(i.key==='extra'&&s.extras==='poppy')for(const k of keys)data[k]=DB.poppySeed[k]===null||DB.lemonPeel[k]===null?null:DB.poppySeed[k]*.75+DB.lemonPeel[k]*.25;
   if(i.key==='extra'&&s.extras==='poppy')note='Miscela assunta: 75% semi di papavero + 25% scorza di limone (USDA).';
   if(i.key==='leaven')note='Lievito chimico generico USDA a fosfati. Il sodio varia per marca: sostituisci con la tua etichetta, soprattutto per il sale.';
   if(i.key==='milk')note='Parmalat: valori per 100 ml convertiti con densità assunta 1,03 g/ml.';
   if(i.key==='yogurt'&&s.yogurtType==='lactosefree')note='Proxy yogurt intero: sostituisci con la tabella del tuo prodotto senza lattosio.';
   if(s.nutritionOverrides[id]){Object.assign(data,s.nutritionOverrides[id]);note='Valori inseriti dalla tua etichetta';source='';approximate=false;}
   return {...i,id,dbid,nutrients:Object.fromEntries(keys.map(k=>[k,Number.isFinite(data[k])?data[k]:null])),source,note,approximate};
  });
 }
 function calculate(input){
  const r=M.calculate(input),s=r.s,rows=ingredientRows(s),total={};
  for(const k of keys)total[k]=rows.some(row=>row.nutrients[k]===null)?null:rows.reduce((n,row)=>n+row.g*row.nutrients[k]/100,0);
  total.kcal=4*total.protein+4*total.carbs+9*total.fat+2*total.fiber;
  total.kJ=17*total.protein+17*total.carbs+37*total.fat+8*total.fiber;
  const measured=s.cookedWeight>0&&s.cookedWeight<=r.total,cooked=measured?s.cookedWeight:r.total*(1-s.bakeLoss/100);
  const per100={},portion={};for(const k of [...keys,'kcal','kJ']){per100[k]=total[k]===null?null:total[k]/cooked*100;portion[k]=total[k]===null?null:total[k]/s.portions;}
  return {rows,total,per100,portion,cooked,measured,invalidWeight:s.cookedWeight>r.total,portionWeight:cooked/s.portions,loss:1-cooked/r.total,raw:r.total,missing:keys.filter(k=>total[k]===null),approximate:rows.some(r=>r.approximate)};
 }
 const api={calculate,ingredientRows,keys,names};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.YogurtNutrition=api;
})(typeof globalThis!=='undefined'?globalThis:this);
