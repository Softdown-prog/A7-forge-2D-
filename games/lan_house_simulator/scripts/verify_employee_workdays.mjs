import {dismissPrivacyNotice} from './privacyNoticeTest.mjs';
import {selectAdminArea} from './management_navigation.mjs';
// Exercita contratos mensais com diária somente de serviço em navegador desktop e mobile.
import assert from "node:assert/strict";
import {chromium} from "playwright";
import {spawn} from "node:child_process";
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {createGame} from "../dist/js/sim/engine.js";
import {GAME_SAVE_KEY} from "../dist/js/sim/types.js";
import {hireEmployee} from "../dist/js/sim/staff.js";
import {dispatchHiredStaff} from "../dist/js/sim/services.js";

const output=resolve(process.argv[2]??"out/employee-workdays");
await mkdir(output,{recursive:true});
const server=spawn(process.execPath,[resolve(import.meta.dirname,"serve.mjs")],{stdio:["ignore","pipe","inherit"]});
let browser;
try{
 await new Promise((ok,fail)=>{server.stdout.once("data",ok);server.once("error",fail);
  server.once("exit",code=>fail(Error("Server stopped "+code)));});
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 const results=[];
 for(const width of [1280,414,360])for(const scenario of ["idle","working","legacy"]){
  const mobile=width<700;
  const s=createGame(width,"historical");s.cash=3000;
  s.pcPoweredOff=[true,true,true];
  hireEmployee(s,"cleaner");hireEmployee(s,"technician");
  if(scenario==="working"){
   s.binFill=[80,0];s.pcWear=[100,0,0];dispatchHiredStaff(s);
   assert.equal(s.employeePayrollAccrued,18);
  }else if(scenario==="legacy"){
   s.employeeLastAccruedDay={cleaner:1,technician:1};
   s.employeePayrollAccrued=42;
   delete s.employeeWorkedDays;
  }
  const ctx=await browser.newContext({viewport:{width,height:920},isMobile:mobile,hasTouch:mobile});
  await ctx.addInitScript(({key,state})=>{localStorage.setItem(key,JSON.stringify(state));
    localStorage.setItem("lhs.sound","off");},{key:GAME_SAVE_KEY,state:s});
  const page=await ctx.newPage(),errors=[];
  page.on("pageerror",e=>errors.push(String(e)));
  await page.goto("http://127.0.0.1:4173",{waitUntil:"networkidle"});
   await dismissPrivacyNotice(page,typeof mobile!=='undefined'?mobile:width<700);
  const press=async sel=>mobile?await page.locator(sel).tap():await page.locator(sel).click();
  await press("#menu-continue");await press("#open-admin");await selectAdminArea(page,'services');
  const summary=await page.locator("#staff-summary").innerText();
  const clean=await page.locator("#clean-bins").innerText(),tech=await page.locator("#hire-technician").innerText();
  assert.match(summary,/Contratos mensais sem diária ociosa/);
  assert.match(summary,/dias trabalhados neste mês: faxineiro/);
  assert.match(clean,/Dispensar faxineiro/);assert.match(tech,/Dispensar técnico/);
  if(scenario==="idle"){assert.match(summary,/folha acumulada R\$ 0/);assert.match(summary,/faxineiro 0, técnico 0/);}
  if(scenario==="working"){assert.match(summary,/folha acumulada R\$ 18/);assert.match(summary,/faxineiro 1, técnico 1/);}
  if(scenario==="legacy"){assert.match(summary,/folha acumulada R\$ 42/);assert.match(summary,/faxineiro 0, técnico 0/);}
  if(width===1280)await page.locator("#section-services").screenshot({path:resolve(output,scenario+"_services.png")});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=3,scenario+"/"+width+": "+overflow);
  assert.deepEqual(errors,[]);
  results.push({width,scenario,summary,overflow,errors});
  await ctx.close();
 }
 await writeFile(resolve(output,"employee_workdays_validation.json"),JSON.stringify({results},null,2));
 console.log(JSON.stringify({scenarios:results.length,ok:true}));
}finally{await browser?.close();server.kill();}
