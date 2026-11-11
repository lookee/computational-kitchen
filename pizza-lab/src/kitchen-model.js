/* Pizza Lab cooking agenda and manual wall-clock timer. GPL-3.0-only */
(function(root){
  'use strict';
  function build(r,plan,lang='it',I=root.PizzaLanguage){
    // Partition the existing schedule at every start/end boundary. A long wait
    // must never hide a fold or a preheat, and overlapping bakes cannot be added
    // sequentially to inflate the original schedule.
    const items=plan.events.flatMap((event,i)=>{
      const e=lang==='en'?I.englishEvent(event,r):event;
      return event.steps?event.steps.map((step,j)=>({key:`step:${i}:${j}`,parent:`event:${i}`,
        title:e.steps[j].title,text:e.steps[j].text,setting:e.steps[j].setting,
        context:e.title,kind:step.kind,start:Math.round(event.start+step.minute*60000),
        end:Math.round(event.start+(step.minute+step.duration)*60000)})): [{key:`event:${i}`,parent:null,
        title:e.title,text:e.description,setting:e.tag||'',context:e.title,kind:event.type,
        start:Math.round(event.start),end:Math.round(event.end)}];
    }).filter(s=>s.end>s.start);
    const boundaries=[...new Set(items.flatMap(s=>[s.start,s.end]))].sort((a,b)=>a-b),cards=[];
    for(let i=0;i<boundaries.length-1;i++){
      const start=boundaries[i],end=boundaries[i+1];
      const active=items.filter(s=>s.start<end&&s.end>start);
      if(!active.length){
        const oven=start>=plan.firstBake,en=lang==='en';
        const title=oven?(en?'Oven recovery':'Recupero termico del forno'):(en?'Scheduled wait':'Attesa del programma');
        cards.push({id:`${start-plan.start}:${end-plan.start}:gap`,start,end,seconds:(end-start)/1000,
          title,primary:[{title,setting:en?'Wait':'Attesa',text:oven?(en?'Allow the oven to recover before the next pizza. Follow the planned interval and check the stone.':'Lascia recuperare il forno prima della prossima pizza. Rispetta l’intervallo previsto e verifica la pietra.'):(en?'Wait until the next planned operation.':'Attendi la prossima operazione del programma.')}],background:[],contributors:[],confirmKeys:[],continuation:false,interrupted:false,parallel:false});
        continue;
      }
      const actions=active.filter(s=>s.kind!=='wait'),primary=actions.length?actions:active;
      const ending=active.filter(s=>Math.abs(s.end-end)<.01);
      cards.push({id:`${start-plan.start}:${end-plan.start}:${active.map(s=>s.key).join(',')}`,
        start,end,seconds:(end-start)/1000,title:primary.map(s=>s.title).join(' + '),
        primary,background:active.filter(s=>!primary.includes(s)),
        contributors:active.map(s=>({key:s.key,parent:s.parent})),
        confirmKeys:ending.map(s=>s.key),continuation:primary.some(s=>s.start<start),
        interrupted:active.some(s=>s.end>end),parallel:actions.length>1});
    }
    return cards;
  }
  function completed(card,values={},segments=[]){
    return segments.includes(card.id)||(card.contributors.length>0&&card.contributors.every(s=>values[s.key]===true||(s.parent&&values[s.parent]===true)));
  }
  function firstPending(cards,values,segments){const i=cards.findIndex(c=>!completed(c,values,segments));return i<0?0:i;}
  function reconcile(cards,segments,before,after){
    const unchecked=new Set(Object.keys(before).filter(k=>before[k]===true&&after[k]!==true));
    if(!unchecked.size)return segments;
    const invalid=new Set(cards.filter(c=>c.contributors.some(s=>unchecked.has(s.key)||unchecked.has(s.parent))).map(c=>c.id));
    return segments.filter(id=>!invalid.has(id));
  }
  function timer(seconds){return{running:false,deadline:0,remaining:Math.max(0,seconds)};}
  function remaining(t,now=Date.now()){return Math.max(0,t.running?(t.deadline-now)/1000:t.remaining);}
  function toggle(t,seconds,now=Date.now()){
    if(t.running)return{...t,running:false,remaining:remaining(t,now)};
    const left=t.remaining>0?t.remaining:seconds;
    return{running:true,deadline:now+left*1000,remaining:left};
  }
  function expire(t,now=Date.now()){return t.running&&now>=t.deadline?timer(0):t;}
  function clock(seconds){const s=Math.max(0,Math.ceil(seconds)),h=Math.floor(s/3600),m=Math.floor(s%3600/60),ss=String(s%60).padStart(2,'0');return h?`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${ss}`:`${String(m).padStart(2,'0')}:${ss}`;}
  const api={build,completed,firstPending,reconcile,timer,remaining,toggle,expire,clock};root.PizzaKitchen=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window==='undefined'?globalThis:window);
