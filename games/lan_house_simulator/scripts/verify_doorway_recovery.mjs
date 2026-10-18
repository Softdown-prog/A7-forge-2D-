// Run the saved doorway deadlock through the real application's RAF, on CI.
// Test-only module observation never moves actors or advances the game clock.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
import {doorwayScenario} from './doorway_scenario.mjs';
import {exitNearBinScenario} from './corridor_scenarios.mjs';
import {GAME_SAVE_KEY} from '../dist/js/sim/types.js';
const root=resolve(import.meta.dirname,'../dist'),out=resolve(process.argv[2]??'out/doorway');
const corridor=process.argv.includes('--corridor');
const recordVideo=process.argv.includes('--record-video');
await mkdir(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
 try{
  const u=new URL(req.url??'/','http://localhost');
  const file=resolve(root,'.'+(u.pathname==='/'?'/index.html':decodeURIComponent(u.pathname)));
  if(!file.startsWith(root+sep)){res.writeHead(403).end();return;}
  res.writeHead(200,{'content-type':mime[extname(file)]??'application/octet-stream'}).end(await readFile(file));
 }catch{res.writeHead(404).end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const results=[];
 for(const width of [1280,390]){
  const context=await browser.newContext({viewport:{width,height:width===390?840:850},deviceScaleFactor:1,isMobile:width===390,hasTouch:width===390,
   ...(recordVideo?{recordVideo:{dir:out,size:{width,height:width===390?840:850}}}:{})});
  await context.route('**/online-config.json',route=>route.fulfill({json:{enabled:false,apiUrl:'',firebaseApiKey:''}}));
  await context.route('**/js/sim/engine.js',async route=>{
   const response=await route.fetch();
   const source=await response.text();
   await route.fulfill({response,body:source+`\nconst observedStep=stepGame;
stepGame=function(s,delta){const result=observedStep(s,delta);globalThis.__doorwayState=s;
 if(s.customers.some(c=>c.id===17&&c.stage==='using'))globalThis.__doorwayUsed=true;
 return result;};\n`});
  });
  const state=corridor?exitNearBinScenario():doorwayScenario(),departing=state.customers.filter(c=>c.stage==='leaving').map(c=>c.id);
  await context.addInitScript(({key,state})=>{localStorage.setItem(key,JSON.stringify(state));localStorage.setItem('lhs.sound','off');},{key:GAME_SAVE_KEY,state});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'networkidle'});
  await page.locator('#menu-continue').click();
  await page.locator('#game-app').waitFor({state:'visible'});
  await page.locator('#game').scrollIntoViewIfNeeded();
  await page.screenshot({path:resolve(out,'doorway_before_'+width+'.png')});
  await page.waitForFunction(({ids,corridor})=>{
   const s=globalThis.__doorwayState;
   return s&&(corridor||globalThis.__doorwayUsed)&&ids.every(id=>!s.customers.some(c=>c.id===id));
  },{ids:departing,corridor},{timeout:45000});
  const result=await page.evaluate(()=>{
   const s=globalThis.__doorwayState;
   return {minute:s.totalMinutes,served:s.served,cash:s.cash,revenue:s.revenue,expenses:s.expenses,customer:s.customers.find(c=>c.id===17),zoom:document.querySelector('#scene-zoom')?.value};
  });
  // Normal arrivals continue while this application runtime is recovering.
  if(corridor){
   assert.ok(result.minute-state.totalMinutes<=32,'customer near the bin exits promptly before closing');
  }else{
   assert.ok(result.served>=1);assert.equal(result.customer.stage,'using');
  }
  assert.ok(Math.abs(result.cash-state.cash-(result.revenue-state.revenue)+(result.expenses-state.expenses))<1e-6);
  assert.ok(result.minute>state.totalMinutes);assert.deepEqual(errors,[]);
  await page.screenshot({path:resolve(out,'doorway_after_'+width+'.png')});
  results.push({width,...result,errors});
  const video=recordVideo?await page.video():null;
  await context.close();
  if(video)await video.saveAs(resolve(out,(corridor?'corredor_':'entrada_')+width+'.webm'));
 }
 await writeFile(resolve(out,'doorway-runtime.json'),JSON.stringify(results,null,2)+'\n');
 console.log((corridor?'Exit corridor':'Doorway')+' recovery: real runtime resumes on desktop and touch mobile.');
}finally{await browser?.close();server.close();}
