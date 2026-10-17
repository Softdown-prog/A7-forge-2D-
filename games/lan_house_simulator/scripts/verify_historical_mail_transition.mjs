// Navegador real: de 2004 a 2005, sem reiniciar história ou substituir save no reload.
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {chromium} from "playwright";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {scheduleDecisions,chooseDecision} from "../dist/js/sim/decisions.js";
import {processStoryFollowups} from "../dist/js/sim/storyEvents.js";
import {DAY_MINUTES,GAME_SAVE_KEY} from "../dist/js/sim/types.js";
import {DAYS_PER_YEAR,GAME_FIRST_YEAR} from "../dist/js/sim/mailCalendar.js";
import {parseImportedSave,serializeSave} from "../dist/js/sim/saveTransfer.js";

const uniform="school-uniform-policy",gpu="gpu-games-2005";
const at=(s,y,d)=>{s.totalMinutes=((y-GAME_FIRST_YEAR)*DAYS_PER_YEAR+d-1)*DAY_MINUTES;};
const fixture=createGame(286,"historical");fixture.cash=1500;
for(let d=121;d<=150;d++){at(fixture,2004,d);scheduleDecisions(fixture);if(fixture.notices.some(n=>n.id===uniform))break;}
assert.ok(fixture.notices.some(n=>n.id===uniform));
assert.equal(chooseDecision(fixture,uniform,"uniform-talk").ok,true);
const first=fixture.storyRecords.find(r=>r.id===uniform);
fixture.totalMinutes=(first.dueDay-1)*DAY_MINUTES;
processStoryFollowups(fixture);
assert.equal(chooseDecision(fixture,uniform+":followup","story-maintain").ok,true);
fixture.totalMinutes=(first.dueDay-1)*DAY_MINUTES;
processStoryFollowups(fixture);
assert.equal(first.stage,"done");
for(let d=61;d<=90;d++){at(fixture,2005,d);scheduleDecisions(fixture);if(fixture.notices.some(n=>n.id===gpu))break;}
assert.ok(fixture.notices.some(n=>n.id===gpu));
assert.equal(isValidSave(parseImportedSave(serializeSave(fixture))),true);
const output=resolve(process.argv[2]??"out/validation");
await mkdir(output,{recursive:true});
const server=spawn(process.execPath,[resolve(import.meta.dirname,"serve.mjs")],{stdio:["ignore","pipe","inherit"]});
let browser;
try{
 await new Promise((ok,fail)=>{
  server.stdout.once("data",ok);server.once("error",fail);
  server.once("exit",c=>fail(Error("Servidor local terminou: "+c)));
 });
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 const reports=[];
 for(const width of [1280,414,360]){
  const mobile=width<700;
  const context=await browser.newContext({viewport:{width,height:850},isMobile:mobile,hasTouch:mobile});
  await context.addInitScript(({key,state})=>{
   if(localStorage.getItem(key)===null)localStorage.setItem(key,JSON.stringify(state));
   localStorage.setItem("lhs.sound","off");
  },{key:GAME_SAVE_KEY,state:fixture});
  const page=await context.newPage(),errors=[];
  page.on("pageerror",e=>errors.push(String(e)));
  const press=async selector=>mobile?page.locator(selector).tap():page.locator(selector).click();
  await page.goto("http://127.0.0.1:4173",{waitUntil:"networkidle"});
  await press("#menu-continue");await press("#open-notices");
  const list=page.locator("#notices-list");
  assert.match(await list.innerText(),/2005: jogos avançados pedem placa de vídeo/);
  assert.match(await list.innerText(),/2004: alunos de uniforme durante as aulas/);
  assert.match(await list.innerText(),/Windows compatível/);
  for(const choice of ["gpu-plan","gpu-survey","gpu-defer"]){
   assert.equal(await list.locator('button[data-decision="'+gpu+'"][data-choice="'+choice+'"]').count(),1);
  }
  await list.screenshot({path:resolve(output,"historic_gpu_mail_"+width+".png")});
  const chosen=width===1280?"gpu-survey":"gpu-defer";
  await press('button[data-decision="'+gpu+'"][data-choice="'+chosen+'"]');
  assert.equal(await list.locator('button[data-decision="'+gpu+'"]').count(),0);
  const getState=async()=>page.evaluate(key=>{
   const raw=JSON.parse(localStorage.getItem(key)||"null");
   return raw?.state??raw;
  },GAME_SAVE_KEY);
  const selected=await getState();
  assert.equal(selected.notices.find(n=>n.id===gpu)?.resolved,chosen);
  assert.equal(selected.notices.find(n=>n.id===uniform)?.resolved,"uniform-talk");
  assert.equal(selected.storyRecords.filter(r=>r.id===uniform).length,1);
  assert.equal(selected.storyRecords.filter(r=>r.id===gpu).length,1);
  assert.equal(isValidSave(selected),true);
  await page.reload({waitUntil:"networkidle"});
  await press("#menu-continue");await press("#open-notices");
  const restored=await getState();
  assert.equal(restored.notices.find(n=>n.id===gpu)?.resolved,chosen);
  assert.equal(restored.notices.find(n=>n.id===uniform)?.resolved,"uniform-talk");
  assert.equal(restored.storySeenIds.filter(id=>id===gpu).length,1);
  assert.equal(await page.locator('button[data-decision="'+gpu+'"]').count(),0);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=3,"Conteúdo excede largura "+width+": "+overflow);
  assert.deepEqual(errors,[]);
  reports.push({width,firstYear:2004,secondYear:2005,chosen,persisted:true,overflow});
  await context.close();
 }
 await writeFile(resolve(output,"historic_mail_2004_2005.json"),JSON.stringify({reports,passed:true},null,2));
 console.log(JSON.stringify({reports,passed:true}));
}finally{await browser?.close();server.kill();}
