// LHS Scene Forge: dois visitantes e duas bancadas em operação ao mesmo tempo.
// Quadro deriva do estado do motor stepGame, nunca de uma rota coreografada.
import {chromium} from "playwright";
import {createServer} from "node:http";
import {mkdir,readFile,writeFile,rename} from "node:fs/promises";
import {extname,resolve,sep} from "node:path";
import {simulatePs1CrowdedCycle} from "./ps1_crowded_cycle.mjs";

const root=resolve(import.meta.dirname,"../dist");
const output=resolve(process.argv[2]??"out/forge-ps1");
await mkdir(output,{recursive:true});
const simulation=simulatePs1CrowdedCycle();
await writeFile(resolve(output,"ps1_dois_clientes_trace.json"),
 JSON.stringify({ids:simulation.ids,minutes:simulation.minutes,minGap:simulation.minGap,
 wear:simulation.wear,exits:simulation.exits,stages:simulation.stages,walls:simulation.walls,history:simulation.history},null,2));
const mime={".html":"text/html",".js":"text/javascript",".css":"text/css",".svg":"image/svg+xml",".png":"image/png",".webp":"image/webp"};
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url??"/","http://127.0.0.1").pathname);
  const file=resolve(root,"."+(path==="/"?"/index.html":path));
  if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403).end();return;}
  res.writeHead(200,{"content-type":mime[extname(file)]??"application/octet-stream"})
   .end(await readFile(file));
 }catch{res.writeHead(404).end();}
});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
let browser,context;
try{
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 context=await browser.newContext({viewport:{width:1000,height:610},deviceScaleFactor:1,
  recordVideo:{dir:output,size:{width:1000,height:610}}});
 const page=await context.newPage(),errors=[];
 page.on("pageerror",e=>errors.push(String(e)));
 await page.goto("http://127.0.0.1:"+server.address().port+"/",{waitUntil:"domcontentloaded"});
 await page.evaluate(async data=>{
  const [{createGame},{SceneRenderer},{drawPs1Station,drawPs1Controller},{drawActor}]=await Promise.all([
   import("./js/sim/engine.js"),import("./js/render/scene.js"),
   import("./js/render/ps1Art.js"),import("./js/render/actorArt.js")
  ]);
  document.body.replaceChildren();
  document.body.style.cssText="background:#17232b;margin:0;overflow:hidden";
  const canvas=document.createElement("canvas");canvas.width=1000;canvas.height=610;
  canvas.style.cssText="width:1000px;height:610px;display:block";document.body.append(canvas);
  const ctx=canvas.getContext("2d"),game=createGame(291,"historical");
  game.interiorWalls=data.walls;
  if(!ctx)throw Error("Canvas ausente");
  const midway={x:(data.stations[0].point.x+data.stations[1].point.x)/2+.65,
   y:(data.stations[0].point.y+data.stations[1].point.y)/2+.7};
  const zoom=1.25;
  const cam={zoom,originX:500-(midway.x-midway.y)*64*zoom,
   originY:352-(midway.x+midway.y)*32*zoom};
  const renderer=new SceneRenderer(ctx);
  const lerp=(a,b,k)=>a+(b-a)*k;
  function paint(fraction){
   const index=Math.min(data.history.length-1,Math.max(0,fraction*(data.history.length-1)));
   const a=data.history[Math.floor(index)];
   const b=data.history[Math.min(data.history.length-1,Math.ceil(index))];
   const k=index-Math.floor(index);
   const t=fraction*14;
   renderer.drawBackground(game,cam,{minX:0,minY:0,maxX:8,maxY:6},1000,610);
   for(let i=0;i<data.stations.length;i++){
    const active=a.customers.some(c=>c?.stage==="using"&&c.ps1StationIndex===i);
    drawPs1Station(ctx,cam,data.stations[i].point,0,active,t);
   }
   for(const id of data.ids){
    const i=data.ids.indexOf(id);
    const prev=a.customers[i],next=b.customers[i];
    if(!prev)continue;
    const stage=prev.stage;
    const sitting=["sitting","using","standing"].includes(stage);
    const seatIndex=prev.ps1StationIndex;
    const seat=seatIndex===undefined?null:data.stations[seatIndex]?.seat;
    const actor={...prev,x:next?lerp(prev.x,next.x,k):prev.x,
     y:next?lerp(prev.y,next.y,k):prev.y,
     poseMinutes:next&&prev.stage===next.stage?lerp(prev.poseMinutes,next.poseMinutes,k):prev.poseMinutes};
    const playing=stage==="using";
    drawActor(ctx,cam,{x:sitting&&seat?seat.x:actor.x,y:sitting&&seat?seat.y:actor.y,
     kind:"regular",id,time:t+id*.29,
     pose:sitting?(stage==="standing"?"standing-up":"sitting"):"walking",
     direction:sitting?"north":actor.facing,
     transition:(stage==="standing"||stage==="sitting")?Math.min(1,actor.poseMinutes/3):1,
     consoleSeat:sitting,gamepad:playing});
    if(playing&&seat)drawPs1Controller(ctx,cam,seat,t);
   }
  }
  window.__lhsCrowdPaint=paint;
  window.__lhsCrowdDone=false;
  window.__lhsCrowdStart=()=>{
   const start=performance.now(),duration=14;
   function loop(now){
    const t=Math.min(1,(now-start)/(1000*duration));
    paint(t);
    if(t>=1){window.__lhsCrowdDone=true;return;}
    requestAnimationFrame(loop);
   }
   requestAnimationFrame(loop);
  };
  paint(0);
 },simulation);
 for(const [portion,name] of [[.25,"ps1_dois_clientes_chegando.png"],
  [.52,"ps1_dois_clientes_jogando.png"],[.76,"ps1_dois_clientes_saindo.png"]]){
  await page.evaluate(frac=>window.__lhsCrowdPaint(frac),portion);
  await page.locator("canvas").screenshot({path:resolve(output,name)});
 }
 await page.evaluate(()=>window.__lhsCrowdStart());
 await page.waitForFunction(()=>window.__lhsCrowdDone===true,null,{timeout:30000});
 if(errors.length)throw Error("Erros Chromium: "+errors.join(" | "));
 const source=await page.video().path();
 await context.close();context=null;
 await rename(source,resolve(output,"ps1_dois_clientes.webm"));
 console.log("Scene Forge duplo: "+simulation.minutes+" minutos, 2 saídas, separação mínima "+
  simulation.minGap.toFixed(3));
}finally{
 await context?.close();await browser?.close();await new Promise(done=>server.close(done));
}
