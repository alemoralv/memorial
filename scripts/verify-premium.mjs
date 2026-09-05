import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright-core';
const out='lab/premium-interactions'; fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const results=[];
const fixturePhoto='data:image/webp;base64,'+fs.readFileSync('fotos/t/marilu-soplando-un-diente-de-leon.webp').toString('base64');
const stub=`window.__writes=[];window.__failWrites=false;window.__data={recuerdos:[{id:'fixture-memory',author:'Persona de prueba',text:'Recuerdo de prueba aislado.'}],recetas:[],momentos:[],lugares:[],canciones:[],votos:[]};
window.__listeners={};
function snap(name,fn){window.__listeners[name]=fn;fn({forEach:cb=>(window.__data[name]||[]).forEach(d=>cb({id:d.id,data:()=>d}))});}
var store={collection:name=>({onSnapshot:fn=>snap(name,fn),add:entry=>{window.__writes.push({collection:name,entry});if(window.__failWrites)return Promise.reject(Error('isolated rejection'));var row={...entry,id:'fixture-'+Date.now()};(window.__data[name]||=[]).push(row);if(window.__listeners[name])snap(name,window.__listeners[name]);return Promise.resolve({id:row.id});}}),doc:name=>({onSnapshot:fn=>fn({exists:true,data:()=>({n:131})}),set:entry=>{window.__writes.push({document:name,entry});return Promise.resolve();}})};
function firestore(){return store;}firestore.FieldValue={serverTimestamp:()=>({fixtureTimestamp:true}),increment:n=>({fixtureIncrement:n})};window.firebase={apps:[],initializeApp:()=>{},firestore};`;
async function context(options={},mock=true){
 const c=await browser.newContext({viewport:{width:1440,height:900},...options});
 await c.addInitScript(()=>{Element.prototype.requestPointerLock=()=>Promise.resolve();Element.prototype.setPointerCapture=()=>{};Element.prototype.releasePointerCapture=()=>{};});
 if(mock){
  await c.route('https://www.gstatic.com/firebasejs/**',r=>r.fulfill({contentType:'application/javascript',body:r.request().url().includes('firebase-app-compat')?stub:''}));
  await c.route('https://firestore.googleapis.com/**',async r=>{
   const u=r.request().url();
   if(u.includes('/documents/fotos?')) return r.fulfill({json:{documents:['g1','g2'].map((id,i)=>({name:'documents/fotos/'+id,createTime:'2026-01-0'+(i+1),fields:{label:{stringValue:'Fotografía aislada '+id},author:{stringValue:'Persona de prueba'}}}))}});
   if(u.includes('/documents/fotos/')) {await new Promise(r=>setTimeout(r,1000));return r.fulfill({json:{fields:{src:{stringValue:fixturePhoto}}}});}
   throw Error('Unexpected remote operation: '+r.request().method()+' '+u);
  });
 }
 return c;
}
async function open(c){const p=await c.newPage();p.setDefaultTimeout(15000);p.setDefaultNavigationTimeout(45000);await p.goto('http://localhost:4517/',{waitUntil:'domcontentloaded'});await p.waitForSelector('html.sc-ready');await p.evaluate(()=>document.fonts.ready);return p;}
async function jump(p,id,progress=0){await p.evaluate(({id,progress})=>{const el=document.getElementById(id);scrollTo({top:el.getBoundingClientRect().top+scrollY+Math.max(0,el.offsetHeight-innerHeight)*progress,behavior:'instant'});},{id,progress});await p.waitForTimeout(400);}
try{
 let c=await context(),p=await open(c);const errors=[];p.on('pageerror',e=>errors.push(e.message));
 assert.equal(await p.locator('h1').count(),1);
 assert.equal(await p.locator('.ella__plate img').evaluate(i=>i.complete&&i.naturalWidth>0),true);
 // All form outcomes are exercised against the isolated in-browser cloud stub.
 await jump(p,'cierre');
 await p.locator('[data-t="texto"]').click(); await p.locator('#f-name').fill('QA aislada');await p.locator('#f-text').fill('Sólo existe en este navegador de prueba.');
 await p.locator('#plate button[type="submit"]').click();
 assert.equal(await p.evaluate(()=>window.__writes.filter(w=>w.collection==='recuerdos').length),1);
 assert.equal(await p.locator('#f-text').inputValue(),'');
 await p.locator('[data-t="momento"]').click();await p.locator('#f-date').fill('2000-01-01');await p.locator('#f-title').fill('Momento de prueba');await p.locator('#plate button[type="submit"]').click();
 assert.equal(await p.evaluate(()=>window.__writes.filter(w=>w.collection==='momentos').length),1);
 await p.locator('[data-t="receta"]').click();await p.locator('#f-plato').fill('Receta de prueba');await p.locator('#f-rec').fill('Contenido aislado');await p.locator('#plate button[type="submit"]').click();
 assert.equal(await p.evaluate(()=>window.__writes.filter(w=>w.collection==='recetas').length),1);
 await p.locator('[data-t="foto"]').click();await p.locator('#f-file').setInputFiles('fotos/t/marilu-soplando-un-diente-de-leon.webp');await p.waitForSelector('#f-prev:not([hidden]) img');await p.locator('#plate button[type="submit"]').click();
 assert.equal(await p.evaluate(()=>window.__writes.filter(w=>w.collection==='fotos').length),1);
 assert.equal(await p.evaluate(()=>window.__writes.find(w=>w.collection==='fotos').entry.src.startsWith('data:image/jpeg;base64,')),true);
 results.push('Four contribution types save expected payloads in isolated cloud stub; photo preview/compression works.');
 await jump(p,'cierre');await p.locator('#f-name').fill('');await p.locator('#plate button[type="submit"]').click();assert.equal(await p.locator('#f-name').evaluate(e=>e.validity.valueMissing),true);
 await jump(p,'ella');await p.locator('#velita').click();assert.equal(await p.evaluate(()=>window.__writes.some(w=>w.document==='contadores/velitas')),true);assert.equal(await p.locator('#velita').evaluate(e=>e.classList.contains('is-lit')),true);
 results.push('Required-name validation and candle interaction work. No production write is performed.');
 await jump(p,'album',.35);await p.locator('#alb-frame').focus();await p.keyboard.press('Enter');await p.waitForSelector('#lb[open]');
 const count=await p.locator('#lb-cuenta').innerText();await p.keyboard.press('ArrowRight');assert.notEqual(await p.locator('#lb-cuenta').innerText(),count);
 await p.locator('#lb-x').focus();await p.keyboard.press('Shift+Tab');assert.equal(await p.evaluate(()=>document.activeElement.id),'lb-sig');await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>document.activeElement.id),'lb-x');
 await p.keyboard.press('Escape');assert.equal(await p.locator('#lb').getAttribute('open'),null);assert.equal(await p.evaluate(()=>document.activeElement.id),'alb-frame');
 results.push('Photo viewer opens by keyboard; arrows, focus loop, Escape, and focus restoration work.');
 await p.locator('[data-modo="libro"]').click();await jump(p,'album',.1);assert.equal(await p.locator('#libro').isVisible(),true);assert.equal(await p.locator('#scrollalb').isVisible(),false);
 const bookBefore=await p.locator('#libro-cuenta').innerText();await p.locator('#libro-sig').click();await p.waitForTimeout(1200);assert.notEqual(await p.locator('#libro-cuenta').innerText(),bookBefore);
 await p.reload({waitUntil:'domcontentloaded'});await p.waitForSelector('html.sc-ready');assert.equal(await p.evaluate(()=>localStorage.getItem('ml_album_modo')||Object.keys(localStorage).filter(k=>k.includes('modo')).map(k=>localStorage.getItem(k)).join('')),'"libro"');
 await p.locator('[data-modo="scroll"]').click();
 results.push('Book mode switches exclusively, pages advance, and the preference survives reload.');
 // Preload shared photographs through the contact strip, then revisit them.
 await jump(p,'album',.98);await p.waitForTimeout(1800);await jump(p,'album',.87);await p.waitForTimeout(500);
 assert.equal(await p.locator('.alb__slide.is-on img').evaluate(i=>i.complete&&i.naturalWidth>0),true);
 assert.equal(await p.locator('#alb-p, #alb-t, .pag__ced, #lb-t, #lb-p, .ella__print figcaption').count(),0);
 results.push('Cached contributed photographs render in the main album (regression check).');
 await p.setViewportSize({width:390,height:844});await jump(p,'ella');assert.equal(await p.locator('#ella').getAttribute('data-sc-act'),'flow');
 await p.locator('.idx__toggle').click();assert.equal(await p.locator('.idx__toggle').getAttribute('aria-expanded'),'true');await p.keyboard.press('Escape');assert.equal(await p.locator('.idx__toggle').getAttribute('aria-expanded'),'false');
 await p.locator('.idx__toggle').click();await p.locator('.idx a[href="#muro"]').click();assert.equal(await p.locator('.idx__toggle').getAttribute('aria-expanded'),'false');
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await jump(p,'ella');await p.screenshot({path:out+'/phone.png'});
 await p.setViewportSize({width:1440,height:900});assert.equal(await p.locator('#ella').getAttribute('data-sc-act'),'pin');
 results.push('Mobile menu, Escape, section navigation, and live desktop/phone recomposition work.');
 await jump(p,'cancion');assert.equal(await p.locator('#stay').evaluate(v=>v.paused&&v.preload==='none'),true);
 await p.locator('#stay').evaluate(async v=>{v.muted=true;await v.play();});await p.waitForTimeout(600);assert.equal(await p.locator('#stay').evaluate(v=>v.currentTime>0),true);await jump(p,'final');assert.equal(await p.locator('#stay').evaluate(v=>v.paused),true);
 results.push('Stay stays paused until requested, plays, and pauses when scrolled away.');
 assert.deepEqual(errors,[]);await c.close();
 c=await context({reducedMotion:'reduce'});p=await open(c);assert.equal(await p.locator('#ella').getAttribute('data-sc-act'),'flow');await jump(p,'album',.1);await p.locator('#alb-frame').click();assert.equal(await p.locator('#lb-pausa').getAttribute('aria-pressed'),'true');await p.keyboard.press('Escape');await c.close();results.push('Reduced motion removes hero pin and prevents automatic photo playback.');
 c=await context({javaScriptEnabled:false,viewport:{width:360,height:640}});p=await c.newPage();await p.goto('http://localhost:4517/',{waitUntil:'domcontentloaded'});await p.waitForLoadState('load');assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.equal(await p.locator('#plate').isVisible(),false);assert.equal(await p.locator('.no-script').isVisible(),true);await c.close();results.push('No-JavaScript fallback exposes photograph/film links and hides the scripted form.');
 fs.writeFileSync(out+'/results.json',JSON.stringify({passed:results},null,2));console.log(results.join('\n'));
} catch(e){fs.writeFileSync(out+'/failure.json',JSON.stringify({passed:results,error:e.stack},null,2));throw e;}finally{await browser.close();}
