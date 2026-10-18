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
  await page.locator('[data-admin-tab="consoles"]').click();
  await page.waitForFunction(()=>document.querySelectorAll('#ps1-stations select[data-ps1-slot]').length===2);
  const summary=await page.locator("#ps1-disc-summary").innerText();
  if(!summary.includes("2")||!summary.includes("CD"))throw Error("Acervo PS1 ausente: "+summary);
  const oldPrice=await page.locator("#ps1-hourly").innerText();
  await page.locator("#ps1-price-up").click();
  const nextPrice=await page.locator("#ps1-hourly").innerText();
  if(oldPrice===nextPrice)throw Error("Preço da hora PS1 não muda ao clicar");
  await page.locator("#section-consoles").screenshot({path:resolve(output,"ps1_painel_"+tag+".png")});
  await page.locator("#ps1-open-shop").click();
  await page.waitForFunction(()=>document.querySelectorAll('.ps1-cd-shop-card').length===5);
  await page.locator("#shop-catalog").screenshot({path:resolve(output,"ps1_loja_cds_"+tag+".png")});
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
