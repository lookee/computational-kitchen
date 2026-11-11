const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const M=require('../src/model.js');
function presentation(search='',saved){
 const selector={value:'',addEventListener(){}};
 const context={window:{YogurtLab:M},location:{search},URLSearchParams,CustomEvent:class{},document:{documentElement:{},getElementById:()=>selector,dispatchEvent(){}},MutationObserver:class{observe(){}disconnect(){}},localStorage:{getItem:()=>saved,setItem(){}}};
 vm.createContext(context);
 for(const file of ['translations.js','i18n.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file),'utf8'),context);
 return context.window.YogurtI18n;
}
test('Language defaults, remembered choice and explicit links use the same locale',()=>{
 assert.equal(presentation().language,'it');
 assert.equal(presentation('', 'en').locale,'en-GB');
 assert.equal(presentation('?lang=it','en').language,'it');
 assert.equal(presentation('?lang=en','it').language,'en');
});
test('Dynamic messages translate across number and punctuation boundaries',()=>{
 const i=presentation('?lang=en');
 assert.equal(i.t('0/3 controlli strutturali registrati. La temperatura da sola non descrive la struttura.'),'0/3 structural checks recorded. Temperature alone does not describe structure.');
 assert.equal(i.t('Aggiungi le polveri setacciate. Usa la durata come limite iniziale; fermati appena l’impasto è omogeneo. Se restano striature, finisci a mano a macchina ferma.'),'Add the sifted dry ingredients. Use the duration as an initial limit; stop as soon as the batter is uniform. If streaks remain, finish by hand with the machine stopped.');
 assert.equal(i.t('PIANO FISSO z = 4 mm · 12 INTERSEZIONI'),'FIXED PLANE z = 4 mm · 12 INTERSECTIONS');
 assert.equal(i.t('Molino Grassi'),'Molino Grassi');
 assert.match(i.t('Prima scelta Caputo domestica: il molino la dedica a pan di spagna, biscotti e dolci. W 200–220; non coincide con la Frolla professionale.'),/^First Caputo choice for home use/);
 assert.equal(i.t('P/L 0,45–0,55'),'P/L 0,45–0,55');
 assert.equal(i.t('Caputo Pasticceria · 00 · 1 kg'),'Caputo Pasticceria · 00 · 1 kg');
});
test('Every preset and appliance produces English instructions without changing calculations',()=>{
 const i=presentation('?lang=en');
 for(const preset of M.presets)for(const device of ['TM5','TM6','TM7']){
  const s=M.fromPreset(preset.id,{...M.defaults,device}),before=JSON.stringify(M.calculate(s));
  const protocol=M.protocol(s).map(step=>i.t(step.name+'\n'+step.setting+'\n'+step.text)).join('\n');
  assert.doesNotMatch(protocol,/\b(farfalla|boccale|riscaldamento|impasto|cottura|polveri|scorza|macchina|zucchero|ventilato|statico)\b/i,preset.id+' '+device);
  assert.match(protocol,/BUTTERFLY WHISK/);
  assert.equal(JSON.stringify(M.calculate(s)),before);
 }
});
test('Italian text is unchanged and complete messages preserve numerical assumptions',()=>{
 const it=presentation('?lang=it'),en=presentation('?lang=en');
 const source='Lievito oltre il 5,5% della miscela: possibile retrogusto o struttura irregolare. La dose del produttore sulla confezione viene prima del simulatore.';
 assert.equal(it.t(source),source);
 assert.match(en.t(source),/5\.5%/);
 assert.equal(en.t('Lotto 2/3 · Uova, zucchero e aria'),'Batch 2/3 · Eggs, sugar and air');
});
