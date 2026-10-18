/** Screenshots + short authentic video, drawn by LHS runtime CRT/LCD renderer.
 * No mocked image assets, simulated video playback or modified game economy. */
import {chromium} from "playwright";
import {createServer} from "node:http";
import {mkdir,readFile,rename} from "node:fs/promises";
import {resolve,sep,extname} from "node:path";
const root=resolve(import.meta.dirname,"../dist"),out=resolve(process.argv[2]??"out/pc-screen-art");
await mkdir(out,{recursive:true});
const types={".html":"text/html",".js":"text/javascript",".css":"text/css",".svg":"image/svg+xml"};
const server=createServer(async(req,res)=>{
 try{
  const u=new URL(req.url??"/","http://localhost");
  const path=resolve(root,"."+(u.pathname==="/"?"/index.html":decodeURIComponent(u.pathname)));
  if(path!==root&&!path.startsWith(root+sep)){res.writeHead(403).end();return;}
  res.writeHead(200,{"content-type":types[extname(path)]??"application/octet-stream"}).end(await readFile(path));
 }catch{res.writeHead(404).end();}
});
await new Promise(ok=>server.listen(0,"127.0.0.1",ok));
let browser,context;
try{
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 context=await browser.newContext({viewport:{width:1480,height:1050},deviceScaleFactor:1,
  recordVideo:{dir:out,size:{width:1480,height:1050}}});
 const page=await context.newPage(),errors=[];
 page.on("pageerror",e=>errors.push(String(e)));
 await page.goto("http://127.0.0.1:"+server.address().port+"/",{waitUntil:"domcontentloaded"});
 await page.evaluate(async()=>{
  const [{createGame,pcPosition},{drawRetroComputer},
   {pcActivityForSession,drawPcScreenActivity,pcScreenFrame},
   {DAY_MINUTES}]=await Promise.all([
    import("./js/sim/engine.js"),import("./js/render/retroComputer.js"),
    import("./js/render/pcScreenActivities.js"),import("./js/sim/types.js")
  ]);
  document.body.replaceChildren();document.body.style.cssText="margin:0;overflow:hidden;background:#0b1826";
  const board=document.createElement("canvas");board.id="pc-scenes";
  board.width=1480;board.height=1050;board.style.cssText="width:1480px;height:1050px;display:block";
  document.body.append(board);const ctx=board.getContext("2d");
  const titles=["JOGO DE PLATAFORMA","VÍDEO ONLINE","NAVEGADOR","MENSAGENS","MÚSICA","EDITOR DE TEXTO"];
  const kinds=["game","video","browser","chat","music","editor"];
  const game=createGame(27916,"historical");
  game.totalMinutes=(2015-1998)*360*DAY_MINUTES+180;
  game.pcTiers=[3,3,3];game.pcLcdModels=[null];
  const point=pcPosition(0,game),ids=[];
  for(const kind of kinds){
   const found=Array.from({length:300},(_,i)=>i+1).find(id=>pcActivityForSession(id,0,2015)===kind);
   if(found===undefined)throw Error("Activity unreachable: "+kind);
   ids.push(found);
  }
  const rect=(x,y,w,h,color,r=0)=>{
   ctx.fillStyle=color;ctx.beginPath();if(r)ctx.roundRect(x,y,w,h,r);else ctx.rect(x,y,w,h);ctx.fill();
  };
  const label=(str,x,y,size=14,color="#e3f3f6")=>{
   ctx.fillStyle=color;ctx.font="700 "+size+"px Arial,sans-serif";ctx.fillText(str,x,y);
  };
  const palette=["#9ceaa9","#fdba8d","#9ce7e5","#b1d9e9","#e9a3df","#e5c68d"];
  function draw(t){
   rect(0,0,1480,1050,"#0b1826");
   const head=ctx.createLinearGradient(0,0,1480,133);
   head.addColorStop(0,"#163649");head.addColorStop(1,"#181e3b");
   rect(0,0,1480,130,head);rect(25,28,8,75,"#88efdc");
   label("LAN HOUSE SIMULATOR / ANIMAÇÕES DE PC",52,55,20,"#8eeedc");
   label("SEIS ATIVIDADES · MONITORES CRT E LCD",52,100,30);
   ctx.textAlign="right";
   label("SELEÇÃO FIXA POR VISITA  ·  2,5 FPS POR TELA",1450,57,15,"#bdcdd6");
   ctx.textAlign="left";
   for(let k=0;k<6;k++){
    const row=Math.floor(k/3),col=k%3,x=24+col*490,y=145+row*435;
    rect(x,y,461,418,"#1e3748",15);rect(x+12,y+12,438,395,"#294455",11);
    rect(x+16,y+15,430,5,palette[k]);
    label(String(k+1).padStart(2,"0")+" / "+titles[k],x+27,y+54,18);
    label(k<3?"MONITOR DE TUBO (CRT)":"TELA LCD",x+27,y+81,12,palette[k]);
    // Estação desenhada integralmente com o módulo retroComputer.ts do jogo.
    game.customers=[{id:ids[k],stage:"using",pcIndex:0}];
    game.pcLcdModels=[k<3?null:"lcd12"];
    const zoom=2.04,focus={x:point.x+.34,y:point.y+.53};
    const cam={
     zoom,originX:x+230-(focus.x-focus.y)*64*zoom,
     originY:y+237-(focus.x+focus.y)*32*zoom+46*zoom
    };
    ctx.save();ctx.beginPath();ctx.roundRect(x+18,y+90,423,224,9);ctx.clip();
    rect(x+18,y+90,423,224,"#172d3c");
    drawRetroComputer(ctx,cam,point,0,t,true,game,false);
    ctx.restore();
    label("ZOOM DA TELA",x+25,y+338,11,"#bdd1dc");
    // Macro com MESMA lógica procedural desenhada dentro dos CRTs/LCDs.
    const xx=x+199,yy=y+327,ww=240,hh=74;
    ctx.save();ctx.beginPath();ctx.roundRect(xx,yy,ww,hh,4);ctx.clip();
    const kind=kinds[k];
    drawPcScreenActivity((ax,ay,w,h,color)=>{
     rect(xx+ax*ww,yy+ay*hh,w*ww,h*hh,color);
    },kind,pcScreenFrame(t));ctx.restore();
    ctx.strokeStyle="#7592a1";ctx.lineWidth=1;ctx.strokeRect(xx,yy,ww,hh);
   }
   label("TELAS ILUSTRATIVAS PROCEDURAIS · NENHUM VÍDEO EXTERNO · SEM MUDANÇA NO SAVE",
    27,1031,14,"#b2cbd3");
  }
  draw(.5);
  window.__pcDraw=draw;
  window.__pcStart=()=>{
   const start=performance.now();window.__pcDone=false;
   function tick(now){
    const t=Math.min(5,(now-start)/1000);draw(t);
    if(t>=5){window.__pcDone=true;return;}
    requestAnimationFrame(tick);
   }requestAnimationFrame(tick);
  };
 });
 await page.locator("#pc-scenes").screenshot({path:resolve(out,"pc_seis_atividades_crt_lcd.png")});
 await page.evaluate(()=>window.__pcStart());
 await page.waitForFunction(()=>window.__pcDone===true,null,{timeout:18000});
 if(errors.length)throw Error(errors.join(" | "));
 const video=await page.video().path();await context.close();context=null;
 await rename(video,resolve(out,"pc_seis_atividades_crt_lcd.webm"));
 console.log("SCREEN PASS: six actual CRT/LCD renders and deterministic activity video.");
}finally{
 await context?.close();await browser?.close();await new Promise(done=>server.close(done));
}
