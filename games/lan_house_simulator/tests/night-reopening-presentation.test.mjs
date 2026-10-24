import test from "node:test";
import assert from "node:assert/strict";
import {createGame,isValidSave,stepGame} from "../dist/js/sim/engine.js";
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

function fixture(seats,mode="knockout"){
 const s=createGame(482,"historical");s.totalMinutes=3*360*DAY_MINUTES;
 s.cash=15000;s.multiplayerRoundsPlayed=1;
 assert.equal(licenseGames(s).ok,true);
 for(let i=0;i<3;i++){
  assert.equal(toggleStationPower(s,i).ok,true);
  assert.equal(licenseWindows(s,i,"win98").ok,true);
  assert.equal(toggleStationPower(s,i).ok,true);
 }
 assert.equal(licenseEraGame(s,ERIC_MULTIPLAYER_GAME_ID).ok,true);
 assert.equal(draftFridayMeetup(s,seats).ok,true);
 assert.equal(selectNightTournament(s,mode).ok,true);
 assert.equal(confirmFridayMeetup(s).ok,true);
 const friday=s.fridayMeetupDraft.fridayDay;
 s.totalMinutes=friday*DAY_MINUTES-1;
 stepGame(s,1);
 assert.ok(s.nightMeetup);
 return {s,friday};
}
function toMinute(s,target){
 for(let i=0;i<730&&s.nightMeetup&&s.nightMeetup.elapsed<target;i++)stepGame(s,1);
 assert.equal(s.nightMeetup?.elapsed,target,"marco de horário esperado");
}
for(const seats of [2,3]){
 test(seats+" amigos: despedida, abertura e ausência de segunda virada",()=>{
  let {s,friday}=fixture(seats);
  toMinute(s,539);
  assert.equal(nightReopeningPresentation(s),undefined,"antes das 7h não encerra");
  stepGame(s,1);
  const exit=nightReopeningPresentation(s);
  assert.equal(exit.phase,"farewell");
  assert.equal(exit.fridayDay,friday);
  assert.equal(exit.minutesUntilOpen,180);
  assert.equal(exit.progress,0);
  assert.equal(exit.remainingGuests,
   s.customers.filter(c=>c.nightMeetupDay===friday).length);
  const snapshot=JSON.stringify(s);
  nightReopeningPresentation(s);
  assert.equal(JSON.stringify(s),snapshot,"UI não pode alterar economia nem NPCs");
  s=parseImportedSave(serializeSave(s));
  toMinute(s,689);
  assert.equal(nightReopeningPresentation(s).phase,"farewell");
  stepGame(s,1);
  assert.equal(nightReopeningPresentation(s).phase,"preparing");
  assert.equal(nightReopeningPresentation(s).minutesUntilOpen,30);
  toMinute(s,719);
  assert.equal(nightReopeningPresentation(s).minutesUntilOpen,1);
  assert.equal(isValidSave(s),true);
  const before=s.totalMinutes,amount=s.cash,paid=s.nightMeetup.paidIds.length;
  const gross=s.nightMeetup.revenue+s.nightMeetup.retailRevenue;
  stepGame(s,1);
  assert.equal(s.nightMeetup,undefined);
  assert.equal(s.totalMinutes,before+1,"dia avança só uma vez");
  assert.equal(s.totalMinutes,friday*DAY_MINUTES);
  assert.ok(s.customers.every(c=>c.nightMeetupDay===undefined));
  assert.equal(s.lastNightMeetup.paid,paid);
  assert.equal(s.cash,amount,"abrir não cobra, paga ou estorna outra vez");
  const open=nightReopeningPresentation(s);
  assert.equal(open.phase,"open");
  assert.equal(open.remainingGuests,0);
  assert.equal(open.minutesUntilOpen,0);
  assert.ok(open.details.includes(gross.toFixed(2).replace(".",",")));
  assert.equal(isValidSave(s),true);
  s=parseImportedSave(serializeSave(s));
  assert.equal(nightReopeningPresentation(s)?.phase,"open","persistiu após carregar");
  stepGame(s,12);
  assert.equal(nightReopeningPresentation(s)?.phase,"open");
  stepGame(s,1);
  assert.equal(nightReopeningPresentation(s)?.phase,"service",
   "após o aviso, mostrar somente os clientes normais presentes");
  assert.equal(s.totalMinutes,friday*DAY_MINUTES+13);
  stepGame(s,108);
  assert.equal(nightReopeningPresentation(s),undefined,"sem painel permanente após meio-dia");
  assert.equal(isValidSave(s),true);
 });
}
test("a reabertura também aparece em corujão livre, sem prêmio fictício",()=>{
 const {s}=fixture(2,"free");
 toMinute(s,719);
 assert.equal(nightReopeningPresentation(s).phase,"preparing");
 stepGame(s,1);
 assert.equal(nightReopeningPresentation(s).phase,"open");
 assert.equal(s.lastNightMeetup.tournament,undefined);
});
test("dia comum e última sexta antiga não geram aviso de abertura",()=>{
 const {s}=fixture(2);
 toMinute(s,719);stepGame(s,1);
 // stepGame limita cada chamada a 120 minutos; avançar o último separadamente.
 stepGame(s,120);stepGame(s,1);
 assert.equal(nightReopeningPresentation(s),undefined);
});
