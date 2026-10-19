import {dismissPrivacyNotice} from './privacyNoticeTest.mjs';
import {selectAdminArea,selectTask} from './management_navigation.mjs';
// E2: real game walk-in printing checkout, accounting and responsive interface.
import {chromium} from "playwright";
import {spawn} from "node:child_process";
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import assert from "node:assert/strict";
import {createGame} from "../dist/js/sim/engine.js";
import {buyPrinter} from "../dist/js/sim/printService.js";
import {counterQueueSlot} from "../dist/js/sim/checkoutQueue.js";

const output=resolve(process.argv[2]??"out/print-walk-in");
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
  const mobile=width<700,context=await browser.newContext({viewport:{width,height:920},isMobile:mobile,hasTouch:mobile});
  const page=await context.newPage(),errors=[];
  page.on("pageerror",e=>errors.push(String(e)));
  const fixture=createGame(width,"historical");
  fixture.cash=5000;fixture.pcPoweredOff=[true,true,true];
  buyPrinter(fixture);fixture.totalMinutes=60;
  const counter=counterQueueSlot(0,fixture);
  fixture.customers=[{id:4,x:counter.x,y:counter.y,target:{...counter},stage:"waiting",queueIndex:0,
   costume:"regular",serviceRequest:"printing",wallet:30,pcIndex:null,usedMinutes:0,waitingMinutes:0,
   offlineWait:0,happy:true}];
  fixture.nextCustomerId=5;
  await page.addInitScript(state=>localStorage.setItem("lhs-save-v1",JSON.stringify(state)),fixture);
  await page.goto("http://127.0.0.1:4173",{waitUntil:"networkidle"});
   await dismissPrivacyNotice(page,typeof mobile!=='undefined'?mobile:width<700);
  const press=selector=>mobile?page.locator(selector).tap():page.locator(selector).click();
  await press("#menu-continue");
  await page.waitForFunction(()=>document.querySelector("#events")?.textContent?.includes("Cliente avulso imprimiu"),null,{timeout:9000});
  await press("#open-admin");
  if(!await page.locator(".management-summary").evaluate(node=>node.open))await page.locator(".management-summary > summary").click();
  assert.equal(await page.locator("#admin-served").innerText(),"1");
  await selectAdminArea(page,"prices");await selectTask(page,"prices","printing");
  assert.match(await page.locator("#print-service-summary").innerText(),/1 cliente atendido exclusivamente para imprimir/);
  await selectAdminArea(page,'finance');await page.locator('.management-summary').evaluate(node=>node.open=true);
  assert.match(await page.locator("#finance").innerText(),/PCs 0 · Impressões avulsas 1/);
  await page.evaluate(()=>window.dispatchEvent(new Event("beforeunload")));
  const state=await page.evaluate(()=>JSON.parse(localStorage.getItem("lhs-save-v1")));
  assert.equal(state.served,0);
  assert.equal(state.printer.walkIns,1);
  assert.equal(state.printer.pages>0,true);
  assert.deepEqual(state.pcWear,[0,0,0]);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=3);
  assert.deepEqual(errors,[]);
  reports.push({width,printedPages:state.printer.pages,walkIns:state.printer.walkIns,pcSessions:state.served,overflow});
  await context.close();
 }
 await writeFile(resolve(output,"print_walk_in_validation.json"),JSON.stringify({reports},null,2));
 console.log(JSON.stringify({reports}));
}finally{
 await browser?.close();
 server.kill();
}
