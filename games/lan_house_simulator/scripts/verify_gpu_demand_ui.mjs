// Integração real da aba Licenças e do histórico persistente de procura.
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {chromium} from "playwright";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {DAY_MINUTES,GAME_SAVE_KEY} from "../dist/js/sim/types.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";

const out=resolve(process.argv[2]??"out/validation");
await mkdir(out,{recursive:true});
const s=createGame(1549,"historical");
s.totalMinutes=(2013-1998)*360*DAY_MINUTES;
s.gpuGameDemand={
 "neon-rush":{requested:9,played:3,basic:4,premiumCents:350},
 "circuito-competitivo":{requested:5,played:1,basic:2,premiumCents:100}
};
assert.equal(isValidSave(parseImportedSave(serializeSave(s))),true);
const server=spawn(process.execPath,[resolve(import.meta.dirname,"serve.mjs")],{stdio:["ignore","pipe","inherit"]});
let browser;
try{
 await new Promise((ok,fail)=>{
  server.stdout.once("data",ok);server.once("error",fail);
  server.once("exit",code=>fail(Error("Servidor parou: "+code)));
 });
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 const reports=[];
 for(const width of [1280,414,360]){
  const mobile=width<700;
  const context=await browser.newContext({viewport:{width,height:920},isMobile:mobile,hasTouch:mobile});
  await context.addInitScript(({key,state})=>{
   if(localStorage.getItem(key)===null)localStorage.setItem(key,JSON.stringify(state));
   localStorage.setItem("lhs.sound","off");
  },{key:GAME_SAVE_KEY,state:s});
  const page=await context.newPage(),errors=[];
  page.on("pageerror",e=>errors.push(String(e)));
  const press=async selector=>mobile?page.locator(selector).tap():page.locator(selector).click();
  const check=async()=>{
   await press("#menu-continue");await press("#open-admin");
   await press('[data-admin-tab="licenses"]');
   const catalog=page.locator("#gpu-game-catalog");
   const all=await catalog.innerText();
   assert.match(all,/Neon Rush Online/);
   assert.match(all,/9 pedidos/);
   assert.match(all,/3 sessões no título/);
   assert.match(all,/4 sessões comuns/);
   assert.match(all,/2 pedidos sem sessão concluída/);
   assert.match(all,/3,50/);
   assert.match(all,/Circuito Competitivo/);
   assert.match(all,/5 pedidos/);
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
   assert.ok(overflow<=3,"Largura excedida em "+width+": "+overflow);
   return {overflow,preview:all.slice(0,180)};
  };
  await page.goto("http://127.0.0.1:4173",{waitUntil:"networkidle"});
  const first=await check();
  await page.locator("#section-licenses").screenshot({path:resolve(out,"gpu_demand_licenses_"+width+".png")});
  await page.reload({waitUntil:"networkidle"});
  const second=await check();
  assert.deepEqual(errors,[]);
  reports.push({width,initial:first.overflow,reload:second.overflow,persisted:true});
  await context.close();
 }
 await writeFile(resolve(out,"gpu_demand_ui.json"),JSON.stringify({reports,passed:true},null,2));
 console.log(JSON.stringify({reports,passed:true}));
}finally{await browser?.close();server.kill();}
