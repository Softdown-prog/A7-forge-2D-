// Filmagem do jogo REAL no navegador, de sexta 21h59 até depois da meia-noite.
// Sem desenhar clientes por fora do Canvas e sem mexer na simulação após iniciar.
import {chromium} from "playwright";
import {createServer} from "node:http";
import {mkdir,readFile,writeFile,rename} from "node:fs/promises";
import {resolve,sep,extname} from "node:path";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {licenseGames} from "../dist/js/sim/economy.js";
import {licenseWindows} from "../dist/js/sim/era.js";
import {licenseEraGame,ERIC_MULTIPLAYER_GAME_ID} from "../dist/js/sim/eraGames.js";
import {toggleStationPower} from "../dist/js/sim/stationPower.js";
import {DAY_MINUTES,GAME_SAVE_KEY} from "../dist/js/sim/types.js";
import {firstFridayEligibility,draftFridayMeetup} from "../dist/js/sim/fridayMeetup.js";
import {confirmFridayMeetup} from "../dist/js/sim/nightMeetup.js";
import {selectNightTournament} from "../dist/js/sim/nightTournament.js";
import {dismissPrivacyNotice} from "./privacyNoticeTest.mjs";
const root=resolve(import.meta.dirname,"../dist"),output=resolve(process.argv[2]??"out/night-video");
await mkdir(output,{recursive:true});
const recordKnockout=process.env.LHS_RECORD_KNOCKOUT==="1";
const recordTournament=recordKnockout||process.env.LHS_RECORD_TOURNAMENT==="1";
const mime={".html":"text/html",".js":"text/javascript",".css":"text/css",".png":"image/png",".svg":"image/svg+xml",".webp":"image/webp",".ogg":"audio/ogg"};
const server=createServer(async(req,res)=>{
 try{
  const url=decodeURIComponent(new URL(req.url??"/","http://127.0.0.1").pathname);
  const f=resolve(root,"."+(url==="/"?"/index.html":url));
  if(f!==root&&!f.startsWith(root+sep)){res.writeHead(403).end();return;}
  const data=await readFile(f);
  res.writeHead(200,{"Content-Type":mime[extname(f)]??"application/octet-stream"});res.end(data);
 }catch{res.writeHead(404).end();}
});
await new Promise(ok=>server.listen(0,"127.0.0.1",ok));
const s=createGame(9182,"historical");
s.totalMinutes=3*360*DAY_MINUTES;
s.cash=8000;s.multiplayerRoundsPlayed=1;
function ok(r){if(!r.ok)throw Error(r.message);}
ok(licenseGames(s));
for(let pc=0;pc<3;pc++){
 ok(toggleStationPower(s,pc));ok(licenseWindows(s,pc,"win98"));ok(toggleStationPower(s,pc));
}
ok(licenseEraGame(s,ERIC_MULTIPLAYER_GAME_ID));
const friday=firstFridayEligibility(s).friday;
ok(draftFridayMeetup(s,2));
if(recordTournament)ok(selectNightTournament(s,recordKnockout?"knockout":"tournament"));
ok(confirmFridayMeetup(s));
s.totalMinutes=friday*DAY_MINUTES-1;
if(!isValidSave(s))throw Error("Save de sexta inválido.");
const result={friday,checkpoints:[],observedNight:false,observedPaid:false,
 observedRound:false,uniquePcs:0,observedScores:false,observedHud:false,
 observedKnockout:false,knockout:recordKnockout,tournament:recordTournament,errors:[]};
let browser;
try{
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 const context=await browser.newContext({viewport:{width:1280,height:850},
  deviceScaleFactor:1,recordVideo:{dir:output,size:{width:1280,height:850}}});
 const page=await context.newPage();
 page.on("pageerror",e=>result.errors.push(String(e)));
 await page.addInitScript(({key,payload})=>localStorage.setItem(key,JSON.stringify(payload)),{key:GAME_SAVE_KEY,payload:s});
 await page.goto("http://127.0.0.1:"+server.address().port+"/",{waitUntil:"networkidle"});
 await dismissPrivacyNotice(page);
 await page.locator("#menu-continue").click();
 await page.locator("#game-app").waitFor({state:"visible"});
 await page.locator("#game").scrollIntoViewIfNeeded();
 if(recordTournament){
  const hud=page.locator("#night-tournament-hud");
  await hud.waitFor({state:"visible"});
  await hud.locator("summary").click();
  await hud.scrollIntoViewIfNeeded();
 }
 for(let second=0;second<(recordKnockout?95:60);second++){
  await page.waitForTimeout(1000);
  if(second%3!==0)continue;
  const m=await page.evaluate(key=>{
   const s=JSON.parse(localStorage.getItem(key)??"null");if(!s)return null;
   const n=s.nightMeetup;
   return n?{time:n.elapsed,phase:n.phase,paid:n.paidIds.length,started:n.startedAt??null,
    scores:n.tournament?.scores.map(row=>({id:row.id,points:row.points,rounds:row.rounds}))??null,
    bracket:n.tournament?.bracket?.matches.map(m=>({stage:m.stage,players:m.playerIds,
     points:m.points,rounds:m.rounds,winnerId:m.winnerId??null}))??null,
    participants:n.memberIds.map(id=>{
     const c=s.customers.find(c=>c.id===id);
     return {id,stage:c?.stage??"missing",pc:c?.pcIndex??null};
    })}:null;
  },GAME_SAVE_KEY);
  if(!m)continue;
  result.observedNight=true;
  if(m.paid===2)result.observedPaid=true;
  if(m.started!==null){
   result.observedRound=true;
   result.uniquePcs=Math.max(result.uniquePcs,
    new Set(m.participants.filter(x=>x.pc!==null).map(x=>x.pc)).size);
  }
  if(recordTournament&&m.scores?.some(row=>row.points>0))result.observedScores=true;
  if(recordKnockout&&m.bracket?.some(match=>match.rounds>0))result.observedKnockout=true;
  if(recordTournament&&await page.locator("#night-tournament-hud").isVisible())result.observedHud=true;
  result.checkpoints.push({second:second+1,...m});
  if([15,34,48].includes(second))await page.screenshot({
   path:resolve(output,"corujao_gameplay_real_"+(second+1)+".png")});
 }
 const video=await page.video().path();
 await context.close();
 await rename(video,resolve(output,"corujao_gameplay_canvas_original.webm"));
 if(result.errors.length)throw Error(result.errors.join(" | "));
 if(recordTournament&&(!result.observedScores||!result.observedHud||
   (recordKnockout&&!result.observedKnockout)))
  throw Error("Confronto/placar não comprovados no jogo original: "+JSON.stringify(result));
 if(!result.observedNight||!result.observedPaid||!result.observedRound||result.uniquePcs<2)
  throw Error("Não comprovou jogo noturno real: "+JSON.stringify(result));
 console.log("OK: gameplay verdadeiro, pagamento por pessoa, dois PCs distintos após meia-noite.");
}finally{
 await writeFile(resolve(output,"evidencia_corujão.json"),JSON.stringify(result,null,2));
 if(browser)await browser.close();
 await new Promise(ok=>server.close(ok));
}
