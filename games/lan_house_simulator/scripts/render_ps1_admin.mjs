import {selectAdminArea,selectTask} from './management_navigation.mjs';
// Screenshot e smoke test do painel REAL do PS1 / CDs (sem mexer em saves).
// Cria uma partida temporária em 2002 exclusivamente no navegador headless.
import {chromium} from "playwright";
import {createServer} from "node:http";
import {mkdir,readFile} from "node:fs/promises";
import {extname,resolve,sep} from "node:path";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {DAY_MINUTES,GAME_SAVE_KEY} from "../dist/js/sim/types.js";
import {buyPs1Disc,buyPs1Station,ps1PlacementSlots} from "../dist/js/sim/ps1.js";

const root=resolve(import.meta.dirname,"../dist");
const output=resolve(process.argv[2]??"out/forge-ps1");
await mkdir(output,{recursive:true});
const game=createGame(303,"historical");
game.totalMinutes=(2002-1998)*360*DAY_MINUTES+12;
game.cash=5000;
for(let i=0;i<2;i++){
 const slot=ps1PlacementSlots(game)[0];
 if(!slot)throw Error("Sem espaço para PS1 "+i);
 const result=buyPs1Station(game,slot.id);
 if(!result.ok)throw Error(result.message);
}
for(const discId of ["turbo-circuito","ilha-dos-cristais"]){
 const result=buyPs1Disc(game,discId);
 if(!result.ok)throw Error(result.message);
}
if(!isValidSave(game))throw Error("Save do showcase é inválido");
const mime={".html":"text/html",".js":"text/javascript",".css":"text/css",".png":"image/png",".svg":"image/svg+xml",".webp":"image/webp",".ogg":"audio/ogg",".wav":"audio/wav"};
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url??"/","http://127.0.0.1").pathname);
  const file=resolve(root,"."+(path==="/"?"/index.html":path));
  if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403).end();return;}
  res.writeHead(200,{"content-type":mime[extname(file)]??"application/octet-stream"}).end(await readFile(file));
 }catch{res.writeHead(404).end();}
});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
let browser;
try{
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 for(const [tag,width,height] of [["desktop",1180,850],["mobile",390,844]]){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1});
  const page=await context.newPage(),errors=[];
  page.on("pageerror",e=>errors.push(String(e)));
  await context.addInitScript(({key,data})=>localStorage.setItem(key,JSON.stringify(data)),
   {key:GAME_SAVE_KEY,data:game});
  await page.goto("http://127.0.0.1:"+server.address().port+"/",{waitUntil:"domcontentloaded"});
  await page.locator("#menu-continue").click();
  await page.locator("#open-admin").click();
  await selectAdminArea(page,'consoles');
  await page.waitForFunction(()=>document.querySelectorAll('#ps1-stations select[data-ps1-slot]').length===2);
  await selectTask(page,"consoles","discs");
  const summary=await page.locator("#ps1-disc-summary").innerText();
  if(!summary.includes("2")||!summary.includes("CD"))throw Error("Acervo PS1 ausente: "+summary);
  await selectTask(page,"consoles","pricing");
  const oldPrice=await page.locator("#ps1-hourly").innerText();
  await page.locator("#ps1-price-up").click();
  const nextPrice=await page.locator("#ps1-hourly").innerText();
  if(oldPrice===nextPrice)throw Error("Preço da hora PS1 não muda ao clicar");
  await page.locator("#section-consoles").screenshot({path:resolve(output,"ps1_painel_"+tag+".png")});
  await selectTask(page,"consoles","discs");await page.locator("#ps1-open-shop").click();
  await page.waitForFunction(()=>document.querySelectorAll('.ps1-cd-shop-card').length===5);
  // Imagens locais, originais e decodificadas, sem dependências externas.
  await page.evaluate(async()=>{
   const images=[...document.querySelectorAll(".ps1-cd-cover")];
   if(images.length!==5)throw Error("Faltam capas de PS1 na loja");
   for(const img of images)img.loading="eager";
   await Promise.all(images.map(img=>img.decode()));
   if(images.some(img=>img.naturalWidth!==420||img.naturalHeight!==560))
    throw Error("Capas sem dimensão esperada de 420×560");
   if(new Set(images.map(img=>img.src)).size!==5)
    throw Error("As cinco capas precisam de imagens diferentes");
  });
  if(tag==="desktop"){
   // Contato com cinco capas em resolução alta, usado na revisão de arte.
   await page.evaluate(()=>{
    const imgs=[...document.querySelectorAll(".ps1-cd-cover")];
    const cnv=document.createElement("canvas");
    cnv.id="ps1-cover-montage";cnv.width=1330;cnv.height=465;
    cnv.style.cssText="display:block;width:1330px;height:465px";
    const ctx=cnv.getContext("2d");
    ctx.fillStyle="#0b1821";ctx.fillRect(0,0,1330,465);
    ctx.fillStyle="#b8edcf";ctx.font="bold 17px Arial";
    ctx.fillText("SOFTDOWN INTERACTIVE   /   ACERVO DE CDs   /   2002",28,38);
    for(let i=0;i<imgs.length;i++){
     const x=24+i*263,y=65;
     ctx.fillStyle="#213847";ctx.fillRect(x-7,y-7,232,373);
     ctx.fillStyle="#d8e5f1";ctx.fillRect(x,y,218,292);
     ctx.drawImage(imgs[i],3+x,3+y,212,286);
     ctx.fillStyle="#9ae5d0";ctx.font="bold 14px Arial";
     ctx.fillText(imgs[i].closest(".ps1-cd-shop-card").querySelector("h3").textContent.toUpperCase(),x,y+324,230);
     ctx.fillStyle="#b7c4d1";ctx.font="11px Arial";
     ctx.fillText("CD ORIGINAL  •  ARTE EXCLUSIVA",x,y+349);
    }
    cnv.style.position="fixed";cnv.style.zIndex="2147483646";cnv.style.left="0";cnv.style.top="0";
    document.body.append(cnv);
   });
   await page.locator("#ps1-cover-montage").screenshot({
    path:resolve(output,"ps1_cinco_capas_catalogo.png")});
   await page.locator("#ps1-cover-montage").evaluate(el=>el.remove());
  }
  // Capturar o que o jogador vê após seguir o atalho, não o catálogo inteiro
  // (que pode ser muito alto e estar dentro de um painel com rolagem própria).
  await page.locator(".ps1-shop-heading").scrollIntoViewIfNeeded();
  await page.screenshot({path:resolve(output,"ps1_loja_cds_"+tag+".png"),animations:"disabled"});
  const before=await page.locator('#shop-catalog .ps1-cd-shop-card button[data-buy-ps1-disc="gol-de-rua"]').innerText();
  await page.locator('#shop-catalog .ps1-cd-shop-card button[data-buy-ps1-disc="gol-de-rua"]').click();
  const after=await page.locator('#shop-catalog .ps1-cd-shop-card').filter({hasText:"Gol de Rua"}).innerText();
  if(!after.includes("Cópias no acervo: 1"))throw Error("CD não comprado na UI: "+after+" / "+before);
  if(errors.length)throw Error("Erros na interface "+tag+": "+errors.join(" | "));
  await context.close();
 }
 console.log("PS1 UI validada: preços, estoque, dois slots, loja CDs, desktop e mobile");
}finally{
 await browser?.close();
 await new Promise(done=>server.close(done));
}
