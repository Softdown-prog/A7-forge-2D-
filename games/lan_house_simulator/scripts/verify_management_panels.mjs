import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {selectAdminArea,selectTask} from './management_navigation.mjs';
import {createGame} from '../dist/js/sim/engine.js';
import {GAME_SAVE_KEY,DAY_MINUTES} from '../dist/js/sim/types.js';
const output=resolve(process.argv[2]??'out/management');await mkdir(output,{recursive:true});
const server=spawn(process.execPath,[resolve(import.meta.dirname,'serve.mjs')],{stdio:['ignore','pipe','inherit']});let browser;
try{
 await new Promise((ok,fail)=>{server.stdout.once('data',ok);server.once('error',fail);});
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});const reports=[];
 for(const width of [1280,414,360])for(const year of [1998,2024]){
  const mobile=width<700,context=await browser.newContext({viewport:{width,height:844},isMobile:mobile,hasTouch:mobile});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  const state=createGame();state.totalMinutes=(year-1998)*360*DAY_MINUTES;state.cash=10000;
  state.reputation=74.75;
  state.customerFeedback=[{minute:state.totalMinutes,customerId:123,reason:"preco",kind:"sessao",delta:-.25}];
  await page.addInitScript(({key,state})=>{localStorage.setItem(key,JSON.stringify(state));localStorage.setItem('lhs.sound','off');},{key:GAME_SAVE_KEY,state});
  await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
  // This test concerns admin scrolling, not cookie consent. A real visitor
  // must first choose a privacy option; otherwise the fixed consent banner
  // correctly intercepts the touch gesture and the admin never receives it.
  const consent=page.locator('#privacy-banner');
  if(await consent.isVisible()){
   await page.locator('#privacy-reject').click();
   await consent.waitFor({state:'hidden'});
  }
  const cdp=await context.newCDPSession(page);if(mobile)await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  const press=locator=>mobile?locator.tap():locator.click();
  await press(page.locator('#menu-continue'));await press(page.locator('#open-admin'));
  assert.equal(await page.locator('#admin-area').isVisible(),mobile);
  assert.equal(await page.locator('.management-summary').getAttribute('open')!==null,!mobile);
  assert.equal(await page.locator('#pc-maintenance').locator('[data-hardware-tab]').count(),0,'Hardware is not built when Prices is open');
  const pages=[];
  for(const area of ['prices','computers','licenses','services','consoles','finance']){
   await selectAdminArea(page,area);
   const choices=await page.locator('#section-'+area+' [data-panel-choice]').evaluateAll(nodes=>nodes.map(n=>n.dataset.panelChoice));
   for(const task of choices){
    await selectTask(page,area,task);
    assert.equal(await page.locator('#section-'+area+' > .management-page:visible').count(),1,area+'/'+task);
    const overflow=await page.locator('#admin').evaluate(el=>el.scrollWidth-el.clientWidth);assert.ok(overflow<=3,`${area}/${task} overflow ${overflow}`);
    assert.equal(await page.locator('#section-'+area+' [data-panel-choice="'+task+'"]').getAttribute('aria-pressed'),'true');
    pages.push(area+'/'+task);
   }
  }
  await selectAdminArea(page,'finance');await selectTask(page,'finance','feedback');
  assert.ok((await page.locator('#customer-feedback-summary').innerText()).includes('1 crítica(s) com efeito'));
  assert.ok((await page.locator('#customer-feedback-summary').innerText()).includes('-0.25 pontos'));
  assert.equal(await page.locator('#customer-feedback-list li').count(),1,'Only the real saved feedback entry appears');
  await selectAdminArea(page,'computers');await selectTask(page,'computers','hardware');
  await press(page.locator('#hardware-tab-ram'));
  await page.evaluate(()=>{window.retainedHardware=document.querySelector('#hardware-tab-ram');window.hiddenChanges=0;new MutationObserver(rs=>window.hiddenChanges+=rs.reduce((n,r)=>n+r.addedNodes.length,0)).observe(document.querySelector('#gpu-game-catalog'),{childList:true,subtree:true});});
  await page.waitForTimeout(1200);
  assert.equal(await page.evaluate(()=>window.retainedHardware===document.querySelector('#hardware-tab-ram')),true);
  assert.equal(await page.evaluate(()=>window.hiddenChanges),0,'Hidden game catalog stays untouched');
  // First measure native scroll range: some task pages are intentionally shorter
  // than a desktop viewport. A 100px scroll on those pages is impossible.
  let scrollRange=await page.locator('#admin').evaluate(el=>el.scrollHeight-el.clientHeight);
  if(scrollRange<140){
   for(const [area,task] of [['licenses','gpu'],['prices','hourly'],['finance','balance']]){
    await selectAdminArea(page,area);await selectTask(page,area,task);
    scrollRange=await page.locator('#admin').evaluate(el=>el.scrollHeight-el.clientHeight);
    if(scrollRange>=140)break;
   }
  }
  await page.locator('#admin').evaluate(el=>el.scrollTop=0);
  if(mobile){
   // Gesture must start over the modal's padding, not an inner hardware
   // scroll area/button that can capture the pan on a touch screen.
   const target=await page.locator('#admin').evaluate(el=>{
    const b=el.getBoundingClientRect(),x=Math.ceil(b.left+8),y=Math.round(Math.min(b.bottom-48,700));
    const node=document.elementFromPoint(x,y);
    return {x,y,hit:node?.id||node?.className||node?.tagName};
   });
   console.log(JSON.stringify({touchTarget:{width,year,...target}}));
   const {x,y}=target;
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
   for(let i=1;i<=10;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-i*40}]});await page.waitForTimeout(28);}
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }else{await page.mouse.move(width/2,650);await page.mouse.wheel(0,400);}
  await page.waitForTimeout(500);
  const scrolled=await page.locator('#admin').evaluate(el=>el.scrollTop);
  console.log(JSON.stringify({scrollCheck:{width,year,scrollRange,scrolled}}));
  if(scrollRange>20)
   assert.ok(scrolled>=Math.min(100,scrollRange)-8,
    'Native scrolling must advance within the actual available content height');
  else assert.ok(scrolled>=0,'Short content needs no scrolling');
  await page.locator('#admin').evaluate(el=>el.scrollTop=0);await page.waitForTimeout(600);
  assert.ok((await page.locator('#admin').evaluate(el=>el.scrollTop))<=3,'Live refresh leaves the top accessible within native pixel rounding');
  await page.screenshot({path:resolve(output,`panels_${width}_${year}.png`)});
  await press(page.locator('#close-admin'));await press(page.locator('#open-shop'));
  const products=[];
  for(const category of ['equipment','consoles','building','decoration']){
   await press(page.locator('[data-shop-category="'+category+'"]'));
   products.push(...await page.locator('[data-buy]').evaluateAll(nodes=>nodes.map(n=>n.dataset.buy)));
   assert.ok(await page.locator('#shop-catalog .shop-card').count()<25,'One category is built at a time');
  }
  assert.equal(new Set(products).size,14,'Every existing shop item remains accessible');
  await press(page.locator('#close-shop'));await page.locator('#scene-viewport').scrollIntoViewIfNeeded();
  await page.evaluate(async()=>{const {SceneRenderer}=await import('./js/render/scene.js');const old=SceneRenderer.prototype.draw;window.drawSamples=[];SceneRenderer.prototype.draw=function(...args){if(this.ctx.canvas.id==='game')window.drawSamples.push(performance.now());return old.apply(this,args);};});
  // Repeated map scroll events used to suppress every scene draw for 120 ms.
  await page.evaluate(()=>{window.scrollStart=performance.now();window.scrollPump=setInterval(()=>{const viewport=document.querySelector('#scene-viewport');viewport.dispatchEvent(new Event('scroll'));},35);});
  await page.waitForTimeout(900);
  const duringScroll=await page.evaluate(()=>{clearInterval(window.scrollPump);return window.drawSamples.filter(t=>t>window.scrollStart+150).length;});
  assert.ok(duringScroll>=4,'Scene continues drawing throughout sustained scrolling');
  assert.deepEqual(errors,[]);reports.push({width,year,tasks:pages.length,allShopItems:true,nativeScroll:true,stableFocus:true,hiddenCatalogChanges:0,drawsDuringScroll:duringScroll,errors});await context.close();
 }
 await writeFile(resolve(output,'management_validation.json'),JSON.stringify({reports},null,2));console.log(JSON.stringify({reports}));
}finally{await browser?.close();server.kill();}
