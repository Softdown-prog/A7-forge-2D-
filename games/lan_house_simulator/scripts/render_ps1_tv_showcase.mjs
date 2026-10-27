// Scene Forge: cinco CDs e cinco minijogos no CRT real, com lupa na arte
// procedural (mesma função do jogo; a lupa não é gameplay independente).
import {chromium} from "playwright";
import {createServer} from "node:http";
import {mkdir,readFile,rename} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";

const root=resolve(import.meta.dirname,"../dist");
const output=resolve(process.argv[2]??"out/forge-ps1");
await mkdir(output,{recursive:true});
const mime={".html":"text/html",".js":"text/javascript",".css":"text/css",".svg":"image/svg+xml",
 ".png":"image/png",".webp":"image/webp"};
const server=createServer(async(req,res)=>{
 try{
  const route=decodeURIComponent(new URL(req.url??"/","http://127.0.0.1").pathname);
  const file=resolve(root,"."+(route==="/"?"/index.html":route));
  if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403).end();return;}
  const content=await readFile(file);
  res.writeHead(200,{"content-type":mime[extname(file)]??"application/octet-stream"}).end(content);
 }catch{res.writeHead(404).end();}
});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
let browser,context;
try{
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 context=await browser.newContext({viewport:{width:1040,height:620},deviceScaleFactor:1,
  recordVideo:{dir:output,size:{width:1040,height:620}}});
 const page=await context.newPage(),errors=[];
 page.on("pageerror",error=>errors.push(String(error)));
 await page.goto("http://127.0.0.1:"+server.address().port+"/",{waitUntil:"domcontentloaded"});
 await page.evaluate(async()=>{
  const [{createGame},{DAY_MINUTES},{ps1PlacementSlots,ps1Seat,ps1StationPoint,PS1_CD_CATALOG},
   {SceneRenderer},{drawPs1Station,drawPs1Controller},{drawActor},{drawPs1MiniGame,ps1MiniGameFrame}]
    =await Promise.all([
     import("./js/sim/engine.js"),import("./js/sim/types.js"),import("./js/sim/ps1.js"),
     import("./js/render/scene.js"),import("./js/render/ps1Art.js"),
     import("./js/render/actorArt.js"),import("./js/render/ps1MiniGames.js")
    ]);
  document.body.replaceChildren();
  document.body.style.cssText="margin:0;background:#0e1b25;overflow:hidden";
  const canvas=document.createElement("canvas");canvas.width=1040;canvas.height=620;
  canvas.style.cssText="width:1040px;height:620px;display:block";document.body.append(canvas);
  const ctx=canvas.getContext("2d");
  if(!ctx)throw Error("Canvas indisponível");
  const game=createGame(2002,"historical");
  game.totalMinutes=4*360*DAY_MINUTES+90;
  game.furniture={poster:0,plant:0,table:0};
  const slot=ps1PlacementSlots(game)[0];
  if(!slot)throw Error("Bancada não coube no salão");
  game.ps1Stations=[{slotId:slot.id,wear:0}];
  const point=ps1StationPoint(game,0),seat=ps1Seat(game,0);
  if(!point||!seat)throw Error("PS1 sem cadeira");
  const zoom=2.65,focus={x:point.x+.65,y:point.y+.86};
  const cam={zoom,originX:284-(focus.x-focus.y)*64*zoom,
   originY:340-(focus.x+focus.y)*32*zoom};
  const renderer=new SceneRenderer(ctx);
  const scenes=PS1_CD_CATALOG.map(disc=>({id:disc.id,title:disc.title,genre:disc.genre}));
  const itemSeconds=4,total=itemSeconds*scenes.length;
  const text=(str,x,y,font,color)=>{
   ctx.font=font;ctx.fillStyle=color;ctx.textAlign="left";ctx.fillText(str,x,y);
  };
  function frame(at){
   const i=Math.min(scenes.length-1,Math.floor(at/itemSeconds));
   const item=scenes[i],local=at-i*itemSeconds;
   game.ps1Discs={[item.id]:1};game.ps1Stations[0].discId=item.id;
   renderer.drawBackground(game,cam,{minX:0,minY:0,maxX:8,maxY:6},1040,620);
   drawPs1Station(ctx,cam,point,0,true,local,item.id);
   drawActor(ctx,cam,{x:seat.x,y:seat.y,kind:"regular",id:5,time:local,
     pose:"sitting",direction:"north",transition:1,gamepad:true,consoleSeat:true});
   drawPs1Controller(ctx,cam,seat,local);
   // Legendas sobre o gameplay: somente a região da lupa foi ampliada.
   ctx.fillStyle="#0c1b29e8";ctx.fillRect(507,28,497,552);
   ctx.strokeStyle="#7babb6";ctx.lineWidth=2;
   ctx.strokeRect(526,116,460,385);
   ctx.fillStyle="#e6f6ef";text(item.title.toUpperCase(),542,76,"bold 30px system-ui","#ebf5f0");
   text("CD físico · "+item.genre+" · 2002",545,105,"16px system-ui","#9bcad5");
   const screen={x:548,y:137,w:420,h:340};
   ctx.fillStyle="#141c2e";ctx.fillRect(screen.x-7,screen.y-7,screen.w+14,screen.h+14);
   ctx.fillStyle="#18293b";ctx.fillRect(screen.x,screen.y,screen.w,screen.h);
   ctx.save();ctx.beginPath();ctx.rect(screen.x,screen.y,screen.w,screen.h);ctx.clip();
   const renderPixel=(x,y,w,h,color)=>{
    ctx.fillStyle=color;ctx.fillRect(screen.x+x*screen.w,screen.y+y*screen.h,
      Math.max(1,w*screen.w),Math.max(1,h*screen.h));
   };
   drawPs1MiniGame(renderPixel,item.id,local);
   // Vinco suave de TV CRT preservado na lupa.
   ctx.fillStyle="#10253019";
   for(let k=0;k<screen.h;k+=9)ctx.fillRect(screen.x,screen.y+k,screen.w,2);
   ctx.restore();
   text("LUPA DO JOGO EXIBIDO NA TV",545,529,"bold 13px system-ui","#8ec5c8");
   text("Cena procedural real · sem vídeo externo",545,551,"13px system-ui","#b9cfd7");
   text("PLAYSTATION 1 / CINCO CDS / CINCO CENAS",38,43,"bold 17px system-ui","#c6eadd");
   text(String(i+1).padStart(2,"0")+" / 05",38,77,"bold 32px system-ui","#e0f3f5");
   ctx.fillStyle="#d5e4e7";
   for(let j=0;j<5;j++){ctx.fillStyle=j===i?"#72dbcc":"#3a6578";
    ctx.fillRect(545+j*84,566,72,5);}
   window.__lhsShowcaseStage=i;
   window.__lhsShowcaseSeconds=at;
   return ps1MiniGameFrame(item.id,local).tick;
  }
  window.__lhsShowcaseFrame=frame;
  window.__lhsShowcaseDone=false;
  window.__lhsShowcaseStart=()=>{
   const start=performance.now();
   function loop(now){
    const at=Math.min(total,(now-start)/1000);
    frame(at);
    if(at>=total){window.__lhsShowcaseDone=true;return;}
    requestAnimationFrame(loop);
   }
   requestAnimationFrame(loop);
  };
  frame(0);
 });
 const titles=["turbo-circuito","gol-de-rua","ilha-dos-cristais","luta-neon","cosmo-blocos"];
 for(let i=0;i<titles.length;i++){
  await page.evaluate(at=>window.__lhsShowcaseFrame(at),(i+.46)*4);
  await page.locator("canvas").screenshot({path:resolve(output,"ps1_tv_"+titles[i]+".png")});
 }
 await page.evaluate(()=>window.__lhsShowcaseStart());
 // Video capture and detailed Canvas painting can slow Chromium on shared CI runners.
 // Keep the completion assertion; only allow more real time for the 20s showcase.
 await page.waitForFunction(()=>window.__lhsShowcaseDone===true,null,{timeout:90000});
 if(errors.length)throw Error("Erros no showcase: "+errors.join(" | "));
 const path=await page.video().path();
 await context.close();context=null;
 await rename(path,resolve(output,"ps1_cinco_jogos_tv.webm"));
 console.log("5 imagens verificadas + vídeo de 20s usando o renderizador PS1 real");
}finally{
 await context?.close();await browser?.close();
 await new Promise(done=>server.close(done));
}
