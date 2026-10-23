/** Comparative QA only: 14/30/50/100 synthetic actors do not lift production's 14-client limit.
 * Node measures the real simulation with no Canvas. Chromium measures draw and frame cadence.
 */
import {performance} from 'node:perf_hooks';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from 'playwright';
import {stepGame,isValidSave} from '../dist/js/sim/engine.js';
import {GAME_SAVE_KEY} from '../dist/js/sim/types.js';
import {CAPACITY_COUNTS,capacityFixture} from './capacity_fixture.mjs';

const output=resolve(process.argv[2]??'out/capacity');
await mkdir(output,{recursive:true});
const quantile=(values,p)=>{
 if(!values.length)return 0;
 const ordered=[...values].sort((a,b)=>a-b);
 return ordered[Math.min(ordered.length-1,Math.floor((ordered.length-1)*p))];
};
const rounded=value=>+value.toFixed(3);
const summarize=values=>({meanMs:rounded(values.reduce((a,b)=>a+b,0)/Math.max(1,values.length)),
 p95Ms:rounded(quantile(values,.95)),p99Ms:rounded(quantile(values,.99)),maxMs:rounded(Math.max(0,...values))});

const simulation=[];
for(const count of CAPACITY_COUNTS){
 for(const seed of [1998,72421]){
  const game=capacityFixture(count,seed),costs=[];
  // Synthetic walking pulses keep a quarter of the avatars in the movement system,
  // while the remainder stay in ordinary sit/use stages. No renderer runs here.
  for(let minute=0;minute<90;minute++){
   if(minute>0&&minute%4===0){
    for(const actor of game.customers.slice(0,Math.ceil(count/4))){
     if(actor.stage==='sitting'||actor.stage==='using'){
      actor.stage='to_pc';actor.target={x:actor.x+(minute%8===0?.22:-.22),y:actor.y};actor.route=[];
     }
    }
   }
   const start=performance.now();stepGame(game,1);costs.push(performance.now()-start);
  }
  if(!isValidSave(game))throw Error('Simulation state invalid for '+count+'/'+seed);
  const measured={actors:count,seed,minutes:90,...summarize(costs),
   remainingActors:game.customers.length,exits:count-game.customers.length,
   movementPulse:'25% of actors reset to short walking legs every 4 simulated minutes'};
  simulation.push(measured);console.log('LHS_CAPACITY_SIM '+JSON.stringify(measured));
 }
}

const server=spawn(process.execPath,[resolve(import.meta.dirname,'serve.mjs')],{
 stdio:['ignore','pipe','inherit']});
