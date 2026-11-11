// Keep Pizza Lab downloadable as one offline HTML; edit crumb sources, then run this file.
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const target=fileURLToPath(new URL('../pizza-computational-lab.html',import.meta.url));
let html=readFileSync(target,'utf8');
for(const [id,file,tag] of [['pizza-crumb-style','crumb.css','style'],['pizza-crumb-model','crumb-model.js','script'],['pizza-crumb-ui','crumb-ui.js','script']]){
  const source=readFileSync(new URL('./src/'+file,import.meta.url),'utf8');
  const block=`<${tag} id="${id}">\n${source}\n</${tag}>`;
  const pattern=new RegExp(`<${tag} id="${id}">[\\s\\S]*?<\\/${tag}>`);
  if(pattern.test(html)) html=html.replace(pattern,()=>block);
  else if(tag==='style')html=html.replace('</head>',()=>block+'\n</head>');
  else html=html.replace('<script id="pizza-ui">',()=>block+'\n<script id="pizza-ui">');
}
writeFileSync(target,html);
console.log('Pizza Lab: embedded crumb model, viewer and styles.');
