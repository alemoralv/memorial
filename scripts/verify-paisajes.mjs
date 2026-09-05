import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {parseDocument} from 'htmlparser2';
import {textContent} from 'domutils';
import {selectAll} from 'css-select';
import {chromium} from 'playwright-core';
const url=process.env.PAISAJES_URL||'http://localhost:4520/';
const out='lab/paisajes-checks';fs.mkdirSync(out,{recursive:true});
const original=execFileSync('git',['show','HEAD:index.html'],{encoding:'utf8'});
const current=fs.readFileSync('index.html','utf8');
function content(html){const doc=parseDocument(html);return ['main','.idx','.hoja','.lb','noscript'].map(s=>selectAll(s,doc).map(n=>textContent(n).replace(/\s+/g,' ').trim()));}
assert.deepEqual(content(current),content(original),'All existing content text preserved');
for(const file of ['memorial.js','fotos.js','scrollcraft.js','scrollcraft.css','premium.js','premium.css','atmosfera.js','atmosfera.css']) assert.ok(fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n')===execFileSync('git',['show','HEAD:'+file],{maxBuffer:15e6,encoding:'utf8'}).replace(/\r\n/g,'\n'),file+' unchanged (Git line endings normalized)');
const report={preservedContent:true,preservedCoreFiles:true,configs:[]};
const browser=await chromium.launch({channel:'chrome',headless:true});
async function jump(p,id,progress){await p.evaluate(({id,progress})=>{let e=document.getElementById(id);scrollTo({top:e.getBoundingClientRect().top+scrollY+Math.max(0,e.offsetHeight-innerHeight)*progress,behavior:'instant'});},{id,progress});await p.waitForTimeout(700);}
async function scrubJump(p,id,progress){await p.evaluate(({id,progress})=>{let e=document.getElementById(id);scrollTo({top:e.getBoundingClientRect().top+scrollY+Math.max(innerHeight*.5,e.offsetHeight-innerHeight)*progress,behavior:'instant'});},{id,progress});await p.waitForTimeout(700);}
try {
 for(const [width,height,reduced] of [[1440,1000,false],[768,1024,false],[390,844,false],[360,640,false],[1440,1000,true]]){
  const c=await browser.newContext({viewport:{width,height},reducedMotion:reduced?'reduce':'no-preference',isMobile:width<640,hasTouch:width<640});
  await c.addInitScript(()=>{Element.prototype.requestPointerLock=()=>Promise.resolve();Element.prototype.setPointerCapture=()=>{};Element.prototype.releasePointerCapture=()=>{};});
  const p=await c.newPage(),errors=[],failed=[];
  p.on('pageerror',e=>errors.push(e.message));
  p.on('response',r=>{if(r.url().startsWith(url)&&r.status()>=400)failed.push(r.url()+':'+r.status());});
  await p.goto(url,{waitUntil:'domcontentloaded'});await p.waitForSelector('html.sc-ready');await p.evaluate(()=>document.fonts.ready);
  await p.waitForFunction(()=>[...document.querySelectorAll('[data-paisaje] img')].every(i=>i.complete&&i.naturalWidth>0));
  const config={width,height,reduced,checks:[],films:[]};
  assert.equal(await p.locator('.atmosfera').getAttribute('aria-hidden'),'true');
  assert.equal(await p.locator('.atmosfera').evaluate(e=>getComputedStyle(e).pointerEvents),'none');
  assert.ok(await p.evaluate(()=>+getComputedStyle(document.querySelector('main')).zIndex>+getComputedStyle(document.querySelector('.atmosfera')).zIndex));
  config.checks.push('All four posters decoded, decorative stack below main and noninteractive');
  for(const id of ['ella','vida','album','muro','cocina','cierre','final']){
   await jump(p,id,id==='ella'?0:.3);
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,id+' overflow');
  }
  await jump(p,'album',.2);await p.waitForFunction(()=>{let i=document.querySelector('.alb__slide.is-on img');return i&&i.complete&&i.naturalWidth>0;});
  const photo=await p.locator('.alb__slide.is-on img').boundingBox();
  assert.ok(photo.y>=0&&photo.y+photo.height<=height-(width>640?60:48),JSON.stringify(photo)+' full album photograph');
  config.checks.push('Every section without horizontal overflow; complete album photograph');
  if(!reduced){
   for(const [id,name] of [['ella','paris'],['cocina','cocina']]){
    await scrubJump(p,id,.05);const v=p.locator('[data-film="'+name+'"]');
    await p.waitForFunction(name=>{let v=document.querySelector('[data-film="'+name+'"]');return v.readyState>=2&&!v.seeking;},name,{timeout:25000});
    await p.waitForTimeout(500);const start=await v.evaluate(v=>v.currentTime);
    await scrubJump(p,id,.75);await p.waitForTimeout(650);const end=await v.evaluate(v=>v.currentTime);
    assert.ok(end>start+.08,`${name} must scrub forward ${start} -> ${end}`);
    await scrubJump(p,id,.05);await p.waitForTimeout(650);const back=await v.evaluate(v=>v.currentTime);
    assert.ok(back<end-.08,`${name} must scrub backward`);
    assert.equal(await v.evaluate(v=>v.paused&&v.muted&&!v.autoplay),true);
    config.films.push({name,start,end,back});
   }
  }else{
   assert.equal(await p.locator('[data-film][src]').count(),0,'Reduced motion downloads no decorative video');
   assert.ok(await p.locator('.paisaje').evaluateAll(es=>es.every(e=>getComputedStyle(e).transform==='none')));
  }
  await jump(p,'ella',0);await p.screenshot({path:`${out}/${width}-${height}${reduced?'-quiet':''}.png`});
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
  report.configs.push(config);await c.close();
 }
 // Both failure paths must retain a complete poster and readable content.
 for(const condition of ['blocked-video','save-data']){
  const c=await browser.newContext({viewport:{width:390,height:844}});
  await c.addInitScript(()=>{Element.prototype.requestPointerLock=()=>Promise.resolve();Element.prototype.setPointerCapture=()=>{};Element.prototype.releasePointerCapture=()=>{};});
  if(condition==='blocked-video')await c.route('**/assets/paisajes/*.mp4',r=>r.abort());
  else await c.addInitScript(()=>Object.defineProperty(navigator,'connection',{value:{saveData:true,addEventListener(){}}}));
  const p=await c.newPage();await p.goto(url,{waitUntil:'domcontentloaded'});await p.waitForSelector('html.sc-ready');await p.waitForFunction(()=>document.querySelector('.paisaje--paris img').naturalWidth>0);await p.waitForTimeout(1000);
  assert.equal(await p.locator('[data-film].is-decoded').count(),0);assert.equal(await p.locator('h1').isVisible(),true);
  if(condition==='save-data')assert.equal(await p.locator('[data-film][src]').count(),0);
  await p.screenshot({path:`${out}/${condition}.png`});await c.close();
 }
 report.fallbacks=['Blocked video retains poster','Data saver downloads no video'];
 fs.writeFileSync(out+'/checks.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}catch(e){fs.writeFileSync(out+'/failure.json',JSON.stringify({report,error:e.stack},null,2));throw e;}finally{await browser.close();}
