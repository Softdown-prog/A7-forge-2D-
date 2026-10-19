// Confere a carta histórica e suas escolhas no navegador real, em desktop/mobile.
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {chromium} from "playwright";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {scheduleDecisions} from "../dist/js/sim/decisions.js";
import {DAY_MINUTES,GAME_SAVE_KEY} from "../dist/js/sim/types.js";
import {DAYS_PER_YEAR} from "../dist/js/sim/mailCalendar.js";
import {serializeSave} from "../dist/js/sim/saveTransfer.js";

const out=resolve(process.argv[2]??"out/validation");await mkdir(out,{recursive:true});
const s=createGame(756,"historical");s.cash=1200;
for(let d=121;d<=150;d++){
 s.totalMinutes=((2004-1998)*DAYS_PER_YEAR+d-1)*DAY_MINUTES;
 scheduleDecisions(s);
 if(s.notices?.some(n=>n.id==="school-uniform-policy"))break;
}
assert.ok(s.notices.some(n=>n.id==="school-uniform-policy"));
assert.equal(isValidSave(s),true);
const server=spawn(process.execPath,[resolve(import.meta.dirname,"serve.mjs")],{stdio:["ignore","pipe","inherit"]});
let browser;
try{
 await new Promise((ok,fail)=>{
  server.stdout.once("data",ok);server.once("error",fail);
  server.once("exit",code=>fail(Error("Local server exited "+code)));
 });
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 const checks=[];
 for(const width of [1280,414,360]){
  const context=await browser.newContext({viewport:{width,height:850},isMobile:width<700,hasTouch:width<700});
  await context.addInitScript(({key,state})=>{
    // AddInitScript executa novamente no reload: nunca substituir um save
    // já gravado pelo jogo durante o teste de persistência.
    if(localStorage.getItem(key)===null)localStorage.setItem(key,JSON.stringify(state));
    localStorage.setItem("lhs.sound","off");
  },{key:GAME_SAVE_KEY,state:s});
  const page=await context.newPage(),errors=[];
  page.on("pageerror",e=>errors.push(String(e)));
  await page.goto("http://127.0.0.1:4173",{waitUntil:"networkidle"});
  const press=async sel=>width<700?await page.locator(sel).tap():await page.locator(sel).click();
  // Privacy notice is a real blocking overlay; choose explicitly rather than
  // bypassing pointer checks. Preserve consent across the reload below.
  const consent=page.locator("#privacy-banner");
  if(await consent.isVisible()){
   await press("#privacy-reject");
   await consent.waitFor({state:"hidden"});
  }
  await press("#menu-continue");await press("#open-notices");
  const notices=page.locator("#notices-list");
  assert.match(await notices.innerText(),/2004: alunos de uniforme durante as aulas/);
  assert.match(await notices.innerText(),/não uma proibição nacional/);
  for(const choice of ["uniform-post-rule","uniform-talk","uniform-ignore"]){
   const btn=notices.locator('button[data-decision="school-uniform-policy"][data-choice="'+choice+'"]');
   assert.equal(await btn.count(),1);
  }
  await notices.screenshot({path:resolve(out,"school_uniform_2004_"+width+".png")});
  await press('button[data-decision="school-uniform-policy"][data-choice="uniform-talk"]');
  await page.waitForTimeout(100);
  const afterChoice=await page.evaluate(key=>{
    const stored=localStorage.getItem(key);
    let saved=null;try{saved=stored?JSON.parse(stored):null;}catch{}
    const state=saved?.state??saved;
    return {resolved:state?.notices?.find(n=>n.id==="school-uniform-policy")?.resolved,
      storyRecords:state?.storyRecords?.filter(r=>r.id==="school-uniform-policy"),
      toast:document.getElementById("status")?.textContent,
      text:document.getElementById("notices-list")?.textContent?.slice(0,650)};
  },GAME_SAVE_KEY);
  assert.match(await notices.innerText(),/Decisão tomada/,
    "Escolha nao confirmada: "+JSON.stringify(afterChoice)+" errors "+JSON.stringify(errors));
  const duplicated=await notices.locator('button[data-decision="school-uniform-policy"]').count();
  assert.equal(duplicated,0,"não pode oferecer nova compra da mesma decisão");
  await page.reload({waitUntil:"networkidle"});
  await press("#menu-continue");await press("#open-notices");
  assert.match(await page.locator("#notices-list").innerText(),/Decisão tomada/);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=3,"interface invadiu viewport "+width+": "+overflow);
  assert.deepEqual(errors,[]);
  checks.push({width,options:3,choice:"uniform-talk",persisted:true,overflow});
  await context.close();
 }
 await writeFile(resolve(out,"school_uniform_2004_validation.json"),JSON.stringify({checks},null,2));
 console.log(JSON.stringify({checks,passed:true}));
}finally{await browser?.close();server.kill();}
