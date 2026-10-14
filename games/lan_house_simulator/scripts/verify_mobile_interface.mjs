// Real game regression: stable controls, native touch scrolling and approved audio.
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {createGame} from '../dist/js/sim/engine.js';
import {purchaseApproach} from '../dist/js/sim/layout.js';
const output=resolve(process.argv[2]??'out/mobile-interface');await mkdir(output,{recursive:true});
const server=spawn(process.execPath,[resolve(import.meta.dirname,'serve.mjs')],{stdio:['ignore','pipe','inherit']});let browser;
try{
 await new Promise((ok,fail)=>{server.stdout.once('data',ok);server.once('error',fail);server.once('exit',code=>fail(Error('Server stopped: '+code)));});
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});const reports=[];
 for(const width of [1280,414,360]){
  const mobile=width<700,context=await browser.newContext({viewport:{width,height:920},isMobile:mobile,hasTouch:mobile}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));const press=loc=>mobile?loc.tap():loc.click();
  const cdp=await context.newCDPSession(page);if(mobile)await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});await press(page.locator('#menu-new'));await press(page.locator('#open-admin'));await press(page.locator('[data-admin-tab="computers"]'));
  await page.evaluate(async()=>{
   const {SceneRenderer}=await import('./js/render/scene.js');const old=SceneRenderer.prototype.draw;
   window.report={hiddenDraws:0,added:0,longTasks:[]};SceneRenderer.prototype.draw=function(...args){if(this.ctx.canvas.id==='menu-scene')window.report.hiddenDraws++;return old.apply(this,args);};
   new MutationObserver(rs=>{for(const r of rs)window.report.added+=r.addedNodes.length;}).observe(document.querySelector('#admin'),{childList:true,subtree:true});
   new PerformanceObserver(rs=>window.report.longTasks.push(...rs.getEntries().map(e=>e.duration))).observe({type:'longtask'});
   window.control=document.querySelector('#hardware-tab-ram');
  });
  await page.waitForTimeout(1100);
  const stable=await page.evaluate(()=>window.control===document.querySelector('#hardware-tab-ram'));assert.equal(stable,true,'Idle refresh must preserve the touched control');
  await page.locator('#admin').evaluate(el=>el.scrollTop=0);
  const before=await page.locator('#admin').evaluate(el=>el.scrollTop);
  if(mobile){
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:Math.round(width/2),y:650}]});
   for(let i=1;i<=12;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:Math.round(width/2),y:650-i*30}]});await page.waitForTimeout(16);}
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }else await page.locator('#admin').evaluate(el=>el.scrollTop+=360);
  await page.waitForFunction(()=>document.querySelector('#admin').scrollTop>100);
  const after=await page.locator('#admin').evaluate(el=>el.scrollTop);assert.ok(after>before,'Native panel scrolling must advance');
  await press(page.locator('#hardware-tab-ram'));assert.equal(await page.locator('[data-hardware-catalog]').getAttribute('data-hardware-catalog'),'ram');
  await press(page.locator('#hardware-tab-storage'));assert.equal(await page.locator('[data-hardware-catalog]').getAttribute('data-hardware-catalog'),'storage');
  await press(page.locator('#close-admin'));await page.locator('#events').scrollIntoViewIfNeeded();await page.waitForTimeout(400);
  const report=await page.evaluate(()=>({...window.report,scrollY,overflow:document.documentElement.scrollWidth-innerWidth}));assert.equal(report.hiddenDraws,0);assert.ok(report.overflow<=3);
  assert.deepEqual(errors,[]);reports.push({width,cpuSlowdown:mobile?4:1,buttonPreserved:stable,panelScrolled:after>before,...report,errors});await context.close();
 }
 // Force only the QA mix roll, so decoding and playback are tested without chance.
 const context=await browser.newContext({viewport:{width:414,height:920},isMobile:true,hasTouch:true}),page=await context.newPage();const state=createGame();const goal=purchaseApproach('soda',state);
 state.customers=[{id:901,stage:'shopping',...goal,target:{...goal},route:[],costume:'regular',pcIndex:null,usedMinutes:60,waitingMinutes:0,offlineWait:0,happy:true,wallet:8,desiredItem:'soda',needs:{thirst:90,hunger:0,energy:60}}];state.nextCustomerId=902;
 await page.addInitScript(s=>localStorage.setItem('lhs-save-v1',JSON.stringify(s)),state);await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
 await page.evaluate(async()=>{const {Soundscape}=await import('./js/audio/soundscape.js');const old=Soundscape.prototype.soda;window.audioSales=[];Soundscape.prototype.soda=function(){this.sodaRandom=()=>0;const result=old.call(this);window.audioSales.push({running:this.context?.state,decoded:this.approved.has('vending_soda_01')&&this.approved.has('vending_soda_02'),played:result});return result;};});
 await page.locator('#menu-continue').tap();await page.waitForFunction(()=>window.audioSales.length===1);
 const audio=await page.evaluate(()=>window.audioSales);assert.deepEqual(audio,[{running:'running',decoded:true,played:true}]);await page.waitForTimeout(500);assert.equal(await page.evaluate(()=>window.audioSales.length),1,'No per-frame or duplicate soda playback');await context.close();
 await writeFile(resolve(output,'interface_validation.json'),JSON.stringify({reports,audio},null,2));console.log(JSON.stringify({reports,audio}));
}finally{await browser?.close();server.kill();}
