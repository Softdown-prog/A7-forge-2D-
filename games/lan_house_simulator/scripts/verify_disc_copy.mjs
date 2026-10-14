// Actual purchase/pricing controls plus exact scene-pixel comparison: no machine on the map.
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {createGame} from '../dist/js/sim/engine.js';
import {GAME_SAVE_KEY,DAY_MINUTES} from '../dist/js/sim/types.js';
const output=resolve(process.argv[2]??'out/disc-copy');await mkdir(output,{recursive:true});
const server=spawn(process.execPath,[resolve(import.meta.dirname,'serve.mjs')],{stdio:['ignore','pipe','inherit']});let browser;
try{
 await new Promise((ok,fail)=>{server.stdout.once('data',ok);server.once('error',fail);server.once('exit',code=>fail(Error('Server: '+code)));});
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});const checks=[],errors=[];
 for(const width of [1440,414,360])for(const year of [2000,2001]){
  const s=createGame(23,'historical');s.totalMinutes=(year-1998)*360*DAY_MINUTES;s.cash=10000;
  const context=await browser.newContext({viewport:{width,height:950},isMobile:width<700,hasTouch:width<700});
  await context.addInitScript(({key,state})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(state));localStorage.setItem('lhs.sound','off');},{key:GAME_SAVE_KEY,state:s});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
  const click=async selector=>{const node=page.locator(selector);if(width<700)await node.tap();else await node.click();};
  await click('#menu-continue');await click('#open-shop');const buy=page.locator('[data-buy="disc-copier"]');
  assert.equal(await buy.isDisabled(),year<2001);assert.equal(await page.locator('.shop-art[data-item="disc-copier"] canvas').count(),1);
  if(year===2000){assert.match(await buy.textContent(),/2001/);await click('#close-shop');await click('#open-admin');assert.equal(await page.locator('#disc-copy-panel').isHidden(),true);}
  else{
   await click('[data-buy="disc-copier"]');assert.equal(await buy.isDisabled(),true);
   const bought=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),GAME_SAVE_KEY);assert.ok(bought.discCopier);assert.equal(bought.expenses,900);assert.equal(bought.discCopier.prices.cd,3);assert.equal(bought.discCopier.prices.dvd,6);
   await page.locator('.shop-art[data-item="disc-copier"] canvas').screenshot({path:resolve(output,'copier_'+width+'.png')});
   await click('#close-shop');await click('#open-admin');await click('[data-admin-tab="prices"]');assert.equal(await page.locator('#disc-copy-panel').isVisible(),true);
   await click('[data-disc-kind="cd"][data-delta="1"]');await click('[data-disc-kind="dvd"][data-delta="-1"]');
   const changed=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),GAME_SAVE_KEY);assert.deepEqual(changed.discCopier.prices,{cd:4,dvd:5});
   await page.locator('[data-disc-kind="cd"][data-delta="1"]').focus();await page.waitForTimeout(650);
   assert.equal(await page.evaluate(()=>document.activeElement?.dataset.discKind),'cd');
   await page.locator('#disc-copy-panel').screenshot({path:resolve(output,'service_'+width+'.png')});
   const bounds=await page.evaluate(()=>({width:innerWidth,page:document.documentElement.scrollWidth,admin:document.querySelector('#admin').scrollWidth,client:document.querySelector('#admin').clientWidth}));
   assert.ok(bounds.page<=bounds.width+3&&bounds.admin<=bounds.client+3,JSON.stringify(bounds));
   await page.reload({waitUntil:'networkidle'});await click('#menu-continue');await click('#open-admin');await click('[data-admin-tab="prices"]');assert.match(await page.locator('#disc-copy-price-controls').textContent(),/4,00/);
  }
  checks.push({width,year,locked:year<2001});await context.close();
 }
 const page=await browser.newPage();await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
 const unchanged=await page.evaluate(async()=>{
  const [{createGame},{SceneRenderer},{buyDiscCopier}]=await Promise.all([import('./js/sim/engine.js'),import('./js/render/scene.js'),import('./js/sim/discCopy.js')]);
  const s=createGame();s.totalMinutes=3*360*720;s.cash=10000;
  const draw=()=>{const c=document.createElement('canvas');c.width=1000;c.height=610;new SceneRenderer(c.getContext('2d')).draw(s,0);return c.getContext('2d').getImageData(0,0,c.width,c.height).data;};
  const before=draw();if(!buyDiscCopier(s).ok)throw Error('Compra falhou');const after=draw();return before.every((v,i)=>v===after[i]);
 });assert.equal(unchanged,true);assert.deepEqual(errors,[]);await writeFile(resolve(output,'validation.json'),JSON.stringify({checks,scenePixelsUnchanged:unchanged,errors},null,2));console.log(JSON.stringify({checks,scenePixelsUnchanged:unchanged,errors}));
}finally{await browser?.close();server.kill();}
