// Smoke real: menu and mobile pagehide must persist progress without an 8s wait.
import {chromium} from "playwright";
import {spawn} from "node:child_process";
import assert from "node:assert/strict";
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {createGame} from "../dist/js/sim/engine.js";
import {GAME_SAVE_KEY} from "../dist/js/sim/types.js";

const output=resolve(process.argv[2]??"out/save-on-menu");
await mkdir(output,{recursive:true});
const server=spawn(process.execPath,[resolve(import.meta.dirname,"serve.mjs")],{stdio:["ignore","pipe","inherit"]});
let browser;
try{
 await new Promise((ok,bad)=>{server.stdout.once("data",ok);server.once("error",bad);server.once("exit",code=>bad(Error("Server stopped: "+code)));});
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 const reports=[];
 for(const width of [1280,414]){
  const mobile=width<700;
  const context=await browser.newContext({viewport:{width,height:920},isMobile:mobile,hasTouch:mobile});
  const fixture=createGame(10000+width,"historical");fixture.totalMinutes=25;
  await context.addInitScript(({key,state})=>{
   if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(state));
   localStorage.setItem("lhs.sound","off");
  },{key:GAME_SAVE_KEY,state:fixture});
  const page=await context.newPage(),errors=[];
  page.on("pageerror",error=>errors.push(String(error)));
  const click=selector=>mobile?page.locator(selector).tap():page.locator(selector).click();
  const read=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),GAME_SAVE_KEY);
  await page.goto("http://127.0.0.1:4173",{waitUntil:"networkidle"});
  const consent=page.locator("#privacy-banner");
  if(await consent.isVisible()){
   await click("#privacy-reject");
   await consent.waitFor({state:"hidden"});
  }
  await click("#menu-continue");
  await page.waitForTimeout(1450); // < 8s autosave: exercise immediate explicit exit
  await click("#open-menu");
  const persisted=await read();
  assert.ok(persisted.totalMinutes>fixture.totalMinutes,
   "Returning to menu must save latest game time immediately ("+width+")");
  assert.equal(await page.locator("#menu-continue").isEnabled(),true);
  await page.reload({waitUntil:"networkidle"});
  const restarted=await read();
  assert.equal(restarted.totalMinutes,persisted.totalMinutes,"menu progress survives reload");
  assert.equal(await page.locator("#menu-continue").isEnabled(),true);
  await click("#menu-continue");
  await page.waitForTimeout(1200);
  // Mobile browsers can discard tabs without beforeunload.
  await page.evaluate(()=>window.dispatchEvent(new Event("pagehide")));
  const hiddenSave=await read();
  assert.ok(hiddenSave.totalMinutes>restarted.totalMinutes,
   "pagehide must save progress without waiting for interval ("+width+")");
  assert.deepEqual(errors,[]);
  reports.push({width,menuSaved:true,pagehideSaved:true,reloaded:true,elapsedMinutes:hiddenSave.totalMinutes-fixture.totalMinutes});
  await context.close();
 }
 await writeFile(resolve(output,"save_on_menu_validation.json"),JSON.stringify({reports},null,2)+"\n");
 console.log(JSON.stringify({reports}));
}finally{await browser?.close();server.kill();}
