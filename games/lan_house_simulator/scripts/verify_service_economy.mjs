import {dismissPrivacyNotice} from './privacyNoticeTest.mjs';
import {selectAdminArea,selectTask} from './management_navigation.mjs';
// Cenários históricos reais nos painéis: amortização, preços, demanda potencial e mobile.
import {chromium} from "playwright";
import {spawn} from "node:child_process";
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import assert from "node:assert/strict";
import {createGame} from "../dist/js/sim/engine.js";
import {DAY_MINUTES,GAME_SAVE_KEY} from "../dist/js/sim/types.js";
import {buyPrinter,printPaperInkCost} from "../dist/js/sim/printService.js";
import {buyDiscCopier} from "../dist/js/sim/discCopy.js";

const out=resolve(process.argv[2]??"out/service-economy");
await mkdir(out,{recursive:true});
const server=spawn(process.execPath,[resolve(import.meta.dirname,"serve.mjs")],{stdio:["ignore","pipe","inherit"]});
let browser;
try{
 await new Promise((ok,fail)=>{server.stdout.once("data",ok);server.once("error",fail);
  server.once("exit",code=>fail(Error("Server exited: "+code)));});
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 const reports=[];
 for(const width of [1280,414,360])for(const year of [1998,2001,2025]){
  const mobile=width<700,s=createGame(year,"historical");
  s.cash=20000;s.totalMinutes=(year-1998)*360*DAY_MINUTES;
  assert.equal(buyPrinter(s).ok,true);
  if(year>=2001)assert.equal(buyDiscCopier(s).ok,true);
  const context=await browser.newContext({viewport:{width,height:930},isMobile:mobile,hasTouch:mobile});
  await context.addInitScript(({key,state})=>{
   localStorage.setItem(key,JSON.stringify(state));localStorage.setItem("lhs.sound","off");
  },{key:GAME_SAVE_KEY,state:s});
  const page=await context.newPage(),errors=[];
  page.on("pageerror",e=>errors.push(String(e)));
  await page.goto("http://127.0.0.1:4173",{waitUntil:"networkidle"});
   await dismissPrivacyNotice(page,typeof mobile!=='undefined'?mobile:width<700);
  const click=async sel=>mobile?await page.locator(sel).tap():await page.locator(sel).click();
  await click("#menu-continue");await click("#open-admin");await selectAdminArea(page,'prices');await selectTask(page,'prices','printing');
  const printer=page.locator("#print-service-panel"),disc=page.locator("#disc-copy-panel");
  assert.equal(await printer.isVisible(),true);
  assert.equal(await disc.isVisible(),false,"Other service is in a separate task page");
  const pText=await page.locator("#print-service-capacity").innerText();
  assert.match(pText,/Faltam/);assert.match(pText,/320,00/);assert.match(pText,/Procura avulsa potencial/);
  let dText="";
  if(year>=2001){
   await selectTask(page,"prices","discs");assert.equal(await disc.isVisible(),true);
   dText=await page.locator("#disc-copy-capacity").innerText();
   assert.match(dText,/Faltam/);assert.match(dText,/900,00/);assert.match(dText,/Procura avulsa potencial/);
  }
  await selectTask(page,"prices","printing");
  if(year===2025){
   const cost=printPaperInkCost(s);
   assert.ok(cost>.5);
   // O controle deve reconhecer uma tarifa abaixo do custo de papel e tinta.
   const down=page.locator('[data-print-delta="-0.5"]');
   for(let k=0;k<40;k++){
    if(await down.isDisabled())break;
    await (mobile?down.tap():down.click());
   }
   const warn=await page.locator("#print-service-panel .disc-copy-cost").innerText();
   assert.match(warn,/prejuízo/);
   assert.match(await page.locator("#print-service-capacity").innerText(),/Faltam/);
  }
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=3,year+"/"+width+": overflow "+overflow);
  assert.deepEqual(errors,[]);
  reports.push({year,width,printerText:pText,copierText:dText,overflow,errors});
  await context.close();
 }
 await writeFile(resolve(out,"service_economy_validation.json"),JSON.stringify({reports},null,2));
 console.log(JSON.stringify({verified:reports.length,widths:[1280,414,360],years:[1998,2001,2025],errors:0}));
}finally{await browser?.close();server.kill();}
