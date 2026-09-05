import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright-core';
const out='lab/atmosfera'; fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const results=[];
const intersects=(a,b)=>a&&b&&Math.min(a.x+a.width,b.x+b.width)>Math.max(a.x,b.x)&&Math.min(a.y+a.height,b.y+b.height)>Math.max(a.y,b.y);
async function jump(page,id,p=.25) {
 await page.evaluate(({id,p})=>{const el=document.getElementById(id);scrollTo({top:scrollY+el.getBoundingClientRect().top+Math.max(0,el.offsetHeight-innerHeight)*p,behavior:'instant'});},{id,p});
 await page.waitForTimeout(550);
}
try {
 for (const [width,height,reduced] of [[1440,1000,false],[768,1024,false],[390,844,false],[360,640,false],[1440,1000,true]]) {
  const name=`${width}-${height}${reduced?'-quiet':''}`;
  const context=await browser.newContext({viewport:{width,height},hasTouch:width<=640,isMobile:width<=640,reducedMotion:reduced?'reduce':'no-preference'});
  await context.addInitScript(()=>{Element.prototype.requestPointerLock=()=>Promise.resolve();Element.prototype.setPointerCapture=()=>{};Element.prototype.releasePointerCapture=()=>{};});
  const page=await context.newPage(), errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.PAISAJES_URL||'http://localhost:4517/',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForSelector('html.sc-ready'); await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.evaluate(async()=>{const faces=await document.fonts.load('500 24px "Bodoni Moda"');return faces.length>0&&faces.every(f=>f.status==='loaded');}),true,'Original display font loaded');
  await page.waitForFunction(()=>document.querySelector('.ella__plate img').naturalWidth>0);
  await page.screenshot({path:`${out}/${name}-hero.png`});
  // Measure small copy against the actual paper/light composite, without text.
  const copy=await page.evaluate(()=>Array.from(document.querySelectorAll('#ella .eyebrow,#ella .ella__formal,#ella .ella__alias,#ella .ella__dl dd,#ella .ella__note,#ella .ella__open,#ella .velas__n b,#ella #velita')).map(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return {x:r.x,y:r.y,w:r.width,h:r.height,color:s.color,large:parseFloat(s.fontSize)>=24};}).filter(r=>r.y>=0&&r.y+r.h<=innerHeight));
  const hide=await page.addStyleTag({content:'body * {color:transparent!important;text-shadow:none!important}'});
  const backdrop=await page.screenshot(); await hide.evaluate(e=>e.remove());
  const contrast=await page.evaluate(async ({copy,png})=>{
   const im=new Image();im.src='data:image/png;base64,'+png;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const ctx=c.getContext('2d');ctx.drawImage(im,0,0);const a=ctx.getImageData(0,0,c.width,c.height).data;
   const luminance=rgb=>rgb.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
   return copy.map(r=>{const fg=luminance(r.color.match(/[\d.]+/g).slice(0,3).map(Number));let min=100;for(let y=Math.ceil(r.y+2);y<Math.min(c.height,r.y+r.h-2);y+=3)for(let x=Math.ceil(r.x+2);x<Math.min(c.width,r.x+r.w-2);x+=3){const i=(y*c.width+x)*4,bg=luminance([a[i],a[i+1],a[i+2]]);min=Math.min(min,(Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05));}return {ratio:+min.toFixed(2),minimum:r.large?3:4.5};});
  },{copy,png:backdrop.toString('base64')});
  assert.ok(contrast.every(c=>c.ratio>=c.minimum),`${name}: paper contrast ${JSON.stringify(contrast)}`);
  assert.equal(await page.locator('.ella__print figcaption,#alb-cap,.pag__ced,#lb-t,#lb-p').count(),0);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  const photo=await page.locator('.ella__plate img').boundingBox();
  for(const selector of ['.ella__name','.ella__alias','.ella__dl','.ella__note','.ella__open','.velas']) {
   assert.equal(intersects(photo,await page.locator('#ella '+selector).boundingBox()),false,`${name}: hero overlap ${selector}`);
  }
  const bounds=await page.evaluate(()=>({main:getComputedStyle(document.querySelector('main')).zIndex,ground:getComputedStyle(document.querySelector('.atmosfera')).zIndex,pointer:getComputedStyle(document.querySelector('.atmosfera')).pointerEvents}));
  assert.ok(Number(bounds.main)>Number(bounds.ground)); assert.equal(bounds.pointer,'none');
  if(!reduced&&width>1080) {
   const before=await page.locator('.atmosfera__papel').evaluate(e=>getComputedStyle(e).transform);
   await page.mouse.move(510,140); await page.mouse.move(950,140,{steps:22}); await page.waitForTimeout(100);
   const painted=await page.locator('canvas').evaluate(c=>{const a=c.getContext('2d').getImageData(0,0,c.width,c.height).data;return a.some((v,i)=>i%4===3&&v>0);});
   assert.equal(painted,true,'Pointer seeds paint in paper margin');
   await page.screenshot({path:`${out}/${name}-pointer.png`});
   await jump(page,'vida');
   assert.notEqual(await page.locator('.atmosfera__papel').evaluate(e=>getComputedStyle(e).transform),before);
   await page.waitForTimeout(2000);
   assert.equal(await page.locator('canvas').evaluate(c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((v,i)=>i%4===3&&v>0)),false,'Pointer rests without idle animation');
  }
  for(const id of ['vida','album','cancion','muro','cocina','cierre','final']) {
   await jump(page,id);
   await page.screenshot({path:`${out}/${name}-${id}.png`});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${name}: ${id} overflow`);
  }
  await jump(page,'album',.12);
  await page.locator('#alb-frame').focus(); await page.keyboard.press('Enter');
  await page.waitForSelector('#lb[open]'); await page.waitForTimeout(500);
  const image=await page.locator('#lb>img').boundingBox();
  assert.ok(image,`${name}: viewer image`);
  for(const control of ['.lb__x','.lb__mando']) assert.equal(intersects(image,await page.locator(control).boundingBox()),false,`${name}: ${control} covers photo`);
  await page.screenshot({path:`${out}/${name}-viewer.png`});
  await page.keyboard.press('Escape');
  await page.locator('[data-modo="libro"]').click(); await jump(page,'album',.1);
  assert.equal(await page.locator('.pag__ced').count(),0);
  await page.screenshot({path:`${out}/${name}-book.png`});
  if(reduced) {
   assert.equal(await page.locator('.atmosfera__papel').evaluate(e=>getComputedStyle(e).transform),'none');
   assert.equal(await page.locator('canvas').evaluate(e=>getComputedStyle(e).display),'none');
  }
  assert.deepEqual(errors,[],`${name}: runtime errors`);
  results.push({viewport:name,passed:true,contrast}); await context.close();
 }
 fs.writeFileSync(`${out}/checks.json`,JSON.stringify(results,null,2)); console.log(JSON.stringify(results));
} finally {await browser.close();}
