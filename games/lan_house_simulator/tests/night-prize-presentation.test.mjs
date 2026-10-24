import test from "node:test";
import assert from "node:assert/strict";
import {createGame,isValidSave,stepGame} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {draftFridayMeetup} from "../dist/js/sim/fridayMeetup.js";
import {confirmFridayMeetup} from "../dist/js/sim/nightMeetup.js";
import {selectNightTournament} from "../dist/js/sim/nightTournament.js";
import {nightPrizePresentation,prizeAmountText} from "../dist/js/render/nightPrizePresentation.js";
import {licenseGames} from "../dist/js/sim/economy.js";
import {licenseWindows} from "../dist/js/sim/era.js";
import {licenseEraGame,ERIC_MULTIPLAYER_GAME_ID} from "../dist/js/sim/eraGames.js";
import {toggleStationPower} from "../dist/js/sim/stationPower.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";

function fixture(seats,format="knockout"){
 let s=createGame(719,"historical");
 s.totalMinutes=3*360*DAY_MINUTES;s.cash=15000;s.multiplayerRoundsPlayed=1;
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
 s.totalMinutes=friday*DAY_MINUTES-1;
 stepGame(s,1);
 assert.ok(s.nightMeetup);
 while(s.nightMeetup.elapsed<539)stepGame(s,1);
 assert.equal(isValidSave(s),true);
 assert.equal(nightPrizePresentation(s),undefined,"nada de prêmio antes das 7h");
 return s;
}

for(const seats of [2,3]){
 test(seats+" participantes: prêmio às 7h, uma despesa e nenhum pagamento repetido",()=>{
  let s=fixture(seats);
  const cashBefore=s.cash,expenseBefore=s.expenses;
  const customersBefore=new Map(s.customers.map(c=>[c.id,c.wallet]));
  stepGame(s,1);
  assert.equal(s.nightMeetup.elapsed,540);
  const t=s.nightMeetup.tournament;
  assert.equal(t.settled,true);
  assert.ok(t.prizePaid>0&&t.prizePaid<=40);
  const winner=t.winnerId;
  assert.ok(winner&&s.nightMeetup.paidIds.includes(winner));
  assert.equal(Number((cashBefore-s.cash).toFixed(2)),t.prizePaid);
  assert.equal(Number((s.expenses-expenseBefore).toFixed(2)),t.prizePaid);
  assert.equal(Number((s.customers.find(c=>c.id===winner).wallet-customersBefore.get(winner)).toFixed(2)),t.prizePaid);
  assert.deepEqual(nightPrizePresentation(s),{
   fridayDay:s.nightMeetup.fridayDay,winnerId:winner,
   amount:t.prizePaid,elapsed:540,ageMinutes:0
  });
  const snapshot=JSON.stringify(s);
  nightPrizePresentation(s);
  assert.equal(JSON.stringify(s),snapshot,"apresentação não altera o dinheiro");
  s=parseImportedSave(serializeSave(s));
  assert.equal(nightPrizePresentation(s).winnerId,winner);
  const beforeSecond=s.cash,spentSecond=s.expenses,paid=t.prizePaid;
  for(let i=0;i<11;i++)stepGame(s,1);
  assert.equal(s.nightMeetup.tournament.prizePaid,paid);
  assert.equal(s.cash,beforeSecond);
  assert.equal(s.expenses,spentSecond);
  assert.equal(nightPrizePresentation(s),undefined,"aviso some sem simular segunda entrega");
  while(s.nightMeetup)stepGame(s,1);
  assert.equal(nightPrizePresentation(s),undefined);
  assert.equal(s.lastNightMeetup.tournament.prizePaid,paid);
  assert.equal(isValidSave(s),true);
 });
}
test("sem dinheiro em caixa não mostra prêmio imaginário",()=>{
 const s=fixture(2);
 s.cash=0;
 stepGame(s,1);
 assert.equal(s.nightMeetup.tournament.settled,true);
 assert.equal(s.nightMeetup.tournament.prizePaid,0);
 assert.equal(nightPrizePresentation(s),undefined);
 assert.equal(isValidSave(s),true);
});
test("encontro livre não mostra premiação nem aviso",()=>{
 const s=fixture(2,"free");
 stepGame(s,1);
 assert.equal(s.nightMeetup.tournament,undefined);
 assert.equal(nightPrizePresentation(s),undefined);
});
test("formatação pt-BR do valor realmente debitado",()=>{
 assert.equal(prizeAmountText(31.25),"R$ 31,25");
});
