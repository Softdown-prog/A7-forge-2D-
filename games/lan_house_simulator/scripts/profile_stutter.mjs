// Profile the actual touch runtime, including simulation, rasterization and saves.
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createGame,stepGame} from '../dist/js/sim/engine.js';
import {moveLayoutObject} from '../dist/js/sim/editableObjects.js';
import {circulationScenario} from './circulation_scenario.mjs';
import {counterQueueSlot} from '../dist/js/sim/checkoutQueue.js';
const cpuProfile=process.argv.includes('--cpu-profile');
const output=resolve(process.argv[2]??'out/stutter'),label=process.argv[3]??'current';await mkdir(output,{recursive:true});
const server=spawn(process.execPath,[resolve(import.meta.dirname,'serve.mjs')],{stdio:['ignore','pipe','inherit']});let browser;
try{
 await new Promise((ok,fail)=>{server.stdout.once('data',ok);server.once('error',fail);});
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});const reports=[];
 for(const layout of ['classic','furnished','crowded']){
  const state=layout==='classic'?circulationScenario():Object.assign(createGame(1998),{cash:10000,reputation:95,licensedGames:true,customers:circulationScenario().customers,nextCustomerId:9});
  if(layout==='furnished'){
   const result=moveLayoutObject(state,'pc:0',{x:2.5,y:3},1);if(!result.ok)throw Error(result.message);
  }
  if(layout==='crowded'){
   const costumes=['regular','rabbit','mouse-mascot','clown','vampire','stitched-monster'];
   state.inventory={soda:60,candy:60,snacks:60};
   state.customers=Array.from({length:10},(_,i)=>({...state.customers[i%8],id:i+1,queueIndex:i,...counterQueueSlot(i),target:counterQueueSlot(i),route:[],costume:costumes[i%costumes.length]}));
   state.nextCustomerId=11;
  }
  stepGame(state,12);
  const context=await browser.newContext({viewport:{width:414,height:920},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
  // Test-only counters distinguish cache churn from simulation/drawing work.
  await context.route('**/js/render/actorSprites.js',async route=>{
   const response=await route.fetch();let source=await response.text();
   source=source.replace(/(export function drawActorSprite\([^\n]+\{)/,'$1\n const stats=globalThis.__spriteStats??={calls:0,hits:0,misses:0,evictions:0};stats.calls++;');
   source=source.replace(/if \(!sprite\) \{/,'if (!sprite) { stats.misses++;');
   source=source.replace(/(cache\.frames\.delete\(key\);\s*cache\.frames\.set\(key, sprite\);)/,'stats.hits++;$1');
   source=source.replace(/(const oldest = cache\.frames\.keys\(\)\.next\(\)\.value;)/,'if(globalThis.__spriteStats)globalThis.__spriteStats.evictions++;$1');
   await route.fulfill({response,body:source});
  });
  page.on('pageerror',e=>errors.push(String(e)));
  await page.addInitScript(state=>{localStorage.setItem('lhs-save-v1',JSON.stringify(state));localStorage.setItem('lhs.sound','off');},state);
  const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  if(process.argv.includes('--vector'))await page.route('**/js/render/scene.js',async route=>{
   const response=await route.fetch(),source=await response.text();
   const marker='import { drawActorSprite as drawActor } from "./actorSprites.js";';
   if(!source.includes(marker))throw Error('Renderer import changed; cannot apply vector control');
   await route.fulfill({response,body:source.replace(marker,'import { drawActor } from "./actorArt.js";')});
  });
  await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});await page.locator('#menu-continue').tap();
  await page.evaluate(async()=>{
   const {SceneRenderer}=await import('./js/render/scene.js'),{SceneMotion}=await import('./js/render/motion.js');
   const data=window.costs={start:performance.now(),timings:{},frames:[],longTasks:[],scroll:matchMedia('(pointer:coarse)').matches};
   for(const [prototype,methods] of [[SceneRenderer.prototype,['draw','drawBackground','customer','counter','machine','shelf','owner']],[SceneMotion.prototype,['sample']]]){
    for(const name of methods){const original=prototype[name];prototype[name]=function(...args){const start=performance.now();try{return original.apply(this,args);}finally{(data.timings[name]??=[]).push(performance.now()-start);}};}
   }
   new PerformanceObserver(list=>data.longTasks.push(...list.getEntries().map(e=>e.duration))).observe({type:'longtask'});
   const set=Storage.prototype.setItem;Storage.prototype.setItem=function(...args){const start=performance.now();try{return set.apply(this,args);}finally{(data.timings.storage??=[]).push(performance.now()-start);}};
   let last=performance.now();function frame(now){data.frames.push(now-last);last=now;data.raf=requestAnimationFrame(frame);}data.raf=requestAnimationFrame(frame);
  });
  if(cpuProfile){await cdp.send('Profiler.enable');await cdp.send('Profiler.setSamplingInterval',{interval:500});await cdp.send('Profiler.start');}
  await page.waitForTimeout(12000);const profile=cpuProfile?(await cdp.send('Profiler.stop')).profile:{nodes:[],samples:[],timeDeltas:[]};
  const metrics=await page.evaluate(()=>{const d=window.costs;cancelAnimationFrame(d.raf);const pct=(v,p)=>[...v].sort((a,b)=>a-b)[Math.min(v.length-1,Math.floor(v.length*p))]??0;
   return {durationSeconds:(performance.now()-d.start)/1000,touch:d.scroll,zoom:document.querySelector('#scene-zoom')?.value,sprites:globalThis.__spriteStats,rafCount:d.frames.length,frameP95:pct(d.frames,.95),frameMax:Math.max(...d.frames),longTasks:d.longTasks,timings:Object.fromEntries(Object.entries(d.timings).map(([k,v])=>[k,{calls:v.length,total:v.reduce((a,b)=>a+b,0),p95:pct(v,.95),max:Math.max(...v)}]))};});
  const nodes=new Map(profile.nodes.map(n=>[n.id,n])),cost=new Map();
  for(let i=0;i<profile.samples.length;i++){const n=nodes.get(profile.samples[i]);const key=n.callFrame.functionName+' @ '+n.callFrame.url.split('/').slice(-1)[0];cost.set(key,(cost.get(key)??0)+(profile.timeDeltas[i]??0)/1000);}
  const report={layout,errors,...metrics,hotspots:[...cost].sort((a,b)=>b[1]-a[1]).slice(0,22)};reports.push(report);console.log(JSON.stringify(report));await context.close();
 }
 await writeFile(resolve(output,'stutter_'+label+'.json'),JSON.stringify(reports,null,2));
}finally{await browser?.close();server.kill();}
