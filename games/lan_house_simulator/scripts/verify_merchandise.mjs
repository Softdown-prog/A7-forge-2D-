import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {selectAdminArea,selectTask} from './management_navigation.mjs';
import {createGame,stepGame} from '../dist/js/sim/engine.js';
import {orderMerchandise,merchandiseStock} from '../dist/js/sim/merchandise.js';
import {GAME_SAVE_KEY,DAY_MINUTES} from '../dist/js/sim/types.js';
const output=resolve(process.argv[2]??'out/merchandise');await mkdir(output,{recursive:true});
const server=spawn(process.execPath,[resolve(import.meta.dirname,'serve.mjs')],{stdio:['ignore','pipe','inherit']});let browser;
const reports=[];
try{
 await new Promise((ok,fail)=>{server.stdout.once('data',ok);server.once('error',fail);});
 browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.LHS_CHROMIUM?{executablePath:process.env.LHS_CHROMIUM}:{})});
 for(const width of [1280,414,360]){
  const mobile=width<700,context=await browser.newContext({viewport:{width,height:844},isMobile:mobile,hasTouch:mobile});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  const state=createGame(1933,'historical');state.cash=2000;
  state.totalMinutes=(2000-1998)*360*DAY_MINUTES; // Advanced catalog unlock year.
  await page.addInitScript(({key,state})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(state));localStorage.setItem('lhs.sound','off');},{key:GAME_SAVE_KEY,state});
  await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
  if(await page.locator('#privacy-banner').isVisible())await page.locator('#privacy-reject').click();
  await page.locator('#menu-continue').click();await page.locator('#open-admin').click();await selectAdminArea(page,'stock');
  await selectTask(page,'stock','catalog');
  assert.equal(await page.locator('#section-stock [data-panel-choice="catalog"]').isEnabled(),true);
  assert.match(await page.locator('#section-stock [data-panel-choice="catalog"]').innerText(),/🔓 Mercadorias/);
  await page.locator('#merchandise-product').selectOption('water');
  await page.locator('#merchandise-supplier').selectOption('economy');assert.equal(await page.locator('#merchandise-packs').inputValue(),'3');
  await page.locator('#merchandise-order').click();assert.match(await page.locator('#merchandise-feedback').innerText(),/Entrega em 1 dia/);
  await selectTask(page,'stock','orders');assert.match(await page.locator('#merchandise-orders').innerText(),/36 un/);
  await selectTask(page,'stock','suppliers');await page.locator('#supplier-up').click();assert.equal(await page.locator('#supplier-up').isDisabled(),true);
  await selectTask(page,'stock','catalog');await page.locator('#merchandise-category').selectOption('candy');await page.locator('#merchandise-product').selectOption('pacoca');
  await page.locator('#merchandise-supplier').selectOption('partner');await page.locator('#merchandise-order').click();
  await page.locator('#merchandise-price').fill('0.90');
  const retained=await page.locator('#merchandise-price').evaluate(el=>{window.retainedPrice=el;return true;});assert.ok(retained);
  await page.waitForTimeout(1200);assert.equal(await page.locator('#merchandise-price').inputValue(),'0.90');
  assert.equal(await page.evaluate(()=>window.retainedPrice===document.querySelector('#merchandise-price')),true);
  await page.locator('#merchandise-price-form button').click();assert.match(await page.locator('#merchandise-feedback').innerText(),/0.90/);
  for(const task of ['catalog','suppliers','orders']){
   await selectTask(page,'stock',task);
   assert.equal(await page.locator('#section-stock > .management-page:visible').count(),1);
   const overflow=await page.locator('#admin').evaluate(el=>el.scrollWidth-el.clientWidth);assert.ok(overflow<=3,`${width}/${task} overflow ${overflow}`);
   await page.locator('#admin').evaluate(el=>el.scrollTop=el.scrollHeight);
   await page.waitForTimeout(250);await page.locator('#admin').evaluate(el=>el.scrollTop=0);
   await page.waitForTimeout(600);assert.ok(await page.locator('#admin').evaluate(el=>el.scrollTop)<=3,'no forced live scroll');
  }
  await selectTask(page,'stock','catalog');await page.waitForTimeout(250);await page.screenshot({path:resolve(output,`merchandise_${width}.png`)});
  await page.reload({waitUntil:'networkidle'});await page.locator('#menu-continue').click();await page.locator('#open-admin').click();await selectAdminArea(page,'stock');await selectTask(page,'stock','catalog');
  await page.locator('#merchandise-category').selectOption('candy');await page.locator('#merchandise-product').selectOption('pacoca');
  assert.equal(await page.locator('#merchandise-price').inputValue(),'0.90');assert.match(await page.locator('#merchandise-detail').innerText(),/24 un/);
  await selectTask(page,'stock','orders');assert.match(await page.locator('#merchandise-orders').innerText(),/36 un/);
  assert.deepEqual(errors,[]);reports.push({width,orders:true,partner:true,price:true,reload:true,overflow:false,stableFocus:true,errors});await context.close();
 }
 // In 1998–1999, the catalog is visible but not usable. Basic inventory
 // continues to be managed in the supplier section; no save migration.
 for(const width of [1280,414,360])for(const year of [1998,1999]){
  const mobile=width<700,context=await browser.newContext({viewport:{width,height:844},isMobile:mobile,hasTouch:mobile});
  const state=createGame(2349,'historical');state.totalMinutes=(year-1998)*360*DAY_MINUTES;state.cash=2000;
  await context.addInitScript(({key,state})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(state));},{key:GAME_SAVE_KEY,state});
  const page=await context.newPage();
  await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
  if(await page.locator('#privacy-banner').isVisible()){
   const reject=page.locator('#privacy-reject');if(mobile)await reject.tap();else await reject.click();
  }
  if(mobile)await page.locator('#menu-continue').tap();else await page.locator('#menu-continue').click();
  if(mobile)await page.locator('#open-admin').tap();else await page.locator('#open-admin').click();
  await selectAdminArea(page,'stock');
  const locked=page.locator('#section-stock [data-panel-choice="catalog"]');
  assert.equal(await locked.isVisible(),true);
  assert.equal(await locked.isDisabled(),true);
  assert.match(await locked.innerText(),/🔒 Mercadorias.*2000/);
  assert.equal(await page.locator('#page-stock-catalog').isVisible(),false);
  assert.equal(await page.locator('#page-stock-suppliers').isVisible(),true);
  assert.match(await page.locator('#stock-catalog-unlock-note').innerText(),/2000/);
  assert.equal(await page.locator('#stock-soda').isEnabled(),true);
  assert.equal(await page.locator('#stock-candy').isEnabled(),true);
  assert.equal(await page.locator('#stock-snacks').isEnabled(),true);
  // Botões básicos continuam acessíveis no painel Fornecedores.
  // A disabled page must not be accessible through programmatic navigation.
  assert.equal(await page.locator('#section-stock > .management-page:visible').count(),1);
  reports.push({width,year,locked:true,basicStockAccessible:true});
  await context.close();
 }
 // Save produced by the ordinary simulation, shortly before a real visitor finishes a PC session.
 const state=createGame(1933,'historical');state.cash=2000;state.inventory={soda:0,candy:0,snacks:0};
 orderMerchandise(state,'water','basic',3);orderMerchandise(state,'chocolate','quality',2);
 let target;
 for(let i=0;i<600;i++){
  stepGame(state,1);
  target=state.customers.find(c=>c.stage==='using'&&c.usedMinutes>=(c.sessionMinutes??45)-4&&c.needs.thirst>=55);
  if(target)break;
 }
 assert.ok(target,'ordinary simulation produces a shopper');
 const context=await browser.newContext({viewport:{width:1280,height:900}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.addInitScript(({key,state})=>{localStorage.setItem(key,JSON.stringify(state));localStorage.setItem('lhs.sound','off');},{key:GAME_SAVE_KEY,state});
 await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
 if(await page.locator('#privacy-banner').isVisible())await page.locator('#privacy-reject').click();
 await page.evaluate(async id=>{
  const {SceneRenderer}=await import('./js/render/scene.js'),draw=SceneRenderer.prototype.draw;
  window.retailTrace=[];
  SceneRenderer.prototype.draw=function(s,...args){
   const c=s.customers.find(c=>c.id===id);window.retailTrace.push({minute:s.totalMinutes,stage:c?.stage,product:c?.desiredProduct,consuming:c?.retailConsumption?.product,purchases:s.purchases,water:s.merchandise?.products.water?.stock,chocolate:s.merchandise?.products.chocolate?.stock});
   return draw.call(this,s,...args);
  };
 },target.id);
 await page.locator('#menu-continue').click();
 const canvas=page.locator('#game');await canvas.scrollIntoViewIfNeeded();
 const frames=resolve(output,'frames');await mkdir(frames,{recursive:true});
 for(let i=0;i<100;i++){
  await canvas.screenshot({path:resolve(frames,`frame-${String(i).padStart(4,'0')}.png`)});
  await page.waitForTimeout(120);
 }
 const trace=await page.evaluate(()=>window.retailTrace);
 assert.ok(trace.some(t=>t.product==='water'&&t.stage==='shopping'));
 assert.ok(trace.some(t=>t.consuming==='water'));
 assert.ok(trace.some(t=>t.water<merchandiseStock(state,'water')));
 assert.deepEqual(errors,[]);
 await writeFile(resolve(output,'gameplay-trace.json'),JSON.stringify({customer:target.id,initialMinute:state.totalMinutes,trace},null,2));
 await context.close();
 await writeFile(resolve(output,'validation.json'),JSON.stringify({reports,realCustomer:target.id,consumedWater:true},null,2));
 console.log(JSON.stringify({reports,realCustomer:target.id,consumedWater:true}));
}finally{await browser?.close();server.kill();}
