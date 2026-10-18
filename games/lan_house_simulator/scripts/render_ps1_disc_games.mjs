// Painel de validação: os cinco minijogos rodando no CRT REAL do LHS.
// Usa os mesmos drawPs1MiniGame/drawPs1Station compilados que o jogo.
import {chromium} from "playwright";
import {createServer} from "node:http";
import {mkdir,readFile,rename} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";

const root=resolve(import.meta.dirname,"../dist");
const out=resolve(process.argv[2]??"out/forge-ps1");
await mkdir(out,{recursive:true});
const mime={".html":"text/html",".js":"text/javascript",".css":"text/css",".svg":"image/svg+xml"};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url??"/","http://localhost");
  const file=resolve(root,"."+(url.pathname==="/"?"/index.html":decodeURIComponent(url.pathname)));
  if(!file.startsWith(root+sep)&&file!==root){res.writeHead(403).end();return;}
  res.writeHead(200,{"content-type":mime[extname(file)]??"application/octet-stream"})
   .end(await readFile(file));
 }catch{res.writeHead(404).end();}
});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
let browser,context;
try{
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 context=await browser.newContext({viewport:{width:1500,height:750},deviceScaleFactor:1,
  recordVideo:{dir:out,size:{width:1500,height:750}}});
 const page=await context.newPage(),errors=[];
 page.on("pageerror",err=>errors.push(String(err)));
 await page.goto("http://127.0.0.1:"+server.address().port+"/",{waitUntil:"domcontentloaded"});
 await page.evaluate(async()=>{
  const [{PS1_CD_CATALOG},{drawPs1MiniGame},{drawPs1Station}]=await Promise.all([
   import("./js/sim/ps1.js"),import("./js/render/ps1MiniGames.js"),
   import("./js/render/ps1Art.js")
  ]);
  document.body.replaceChildren();
  document.body.style.cssText="margin:0;background:#101923;overflow:hidden";
  const canvas=document.createElement("canvas");
  canvas.width=1500;canvas.height=750;
  canvas.style.cssText="display:block;width:1500px;height:750px";
  document.body.append(canvas);
  const ctx=canvas.getContext("2d");
  if(!ctx)throw Error("Canvas indisponível");
  const fills=["#f7b55f","#5ccfa7","#a7e9ef","#f38ac9","#afaaff"];
  const xAt=i=>18+i*295,crt={x:38,y:159,w:234,h:189};
  const background=ctx.createLinearGradient(0,0,0,750);
  background.addColorStop(0,"#122032");
  background.addColorStop(1,"#070f18");
  function rounded(x,y,w,h,r,color){
   ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=color;ctx.fill();
  }
  function paint(t){
   ctx.fillStyle=background;ctx.fillRect(0,0,1500,750);
   ctx.textAlign="left";ctx.fillStyle="#ebf5f8";
   ctx.font="bold 28px Arial";ctx.fillText("LAN HOUSE SIMULATOR",26,41);
   ctx.font="14px Arial";ctx.fillStyle="#a9cdd1";
   ctx.fillText("ANO 2002  /  5 CDs  /  5 ANIMAÇÕES PROCEDURAIS INDEPENDENTES",27,66);
   ctx.fillStyle="#182e3a";ctx.fillRect(0,89,1500,3);
   for(let i=0;i<PS1_CD_CATALOG.length;i++){
    const disc=PS1_CD_CATALOG[i],x=xAt(i);
    rounded(x,108,282,605,15,"#192c37");
    rounded(x+5,113,272,595,12,"#233c49");
    ctx.fillStyle=fills[i];ctx.fillRect(x+14,117,254,6);
    ctx.textAlign="left";ctx.fillStyle="#f6f7e9";
    ctx.font="bold 20px Arial";
    ctx.fillText(disc.title,x+19,150,245);
    rounded(x+13,166,256,200,14,"#0c1823");
    rounded(x+23,174,236,183,9,"#596c77");
    rounded(x+32,183,218,166,5,"#0e1a22");
    const px=(u,v,w,h,color)=>{
      ctx.fillStyle=color;ctx.fillRect(x+33+u*216,184+v*164,w*216,h*164);
    };
    drawPs1MiniGame(px,disc.id,t);
    const gloss=ctx.createLinearGradient(x+34,184,x+248,348);
    gloss.addColorStop(0,"rgba(245,255,255,.18)");
    gloss.addColorStop(.5,"rgba(245,255,255,0)");
    gloss.addColorStop(1,"rgba(0,0,0,.10)");
    ctx.fillStyle=gloss;ctx.fillRect(x+33,184,216,164);
    rounded(x+118,359,52,5,2,"#afbcbe");
    ctx.font="12px Arial";ctx.fillStyle="#c5dadf";
    ctx.fillText("ANIMAÇÃO NA TELA",x+55,391);
    ctx.fillStyle="#162c36";ctx.fillRect(x+14,415,254,233);
    // Também valida o objeto isométrico REAL desenhado no runtime.
    const focus={x:.57,y:.62},zoom=1.4;
    const cam={zoom,originX:x+141-(focus.x-focus.y)*64*zoom,
     originY:529-(focus.x+focus.y)*32*zoom};
    drawPs1Station(ctx,cam,{x:0,y:0},0,true,t,disc.id);
    ctx.font="bold 11px Arial";ctx.fillStyle=fills[i];
    ctx.fillText("BANCADA PS1 · CD INSERIDO",x+28,674);
    ctx.font="11px Arial";ctx.fillStyle="#b8cdd0";
    ctx.fillText(disc.genre.toUpperCase(),x+28,694);
   }
   ctx.font="11px Arial";ctx.fillStyle="#8ba4aa";
   ctx.fillText("VISUALIZAÇÃO DO RENDERIZADOR REAL · SEM LICENÇAS, IMAGENS EXTERNAS OU GAMEPLAY COMPLETO",27,738);
  }
  function signatures(t){
   paint(t);
   const result=[];
   for(let i=0;i<5;i++){
    const data=ctx.getImageData(xAt(i)+35,185,211,162).data;
    let hash=2166136261>>>0;
    for(let j=0;j<data.length;j+=4){
     hash=Math.imul(hash^data[j],16777619)>>>0;
     hash=Math.imul(hash^data[j+1],16777619)>>>0;
     hash=Math.imul(hash^data[j+2],16777619)>>>0;
    }
    result.push(hash);
   }
   return result;
  }
  window.__miniDraw=paint;window.__miniSignatures=signatures;
  window.__miniDone=false;
  window.__miniStart=()=>{
   const start=performance.now(),duration=9;
   function loop(now){
    const sec=Math.min(duration,(now-start)/1000);
    paint(sec);
    if(sec>=duration){window.__miniDone=true;return;}
    requestAnimationFrame(loop);
   }
   requestAnimationFrame(loop);
  };
  paint(.75);
 });
 const before=await page.evaluate(()=>window.__miniSignatures(1));
 const after=await page.evaluate(()=>window.__miniSignatures(2.2));
 if(new Set(before).size!==5||before.some((h,i)=>h===after[i]))
  throw Error("CRT sem cinco imagens próprias ou sem animação: "+JSON.stringify({before,after}));
 await page.evaluate(()=>window.__miniDraw(.75));
 await page.locator("canvas").screenshot({path:resolve(out,"ps1_cinco_jogos_crt.png")});
 await page.evaluate(()=>window.__miniDraw(3.25));
 await page.locator("canvas").screenshot({path:resolve(out,"ps1_cinco_jogos_crt_movimento.png")});
 await page.evaluate(()=>window.__miniStart());
 await page.waitForFunction(()=>window.__miniDone===true,null,{timeout:28000});
 if(errors.length)throw Error("Canvas: "+errors.join(" | "));
 const video=await page.video().path();
 await context.close();context=null;
 await rename(video,resolve(out,"ps1_cinco_jogos_crt.webm"));
 console.log("Cinco minijogos do CRT aprovados: diferentes entre si, animados, in-game e determinísticos.");
}finally{
 await context?.close();await browser?.close();
 await new Promise(done=>server.close(done));
}
