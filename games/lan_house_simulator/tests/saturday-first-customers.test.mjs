import test from "node:test";
import assert from "node:assert/strict";
import {createGame,isValidSave,stepGame,visitorArrivalChance,displayTime} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {draftFridayMeetup} from "../dist/js/sim/fridayMeetup.js";
import {confirmFridayMeetup} from "../dist/js/sim/nightMeetup.js";
import {selectNightTournament} from "../dist/js/sim/nightTournament.js";
import {licenseGames} from "../dist/js/sim/economy.js";
import {licenseWindows} from "../dist/js/sim/era.js";
import {licenseEraGame,ERIC_MULTIPLAYER_GAME_ID} from "../dist/js/sim/eraGames.js";
import {toggleStationPower} from "../dist/js/sim/stationPower.js";
import {nightReopeningPresentation} from "../dist/js/render/nightReopening.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";

function fridayFixture(seed,seats,format="knockout"){
 const s=createGame(seed,"historical");
 s.totalMinutes=3*360*DAY_MINUTES;
 s.cash=15000;s.multiplayerRoundsPlayed=1;
 assert.equal(licenseGames(s).ok,true);
 for(let i=0;i<3;i++){
  assert.equal(toggleStationPower(s,i).ok,true);
  assert.equal(licenseWindows(s,i,"win98").ok,true);
  assert.equal(toggleStationPower(s,i).ok,true);
 }
 assert.equal(licenseEraGame(s,ERIC_MULTIPLAYER_GAME_ID).ok,true);
 assert.equal(draftFridayMeetup(s,seats).ok,true);
 assert.equal(selectNightTournament(s,format).ok,true);
 assert.equal(confirmFridayMeetup(s).ok,true);
 const friday=s.fridayMeetupDraft.fridayDay;
 s.totalMinutes=friday*DAY_MINUTES-1;stepGame(s,1);
 let ticks=0;
 while(s.nightMeetup&&ticks++<720)stepGame(s,1);
 assert.equal(s.nightMeetup,undefined);
 assert.equal(s.totalMinutes,friday*DAY_MINUTES);
 assert.equal(displayTime(s),"10:00");
 assert.ok(s.customers.every(c=>c.nightMeetupDay===undefined),"sem amigo fantasma");
 assert.ok(visitorArrivalChance(s,0)>0,"porta regular aberta no sábado");
 assert.equal(isValidSave(s),true);
 return {s,friday};
}

for(const [seed,seats,format] of [[147,2,"knockout"],[482,3,"knockout"],[9182,2,"free"]]){
 test("primeiros clientes reais de sábado: seed "+seed+", "+seats+" pessoas no corujão",()=>{
  let {s,friday}=fridayFixture(seed,seats,format);
  const nightResult=JSON.stringify(s.lastNightMeetup);
  const trophies=JSON.stringify(s.nightTournamentTrophies??[]);
  const initialCustomerId=s.nextCustomerId,initialRevenue=s.revenue,initialServed=s.served;
  let arrivalId,paidId,usedId;
  let maxLive=0;
  for(let i=0;i<360;i++){
   stepGame(s,1);
   const arrivals=s.customers.filter(c=>c.id>=initialCustomerId&&
      c.nightMeetupDay===undefined);
   maxLive=Math.max(maxLive,arrivals.length);
   if(arrivalId===undefined&&arrivals.length)arrivalId=arrivals[0].id;
   const paid=arrivals.find(c=>c.pcIndex!==null&&
      (c.stage==="to_pc"||c.stage==="sitting"||c.stage==="using"));
   if(paid&&paidId===undefined)paidId=paid.id;
   if(arrivals.some(c=>c.stage==="using"&&c.pcIndex!==null)){
    usedId=arrivals.find(c=>c.stage==="using"&&c.pcIndex!==null).id;
    break;
   }
  }
  assert.ok(maxLive>0&&arrivalId>=initialCustomerId,"clientes entram pela porta do jogo");
  assert.ok(paidId>=initialCustomerId&&usedId>=initialCustomerId,
   "cliente paga, caminha e realmente usa um PC de sábado");
  assert.ok(s.revenue>initialRevenue&&s.served>initialServed,
   "pagamento registrado uma única vez na economia diurna");
  assert.ok(s.customers.every(c=>c.nightMeetupDay===undefined));
  assert.equal(JSON.stringify(s.lastNightMeetup),nightResult,
   "a receita e o resultado do corujão são imutáveis no sábado");
  assert.equal(JSON.stringify(s.nightTournamentTrophies??[]),trophies);
  assert.equal(s.totalMinutes>=friday*DAY_MINUTES,true);
  assert.equal(isValidSave(s),true);
  const before=JSON.stringify(s);
  const view=nightReopeningPresentation(s);
  assert.equal(JSON.stringify(s),before,"UI do salão não altera o save");
  if(s.totalMinutes-friday*DAY_MINUTES<=120){
   assert.equal(view.phase,"service");
   assert.equal(view.customersNow,s.customers.length);
   assert.ok(view.atComputers>=1,"placar conta PCs usados de verdade");
  }
  const reloaded=parseImportedSave(serializeSave(s));
  assert.equal(reloaded.revenue,s.revenue);
  assert.equal(reloaded.served,s.served);
  assert.equal(isValidSave(reloaded),true);
  // A operação prossegue normalmente após o primeiro cliente e o reload.
  for(let i=0;i<40;i++)stepGame(reloaded,1);
  assert.equal(reloaded.nightMeetup,undefined);
  assert.equal(reloaded.lastNightMeetup.fridayDay,friday);
  assert.ok(reloaded.totalMinutes>s.totalMinutes);
  assert.ok(reloaded.customers.every(c=>c.nightMeetupDay===undefined));
  assert.equal(isValidSave(reloaded),true);
 });
}
test("o quadro diurno nunca anuncia movimentação em uma madrugada não concluída",()=>{
 const {s,friday}=fridayFixture(252,2);
 assert.equal(nightReopeningPresentation(s)?.phase,"open");
 stepGame(s,13);
 assert.equal(nightReopeningPresentation(s)?.phase,"service");
 const ui=nightReopeningPresentation(s);
 assert.equal(ui.fridayDay,friday);
 assert.equal(ui.customersNow,s.customers.length);
 assert.equal(ui.atComputers,
  s.customers.filter(c=>c.stage==="using"||c.stage==="sitting").length);
});
