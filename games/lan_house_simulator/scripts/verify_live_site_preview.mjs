import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile,stat} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
import {chromium} from "playwright";

const root=resolve(import.meta.dirname,"../out/site"),port=4287;
const policy=(await readFile(resolve(root,"_headers"),"utf8"))
 .split("\n").find(line=>line.trim().startsWith("Content-Security-Policy:"))
 ?.trim().slice("Content-Security-Policy:".length).trim();
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",
 ".mjs":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",
 ".svg":"image/svg+xml",".webp":"image/webp",".json":"application/json"};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url??"/","http://localhost"),path=decodeURIComponent(url.pathname);
  // Simular um cache antigo incompatível: nenhum módulo da partida pode
  // depender da URL sem versão, nem os imports transitivos de main.js.
  if(path.startsWith("/game/js/")&&path.endsWith(".js")&&!/^[a-f0-9]{12}$/.test(url.searchParams.get("v")??""))throw Error("módulo antigo sem versão");
  const target=resolve(root,"."+path,path.endsWith("/")?"index.html":"");
  if(!target.startsWith(root+sep))throw Error("fora do diretório");
  if(!(await stat(target)).isFile())throw Error("arquivo inexistente");
  res.writeHead(200,{"Content-Type":mime[extname(target)]??"application/octet-stream",
   ...(policy?{"Content-Security-Policy":policy}:{})});
  res.end(await readFile(target));
 }catch{res.writeHead(404);res.end("Arquivo não encontrado");}
});
await new Promise((ok,reject)=>server.listen(port,"127.0.0.1",err=>err?reject(err):ok()));
let browser;
try{
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 for(const width of [1280,390]){
  const mobile=width<700,context=await browser.newContext({
   viewport:{width,height:840},isMobile:mobile,hasTouch:mobile,
   deviceScaleFactor:1
  }),page=await context.newPage(),errors=[];
  page.on("response",response=>{if(response.status()>=400)errors.push("HTTP "+response.status()+" "+response.url());});
  page.on("pageerror",error=>errors.push(String(error)));
  await page.goto("http://127.0.0.1:"+port+"/",{waitUntil:"networkidle"});
  const img=page.locator(".screen img[src^='/assets/sala.webp']");
  await img.waitFor({state:"visible",timeout:10000});
  assert.equal(await img.evaluate(x=>x.complete&&x.naturalWidth>0),true,
   "A vitrine do site deve mostrar uma imagem válida.");
  await page.goto("http://127.0.0.1:"+port+"/jogar/",{waitUntil:"networkidle"});
  await page.locator("#launch-game").click();
  const frame=page.frameLocator("#game-frame");
  await frame.locator("#menu-new").waitFor({state:"visible",timeout:15000});
  // Checar que a apresentação do jogo tem imagem desenhada, não só cor de fundo.
  const pixels=await frame.locator("#menu-scene").evaluate(c=>{
   const ctx=c.getContext("2d");
   if(!ctx)return 0;
   const image=ctx.getImageData(0,0,c.width,c.height).data;
   const colors=new Set();
   for(let y=30;y<c.height;y+=28)for(let x=30;x<c.width;x+=28){
    const i=(y*c.width+x)*4;
    if(image[i+3]>200)colors.add([image[i]>>4,image[i+1]>>4,image[i+2]>>4].join(","));
   }
   return colors.size;
  });
  assert.ok(pixels>12,"Canvas do menu ficou vazio: apenas "+pixels+" cores");
  // The cookie notice is intentionally visible for new visitors. Simulate
  // declining optional cookies before interacting with the game below it.
  const consent=frame.locator("#privacy-banner");
  if(await consent.isVisible()){
   await frame.locator("#privacy-reject").click();
   await consent.waitFor({state:"hidden"});
  }
  await frame.locator("#menu-new").click();
  await frame.locator("#game-app").waitFor({state:"visible",timeout:15000});
  await frame.locator("#game").waitFor({state:"visible"});
  await frame.locator("#game").scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>{
   const c=document.querySelector("#game-frame")?.contentDocument?.querySelector("#game");
   if(!c)return false;
   const data=c.getContext("2d").getImageData(0,0,c.width,c.height).data;
   return data.some((value,i)=>i%4===3&&value>0);
  });
  const spriteReady=await frame.locator("#game").evaluate(async()=>{
   const entryScript=document.querySelector('script[type="module"][src*="react-entry.js"]')??
    document.querySelector('script[type="module"][src*="main.js"]');
   const entry=new URL(entryScript.src);
   const url=new URL("./render/actorSprites.js",entry);url.search=entry.search;
   const {drawActorSprite}=await import(url.href);
   const ctx=document.createElement("canvas").getContext("2d");
   let blits=0;const original=ctx.drawImage;
   ctx.drawImage=function(...args){blits++;return original.apply(this,args);};
   const actor={x:0,y:0,kind:"regular",id:1,pose:"walking",time:1.2};
   const start=performance.now();
   while(!blits&&performance.now()-start<5000){
    drawActorSprite(ctx,{originX:80,originY:130,zoom:.86},actor);
    await new Promise(ok=>setTimeout(ok,50));
   }
   return blits>0;
  });
  assert.equal(spriteReady,true,"Worker deve carregar com a revisão do jogo em /game/");
  assert.deepEqual(errors,[],"O jogo deve iniciar sem erros de JavaScript");
  await context.close();
 }
 console.log("Site, monitor e botão de jogar validados em desktop e celular");
}finally{await browser?.close();await new Promise(ok=>server.close(ok));}
