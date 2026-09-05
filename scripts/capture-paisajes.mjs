import fs from 'node:fs';
import {chromium} from 'playwright-core';
const out=process.env.PAISAJES_OUT||'lab/paisajes-draft';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 for(const [width,height] of [[1440,1000],[390,844],[360,640]]){
  const c=await browser.newContext({viewport:{width,height},isMobile:width<640,hasTouch:width<640});
  await c.addInitScript(()=>{Element.prototype.requestPointerLock=()=>Promise.resolve();Element.prototype.setPointerCapture=()=>{};Element.prototype.releasePointerCapture=()=>{};});
  const p=await c.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.goto(process.env.PAISAJES_URL||'http://localhost:4520/',{waitUntil:'domcontentloaded'});
  await p.waitForSelector('html.sc-ready');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(1400);
  for(const [id,progress] of [['ella',0],['ella',.65],['vida',.25],['album',.2],['muro',.1],['cocina',.2],['cocina',.8],['cierre',.05],['final',.8]]){
   await p.evaluate(({id,progress})=>{let e=document.getElementById(id);scrollTo({top:e.getBoundingClientRect().top+scrollY+Math.max(0,e.offsetHeight-innerHeight)*progress,behavior:'instant'});},{id,progress});
   await p.waitForTimeout(1000);
   await p.screenshot({path:`${out}/${width}-${id}-${progress}.png`});
  }
  console.log(JSON.stringify({width,errors,overflow:await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),films:await p.locator('[data-film]').evaluateAll(vs=>vs.map(v=>({name:v.dataset.film,time:v.currentTime,ready:v.readyState})))}));
  await c.close();
 }
}finally{await browser.close();}
