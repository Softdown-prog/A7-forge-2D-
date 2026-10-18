/** Comparação visual de piso e pôsteres usando o renderizador real do jogo.
 * Somente o ambiente Playwright de teste recebe entitlements simulados.
 * Não há consumo de Cookies, mutação de save ou alteração de colisões.
 */
import {chromium} from "playwright";
import {createServer} from "node:http";
import {mkdir,readFile,rename} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
const root=resolve(import.meta.dirname,"../dist"),out=resolve(process.argv[2]??"out/cookie-art");
await mkdir(out,{recursive:true});
const types={".html":"text/html",".css":"text/css",".js":"text/javascript",".svg":"image/svg+xml"};
const server=createServer(async(req,res)=>{
 try{
  const u=new URL(req.url??"/","http://localhost");
  const file=resolve(root,"."+(u.pathname==="/"?"/index.html":decodeURIComponent(u.pathname)));
  if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403).end();return;}
  res.writeHead(200,{"content-type":types[extname(file)]??"application/octet-stream"}).end(await readFile(file));
 }catch{res.writeHead(404).end();}
});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
let browser,context;
try{
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 context=await browser.newContext({viewport:{width:1480,height:950},deviceScaleFactor:1,
  recordVideo:{dir:out,size:{width:1480,height:950}}});
 const page=await context.newPage(),errors=[];
 page.on("pageerror",e=>errors.push(String(e)));
 await page.goto("http://127.0.0.1:"+server.address().port+"/",{waitUntil:"domcontentloaded"});
 await page.evaluate(async()=>{
  const [{createGame},{SceneRenderer},{setVerifiedCosmetics},
   {drawPremiumPosterPlate,EXCLUSIVE_POSTER_TITLES}]=await Promise.all([
    import("./js/sim/engine.js"),import("./js/render/scene.js"),
    import("./js/sim/premiumCosmetics.js"),import("./js/render/premiumRoomArt.js")
  ]);
  document.body.replaceChildren();
  document.body.style.cssText="margin:0;background:#0b1726;overflow:hidden";
  const s=createGame(2046,"historical");
  const render=document.createElement("canvas");render.width=1000;render.height=610;
  const ctx=render.getContext("2d");
  if(!ctx)throw Error("Canvas da cena indisponível");
  const renderer=new SceneRenderer(ctx);
  function snapshot(ids){
   setVerifiedCosmetics(ids);
   renderer.draw(s,1);
   const copy=document.createElement("canvas");
   copy.width=1000;copy.height=610;copy.getContext("2d").drawImage(render,0,0);
   return copy;
  }
  // O mesmo SceneRenderer é usado antes/depois para flagrar cache inválido.
  const baseline=snapshot([]);
  const floorOnly=snapshot(["arcade-checker-floor"]);
  const postersOnly=snapshot(["exclusive-arcade-posters"]);
  const premium=snapshot(["arcade-checker-floor","exclusive-arcade-posters"]);
  const revoked=snapshot([]);
  const digest=(canvas)=>{
   const data=canvas.getContext("2d").getImageData(0,0,1000,610).data;
   let h=2166136261;
   for(let i=0;i<data.length;i+=48)h=Math.imul(h^data[i],16777619)>>>0;
   return h;
  };
  const checks=[baseline,floorOnly,postersOnly,premium,revoked].map(digest);
  if(checks[0]===checks[1]||checks[0]===checks[2]||checks[1]===checks[3]||
    checks[2]===checks[3]||checks[0]!==checks[4])throw Error("Visual/caching: "+checks.join("/"));
  setVerifiedCosmetics([]);
  window.__checks=checks;
  const scene=(name,canvas)=>{
   const frame=document.createElement("canvas");
   frame.id=name;frame.width=1000;frame.height=610;
   frame.style.cssText="position:fixed;left:0;top:0;z-index:10001";
   frame.getContext("2d").drawImage(canvas,0,0);
   document.body.append(frame);
  };
  scene("cookie-scene-standard",baseline);
  scene("cookie-scene-premium",premium);
  const board=document.createElement("canvas");board.id="cookie-floor-board";
  board.width=1480;board.height=950;board.style.cssText="display:block;width:1480px;height:950px";
  document.body.append(board);
  const c=board.getContext("2d");
  const panels=[{x:22,y:136,title:"SALÃO ORIGINAL",art:baseline,accent:"#acbfca"},
    {x:752,y:136,title:"SALÃO COM COSMÉTICOS",art:premium,accent:"#81e8d6"}];
  const round=(x,y,w,h,r,fill)=>{c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();};
  const txt=(v,x,y,size=16,color="#f2f7f9")=>{c.fillStyle=color;c.font="bold "+size+"px Arial";c.fillText(v,x,y);};
  function paint(seconds){
   const glow=(Math.sin(seconds*2.5)+1)/2;
   c.fillStyle="#0a1522";c.fillRect(0,0,1480,950);
   const header=c.createLinearGradient(0,0,1480,105);
   header.addColorStop(0,"#152d3e");header.addColorStop(1,"#111b2f");
   c.fillStyle=header;c.fillRect(0,0,1480,108);
   c.fillStyle="#75e8d9";c.fillRect(22,19,8,74);
   txt("SOFTDOWN / CATÁLOGO COOKIES",49,47,18,"#76ead6");
   txt("PISO ARCADE + 3 PÔSTERES EXCLUSIVOS",49,86,30);
   c.textAlign="right";txt("ANO 1998 · SEM BENEFÍCIO ECONÔMICO",1456,55,14,"#abc2d0");c.textAlign="left";
   for(const p of panels){
    round(p.x,p.y,704,462,14,"#192e40");
    round(p.x+8,p.y+8,688,447,10,"#243a4c");
    c.fillStyle=p.accent;c.fillRect(p.x+11,p.y+10,681,4);
    txt(p.title,p.x+23,p.y+38,19);
    c.drawImage(p.art,p.x+13,p.y+49,680,397);
   }
   // Área inferior é uma galeria de imagens originais ampliadas,
   // desenhadas pela MESMA função que projeta os pôsteres do jogo.
   round(22,618,1434,294,14,"#1a3041");
   txt("COLEÇÃO DE 3 ARTES ORIGINAIS  /  12 COOKIES",41,654,17,"#80e8d7");
   for(let i=0;i<3;i++){
    const x=49+i*465,y=665;
    round(x,y,428,226,11,"#253d51");
    const accent=["#65eee1","#eda3e2","#ffd18f"][i];
    c.save();c.translate(x+15,y+10);c.scale(1.65,1.65);
    drawPremiumPosterPlate(c,i);c.restore();
    txt(EXCLUSIVE_POSTER_TITLES[i],x+190,y+78,22,accent);
    txt(["RETROFUTURISMO · CARRO ESPORTIVO","ESPACIAL · NAVE DE CORRIDA","FANTASIA · MAGIA E CRISTAIS"][i],x+190,y+111,12,"#c5dbe5");
    txt("PÔSTER COM MOLDURA METÁLICA",x+190,y+137,13,"#c5dbe5");
    c.globalAlpha=.4+.55*glow;c.fillStyle=accent;c.fillRect(x+192,y+151,185,2);c.globalAlpha=1;
   }
   txt("PISO ARCADE XADREZ · 25 COOKIES · NÃO ALTERA A PLANTA, A MOVIMENTAÇÃO OU O SAVE",39,934,13,"#a6c6d3");
  }
  paint(.4);
  window.__cookieFloorStart=()=>{
   const begun=performance.now();window.__cookieFloorDone=false;
   function frame(now){const sec=Math.min(5,(now-begun)/1000);paint(sec);
    if(sec===5){window.__cookieFloorDone=true;return;}requestAnimationFrame(frame);}
   requestAnimationFrame(frame);
  };
 });
 await page.locator("#cookie-floor-board").screenshot({path:resolve(out,"cookies_piso_posters_comparacao.png")});
 await page.locator("#cookie-scene-premium").screenshot({path:resolve(out,"cookies_piso_posters_salao.png")});
 await page.locator("#cookie-scene-standard").screenshot({path:resolve(out,"cookies_piso_posters_salao_antes.png")});
 await page.locator("#cookie-scene-standard").evaluate(el=>el.remove());
 await page.locator("#cookie-scene-premium").evaluate(el=>el.remove());
 await page.evaluate(()=>window.__cookieFloorStart());
 await page.waitForFunction(()=>window.__cookieFloorDone===true,null,{timeout:20000});
 if(errors.length)throw Error("Canvas: "+errors.join(" | "));
 const video=await page.video().path();await context.close();context=null;
 await rename(video,resolve(out,"cookies_piso_posters_apresentacao.webm"));
 console.log("COOKIES FLOOR/POSTERS PASS: cache, revogação, capturas e vídeo.");
}finally{
 await context?.close();await browser?.close();await new Promise(done=>server.close(done));
}
