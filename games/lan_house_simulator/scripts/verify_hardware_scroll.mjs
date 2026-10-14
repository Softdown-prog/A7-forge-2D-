// Exercise real category taps, keyboard focus and native scrolling while PCs run.
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {createGame,pcPosition} from '../dist/js/sim/engine.js';
import {computerSeat} from '../dist/js/sim/route.js';
import {GAME_SAVE_KEY,DAY_MINUTES} from '../dist/js/sim/types.js';
const server=spawn(process.execPath,[resolve(import.meta.dirname,'serve.mjs')],{stdio:['ignore','pipe','inherit']});
let browser;
try{
 await new Promise((ok,fail)=>{server.stdout.once('data',ok);server.once('error',fail);server.once('exit',code=>fail(Error('Servidor: '+code)));});
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const reports=[];
 for(const width of [1280,414,360])for(const year of [1998,2024]){
  const mobile=width<700,context=await browser.newContext({viewport:{width,height:844},isMobile:mobile,hasTouch:mobile});
  const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(String(error)));
  const s=createGame(),seat=computerSeat(pcPosition(0,s));
  s.totalMinutes=(year-1998)*360*DAY_MINUTES;s.cash=10000;s.pcWear=[.9,0,0];
  s.customers=[{id:1,...seat,target:seat,route:[],stage:'using',costume:'regular',pcIndex:0,usedMinutes:0,sessionMinutes:180,waitingMinutes:0,offlineWait:0,happy:true}];s.nextCustomerId=2;
  await page.addInitScript(({key,s})=>{localStorage.setItem(key,JSON.stringify(s));localStorage.setItem('lhs.sound','off');},{key:GAME_SAVE_KEY,s});
  await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
  const press=locator=>mobile?locator.tap():locator.click();
  await press(page.locator('#menu-continue'));await press(page.locator('#open-admin'));await press(page.locator('[data-admin-tab="computers"]'));
  await page.evaluate(()=>{
   window.categoryControls=[...document.querySelectorAll('[data-hardware-tab]')];
   window.stationControl=document.querySelector('#hardware-select-0');
   window.windowsControl=document.querySelector('#hardware-windows-win98');
   window.monitorImage=document.querySelector('.lcd-card img');
  });
  let largestJump=0;
  for(const tab of ['ram','storage','motherboard','psu','cpu','platform']){
   await page.evaluate(()=>{const panel=document.querySelector('#admin'),nav=document.querySelector('.hardware-tabs');panel.scrollTop+=nav.getBoundingClientRect().top-300;});
   await page.waitForTimeout(200);
   const before=await page.locator('#admin').evaluate(node=>node.scrollTop);
   await press(page.locator('#hardware-tab-'+tab));
   await page.waitForTimeout(500);
   const after=await page.locator('#admin').evaluate(node=>node.scrollTop),jump=Math.abs(after-before);largestJump=Math.max(largestJump,jump);
   assert.ok(jump<=3,`${width}/${year}/${tab}: rolagem saltou ${jump}px`);
   assert.equal(await page.locator('[data-hardware-catalog]').getAttribute('data-hardware-catalog'),tab);
   assert.equal(await page.locator('#hardware-tab-'+tab).getAttribute('aria-pressed'),'true');
   assert.equal(await page.evaluate(()=>window.categoryControls.every(node=>node.isConnected&&node===document.getElementById(node.id))),true,'Categorias devem permanecer conectadas');
  }
  if(!mobile){
   await page.locator('#hardware-tab-ram').focus();await page.keyboard.press('Enter');
   assert.equal(await page.evaluate(()=>document.activeElement?.id),'hardware-tab-ram','Foco do teclado preservado');
   await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement?.id),'hardware-tab-storage');
  }
  const before=await page.locator('#admin').evaluate(node=>node.scrollTop);
  if(mobile){
   const cdp=await context.newCDPSession(page),x=Math.round(width/2);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:280}]});
   for(let i=1;i<=12;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:280+i*25}]});await page.waitForTimeout(20);}
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }else{await page.mouse.move(width/2,400);await page.mouse.wheel(0,-450);}
  await page.waitForTimeout(800);
  const up=await page.locator('#admin').evaluate(node=>node.scrollTop);assert.ok(up<before-150,'Permite subir após escolher peças');
  await page.evaluate(()=>{window.wearBefore=document.querySelector('.pc-label').textContent;window.scrollSamples=[];window.scrollTimer=setInterval(()=>window.scrollSamples.push(document.querySelector('#admin').scrollTop),50);});
  // A running PC changes rounded wear and triggers the ordinary live refresh.
  await page.waitForFunction(()=>document.querySelector('.pc-label').textContent!==window.wearBefore,{},{timeout:9000});
  await page.waitForTimeout(600);
  const live=await page.evaluate(()=>{clearInterval(window.scrollTimer);return {drift:Math.max(...window.scrollSamples)-Math.min(...window.scrollSamples),retained:window.stationControl===document.querySelector('#hardware-select-0')&&window.windowsControl===document.querySelector('#hardware-windows-win98')&&window.monitorImage===document.querySelector('.lcd-card img'),focus:document.activeElement?.id};});
  assert.ok(live.drift<=3,`Atualização em tempo real puxou a tela ${live.drift}px`);assert.equal(live.retained,true,'Estação, Windows e imagens não devem ser recriados');
  await page.locator('#admin').evaluate(node=>node.scrollTop=0);await page.waitForTimeout(1000);
  assert.equal(await page.locator('#admin').evaluate(node=>node.scrollTop),0,'Topo continua acessível com uma categoria focada');
  assert.deepEqual(errors,[]);reports.push({width,year,largestJump,liveDrift:live.drift,nativeScrollUp:true,stableControls:true,keyboard:!mobile});await context.close();
 }
 console.log(JSON.stringify({reports}));
}finally{await browser?.close();server.kill();}
