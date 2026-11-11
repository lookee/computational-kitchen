window.YogurtNutritionUI=(()=>{
 const $=id=>document.getElementById(id),N=window.YogurtNutrition,fmt=(v,d=1)=>v===null?'n.d.':v.toLocaleString('it-IT',{maximumFractionDigits:d}),esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let api;
 function attach(callbacks){api=callbacks;
  const updateWeight=()=>{const value=Number($('cookedWeight').value);if($('cookedWeight').checkValidity()&&value!==api.state().cookedWeight)api.patch({cookedWeight:value});};
  const updateLoss=()=>{const value=Number($('bakeLoss').value);if($('bakeLoss').checkValidity()&&value!==api.state().bakeLoss)api.patch({bakeLoss:value,cookedWeight:0});};
  for(const event of ['input','change']){$('cookedWeight').addEventListener(event,updateWeight);$('bakeLoss').addEventListener(event,updateLoss);}
  $('resetNutrientOverrides').addEventListener('click',()=>{api.patch({nutritionOverrides:{}});api.toast('Profili nutrizionali di riferimento ripristinati.');});
  $('nutrientInputs').addEventListener('click',e=>{const button=e.target.closest('[data-save-nutrients]');if(!button)return;const id=button.dataset.saveNutrients,row=button.closest('tr'),values={};
   for(const k of N.keys){const el=row.querySelector(`[data-nutrient="${k}"]`);if(el.value===''||!el.checkValidity()){el.reportValidity();api.toast('Completa tutti i valori della riga; usa zero soltanto quando è dichiarato o noto.');return;}values[k]=Number(el.value);}
   if(values.sat>values.fat||values.sugars>values.carbs||values.fat+values.carbs+values.fiber+values.protein+values.salt>105){api.toast('Controlla i valori: saturi ≤ grassi, zuccheri ≤ carboidrati e totale compatibile con 100 g.');return;}
   const s=api.state();if(id.startsWith('flour-')&&(values.protein<5||values.protein>16)){api.toast('Per questa farina usa proteine tra 5 e 16 g/100 g.');return;}
   api.patch({nutritionOverrides:{...s.nutritionOverrides,[id]:values},...(id.startsWith('flour-')?{protein:values.protein}:{})});api.toast('Etichetta dell’ingrediente aggiornata.');
  });
 }
 function render(s){
  const n=N.calculate(s);$('cookedWeight').value=s.cookedWeight;$('bakeLoss').value=s.bakeLoss;
  $('nutritionBasis').textContent=`${fmt(n.cooked,0)} g di torta cotta ${n.measured?'pesati':'stimati'} · ${s.portions} porzioni da ${fmt(n.portionWeight,0)} g · perdita di massa ${fmt(n.loss*100,1)}%`;
  $('weightAdvice').textContent=n.invalidWeight?'Il peso inserito supera la massa cruda: verifica tara e unità. Per ora è usata la perdita stimata.':n.measured?'Peso cotto misurato: la base per 100 g usa questa misura. Gli ingredienti rimangono una stima compositiva.':'Peso cotto stimato. Per un confronto più solido pesa la torta fredda, senza stampo né carta, e inserisci il risultato.';
  const tableRows=[['energy','Energia'],['fat','Grassi'],['sat','di cui acidi grassi saturi'],['carbs','Carboidrati'],['sugars','di cui zuccheri'],['fiber','Fibre'],['protein','Proteine'],['salt','Sale']];
  $('nutritionLabel').innerHTML=`<div class="nutrition-label-title"><strong>Valori nutrizionali</strong><span>STIMA DA RICETTA</span></div><table><thead><tr><th>Valori medi stimati</th><th>Per 100 g<br>di torta cotta</th><th>Per porzione<br>da ${fmt(n.portionWeight,0)} g</th></tr></thead><tbody>${tableRows.map(([k,name])=>`<tr class="${['sat','sugars'].includes(k)?'subnutrient':''}"><td>${name}</td><td>${k==='energy'?`${fmt(n.per100.kJ,0)} kJ / ${fmt(n.per100.kcal,0)} kcal`:`${fmt(n.per100[k],k==='salt'?2:1)}${n.per100[k]===null?'':' g'}`}</td><td>${k==='energy'?`${fmt(n.portion.kJ,0)} kJ / ${fmt(n.portion.kcal,0)} kcal`:`${fmt(n.portion[k],k==='salt'?2:1)}${n.portion[k]===null?'':' g'}`}</td></tr>`).join('')}</tbody></table><p>Intera torta: circa ${fmt(n.total.kcal,0)} kcal · peso ${n.measured?'misurato':'stimato'} ${fmt(n.cooked,0)} g</p>`;
  const energy=[['Carboidrati',n.total.carbs*4,'#688748'],['Grassi',n.total.fat*9,'#b88552'],['Proteine',n.total.protein*4,'#638b96'],['Fibre',n.total.fiber*2,'#b1bc97']];
  $('macroEnergy').innerHTML=`<div class="energy-bar" role="img" aria-label="Ripartizione dell’energia calcolata dai nutrienti">${energy.map(([name,kcal,color])=>`<i style="width:${kcal/n.total.kcal*100}%;background:${color}" title="${name}: ${fmt(kcal/n.total.kcal*100,1)}% dell’energia"></i>`).join('')}</div><div class="energy-legend">${energy.map(([name,kcal,color])=>`<span><i style="background:${color}"></i>${name} <strong>${fmt(kcal/n.total.kcal*100,0)}%</strong></span>`).join('')}</div>`;
  $('nutritionMissing').hidden=!n.missing.length;$('nutritionMissing').textContent=n.missing.length?`Dato mancante nella fonte: ${n.missing.map(k=>N.names[k]).join(', ')}. È mostrato n.d., non zero; puoi completarlo dalla confezione.`:'';
  $('nutrientInputs').innerHTML=`<table><thead><tr><th>Ingrediente / fonte</th>${N.keys.map(k=>`<th>${N.names[k]}</th>`).join('')}<th></th></tr></thead><tbody>${n.rows.map(row=>`<tr><td><strong>${esc(row.name)}</strong><small>${esc(row.note)}</small>${row.source?`<a href="${row.source}" target="_blank" rel="noopener">Fonte ↗</a>`:''}</td>${N.keys.map(k=>`<td><label><span class="sr-only">${esc(row.name)} · ${N.names[k]} per 100 g</span><input type="number" data-nutrient="${k}" min="0" max="100" step="any" value="${row.nutrients[k]===null?'':Math.round(row.nutrients[k]*10000)/10000}" placeholder="n.d." required></label></td>`).join('')}<td><button type="button" class="secondary" data-save-nutrients="${row.id}">Applica</button></td></tr>`).join('')}</tbody></table>`;
 }
 return {attach,render};
})();
