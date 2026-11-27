import {selectAdminArea,selectTask} from './management_navigation.mjs';
// Real game regression: stable controls, native touch scrolling and approved audio.
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {createGame} from '../dist/js/sim/engine.js';
import {purchaseApproach} from '../dist/js/sim/layout.js';
async function dragTouch(page,cdp,{x,y},dx,dy){
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
 for(let i=1;i<=12;i++){
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',
   touchPoints:[{x:x+dx*i/12,y:y+dy*i/12}]});
  await page.waitForTimeout(16);
 }
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
}

async function verifyTabScrolling(page,cdp){
 const tabs=page.locator('#angular-admin-area-navigation .angular-admin-tabs');
 await tabs.scrollIntoViewIfNeeded();
 const initial=await tabs.evaluate(el=>{
  el.scrollLeft=0;
  const {right,top,height,width}=el.getBoundingClientRect();
  const x=Math.round(right-24),y=Math.round(top+height/2);
  return {x,y,width,top:el.closest('#admin').scrollTop,
   hit:el.contains(document.elementFromPoint(x,y))};
 });
 assert.ok(initial.hit&&initial.y>=80,'O gesto deve começar sobre a faixa visível de abas');
 await dragTouch(page,cdp,initial,-Math.min(180,initial.width-45),0);
 await page.waitForFunction(()=>document.querySelector('.angular-admin-tabs').scrollLeft>20);
 assert.ok(Math.abs(await page.locator('#admin').evaluate(el=>el.scrollTop)-initial.top)<=3,
  'O gesto horizontal muda somente a faixa de abas');

 await dragTouch(page,cdp,initial,0,-Math.min(145,initial.y-30));
 await page.waitForFunction(top=>document.getElementById('admin').scrollTop>top+20,initial.top,
  {timeout:3500});
 return true;
}

async function verifyPageScrolling(page,cdp){
 const initial=await page.evaluate(()=>{
  window.scrollTo({top:0,behavior:'instant'});
  const root=document.scrollingElement;
  const {overscrollBehaviorX,overscrollBehaviorY}=getComputedStyle(root);
  return {overscrollBehaviorX,overscrollBehaviorY,timeOrigin:performance.timeOrigin,
   scrollable:root.scrollHeight-root.clientHeight};
 });
 assert.equal(initial.overscrollBehaviorY,'contain','O documento do jogo bloqueia a atualização por gesto no topo');
 assert.equal(initial.overscrollBehaviorX,'auto','A contenção vale somente no eixo vertical');
 assert.ok(initial.scrollable>120,'A partida deve ter espaço para rolagem vertical');

 // A margem do jogo pertence à página e fica fora do Canvas e das faixas de abas.
 await dragTouch(page,cdp,{x:8,y:90},0,150);
 assert.equal(await page.evaluate(()=>scrollY),0);
 await dragTouch(page,cdp,{x:8,y:240},0,-150);
 await page.waitForFunction(()=>scrollY>20);
 assert.equal(await page.evaluate(()=>performance.timeOrigin),initial.timeOrigin);
 assert.equal(await page.locator('#game-app').isVisible(),true);
 return true;
}

