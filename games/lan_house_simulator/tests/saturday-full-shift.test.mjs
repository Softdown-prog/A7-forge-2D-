import test from "node:test";
import assert from "node:assert/strict";
import {createGame,stepGame,isValidSave,displayTime,visitorArrivalChance} from "../dist/js/sim/engine.js";
import {DAY_MINUTES,LAST_ADMISSION_MINUTE} from "../dist/js/sim/types.js";
import {draftFridayMeetup} from "../dist/js/sim/fridayMeetup.js";
import {confirmFridayMeetup} from "../dist/js/sim/nightMeetup.js";
import {selectNightTournament} from "../dist/js/sim/nightTournament.js";
import {licenseGames} from "../dist/js/sim/economy.js";
import {licenseWindows} from "../dist/js/sim/era.js";
import {licenseEraGame,ERIC_MULTIPLAYER_GAME_ID} from "../dist/js/sim/eraGames.js";
import {toggleStationPower} from "../dist/js/sim/stationPower.js";
import {nightReopeningPresentation} from "../dist/js/render/nightReopening.js";
import {counterQueueCustomers} from "../dist/js/sim/checkoutQueue.js";
import {firstRetailCustomer} from "../dist/js/sim/retailQueue.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";

function makeSaturday(seed,seats,format){
 const s=createGame(seed,"historical");
 s.totalMinutes=3*360*DAY_MINUTES;
 s.cash=15000;s.multiplayerRoundsPlayed=1;
 assert.equal(licenseGames(s).ok,true);
 for(let pc=0;pc<3;pc++){
  assert.equal(toggleStationPower(s,pc).ok,true);
  assert.equal(licenseWindows(s,pc,"win98").ok,true);
  assert.equal(toggleStationPower(s,pc).ok,true);
 }
 assert.equal(licenseEraGame(s,ERIC_MULTIPLAYER_GAME_ID).ok,true);
 assert.equal(draftFridayMeetup(s,seats).ok,true);
 assert.equal(selectNightTournament(s,format).ok,true);
 assert.equal(confirmFridayMeetup(s).ok,true);
 const friday=s.fridayMeetupDraft.fridayDay;
 s.totalMinutes=friday*DAY_MINUTES-1;
 stepGame(s,1);
 for(let t=0;t<720&&s.nightMeetup;t++)stepGame(s,1);
 assert.equal(s.nightMeetup,undefined);
 assert.equal(s.totalMinutes,friday*DAY_MINUTES);
 assert.equal(displayTime(s),"10:00");
 assert.equal(isValidSave(s),true);
 return {s,friday};
}

