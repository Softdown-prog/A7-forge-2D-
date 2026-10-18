import {selectAdminArea,selectTask} from './management_navigation.mjs';
// Purchase through actual application controls; no direct state mutation after load.
import {chromium} from "playwright";
import {spawn} from "node:child_process";
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import assert from "node:assert/strict";
import {createGame} from "../dist/js/sim/engine.js";
import {GAME_SAVE_KEY,DAY_MINUTES} from "../dist/js/sim/types.js";
const output=resolve(process.argv[2]??"out/hardware");await mkdir(output,{recursive:true});
const server=spawn(process.execPath,[resolve(import.meta.dirname,"serve.mjs")],{stdio:["ignore","pipe","inherit"]});
let browser;
try{
 await new Promise((ok,reject)=>{server.stdout.once("data",ok);server.once("error",reject);server.once("exit",code=>reject(Error("Servidor: "+code)));});
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 const checks=[],errors=[];
 for(const width of [1440,414,360])for(const year of [2000,2024]){
  const context=await browser.newContext({viewport:{width,height:950}}),s=createGame();
  s.totalMinutes=(year-1998)*360*DAY_MINUTES;s.cash=10000;s.licensedGames=true;s.contentFilterInstalled=true;s.pcWindowsLicenses=[true,true,true];
  await context.addInitScript(({key,state})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(state));localStorage.setItem("lhs.sound","off");},{key:GAME_SAVE_KEY,state:s});
  const page=await context.newPage();page.on("pageerror",e=>errors.push(String(e)));
  page.on("response",r=>{if(r.status()>=400)errors.push(r.status()+" "+r.url());});
  await page.goto("http://127.0.0.1:4173",{waitUntil:"networkidle"});
  const open=async()=>{await page.locator("#menu-continue").click();await page.locator("#open-admin").click();await selectAdminArea(page,'computers');};
  await open();
  await page.locator('[data-pc-power="1"]').click(); // Desligar PC 02 antes dos upgrades.
  await selectTask(page,"computers","hardware");
  // Resolve the live node and dispatch in one browser task across UI refreshes.
  const click=selector=>page.evaluate(selector=>{const node=document.querySelector(selector);if(!node||node.closest("button")?.disabled)throw Error("Controle indisponível: "+selector);node.dispatchEvent(new MouseEvent("click",{bubbles:true}));},selector);
  const bounds=async()=>{
   const b=await page.evaluate(()=>{const panel=document.querySelector("#admin");return {viewport:innerWidth,page:document.documentElement.scrollWidth,panel:panel.scrollWidth,client:panel.clientWidth};});
   assert.ok(b.page<=b.viewport+3&&b.panel<=b.client+3,JSON.stringify(b));
  };
  assert.match(await page.locator('[data-config-windows]').textContent(),/Windows 98/);
  assert.match(await page.locator('[data-config="cpu"]').textContent(),/350 MHz/);
  assert.match(await page.locator('[data-config="ram"]').textContent(),/64 MB/);
  assert.match(await page.locator('[data-config="storage"]').textContent(),/4 GB/);
  assert.match(await page.locator('[data-config="motherboard"]').textContent(),/Slot 1/);
  assert.match(await page.locator('[data-config="psu"]').textContent(),/350 W/);
  await click('[data-hardware-select="1"] .ui-icon');
  await page.locator('#hardware-select-1').focus();await page.waitForTimeout(650);
  assert.equal(await page.evaluate(()=>document.activeElement?.id),"hardware-select-1");
  if(year===2000){
   await selectTask(page,"computers","windows");
   assert.equal(await page.locator('[data-win-pc="1"][data-win-edition="winxp"]').isDisabled(),true);
   await selectTask(page,"computers","hardware");
   assert.equal(await page.locator('[data-hardware-kit="platform03"]').isDisabled(),true);
   await click('[data-hardware-tab="ram"] .ui-icon');assert.equal(await page.locator('[data-hardware-part="ram512d"]').isDisabled(),true);
   await click('[data-hardware-part="ram128"] .ui-icon');
   await click('[data-hardware-tab="cpu"] .ui-icon');await click('[data-hardware-part="cpu00"] .ui-icon');
   const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),GAME_SAVE_KEY);
   assert.deepEqual(saved.pcComponents,[null,{cpu:"cpu00",ram:"ram128",storage:"hd4",motherboard:"board98",psu:"psu350"},null]);
   assert.equal(saved.cash,9745);assert.equal(saved.expenses,255);
   assert.match(await page.locator('[data-config-windows]').textContent(),/Windows 98/);
   assert.match(await page.locator('[data-config="ram"]').textContent(),/128 MB/);
  }else{
   await selectTask(page,"computers","windows");
   assert.equal(await page.locator('[data-win-pc="1"][data-win-edition="win11"]').isDisabled(),true);
   await selectTask(page,"computers","hardware");
   await click('[data-hardware-kit="platform24"] .ui-icon');
   await selectTask(page,"computers","windows");
   assert.equal(await page.locator('[data-win-pc="1"][data-win-edition="win11"]').isEnabled(),true);
   await click('[data-win-pc="1"][data-win-edition="win11"] .ui-icon');
   await selectTask(page,"computers","hardware");
   await click('[data-hardware-tab="ram"] .ui-icon');await click('[data-hardware-part="ram64d5"] .ui-icon');
   await click('[data-hardware-tab="storage"] .ui-icon');await click('[data-hardware-part="nvme4000"] .ui-icon');
   const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),GAME_SAVE_KEY);
   assert.deepEqual(saved.pcWindows,["win98","win11","win98"]);assert.equal(saved.pcComponents[0],null);assert.equal(saved.pcComponents[2],null);
   assert.equal(saved.pcComponents[1].ram,"ram64d5");assert.equal(saved.pcComponents[1].storage,"nvme4000");
   assert.equal(saved.cash,2790);assert.equal(saved.expenses,7210);
   assert.match(await page.locator('[data-config-windows]').textContent(),/Windows 11/);
   assert.match(await page.locator('[data-config="storage"]').textContent(),/4 TB/);
   assert.match(await page.locator('[data-config="psu"]').textContent(),/1.000 W/);
   await click('[data-hardware-tab="cpu"] .ui-icon');
   assert.equal(await page.locator('[data-hardware-part="cpu24"]').isDisabled(),true);
   assert.equal(await page.locator('[data-hardware-part="cpu98"]').isDisabled(),true);
  }
  await selectAdminArea(page,'gpus');
  assert.equal(await page.locator('[data-gpu-select="1"]').getAttribute("aria-pressed"),"true","A estação acompanha a troca de abas");
  await selectAdminArea(page,'computers');await bounds();
  // QA screenshots are internal diagnostics, never the delivered artwork.
  await page.evaluate(()=>{
   const panel=document.getElementById("admin"),sheet=document.querySelector(".machine-sheet");
   if(panel&&sheet)panel.scrollTop+=sheet.getBoundingClientRect().top-panel.getBoundingClientRect().top-110;
  });
  await page.screenshot({path:resolve(output,`hardware_qa_${year}_${width}.png`)});
  await page.reload({waitUntil:"networkidle"});await open();await selectTask(page,"computers","hardware");await click('[data-hardware-select="1"] .ui-icon');
  assert.match(await page.locator('[data-config-windows]').textContent(),year===2000?/Windows 98/:/Windows 11/);
  assert.match(await page.locator('[data-config="ram"]').textContent(),year===2000?/128 MB/:/64 GB/);
  await click('[data-hardware-select="0"] .ui-icon');assert.match(await page.locator('[data-config-windows]').textContent(),/Windows 98/);
  assert.match(await page.locator('[data-config="cpu"]').textContent(),/350 MHz/);await bounds();
  checks.push({width,year,individualPurchase:true,legacyNeighbors:true,requirements:true,reload:true,keyboardFocus:true,noOverflow:true});
  await context.close();
 }
 assert.deepEqual(errors,[]);await writeFile(resolve(output,"hardware_ui_validation.json"),JSON.stringify(checks,null,2)+"\n");
 console.log(JSON.stringify({checks}));
}finally{await browser?.close();server.kill();}
