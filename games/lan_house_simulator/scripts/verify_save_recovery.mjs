import {dismissPrivacyNotice} from './privacyNoticeTest.mjs';
// Regression in the real browser: recovery, quota warning and retry on desktop/mobile.
import {chromium} from "playwright";
import {spawn} from "node:child_process";
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import assert from "node:assert/strict";
import {createGame} from "../dist/js/sim/engine.js";
import {GAME_SAVE_KEY} from "../dist/js/sim/types.js";
import {GAME_SAVE_BACKUP_KEY} from "../dist/js/sim/localSave.js";

const output=resolve(process.argv[2]??"out/save-recovery");
await mkdir(output,{recursive:true});
const server=spawn(process.execPath,[resolve(import.meta.dirname,"serve.mjs")],{stdio:["ignore","pipe","inherit"]});
let browser;
try {
 await new Promise((ok,fail)=>{
  server.stdout.once("data",ok);
  server.once("error",fail);
  server.once("exit",code=>fail(Error("Server stopped: "+code)));
 });
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 const reports=[];
 for(const width of [1280,414,360]){
  const mobile=width<700;
  const context=await browser.newContext({viewport:{width,height:920},isMobile:mobile,hasTouch:mobile,acceptDownloads:true});
  const page=await context.newPage(),errors=[];
  page.on("pageerror",error=>errors.push(String(error)));
  const click=async selector=>mobile?page.locator(selector).tap():page.locator(selector).click();
  await page.goto("http://127.0.0.1:4173",{waitUntil:"networkidle"});
   await dismissPrivacyNotice(page,typeof mobile!=='undefined'?mobile:width<700);
  const fixture=createGame(width,"historical");
  fixture.cash=6384.50;fixture.served=4600;fixture.totalMinutes=22*360*720+25;
  await page.evaluate(({primary,backup,state})=>{
   localStorage.setItem(primary,"{");
   localStorage.setItem(backup,JSON.stringify(state));
  },{primary:GAME_SAVE_KEY,backup:GAME_SAVE_BACKUP_KEY,state:fixture});
  await page.reload({waitUntil:"networkidle"});
  assert.match(await page.locator("#save-message").innerText(),/recuperada/i);
  assert.equal(await page.locator("#menu-continue").isEnabled(),true);
  assert.equal(await page.locator("#save-export").isEnabled(),true);
  const downloadPromise=page.waitForEvent("download");
  await click("#save-export");
  const download=await downloadPromise;
  assert.match(download.suggestedFilename(),/lan-house-simulator-dia-.*\.json$/);
  await click("#menu-continue");
  // Force an actual save failure after the game has started.
  await page.evaluate(primary=>{
   window.__qaSetItem=Storage.prototype.setItem;
   Storage.prototype.setItem=function(key,value){
    if(key===primary)throw Error("quota exceeded");
    return window.__qaSetItem.call(this,key,value);
   };
   window.dispatchEvent(new Event("beforeunload"));
  },GAME_SAVE_KEY);
  assert.match(await page.locator("#autosave-state").innerText(),/Falha ao salvar/i);
  assert.equal(await page.locator(".hud-autosave").getAttribute("data-state"),"error");
  const visible=await page.locator(".hud-autosave").isVisible();
  assert.equal(visible,true,"Failure must be visible even on narrow screens");
  // Restoring storage must repair the primary without erasing the valid backup.
  await page.evaluate(()=>{
   Storage.prototype.setItem=window.__qaSetItem;
   window.dispatchEvent(new Event("beforeunload"));
  });
  assert.match(await page.locator("#autosave-state").innerText(),/Salvo neste navegador/);
  assert.equal(await page.locator(".hud-autosave").getAttribute("data-state"),null);
  const persisted=await page.evaluate(({primary,backup})=>({
   current:JSON.parse(localStorage.getItem(primary)),
   checkpoint:JSON.parse(localStorage.getItem(backup)),
   overflow:document.documentElement.scrollWidth-innerWidth
  }),{primary:GAME_SAVE_KEY,backup:GAME_SAVE_BACKUP_KEY});
  assert.equal(persisted.current.served,fixture.served);
  assert.equal(persisted.checkpoint.cash,fixture.cash);
  assert.ok(persisted.overflow<=3,"No horizontal overflow");
  assert.deepEqual(errors,[]);
  reports.push({width,recovered:true,exported:true,failedSaveVisible:visible,retryOk:true,overflow:persisted.overflow});
  await context.close();
 }
 await writeFile(resolve(output,"save_recovery_validation.json"),JSON.stringify({reports},null,2));
 console.log(JSON.stringify({reports}));
}finally{
 await browser?.close();
 server.kill();
}
