/* Yogurt Computational Lab · © 2026 Luca Amore · GPL-3.0-only */
(function (root) {
  'use strict';
  const flourProfiles = {
    pastry: {name:'Debole per dolci', protein:9, w:'130–180', gluten:true, note:'Punto di partenza consigliato. Cerca una farina per torte e controlla la scheda: «00» da solo non basta.'},
    ordinary: {name:'00 comune', protein:11, w:'non dichiarato', gluten:true, note:'Il tipo 00 descrive la raffinazione, non la forza. Proteine e W vanno letti sull’etichetta o sulla scheda.'},
    strong: {name:'Forte / Manitoba', protein:13.5, w:'≥ 300', gluten:true, note:'Utile al pane, meno adatta a una mollica tenera. Non è la scelta iniziale per questa torta.'},
    whole: {name:'Integrale di frumento', protein:12.5, w:'variabile', gluten:true, note:'La crusca modifica assorbimento e struttura. Comincia sostituendo il 25–30% della farina, in una prova separata.'},
    spelt: {name:'Farro', protein:12, w:'variabile', gluten:true, note:'Aroma più marcato e reologia diversa dal frumento comune. Non è senza glutine.'},
    oat: {name:'Avena', protein:13, w:'non applicabile', gluten:false, note:'Non costruisce la rete del frumento. Per uso senza glutine serve avena certificata; l’impasto tende a essere più compatto.'},
    rice: {name:'Riso finissimo', protein:7, w:'non applicabile', gluten:false, note:'Non forma glutine. La finezza è importante; struttura affidata soprattutto a uova e amidi. Versione sperimentale.'},
    'caputo-pasticceria':{brand:'Caputo',name:'Caputo Pasticceria · 00 · 1 kg',protein:11,w:'200–220',pl:'0,60–0,70',gluten:true,source:'https://www.mulinocaputo.it/prodotti/pasticceria/',note:'Prima scelta Caputo domestica: il molino la dedica a pan di spagna, biscotti e dolci. W 200–220; non coincide con la Frolla professionale.'},
    'caputo-frolla':{brand:'Caputo',name:'Caputo Frolla · 0 · 25 kg',protein:11,w:'140–160',pl:'0,45–0,55',gluten:true,source:'https://www.mulinocaputo.it/prodotti/frolla/',note:'Farina debole professionale, indicata anche per pan di spagna. La scheda consultata è del sacco da 25 kg. Da provare per una mollica tenera.'},
    'caputo-classica':{brand:'Caputo',name:'Caputo Classica / Doppio Zero · 1 kg',protein:12,w:'220–240',pl:'0,50–0,60',gluten:true,source:'https://www.mulinocaputo.it/prodotti/doppio-zero/',note:'Classica e Doppio Zero sono lo stesso profilo del produttore: un’unica voce. Farina versatile da dispensa, meno specifica della Pasticceria per questa torta.'},
    'caputo-nuvola':{brand:'Caputo',name:'Caputo Nuvola · 0 · 1 kg',protein:12.5,w:'270–290',gluten:true,source:'https://www.mulinocaputo.it/prodotti/nuvola/',note:'Inserita come confronto per chi arriva da Pizza Lab. È pensata per pizza e focaccia: non la prima scelta per una torta tenera. Alveoli della pizza e mollica del cake non sono equivalenti.'},
    'dallagiovanna-frolla':{brand:'Dallagiovanna',name:'Dallagiovanna Far Dolci Frolla · 00',protein:11,w:'170 ±20',gluten:true,source:'https://www.shopdallagiovanna.it/dms/Ecommerce/SCHEDE%20COMMERCIALI/LEDOLCISSIME/SC_Linea_Far_Dolci_321002.05_00_FROLLA_kg_5_Rev0.pdf',note:'LeDolcissime / Far Dolci Frolla, adatta anche a torte da forno e pan di spagna. Dati della scheda italiana 5 kg; controlla la tua confezione.'},
    'grassi-torte':{brand:'Molino Grassi',name:'Molino Grassi Torte e Biscotti · 00',protein:12,w:'220 ±30',gluten:true,source:'https://www.molinograssi.it/product/farina-00-torte-e-biscotti/',note:'Farina specifica per torte e biscotti. Proteine nutrizionali 12 g/100 g: il minimo tecnico dell’11% su sostanza secca non è la stessa misura.'},
    'spadoni-dolci':{brand:'Spadoni',name:'Spadoni Gran Mugnaio per Dolci · 00',protein:9,proteinAssumed:true,w:'non dichiarato nella fonte',gluten:true,source:'https://www.molinospadoni.it/prodotti/farina-tipo-00-per-dolci-gran-mugnaio/',note:'Il produttore la descrive come debole per torte soffici e ciambelle. W e proteine non verificati nella fonte attuale: il 9% iniziale è un segnaposto da sostituire con la tua etichetta.'},
    'spadoni-bio':{brand:'Spadoni',name:'Almaverde Bio Torte e Dolci · 0',protein:11,w:'140–190',gluten:true,source:'https://shop.molinospadoni.it/products/farina-bio-speciale-per-torte-e-dolci-0-cf101',note:'Spadoni Almaverde Bio: farina debole specifica per torte e dolci. Non è una miscela autolievitante; il lievito si pesa separatamente.'},
    'barilla-00':{brand:'Barilla',name:'Barilla Farina di Grano Tenero · 00',protein:11,w:'non dichiarato',gluten:true,source:'https://www.barilla.com/it-it/prodotti/farine-e-cereali/farine/farina-di-grano-tenero-tipo-00',note:'Opzione comune da dispensa. Proteine 11 g/100 g; il sito non dichiara il W. Non lo deduciamo dalle proteine.'},
    'petra-5':{brand:'Petra',name:'Petra 5 · tipo 1 a pietra',protein:13,w:'non espresso dal produttore',gluten:true,source:'https://shop.farinaearte.it/macinazione-a-pietra/5-petra-5.html',note:'Profilo aromatico tipo 1, ricco di fibre. Petra non esprime W/P-L per questo prodotto: la fibra rende poco significativo il test alveografico. Il 13% proteico non la rende automaticamente una Manitoba.'}
  };
  const defaults = {preset:'signature', device:'TM6', shape:'round', diameter:24, length:25, width:11, hole:8, portions:10,
    flour:300, flourId:'pastry', protein:9, starch:12, nuts:0, sugar:180, sweetener:'sugar', yogurt:200, yogurtType:'whole',
    oil:90, oilType:'seed', eggs:150, leaven:12, extras:'lemon', extra:4, milk:0, whip:5, mix:20,
    oven:170, ovenMode:'static', bake:40, initial:22, tau:14, seed:42, batchLimit:1100, thermometer:true, bakeLoss:12, cookedWeight:0, nutritionOverrides:{},initialAir:8,viscosity:300,surfaceTension:0.04,gasYield:0.12,gasRetention:25,setTemp:85,setMinutes:2,elasticity:30,waterActivity:0.85,batterDensity:0.95,filmDrainage:600};
  const presets = [
    {id:'signature', name:'Signature · limone & vaniglia', tag:'LA NOSTRA PROPOSTA', description:'Farina debole, 12% di amido, più yogurt. Una base di ricerca per una mollica fine, da validare nel tuo forno.', config:{}},
    {id:'original', name:'ai-pie v.0.1 · originale', tag:'DAL BLOG / 2024', description:'Le dosi del primo commento: 3 uova, 300 g farina, 250 g zucchero, 125 g yogurt, 100 ml olio. Protocollo reso più prudente.', config:{flourId:'ordinary',protein:11,starch:0,sugar:250,yogurt:125,oil:92,leaven:16,whip:10,mix:30,oven:180,bake:35}},
    {id:'oat', name:'ai-pie v.0.2 · avena & mandorle', tag:'DAL BLOG / 2024', description:'Le dosi del commento 0.2. Miele, avena e mandorle cambiano la struttura: non è l’equivalente della versione classica. Yogurt greco 0% come riferimento magro.', config:{flour:250,flourId:'oat',protein:13,starch:0,nuts:20,sugar:100,sweetener:'honey',yogurt:250,yogurtType:'greek0',oil:50,oilType:'coconut',leaven:16,whip:0,oven:180,bake:30}},
    {id:'lemon', name:'Limone & semi di papavero', tag:'AGRUMATA', description:'Scorza fine di limone e semi di papavero. Il succo resta fuori per non modificare inutilmente acqua e acidità.', config:{extras:'poppy',extra:16}},
    {id:'cocoa', name:'Cacao fondente', tag:'CIOCCOLATO', description:'25 g di cacao sostituiscono parte della miscela; 25 g di latte come prima correzione da verificare.', config:{flour:275,extras:'cocoa',extra:25,milk:25,sugar:190}},
    {id:'blueberry', name:'Mirtilli & vaniglia', tag:'FRUTTA', description:'120 g di mirtilli asciutti incorporati a mano. La frutta aumenta l’acqua locale: controlla il centro e prolunga solo se serve.', config:{extras:'blueberries',extra:120,bake:45}},
    {id:'olive', name:'Olio EVO & arancia', tag:'MEDITERRANEA', description:'Un extravergine delicato e scorza d’arancia. Il profilo dell’olio conta più di una generica etichetta di qualità.', config:{oilType:'olive',extras:'orange',extra:5}},
    {id:'coffee', name:'Caffè & nocciola', tag:'TOSTATA', description:'10% di nocciole nella miscela e 20 g di espresso freddo. La frutta secca aggiunge grassi, non glutine.', config:{nuts:10,extras:'coffee',extra:20,sugar:190}},
    {id:'gf', name:'Riso & mandorla · senza frumento', tag:'SPERIMENTALE', description:'Riso fine, amido e mandorle. Per una torta senza glutine usa ingredienti certificati e attrezzatura idonea.', config:{flourId:'rice',protein:7,starch:25,nuts:15,yogurt:220,extras:'lemon',extra:4}},
    {id:'lactosefree', name:'Yogurt senza lattosio', tag:'SOSTITUZIONE MIRATA', description:'Yogurt bianco senza lattosio con composizione simile a quello intero. Contiene comunque proteine del latte.', config:{yogurtType:'lactosefree'}},
    {id:'plant', name:'Yogurt di soia · con uova', tag:'SENZA LATTE AGGIUNTO', description:'Yogurt di soia bianco non zuccherato. Le uova restano; controlla ingredienti e allergeni di ogni prodotto.', config:{yogurtType:'soy'}}
  ];
  const bounds = {diameter:[16,30],length:[18,35],width:[8,18],hole:[4,14],portions:[4,20],flour:[180,400],protein:[5,16],starch:[0,35],nuts:[0,30],sugar:[60,280],yogurt:[100,300],oil:[40,140],eggs:[100,220],leaven:[6,20],extra:[0,180],milk:[0,80],whip:[0,10],mix:[10,90],oven:[150,190],bake:[20,65],initial:[15,30],tau:[8,24],seed:[1,9999],batchLimit:[700,1400],bakeLoss:[0,35],cookedWeight:[0,5000],initialAir:[2,20],viscosity:[30,3000],surfaceTension:[0.02,0.07],gasYield:[0.04,0.2],gasRetention:[15,80],setTemp:[70,95],setMinutes:[0.5,8],elasticity:[2,50],waterActivity:[0.6,0.98],batterDensity:[0.65,1.2]};
  const enumValues = {device:['TM5','TM6','TM7'],shape:['round','loaf','ring'],flourId:Object.keys(flourProfiles),sweetener:['sugar','honey'],yogurtType:['whole','greek','greek0','lactosefree','soy'],oilType:['seed','olive','coconut'],extras:['lemon','orange','poppy','cocoa','blueberries','coffee','none'],ovenMode:['static','fan']};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function sanitize(input={}) {
    const s={...defaults};
    for(const [key,[a,b]] of Object.entries(bounds)) if(typeof input[key]==='number' && Number.isFinite(input[key])) s[key]=clamp(input[key],a,b);
    for(const [key,allowed] of Object.entries(enumValues)) if(allowed.includes(input[key])) s[key]=input[key];
    if(presets.some(p=>p.id===input.preset)) s.preset=input.preset;
    if(typeof input.thermometer==='boolean')s.thermometer=input.thermometer;
    if(Number.isFinite(input.filmDrainage))s.filmDrainage=clamp(input.filmDrainage,60,1800);
    s.nutritionOverrides={};
    if(input.nutritionOverrides && typeof input.nutritionOverrides==='object')for(const [key,value] of Object.entries(input.nutritionOverrides).slice(0,40)){
      if(!/^[a-z][a-z0-9-]{0,60}$/.test(key)||!value||typeof value!=='object')continue;
      const row={};for(const nutrient of ['fat','sat','carbs','sugars','fiber','protein','salt'])if(Number.isFinite(value[nutrient])&&value[nutrient]>=0&&value[nutrient]<=100)row[nutrient]=value[nutrient];
      if(Object.keys(row).length===7&&row.sat<=row.fat&&row.sugars<=row.carbs&&row.fat+row.carbs+row.protein+row.fiber+row.salt<=105)s.nutritionOverrides[key]=row;
    }
    s.starch=Math.min(s.starch,80-s.nuts);
    return s;
  }
  function fromPreset(id, current=defaults) {
    const p=presets.find(p=>p.id===id)||presets[0];
    const shared=Object.fromEntries(['device','shape','diameter','length','width','hole','portions','thermometer','batchLimit','initial','tau','seed','bakeLoss','nutritionOverrides','initialAir','viscosity','surfaceTension','gasYield','gasRetention','setTemp','setMinutes','elasticity','waterActivity','batterDensity','filmDrainage'].map(k=>[k,current[k]]));
    return sanitize({...defaults,...p.config,preset:p.id,...shared});
  }
  const extraNames={lemon:'Scorza di limone',orange:'Scorza d’arancia',poppy:'Scorza + papavero',cocoa:'Cacao amaro',blueberries:'Mirtilli',coffee:'Espresso freddo',none:'Nessun extra'};
  const yogurtNames={whole:'Yogurt bianco intero',greek:'Yogurt greco 5%',greek0:'Yogurt greco 0%',lactosefree:'Yogurt senza lattosio',soy:'Yogurt di soia'};
  const oilNames={seed:'Olio di semi',olive:'Olio extravergine',coconut:'Olio di cocco'};
  function calculate(input) {
    const s=sanitize(input), area=s.shape==='loaf'?s.length*s.width:Math.PI*(s.diameter*s.diameter-(s.shape==='ring'?s.hole*s.hole:0))/4;
    const scale=area/(Math.PI*24*24/4), profile=flourProfiles[s.flourId];
    const base=[
      {key:'flour',name:profile.name,g:s.flour*(1-(s.starch+s.nuts)/100),color:'#486b2f'},
      {key:'starch',name:'Amido di mais',g:s.flour*s.starch/100,color:'#96a76a'},
      {key:'nuts',name:s.preset==='coffee'?'Nocciole macinate':'Farina di mandorle',g:s.flour*s.nuts/100,color:'#be9a65'},
      {key:'eggs',name:'Uova sgusciate',g:s.eggs,color:'#c7a147'},
      {key:'sugar',name:s.sweetener==='honey'?'Miele':'Zucchero',g:s.sugar,color:'#94a78c'},
      {key:'yogurt',name:yogurtNames[s.yogurtType],g:s.yogurt,color:'#bcc7b0'},
      {key:'oil',name:oilNames[s.oilType],g:s.oil,color:'#a9a04e'},
      {key:'leaven',name:'Lievito per dolci',g:s.leaven,color:'#ac764c'},
      {key:'salt',name:'Sale fino',g:1.5,color:'#b6b5ab'},
      {key:'extra',name:extraNames[s.extras],g:s.extras==='none'?0:s.extra,color:'#7d895f'},
      {key:'milk',name:'Latte',g:s.milk,color:'#bfc9b3'}
    ].filter(x=>x.g>0);
    const ingredients=base.map(x=>({...x,g:x.g*scale,pct:x.g/s.flour*100}));
    const total=ingredients.reduce((a,x)=>a+x.g,0), batches=Math.ceil(total/s.batchLimit);
    const waterY={whole:.87,greek:.80,greek0:.85,lactosefree:.87,soy:.90}[s.yogurtType];
    const water=(s.eggs*.76+s.yogurt*waterY+s.milk*.88+(s.sweetener==='honey'?s.sugar*.17:0)+(s.extras==='coffee'?s.extra*.98:0))*scale;
    const blendProtein=s.protein*(1-(s.starch+s.nuts)/100)+(s.nuts/100)*(s.preset==='coffee'?15:21);
    const effectiveGluten=profile.gluten?s.protein*(1-(s.starch+s.nuts)/100):0;
    const texture=!profile.gluten?'Compatta / fragile':['whole','spelt','petra-5'].includes(s.flourId)?'Rustica / da verificare':['strong','caputo-nuvola'].includes(s.flourId)?'Più tenace':s.mix>50?'Più lavorata':'Fine / tenera';
    const warnings=[];
    if(batches>1)warnings.push(`${batches} lotti suggeriti. Il limite di ${s.batchLimit} g è una scelta prudenziale dell’app, non una capacità Vorwerk. Controlla sempre la tacca 2,2 L; la massa non determina il volume.`);
    if(s.mix>40 && profile.gluten)warnings.push('Miscelazione lunga dopo la farina: può sviluppare più glutine e disperdere aria. Fermati appena non restano striature asciutte.');
    if(s.leaven/s.flour>.055)warnings.push('Lievito oltre il 5,5% della miscela: possibile retrogusto o struttura irregolare. La dose del produttore sulla confezione viene prima del simulatore.');
    if(s.sugar<140)warnings.push('Riduzione dello zucchero marcata: cambia anche struttura e ritenzione d’acqua. Valuta una modifica alla volta.');
    if(s.yogurtType.startsWith('greek'))warnings.push('Yogurt greco: proteine e acqua variano molto per marca. Non esiste una correzione universale del liquido; verifica l’etichetta e la consistenza.');
    if(!profile.gluten)warnings.push('Questa miscela non forma la rete del frumento: le proteine totali non indicano il glutine. L’alveolatura disegnata non valida una formulazione senza glutine.');
    if(s.preset==='original')warnings.push('Ricetta 0.1: 100 ml di olio convertiti in circa 92 g (densità assunta 0,92 g/ml); bustina assunta da 16 g. Il commento non specifica lo stampo: Ø 24 cm è il riferimento scelto qui.');
    if(s.preset==='oat')warnings.push('La versione 0.2 del blog viene ripresa come esperimento, senza attribuirle effetti salutistici. La cottura non conserva i fermenti vivi dello yogurt.');
    if(s.ovenMode==='fan')warnings.push('Ventilato: come punto di partenza prova circa 10–15 °C in meno dello statico. L’app mantiene la temperatura che hai scelto: non la corregge automaticamente.');
    return {s,area,scale,ingredients,total,batches,water,blendProtein,effectiveGluten,texture,warnings,blend:s.flour*scale,waterPct:water/(s.flour*scale)*100};
  }
  // A deliberately simple thermal illustration, NOT an oven calibration or a doneness/safety model.
  function thermal(input,t) {
    const s=sanitize(input),recipe=calculate(s),depth=recipe.total/(s.batterDensity*recipe.area),shapeFactor=s.shape==='ring'?.78:s.shape==='loaf'?.90:1;
    const temp=clamp(t,0,120), target=Math.min(99, s.oven*.55+5), tau=s.tau*(170/s.oven)*Math.pow(depth/2.2,2)*shapeFactor*(s.ovenMode==='fan'?.9:1);
    const core=s.initial+(target-s.initial)*(1-Math.exp(-temp/tau));
    const expansion=1+(.62/(1+Math.exp(-(temp-13)/4))-.62/(1+Math.exp(13/4)))*Math.min(1.25,s.leaven/12);
    return {core,expansion,depth,tau,phase:temp<7?'Riscaldamento':temp<20?'Espansione dei gas':temp<32?'Consolidamento progressivo':'Asciugatura e doratura'};
  }
  function protocol(input) {
    const r=calculate(input),s=r.s,steps=[];
    const add=(name,seconds,setting,text,kind='work')=>steps.push({id:steps.length,name,seconds,setting,text,kind});
    add('Prepara il laboratorio',300,'FORNO IN PRERISCALDAMENTO',`Porta il forno a ${s.oven} °C ${s.ovenMode==='fan'?'ventilato':'statico'}. Prepara lo stampo, setaccia insieme farina, amido e lievito. Ingredienti a temperatura ambiente. Il preriscaldamento continua in parallelo: attendi che il forno sia pronto prima di infornare.`);
    for(let b=1;b<=r.batches;b++){
      const prefix=r.batches>1?`Lotto ${b}/${r.batches} · `:'';
      add(prefix+'Pesa e prepara',120,'MACCHINA FERMA',`Pesa ${r.batches>1?'1/'+r.batches+' di ogni ingrediente':'gli ingredienti della ricetta'}. ${s.extras==='lemon'||s.extras==='orange'||s.extras==='poppy'?'Grattugia finemente la scorza evitando la parte bianca. ':''}${s.oilType==='coconut'?'L’olio di cocco deve essere fluido e appena tiepido. ':''}Boccale pulito. Monta correttamente la farfalla se prevista nel passo successivo.`);
      if(s.whip>0){
        const first=Math.min(5,s.whip*.6),second=s.whip-first;
        add(prefix+'Uova, zucchero e aria',Math.round(first*60),`${Math.round(first*60)} s / 37 °C / vel. 4 · FARFALLA`,`Uova e ${s.sweetener==='honey'?'miele':'zucchero'} nel boccale. La farfalla non deve mai superare velocità 4. Coperchio e accessori del ${s.device} secondo il manuale.`);
        if(second>0)add(prefix+'Completa la montata',Math.round(second*60),`${Math.round(second*60)} s / senza riscaldamento / vel. 4`,`Disattiva il riscaldamento. Osserva il composto: chiaro, aerato, omogeneo. La durata è un punto di partenza; più tempo non garantisce più volume finale. Farfalla ancora inserita.`);
      }else add(prefix+'Unisci uova e dolcificante',30,'30 s / senza riscaldamento / vel. 3 · SENZA FARFALLA','Miscela uova e dolcificante fino a omogeneità. Questa versione non prevede una montata prolungata.');
      add(prefix+'Emulsiona yogurt e olio',20,'20 s / senza riscaldamento / vel. 3',`A macchina ferma aggiungi yogurt, olio${s.milk?', latte':''}${s.extras==='coffee'?', espresso freddo':''}. Mescola brevemente. Non versare ingredienti a macchina aperta in movimento.`);
      add(prefix+'Rimuovi la farfalla',30,'MACCHINA FERMA · FARFALLA RIMOSSA','Arresta le lame, apri e rimuovi la farfalla se montata. Solo dopo puoi raccogliere il composto dalle pareti con la spatola. Non usare mai la spatola con la farfalla inserita.');
      add(prefix+'Incorpora le polveri',s.mix,`${s.mix} s / senza riscaldamento / vel. 3 · SENZA FARFALLA`,`Aggiungi le polveri setacciate${s.nuts?' e la frutta secca macinata':''}${s.extras==='cocoa'?', incluso il cacao':''}. Usa la durata come limite iniziale; fermati appena l’impasto è omogeneo. Se restano striature, finisci a mano a macchina ferma.`);
      add(prefix+'Ultime pieghe delicate',60,'A MANO · NESSUN RISCALDAMENTO',`${s.extras==='blueberries'?'Incorpora i mirtilli ben asciutti con poche pieghe. ':s.extras==='poppy'?'Incorpora scorza e semi di papavero. ':s.extras==='lemon'||s.extras==='orange'?'Incorpora la scorza. ':''}Non lavorare oltre il necessario. ${r.batches>1?'Riunisci i lotti con delicatezza e procedi rapidamente; per numerosi lotti preferisci stampi separati e preparazioni scaglionate.':'Versa nello stampo senza sbatterlo ripetutamente.'}`);
    }
    add('Cuoci e osserva',s.bake*60,`${s.oven} °C ${s.ovenMode==='fan'?'VENTILATO':'STATICO'} / circa ${s.bake} min`,`Riempi lo stampo al massimo per circa 2/3, usando uno stampo extra se necessario. Posizione medio-bassa; evita di aprire nei primi 25 minuti. Verso fine cottura verifica centro, elasticità e stecchino senza impasto crudo. ${s.thermometer?'Misura con una sonda sottile al centro della mollica, senza toccare fondo, pareti o frutta; confronta almeno due punti. Consulta il pannello termometro per l’intervallo orientativo. ':''}Il tempo e il grafico non certificano la cottura.`, 'bake');
    add('Lascia assestare',600,'10 min / NELLO STAMPO','Attendi circa 10 minuti su un piano stabile, poi sforma delicatamente. Se è molto fragile, aspetta ancora.', 'wait');
    add('Raffredda sulla gratella',2700,'45 min indicativi / ARIA AMBIENTE','Lascia raffreddare prima di tagliare. Registra peso, altezza e struttura alla stessa temperatura di confronto. Copri solo quando è fredda, per limitare la condensa.', 'wait');
    return steps;
  }
  const api={defaults,presets,flourProfiles,bounds,enumValues,extraNames,yogurtNames,oilNames,sanitize,fromPreset,calculate,thermal,protocol,clamp};
  if(typeof module!=='undefined'&&module.exports)module.exports=api; else root.YogurtLab=api;
})(typeof globalThis!=='undefined'?globalThis:this);