const output=resolve(process.argv[2]??'out/mobile-interface');await mkdir(output,{recursive:true});
const server=spawn(process.execPath,[resolve(import.meta.dirname,'serve.mjs')],{stdio:['ignore','pipe','inherit']});let browser;
try{
 await new Promise((ok,fail)=>{server.stdout.once('data',ok);server.once('error',fail);server.once('exit',code=>fail(Error('Server stopped: '+code)));});
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});const reports=[];
 for(const width of [1280,414,360]){
  const mobile=width<700,context=await browser.newContext({viewport:{width,height:920},isMobile:mobile,hasTouch:mobile}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));const press=loc=>mobile?loc.tap():loc.click();
  const cdp=await context.newCDPSession(page);if(mobile)await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
  // O aviso pode cobrir a região inferior da tela e interceptar o gesto.
  const privacy=page.locator('#privacy-banner');
  if(await privacy.isVisible()){await press(page.locator('#privacy-reject'));await privacy.waitFor({state:'hidden'});}
  await press(page.locator('#menu-new'));await press(page.locator('#open-admin'));await selectAdminArea(page,'computers');await selectTask(page,'computers','hardware');
  await page.evaluate(async()=>{
   const {SceneRenderer}=await import('./js/render/scene.js');const old=SceneRenderer.prototype.draw;
   window.report={hiddenDraws:0,added:0,longTasks:[]};SceneRenderer.prototype.draw=function(...args){if(this.ctx.canvas.id==='menu-scene')window.report.hiddenDraws++;return old.apply(this,args);};
   new MutationObserver(rs=>{for(const r of rs)window.report.added+=r.addedNodes.length;}).observe(document.querySelector('#admin'),{childList:true,subtree:true});
   new PerformanceObserver(rs=>window.report.longTasks.push(...rs.getEntries().map(e=>e.duration))).observe({type:'longtask'});
   window.control=document.querySelector('#hardware-tab-ram');
  });
  await page.waitForTimeout(1100);
  const stable=await page.evaluate(()=>window.control===document.querySelector('#hardware-tab-ram'));assert.equal(stable,true,'Idle refresh must preserve the touched control');
  const admin=page.locator('#admin');
  const initial=await admin.evaluate(el=>{
   el.style.scrollBehavior='auto';el.scrollTop=0;
   return {top:el.scrollTop,scrollHeight:el.scrollHeight,clientHeight:el.clientHeight};
  });
  assert.ok(initial.scrollHeight-initial.clientHeight>100,
   'O painel deve oferecer 100px de rolagem nativa: '+JSON.stringify({width,initial}));
  const tabsScrollBothAxes=mobile?await verifyTabScrolling(page,cdp):null;
  if(!mobile)await admin.evaluate(el=>el.scrollTop+=360);
  const after=await admin.evaluate(el=>el.scrollTop);
  assert.ok(after>initial.top+20,'A rolagem deve avançar: '+JSON.stringify({width,initial,after}));
  await press(page.locator('#hardware-tab-ram'));assert.equal(await page.locator('[data-hardware-catalog]').getAttribute('data-hardware-catalog'),'ram');
  await press(page.locator('#hardware-tab-storage'));assert.equal(await page.locator('[data-hardware-catalog]').getAttribute('data-hardware-catalog'),'storage');
  await press(page.locator('#close-admin'));
  const pageScrollPreserved=mobile?await verifyPageScrolling(page,cdp):null;
  await page.locator('#events').scrollIntoViewIfNeeded();await page.waitForTimeout(400);
  const report=await page.evaluate(()=>({...window.report,scrollY,overflow:document.documentElement.scrollWidth-innerWidth}));assert.equal(report.hiddenDraws,0);assert.ok(report.overflow<=3);
  assert.deepEqual(errors,[]);reports.push({width,cpuSlowdown:mobile?4:1,buttonPreserved:stable,panelScrolled:after>initial.top,tabsScrollBothAxes,pageScrollPreserved,...report,errors});await context.close();
 }
 // Force only the QA mix roll, so decoding and playback are tested without chance.
 const context=await browser.newContext({viewport:{width:414,height:920},isMobile:true,hasTouch:true}),page=await context.newPage();const state=createGame();const goal=purchaseApproach('soda',state);
 state.customers=[{id:901,stage:'shopping',...goal,target:{...goal},route:[],costume:'regular',pcIndex:null,usedMinutes:60,waitingMinutes:0,offlineWait:0,happy:true,wallet:8,desiredItem:'soda',needs:{thirst:90,hunger:0,energy:60}}];state.nextCustomerId=902;
 await page.addInitScript(s=>localStorage.setItem('lhs-save-v1',JSON.stringify(s)),state);await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
 const privacy2=page.locator('#privacy-banner');
 if(await privacy2.isVisible()){await privacy2.locator('#privacy-reject').tap();await privacy2.waitFor({state:'hidden'});}
 await page.evaluate(async()=>{const {Soundscape}=await import('./js/audio/soundscape.js');const old=Soundscape.prototype.soda;window.audioSales=[];Soundscape.prototype.soda=function(){this.sodaRandom=()=>0;const result=old.call(this);window.audioSales.push({running:this.context?.state,decoded:this.approved.has('vending_soda_01')&&this.approved.has('vending_soda_02'),played:result});return result;};});
 await page.locator('#menu-continue').tap();await page.waitForFunction(()=>window.audioSales.length===1);
 const audio=await page.evaluate(()=>window.audioSales);assert.deepEqual(audio,[{running:'running',decoded:true,played:true}]);await page.waitForTimeout(500);assert.equal(await page.evaluate(()=>window.audioSales.length),1,'No per-frame or duplicate soda playback');await context.close();
 await writeFile(resolve(output,'interface_validation.json'),JSON.stringify({reports,audio},null,2));console.log(JSON.stringify({reports,audio}));
}finally{await browser?.close();server.kill();}
