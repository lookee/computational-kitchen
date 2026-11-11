/* Simplified bubble population physics. Uncalibrated engineering model, not CFD. GPL-3.0-only */
(function(root){
 'use strict';
 const M=typeof module!=='undefined'&&module.exports?require('./model.js'):root.YogurtLab;
 const PI=Math.PI,RG=8.314462618,P0=101325,sphere=r=>4/3*PI*r*r*r;
 const random=seed=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};
 const sigmoid=x=>1/(1+Math.exp(-x));
 const relevant=['flour','flourId','protein','starch','nuts','eggs','sugar','sweetener','yogurt','yogurtType','oil','leaven','milk','extra','extras','whip','mix','initial','oven','ovenMode','tau','seed','shape','diameter','hole','width','length','initialAir','viscosity','surfaceTension','gasYield','gasRetention','setTemp','setMinutes','elasticity','waterActivity','batterDensity','filmDrainage'];
 const cache=new Map();
 function key(s){return JSON.stringify(relevant.map(k=>s[k]));}
 function run(input){
  const s=M.sanitize(input),recipe=M.calculate(s),rng=random(s.seed),cacheKey=key(s);if(cache.has(cacheKey))return cache.get(cacheKey);
  const airFraction=M.clamp(s.initialAir/100+.012*s.whip*Math.exp(-s.whip/8)-Math.max(0,s.mix-20)*.00055,.02,.30);
  const count=Math.round(M.clamp(190+26*s.whip*Math.exp(-s.whip/8)-Math.max(0,s.mix-20)*.65,110,310));
  const W=.060,H=.028,D=.008,Vcell=W*H*D,initialGas=Vcell*airFraction,matrixVolume=Vcell-initialGas;
  const weights=Array.from({length:count},()=>Math.exp((rng()-.5)*2.5)),weightSum=weights.reduce((a,b)=>a+b,0),bubbles=[];
  for(let i=0;i<count;i++){
   const r=Math.cbrt(initialGas*weights[i]/weightSum*3/(4*PI));let x,y,z;
   for(let attempt=0;attempt<70;attempt++){x=r+rng()*(W-2*r);y=r+rng()*(H-2*r);z=r+rng()*(D-2*r);if(!bubbles.some(b=>Math.hypot(x-b.x,y-b.y,z-b.z)<(r+b.r)*.94))break;}
   bubbles.push({id:i,x,y,z,r,lock:r,nAir:(P0+2*s.surfaceTension/r)*sphere(r)/(RG*(s.initial+273.15)),nCO:0,pv:0,set:0,alive:true});
  }
  const batterVolume=recipe.total/s.batterDensity*1e-6,leaven=recipe.ingredients.find(x=>x.key==='leaven').g;
  const coPotential=leaven*s.gasYield/44.0095*(Vcell/batterVolume),baseRelease=.8*sigmoid((s.initial-55)/8);
  const viscosityComposition=M.clamp(Math.pow(s.flour/(s.yogurt+s.eggs*.76+s.milk+1),2)*(1+(recipe.effectiveGluten-8)*.05)*(1+s.nuts*.006)/(1+(s.oil-90)/250),.25,4);
  const settingStart=s.setTemp+(s.sugar/s.flour-.6)*10+(s.sweetener==='honey'?1.5:0);
  const snapshots=[],contacts=new Map();let generated=0,reservoir=0,lost=0,merged=0,vented=0,expansion=1,previousRelease=0;
  function snapshot(minute,T){
   const active=bubbles.filter(b=>b.alive),gas=active.reduce((n,b)=>n+sphere(b.r),0),free=active.reduce((n,b)=>n+b.nCO,0),radii=active.map(b=>b.r*2000).sort((a,b)=>a-b);
   const S=active.length?active.reduce((n,b)=>n+b.set,0)/active.length:0;
   snapshots.push({minute,temperature:T,pores:active.map(b=>({x:b.x,y:b.y,z:b.z,r:b.r,set:b.set})),count:active.length,initialCount:count,merged,vented,expansion:(matrixVolume+gas)/Vcell,gasFraction:gas/(matrixVolume+gas),medianDiameter:radii.length?radii[Math.floor(radii.length/2)]:0,setting:S,generatedCO2:generated,freeCO2:free,reservoirCO2:reservoir,lostCO2:lost,gasBalanceError:generated-(free+reservoir+lost),width:W,height:H,depth:D});
  }
  snapshot(0,s.initial);
  const dt=5,dtMin=dt/60;
  for(let sec=dt;sec<=65*60;sec+=dt){
   const minute=sec/60,T=M.thermal(s,minute).core;
   const release=M.clamp((.2*(1-Math.exp(-minute/3))+.8*sigmoid((T-55)/8)-baseRelease)/(1-baseRelease),0,1),delta=Math.max(0,release-previousRelease)*coPotential;
   previousRelease=release;generated+=delta;reservoir+=delta*s.gasRetention/100;lost+=delta*(1-s.gasRetention/100);
   const alive=bubbles.filter(b=>b.alive),surfaceSum=alive.reduce((n,b)=>n+b.r*b.r,0),transfer=reservoir*(1-Math.exp(-dt/35));
   if(alive.length){for(const b of alive)b.nCO+=transfer*b.r*b.r/surfaceSum;reservoir-=transfer;}
   for(const b of alive){
    const localT=T+Math.min(7,Math.abs(b.y/H-.5)*14)*(1-Math.exp(-minute/10));
    const rate=Math.max(0,(localT-(settingStart-6))/12)/s.setMinutes;
    const prev=b.set;b.set=1-(1-b.set)*Math.exp(-dtMin*rate);if(prev<.25&&b.set>=.25)b.lock=b.r;
    const mu=s.viscosity*viscosityComposition*Math.exp(-.025*(localT-s.initial)+12*b.set);
    const satPressure=611.2*Math.exp(2.5e6/461.5*(1/273.15-1/(localT+273.15)));
    const vapTarget=Math.min(.88*P0,s.waterActivity*satPressure);b.pv+=(vapTarget-b.pv)*(1-Math.exp(-dt/20));
    const elastic=s.elasticity*1000*Math.pow(b.set,3),n=b.nAir+b.nCO;
    let lo=1e-6,hi=.012;
    for(let j=0;j<20;j++){const mid=(lo+hi)/2,p=n*RG*(localT+273.15)/sphere(mid)+b.pv-P0-2*s.surfaceTension/mid-elastic*(Math.pow(mid/b.lock,3)-1);if(p>0)lo=mid;else hi=mid;}
    const target=(lo+hi)/2,relax=1-Math.exp(-dt/(4*mu/(3*P0)+.05));b.r+=(target-b.r)*relax;
    if(b.set<.75&&b.y*expansion+b.r>H*expansion&&b.r>.001){lost+=b.nCO;b.nCO=0;b.alive=false;vented++;}
   }
   if(sec%15===0){
    const live=bubbles.filter(b=>b.alive);
    for(let i=0;i<live.length;i++){const a=live[i];if(!a.alive||a.set>.65)continue;
     for(let j=i+1;j<live.length;j++){const b=live[j];if(!b.alive||b.set>.65)continue;
      const distance=Math.hypot(a.x-b.x,(a.y-b.y)*expansion,a.z-b.z),sum=a.r+b.r,pair=a.id+'-'+b.id;
      if(distance<sum*.96){const accumulated=(contacts.get(pair)||0)+15;contacts.set(pair,accumulated);
       const filmTime=s.filmDrainage*viscosityComposition*Math.exp(-.015*(T-s.initial)+8*Math.max(a.set,b.set));
       if(accumulated>=filmTime){const va=sphere(a.r),vb=sphere(b.r),v=va+vb;a.x=(a.x*va+b.x*vb)/v;a.y=(a.y*va+b.y*vb)/v;a.z=(a.z*va+b.z*vb)/v;a.r=Math.cbrt(a.r**3+b.r**3);a.lock=Math.cbrt(a.lock**3+b.lock**3);a.nAir+=b.nAir;a.nCO+=b.nCO;a.pv=(a.pv*va+b.pv*vb)/v;a.set=Math.max(a.set,b.set);b.alive=false;b.nCO=0;merged++;}
      }else contacts.delete(pair);
     }
    }
    // Geometric contact relaxation: liquid films may deform slightly while draining;
    // after setting, project sphere centres apart. This is a packing closure, not CFD.
    for(let pass=0;pass<2;pass++)for(let i=0;i<live.length;i++){const a=live[i];if(!a.alive)continue;
     for(let j=i+1;j<live.length;j++){const b=live[j];if(!b.alive)continue;
      let dx=a.x-b.x,dy=(a.y-b.y)*expansion,dz=a.z-b.z,dist=Math.hypot(dx,dy,dz);
      const separation=(a.r+b.r)*(Math.max(a.set,b.set)>.65?.99:.90);
      if(dist>=separation)continue;
      if(dist<1e-10){dx=1e-7;dist=1e-7;}
      const move=(separation-dist)*.48/dist;
      a.x=M.clamp(a.x+dx*move,0,W);b.x=M.clamp(b.x-dx*move,0,W);
      a.y=M.clamp(a.y+dy*move/expansion,0,H);b.y=M.clamp(b.y-dy*move/expansion,0,H);
      a.z=M.clamp(a.z+dz*move,0,D);b.z=M.clamp(b.z-dz*move,0,D);
     }
    }
   }
   const gas=bubbles.reduce((n,b)=>n+(b.alive?sphere(b.r):0),0);expansion=M.clamp((matrixVolume+gas)/Vcell,.5,6);
   if(sec%30===0)snapshot(minute,T);
  }
  const result={snapshots,initialAir:airFraction,parameters:{count,W,H,D,dt,coPotential,settingStart,viscosityComposition}};cache.set(cacheKey,result);if(cache.size>16)cache.delete(cache.keys().next().value);return result;
 }
 function frame(input,minute){const result=run(input);return result.snapshots[Math.max(0,Math.min(result.snapshots.length-1,Math.round(minute*2)))];}
 const api={run,frame,key};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.YogurtPhysics=api;
})(typeof globalThis!=='undefined'?globalThis:this);
