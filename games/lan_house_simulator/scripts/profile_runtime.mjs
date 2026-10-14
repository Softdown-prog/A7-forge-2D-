// Measures the real application; profiling hooks live only in this test page.
import {chromium} from "playwright";
import {spawn} from "node:child_process";
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {createGame,stepGame} from "../dist/js/sim/engine.js";
import {GAME_SAVE_KEY} from "../dist/js/sim/types.js";
import {circulationScenario} from "./circulation_scenario.mjs";

const output=resolve(process.argv[2]??"out/performance"),label=process.argv[3]??"current";
await mkdir(output,{recursive:true});
const server=spawn(process.execPath,[resolve(import.meta.dirname,"serve.mjs")],{stdio:["ignore","pipe","inherit"]});
let browser;
try{
 await new Promise((ok,reject)=>{server.stdout.once("data",ok);server.once("error",reject);server.once("exit",code=>reject(Error("Servidor encerrou: "+code)));});
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 const reports=[];
 for(const config of [{name:"desktop",width:1280,height:850,cpu:1},{name:"mobile-cpu4",width:414,height:920,cpu:4}]){
  const page=await browser.newPage({viewport:{width:config.width,height:config.height}});
  const state=circulationScenario();stepGame(state,12);
  const cdp=await page.context().newCDPSession(page);await cdp.send("Emulation.setCPUThrottlingRate",{rate:config.cpu});
  await page.addInitScript(({key,state})=>{localStorage.setItem(key,JSON.stringify(state));localStorage.setItem("lhs.sound","off");},{key:GAME_SAVE_KEY,state});
  const errors=[];page.on("pageerror",e=>errors.push(String(e)));
  await page.goto("http://127.0.0.1:4173",{waitUntil:"networkidle"});await page.locator("#menu-continue").click();
  await page.evaluate(async()=>{
   const {SceneRenderer}=await import("./js/render/scene.js");
   const metrics=window.__runtimeProfile={start:performance.now(),frames:[],draw:[],mutations:0,added:0,samples:[],uiLongTasks:[]};
   const original=SceneRenderer.prototype.draw;
   SceneRenderer.prototype.draw=function(s,time){
    const t=performance.now();const result=original.call(this,s,time);metrics.draw.push(performance.now()-t);
    const c=s.customers.find(c=>c.id===1);if(c)metrics.samples.push({t:performance.now(),x:c.x,y:c.y,stage:c.stage,minute:s.totalMinutes});return result;
   };
   const observer=new MutationObserver(list=>{metrics.mutations+=list.length;for(const r of list)metrics.added+=r.addedNodes.length;});
   observer.observe(document.getElementById("game-app"),{childList:true,subtree:true});
   metrics.observer=observer;
   new PerformanceObserver(list=>metrics.uiLongTasks.push(...list.getEntries().map(e=>e.duration))).observe({type:"longtask",buffered:false});
   let previous=performance.now();function measure(now){metrics.frames.push(now-previous);previous=now;metrics.raf=requestAnimationFrame(measure);}metrics.raf=requestAnimationFrame(measure);
  });
  await page.waitForTimeout(12000);
  const report=await page.evaluate(()=>{
   const m=window.__runtimeProfile;m.observer.disconnect();cancelAnimationFrame(m.raf);
   const duration=(performance.now()-m.start)/1000;
   const percentile=(values,p)=>{const sorted=[...values].sort((a,b)=>a-b);return sorted[Math.min(sorted.length-1,Math.floor(sorted.length*p))]??0;};
   const changes=m.samples.slice(1).filter((v,i)=>Math.hypot(v.x-m.samples[i].x,v.y-m.samples[i].y)>.00001);
   const moving=m.samples.filter(v=>["arriving","to_pc","shopping","leaving"].includes(v.stage));
   let last;const positionIntervals=[];for(const v of changes){if(last)positionIntervals.push(v.t-last.t);last=v;}
   return {durationSeconds:+duration.toFixed(2),fps:+(m.frames.length/duration).toFixed(1),frameP95Ms:+percentile(m.frames,.95).toFixed(2),
    drawMeanMs:+(m.draw.reduce((n,v)=>n+v,0)/m.draw.length).toFixed(3),drawP95Ms:+percentile(m.draw,.95).toFixed(3),
    domAddedPerSecond:+(m.added/duration).toFixed(1),mutationRecords:m.mutations,longTasks:m.uiLongTasks,
    movingDraws:moving.length,positionUpdates:changes.length,positionUpdateMedianMs:+percentile(positionIntervals,.5).toFixed(2),
    movingPositionUpdatesPerSecond:+(changes.length/(moving.length/(m.frames.length/duration))).toFixed(1)};
  });
  if(errors.length)throw Error(errors.join("; "));
  reports.push({scenario:config.name,cpuSlowdown:config.cpu,...report});console.log(JSON.stringify(reports.at(-1)));await page.close();
 }
 await writeFile(resolve(output,"runtime_profile_"+label+".json"),JSON.stringify({label,reports},null,2)+"\n");
}finally{await browser?.close();server.kill();}
