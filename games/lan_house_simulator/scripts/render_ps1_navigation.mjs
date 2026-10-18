// Scene Forge: vídeo de trajetória REAL do motor, sem movimentos roteirizados.
// O motor stepGame produz cada estado; Chromium desenha com os artistas do LHS.
import {chromium} from "playwright";
import {createServer} from "node:http";
import {mkdir,readFile,writeFile,rename} from "node:fs/promises";
import {extname,resolve,sep} from "node:path";
import {simulatePs1RealCycle} from "./ps1_real_cycle.mjs";

const root=resolve(import.meta.dirname,"../dist");
const output=resolve(process.argv[2]??"out/forge-ps1");
await mkdir(output,{recursive:true});
const trace=simulatePs1RealCycle();
await writeFile(resolve(output,"ps1_navegacao_trace.json"),JSON.stringify({
 minutes:trace.minutes,stages:trace.stages,exited:trace.exited,wear:trace.wear,
 timeline:trace.timeline
},null,2));
const mime={".html":"text/html",".js":"text/javascript",".css":"text/css",".png":"image/png",".svg":"image/svg+xml",".webp":"image/webp"};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url??"/","http://127.0.0.1");
  const path=decodeURIComponent(url.pathname);
  const file=resolve(root,"."+(path==="/"?"/index.html":path));
  if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403).end();return;}
  const body=await readFile(file);
  res.writeHead(200,{"content-type":mime[extname(file)]??"application/octet-stream"}).end(body);
 }catch{res.writeHead(404).end();}
});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
let browser,context;
try{
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 context=await browser.newContext({
  viewport:{width:1000,height:610},deviceScaleFactor:1,
  recordVideo:{dir:output,size:{width:1000,height:610}}
 });
 const page=await context.newPage(),errors=[];
 page.on("pageerror",error=>errors.push(String(error)));
 await page.goto("http://127.0.0.1:"+server.address().port+"/",{waitUntil:"domcontentloaded"});
 await page.evaluate(async data=>{
  const [{createGame},{SceneRenderer},{drawPs1Station,drawPs1Controller},{drawActor}]=await Promise.all([
   import("./js/sim/engine.js"),import("./js/render/scene.js"),
   import("./js/render/ps1Art.js"),import("./js/render/actorArt.js")
  ]);
  const body=document.body;
  body.replaceChildren();
  body.style.cssText="margin:0;background:#17232b;overflow:hidden";
  const canvas=document.createElement("canvas");
  canvas.width=1000;canvas.height=610;
  canvas.style.cssText="display:block;width:1000px;height:610px";
  body.append(canvas);
  const ctx=canvas.getContext("2d");
  if(!ctx)throw Error("Canvas real indisponível");
  const game=createGame(314,"historical");
  const point=data.point,seat=data.seat,zoom=1.8,focus={x:point.x+.65,y:point.y+.95};
  const cam={zoom,originX:500-(focus.x-focus.y)*64*zoom,
    originY:355-(focus.x+focus.y)*32*zoom};
  const renderer=new SceneRenderer(ctx);
  const phases=[
   {stage:"to_pc",duration:3.1},
   {stage:"sitting",duration:1.3},
   {stage:"using",duration:4.3},
   {stage:"standing",duration:1.3},
   {stage:"leaving",duration:3.2}
  ].map(p=>({...p,frames:data.timeline.filter(f=>f.stage===p.stage)}));
  if(phases.some(p=>!p.frames.length))
   throw Error("O motor não produziu todas as etapas do ciclo real");
  const interpolate=(a,b,k)=>a+(b-a)*k;
  function paint(f,t){
   renderer.drawBackground(game,cam,{minX:0,minY:0,maxX:8,maxY:6},1000,610);
   const playing=f.stage==="using",seated=["sitting","using","standing"].includes(f.stage);
   drawPs1Station(ctx,cam,point,0,playing,t);
   const pose=f.stage==="sitting"||f.stage==="using"?"sitting":
    f.stage==="standing"?"standing-up":"walking";
   drawActor(ctx,cam,{
    x:seated?seat.x:f.x,y:seated?seat.y:f.y,
    kind:"regular",id:5,time:t+.29*5,pose,
    direction:seated?"north":f.facing,
    transition:f.stage==="sitting"||f.stage==="standing"?Math.min(1,f.poseMinutes/3):1,
    gamepad:playing,consoleSeat:seated
   });
   if(playing)drawPs1Controller(ctx,cam,seat,t);
  }
  function playFrame(seconds){
   let t=seconds,phase=phases.at(-1);
   for(const p of phases){
    phase=p;
    if(t<=p.duration)break;
    t-=p.duration;
   }
   const frames=phase.frames;
   const x=Math.max(0,Math.min(frames.length-1,t/phase.duration*(frames.length-1)));
   const i=Math.floor(x),k=x-i,a=frames[i],b=frames[Math.min(i+1,frames.length-1)];
   paint({...a,x:interpolate(a.x,b.x,k),y:interpolate(a.y,b.y,k),
    poseMinutes:interpolate(a.poseMinutes,b.poseMinutes,k)},seconds);
  }
  window.__ps1NavigationDrawStage=stage=>{
   const p=phases.find(p=>p.stage===stage);
   if(!p)throw Error("Fase inexistente: "+stage);
   paint(p.frames[Math.floor(p.frames.length/2)],0);
  };
  window.__ps1NavigationDone=false;
  window.__ps1NavigationStart=()=>{
   const begin=performance.now(),duration=phases.reduce((acc,p)=>acc+p.duration,0);
   function loop(now){
    const elapsed=Math.min(duration,(now-begin)/1000);
    playFrame(elapsed);
    if(elapsed>=duration){window.__ps1NavigationDone=true;return;}
    requestAnimationFrame(loop);
   }
   requestAnimationFrame(loop);
  };
  playFrame(0);
 },trace);
 for(const [stage,name] of [
  ["sitting","ps1_real_sentando.png"],
  ["using","ps1_real_jogando.png"],
  ["standing","ps1_real_levantando.png"]
 ]){
  await page.evaluate(stage=>window.__ps1NavigationDrawStage(stage),stage);
  await page.locator("canvas").screenshot({path:resolve(output,name)});
 }
 await page.evaluate(()=>window.__ps1NavigationStart());
 await page.waitForFunction(()=>window.__ps1NavigationDone===true,null,{timeout:30000});
 if(errors.length)throw Error("Erros Chromium: "+errors.join(" | "));
 const original=await page.video().path();
 await context.close();context=null;
 await rename(original,resolve(output,"ps1_cliente_navegacao_real.webm"));
 console.log("Scene Forge REAL: "+trace.minutes+
  " minutos simulados, cadeira ocupada, sessão PS1 e saída concluída.");
}finally{
 await context?.close();
 await browser?.close();
 await new Promise(done=>server.close(done));
}
