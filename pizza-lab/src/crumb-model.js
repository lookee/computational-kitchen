/* Pizza Lab: deterministic 3D gas-cell population, exploratory/unfitted. GPL-3.0-only */
(function (root) {
  'use strict';
  const R = 8.314462618, P0 = 101325, sphere = r => 4 * Math.PI * r ** 3 / 3;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const defaults = Object.freeze({seed: 42, nuclei: 180, initialAir: 4, development: 75,
    retention: 88, gasYield: 2.4, drainage: 18, shapingLoss: 22, diameter: 28,
    ovenTemp: 400, heatTau: 1.8, setTemp: 78, setMinutes: .6,
    surfaceTension: .035, steam: .30});
  const ranges = {seed:[1,99999], nuclei:[80,300], initialAir:[1,12], development:[20,100],
    retention:[20,100], gasYield:[.2,6], drainage:[2,90], shapingLoss:[0,85], diameter:[20,40],
    ovenTemp:[180,500], heatTau:[.4,8], setTemp:[65,95], setMinutes:[.15,3],
    surfaceTension:[.015,.08], steam:[0,.6]};
  function sanitize(input = {}) {
    const s = {};
    for (const [k, [a,b]] of Object.entries(ranges)) {
      const v = Number(input[k] ?? defaults[k]);
      s[k] = Number.isFinite(v) ? clamp(v,a,b) : defaults[k];
    }
    s.seed = Math.round(s.seed); s.nuclei = Math.round(s.nuclei);
    return s;
  }
  function random(seed) { return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }; }
  const cache = new Map();
  function run(r, plan, input = {}, F = root.PizzaFermentation, curveOptions = {}) {
    if (!F) throw Error('PizzaFermentation is required');
    const s = sanitize(input), p = r.p;
    // Independent from the normalised usability curve and personal timing observations.
    const curve = F.build(r, plan, {phase:'final',customW:curveOptions.customW,capFactor:curveOptions.capFactor});
    if (curve.unsupported) return {supported:false, reason:'flour', settings:s, snapshots:[]};
    const key = JSON.stringify([F.signature(r), p.bakeMinutes, s, curve.w, curve.C]);
    if (cache.has(key)) return cache.get(key);
    const rng = random(s.seed), W = .060, D = .008, density = 1200;
    // A local rim sample, NOT a complete pizza: 2.4 × average sheet thickness.
    const H = (p.peso / 1000 / density) / (Math.PI * (s.diameter / 200) ** 2) * 2.4;
    const V0 = W * H * D, matrix = V0 * (1 - s.initialAir / 100);
    const sampleFlour = matrix * density * 1000 * r.F / r.M;
    // ml CO2 (at 20°C, 1 atm) per g flour; a user hypothesis, not measured yield.
    const potential = r.Y > 0
      ? sampleFlour * s.gasYield * 1e-6 * P0 / (R * 293.15) : 0;
    const weights = Array.from({length:s.nuclei}, () => Math.exp((rng() - .5) * 2.2));
    const sum = weights.reduce((a,b) => a+b,0), cells = [];
    for (let i=0; i<s.nuclei; i++) {
      const radius = Math.cbrt(V0 * s.initialAir / 100 * weights[i] / sum * 3 / (4*Math.PI));
      let x,y,z;
      for (let attempt=0; attempt<100; attempt++) {
        x=radius+rng()*(W-2*radius); y=radius+rng()*(H-2*radius); z=radius+rng()*(D-2*radius);
        if (!cells.some(b => Math.hypot(x-b.x,y-b.y,z-b.z) < (radius+b.r)*1.02)) break;
      }
      cells.push({id:i,x,y,z,r:radius,lock:radius,
        air:(P0+2*s.surfaceTension/radius)*sphere(radius)/(R*(p.initialTemp+273.15)),
        co:0,set:0,alive:true});
    }
    const snapshots=[], contacts=new Map();
    const development=clamp(s.development/100+(p.autolysis?.06:0),.2,1);
    const mobility=clamp(Math.exp((p.H-65)*.028)*(1+r.O/r.F*3),.6,2);
    let generated=0,lost=0,reservoir=0,merged=0,expansion=1,shaped=false;
    function snapshot(kind,hour,minute,T) {
      const alive=cells.filter(b=>b.alive), volume=alive.reduce((a,b)=>a+sphere(b.r),0);
      const gasCO=alive.reduce((a,b)=>a+b.co,0), diameters=alive.map(b=>b.r*2000).sort((a,b)=>a-b);
      snapshots.push({kind,hour,minute,temperature:T,width:W,height:H,depth:D,
        expansion:(matrix+volume)/V0,porosity:volume/(matrix+volume),count:alive.length,
        medianDiameter:diameters[Math.floor(diameters.length/2)]||0,
        setting:alive.reduce((a,b)=>a+b.set,0)/Math.max(1,alive.length),merged,
        generatedCO2:generated,retainedCO2:gasCO,reservoirCO2:reservoir,lostCO2:lost,
        balanceError:generated-gasCO-reservoir-lost,
        pores:alive.map(b=>({id:b.id,x:b.x,y:b.y,z:b.z,r:b.r,set:b.set}))});
    }
    function radii(T,dt,baking) {
      for (const b of cells) if (b.alive) {
        if (baking) {
          const previous=b.set;
          const rate=Math.max(0,(T-(s.setTemp-6))/12)/s.setMinutes;
          b.set=1-(1-b.set)*Math.exp(-dt/60*rate);
          if (previous<.15 && b.set>=.15) b.lock=b.r;
        }
        // Saturation pressure (Pa); capped steam term is a deliberately simplified closure.
        const pv=baking ? Math.min(s.steam*P0,611.2*Math.exp(2.5e6/461.5*(1/273.15-1/(T+273.15)))) : 0;
        const elastic=250000*development*Math.max(0,(b.set-.15)/.85)**3;
        let lo=1e-7,hi=.035;
        for(let i=0;i<23;i++) {
          const mid=(lo+hi)/2;
          const pressure=(b.air+b.co)*R*(T+273.15)/sphere(mid)+pv-P0
            -2*s.surfaceTension/mid-elastic*((mid/b.lock)**3-1);
          if(pressure>0)lo=mid;else hi=mid;
        }
        b.r=(lo+hi)/2;
      }
      const gas=cells.reduce((a,b)=>a+(b.alive?sphere(b.r):0),0);
      expansion=(matrix+gas)/V0;
    }
    function topology(dt,T) {
      const live=cells.filter(b=>b.alive);
      for(let i=0;i<live.length;i++) {
        const a=live[i]; if(!a.alive)continue;
        for(let j=i+1;j<live.length;j++) {
          const b=live[j];if(!b.alive)continue;
          const dist=Math.hypot(a.x-b.x,(a.y-b.y)*expansion,a.z-b.z),pair=a.id+':'+b.id;
          if(dist<(a.r+b.r)*.97 && Math.max(a.set,b.set)<.75) {
            const contact=(contacts.get(pair)||0)+dt;contacts.set(pair,contact);
            const threshold=s.drainage*60*development/mobility*Math.exp(8*Math.max(a.set,b.set)-.012*(T-20));
            if(contact>=threshold) {
              const va=sphere(a.r),vb=sphere(b.r),v=va+vb;
              a.x=(a.x*va+b.x*vb)/v;a.y=(a.y*va+b.y*vb)/v;a.z=(a.z*va+b.z*vb)/v;
              a.r=Math.cbrt(a.r**3+b.r**3);a.lock=Math.cbrt(a.lock**3+b.lock**3);
              a.air+=b.air;a.co+=b.co;a.set=Math.max(a.set,b.set);
              b.co=0;b.alive=false;merged++;
            }
          } else contacts.delete(pair);
        }
      }
      // Position relaxation approximates deforming films; it is not a CFD packing solver.
      for(let pass=0;pass<2;pass++)for(let i=0;i<live.length;i++) {
        const a=live[i];if(!a.alive)continue;
        for(let j=i+1;j<live.length;j++) {
          const b=live[j];if(!b.alive)continue;
          let dx=a.x-b.x,dy=(a.y-b.y)*expansion,dz=a.z-b.z,dist=Math.hypot(dx,dy,dz);
          const sep=(a.r+b.r)*.94;if(dist>=sep)continue;
          if(dist<1e-10){dx=1e-7;dist=1e-7;}
          const move=(sep-dist)*.3/dist;
          a.x=clamp(a.x+dx*move,0,W);b.x=clamp(b.x-dx*move,0,W);
          a.y=clamp(a.y+dy*move/expansion,0,H);b.y=clamp(b.y-dy*move/expansion,0,H);
          a.z=clamp(a.z+dz*move,0,D);b.z=clamp(b.z-dz*move,0,D);
        }
      }
    }
    function feed(target,T,dt,strength,baking=false) {
      const delta=Math.max(0,target-generated);generated+=delta;
      const retention=s.retention/100*development*(.3+.7*strength);
      reservoir+=delta*retention;lost+=delta*(1-retention);
      const live=cells.filter(b=>b.alive),area=live.reduce((a,b)=>a+b.r**2,0);
      const transfer=reservoir*(1-Math.exp(-dt/120));reservoir-=transfer;
      for(const b of live) {
        b.co+=transfer*b.r**2/area;
        const leakRate=(1-strength)*.00012/mobility*(1-b.set);
        const leak=b.co*(1-Math.exp(-leakRate*dt));b.co-=leak;lost+=leak;
      }
      radii(T,dt,baking);
    }
    // Unnormalised gas potential from equivalent thermal exposure, including an indirect-dough seed.
    const targetAt = E => potential*(curve.seed+(1-curve.seed)*(-Math.expm1(-((E/curve.Eg)**1.2))));
    if(curve.seed>0)feed(targetAt(0),p.initialTemp,600,1);
    snapshot('fermentation',0,0,p.initialTemp);
    // Include phase boundaries exactly. Adaptive dt never exceeds 5 min; <= 300 fermentation frames.
    const series=curve.points.filter(v=>v.hour<=p.hours+1e-9),last=F.sample(curve.points,p.hours);
    if(series.at(-1).hour<p.hours-1e-9)series.push(last);
    let prev=series[0],sinceTopology=0,nextSave=p.hours/240;
    for(let index=1;index<series.length;index++) {
      const v=series[index],dt=(v.hour-prev.hour)*3600;
      feed(targetAt(v.E),v.T,dt,v.s);
      sinceTopology+=dt;
      if(sinceTopology>=300 || index===series.length-1){topology(sinceTopology,v.T);sinceTopology=0;}
      if(v.hour>=nextSave || index===series.length-1) {
        snapshot('fermentation',v.hour,0,v.T);nextSave=v.hour+p.hours/240;
      }
      prev=v;
    }
    const fermentationEnd=snapshots.length-1,shapeTemp=last.T;
    // An assumed single shaping loss for the rim. Does not deduct recipe ingredient mass.
    for(const b of cells)if(b.alive){lost+=b.co*s.shapingLoss/100;b.co*=1-s.shapingLoss/100;b.air*=1-s.shapingLoss/100;}
    lost+=reservoir*s.shapingLoss/100;reservoir*=1-s.shapingLoss/100;
    radii(shapeTemp,0,false);shaped=true;snapshot('shaping',p.hours,0,shapeTemp);
    const shapingIndex=snapshots.length-1,gasAtBake=generated;
    // Fermentation gas production stops at shaping in this version; baking redistributes reservoir CO2.
    const bakeSeconds=p.bakeMinutes*60;
    for(let sec=0;sec<bakeSeconds;) {
      const dt=Math.min(2,bakeSeconds-sec);sec+=dt;
      const minute=sec/60;
      const T=Math.min(99,shapeTemp+(s.ovenTemp-shapeTemp)*(1-Math.exp(-minute/s.heatTau)));
      feed(gasAtBake,T,dt,last.s,true);
      if(sec%10===0)topology(10,T);
      if(sec%4===0||sec===bakeSeconds)snapshot('baking',p.hours,minute,T);
    }
    const result={supported:true,settings:s,snapshots,fermentationEnd,shapingIndex,
      parameters:{width:W,height:H,depth:D,sampleFlour,development,gasPotential:potential,
        w:curve.w,unknownW:curve.unknownW,C:curve.C,Eg:curve.Eg,seed:curve.seed,shaped}};
    cache.set(key,result);if(cache.size>4)cache.delete(cache.keys().next().value);
    return result;
  }
  const api={run,sanitize,defaults,ranges};
  root.PizzaCrumb=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window==='undefined'?globalThis:window);
