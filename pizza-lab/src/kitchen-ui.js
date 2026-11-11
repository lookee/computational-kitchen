/* Manual cooking mode, matching Yogurt Lab. No appliance control. GPL-3.0-only */
(function(root){
  'use strict';
  const M=root.PizzaKitchen,$=id=>document.getElementById(id),dialog=$('kitchenDialog'),STORE='pizza-lab-kitchen-v1';
  let state=null,index=0,done=[],timer=M.timer(0),opener=null;
  const t=(it,en)=>state?.lang==='en'?en:it;
  const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function persist(){try{localStorage.setItem(STORE,JSON.stringify({key:state.key,done}));}catch{}}
  function sync(r,plan,options){
    const changed=state?.key!==options.key;
    state={r,plan,...options,cards:M.build(r,plan,options.lang)};
    if(changed){
      timer=M.timer(0);index=0;done=[];
      if(dialog.open)dialog.close();
      try{const saved=JSON.parse(localStorage.getItem(STORE)||'null');if(saved?.key===state.key&&Array.isArray(saved.done)){const ids=new Set(state.cards.map(c=>c.id));done=saved.done.filter(id=>ids.has(id)).slice(0,10000);}}catch{}
    }
    for(const id of ['openKitchen','openKitchen2']){$(id).disabled=!state.cards.length;$(id).textContent=id==='openKitchen'?t('Modalità cucina →','Cooking mode →'):t('Apri modalità cucina →','Open cooking mode →');}
    $('closeKitchen').textContent=t('Chiudi ×','Close ×');$('closeKitchen').setAttribute('aria-label',t('Chiudi modalità cucina','Close cooking mode'));
    $('kitchenModeLabel').textContent=t('NEOTOKIO / MODALITÀ CUCINA','NEOTOKIO / COOKING MODE');
    $('kitchenProgressBar').setAttribute('aria-label',t('Avanzamento passaggi','Step progress'));
    $('kitchenTimer').setAttribute('aria-label',t('Tempo rimanente','Time remaining'));
    $('timerReset').textContent=t('Ricomincia ↻','Reset ↻');$('previousStep').textContent=t('← Precedente','← Previous');
    $('kitchenConfirmHint').textContent=t('Conferma ogni operazione dopo averla eseguita. Il tempo trascorso da solo non la completa.','Confirm each operation after performing it. Elapsed time alone does not complete it.');
    if(dialog.open)render(false);
  }
  function setConfirmed(values){if(state){done=M.reconcile(state.cards,done,state.confirmed,values);state.confirmed=values;persist();}}
  function open(event){
    if(!state?.cards.length)return;opener=event.currentTarget;
    index=M.firstPending(state.cards,state.confirmed,done);render();dialog.showModal();
    root.PizzaCrumbUI?.stop();
  }
  function render(reset=true){
    const card=state.cards[index];if(!card)return;
    if(reset)timer=M.timer(card.seconds);
    const progress=index/state.cards.length*100;
    $('kitchenProgress').style.width=progress+'%';$('kitchenProgressBar').setAttribute('aria-valuenow',Math.round(progress));
    $('kitchenStepLabel').textContent=`${t('PASSAGGIO','STEP')} ${index+1} / ${state.cards.length} · ${state.r.p.bimby}${card.parallel?' · '+t('IN PARALLELO','IN PARALLEL'):card.continuation?' · '+t('CONTINUA','CONTINUED'):''}`;
    $('kitchenTitle').textContent=card.title;
    $('kitchenSetting').textContent=[...new Set(card.primary.map(s=>s.setting||t('Attesa','Wait')))].join(' · ');
    $('kitchenText').innerHTML=card.primary.map(s=>`<p>${card.primary.length>1?'<strong>'+esc(s.title)+'</strong><br>':''}${esc(s.text)}</p>`).join('');
    const format=ms=>new Intl.DateTimeFormat(state.lang==='en'?'en-GB':'it-IT',{timeZone:'Europe/Rome',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).format(ms);
    $('kitchenSchedule').textContent=`${t('Orario previsto','Planned time')}: ${format(card.start)} → ${format(card.end)} · Europe/Rome`;
    $('previousStep').disabled=index===0;$('nextStep').textContent=index===state.cards.length-1?t('Conferma e termina ✓','Confirm & finish ✓'):t('Conferma e continua →','Confirm & continue →');
    const next=state.cards[index+1];
    const notes=[];
    if(card.background.length)notes.push(t('Nel frattempo: ','Meanwhile: ')+card.background.map(s=>s.title).join(' · ')+'.');
    if(card.interrupted&&next)notes.push(t('Il timer copre il tratto fino alla prossima operazione: ','The timer covers the interval until the next operation: ')+next.title+'. '+t('Le fasi che continuano restano nel programma.','Continuing stages remain in the schedule.'));
    $('kitchenOverlap').hidden=!notes.length;$('kitchenOverlap').textContent=notes.join(' ');
    $('kitchenFeedback').textContent='';updateTimer();
  }
  function updateTimer(){
    const seconds=M.remaining(timer);
    $('kitchenTimer').textContent=M.clock(seconds);
    $('timerToggle').textContent=timer.running?t('Pausa Ⅱ','Pause Ⅱ'):seconds<=0?t('Riparti ▶','Restart ▶'):t('Avvia timer ▶','Start timer ▶');
    const device=state?.r.p.bimby||'Bimby';
    $('timerState').textContent=timer.running?t(`Timer in corso. Nessun collegamento al Bimby ${device}.`,`Timer running. No connection to Thermomix ${device}.`):seconds<=0?t('Tempo terminato: verifica il risultato e conferma manualmente.','Time is up: check the result and confirm manually.'):t('Timer manuale. Nessun collegamento al Bimby.','Manual timer. No connection to Thermomix.');
  }
  function disable(){timer=M.timer(0);if(dialog.open)dialog.close();state=null;for(const id of ['openKitchen','openKitchen2'])$(id).disabled=true;}
  for(const id of ['openKitchen','openKitchen2'])$(id).addEventListener('click',open);
  $('closeKitchen').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{timer=M.timer(0);opener?.focus();});
  $('timerToggle').addEventListener('click',()=>{if(!state)return;timer=M.toggle(timer,state.cards[index].seconds);updateTimer();});
  $('timerReset').addEventListener('click',()=>{if(!state)return;timer=M.timer(state.cards[index].seconds);updateTimer();});
  $('previousStep').addEventListener('click',()=>{if(index>0){index--;render();}});
  $('nextStep').addEventListener('click',()=>{
    if(!state)return;const card=state.cards[index];
    state.confirmed=state.onConfirm(card.confirmKeys)||state.confirmed;
    if(!done.includes(card.id))done.push(card.id);persist();
    if(index<state.cards.length-1){index++;render();}
    else{dialog.close();state.onComplete?.(t('Protocollo completato. Buona pizza!','Protocol complete. Enjoy your pizza!'));}
  });
  setInterval(()=>{
    if(!dialog.open||!state)return;
    const expired=M.expire(timer);if(expired!==timer){timer=expired;$('kitchenFeedback').textContent=t('Timer terminato. Controlla e conferma il passaggio.','Timer finished. Check and confirm the step.');}
    updateTimer();
  },250);
  root.PizzaKitchenUI={sync,setConfirmed,disable};
})(typeof window==='undefined'?globalThis:window);
