// Gravação contínua da execução REAL do jogo em Chromium via Playwright.
// Diferente das pranchas PNG: um frame de vídeo é capturado a cada instante da partida.
import {chromium} from "playwright";
import {createServer} from "node:http";
import {readFile,mkdir,rename} from "node:fs/promises";
import {extname,resolve,sep} from "node:path";
import {createGame,pcPosition} from "../dist/js/sim/engine.js";
import {computerSeat} from "../dist/js/sim/route.js";
import {GAME_SAVE_KEY} from "../dist/js/sim/types.js";

const root=resolve(import.meta.dirname,"../dist"),output=resolve(process.argv[2]??"out/video");
await mkdir(output,{recursive:true});
const mime={".html":"text/html",".js":"text/javascript",".css":"text/css",".png":"image/png",".svg":"image/svg+xml",".ogg":"audio/ogg"};
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url??"/","http://127.0.0.1").pathname);
  const file=resolve(root,"."+(pathname==="/"?"/index.html":pathname));
  if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403).end();return;}
  const data=await readFile(file);
  res.writeHead(200,{"Content-Type":mime[extname(file)]??"application/octet-stream"});res.end(data);
 }catch{res.writeHead(404).end();}
});
await new Promise(ok=>server.listen(0,"127.0.0.1",ok));
const state=createGame(1998);
state.totalMinutes=34;
state.cash=2500;
state.reputation=88;
state.pcWear=[62,0,0];
state.binFill=[75,65];
const seat=computerSeat(pcPosition(1,state));
state.customers=[{
 id:1,x:seat.x,y:seat.y,stage:"using",target:seat,route:[],
 costume:"regular",pcIndex:1,usedMinutes:1,sessionMinutes:75,
 waitingMinutes:0,offlineWait:0,happy:true
}];
state.nextCustomerId=2;
let browser;
try{
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 const context=await browser.newContext({
  viewport:{width:1280,height:850},deviceScaleFactor:1,
  recordVideo:{dir:output,size:{width:1280,height:850}}
 });
 const page=await context.newPage(),errors=[];
 page.on("pageerror",e=>errors.push(String(e)));
 await page.addInitScript(({key,payload})=>localStorage.setItem(key,JSON.stringify(payload)),
   {key:GAME_SAVE_KEY,payload:state});
 await page.goto("http://127.0.0.1:"+server.address().port+"/",{waitUntil:"networkidle"});
 await page.locator("#menu-continue").click();
 await page.locator("#game-app").waitFor({state:"visible"});
 await page.waitForTimeout(1200);
 // PC já desgastado: contratação real pela interface do painel administrativo.
 await page.locator("#open-admin").click();
 await page.locator('[data-admin-tab="computers"]').click();
 const repair=page.locator('button').filter({hasText:/Chamar técnico/}).first();
 if(await repair.count()&&await repair.isEnabled())await repair.click();
 await page.locator("#close-admin").click();
 // Capturar no tempo real do navegador, sem slideshow ou render fora do jogo.
 await page.waitForTimeout(19000);
 if(errors.length)throw Error("Erros do jogo: "+errors.join(" | "));
 const original=await page.video().path();
 await context.close();
 await rename(original,resolve(output,"lan_house_gameplay_live.webm"));
 console.log("Recorded real Chromium gameplay video.");
}finally{
 if(browser)await browser.close();
 await new Promise(ok=>server.close(ok));
}
