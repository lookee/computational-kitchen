window.YogurtComparisons=(()=>{
 const M=window.YogurtLab,N=window.YogurtNutrition,$=id=>document.getElementById(id),fmt=(v,d=1)=>v===null?'n.d.':v.toLocaleString('it-IT',{maximumFractionDigits:d}),esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const palette=['#416b25','#a9501e','#467d90','#997c38','#825c83','#568e75','#be7655','#6e72a3','#829336','#a75f73','#59715c','#9a8064'];
 let selected=new Set(['original']),metric='kcal',basis='per100',crumbMetric='medianDiameter',api;
 function allOptions(){const s=api.state();return [...M.presets.map(p=>({id:p.id,name:p.name,config:M.fromPreset(p.id,{...M.defaults,bakeLoss:s.bakeLoss})})),...api.experiments().map(e=>({id:'saved-'+e.id,name:'Quaderno · '+e.name,config:{...e.config,cookedWeight:e.weight||e.config.cookedWeight}}))];}
 function series(){return [{id:'current',name:'La tua ricetta attuale',config:api.state(),color:palette[0]},...allOptions().filter(p=>selected.has(p.id)).map((p,i)=>({...p,color:palette[(i+1)%palette.length]}))];}
 function attach(callbacks){api=callbacks;$('comparisonOptions').addEventListener('change',e=>{if(!e.target.dataset.recipe)return;if(e.target.checked)selected.add(e.target.dataset.recipe);else selected.delete(e.target.dataset.recipe);api.refresh();});
  $('compareAll').addEventListener('click',()=>{selected=new Set(allOptions().map(p=>p.id));renderControls();api.refresh();});$('compareNone').addEventListener('click',()=>{selected.clear();renderControls();api.refresh();});
  $('crumbMetric').addEventListener('change',e=>{crumbMetric=e.target.value;api.refresh();});
  $('nutritionMetric').addEventListener('change',e=>{metric=e.target.value;api.refresh();});$('nutritionChartBasis').addEventListener('change',e=>{basis=e.target.value;api.refresh();});
 }
 function renderControls(type){
  if(type)$('comparisonPicker').hidden=!['compare','nutrition','crumb','thermal'].includes(type);
  const available=allOptions();$('comparisonOptions').innerHTML=available.map(p=>`<label><input type="checkbox" data-recipe="${esc(p.id)}" ${selected.has(p.id)?'checked':''}><span>${esc(p.name)}</span></label>`).join('');
  $('nutritionChartControls').hidden=type!=='nutrition';$('crumbChartControls').hidden=type!=='crumb';
 }
 function render(type){
  renderControls(type);if(!['compare','nutrition','crumb'].includes(type))return false;
  const data=series();let html='';
  if(type==='crumb'){
   const spec={medianDiameter:['Diametro mediano delle bolle','mm',1],expansion:['Rapporto volume / volume iniziale','×',1],count:['Bolle nel campione','n.',1],setting:['Consolidamento medio','%',100],gasFraction:['Frazione gassosa del campione','%',100]}[crumbMetric];
   const rows=data.map(item=>({...item,snapshots:window.YogurtPhysics.run(item.config).snapshots})),max=Math.max(1,...rows.flatMap(row=>row.snapshots.map(f=>f[crumbMetric]*spec[2])))*1.12,X=t=>58+t/65*650,Y=v=>220-v/max*180;
   html=`<svg viewBox="0 0 740 265" role="img" aria-label="${spec[0]}, evoluzione delle ricette selezionate">`;
   for(let i=0;i<=4;i++){const v=max*i/4;html+=`<line x1="58" x2="708" y1="${Y(v)}" y2="${Y(v)}" stroke="#e0e7d8"/><text x="47" y="${Y(v)+4}" text-anchor="end" class="svg-tick">${fmt(v,1)}</text>`;}
   for(let t=0;t<=60;t+=10)html+=`<text x="${X(t)}" y="244" text-anchor="middle" class="svg-tick">${t}′</text>`;
   rows.slice().reverse().forEach(row=>html+=`<polyline points="${row.snapshots.map(f=>`${X(f.minute)},${Y(f[crumbMetric]*spec[2])}`).join(' ')}" fill="none" stroke="${row.color}" stroke-width="${row.id==='current'?3:1.5}" ${row.id==='current'?'':'stroke-dasharray="5 3"'}><title>${esc(row.name)} · ${spec[0]}</title></polyline>`);html+='</svg>';
   html+=`<div class="comparison-legend">${rows.map(row=>`<span><i style="background:${row.color}"></i>${esc(row.name)}</span>`).join('')}</div><div class="compare-table"><table><thead><tr><th>Ricetta</th><th>${spec[0]} · ${spec[1]}</th><th>All’istante</th></tr></thead><tbody>${rows.map(row=>{const f=row.snapshots[Math.min(130,Math.round(row.config.bake*2))];return `<tr><td>${esc(row.name)}</td><td>${fmt(f[crumbMetric]*spec[2],2)}</td><td>${row.config.bake} min · cottura impostata</td></tr>`;}).join('')}</tbody></table></div>`;
   $('chartCaption').textContent=`${spec[0]} (${spec[1]}), calcolato dalla popolazione 3D del modello. Le curve descrivono campioni simulati, non misure della torta. La tabella legge ogni ricetta al proprio tempo di cottura impostato. La geometria, i parametri di processo e le ipotesi reologiche sono quelli di ciascuna configurazione.`;
  }else if(type==='nutrition'){
   const unit=['kcal','kJ'].includes(metric)?metric:'g',rows=data.map(item=>{const n=N.calculate(item.config);return {...item,n,value:n[basis][metric]};});
   const max=Math.max(1,...rows.map(x=>x.value||0))*1.18,H=rows.length*43+48;
   html=`<svg viewBox="0 0 740 ${H}" role="img" aria-label="Confronto ${N.names[metric]}, ${basis==='per100'?'per 100 g cotti':basis==='portion'?'per porzione':'intera torta'}">`;
   for(let i=0;i<=4;i++){const x=235+i/4*440;html+=`<line x1="${x}" x2="${x}" y1="20" y2="${H-26}" stroke="#e0e7d8"/><text x="${x}" y="${H-7}" text-anchor="middle" class="svg-tick">${fmt(max*i/4,metric==='kcal'||metric==='kJ'?0:1)}</text>`;}
   rows.forEach((row,i)=>{const y=30+i*43,name=row.name.length>31?row.name.slice(0,29)+'…':row.name;html+=`<text x="220" y="${y+13}" text-anchor="end" class="svg-label">${esc(name)}</text><rect x="235" y="${y}" width="${(row.value||0)/max*440}" height="22" rx="3" fill="${row.color}"><title>${esc(row.name)} · ${fmt(row.value,metric==='salt'?2:1)} ${unit}</title></rect><text x="${242+(row.value||0)/max*440}" y="${y+15}" class="svg-tick">${fmt(row.value,metric==='salt'?2:metric==='kcal'||metric==='kJ'?0:1)} ${row.value===null?'':unit}</text>`;});html+='</svg>';
   html+=`<div class="compare-table"><table><thead><tr><th>Ricetta</th><th>${N.names[metric]} · ${unit}</th><th>Base di peso</th></tr></thead><tbody>${rows.map(row=>`<tr><td>${esc(row.name)}</td><td>${fmt(row.value,metric==='salt'?2:1)}</td><td>${basis==='per100'?'100 g cotti':basis==='portion'?`${fmt(row.n.portionWeight,0)} g / porzione`:`${fmt(row.n.cooked,0)} g intera torta`} · ${row.n.measured?'pesata':'stimata'}</td></tr>`).join('')}</tbody></table></div>`;
   $('chartCaption').textContent=`${N.names[metric]}, ${basis==='per100'?'a parità di 100 g di torta cotta':basis==='portion'?'per porzione definita da ciascuna ricetta':'per intera torta, con pezzature che possono differire'}. Le varianti usano Ø 24 cm e la perdita impostata (${fmt(api.state().bakeLoss,0)}%); gli esperimenti salvati mantengono la propria configurazione e il peso misurato se presente. Valori stimati, non una classifica salutistica.`;
  }else{
   const keys=['flour','starch','nuts','eggs','sugar','yogurt','oil','leaven'],names=['Farina','Amido','Frutta secca','Uova','Dolcificante','Yogurt','Olio','Lievito'];
   const values=data.map(item=>({...item,v:keys.map(k=>M.calculate(item.config).ingredients.find(i=>i.key===k)?.pct||0)})),max=Math.ceil(Math.max(100,...values.flatMap(r=>r.v))/25)*25,Y=v=>220-v/max*175,X=i=>58+i*92;
   html='<svg viewBox="0 0 740 265" role="img" aria-label="Profili delle percentuali degli ingredienti per tutte le ricette selezionate">';for(let v=0;v<=max;v+=25)html+=`<line x1="58" x2="705" y1="${Y(v)}" y2="${Y(v)}" stroke="#e0e7d8"/><text x="47" y="${Y(v)+4}" text-anchor="end" class="svg-tick">${v}%</text>`;
   names.forEach((name,i)=>html+=`<text x="${X(i)}" y="244" text-anchor="middle" class="svg-tick">${name}</text>`);
   values.slice().reverse().forEach(row=>{html+=`<polyline points="${row.v.map((v,i)=>`${X(i)},${Y(v)}`).join(' ')}" fill="none" stroke="${row.color}" stroke-width="${row.id==='current'?3:1.6}" opacity="${row.id==='current'?1:.72}" ${row.id==='current'?'':'stroke-dasharray="5 3"'}><title>${esc(row.name)}</title></polyline>`;row.v.forEach((v,i)=>html+=`<circle cx="${X(i)}" cy="${Y(v)}" r="${row.id==='current'?4:2.5}" fill="${row.color}"><title>${esc(row.name)} · ${names[i]} ${fmt(v,1)}%</title></circle>`);});html+='</svg>';
   html+=`<div class="comparison-legend">${values.map(row=>`<span><i style="background:${row.color}"></i>${esc(row.name)}</span>`).join('')}</div><div class="compare-table"><table><thead><tr><th>Ricetta</th>${names.map(n=>`<th>${n}</th>`).join('')}</tr></thead><tbody>${values.map(row=>`<tr><td>${esc(row.name)}</td>${row.v.map(v=>`<td>${fmt(v,1)}%</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
   $('chartCaption').textContent='Profili di formulazione: ogni punto è una percentuale sulla miscela secca. Le linee collegano categorie per aiutare il confronto, non descrivono un processo nel tempo. Ricette diverse possono avere profili sovrapposti. La ricetta attuale è la linea continua più spessa.';
  }
  $('chartArea').innerHTML=html;return true;
 }
 return {attach,render,renderControls,series};
})();
