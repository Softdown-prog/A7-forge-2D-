// Valida um cliente real que entra apenas para fazer cópias de CD/DVD.
import {chromium} from "playwright";
import {spawn} from "node:child_process";
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import assert from "node:assert/strict";
import {createGame} from "../dist/js/sim/engine.js";
import {buyDiscCopier} from "../dist/js/sim/discCopy.js";
import {counterQueueSlot} from "../dist/js/sim/checkoutQueue.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";

const output=resolve(process.argv[2]??"out/disc-walk-in");
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
  const context=await browser.newContext({viewport:{width,height:920},isMobile:mobile,hasTouch:mobile});
  const page=await context.newPage(),errors=[];
  page.on("pageerror",error=>errors.push(String(error)));
  const fixture=createGame(width,"historical");
  fixture.totalMinutes=3*360*DAY_MINUTES;
  fixture.cash=5000;
  fixture.pcPoweredOff=[true,true,true];
  assert.equal(buyDiscCopier(fixture).ok,true);
  const counter=counterQueueSlot(0,fixture);
  fixture.customers=[{id:15,x:counter.x,y:counter.y,target:{...counter},stage:"waiting",queueIndex:0,
   costume:"regular",serviceRequest:"disc-copy",wallet:40,pcIndex:null,usedMinutes:0,waitingMinutes:0,
   offlineWait:0,happy:true}];
  fixture.nextCustomerId=16;
  await page.addInitScript(state=>localStorage.setItem("lhs-save-v1",JSON.stringify(state)),fixture);
  await page.goto("http://127.0.0.1:4173",{waitUntil:"networkidle"});
  const press=loc=>mobile?loc.tap():loc.click();
  await press(page.locator("#menu-continue"));
  await page.waitForFunction(()=>document.querySelector("#events")?.textContent?.includes("Cliente avulso copiou"),null,{timeout:9000});
  await press(page.locator("#open-admin"));
  assert.equal(await page.locator("#admin-served").innerText(),"1");
  await page.waitForFunction(()=>document.querySelector("#disc-copy-summary")?.textContent?.includes("1 cliente atendido exclusivamente para cópias"),null,{timeout:2500});
  await press(page.locator('[data-admin-tab="finance"]'));
  assert.match(await page.locator("#finance").innerText(),/PCs 0 · Impressões avulsas 0 · Cópias avulsas 1/);
  await page.evaluate(()=>window.dispatchEvent(new Event("beforeunload")));
  const state=await page.evaluate(()=>JSON.parse(localStorage.getItem("lhs-save-v1")));
  assert.equal(state.served,0);
  assert.equal(state.discCopier.walkIns,1);
  assert.ok(state.discCopier.cdCopies+state.discCopier.dvdCopies>0);
  assert.deepEqual(state.pcWear,[0,0,0]);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=3);
  assert.deepEqual(errors,[]);
  reports.push({width,copies:state.discCopier.cdCopies+state.discCopier.dvdCopies,
   walkIns:state.discCopier.walkIns,pcSessions:state.served,overflow});
  await context.close();
 }
 await writeFile(resolve(output,"disc_walk_in_validation.json"),JSON.stringify({reports},null,2));
 console.log(JSON.stringify({reports}));
}finally{
 await browser?.close();server.kill();
}