for(const [seed,seats,format] of [[147,2,"knockout"],[482,3,"knockout"],[9182,2,"free"]]){
 test("sábado completo após corujão: seed "+seed+" e "+seats+" participantes",()=>{
  let {s,friday}=makeSaturday(seed,seats,format);
  const frozenNight=JSON.stringify(s.lastNightMeetup);
  const frozenTrophies=JSON.stringify(s.nightTournamentTrophies??[]);
  const startId=s.nextCustomerId,startRevenue=s.revenue,startServed=s.served,startPurchases=s.purchases;
  const seen=new Set(),stageTrace=new Set();
  let arrivals=0,used=false,paid=false,shopping=false,sales=0;
  let maxQueue=0,maxRetail=0,stagesAtClosing=[];
  // Todas as 12 horas após a reabertura, sempre pelo motor e nunca por
  // mutação artificial de cliente. A simulação inclui a saída final às 22h.
  for(let minute=1;minute<=720;minute++){
   const beforeIds=new Set(s.customers.map(c=>c.id));
   stepGame(s,1);
   assert.equal(s.totalMinutes,friday*DAY_MINUTES+minute);
   if(minute===720)break;
   assert.equal(s.nightMeetup,undefined);
   assert.ok(s.customers.every(c=>c.nightMeetupDay===undefined),"sem visitante noturno");
   const queue=counterQueueCustomers(s);
   assert.equal(new Set(queue.map(c=>c.id)).size,queue.length);
   assert.ok(queue.length<=10,"limite físico de lugares no balcão");
   maxQueue=Math.max(maxQueue,queue.length);
   const shoppers=s.customers.filter(c=>c.stage==="shopping");
   maxRetail=Math.max(maxRetail,shoppers.length);
   for(const c of shoppers){
    shopping=true;stageTrace.add("shopping");
    if(c.desiredItem)assert.equal(firstRetailCustomer(s,c.desiredItem)!==undefined,true);
   }
   for(const c of s.customers){
    if(c.id>=startId){
     seen.add(c.id);
     stageTrace.add(c.stage);
     if(c.stage==="using"&&c.pcIndex!==null)used=true;
    }
    if(!beforeIds.has(c.id))arrivals++;
   }
   if(s.served>startServed)paid=true;
   sales=Math.max(sales,s.purchases-startPurchases);
   if(minute===LAST_ADMISSION_MINUTE){
    assert.equal(visitorArrivalChance(s,0),0,"sem entradas às 20h30");
   }
   if(minute===660){
    const p=nightReopeningPresentation(s);
    assert.equal(p?.phase,"closing","21h começa a dispersão");
    assert.equal(p?.customersNow,s.customers.length);
    assert.equal(p?.remainingGuests,s.customers.length);
    const immutability=JSON.stringify(s);
    nightReopeningPresentation(s);
    assert.equal(JSON.stringify(s),immutability,"placa não altera a partida");
    s=parseImportedSave(serializeSave(s));
    assert.equal(isValidSave(s),true,"salvar na hora de fechar");
    assert.equal(nightReopeningPresentation(s)?.phase,"closing");
   }
   if(minute>=690){
    stagesAtClosing=s.customers.filter(c=>c.stage!=="leaving").map(c=>c.stage);
    assert.deepEqual(stagesAtClosing,[],"após 21h30 ninguém fica retido no caixa, compras ou PC");
   }
  }
  assert.ok(arrivals>0&&seen.size>0&&paid&&used,"dia teve visita pagante e sessão real");
  assert.ok(s.revenue>startRevenue&&s.served>startServed,"cobranças diurnas reais");
  assert.equal(JSON.stringify(s.lastNightMeetup),frozenNight);
  assert.equal(JSON.stringify(s.nightTournamentTrophies??[]),frozenTrophies);
  assert.equal(s.totalMinutes,(friday+1)*DAY_MINUTES);
  assert.equal(s.nightMeetup,undefined);
  assert.equal(displayTime(s),"10:00","domingo abre uma só vez");
  assert.equal(nightReopeningPresentation(s),undefined,"sábado encerrado, nenhuma placa antiga");
  assert.equal(isValidSave(s),true);
  assert.equal(visitorArrivalChance(s,0)>0,true,"domingo pode admitir");
  const next=parseImportedSave(serializeSave(s));
  for(let t=0;t<35;t++)stepGame(next,1);
  assert.ok(next.customers.every(c=>c.nightMeetupDay===undefined));
  assert.equal(isValidSave(next),true);
  assert.equal(JSON.stringify(next.lastNightMeetup),frozenNight);
  assert.ok(maxQueue>=0&&maxRetail>=0&&sales>=0&&shopping!==undefined);
  assert.ok(stageTrace.has("using"));
 });
}
test("a placa de fechamento não ressurge domingo nem na sexta de um save antigo",()=>{
 const {s,friday}=makeSaturday(771,2,"free");
 for(let i=0;i<660;i++)stepGame(s,1);
 assert.equal(nightReopeningPresentation(s)?.phase,"closing");
 assert.equal(nightReopeningPresentation(s)?.fridayDay,friday);
 const outgoing=s.customers.filter(c=>c.stage==="leaving").length;
 assert.ok(nightReopeningPresentation(s).details.includes(outgoing+" saindo"));
 for(let i=660;i<720;i++)stepGame(s,1);
 assert.equal(nightReopeningPresentation(s),undefined);
});
