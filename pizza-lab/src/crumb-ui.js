/* Pizza Lab alveolation viewer. GPL-3.0-only */
(function(root){
  'use strict';
  const P=root.PizzaCrumb,$=id=>document.getElementById(id),STORE='pizza-lab-crumb-v1';
  let settings={...P.defaults},state=null,playing=false,raf=0,lastTick=0,view='section',plane=.5;
  try{settings=P.sanitize(JSON.parse(localStorage.getItem(STORE)||'null')||{});}catch{}
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const tr=(it,en)=>state?.lang==='en'?en:it;
  const number=(v,d=1)=>Number(v).toLocaleString(state?.lang==='en'?'en-GB':'it-IT',{maximumFractionDigits:d});
  function stop(){playing=false;cancelAnimationFrame(raf);if($('pcPlay')){$('pcPlay').textContent=tr('▶ Riproduci','▶ Play');$('pcPlay').setAttribute('aria-pressed','false');}}
  function render(r,plan,lang='it'){
    stop();const host=$('pizzaCrumbBody');if(!host)return;
    if(state&&state.r.p.oven!==r.p.oven){settings.ovenTemp=r.p.oven==='ferrari'?400:250;settings.heatTau=r.p.oven==='ferrari'?1.8:2.8;}
    // On the first load, match the oven unless the user has already stored settings.
    if(!state){try{if(!localStorage.getItem(STORE)&&r.p.oven==='domestico'){settings.ovenTemp=250;settings.heatTau=2.8;}}catch{}}
    const previous=state,run=P.run(r,plan,settings,root.PizzaFermentation,root.PizzaFermentation.modelOptions());
    state={r,plan,lang,run,index:previous?.run===run?previous.index:run.snapshots.length-1};
    $('pizzaCrumbTitle').innerHTML=`<span>LAB</span>${tr('Dentro il cornicione','Inside the crust')}`;
    const t=tr;
    if(!run.supported){host.innerHTML=`<p class="pc-empty">${t('Il modello delle bolle richiede un impasto con farina di grano tenero raffinata. La farina selezionata richiede un modello dedicato: qui non viene simulata un’alveolatura.','The gas-cell model requires refined soft-wheat dough. The selected flour needs a dedicated model; no crumb simulation is generated here.')}</p>`;return;}
    const a=run.parameters,p=r.p;
    host.innerHTML=`<div class="pc-intro"><div><div class="pc-kicker">${t('MICROSTRUTTURA / DAL GAS ALLA MOLLICA','MICROSTRUCTURE / FROM GAS TO CRUMB')}</div><h3>${t('Piccole bolle.<br>Grandi differenze.','Tiny bubbles.<br>Big differences.')}</h3><p>${t('Entra in un campione virtuale del bordo: segui la crescita delle bolle, le fusioni, la perdita di gas in stesura e il consolidamento al forno. Cambia la ricetta per esplorare la struttura risultante nel modello.','Explore a virtual rim sample: follow bubble growth, mergers, shaping gas loss and oven setting. Change the recipe to explore the resulting modelled structure.')}</p></div><span class="pc-badge">${t('MODELLO ESPLORATIVO','EXPLORATORY MODEL')}</span></div>
    <div class="pc-recipe"><span>${esc(p.farina)}</span><span>W ${number(a.w,0)}${a.unknownW?' · '+t('ipotizzato','assumed'):''}</span><span>${number(p.H)}% H₂O</span><span>${t('Lievito','Yeast')} ${number(100*r.Y/r.F,3)}%</span><span>${esc(p.method)} · ${number(p.hours)} h${p.cold?' · '+number(p.cold)+' h '+t('frigo','cold'):''}</span><span>${number(p.peso)} g · Ø ${number(settings.diameter)} cm</span></div>
    <div class="pc-toolbar"><div class="pc-toggle" role="group" aria-label="${t('Vista del campione','Sample view')}"><button type="button" data-pc-view="section">${t('Sezione del cornicione','Crust cross-section')}</button><button type="button" data-pc-view="volume">${t('Popolazione 3D','3D population')}</button></div><span class="pc-kicker">${t('STESSO SEED, CONFRONTO RIPETIBILE','SAME SEED, REPEATABLE COMPARISON')}</span></div>
    <div class="pc-scene"><canvas id="pcCanvas" role="img" aria-label="${t('Alveolatura simulata del cornicione. Dati numerici disponibili sotto la figura.','Simulated crust gas cells. Numerical readings are available below the image.')}"></canvas><div class="pc-scene-meta"><span id="pcPhase"></span><span id="pcSeed"></span></div></div>
    <label class="pc-plane" id="pcPlaneLabel">${t('Piano di taglio nel campione','Sample cutting plane')}<input id="pcPlane" type="range" min="5" max="95" step="1" value="${plane*100}"><output id="pcPlaneValue"></output></label>
    <div class="pc-controls"><div class="pc-controls-top"><button id="pcPlay" type="button" class="secondary" aria-pressed="false">${t('▶ Riproduci','▶ Play')}</button><strong id="pcTime" aria-live="off"></strong></div><input id="pcTimeSlider" type="range" min="0" max="${run.snapshots.length-1}" step="1" value="${state.index}" aria-label="${t('Istante della simulazione','Simulation instant')}"><div class="pc-stages" role="group" aria-label="${t('Fasi simulate','Simulated stages')}">${[[0,t('01 · Impasto','01 · Mixing')],[run.fermentationEnd,t('02 · Fine lievitazione','02 · End of proofing')],[run.shapingIndex,t('03 · Dopo stesura','03 · After shaping')],[run.snapshots.length-1,t('04 · Fine cottura','04 · End of baking')]].map(([i,label])=>`<button type="button" data-pc-frame="${i}">${label}</button>`).join('')}</div></div>
    <div class="pc-readings" id="pcReadings" aria-live="off"></div><div class="pc-diagnostics" id="pcDiagnostics"></div>
    <p class="pc-note">${t('Campione locale del bordo, non pizza intera. Sezione e vista 3D mostrano le stesse bolle; il taglio visualizza solo le intersezioni reali con il piano scelto. La riproduzione comprime la lievitazione e rallenta la cottura per renderle esplorabili.','Local rim sample, not a whole pizza. Section and 3D view show the same bubbles; the section shows actual intersections with the selected plane. Playback compresses proofing and slows baking to make both explorable.')}</p>
    <details class="pc-details" id="pcSettings"><summary>${t('Parametri di struttura, stesura e cottura','Structure, shaping and baking settings')}</summary><p>${t('Idratazione, farina, dose, sale, olio, prefermento, tempi, frigo e autolisi arrivano dalla ricetta. Qui puoi cambiare le ipotesi aggiuntive: non sono misure ricavate dal marchio della farina o dal modello Bimby. Cambiando forno si ripristinano temperatura e inerzia indicative.','Hydration, flour, yeast, salt, oil, preferment, timings, refrigeration and autolyse come from the recipe. Edit additional assumptions below; these are not measurements derived from the flour brand or Thermomix model. Changing oven resets indicative temperature and thermal lag.')}</p><div class="pc-grid">${fields().map(([key,it,en,unit,step,hintIt,hintEn])=>`<label>${t(it,en)}${unit?' · '+unit:''}<input type="number" data-pc-setting="${key}" min="${P.ranges[key][0]}" max="${P.ranges[key][1]}" step="${step}" value="${settings[key]}"><small>${t(hintIt,hintEn)}</small></label>`).join('')}</div><div class="pc-setting-actions"><button type="button" id="pcApply">${t('Simula queste condizioni','Simulate these conditions')}</button><button type="button" id="pcReset" class="secondary">${t('Ripristina ipotesi','Reset assumptions')}</button><span id="pcFeedback" role="status"></span></div></details>
    <details class="pc-details" id="pcScience"><summary>${t('Come funziona · formule, fonti e limiti','How it works · equations, sources and limits')}</summary>${documentation()}</details>`;
    host.querySelectorAll('[data-pc-view]').forEach(b=>b.addEventListener('click',()=>{view=b.dataset.pcView;draw();}));
    host.querySelectorAll('[data-pc-frame]').forEach(b=>b.addEventListener('click',()=>{stop();state.index=Number(b.dataset.pcFrame);draw();}));
    $('pcPlane').addEventListener('input',e=>{plane=Number(e.target.value)/100;draw();});
    $('pcTimeSlider').addEventListener('input',e=>{stop();state.index=Number(e.target.value);draw();});
    $('pcPlay').addEventListener('click',()=>{if(playing){stop();return;}if(state.index>=run.snapshots.length-1)state.index=0;playing=true;lastTick=0;$('pcPlay').textContent=t('Ⅱ Pausa','Ⅱ Pause');$('pcPlay').setAttribute('aria-pressed','true');raf=requestAnimationFrame(tick);});
    $('pcApply').addEventListener('click',()=>{
      let invalid=false;const next={};
      host.querySelectorAll('[data-pc-setting]').forEach(el=>{const valid=el.value.trim()!==''&&el.checkValidity();el.parentElement.classList.toggle('pc-invalid',!valid);if(!valid)invalid=true;next[el.dataset.pcSetting]=Number(el.value);});
      if(invalid){$('pcFeedback').textContent=t('Correggi i valori evidenziati prima di simulare.','Correct the highlighted values before simulating.');host.querySelector('.pc-invalid input')?.focus();return;}
      settings=P.sanitize(next);persist();render(r,plan,lang);$('pcSettings').open=true;$('pcFeedback').textContent=t('Simulazione aggiornata.','Simulation updated.');
    });
    $('pcReset').addEventListener('click',()=>{settings={...P.defaults,ovenTemp:p.oven==='ferrari'?400:250,heatTau:p.oven==='ferrari'?1.8:2.8};persist();render(r,plan,lang);$('pcSettings').open=true;});
    draw();
  }
  function persist(){try{localStorage.setItem(STORE,JSON.stringify(settings));}catch{}}
  function fields(){return [
    ['diameter','Diametro pizza','Pizza diameter','cm',1,'Con il peso paniello determina lo spessore del campione.','Sets sample thickness together with dough-ball weight.'],
    ['development','Sviluppo della maglia','Gluten development','%',1,'Ipotesi sulla lavorazione; autolisi attiva aggiunge 0,06 al fattore.','Mixing assumption; active autolyse adds 0.06 to the factor.'],
    ['shapingLoss','Gas perso in stesura','Shaping gas loss','%',1,'Perdita locale nel bordo; non cambia le dosi.','Local rim loss; ingredient quantities are unchanged.'],
    ['retention','Ritenzione potenziale CO₂','Potential CO₂ retention','%',1,'Prima delle perdite per cedimento e stesura.','Before weakening and shaping losses.'],
    ['gasYield','Potenziale CO₂','CO₂ potential','ml/g',.1,'Gas a 20 °C e 1 atm per grammo di farina; ipotesi.','Gas at 20°C and 1 atm per gram of flour; assumed.'],
    ['initialAir','Aria iniziale','Initial air','%',.5,'Frazione del volume iniziale, incorporata in impasto.','Fraction of initial volume, entrained during mixing.'],
    ['nuclei','Bolle iniziali nel campione','Initial sample bubbles','',1,'Distribuzione 3D riproducibile con il seed.','Repeatable 3D distribution controlled by seed.'],
    ['drainage','Tempo di drenaggio film','Film drainage time','min',1,'Scala delle fusioni: più basso, fusioni più rapide.','Merger timescale: lower means faster mergers.'],
    ['surfaceTension','Tensione superficiale','Surface tension','N/m',.005,'Termine di Laplace; ipotesi equivalente.','Laplace term; equivalent assumed value.'],
    ['ovenTemp','Temperatura forno','Oven temperature','°C',5,'Valore ipotizzato: sostituiscilo con una lettura reale.','Assumed value: replace with an actual oven reading.'],
    ['heatTau','Inerzia termica del bordo','Rim thermal lag','min',.1,'Modello concentrato; non descrive platea e resistenze.','Lumped model; does not resolve deck and heating elements.'],
    ['setTemp','Consolidamento matrice','Matrix setting temperature','°C',1,'Inizio convenzionale della transizione della struttura.','Conventional onset of the structure transition.'],
    ['setMinutes','Tempo di consolidamento','Setting timescale','min',.05,'Più breve: le bolle si bloccano prima.','Shorter: gas cells become fixed sooner.'],
    ['steam','Pressione vapore massima','Maximum steam pressure','× atm',.05,'Termine semplificato di espansione, non bilancio acqua.','Simplified expansion term, not a water balance.'],
    ['seed','Seed del campione','Sample seed','',1,'Stesso seed per confrontare variazioni della ricetta.','Use the same seed when comparing recipe changes.']
  ];}
  function tick(time){
    if(!playing||!state)return;
    if(!lastTick)lastTick=time;
    if(time-lastTick>75){state.index++;lastTick=time;draw();if(state.index>=state.run.snapshots.length-1){stop();return;}}
    raf=requestAnimationFrame(tick);
  }
  function draw(){
    if(!state?.run.supported)return;
    const f=state.run.snapshots[state.index],t=tr,n=number,canvas=$('pcCanvas');if(!canvas)return;
    const rect=canvas.getBoundingClientRect();if(!rect.width)return;
    canvas.width=Math.round(rect.width*Math.min(2,devicePixelRatio||1));canvas.height=Math.round(rect.height*Math.min(2,devicePixelRatio||1));
    const c=canvas.getContext('2d');c.scale(canvas.width/900,canvas.height/350);
    c.fillStyle='#f5f7ee';c.fillRect(0,0,900,350);c.lineWidth=.5;c.strokeStyle='#dbe4ce';
    for(let x=30;x<900;x+=40){c.beginPath();c.moveTo(x,0);c.lineTo(x,350);c.stroke();}
    for(let y=25;y<350;y+=40){c.beginPath();c.moveTo(0,y);c.lineTo(900,y);c.stroke();}
    if(view==='section')section(c,f);else volume(c,f);
    const stage=f.kind==='baking'?(f.setting>.8?t('Matrice consolidata','Matrix set'):t('Espansione e consolidamento','Expansion and setting')):f.kind==='shaping'?t('Stesura · gas residuo nel bordo','Shaping · remaining rim gas'):t('Lievitazione · crescita e fusioni','Proofing · growth and mergers');
    $('pcPhase').textContent=stage;$('pcSeed').textContent=`SEED ${settings.seed} · ${n(f.width*1000,0)} × ${n(f.height*f.expansion*1000)} × ${n(f.depth*1000,0)} mm`;
    $('pcTime').textContent=f.kind==='baking'?`${t('Forno','Baking')} +${n(f.minute,2)} min · ${n(f.temperature)} °C`:`${t('Dopo impasto','Since mixing')} +${n(f.hour,2)} h · ${n(f.temperature)} °C`;
    $('pcTimeSlider').value=state.index;$('pcTimeSlider').setAttribute('aria-valuetext',$('pcTime').textContent+' · '+stage);
    $('pcPlaneLabel').hidden=view!=='section';$('pcPlaneValue').textContent=`z = ${n(plane*f.depth*1000)} mm`;
    document.querySelectorAll('[data-pc-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.pcView===view)));
    document.querySelectorAll('[data-pc-frame]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.pcFrame)===state.index)));
    const retained=f.generatedCO2>0?100*f.retainedCO2/f.generatedCO2:0;
    $('pcReadings').innerHTML=[
      [t('POROSITÀ DEL CAMPIONE','SAMPLE POROSITY'),n(f.porosity*100)+'%',t('Volume gas / volume totale simulato','Gas volume / total simulated volume')],
      [t('DIAMETRO MEDIANO 3D','MEDIAN 3D DIAMETER'),n(f.medianDiameter,2)+' mm',t('Tutte le bolle, anche fuori dal taglio','All cells, including those outside the slice')],
      [t('BOLLE NEL CAMPIONE','SAMPLE GAS CELLS'),f.count+' / '+settings.nuclei,n(f.merged,0)+' '+t('fusioni cumulative','cumulative mergers')],
      [t('CO₂ NELLE BOLLE','CO₂ IN GAS CELLS'),n(retained)+'%',t('Quota del gas generato; esclude il serbatoio','Share of generated gas; excludes reservoir')]
    ].map(([a,b,d])=>`<div><span>${a}</span><strong>${b}</strong><small>${d}</small></div>`).join('');
    $('pcDiagnostics').textContent=`${t('Espansione','Expansion')} ×${n(f.expansion,2)} · ${t('Consolidamento','Setting')} ${n(f.setting*100,0)}% · ${t('Bilancio CO₂ |errore|','CO₂ balance |error|')} ${Math.abs(f.balanceError).toExponential(1)} mol`;
  }
  function pore(c,x,y,rx,ry,alpha=1){
    c.save();c.globalAlpha=alpha;c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,Math.PI*2);
    const g=c.createRadialGradient(x-rx*.25,y-ry*.25,0,x,y,Math.max(rx,ry,.1));g.addColorStop(0,'#927243');g.addColorStop(.7,'#c9a673');g.addColorStop(1,'#e6cb97');c.fillStyle=g;c.fill();c.strokeStyle='#fff1ce';c.lineWidth=1.5;c.stroke();c.restore();
  }
  function section(c,f){
    const scale=Math.min(750/f.width,205/(f.height*f.expansion)),w=f.width*scale,h=f.height*f.expansion*scale,x=(900-w)/2,y=265-h;
    const path=new Path2D();path.roundRect(x,y,w,h,Math.min(28,h*.3));
    c.save();c.shadowColor='#67522422';c.shadowBlur=15;c.shadowOffsetY=10;c.fillStyle='#e4c58b';c.fill(path);c.restore();
    c.save();c.clip(path);const g=c.createLinearGradient(0,y,0,y+h);g.addColorStop(0,'#e9c98b');g.addColorStop(.45,'#fae9bd');g.addColorStop(1,'#ecd3a0');c.fillStyle=g;c.fillRect(x,y,w,h);
    let visible=0;
    for(const b of f.pores){const dist=Math.abs(b.z-plane*f.depth);if(dist>=b.r)continue;visible++;const radius=Math.sqrt(b.r*b.r-dist*dist)*scale;pore(c,x+b.x*scale,265-b.y*f.expansion*scale,radius,radius);}
    c.restore();c.strokeStyle=f.kind==='baking'?'#b88643':'#cfb17b';c.lineWidth=f.kind==='baking'?5:2;c.stroke(path);
    c.font='11px ui-monospace,monospace';c.fillStyle='#526b40';c.fillText(tr('SEZIONE FISICA DEL CAMPIONE','PHYSICAL SAMPLE CROSS-SECTION'),30,28);
    c.fillText(`${visible} ${tr('INTERSEZIONI','INTERSECTIONS')} · z = ${number(plane*f.depth*1000)} mm`,30,325);
    const bar=10e-3*scale;c.strokeStyle='#3f5b2d';c.lineWidth=2;c.beginPath();c.moveTo(900-40-bar,303);c.lineTo(860,303);c.stroke();c.fillText('10 mm',900-40-bar,322);
  }
  function volume(c,f){
    const scale=Math.min(650/f.width,180/(f.height*f.expansion));
    const project=(x,y,z)=>({x:120+x*scale+z*scale*.65,y:270-y*scale-z*scale*.5});
    const edges=[[[0,0,0],[f.width,0,0]],[[0,0,0],[0,f.height*f.expansion,0]],[[0,0,0],[0,0,f.depth]],[[f.width,0,0],[f.width,f.height*f.expansion,0]],[[f.width,0,0],[f.width,0,f.depth]],[[0,f.height*f.expansion,0],[f.width,f.height*f.expansion,0]],[[0,f.height*f.expansion,0],[0,f.height*f.expansion,f.depth]],[[0,0,f.depth],[f.width,0,f.depth]],[[0,0,f.depth],[0,f.height*f.expansion,f.depth]],[[f.width,f.height*f.expansion,0],[f.width,f.height*f.expansion,f.depth]],[[f.width,0,f.depth],[f.width,f.height*f.expansion,f.depth]],[[0,f.height*f.expansion,f.depth],[f.width,f.height*f.expansion,f.depth]]];
    c.strokeStyle='#b4c5a3';c.lineWidth=1.2;for(const [a,b] of edges){const p=project(...a),q=project(...b);c.beginPath();c.moveTo(p.x,p.y);c.lineTo(q.x,q.y);c.stroke();}
    for(const b of [...f.pores].sort((a,b)=>b.z-a.z)){const p=project(b.x,b.y*f.expansion,b.z);pore(c,p.x,p.y,b.r*scale,b.r*scale,.55+.35*(1-b.z/f.depth));}
    c.font='11px ui-monospace,monospace';c.fillStyle='#526b40';c.fillText(tr('POPOLAZIONE 3D · PROIEZIONE OBLIQUA','3D POPULATION · OBLIQUE PROJECTION'),30,28);c.fillText(tr('Campione trasparente · tutte le bolle simulate','Transparent sample · all simulated gas cells'),30,325);
  }
  function documentation(){const t=tr,n=number,a=state.run.parameters;return `
    <p>${t('Modello di popolazione 3D deterministico: distribuzione iniziale, trasferimento CO₂, crescita, contatto e fusione dei film, degassamento in stesura, riscaldamento e consolidamento. Non è CFD né una previsione validata del tuo cornicione.','Deterministic 3D population model: initial distribution, CO₂ transfer, growth, film contact and merger, shaping degassing, heating and setting. This is neither CFD nor a validated prediction of your crust.')}</p>
    <div class="pc-equations">E(t) = ∫ exp[−Eₐ/R · (1/T − 1/293.15)] dt<br>n_generated = n_potential · {G₀ + (1−G₀)[1−exp(−(E/Eg)^1.2)]}<br>(n_air+n_CO₂) RT/(4πr³/3) + P_v = P_atm + 2γ/r + K · [(r/r_lock)³−1]<br>T_core = min(99, T_start + (T_oven−T_start)[1−exp(−t/τ_oven)])<br>V_gas = Σ 4πr³/3 · φ = V_gas/(V_matrix+V_gas)<br>n_generated = n_cells + n_reservoir + n_lost</div>
    <p>${t('Temperature in kelvin nelle equazioni del gas e di Arrhenius; tempi E ed Eg in ore, τ forno in minuti, raggi in metri, pressioni in pascal, gas in moli. Eg, G₀ e S arrivano dalla curva non normalizzata, senza applicare le osservazioni personali. W modifica solo la tenuta ipotizzata S, non determina direttamente dimensione o numero degli alveoli. P/L e proteine restano dati consultabili, senza conversioni arbitrarie in cinetiche.','Temperatures are kelvin in gas and Arrhenius equations; E and Eg are in hours, oven τ in minutes, radii in metres, pressures in pascals, gas in moles. Eg, G₀ and S come from the unnormalised curve, without applying personal observations. W only affects assumed strength S; it does not directly determine pore size or count. P/L and protein remain reference data, without arbitrary conversion into kinetics.')}</p>
    <p>${t('Ritenzione del gas nuovo','New gas retention')}: retention × development × (0.3 + 0.7 S). ${t('Autolisi aggiunge 0,06 a development, fino a 1; idratazione e olio modificano la scala delle fusioni. Tutti questi coefficienti sono ipotesi di Pizza Lab. Il gas non trasferito resta nel serbatoio; le perdite finiscono in n_lost. Fusione e stesura conservano esplicitamente il bilancio CO₂. Il vapore è un termine di pressione separato: non rientra nel bilancio CO₂.','Autolyse adds 0.06 to development, capped at 1; hydration and oil change the merger timescale. These coefficients are Pizza Lab assumptions. Untransferred gas remains in the reservoir; losses enter n_lost. Mergers and shaping explicitly conserve the CO₂ balance. Steam is a separate pressure term, excluded from the CO₂ balance.')}</p>
    <p>${t('Campione attuale','Current sample')}: 60 × ${n(a.height*1000,2)} × 8 mm ${t('prima dell’espansione; spessore = 2,4 × peso/(densità × area pizza), densità ipotizzata 1,2 g/ml. Non viene previsto il volume dell’intera pizza.','before expansion; thickness = 2.4 × mass/(density × pizza area), assumed density 1.2 g/ml. Whole-pizza volume is not predicted.')} Eg=${n(a.Eg,2)} h; C=${n(a.C,2)} h; G₀=${n(a.seed,3)}.</p>
    <div class="pc-limits"><p>${t('Limiti: il campione è omogeneo; platea, irraggiamento, evaporazione, pH, proteolisi e gradienti centro/bordo non sono risolti. In questa versione la produzione fermentativa si arresta alla stesura: in forno il gas già prodotto si espande e il serbatoio si redistribuisce. Non è una legge biologica. Le bolle sono sfere equivalenti con rilassamento geometrico approssimato, possono sovrapporsi e intersecare il bordo del campione; la porosità è la somma dei volumi equivalenti, non una misura della superficie disegnata. Il grado di consolidamento non certifica la cottura.','Limits: homogeneous sample; deck contact, radiation, evaporation, pH, proteolysis and centre/rim gradients are not resolved. In this version, fermentation production stops at shaping: baking expands existing gas and redistributes the reservoir. This is not a biological law. Cells are equivalent spheres with approximate geometric relaxation; overlap and sample-boundary intersections are possible. Porosity sums equivalent volumes; it is not a measurement of the drawn area. Setting does not certify doneness.')}</p></div>
    <p>${t('Le fonti sostengono i meccanismi, non i coefficienti del simulatore. Per calibrare servono prove reali con farina, dose, temperature, tempi, metodo di stesura e foto del taglio.','Sources support the mechanisms, not the simulator coefficients. Calibration requires actual bakes with flour, dose, temperatures, timings, shaping method and cross-section photographs.')}</p><div class="pc-sources"><a href="https://doi.org/10.1016/j.foodres.2015.08.013" target="_blank" rel="noopener">Verheyen et al. · 2015 · gas formation / retention ↗</a><a href="https://doi.org/10.3390/foods12071407" target="_blank" rel="noopener">Pizza dough · 2023 · leavening / structure ↗</a><a href="https://food.au.dk/foodhay/instruments/food-biophysics-platform/food-design-lab/rheofermenter" target="_blank" rel="noopener">Aarhus · rheofermenter measurements ↗</a></div>`;}
  if(typeof window!=='undefined'){
    window.addEventListener('resize',()=>{if(state)draw();});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
    document.addEventListener('pizza-fermentation-model-change',()=>{if(state)render(state.r,state.plan,state.lang);});
  }
  root.PizzaCrumbUI={render,stop,draw};
})(typeof window==='undefined'?globalThis:window);
