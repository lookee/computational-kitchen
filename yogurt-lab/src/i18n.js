/* Italian/English presentation layer. Models and stored user data stay language-neutral.
 * © 2026 Luca Amore · GPL-3.0-only */
window.YogurtI18n=(()=>{
 'use strict';
 const messages=window.YogurtTranslations;
 const storageKey='yogurt-lab-language';
 let language='it';
 try{const requested=new URLSearchParams(location.search).get('lang');language=(requested||localStorage.getItem(storageKey))==='en'?'en':'it';}catch{}
 const variants=new Map();
 for(const [it,en] of Object.entries(messages)){
  if(it===en)continue;
  variants.set(it,en);
  if(it.length>2){
   if(!variants.has(it.toLocaleLowerCase('it')))variants.set(it.toLocaleLowerCase('it'),en.toLocaleLowerCase('en'));
   if(!variants.has(it.toLocaleUpperCase('it')))variants.set(it.toLocaleUpperCase('it'),en.toLocaleUpperCase('en'));
  }
 }
 const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const word=/[\p{L}\p{N}_]/u;
 const pattern=new RegExp([...variants.keys()].sort((a,b)=>b.length-a.length).map(key=>(word.test(key[0])?'(?<![\\p{L}\\p{N}_])':'')+escape(key)+(word.test(key.at(-1))?'(?![\\p{L}\\p{N}_])':'')).join('|'),'gu');
 function t(value){
  const text=String(value??'');if(language!=='en')return text;
  // Keep commercial product names exactly as printed on their packaging.
  const protectedNames=Object.values(window.YogurtLab?.flourProfiles||{}).filter(p=>p.brand).map(p=>p.name);
  const chunks=protectedNames.length?text.split(new RegExp('('+protectedNames.map(escape).join('|')+')','g')):[text];
  return chunks.map(chunk=>protectedNames.includes(chunk)?chunk:chunk.replace(pattern,match=>variants.get(match))).join('');
 }
 const textState=new WeakMap(),attributeState=new WeakMap();
 const attributes=['aria-label','aria-description','title','placeholder','label','content'];
 const skip='script,style,textarea,[translate="no"],#languageSelect';
 function translateText(node){
  if(node.parentElement?.closest(skip)||!node.nodeValue.trim())return;
  const previous=textState.get(node),source=previous&&node.nodeValue===previous.output?previous.source:node.nodeValue;
  const output=t(source);if(node.nodeValue!==output)node.nodeValue=output;
  textState.set(node,{source,output});
 }
 function translateElement(el){
  if(el.closest(skip))return;
  let values=attributeState.get(el);if(!values){values={};attributeState.set(el,values);}
  for(const name of attributes){
   if(!el.hasAttribute(name))continue;
   if(name==='content'&&!el.matches('meta[name="description"]'))continue;
   const current=el.getAttribute(name),previous=values[name],source=previous&&current===previous.output?previous.source:current;
   const output=t(source);if(current!==output)el.setAttribute(name,output);values[name]={source,output};
  }
 }
 function translateTree(root){
  if(root.nodeType===3){translateText(root);return;}
  if(root.nodeType!==1&&root.nodeType!==9)return;
  if(root.nodeType===1){if(root.closest(skip))return;translateElement(root);}
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);
  while(walker.nextNode())if(walker.currentNode.nodeType===3)translateText(walker.currentNode);else translateElement(walker.currentNode);
 }
 const observer=new MutationObserver(records=>{
  observer.disconnect();
  const roots=new Set();
  for(const record of records){
   if(record.type==='childList')for(const node of record.addedNodes)roots.add(node);
   else roots.add(record.target);
  }
  for(const root of roots)if(root.isConnected)translateTree(root);
  observe();
 });
 function observe(){observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:attributes});}
 function apply(){observer.disconnect();translateTree(document.documentElement);observe();}
 function setLanguage(next){
  language=next==='en'?'en':'it';document.documentElement.lang=language;
  document.getElementById('languageSelect').value=language;
  try{localStorage.setItem(storageKey,language);}catch{}
  document.dispatchEvent(new CustomEvent('yogurt:languagechange'));
  apply();
 }
 document.documentElement.lang=language;
 document.getElementById('languageSelect').value=language;
 document.getElementById('languageSelect').addEventListener('change',e=>setLanguage(e.target.value));
 // The app calls apply after its initial render. Later DOM updates are observed.
 return {t,apply,setLanguage,get language(){return language;},get locale(){return language==='en'?'en-GB':'it-IT';}};
})();
