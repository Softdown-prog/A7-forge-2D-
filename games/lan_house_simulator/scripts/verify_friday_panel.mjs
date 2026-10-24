// Verifica a página de planejamento dentro do JOGO ORIGINAL em Chromium.
// Não há cena artificial nem alteração do relógio para provar que uma noite funciona.
import {chromium} from "playwright";
import {createServer} from "node:http";
import {mkdir,readFile,writeFile} from "node:fs/promises";
import {extname,resolve,sep} from "node:path";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {licenseGames} from "../dist/js/sim/economy.js";
import {licenseWindows} from "../dist/js/sim/era.js";
import {licenseEraGame,ERIC_MULTIPLAYER_GAME_ID} from "../dist/js/sim/eraGames.js";
import {toggleStationPower} from "../dist/js/sim/stationPower.js";
import {GAME_SAVE_KEY,DAY_MINUTES} from "../dist/js/sim/types.js";
import {selectAdminArea} from "./management_navigation.mjs";
import {dismissPrivacyNotice} from "./privacyNoticeTest.mjs";
const root=resolve(import.meta.dirname,"../dist"),out=resolve(process.argv[2]??"out/friday-panel");
await mkdir(out,{recursive:true});
const server=createServer(async(req,res)=>{
 try{
  const url=decodeURIComponent(new URL(req.url??"/","http://127.0.0.1").pathname);
  const file=resolve(root,"."+(url==="/"?"/index.html":url));
  if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403).end();return;}
  const mime={".html":"text/html",".js":"text/javascript",".css":"text/css",".png":"image/png",".svg":"image/svg+xml"};
  res.writeHead(200,{"Content-Type":mime[extname(file)]??"application/octet-stream"});
  res.end(await readFile(file));
 }catch{res.writeHead(404).end();}
});
await new Promise(ok=>server.listen(0,"127.0.0.1",ok));
const state=createGame(147,"historical");
state.totalMinutes=3*360*DAY_MINUTES;
state.cash=15000;state.multiplayerRoundsPlayed=1;
function ok(result){if(!result.ok)throw Error(result.message);}
ok(licenseGames(state));
for(let i=0;i<3;i++){
 ok(toggleStationPower(state,i));
 ok(licenseWindows(state,i,"win98"));
 ok(toggleStationPower(state,i));
}
ok(licenseEraGame(state,ERIC_MULTIPLAYER_GAME_ID));
if(!isValidSave(state))throw Error("Save de teste inválido.");
let browser;
try{
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 const page=await browser.newPage({viewport:{width:1280,height:850}});
 const errors=[];page.on("pageerror",e=>errors.push(String(e)));
 await page.addInitScript(({key,payload})=>localStorage.setItem(key,JSON.stringify(payload)),
  {key:GAME_SAVE_KEY,payload:state});
 await page.goto("http://127.0.0.1:"+server.address().port+"/",{waitUntil:"networkidle"});
 await dismissPrivacyNotice(page);
 await page.locator("#menu-continue").click();
 await page.locator("#open-admin").click();
 await selectAdminArea(page,"finance");
 await page.locator('#section-finance [data-panel-choice="events"]').click();
 const btn=page.locator("#first-meetup-two");
 await btn.waitFor({state:"visible"});
 if(!await btn.isEnabled())throw Error("O estudo da sexta deveria estar disponível.");
 const initial=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),GAME_SAVE_KEY);
 await btn.click();
 await page.waitForFunction(()=>document.querySelector("#first-meetup-status")?.textContent?.includes("Rascunho salvo"));
 const draft=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),GAME_SAVE_KEY);
 if(draft.fridayMeetupDraft?.seats!==2||draft.fridayMeetupDraft.status!=="draft")
  throw Error("Rascunho não persistido no save.");
 for(const name of ["cash","revenue","expenses","served"]){
  if(draft[name]!==initial[name])throw Error("O estudo alterou "+name);
 }
 if(draft.totalMinutes<initial.totalMinutes||draft.totalMinutes>initial.totalMinutes+5)throw Error("O calendário avançou sem comando.");
 if(draft.customers.length!==initial.customers.length)throw Error("Foram criados visitantes fantasmas.");
 await page.screenshot({path:resolve(out,"primeira_sexta_painel_real.png")});
 const confirm=page.locator("#first-meetup-confirm");
 if(!await confirm.isEnabled())throw Error("Confirmar encontro deveria estar ativo.");
 await confirm.click();
 await page.waitForFunction(()=>document.querySelector("#first-meetup-status")?.textContent?.includes("CONFIRMADO"));
 const confirmed=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),GAME_SAVE_KEY);
 if(confirmed.fridayMeetupDraft?.status!=="confirmed")throw Error("Confirmação não gravada no save.");
 if(confirmed.cash!==draft.cash||confirmed.served!==draft.served||confirmed.revenue!==draft.revenue)
  throw Error("Confirmação cobrou antecipadamente ou inventou atendimento.");
 await page.screenshot({path:resolve(out,"primeira_sexta_confirmada_canvas_real.png")});
 await page.locator("#first-meetup-cancel").click();
 const cancelled=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),GAME_SAVE_KEY);
 if(cancelled.fridayMeetupDraft!==undefined)throw Error("Cancelamento não liberou o rascunho.");
 if(errors.length)throw Error(errors.join(" | "));
 await writeFile(resolve(out,"verificacao.json"),JSON.stringify({status:"pass",firstFridayDay:draft.fridayMeetupDraft.fridayDay,
  slots:2,savePreserved:true,confirmedWithoutUpfrontPayment:true,zeroExtraRevenue:true,interface:"jogo original"},null,2));
 console.log("OK: planejamento em painel real, save, cancelamento, sem receita nem NPCs.");
}finally{
 if(browser)await browser.close();
 await new Promise(ok=>server.close(ok));
}
