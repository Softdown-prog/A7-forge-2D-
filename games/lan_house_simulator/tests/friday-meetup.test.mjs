import test from "node:test";
import assert from "node:assert/strict";
import {createGame,isValidSave,stepGame} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {weekdayName,weekdayIndex,nextFridayDay,campaignDate,currentCampaignDay} from "../dist/js/sim/campaignWeek.js";
import {firstFridayEligibility,draftFridayMeetup,cancelFridayMeetupDraft} from "../dist/js/sim/fridayMeetup.js";
import {licenseWindows} from "../dist/js/sim/era.js";
import {licenseEraGame,ERIC_MULTIPLAYER_GAME_ID} from "../dist/js/sim/eraGames.js";
import {licenseGames} from "../dist/js/sim/economy.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {withStationOff} from "./station-power-fixture.mjs";

test("semana de 7 dias permanece contínua nos meses de 30 e anos de 360 dias",()=>{
 assert.equal(weekdayName(1),"quinta-feira");
 assert.equal(weekdayName(2),"sexta-feira");
 assert.equal(weekdayName(3),"sábado");
 assert.equal(nextFridayDay(1),2);
 assert.equal(nextFridayDay(2),9);
 assert.equal(nextFridayDay(2,true),2);
 for(let day=1;day<=360*5;day++){
  assert.equal(weekdayIndex(day+7),weekdayIndex(day));
  const next=nextFridayDay(day);
  assert.ok(next>day&&next-day<=7);
  assert.equal(weekdayIndex(next),4);
  if(day>1)assert.equal(weekdayIndex(day),(weekdayIndex(day-1)+1)%7);
 }
 assert.equal(campaignDate(360),"30/12/1998");
 assert.equal(campaignDate(361),"01/01/1999");
 assert.notEqual(weekdayName(1),weekdayName(361),
  "o calendário fictício não reinicia a semana a cada janeiro");
});

function ready(){
 const s=createGame(324,"historical");
 s.totalMinutes=3*360*DAY_MINUTES;s.cash=15000;
 s.multiplayerRoundsPlayed=1;
 assert.equal(licenseGames(s).ok,true);
 for(let i=0;i<3;i++)
  assert.equal(withStationOff(s,i,()=>licenseWindows(s,i,"win98")).ok,true);
 assert.equal(licenseEraGame(s,ERIC_MULTIPLAYER_GAME_ID).ok,true);
 return s;
}
test("rascunho da sexta não cobra, reserva PCs ou interfere em saves antigos",()=>{
 const s=ready(),quote=firstFridayEligibility(s);
 assert.equal(quote.ready,true,quote.reasons.join(" | "));
 assert.equal(weekdayIndex(quote.friday),4);
 const before={money:s.cash,revenue:s.revenue,expenses:s.expenses,served:s.served,
  customers:s.customers.length,history:s.multiplayerRoundsPlayed};
 assert.equal(draftFridayMeetup(s,2).ok,true);
 assert.deepEqual(s.fridayMeetupDraft,{fridayDay:quote.friday,seats:2,status:"draft"});
 assert.deepEqual({money:s.cash,revenue:s.revenue,expenses:s.expenses,served:s.served,
  customers:s.customers.length,history:s.multiplayerRoundsPlayed},before);
 assert.equal(isValidSave(s),true);
 const copy=parseImportedSave(serializeSave(s));
 assert.deepEqual(copy.fridayMeetupDraft,s.fridayMeetupDraft);
 assert.equal(isValidSave(copy),true);
 assert.equal(cancelFridayMeetupDraft(s).ok,true);
 assert.equal(s.fridayMeetupDraft,undefined);
 assert.equal(s.cash,before.money);
});

test("sem demanda real, licença ou capacidade não há convite ou rascunho",()=>{
 const s=createGame(11,"historical");
 assert.equal(firstFridayEligibility(s).ready,false);
 assert.equal(draftFridayMeetup(s,2).ok,false);
 assert.equal(s.fridayMeetupDraft,undefined);
 const eligible=ready();
 eligible.multiplayerRoundsPlayed=0;
 assert.equal(draftFridayMeetup(eligible,2).ok,false);
 eligible.multiplayerRoundsPlayed=1;
 eligible.pcPoweredOff=[false,true,true];
 assert.equal(draftFridayMeetup(eligible,2).ok,false);
});

test("validador rejeita sexta inválida, rascunho confirmado sem operação ou contadores adulterados",()=>{
 const s=ready();
 assert.equal(isValidSave(s),true);
 s.fridayMeetupDraft={fridayDay:nextFridayDay(currentCampaignDay(s)),seats:2,status:"draft"};
 assert.equal(isValidSave(s),true);
 s.fridayMeetupDraft.fridayDay++;
 assert.equal(isValidSave(s),false);
 s.fridayMeetupDraft.fridayDay--;
 s.fridayMeetupDraft.status="confirmed";
 assert.equal(isValidSave(s),false);
 s.fridayMeetupDraft=undefined;
 s.multiplayerRoundsPlayed=-1;
 assert.equal(isValidSave(s),false);
});

test("passar sexta de um rascunho não inicia cobrança, relógio extra ou visitantes fictícios",()=>{
 const s=ready();
 assert.equal(draftFridayMeetup(s,2).ok,true);
 const friday=s.fridayMeetupDraft.fridayDay;
 s.totalMinutes=(friday-1)*DAY_MINUTES+DAY_MINUTES-3;
 const end=(friday)*DAY_MINUTES+3;
 for(;s.totalMinutes<end;)stepGame(s,1);
 assert.equal(s.totalMinutes,end);
 assert.equal(s.fridayMeetupDraft.status,"draft");
 assert.equal(isValidSave(s),true);
});
