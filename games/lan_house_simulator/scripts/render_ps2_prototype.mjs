// Captura do protótipo procedural PS2 — NÃO é screenshot do gameplay integrado.
// Requer npm run build e playwright/Chromium, como os scripts de PS1.
import {chromium} from "playwright";
import {createServer} from "node:http";
import {readFile,mkdir} from "node:fs/promises";
import {extname,resolve,sep} from "node:path";

const root=resolve(import.meta.dirname,"../dist");
const out=resolve(process.argv[2]??"out/forge-ps2");
await mkdir(out,{recursive:true});
const mime={".html":"text/html",".js":"text/javascript",".css":"text/css",".png":"image/png",".svg":"image/svg+xml",".webp":"image/webp"};
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url??"/","http://127.0.0.1").pathname);
  const file=resolve(root,"."+(path==="/"?"/index.html":path));
  if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403).end();return;}
  const body=await readFile(file);
  res.writeHead(200,{"content-type":mime[extname(file)]??"application/octet-stream"}).end(body);
 }catch{res.writeHead(404).end();}
});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
let browser;
try{
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 const page=await browser.newPage({viewport:{width:1000,height:600},deviceScaleFactor:1});
 const errors=[];
 page.on("pageerror",e=>errors.push(String(e)));
 await page.goto("http://127.0.0.1:"+server.address().port+"/",{waitUntil:"domcontentloaded"});
 await page.evaluate(async()=>{
  const [{drawPs2Station,drawPs2Controller},{PS2_GAME_CATALOG},{drawActor},{SceneRenderer},{createGame}]=await Promise.all([
   import("./js/render/ps2Art.js"),import("./js/sim/ps2.js"),import("./js/render/actorArt.js"),
   import("./js/render/scene.js"),import("./js/sim/engine.js")
  ]);
  document.body.replaceChildren();
  document.body.style.cssText="background:#152530;margin:0";
  const canvas=document.createElement("canvas");canvas.width=1000;canvas.height=600;
  canvas.style.cssText="width:1000px;height:600px";document.body.append(canvas);
  const ctx=canvas.getContext("2d");
  if(!ctx)throw Error("Canvas 2D indisponível");
  const s=createGame(2006,"historical");
  const position={x:3.3,y:2.6},seat={x:3.75,y:3.37},zoom=1.7;
  const focus={x:position.x+.6,y:position.y+.7};
  const cam={zoom,originX:500-(focus.x-focus.y)*64*zoom,originY:355-(focus.x+focus.y)*32*zoom};
  const renderer=new SceneRenderer(ctx);
  window.__ps2Paint=(id,time)=>{
   renderer.drawBackground(s,cam,{minX:0,minY:0,maxX:8,maxY:6},1000,600);
   drawPs2Station(ctx,cam,position,0,true,time,id,false);
   drawActor(ctx,cam,{x:seat.x,y:seat.y,kind:"regular",id:52,time,
    pose:"sitting",direction:"north",transition:1,gamepad:true,consoleSeat:true});
   drawPs2Controller(ctx,cam,seat,time);
   ctx.font="bold 21px system-ui";ctx.textAlign="left";ctx.fillStyle="#e8f4f4";
   ctx.fillText("PS2 — protótipo procedural (NÃO integrado ao gameplay)",26,38);
   ctx.font="15px system-ui";ctx.fillText(PS2_GAME_CATALOG.find(g=>g.id===id)?.title??"",28,69);
  };
  window.__ps2Titles=PS2_GAME_CATALOG.map(g=>g.id);
 });
 const titles=await page.evaluate(()=>window.__ps2Titles);
 for(let i=0;i<titles.length;i++){
  await page.evaluate(([id,t])=>window.__ps2Paint(id,t),[titles[i],i+1.8]);
  await page.locator("canvas").screenshot({path:resolve(out,"ps2_prototipo_"+titles[i]+".png")});
 }
 if(errors.length)throw Error("Erros no Canvas: "+errors.join(" | "));
 console.log("Protótipo PS2: cinco capturas do renderizador procedural; NÃO é gameplay integrado.");
 await page.close();
}finally{
 await browser?.close();
 await new Promise(done=>server.close(done));
}
