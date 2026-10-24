// Regressão real: tocar em um móvel no salão Android, escolher destino,
// confirmar, salvar e recuperar. Usa o Canvas, não chama funções de UI internas.
import {chromium} from "playwright";
import {createServer} from "node:http";
import {mkdir,readFile,writeFile} from "node:fs/promises";
import {extname,resolve,sep} from "node:path";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {placeFurniture} from "../dist/js/sim/shop.js";
import {editableObjects} from "../dist/js/sim/editableObjects.js";
import {cameraForGame,iso} from "../dist/js/render/isometric.js";
import {GAME_SAVE_KEY} from "../dist/js/sim/types.js";
import {dismissPrivacyNotice} from "./privacyNoticeTest.mjs";

const root=resolve(import.meta.dirname,"../dist"),out=resolve(process.argv[2]??"out/mobile-furniture");
await mkdir(out,{recursive:true});
const server=createServer(async(req,res)=>{
 try{
  const uri=decodeURIComponent(new URL(req.url??"/","http://127.0.0.1").pathname);
  const path=resolve(root,"."+(uri==="/"?"/index.html":uri));
  if(path!==root&&!path.startsWith(root+sep)){res.writeHead(403).end();return;}
  const mime={".html":"text/html",".js":"text/javascript",".css":"text/css",".png":"image/png",".svg":"image/svg+xml"};
  res.writeHead(200,{"Content-Type":mime[extname(path)]??"application/octet-stream"});
  res.end(await readFile(path));
 }catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const state=createGame(308);state.cash=20000;
const created=placeFurniture(state,"table","floor-2");
if(!created.ok||!isValidSave(state))throw Error("Não foi possível preparar uma mesa real: "+created.message);
const pageErrors=[];let browser;
try{
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
 const page=await context.newPage();page.on("pageerror",e=>pageErrors.push(String(e)));
 await page.addInitScript(({key,data})=>{
  if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(data));
 },{key:GAME_SAVE_KEY,data:state});
 const url="http://127.0.0.1:"+server.address().port+"/";
 await page.goto(url,{waitUntil:"networkidle"});
 await dismissPrivacyNotice(page);
 await page.locator("#menu-continue").click();
 async function openEditor(){
  await page.locator("#open-shop").click();
  await page.locator("#organize-furniture").click();
  await page.locator("#layout-editor").waitFor({state:"visible"});
 }
 async function tapCanvas(p){
  await page.evaluate(({x,y})=>{
   const canvas=document.querySelector("#game"),view=document.querySelector("#scene-viewport");
   view.scrollLeft=x/canvas.width*canvas.offsetWidth-view.clientWidth/2;
   view.scrollTop=y/canvas.height*canvas.offsetHeight-view.clientHeight/2;
   view.scrollIntoView({block:"center",behavior:"instant"});
  },p);
  const rect=await page.locator("#game").boundingBox();
  if(!rect)throw Error("O canvas do salão não está visível.");
  const location={x:rect.x+p.x/1000*rect.width,y:rect.y+p.y/610*rect.height};
  if(location.y<0||location.y>=844||location.x<0||location.x>=390)
   throw Error("Destino fora da tela mobile: "+JSON.stringify(location));
  await page.touchscreen.tap(location.x,location.y);
 }
 function furniturePoint(s,id){
  const item=editableObjects(s).find(o=>o.id===id);
  if(!item)throw Error("Objeto ausente: "+id);
  const z=item.surface==="wall"?135:item.kind==="pc"?50:
   item.kind==="counter"?45:["soda","candy","shelf"].includes(item.kind)?50:20;
  return iso({x:item.x+item.w/2,y:item.y+item.d/2},cameraForGame(s),z);
 }
 const initial={...state};
 await openEditor();
 await tapCanvas(furniturePoint(state,"decor:floor-2"));
 const selected=await page.locator("#layout-object").inputValue();
 if(selected!=="decor:floor-2")throw Error("Toque não selecionou a mesa na tela: "+selected);
 const beforeTap=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),GAME_SAVE_KEY);
 if(!beforeTap.furniturePlacements.some(p=>p.slotId==="floor-2"))
  throw Error("A seleção por toque moveu o móvel prematuramente.");
 const dest=iso({x:6.15+.25,y:5.17+.2},cameraForGame(state));
 await tapCanvas(dest);
 const conf=page.locator("#layout-confirm");
 if(!await conf.isEnabled())
  throw Error("Destino da mesa inválido no celular: "+await page.locator("#layout-message").textContent());
 await conf.click();
 await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key)).furniturePlacements.some(p=>p.slotId==="floor-4"),GAME_SAVE_KEY);
 const saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),GAME_SAVE_KEY);
 if(saved.furniture.table!==1||saved.furniturePlacements.some(p=>p.slotId==="floor-2")||
  !saved.furniturePlacements.some(p=>p.slotId==="floor-4"))
  throw Error("A mesa não mudou de posição após a confirmação.");
 await page.screenshot({path:resolve(out,"mesa_movida_por_toque_android.png"),fullPage:true});
 await page.locator("#layout-close").click();
 // O mesmo fluxo deve funcionar para os equipamentos fixos.
 await openEditor();
 await tapCanvas(furniturePoint(saved,"soda"));
 const selectedMachine=await page.locator("#layout-object").inputValue();
 if(selectedMachine!=="soda")throw Error("Toque não selecionou a máquina: "+selectedMachine);
 await tapCanvas(iso({x:6+.33,y:3+.3},cameraForGame(saved)));
 if(!await conf.isEnabled())
  throw Error("Destino da máquina inválido: "+await page.locator("#layout-message").textContent());
 await conf.click();
 await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key)).objectPlacements?.some(p=>p.id==="soda"&&p.x===6&&p.y===3),GAME_SAVE_KEY);
 await page.screenshot({path:resolve(out,"maquina_movida_por_toque_android.png"),fullPage:true});
 await page.reload({waitUntil:"networkidle"});
 await dismissPrivacyNotice(page);
 await page.locator("#menu-continue").click();
 const final=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),GAME_SAVE_KEY);
 if(!isValidSave(final)||!final.furniturePlacements.some(p=>p.slotId==="floor-4")||
  !final.objectPlacements.some(p=>p.id==="soda"&&p.x===6&&p.y===3))
  throw Error("As posições não sobreviveram ao reload no celular.");
 if(pageErrors.length)throw Error(pageErrors.join(" | "));
 await writeFile(resolve(out,"resultado.json"),JSON.stringify({
  status:"pass",screen:"390x844",touch:true,
  tableMoved:true,machineMoved:true,reloaded:true,source:"original game Canvas"
 },null,2));
 console.log("OK: Android touch moveu mesa e máquina pelo Canvas, confirmou e recarregou.");
}finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
