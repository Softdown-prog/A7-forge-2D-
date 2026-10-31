// Integrated gameplay QA: real app, engine checkout, SceneMotion, SceneRenderer and DOM.
// Fixtures only select year, initial purchases and the two visitors waiting at the counter.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile,rename} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import assert from 'node:assert/strict';
import {createGame,isValidSave} from '../dist/js/sim/engine.js';
import {DAY_MINUTES,GAME_SAVE_KEY} from '../dist/js/sim/types.js';
import {buyPs1Station,buyPs1Disc} from '../dist/js/sim/ps1.js';
import {buyPs2Station,buyPs2Game,buyPs2SecondSeat,PS2_GAME_CATALOG} from '../dist/js/sim/ps2.js';
import {counterQueueSlot} from '../dist/js/sim/checkoutQueue.js';
import {selectAdminArea,selectTask} from './management_navigation.mjs';
const output=resolve(process.argv[2]??'out/ps2-integrated');await mkdir(output,{recursive:true});
const root=resolve(import.meta.dirname,'../dist'),mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.ogg':'audio/ogg','.wav':'audio/wav'};
const server=createServer(async(req,res)=>{try{const p=decodeURIComponent(new URL(req.url??'/','http://localhost').pathname),file=resolve(root,'.'+(p==='/'?'/index.html':p));if(!file.startsWith(root+sep)){res.writeHead(403).end();return;}res.writeHead(200,{'content-type':mime[extname(file)]??'application/octet-stream'}).end(await readFile(file));}catch{res.writeHead(404).end();}});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const url='http://127.0.0.1:'+server.address().port;
const ok=r=>assert.equal(r.ok,true,r.message);
function fixture(year=2006,installed=true,visitors=false){
 const s=createGame(314,'historical');s.totalMinutes=(year-1998)*360*DAY_MINUTES+35;s.cash=10000;
 s.pcPoweredOff=[true,true,true];s.offlineUntil=s.totalMinutes+500;s.inventory={soda:0,candy:0,snacks:0};
 ok(buyPs1Station(s,'floor-1'));ok(buyPs1Disc(s,'turbo-circuito'));
 if(installed){ok(buyPs2Station(s,'floor-2'));ok(buyPs2Game(s,'cidade-em-fuga'));ok(buyPs2SecondSeat(s,0));}
 if(visitors){s.customers=[5,10].map((id,i)=>({id,...counterQueueSlot(i,s),target:counterQueueSlot(i,s),route:[],stage:i?'arriving':'waiting',queueIndex:i,
  pcIndex:null,costume:i?'gamer':'regular',usedMinutes:0,waitingMinutes:0,offlineWait:0,happy:true,sessionMinutes:45,
  wallet:30,budgetAware:true,preference:'gaming',needs:{thirst:0,hunger:0,energy:100}}));s.nextCustomerId=20;}
 assert.ok(isValidSave(s));return s;
}
let browser;
const reports=[];
async function open(context,data){
 await context.addInitScript(({key,data})=>{localStorage.setItem(key,JSON.stringify(data));localStorage.setItem('lhs.privacy-choice.v1',JSON.stringify({version:1,choice:'rejected',at:Date.now()}));},{key:GAME_SAVE_KEY,data});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(url,{waitUntil:'domcontentloaded'});
 await page.evaluate(async()=>{
  const {SceneRenderer}=await import('./js/render/scene.js'),draw=SceneRenderer.prototype.draw;
  window.__ps2Trace=[];window.__ps2Last='';SceneRenderer.prototype.draw=function(s,t){
   window.__ps2Observed=s;
   const stages=s.customers.filter(c=>[5,10].includes(c.id)).map(c=>({id:c.id,stage:c.stage,x:c.x,y:c.y,seat:c.ps2SeatIndex,console:c.ps2StationIndex,used:c.usedMinutes}));
   const key=JSON.stringify(stages.map(c=>[c.id,c.stage,c.seat]));if(key!==window.__ps2Last){window.__ps2Trace.push({minute:s.totalMinutes,stages,sessions:s.ps2Sessions,revenue:s.ps2Revenue});window.__ps2Last=key;}
   return draw.call(this,s,t);
  };
 });
 await page.locator('#menu-continue').click();return {page,errors};
}
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 // The complete cycle below runs the actual app clock, no hand-authored paths or poses.
 const cycle=await browser.newContext({viewport:{width:1180,height:850},recordVideo:{dir:output,size:{width:1180,height:850}}});
 const {page,errors}=await open(cycle,fixture(2006,true,true));
 const canvas=page.locator('#game');
 await page.waitForFunction(()=>window.__ps2Observed?.customers.some(c=>c.id===5&&c.stage==='to_pc'));
 await canvas.screenshot({path:resolve(output,'ps2_01_chegando.png')});
 await page.waitForFunction(()=>window.__ps2Observed?.customers.some(c=>c.id===5&&c.stage==='sitting'),null,{polling:50});
 await canvas.screenshot({path:resolve(output,'ps2_02_sentando.png')});
 await page.waitForFunction(()=>window.__ps2Observed?.customers.some(c=>c.id===5&&c.stage==='using'),null,{polling:50});
 await canvas.screenshot({path:resolve(output,'ps2_02b_um_jogador.png')});
 await page.waitForFunction(()=>window.__ps2Observed?.customers.filter(c=>c.ps2StationIndex===0&&c.stage==='using').length===2,null,{timeout:25000});
 await canvas.screenshot({path:resolve(output,'ps2_03_dupla_ps1_ps2_sala.png')});
 await page.waitForFunction(()=>window.__ps2Observed?.customers.some(c=>c.id===5&&c.stage==='standing'),null,{polling:50,timeout:25000});
 await canvas.screenshot({path:resolve(output,'ps2_04_levantando.png')});
 await page.waitForFunction(()=>window.__ps2Observed?.customers.some(c=>c.id===5&&c.stage==='leaving'),null,{polling:50});
 await canvas.screenshot({path:resolve(output,'ps2_05_saindo.png')});
 await page.waitForFunction(()=>!window.__ps2Observed?.customers.some(c=>c.id===5),null,{timeout:20000});
 const trace=await page.evaluate(()=>({kind:'integrated app clock; real checkout and routes; no staged poses',trace:window.__ps2Trace,state:{sessions:window.__ps2Observed.ps2Sessions,revenue:window.__ps2Observed.ps2Revenue}}));
 assert.ok(trace.state.sessions>=2);assert.ok(trace.state.revenue>=6);assert.deepEqual(errors,[]);await writeFile(resolve(output,'ps2-gameplay-trace.json'),JSON.stringify(trace,null,2));
 const raw=await page.video().path();await cycle.close();await rename(raw,resolve(output,'ps2_ciclo_integrado.webm'));
 // Five game animations use full real scenes with real, previously served players.
 const titles=await browser.newContext({viewport:{width:1000,height:610}}),show=await titles.newPage();await show.goto(url);
 for(const game of PS2_GAME_CATALOG){
  const s=fixture(2006,true,true);
  await show.evaluate(async({state,id})=>{
   const [{buyPs2Game,setPs2StationGame},{SceneRenderer}]=await Promise.all([import('./js/sim/ps2.js'),import('./js/render/scene.js')]);
   state.customers=[];if(id!=='cidade-em-fuga'){if(!buyPs2Game(state,id).ok||!setPs2StationGame(state,0,id).ok)throw Error('game unavailable');}
   const {tryServe}=await import('./js/sim/customerDecisions.js');const {advanceCustomer}=await import('./js/sim/customerLifecycle.js');
   const c={id:5,stage:'waiting',x:1.55,y:2.56,target:{x:1.55,y:2.56},route:[],queueIndex:0,pcIndex:null,costume:'regular',usedMinutes:0,waitingMinutes:0,offlineWait:0,happy:true,sessionMinutes:90,wallet:30,budgetAware:true,preference:'gaming',needs:{thirst:0,hunger:0,energy:100}};
   state.customers=[c];tryServe(state,c);for(let i=0;i<120&&c.stage!=='using';i++){state.totalMinutes++;advanceCustomer(state,c);}if(c.stage!=='using')throw Error('player failed to reach PS2');
   document.body.replaceChildren();const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=610;document.body.append(canvas);document.body.style.margin='0';
   const renderer=new SceneRenderer(canvas.getContext('2d'));window.__titleScene=state;window.__titleRenderer=renderer;renderer.draw(state,2.4);
  },{state:s,id:game.id});
  await show.locator('canvas').screenshot({path:resolve(output,'ps2_jogo_'+game.id+'.png')});
  const frame1=await show.locator('canvas').screenshot();await show.evaluate(()=>window.__titleRenderer.draw(window.__titleScene,3.7));
  const frame2=await show.locator('canvas').screenshot();assert.notDeepEqual(frame1,frame2,'game must animate: '+game.id);
  await show.evaluate(()=>{const c=document.querySelector('canvas').getContext('2d');c.setTransform(3,0,0,3,-430,-720);window.__titleRenderer.draw(window.__titleScene,3.7);});
  await show.locator('canvas').screenshot({path:resolve(output,'ps2_detalhe_'+game.id+'.png')});
 }
 await titles.close();
 // Real desktop/mobile controls: buy the bench, physical games, second seat, prices, power and reload.
 for(const [tag,width] of [['desktop',1180],['mobile',390]]){
  const context=await browser.newContext({viewport:{width,height:850},isMobile:width<700,hasTouch:width<700});
  const {page,errors}=await open(context,fixture(2006,false));await page.locator('#open-shop').click();await page.locator('[data-shop-category="consoles"]').click();
  const buy=page.locator('button[data-buy="ps2"]');assert.equal(await buy.isDisabled(),false);
  await page.locator('#ps2-placement').selectOption('floor-2');await buy.click();
  for(const g of PS2_GAME_CATALOG)await page.locator('[data-buy-ps2-game="'+g.id+'"]').click();
  await page.locator('.ps2-bench-card').screenshot({path:resolve(output,'ps2_loja_'+tag+'.png')});
  await page.locator('#close-shop').click();await page.locator('#open-admin').click();await selectAdminArea(page,'consoles');
  await selectTask(page,'consoles','pricing');const rate=await page.locator('#ps2-hourly').innerText();await page.locator('#ps2-price-up').click();assert.notEqual(await page.locator('#ps2-hourly').innerText(),rate);
  await selectTask(page,'consoles','stations');await page.locator('[data-ps2-seat="0"]').click();
  await page.locator('[data-ps2-game="0"]').selectOption('cosmos-2006');
  await page.locator('[data-ps2-power="0"]').click();assert.match(await page.locator('#ps2-stations').innerText(),/desligado/);
  await page.locator('#ps2-stations').screenshot({path:resolve(output,'ps2_admin_'+tag+'.png')});
  await page.locator('#close-admin').click();await canvasFor(page).screenshot({path:resolve(output,'ps2_idle_'+tag+'.png')});
  await page.screenshot({path:resolve(output,'ps2_tela_'+tag+'.png')});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);assert.ok(overflow<=3);
  await page.locator('#open-menu').click();const stored=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),GAME_SAVE_KEY);assert.equal(stored.ps2Stations.length,1);assert.equal(stored.ps2Stations[0].secondSeat,true);assert.equal(stored.ps2Stations[0].gameId,'cosmos-2006');assert.equal(Object.keys(stored.ps2Games).length,5);
  // Reopen in a fresh context without the fixture init script.
  const storage=await context.storageState();await context.close();const reopened=await browser.newContext({viewport:{width,height:850},storageState:storage});
  const again=await reopened.newPage();await again.goto(url);await again.locator('#menu-continue').click();await again.locator('#open-admin').click();await selectAdminArea(again,'consoles');await selectTask(again,'consoles','stations');
  assert.equal(await again.locator('[data-ps2-game="0"]').inputValue(),'cosmos-2006');
  assert.match(await again.locator('#ps2-stations').innerText(),/2 jogadores|0\/2 jogadores/);
  reports.push({tag,width,overflow,errors,installed:stored.ps2Stations.length,copies:Object.keys(stored.ps2Games).length,secondSeat:stored.ps2Stations[0].secondSeat});assert.deepEqual(errors,[]);await reopened.close();
 }
 // Active mobile salon, with the same real checkout and two visitors.
 const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const m=await open(mobile,fixture(2006,true,true));
 await m.page.waitForFunction(()=>window.__ps2Observed?.customers.filter(c=>c.ps2StationIndex===0&&c.stage==='using').length===2,null,{timeout:25000});
 await m.page.screenshot({path:resolve(output,'ps2_mobile_dupla.png')});assert.deepEqual(m.errors,[]);await mobile.close();
 // 2005 shop remains locked in the real UI.
 const locked=await browser.newContext({viewport:{width:1000,height:800}});const l=await open(locked,fixture(2005,false));await l.page.locator('#open-shop').click();await l.page.locator('[data-shop-category="consoles"]').click();assert.equal(await l.page.locator('[data-buy="ps2"]').isDisabled(),true);await locked.close();
 await writeFile(resolve(output,'ps2-browser-report.json'),JSON.stringify({reports,locked2005:true},null,2));console.log('PS2 integrated gameplay, five games, desktop/mobile purchase/admin/save checks passed.');
}finally{await browser?.close();await new Promise(ok=>server.close(ok));}
function canvasFor(page){return page.locator('#game');}
