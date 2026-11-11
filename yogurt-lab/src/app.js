/* Yogurt Computational Lab · © 2026 Luca Amore · GPL-3.0-only */
(() => {
 'use strict';
 const M=window.YogurtLab,$=id=>document.getElementById(id),form=$('config');
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=(v,d=1)=>Number(v).toLocaleString(window.YogurtI18n.locale,{maximumFractionDigits:d});
 const KEY='neotokio.yogurt-lab.v1';
 let state={...M.defaults},probes=[],checks=[false,false,false],experiments=[],done=[],stored=false;
 let simTime=state.bake,simView='section',chart='thermal',simPlaying=false,simFrame=0,kitchenIndex=0,timerRemaining=0,timerDeadline=0,timerRunning=false;
 let currentResult,steps=[],toastTimeout,storageOkay=true,startAt='';
 const validProbes=a=>Array.isArray(a)?a.filter(p=>p&&Number.isFinite(p.minute)&&p.minute>=0&&p.minute<=120&&Number.isFinite(p.temp)&&p.temp>=20&&p.temp<=105).slice(-100).map(p=>({minute:p.minute,temp:p.temp})):[];
 const validChecks=a=>[0,1,2].map(i=>Array.isArray(a)&&a[i]===true);
 function validEntry(x){
   if(!x||typeof x.name!=='string'||typeof x.id!=='string'||!x.config||typeof x.config!=='object')return null;
   return {id:x.id.slice(0,100),name:x.name.slice(0,80),date:typeof x.date==='string'&&!isNaN(Date.parse(x.date))?x.date:new Date().toISOString(),config:M.sanitize({...x.config,wholeEggs:x.config.wholeEggs===undefined?false:x.config.wholeEggs}),notes:typeof x.notes==='string'?x.notes.slice(0,2000):'',height:Number.isFinite(x.height)&&x.height>=.5&&x.height<=20?x.height:null,weight:Number.isFinite(x.weight)&&x.weight>=50&&x.weight<=4000?x.weight:null,probes:validProbes(x.probes),checks:validChecks(x.checks)};
 }
 try{
  const data=JSON.parse(localStorage.getItem(KEY)||'null');
  if(data&&data.version===1){state=M.sanitize({...data.config,wholeEggs:true});probes=validProbes(data.probes);checks=validChecks(data.checks);experiments=(Array.isArray(data.experiments)?data.experiments:[]).map(validEntry).filter(Boolean).slice(0,100);done=Array.isArray(data.done)?data.done.filter(x=>Number.isInteger(x)&&x>=0&&x<100):[];startAt=typeof data.startAt==='string'?data.startAt:'';stored=true;
   if(data.config?.wholeEggs!==true&&Math.abs(M.calculate(state).scale-M.calculate({...state,wholeEggs:false}).scale)>1e-8){done=[];state.cookedWeight=0;}
  }
 }catch{storageOkay=false;}
 function persist(){
  try{localStorage.setItem(KEY,JSON.stringify({version:1,config:state,probes,checks,experiments,done,startAt}));storageOkay=true;}
  catch{storageOkay=false;}
  $('saveStatus').textContent=storageOkay?'Parametri salvati solo in questo browser.':'Salvataggio browser non disponibile. Esporta il quaderno per conservarlo.';
 }
 function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>$('toast').hidden=true,4000);}
 function field(name){return form.elements.namedItem(name);}
 function writeForm(){for(const [key,value] of Object.entries(state)){const el=field(key);if(el){if(el.type==='checkbox')el.checked=value;else el.value=value;}}}
 function readForm(){
  const next={...state};
  for(const el of form.elements){if(!el.name||el.name==='eggCount')continue;if(el.type==='checkbox')next[el.name]=el.checked;else if(el.type==='number'){if(el.value===''||!el.checkValidity())return null;next[el.name]=Number(el.value);}else next[el.name]=el.value;}
  return M.sanitize(next);
 }
 function changedConfig(){
  if(done.length){done=[];toast('Configurazione aggiornata: conferme del protocollo azzerate.');}
  resetTimer();kitchenIndex=0;render();persist();
 }
 $('preset').innerHTML=M.presets.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');
 const flourGroups=['Caputo','Dallagiovanna','Molino Grassi','Spadoni','Barilla','Petra','Profili generici'];
 $('flourSelect').innerHTML=flourGroups.map(group=>`<optgroup label="${group}">${Object.entries(M.flourProfiles).filter(([,p])=>(p.brand||'Profili generici')===group).map(([k,p])=>`<option value="${k}">${esc(p.name)}${p.brand?' · W '+esc(p.w):''}</option>`).join('')}</optgroup>`).join('');
 $('commercialFlours').innerHTML=Object.entries(M.flourProfiles).filter(([,p])=>p.brand).map(([k,p])=>`<article class="commercial-flour ${p.brand==='Caputo'?'caputo-flour':''}"><div class="commercial-flour-head"><span>${esc(p.brand)}</span>${k==='caputo-pasticceria'?'<span class="favorite">PRIMA SCELTA CAPUTO</span>':''}</div><h4>${esc(p.name)}</h4><div class="flour-numbers"><span>W <strong>${esc(p.w)}</strong></span><span>Proteine <strong>${fmt(p.protein,1)}%${p.proteinAssumed?' *':''}</strong></span>${p.pl?`<span>P/L ${esc(p.pl)}</span>`:''}</div><p>${esc(p.note)}</p><div class="commercial-actions"><button type="button" class="secondary" data-flour="${k}" aria-pressed="false">Usa questa farina →</button><a href="${p.source}" target="_blank" rel="noopener">Scheda ufficiale ↗</a></div></article>`).join('');
 writeForm();
 form.addEventListener('submit',e=>e.preventDefault());
 function handleConfigInput(e){
  const el=e.target;if(!el.name||el.name==='preset')return;
  const next=readForm();
  if(!next){$('saveStatus').textContent='Completa i parametri nei limiti indicati: il risultato precedente resta visibile.';return;}
  if(el.name==='eggCount'){if(el.value===''||!el.checkValidity())return;next.eggCount=Number(el.value);}
  if(el.name==='eggCount'||(state.eggCount===0&&['diameter','length','width','hole','shape'].includes(el.name)))next.eggWeight=0;
  if(el.name==='flourId'){next.protein=M.flourProfiles[next.flourId].protein;field('protein').value=next.protein;}
  if(JSON.stringify(next)===JSON.stringify(state))return;
  if(next.bake!==state.bake)simTime=next.bake;
  if(['flour','starch','nuts','sugar','yogurt','eggs','eggCount','eggWeight','oil','milk','extra','diameter','length','width','hole','shape'].some(k=>next[k]!==state[k]))next.cookedWeight=0;
  state=next;changedConfig();
 }
 form.addEventListener('input',handleConfigInput);
 form.addEventListener('change',handleConfigInput);
 $('preset').addEventListener('change',()=>{state=M.fromPreset($('preset').value,state);writeForm();changedConfig();toast('Variante caricata. Stampo e modello Bimby conservati.');});
 $('resetEggCount').addEventListener('click',()=>{state.eggCount=0;state.eggWeight=0;state.cookedWeight=0;writeForm();changedConfig();});
 $('resetPreset').addEventListener('click',()=>{state=M.fromPreset(state.preset,state);writeForm();changedConfig();toast('Dosi della variante ripristinate.');});
 function duration(s){if(s<60)return `${fmt(s,0)} s`;const m=Math.floor(s/60),sec=Math.round(s%60);return sec?`${m} min ${sec} s`:`${m} min`;}
 function longDuration(s){const m=Math.round(s/60);return m>=60?`${Math.floor(m/60)} h ${m%60} min`:`${m} min`;}
 function render(){
  const r=currentResult=M.calculate(state),s=r.s,p=M.presets.find(p=>p.id===s.preset);
  const base=M.fromPreset(s.preset,s),custom=Object.keys(M.defaults).some(k=>!['seed','batchLimit','initial','tau','thermometer','bakeLoss','cookedWeight','nutritionOverrides','eggCount','eggWeight'].includes(k)&&base[k]!==s[k]);
  $('deviceBadge').textContent=s.device;
  $('deviceNote').textContent=s.device==='TM7'?'Modalità manuale. Farfalla max vel. 4; rimuovila prima del prelavaggio. Boccale max 2,2 L.':'Modalità manuale. Farfalla max vel. 4. Boccale max 2,2 L: controlla la tacca, anche con impasto aerato.';
  $('presetDescription').textContent=p.description;$('presetTag').textContent=p.tag+(custom?' · PERSONALIZZATA':'');
  $('flourHint').textContent=M.flourProfiles[s.flourId].note;
  const fp=M.flourProfiles[s.flourId];
  $('flourSpec').innerHTML=fp.source?`<span>W ${esc(fp.w)} · proteine ${fmt(s.protein,1)}% ${s.protein!==fp.protein?'(personalizzate)':fp.proteinAssumed?'(da verificare sull’etichetta)':'(da scheda)'}</span><a href="${fp.source}" target="_blank" rel="noopener">Scheda del produttore ↗</a>`:'';
  document.querySelectorAll('[data-shape]').forEach(el=>el.hidden=!el.dataset.shape.split(' ').includes(s.shape));
  field('eggCount').value=r.eggCount;field('eggWeight').value=s.eggWeight;
  $('eggHint').textContent=`${r.eggCount} uova intere · ${fmt(r.eggMass,1)} g sgusciate ${r.eggEstimated?'stimati (50 g per uovo)':'pesati'}. Usa tutte le uova e inserisci il peso totale: le altre dosi si adattano senza avanzi.`;
  $('scaleHint').textContent=`Area ×${fmt(r.geometryScale,3)} · dosi sulle uova ×${fmt(r.scale,3)} · spessore relativo ×${fmt(r.depthRatio,2)}. Tempi forno da verificare.`;
  $('orbitValue').innerHTML=`${fmt(s.starch,0)}<span>%</span>`;
  $('resultLabel').textContent=`OUTPUT / ${s.preset==='original'?'AI-PIE 0.1':s.preset==='oat'?'AI-PIE 0.2':p.name.split(' · ')[0].toUpperCase()}${custom?' + MODIFICHE':''} · ${s.device}`;
  $('printSummary').textContent=`${p.name}${custom?' · dosi personalizzate':''} / ${s.device} / ${s.shape==='loaf'?`Plumcake ${s.length} × ${s.width} cm`:`${s.shape==='ring'?'Ciambella':'Tondo'} Ø ${s.diameter} cm${s.shape==='ring'?`, foro ${s.hole} cm`:''}`} / ${s.portions} porzioni`;
  const metrics=[['IMPASTO TOTALE',fmt(r.total,0),'g',`${s.portions} porzioni · ${fmt(r.total/s.portions,0)} g crudi / porzione`],['MISCELA SECCA',fmt(r.blend,0),'g',`${fmt(100-s.starch-s.nuts,0)}% farina · ${fmt(s.starch,0)}% amido`],['LAVORAZIONI BIMBY',r.batches,r.batches===1?'lotto':'lotti','Soglia prudenziale, controlla il volume'],['UOVA INTERE',r.eggCount,'uova',`${fmt(r.eggMass,1)} g senza guscio · ${r.eggEstimated?'stima':'peso misurato'}`],['FORNO IMPOSTATO',s.oven,'°C',`${s.ovenMode==='fan'?'Ventilato':'Statico'} · ${s.bake} min indicativi`],['CONTROLLO COTTURA',s.thermometer?'96–99':'Sensoriale',s.thermometer?'°C':'',s.thermometer?'Sonda reale + controlli strutturali':'Stecchino, centro e superficie']];
  $('metrics').innerHTML=metrics.map(([name,value,unit,foot])=>`<div class="metric"><div class="metric-label">${name}</div><div class="metric-value">${value} <small>${unit}</small></div><div class="metric-foot">${esc(foot)}</div></div>`).join('');
  $('warnings').innerHTML=r.warnings.map(w=>`<div class="warning">${esc(w)}</div>`).join('');
  $('scalePill').textContent=`BASE Ø 24 → ×${fmt(r.scale,3)}`;
  $('ingredients').innerHTML=r.ingredients.map(i=>`<div class="ingredient"><span class="name">${esc(i.name)}</span><strong>${i.key==='eggs'?`${r.eggCount} <small>uova</small><span class="egg-weight">${fmt(i.g,1)} g · ${r.eggEstimated?'stima':'peso misurato'}</span>`:`${fmt(i.g,i.g<20?1:0)} <small>g</small>`}</strong><div class="microbar"><i style="width:${Math.min(100,i.pct)}%;background:${i.color}"></i></div><span class="pct">${fmt(i.pct,1)}% sulla miscela</span></div>`).join('');
  $('massNote').textContent=`Bilancio: ${fmt(r.total,1)} g · ${r.eggCount} uova intere, senza avanzi. Vaniglia facoltativa non pesata. Percentuali sulla miscela di farina, amido e frutta secca, prima degli extra.${r.batches>1?' Per i lotti, sbatti insieme tutte le uova e suddividi il peso indicato: si utilizzano tutte. Nell’ultimo lotto usa il residuo, inclusi gli arrotondamenti.':''}`;
  $('batchDetails').hidden=r.batches===1;
  $('batchTable').innerHTML=`<table><thead><tr><th>Ingrediente</th><th>Per ciascuno dei ${r.batches} lotti</th></tr></thead><tbody>${r.ingredients.map(i=>`<tr><td>${esc(i.name)}</td><td>${fmt(i.g/r.batches,1)} g</td></tr>`).join('')}</tbody></table>`;
  $('thermometerCard').hidden=!s.thermometer;
  document.querySelectorAll('[data-flour]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.flour===s.flourId)));
  window.YogurtMath.render(s,r);
  window.YogurtSimulation.renderPan(s,r);
  window.YogurtNutritionUI.render(s);
  steps=M.protocol(s);renderTimeline();renderSimulation();renderChart();renderProbes();
 }
 document.querySelectorAll('[data-flour]').forEach(b=>b.addEventListener('click',()=>{state.flourId=b.dataset.flour;state.protein=M.flourProfiles[state.flourId].protein;writeForm();changedConfig();toast('Profilo farina aggiornato. Le altre dosi sono conservate.');}));
 function seeded(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
 function renderSimulation(){window.YogurtSimulation.render(state,currentResult,simTime,simView);}
 $('simTime').addEventListener('input',e=>{stopSim();simTime=Number(e.target.value);renderSimulation();updateChartCursor();});
 document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{simView=b.dataset.view;document.querySelectorAll('[data-view]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderSimulation();}));
 $('newSeed').addEventListener('click',()=>{state.seed=state.seed%9999+1;renderSimulation();persist();});
 function stopSim(){simPlaying=false;$('playSim').textContent='▶';$('playSim').setAttribute('aria-label','Avvia simulazione');cancelAnimationFrame(simFrame);}
 $('playSim').addEventListener('click',()=>{
  if(simPlaying){stopSim();return;}if(simTime>=65)simTime=0;simPlaying=true;$('playSim').textContent='Ⅱ';$('playSim').setAttribute('aria-label','Pausa simulazione');let last=performance.now();
  const tick=now=>{if(!simPlaying)return;simTime=Math.min(65,simTime+(now-last)/1000*2);last=now;renderSimulation();updateChartCursor();if(simTime>=65)stopSim();else simFrame=requestAnimationFrame(tick);};simFrame=requestAnimationFrame(tick);
 });
 let resizeFrame;window.addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{renderSimulation();if(chart==='compare')renderChart();});});
 const svgStart=(label)=>`<svg viewBox="0 0 740 265" role="img" aria-label="${esc(label)}">`;
 const tickText=(x,y,text,anchor='middle')=>`<text x="${x}" y="${y}" text-anchor="${anchor}" class="svg-tick">${esc(text)}</text>`;
 function renderChart(){
  const r=currentResult,s=state;let html='';
  if(window.YogurtComparisons.render(chart))return;
  if(chart==='thermal'){
   const xMax=Math.max(65,...probes.map(p=>p.minute)),X=t=>58+t/xMax*650,Y=v=>222-(v-15)/95*190;
   html=svgStart('Curva termica didattica con letture reali della sonda, se presenti.');
   const comparisons=window.YogurtComparisons.series().slice(1);
   for(const item of comparisons){const pts=[];for(let t=0;t<=xMax;t+=1)pts.push(`${X(t)},${Y(M.thermal(item.config,t).core)}`);html+=`<polyline points="${pts.join(' ')}" fill="none" stroke="${item.color}" stroke-width="1.4" stroke-dasharray="5 3" opacity=".75"><title translate="no">${esc(item.name)} · ${window.YogurtI18n.t('temperatura del modello')}</title></polyline>`;}

   if(s.thermometer)html+=`<rect x="58" y="${Y(99)}" width="650" height="${Y(96)-Y(99)}" fill="#dce8c9"/>`;
   [20,40,60,80,100].forEach(v=>html+=`<line x1="58" x2="708" y1="${Y(v)}" y2="${Y(v)}" stroke="#dde5d5" stroke-width="1"/>${tickText(46,Y(v)+4,v+'°','end')}`);
   for(let t=0;t<=xMax;t+=xMax>70?20:10)html+=tickText(X(t),245,t+'′');
   const points=[];for(let t=0;t<=xMax;t+=.5)points.push(`${X(t)},${Y(M.thermal(s,t).core)}`);
   html+=`<path d="M${X(0)},222 L${points.join(' L')} L${X(xMax)},222 Z" fill="#e8efdc" opacity=".65"/><polyline points="${points.join(' ')}" fill="none" stroke="#527933" stroke-width="2.5"/>`;
   if(s.thermometer)html+=tickText(702,Y(99)-7,'96–99 °C · controllo','end');
   if(s.thermometer)probes.forEach(p=>html+=`<circle cx="${X(p.minute)}" cy="${Y(p.temp)}" r="4" fill="#426f85" stroke="white" stroke-width="1.5"><title>Sonda: ${fmt(p.temp,1)} °C a ${fmt(p.minute,1)} min</title></circle>`);
   html+=`<line id="chartCursor" x1="${X(simTime)}" x2="${X(simTime)}" y1="25" y2="222" stroke="#ae7341" stroke-dasharray="4 4"/><g id="chartTooltip" class="chart-tooltip"></g><rect id="chartOverlay" x="58" y="22" width="650" height="200" fill="transparent" class="chart-hover"/></svg><div class="chart-legend"><span><i class="legend-line"></i>Temperatura simulata</span><span><i class="legend-line orange"></i>Tempo della sezione</span>${s.thermometer?'<span><i class="legend-line point"></i>Sonda reale</span>':''}</div>`;
   $('chartCaption').textContent='Muovi il puntatore per leggere la curva; fai clic per sincronizzare la sezione. Anche il cursore del simulatore è utilizzabile da tastiera. Le varianti sono tratteggiate; se i parametri termici coincidono le curve si sovrappongono. Modello non calibrato: misura la temperatura reale per valutare la cottura.';
   html+=`<div class="comparison-legend"><span><i style="background:#416b25"></i>La tua ricetta attuale · linea continua</span>${comparisons.map(item=>`<span translate="no"><i style="background:${item.color}"></i>${esc(item.name)}</span>`).join('')}</div>`;
   $('chartArea').innerHTML=html;
   const readEvent=e=>{const box=$('chartOverlay').getBoundingClientRect();return M.clamp((e.clientX-box.left)/box.width*xMax,0,xMax);};
   $('chartOverlay').addEventListener('pointermove',e=>{const t=readEvent(e),cx=M.clamp(X(t),145,610);$('chartTooltip').innerHTML=`<rect x="${cx-84}" y="7" width="168" height="26" rx="5" fill="#fff" stroke="#cbd8bd"/><text x="${cx}" y="24" text-anchor="middle">${fmt(t,1)} min · ${fmt(M.thermal(s,t).core,1)} °C</text>`;});
   $('chartOverlay').addEventListener('pointerleave',()=>$('chartTooltip').innerHTML='');
   $('chartOverlay').addEventListener('click',e=>{stopSim();simTime=Math.min(65,readEvent(e));renderSimulation();updateChartCursor();});
  }else{
   const keys=['flour','starch','nuts','eggs','sugar','yogurt','oil','leaven'];
   const names=['Farina','Amido','Frutta secca','Uova','Dolcificante','Yogurt','Olio','Lievito'];
   const values=keys.map(k=>r.ingredients.find(i=>i.key===k)?.pct||0);
   const base=M.calculate(M.fromPreset('original',M.defaults)),original=keys.map(k=>base.ingredients.find(i=>i.key===k)?.pct||0);
   const max=Math.ceil(Math.max(...values,...(chart==='compare'?original:[]),100)/25)*25;
   const Y=v=>215-v/max*167;html=svgStart(chart==='compare'?'Confronto delle percentuali rispetto alla miscela secca tra ricetta corrente e originale 0.1.':'Percentuali degli ingredienti rispetto alla miscela secca.');
   for(let v=0;v<=max;v+=25)html+=`<line x1="52" x2="720" y1="${Y(v)}" y2="${Y(v)}" stroke="#e0e7d9"/>${tickText(44,Y(v)+4,v+'%','end')}`;
   values.forEach((v,i)=>{const x=76+i*83.5;
    html+=`<rect x="${x}" y="${Y(v)}" width="${chart==='compare'?23:40}" height="${215-Y(v)}" rx="3" fill="#60823e"><title>${names[i]} · attuale: ${fmt(v,1)}%</title></rect>`;
    if(chart==='compare')html+=`<rect x="${x+27}" y="${Y(original[i])}" width="23" height="${215-Y(original[i])}" rx="3" fill="#b98b5e"><title>${names[i]} · 0.1: ${fmt(original[i],1)}%</title></rect>`;
    html+=tickText(x+20,235,names[i]);html+=tickText(x+20,Y(Math.max(v,chart==='compare'?original[i]:0))-7,fmt(v,1)+'%');
   });
   html+='</svg>';if(chart==='compare')html+='<div class="chart-legend"><span><i class="legend-line"></i>La tua formulazione</span><span><i class="legend-line orange"></i>ai-pie 0.1</span></div>';
   html+=`<div class="chart-composition"><span>Acqua contabilizzata <strong>${fmt(r.water,0)} g</strong><small>Ingredienti umidi · stima parziale</small></span><span>Proteine nella miscela <strong>${fmt(r.blendProtein,1)}%</strong><small>Stima compositiva, non indice di glutine</small></span></div><details class="chart-data"><summary>Leggi i valori del grafico</summary><table><thead><tr><th>Ingrediente</th><th>Attuale</th>${chart==='compare'?'<th>Originale 0.1</th>':''}</tr></thead><tbody>${values.map((v,i)=>`<tr><td>${names[i]}</td><td>${fmt(v,1)}%</td>${chart==='compare'?`<td>${fmt(original[i],1)}%</td>`:''}</tr>`).join('')}</tbody></table></details>`;
   $('chartArea').innerHTML=html;$('chartCaption').textContent=chart==='compare'?'Confronto normalizzato per 100 g di miscela secca. Mostra differenze di formulazione, non una classifica di qualità. Passa sulle barre per leggere i valori.':'Percentuali sulla miscela di farina, amido e frutta secca. Farina + amido + frutta secca = 100%. Gli altri ingredienti sono rapportati alla stessa base; il totale non deve sommare 100%.';
  }
 }
 function updateChartCursor(){if(chart!=='thermal'||!$('chartCursor'))return;const xMax=Math.max(65,...probes.map(p=>p.minute)),x=58+simTime/xMax*650;$('chartCursor').setAttribute('x1',x);$('chartCursor').setAttribute('x2',x);}
 document.querySelectorAll('[data-chart]').forEach(b=>b.addEventListener('click',()=>{chart=b.dataset.chart;document.querySelectorAll('[data-chart]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderChart();}));
 function renderProbes(){
  const last=probes.at(-1),count=checks.filter(Boolean).length;let advice='Nessuna lettura. I dati della sonda non sono generati dalla simulazione.';
  if(last){if(last.temp<93)advice=`${fmt(last.temp,1)} °C a ${fmt(last.minute,1)} min: sotto la fascia usuale dei cake. Se il centro non è assestato, prosegui brevemente e misura di nuovo; controlla anche la posizione della sonda.`;
   else if(last.temp<96)advice=`${fmt(last.temp,1)} °C: vicina alla finestra del laboratorio. Controlla un secondo punto e i segni strutturali. Non considerare conclusa la cottura dalla sola lettura.`;
   else if(last.temp<=99)advice=`${fmt(last.temp,1)} °C: dentro la finestra orientativa. Verifica un secondo punto, elasticità e stecchino. Se concordano, valuta di sfornare; non prolungare soltanto per raggiungere 99 °C.`;
   else advice=`${fmt(last.temp,1)} °C: sopra la finestra orientativa. Ricontrolla che la punta sia nella mollica e non contro lo stampo. Se la struttura è pronta, ulteriore cottura può asciugare la torta.`;
  }
  $('probeAdvice').textContent=advice;$('probeAdvice').classList.toggle('warning-tone',!!last&&(last.temp<96||last.temp>99));
  ['checkSpring','checkSkewer','checkEdges'].forEach((id,i)=>$(id).checked=checks[i]);
  $('donenessStatus').textContent=count===3?(last&&last.temp>=96&&last.temp<=99?'Tre controlli strutturali e lettura nella fascia concordano. La decisione finale resta alla tua osservazione.':'Tre controlli strutturali registrati. Confrontali con la sonda e con la formulazione, senza affidarti a un singolo numero.'):`${count}/3 controlli strutturali registrati. La temperatura da sola non descrive la struttura.`;
  $('probeHistory').innerHTML=probes.length?`<div class="probe-history">${probes.map(p=>`<span class="probe-item">${fmt(p.minute,1)}′ → ${fmt(p.temp,1)} °C</span>`).join('')}</div>`:'';
 }
 $('probeForm').addEventListener('submit',e=>{e.preventDefault();const minute=Number($('probeMinute').value),temp=Number($('probeTemp').value);if(!e.target.reportValidity()||!Number.isFinite(temp)||!Number.isFinite(minute))return;probes.push({minute,temp});probes=probes.slice(-100);persist();renderProbes();renderChart();toast('Lettura reale registrata.');});
 ['checkSpring','checkSkewer','checkEdges'].forEach((id,i)=>$(id).addEventListener('change',()=>{checks[i]=$(id).checked;persist();renderProbes();}));
 $('clearProbes').addEventListener('click',()=>{probes=[];checks=[false,false,false];persist();renderProbes();renderChart();toast('Letture e controlli azzerati. I dati negli esperimenti salvati restano conservati.');});
 function defaultStart(){const p=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(Date.now()+15*60000));return p.replace(' ','T');}
 if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(startAt))startAt=defaultStart();$('startAt').value=startAt;
 // Interpret the wall-clock input in Europe/Rome, independently of the computer timezone.
 function romeDate(value){let d=new Date(value+'Z');if(!Number.isFinite(d.getTime()))return new Date();for(let i=0;i<3;i++){const parts=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(d);const represented=new Date(parts.replace(' ','T')+'Z').getTime(),desired=new Date(value+'Z').getTime();const delta=desired-represented;if(!delta)break;d=new Date(d.getTime()+delta);}return d;}
 function timeString(d){return new Intl.DateTimeFormat(window.YogurtI18n.locale,{timeZone:'Europe/Rome',hour:'2-digit',minute:'2-digit'}).format(d);}
 function dayString(d){return new Intl.DateTimeFormat(window.YogurtI18n.locale,{timeZone:'Europe/Rome',day:'2-digit',month:'short'}).format(d);}
 function renderTimeline(){
  let cursor=romeDate(startAt).getTime();const total=steps.reduce((n,s)=>n+s.seconds,0);
  $('protocolSummary').textContent=`${steps.length} passaggi · ${currentResult.batches} ${currentResult.batches===1?'lotto':'lotti'}\nDurata pianificata ${longDuration(total)} · confermati ${done.length}/${steps.length}`;
  $('timeline').innerHTML=steps.map((step,i)=>{const d=new Date(cursor);cursor+=step.seconds*1000;return `<article class="event ${step.kind} ${done.includes(i)?'done':''}" id="step-${i}"><div><time>${timeString(d)}</time><div class="date">${dayString(d)}</div><div class="duration">${duration(step.seconds)}</div></div><div class="rail" aria-hidden="true"></div><div><h3>${esc(step.name)}</h3><span class="machine-setting">${esc(step.setting)}</span><p>${esc(step.text)}</p><label class="step-check"><input type="checkbox" data-step="${i}" ${done.includes(i)?'checked':''}>Operazione eseguita</label></div></article>`;}).join('');
  $('timeline').querySelectorAll('[data-step]').forEach(input=>input.addEventListener('change',()=>{const n=Number(input.dataset.step);done=done.filter(x=>x!==n);if(input.checked)done.push(n);persist();renderTimeline();}));
 }
 $('startAt').addEventListener('change',()=>{if(!$('startAt').value)return;startAt=$('startAt').value;renderTimeline();persist();});
 const dialog=$('kitchenDialog');
 function openKitchen(){kitchenIndex=steps.findIndex((_,i)=>!done.includes(i));if(kitchenIndex<0)kitchenIndex=0;resetTimer();renderKitchen();dialog.showModal();}
 $('openKitchen').addEventListener('click',openKitchen);$('openKitchen2').addEventListener('click',openKitchen);
 $('closeKitchen').addEventListener('click',()=>dialog.close());
 function resetTimer(){timerRunning=false;timerDeadline=0;timerRemaining=0;}
 function renderKitchen(){const step=steps[kitchenIndex];if(!step)return;timerRemaining=step.seconds;timerRunning=false;timerDeadline=0;
  $('kitchenProgress').style.width=`${kitchenIndex/steps.length*100}%`;$('kitchenStepLabel').textContent=`PASSAGGIO ${kitchenIndex+1} / ${steps.length} · ${state.device}`;
  $('kitchenTitle').textContent=step.name;$('kitchenSetting').textContent=step.setting;$('kitchenText').textContent=step.text;
  $('previousStep').disabled=kitchenIndex===0;$('nextStep').textContent=kitchenIndex===steps.length-1?'Conferma e termina ✓':'Conferma e continua →';
  $('kitchenThermometer').hidden=!(step.kind==='bake'&&state.thermometer);updateTimerDisplay();
 }
 function updateTimerDisplay(){const sec=Math.max(0,Math.ceil(timerRunning?(timerDeadline-Date.now())/1000:timerRemaining));$('kitchenTimer').textContent=`${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;$('timerToggle').textContent=timerRunning?'Pausa Ⅱ':sec===0?'Riparti ▶':'Avvia timer ▶';$('timerState').textContent=timerRunning?'Timer in corso. Nessun collegamento al Bimby.':sec===0?'Tempo terminato: verifica il risultato e conferma manualmente.':'Timer manuale. Nessun collegamento al Bimby.';}
 $('timerToggle').addEventListener('click',()=>{if(timerRunning){timerRemaining=Math.max(0,(timerDeadline-Date.now())/1000);timerRunning=false;}else{if(timerRemaining<=0)timerRemaining=steps[kitchenIndex].seconds;timerDeadline=Date.now()+timerRemaining*1000;timerRunning=true;}updateTimerDisplay();});
 $('timerReset').addEventListener('click',()=>{resetTimer();timerRemaining=steps[kitchenIndex].seconds;updateTimerDisplay();});
 setInterval(()=>{if(timerRunning&&Date.now()>=timerDeadline){timerRunning=false;timerRemaining=0;toast('Timer terminato. Controlla e conferma il passaggio.');}if(dialog.open)updateTimerDisplay();},250);
 $('previousStep').addEventListener('click',()=>{if(kitchenIndex>0){kitchenIndex--;renderKitchen();}});
 $('nextStep').addEventListener('click',()=>{if(!done.includes(kitchenIndex))done.push(kitchenIndex);persist();renderTimeline();if(kitchenIndex<steps.length-1){kitchenIndex++;renderKitchen();}else{resetTimer();dialog.close();$('notebook').scrollIntoView({behavior:'auto'});toast('Protocollo completato. Registra il risultato nel quaderno.');}});
 $('goProbe').addEventListener('click',()=>dialog.close());
 function recipeText(){const r=currentResult,p=M.presets.find(p=>p.id===state.preset),n=window.YogurtNutrition.calculate(state);return `NEOTOKIO / YOGURT COMPUTATIONAL LAB\n${p.name} · ${state.device}\nStampo ${state.shape==='loaf'?`${state.length} × ${state.width} cm`:state.shape==='ring'?`ciambella Ø ${state.diameter} cm, foro ${state.hole} cm`:`tondo Ø ${state.diameter} cm`} · ${state.portions} porzioni\n\nINGREDIENTI\n${r.ingredients.map(i=>i.key==='eggs'?`${r.eggCount} uova intere · ${fmt(i.g,1)} g sgusciate (${r.eggEstimated?'stima':'peso misurato'})`:`${fmt(i.g,1)} g ${i.name}`).join('\n')}\nTotale ${fmt(r.total,1)} g · ${r.batches} lotti\n\nPROTOCOLLO\n${steps.map((s,i)=>`${i+1}. ${s.name}\n${s.setting}\n${s.text}`).join('\n\n')}\n\nNUTRIZIONE STIMATA\nPer 100 g cotti: ${fmt(n.per100.kJ,0)} kJ / ${fmt(n.per100.kcal,0)} kcal; grassi ${fmt(n.per100.fat,1)} g; saturi ${fmt(n.per100.sat,1)} g; carboidrati ${fmt(n.per100.carbs,1)} g; zuccheri ${n.per100.sugars===null?'n.d.':fmt(n.per100.sugars,1)+' g'}; fibre ${fmt(n.per100.fiber,1)} g; proteine ${fmt(n.per100.protein,1)} g; sale ${fmt(n.per100.salt,2)} g.\nPeso cotto ${n.measured?'misurato':'stimato'}: ${fmt(n.cooked,0)} g. Per porzione: ${fmt(n.portion.kcal,0)} kcal. Profili generici e/o etichette, fattori UE; non analisi certificata.\n\n${state.thermometer?'Termometro attivo: 96–99 °C al cuore come finestra orientativa, insieme a controlli di struttura. Non è una soglia validata.\n':''}Nuove formulazioni sperimentali; tempi da verificare nel tuo forno.\nRicetta di partenza: https://www.lucaamore.com/generative-ai-cooking-experiments-for-making-a-yogurt-cake-with-a-thermomix-bimby/\n`};
 function download(name,body,type='application/json'){const url=URL.createObjectURL(new Blob([body],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);}
 $('copyRecipe').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(window.YogurtI18n.t(recipeText()));toast('Ricetta e protocollo copiati.');}catch{download('yogurt-lab-ricetta.txt',window.YogurtI18n.t(recipeText()),'text/plain;charset=utf-8');toast('Ricetta scaricata come testo.');}});
 $('printRecipe').addEventListener('click',()=>window.print());
 $('experimentForm').addEventListener('submit',e=>{e.preventDefault();if(!e.target.reportValidity())return;if(experiments.length>=100){toast('Quaderno pieno: esporta e rimuovi qualche prova prima di aggiungerne altre.');return;}
  const name=$('experimentName').value.trim();if(!name)return;
  const entry=validEntry({id:typeof crypto.randomUUID==='function'?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`,name,date:new Date().toISOString(),config:{...state,cookedWeight:$('experimentWeight').value?Number($('experimentWeight').value):state.cookedWeight},notes:$('experimentNotes').value,height:$('experimentHeight').value?Number($('experimentHeight').value):null,weight:$('experimentWeight').value?Number($('experimentWeight').value):null,probes:[...probes],checks:[...checks]});
  experiments.unshift(entry);persist();renderExperiments();renderChart();toast(storageOkay?'Esperimento salvato nel browser.':'Salvataggio non disponibile: esporta subito il quaderno.');
 });
 function renderExperiments(){
  if(!experiments.length){$('experiments').innerHTML='<div class="empty-state">Il tuo primo esperimento comincia qui.<br>Registra una prova di riferimento, poi cambia una sola variabile.</div>';return;}
  $('experiments').innerHTML=experiments.map((e,index)=>{const r=M.calculate(e.config),p=M.presets.find(p=>p.id===e.config.preset),date=new Intl.DateTimeFormat(window.YogurtI18n.locale,{timeZone:'Europe/Rome',dateStyle:'medium',timeStyle:'short'}).format(new Date(e.date));return `<article class="experiment"><div class="experiment-top"><div><h3 translate="no">${esc(e.name)}</h3><div class="experiment-date">${date} · ${esc(p.name)} · ${e.config.device}</div></div><button type="button" class="experiment-delete" translate="no" data-delete="${index}" aria-label="${esc(window.YogurtI18n.t('Elimina')+' '+e.name)}">${window.YogurtI18n.t('Elimina')} ×</button></div><div class="experiment-meta"><span>${fmt(r.total,0)} g crudi</span><span>amido ${fmt(e.config.starch,0)}%</span>${e.height?`<span>altezza ${fmt(e.height,1)} cm</span>`:''}${e.weight?`<span>peso cotto ${fmt(e.weight,0)} g</span>`:''}${e.probes.length?`<span>ultima sonda ${fmt(e.probes.at(-1).temp,1)} °C</span>`:''}${e.weight&&e.weight<r.total?`<span>perdita massa ${fmt((1-e.weight/r.total)*100,1)}%</span>`:''}</div>${e.notes?`<p translate="no">${esc(e.notes)}</p>`:''}<div class="actions"><button type="button" class="secondary" data-load="${index}">Riprendi configurazione →</button><button type="button" class="secondary" data-entry-export="${index}">↓ JSON</button></div></article>`;}).join('');
  $('experiments').querySelectorAll('[data-load]').forEach(b=>b.addEventListener('click',()=>{const e=experiments[Number(b.dataset.load)];state=M.sanitize({...e.config,wholeEggs:true});if(!e.config.wholeEggs)state.cookedWeight=0;writeForm();done=[];resetTimer();changedConfig();$('workspace').scrollIntoView({behavior:'auto'});toast('Configurazione ripresa. Le letture della cottura attuale sono conservate.');}));
  $('experiments').querySelectorAll('[data-entry-export]').forEach(b=>b.addEventListener('click',()=>{download('yogurt-lab-esperimento.json',JSON.stringify({schema:'neotokio-yogurt-lab',version:1,experiments:[experiments[Number(b.dataset.entryExport)]]},null,2));}));
  $('experiments').querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click',()=>{const removed=experiments.splice(Number(b.dataset.delete),1)[0];persist();renderExperiments();$('toast').innerHTML='Esperimento rimosso. <button type="button" id="undoDelete" class="text-button" style="display:inline;margin:0 0 0 12px">Annulla</button>';$('toast').hidden=false;clearTimeout(toastTimeout);$('undoDelete').addEventListener('click',()=>{experiments.unshift(removed);persist();renderExperiments();toast('Esperimento ripristinato.');});toastTimeout=setTimeout(()=>$('toast').hidden=true,10000);}));
 }
 $('exportNotebook').addEventListener('click',()=>{download(`yogurt-lab-quaderno-${new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Rome'}).format(new Date())}.json`,JSON.stringify({schema:'neotokio-yogurt-lab',version:1,exportedAt:new Date().toISOString(),current:{config:state,probes,checks},experiments},null,2));toast('Backup del quaderno esportato.');});
 $('importNotebook').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>2_000_000)throw new Error('File troppo grande: massimo 2 MB.');const data=JSON.parse(await file.text());if(data.schema!=='neotokio-yogurt-lab'||data.version!==1||!Array.isArray(data.experiments))throw new Error('Formato non riconosciuto. Usa un JSON esportato dal laboratorio.');const incoming=data.experiments.map(validEntry).filter(Boolean);if(incoming.length!==data.experiments.length)throw new Error('Il file contiene esperimenti non validi. Nessun dato importato.');const existing=new Set(experiments.map(e=>e.id));const added=incoming.filter(e=>{if(existing.has(e.id))return false;existing.add(e.id);return true;});if(added.length+experiments.length>100)throw new Error('Il quaderno può contenere al massimo 100 esperimenti.');experiments=[...added,...experiments];const restore=$('restoreCurrentImport').checked&&data.current&&data.current.config;if(restore){state=M.sanitize({...data.current.config,wholeEggs:true});probes=validProbes(data.current.probes);checks=validChecks(data.current.checks);done=[];resetTimer();writeForm();render();}persist();renderExperiments();renderChart();toast(`${added.length} esperimenti importati; configurazione e letture ${restore?'ripristinate dal backup':'correnti conservate'}.`);}catch(err){toast(err.message||'Impossibile leggere il file.');}finally{e.target.value='';}});
 const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){document.querySelectorAll('.section-nav a').forEach(a=>a.classList.toggle('active',a.hash==='#'+entry.target.id));}},{rootMargin:'-10% 0px -70% 0px'});
 ['workspace','flours','protocol','notebook','method'].forEach(id=>observer.observe($(id)));
 window.addEventListener('beforeprint',()=>{stopSim();window.YogurtI18n.apply();});
 const mobileQuery=window.matchMedia('(max-width:850px)');
 function configExpanded(expanded){$('configSidebar').classList.toggle('mobile-collapsed',!expanded);$('toggleConfig').setAttribute('aria-expanded',String(expanded));$('toggleConfig').textContent=expanded?'Nascondi −':'Parametri +';}
 configExpanded(!mobileQuery.matches);
 $('toggleConfig').addEventListener('click',()=>configExpanded($('toggleConfig').getAttribute('aria-expanded')!=='true'));
 mobileQuery.addEventListener('change',e=>configExpanded(!e.matches));
 window.YogurtNutritionUI.attach({state:()=>state,toast,patch:patch=>{state=M.sanitize({...state,...patch});writeForm();render();persist();}});
 window.YogurtComparisons.attach({state:()=>state,experiments:()=>experiments,refresh:renderChart});
 document.addEventListener('yogurt:languagechange',()=>{
  const edits=[...$('nutrientInputs').querySelectorAll('[data-nutrient]')].map(el=>({
   id:el.closest('tr').querySelector('[data-save-nutrients]').dataset.saveNutrients,
   key:el.dataset.nutrient,value:el.value
  }));
  render();
  for(const edit of edits){
   const row=[...$('nutrientInputs').querySelectorAll('[data-save-nutrients]')].find(el=>el.dataset.saveNutrients===edit.id)?.closest('tr');
   const input=row?.querySelector('[data-nutrient="'+edit.key+'"]');
   if(input)input.value=edit.value;
  }
  renderExperiments();
  if(dialog.open){
   const remaining=timerRemaining,running=timerRunning,deadline=timerDeadline;
   renderKitchen();timerRemaining=remaining;timerRunning=running;timerDeadline=deadline;updateTimerDisplay();
  }
  configExpanded($('toggleConfig').getAttribute('aria-expanded')==='true');
 });
 render();renderExperiments();persist();
 window.YogurtI18n.apply();
 if(stored) $('saveStatus').textContent=storageOkay?'Ultima configurazione ripristinata da questo browser.':'Salvataggio non disponibile: esporta il quaderno.';
})();
