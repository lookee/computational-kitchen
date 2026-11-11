window.YogurtSimulation=(()=>{
 const M=window.YogurtLab,P=window.YogurtPhysics,$=id=>document.getElementById(id),fmt=(v,d=1)=>v.toLocaleString('it-IT',{maximumFractionDigits:d});
 function panSVG(s,r,gradientId="pan-shadow"){
  const round=s.shape!=='loaf',rx=round?Math.min(90,s.diameter*3.2):100,ry=round?rx*.43:35,fill=M.clamp(r.total/s.batterDensity/(r.area*6),.05,.9),line='#a0b78c';let shape='';
  if(round){
   shape=`<path d="M${150-rx},80 v48 a${rx},${ry} 0 0 0 ${2*rx},0 v-48" fill="#e6eddd" stroke="${line}"/><ellipse cx="150" cy="80" rx="${rx}" ry="${ry}" fill="#fcfdf9" stroke="${line}"/><path d="M${150-rx+4},${128-fill*48} a${rx-4},${ry-2} 0 0 0 ${2*rx-8},0 v${fill*48} a${rx-4},${ry-2} 0 0 1 -${2*rx-8},0 Z" fill="#e4ca95" opacity=".65"/><ellipse cx="150" cy="${128-fill*48}" rx="${rx-5}" ry="${ry-3}" fill="#f4dfad" stroke="#c8a971"/>`;
   if(s.shape==='ring'){const hole=rx*s.hole/s.diameter;shape+=`<path d="M${150-hole},${128-fill*48} v-43 a${hole},${hole*.43} 0 0 1 ${hole*2},0 v43" fill="#e4ecd9" stroke="${line}"/><ellipse cx="150" cy="${85-fill*48}" rx="${hole}" ry="${hole*.43}" fill="#fbfdf8" stroke="${line}"/>`;}
   shape+=`<line x1="${150-rx}" x2="${150+rx}" y1="185" y2="185" stroke="${line}"/><path d="M${150-rx+5},181 l-5,4 5,4 M${150+rx-5},181 l5,4 -5,4" fill="none" stroke="${line}"/><text x="150" y="204" text-anchor="middle">Ø ${fmt(s.diameter,0)} cm${s.shape==='ring'?' · foro Ø '+fmt(s.hole,0)+' cm':''}</text>`;
  }else{
   const w=110*s.length/25,d=36*s.width/11,x=150-w/2;
   shape=`<path d="M${x},73 l${w},0 ${d},-24 0,58 -${d},24 -${w},0 Z" fill="#e4ecd9" stroke="${line}"/><path d="M${x},73 l${w},0 ${d},-24 -${w},0 Z" fill="#f8fbf3" stroke="${line}"/><path d="M${x+5},${126-fill*52} l${w-10},0 ${d-7},-21 -${w-10},0 Z" fill="#f1d9a2" stroke="#c5a369"/><path d="M${x+w},73 v58 l${d},-24 v-58 Z" fill="#d2dfc6" fill-opacity=".6" stroke="${line}"/><line x1="${x}" x2="${x+w}" y1="178" y2="178" stroke="${line}"/><text x="150" y="201" text-anchor="middle">${fmt(s.length,0)} × ${fmt(s.width,0)} cm</text>`;
  }
  return `<svg viewBox="0 0 300 220" role="img" aria-label="Stampo ${s.shape==='round'?'tondo':s.shape==='ring'?'a ciambella':'rettangolare'}, con dimensioni e livello d’impasto stimato"><defs><radialGradient id="${gradientId}"><stop stop-color="#557333" stop-opacity=".13"/><stop offset="1" stop-color="#557333" stop-opacity="0"/></radialGradient></defs><ellipse cx="150" cy="157" rx="135" ry="30" fill="url(#${gradientId})"/>${shape}<style>text{font:11px ui-monospace,monospace;fill:#52703c}</style></svg>`;
 }
 function renderPan(s,r){const svg=panSVG(s,r,'pan-shadow-main');$('panPreview').innerHTML=panSVG(s,r,'pan-shadow-config');$('panVisualization').innerHTML=`<div class="pan-graphic">${svg}</div><div><span class="micro-label">IL TUO STAMPO / ${s.shape==='round'?'TONDO':s.shape==='ring'?'CIAMBELLA':'PLUMCAKE'}</span><h3>La forma cambia il percorso del calore.</h3><dl><div><dt>Area utile</dt><dd>${fmt(r.area,0)} cm²</dd></div><div><dt>Spessore iniziale stimato</dt><dd>${fmt(r.total/(s.batterDensity*r.area),1)} cm</dd></div><div><dt>Densità impasto ipotizzata</dt><dd>${fmt(s.batterDensity,2)} g/ml</dd></div></dl><p>Disegno in prospettiva. Livello stimato con stampo alto 6 cm; verifica il riempimento reale. La ciambella favorisce anche il riscaldamento dall’interno.</p></div>`;}
 function render(s,r,time,view){
  const frame=P.frame(s,time),canvas=$('crumbCanvas'),box=canvas.getBoundingClientRect();if(!box.width)return;
  const ratio=Math.min(2,window.devicePixelRatio||1);canvas.width=box.width*ratio;canvas.height=box.height*ratio;const c=canvas.getContext('2d');c.scale(canvas.width/900,canvas.height/360);
  const grad=c.createLinearGradient(0,0,0,360);grad.addColorStop(0,'#f6f9f0');grad.addColorStop(1,'#ebf1e2');c.fillStyle=grad;c.fillRect(0,0,900,360);
  c.strokeStyle='#dce5d2';c.lineWidth=.6;for(let x=30;x<900;x+=40){c.beginPath();c.moveTo(x,0);c.lineTo(x,360);c.stroke();}for(let y=40;y<360;y+=40){c.beginPath();c.moveTo(0,y);c.lineTo(900,y);c.stroke();}
  const physicalScale=Math.min(700/frame.width,240/(frame.height*frame.expansion)),height=view==='micro'?frame.height*frame.expansion*physicalScale:Math.min(230,90*frame.expansion),width=view==='micro'?frame.width*physicalScale:650,left=(900-width)/2,bottom=290,top=bottom-height,cocoa=s.extras==='cocoa';
  const path=new Path2D();if(view==='micro')path.roundRect(left,top,width,height,12);else{path.moveTo(left,bottom);path.lineTo(left,top+20);path.bezierCurveTo(left+100,top-23,left+width-100,top-23,left+width,top+20);path.lineTo(left+width,bottom);path.bezierCurveTo(left+width-150,bottom+15,left+150,bottom+15,left,bottom);path.closePath();}
  c.save();c.shadowColor='#5a482226';c.shadowBlur=18;c.shadowOffsetY=10;c.fillStyle='#d0ab6b';c.fill(path);c.restore();c.strokeStyle=cocoa?'#865e3f':'#bd955b';c.lineWidth=7;c.stroke(path);c.save();c.clip(path);
  const crumb=c.createLinearGradient(0,top,0,bottom);crumb.addColorStop(0,cocoa?'#a67a58':'#edce8c');crumb.addColorStop(.55,cocoa?'#bc9370':'#f8e7b8');crumb.addColorStop(1,cocoa?'#95704e':'#e0c28b');c.fillStyle=crumb;c.fillRect(80,20,750,310);
  // Draw only actual intersections with a fixed plane in the simulated 3D population.
  const plane=frame.depth/2,scaleX=width/frame.width,scaleY=height/frame.height;
  let visible=0;
  for(const b of frame.pores){const distance=Math.abs(b.z-plane);if(distance>=b.r)continue;const cross=Math.sqrt(b.r*b.r-distance*distance),x=left+b.x*scaleX,y=bottom-b.y*scaleY,rx=cross*scaleX,ry=view==='micro'?cross*physicalScale:cross*scaleY/Math.max(1,frame.expansion*.55);visible++;
   c.beginPath();c.ellipse(x,y,rx+1,ry+1,0,0,Math.PI*2);c.fillStyle=cocoa?'#d5b498':'#fff1c4';c.fill();
   const p=c.createRadialGradient(x,y-ry*.2,0,x,y,Math.max(rx,ry));p.addColorStop(0,cocoa?'#5e402e':'#a48650');p.addColorStop(.6,cocoa?'#865f40':'#c5a66d');p.addColorStop(1,cocoa?'#b48b61':'#e0c391');c.fillStyle=p;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();
  }
  c.restore();c.font='10px ui-monospace,monospace';c.fillStyle='#738462';c.fillText(`PIANO FISSO z = ${fmt(plane*1000,0)} mm · ${visible} INTERSEZIONI`,30,330);
  $('seedDisplay').textContent=`SEED ${String(s.seed).padStart(4,'0')} · Δt 5 s`;$('simPhase').textContent=frame.setting>.8?'Struttura consolidata nel modello':frame.setting>.2?'Matrice in consolidamento':'Crescita e coalescenza';$('simTimeLabel').textContent=`${fmt(time,1)} min`;$('simTime').value=time;
  $('simReadings').innerHTML=`<div><span>VOLUME NEL MODELLO</span><strong>×${fmt(frame.expansion,2)}</strong><small>Rapporto calcolato, non altezza prevista</small></div><div><span>BOLLE NEL CAMPIONE 3D</span><strong>${frame.count} <small>/ ${frame.initialCount} iniziali</small></strong><small>${frame.merged} fusioni · ${frame.vented} aperture</small></div><div><span>DIAMETRO MEDIANO DELLE BOLLE</span><strong>${fmt(frame.medianDiameter,2)} mm</strong><small>Dimensione simulata, non misurata</small></div>`;
  $('physicsDiagnostics').innerHTML=`<span>T cuore modello <strong>${fmt(frame.temperature,1)} °C</strong></span><span>Consolidamento medio <strong>${fmt(frame.setting*100,0)}%</strong></span><span>Bilancio CO₂ <strong>|errore| ${Math.abs(frame.gasBalanceError).toExponential(1)} mol</strong></span>`;
 }
 return {render,renderPan,panSVG};
})();
