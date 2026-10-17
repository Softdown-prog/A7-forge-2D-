// LHS Scene Forge: renderiza uma cena isolada com a arte real do jogo.
// Não altera o calendário, dinheiro, saves ou a lógica da campanha.
// Uso: npm run forge:ps1 (após npm run build); saída em out/forge-ps1/.
import {chromium} from "playwright";
import {createServer} from "node:http";
import {readFile,mkdir,rename} from "node:fs/promises";
import {extname,resolve,sep} from "node:path";

const root=resolve(import.meta.dirname,"../dist");
const output=resolve(process.argv[2]??"out/forge-ps1");
await mkdir(output,{recursive:true});
const mime={".html":"text/html",".js":"text/javascript",".css":"text/css",".png":"image/png",".webp":"image/webp",".svg":"image/svg+xml",".ogg":"audio/ogg",".wav":"audio/wav"};
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url??"/","http://127.0.0.1").pathname);
  const file=resolve(root,"."+(pathname==="/"?"/index.html":pathname));
  if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403).end();return;}
  const body=await readFile(file);
  res.writeHead(200,{"content-type":mime[extname(file)]??"application/octet-stream"});
  res.end(body);
 }catch{res.writeHead(404).end();}
});
await new Promise(ok=>server.listen(0,"127.0.0.1",ok));
let browser,context;
try{
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 context=await browser.newContext({
  viewport:{width:1000,height:610},deviceScaleFactor:1,
  recordVideo:{dir:output,size:{width:1000,height:610}}
 });
 const page=await context.newPage(),errors=[];
 page.on("pageerror",e=>errors.push(String(e)));
 await page.goto("http://127.0.0.1:"+server.address().port+"/",{waitUntil:"domcontentloaded"});
 await page.evaluate(async()=>{
  const [{createGame},{DAY_MINUTES},{ps1PlacementSlots,ps1StationPoint,ps1Seat,ps1SeatApproach},
    {drawPs1Station,drawPs1Controller},{drawActor},{SceneRenderer}]=await Promise.all([
   import("./js/sim/engine.js"),import("./js/sim/types.js"),import("./js/sim/ps1.js"),
   import("./js/render/ps1Art.js"),import("./js/render/actorArt.js"),
   import("./js/render/scene.js")
  ]);
  document.body.replaceChildren();
  document.body.style.cssText="margin:0;background:#17232b;overflow:hidden";
  const canvas=document.createElement("canvas");
  canvas.width=1000;canvas.height=610;canvas.style.cssText="display:block;width:1000px;height:610px";
  document.body.append(canvas);
  const ctx=canvas.getContext("2d");
  if(!ctx)throw Error("Canvas 2D ausente");
  const game=createGame(314,"historical");
  game.totalMinutes=(2002-1998)*360*DAY_MINUTES;
  game.furniture={poster:0,plant:0,table:0};
  const slot=ps1PlacementSlots(game)[0];
  if(!slot)throw Error("Nenhuma posição disponível para PS1");
  game.ps1Stations=[{slotId:slot.id,wear:0}];
  const point=ps1StationPoint(game,0),seat=ps1Seat(game,0),side=ps1SeatApproach(game,0);
  if(!point||!seat||!side)throw Error("PS1 sem bancada, cadeira ou corredor lateral");
  // Enquadra somente o trecho do salão necessário à validação.
  const zoom=1.8;
  const focus={x:point.x+.65,y:point.y+.95};
  const cam={zoom,
   originX:500-(focus.x-focus.y)*64*zoom,
   originY:355-(focus.x+focus.y)*32*zoom};
  const renderer=new SceneRenderer(ctx);
  const from={x:side.x+1.2,y:side.y+.45};
  const lerp=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
  const clamp=v=>Math.max(0,Math.min(1,v));
  // Diretor de cena determinístico. Usa a mesma arte e poses do runtime.
  // 0-2.7: chega; 2.7-3.7: aproxima a cadeira; 3.7-4.8: senta;
  // 4.8-9: joga; 9-10: levanta; 10-13: sai pelo corredor.
  const duration=13;
  function frame(t){
   let at,pose,transition=1,direction="north",playing=false;
   if(t<2.7){at=lerp(from,side,clamp(t/2.7));pose="walking";direction="west";}
   else if(t<3.7){at=lerp(side,seat,clamp((t-2.7)/1));pose="walking";direction="west";}
   else if(t<4.8){at=seat;pose="sitting";transition=clamp((t-3.7)/1.1);}
   else if(t<9){at=seat;pose="sitting";playing=true;}
   else if(t<10){at=seat;pose="standing-up";transition=clamp((t-9)/1);}
   else if(t<11){at=lerp(seat,side,clamp(t-10));pose="walking";direction="east";}
   else {at=lerp(side,from,clamp((t-11)/2));pose="walking";direction="east";}
   // Fundo original do salão, sem PCs, caixa, menus nem personagens extras.
   // drawBackground é método interno do SceneRenderer, sem alteração no runtime.
   renderer.drawBackground(game,cam,{minX:0,minY:0,maxX:8,maxY:6},1000,610);
   drawPs1Station(ctx,cam,point,0,playing,t);
   // Desenhar a pessoa por cima da cadeira permite inspecionar mãos, sentar e levantar.
   drawActor(ctx,cam,{x:at.x,y:at.y,kind:"regular",id:5,time:t,
    pose,direction,transition});
   if(playing)drawPs1Controller(ctx,cam,seat,t);
  }
  frame(0);
  window.__lhsForgeDone=false;
  const start=performance.now();
  function loop(now){
   const t=Math.min(duration,(now-start)/1000);
   frame(t);
   if(t>=duration){window.__lhsForgeDone=true;return;}
   requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
 });
 await page.waitForFunction(()=>window.__lhsForgeDone===true,null,{timeout:40000});
 if(errors.length)throw Error("Erros de renderização: "+errors.join(" | "));
 const raw=await page.video().path();
 await context.close();context=null;
 await rename(raw,resolve(output,"ps1_cliente_ciclo.webm"));
 console.log("Scene Forge: cliente chegou, sentou, jogou, levantou e saiu; vídeo real do Canvas.");
}finally{
 await context?.close();
 await browser?.close();
 await new Promise(ok=>server.close(ok));
}