let browser;
const browserRuns=[];
try{
 await new Promise((ok,fail)=>{
  server.stdout.once('data',ok);server.once('error',fail);
  server.once('exit',code=>fail(Error('Dev server exited: '+code)));
 });
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const config of [{name:'desktop',width:1280,height:850,cpuSlowdown:1,isMobile:false},
                       {name:'touch-cpu4',width:414,height:920,cpuSlowdown:4,isMobile:true}]){
  for(const count of CAPACITY_COUNTS){
   const context=await browser.newContext({viewport:{width:config.width,height:config.height},
    isMobile:config.isMobile,hasTouch:config.isMobile});
   const page=await context.newPage();
   const state=capacityFixture(count);
   const failures=[];page.on('pageerror',err=>failures.push(String(err)));
   page.on('crash',()=>failures.push('Chromium tab crashed'));
   await page.addInitScript(({key,save})=>{
    localStorage.setItem(key,JSON.stringify(save));localStorage.setItem('lhs.sound','off');
   },{key:GAME_SAVE_KEY,save:state});
   const cdp=await context.newCDPSession(page);
   await cdp.send('Emulation.setCPUThrottlingRate',{rate:config.cpuSlowdown});
   try{
    await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle',timeout:40000});
    const privacy=page.locator('#privacy-banner');
    if(await privacy.isVisible()){
     await page.locator('#privacy-reject').click();
     await privacy.waitFor({state:'hidden'});
    }
    await page.locator('#menu-continue').click();
    await page.evaluate(async()=>{
     const {SceneRenderer}=await import('./js/render/scene.js');
     const {SceneMotion}=await import('./js/render/motion.js');
     const m=window.__capacityProbe={started:performance.now(),frames:[],draw:[],motion:[],
      longTasks:[],painted:0,domMutations:0,maxObservedActors:0};
     const orig=SceneRenderer.prototype.draw;
     SceneRenderer.prototype.draw=function(...args){
      if(this.ctx.canvas.id!=='game')return orig.apply(this,args);
      m.maxObservedActors=Math.max(m.maxObservedActors,args[0]?.customers?.length??0);
      const t=performance.now();
      try{return orig.apply(this,args);}finally{
       m.draw.push(performance.now()-t);m.painted++;
      }
     };
     const prev=SceneMotion.prototype.sample;
     SceneMotion.prototype.sample=function(...args){
      const t=performance.now();
      try{return prev.apply(this,args);}finally{m.motion.push(performance.now()-t);}
     };
     if('PerformanceObserver' in window){
      try{new PerformanceObserver(list=>m.longTasks.push(...list.getEntries().map(e=>e.duration)))
       .observe({type:'longtask',buffered:false});}catch{}
     }
     new MutationObserver(records=>{m.domMutations+=records.length;}).observe(
      document.getElementById('game-app'),{childList:true,subtree:true});
     let previous=performance.now();
     const loop=now=>{m.frames.push(now-previous);previous=now;m.raf=requestAnimationFrame(loop);};
     m.raf=requestAnimationFrame(loop);
    });
    await page.waitForTimeout(7000);
    const metrics=await page.evaluate(()=>{
     const m=window.__capacityProbe;cancelAnimationFrame(m.raf);
     const pct=(a,p)=>a.length?[...a].sort((x,y)=>x-y)[Math.min(a.length-1,Math.floor((a.length-1)*p))]:0;
     const mean=a=>a.reduce((s,v)=>s+v,0)/Math.max(1,a.length);
     const duration=(performance.now()-m.started)/1000;
     return {durationSeconds:+duration.toFixed(2),
      rafFps:+(m.frames.length/duration).toFixed(2),canvasDrawsPerSecond:+(m.painted/duration).toFixed(2),
      frameP95Ms:+pct(m.frames,.95).toFixed(2),frameP99Ms:+pct(m.frames,.99).toFixed(2),
      frameMaxMs:+Math.max(...m.frames).toFixed(2),
      frameGapsOver50Ms:m.frames.filter(n=>n>50).length,
      drawMeanMs:+mean(m.draw).toFixed(2),drawP95Ms:+pct(m.draw,.95).toFixed(2),
      drawP99Ms:+pct(m.draw,.99).toFixed(2),drawMaxMs:+Math.max(...m.draw).toFixed(2),
      motionMeanMs:+mean(m.motion).toFixed(2),motionP95Ms:+pct(m.motion,.95).toFixed(2),
      longTasksCount:m.longTasks.length,longTasksMaxMs:+Math.max(0,...m.longTasks).toFixed(2),
      domMutationRecords:m.domMutations,stage:'synthetic-stress',
      observedActors:m.maxObservedActors};
    });
    const result={device:config.name,cpuSlowdown:config.cpuSlowdown,actors:count,...metrics,errors:failures};
    console.log('LHS_CAPACITY_CANVAS '+JSON.stringify(result));browserRuns.push(result);
    if(failures.length)throw Error('Runtime error for '+config.name+'/'+count+': '+failures.join('; '));
    if(!metrics.canvasDrawsPerSecond)throw Error('Canvas did not render actors in '+config.name+'/'+count);
    if(metrics.observedActors!==count)throw Error('Expected '+count+' rendered actors, got '+metrics.observedActors+' in '+config.name);
   }finally{await context.close();}
  }
 }
}finally{await browser?.close();server.kill();}
const report={commit:process.env.GITHUB_SHA??null,
 disclaimer:'Synthetic actors beyond the production limit of 14; not a gameplay/retention or real-phone FPS claim.',
 counts:CAPACITY_COUNTS,simulation,browser:browserRuns};
await writeFile(resolve(output,'capacity_profile.json'),JSON.stringify(report,null,2)+'\n');
const header='| Personagens | Simulação média (ms/min) | Simulação p95 (ms/min) | Canvas desktop p95 (ms) | Canvas touch 4× p95 (ms) | Canvas touch desenhos/s | Gaps touch >50ms |';
const rows=CAPACITY_COUNTS.map(count=>{
 const s=simulation.filter(x=>x.actors===count),avg=key=>(s.reduce((a,b)=>a+b[key],0)/s.length).toFixed(2),
 desktop=browserRuns.find(x=>x.device==='desktop'&&x.actors===count),
 mobile=browserRuns.find(x=>x.device==='touch-cpu4'&&x.actors===count);
 return '| '+count+' | '+avg('meanMs')+' | '+avg('p95Ms')+' | '+desktop.drawP95Ms+
  ' | '+mobile.drawP95Ms+' | '+mobile.canvasDrawsPerSecond+' | '+mobile.frameGapsOver50Ms+' |';
});
const summary=['# LHS — benchmark de capacidade','',
 '**Aviso:** 30, 50 e 100 personagens são cargas sintéticas, não clientes admitidos normalmente. '+
 'O jogo mantém o limite de 14. CPU 4× lenta não representa um aparelho real.','',
 header,'|---:|---:|---:|---:|---:|---:|---:|',...rows,'',
 'Médias do motor sobre duas sementes; percentis por minuto de jogo em Node.js. '+
 'P95 do Canvas medido sobre 7 segundos de Chromium após abrir a partida.','',
 'Leia capacity_profile.json para p99, máximos, long tasks, contagem de frames e erros.',''];
await writeFile(resolve(output,'README.md'),summary.join('\n'));
console.log('LHS_CAPACITY_REPORT '+resolve(output,'capacity_profile.json'));
