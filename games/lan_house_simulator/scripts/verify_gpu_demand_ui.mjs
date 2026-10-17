// Integração real da aba Licenças e do histórico persistente de procura.
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {chromium} from "playwright";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {DAY_MINUTES,GAME_SAVE_KEY} from "../dist/js/sim/types.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {licenseGames} from "../dist/js/sim/economy.js";
import {buyPlatform} from "../dist/js/sim/hardware.js";
import {buyGpu} from "../dist/js/sim/gpu.js";
import {licenseWindows} from "../dist/js/sim/era.js";
import {licenseGpuGame} from "../dist/js/sim/gpuGames.js";
import {withStationOff} from "../tests/station-power-fixture.mjs";

const out=resolve(process.argv[2]??"out/validation");
await mkdir(out,{recursive:true});
const s=createGame(1549,"historical");
s.totalMinutes=(2013-1998)*360*DAY_MINUTES;
s.cash=25000;
for(const result of [
 licenseGames(s),
 withStationOff(s,1,()=>buyPlatform(s,1,"platform05")),
 withStationOff(s,1,()=>buyGpu(s,1,"gpu05")),
 withStationOff(s,1,()=>licenseWindows(s,1,"winxp")),
 licenseGpuGame(s,"neon-rush")
])assert.equal(result.ok,true,result.message);
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
   assert.match(all,/Cobertura da licença por adicionais recebidos/);
   assert.match(all,/3,50 de R\$\s*580,00/);
   assert.match(all,/Não inclui GPU, Windows, energia ou demais despesas; não é lucro/);
   assert.match(all,/Remover do PC 2/);
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
   assert.ok(overflow<=3,"Largura excedida em "+width+": "+overflow);
   return {overflow,preview:all.slice(0,180)};
  };
  await page.goto("http://127.0.0.1:4173",{waitUntil:"networkidle"});
  const first=await check();
  const button=page.locator('[data-gpu-game-install="neon-rush"][data-gpu-game-pc="1"]');
  await (mobile?button.tap():button.click());
  assert.match(await page.locator("#gpu-game-catalog").innerText(),/Instalar no PC 2/);
  const bulk=page.locator('[data-gpu-game-install-all="neon-rush"]');
  assert.match(await bulk.innerText(),/1\/1/);
  await (mobile?bulk.tap():bulk.click());
  assert.match(await page.locator("#gpu-game-catalog").innerText(),/Cancelar download PC 2/);
  const progress=page.locator('[aria-label="Download de Neon Rush Online no PC 2"]');
  assert.equal(await progress.count(),1);
  // Download em progresso persistente em desktop e mobile.
  await page.reload({waitUntil:"networkidle"});
  await press("#menu-continue");await press("#open-admin");await press('[data-admin-tab="licenses"]');
  const restored=page.locator('[data-gpu-game-install="neon-rush"][data-gpu-game-pc="1"]');
  assert.match(await page.locator("#gpu-game-catalog").innerText(),/Cancelar download PC 2/);
  const cancel=page.locator('[data-gpu-game-cancel="neon-rush"][data-gpu-game-pc="1"]');
  await (mobile?cancel.tap():cancel.click());
  assert.match(await page.locator("#gpu-game-catalog").innerText(),/Instalar no PC 2/);
  const retry=page.locator('[data-gpu-game-install="neon-rush"][data-gpu-game-pc="1"]');
  await (mobile?retry.tap():retry.click());
  assert.match(await page.locator("#gpu-game-catalog").innerText(),/Cancelar download PC 2/);
  await page.reload({waitUntil:"networkidle"});
  await press("#menu-continue");await press("#open-admin");await press('[data-admin-tab="licenses"]');
  assert.match(await page.locator("#gpu-game-catalog").innerText(),/Cancelar download PC 2/);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=3,"Download causou rolagem horizontal em "+width);
  const second={overflow,preview:(await page.locator("#gpu-game-catalog").innerText()).slice(0,180)};
  await page.locator("#section-licenses").screenshot({path:resolve(out,"gpu_demand_licenses_"+width+".png")});
  assert.deepEqual(errors,[]);
  reports.push({width,initial:first.overflow,reload:second.overflow,persisted:true});
  await context.close();
 }
 await writeFile(resolve(out,"gpu_demand_ui.json"),JSON.stringify({reports,passed:true},null,2));
 console.log(JSON.stringify({reports,passed:true}));
}finally{await browser?.close();server.kill();}
