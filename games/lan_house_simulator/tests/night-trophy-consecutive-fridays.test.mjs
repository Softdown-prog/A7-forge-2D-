import test from "node:test";
import assert from "node:assert/strict";
import {createGame,isValidSave,stepGame} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {weekdayIndex,currentCampaignDay} from "../dist/js/sim/campaignWeek.js";
import {firstFridayEligibility,draftFridayMeetup} from "../dist/js/sim/fridayMeetup.js";
import {confirmFridayMeetup} from "../dist/js/sim/nightMeetup.js";
import {selectNightTournament} from "../dist/js/sim/nightTournament.js";
import {summarizeNightTrophies} from "../dist/js/sim/nightTrophyStats.js";
import {licenseGames} from "../dist/js/sim/economy.js";
import {licenseWindows} from "../dist/js/sim/era.js";
import {licenseEraGame,ERIC_MULTIPLAYER_GAME_ID} from "../dist/js/sim/eraGames.js";
import {toggleStationPower} from "../dist/js/sim/stationPower.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";

function prepare(){
 const state=createGame(9182,"historical");
 state.totalMinutes=3*360*DAY_MINUTES;
 state.cash=15000;
 state.multiplayerRoundsPlayed=1;
 assert.equal(licenseGames(state).ok,true);
 for(let i=0;i<3;i++){
  assert.equal(toggleStationPower(state,i).ok,true);
  assert.equal(licenseWindows(state,i,"win98").ok,true);
  assert.equal(toggleStationPower(state,i).ok,true);
 }
 assert.equal(licenseEraGame(state,ERIC_MULTIPLAYER_GAME_ID).ok,true);
 return state;
}

test("cinco sextas sucessivas: campeões reais, save contínuo e galeria completa",()=>{
 let state=prepare();
 const seen=[];
 let lastFriday=0,prizes=0;
 // Os dias comuns são avançados até o fechamento para acelerar a regressão;
 // cada madrugada é executada minuto a minuto pelo motor do jogo.
 for(const [index,seats] of [2,3,2,3,2].entries()){
  const projected=firstFridayEligibility(state);
  assert.equal(projected.ready,true,JSON.stringify(projected.reasons));
  assert.equal(weekdayIndex(projected.friday),4);
  if(lastFriday)assert.equal(projected.friday,lastFriday+7);
  assert.equal(draftFridayMeetup(state,seats).ok,true);
  assert.equal(selectNightTournament(state,"knockout").ok,true);
  assert.equal(confirmFridayMeetup(state).ok,true);
  const priorTrophies=structuredClone(state.nightTournamentTrophies??[]);
  const cashBeforeNight=state.cash;
  const friday=state.fridayMeetupDraft.fridayDay;
  state.totalMinutes=friday*DAY_MINUTES-1;
  stepGame(state,1);
  assert.ok(state.nightMeetup,"corujão deve entrar pelo motor");
  assert.equal(state.nightTournamentTrophies?.length??0,index);
  while(state.nightMeetup.elapsed<300)stepGame(state,1);
  assert.equal(isValidSave(state),true,"save intermediário de sexta "+friday);
  state=parseImportedSave(serializeSave(state));
  let guard=0;
  while(state.nightMeetup&&guard++<720)stepGame(state,1);
  assert.equal(state.nightMeetup,undefined,"a madrugada deve terminar");
  assert.equal(state.totalMinutes,friday*DAY_MINUTES,"reabertura só uma vez");
  const result=state.lastNightMeetup?.tournament;
  assert.equal(result?.mode,"knockout");
  assert.ok(result?.winnerId>0);
  assert.ok(result?.prizePaid>0&&result.prizePaid<=40);
  assert.equal(result.bracket.winnerId,result.winnerId);
  assert.equal(state.nightTournamentTrophies.length,index+1);
  assert.deepEqual(state.nightTournamentTrophies.slice(0,index),priorTrophies);
  const awarded=state.nightTournamentTrophies[index];
  assert.deepEqual(awarded,{fridayDay:friday,winnerId:result.winnerId,participants:seats});
  assert.ok(state.cash>cashBeforeNight-40,
    "prêmio deve ser financiado por sessões realmente cobradas");
  assert.equal(isValidSave(state),true);
  seen.push(awarded);
  prizes+=result.prizePaid;
  const snapshot=parseImportedSave(serializeSave(state));
  assert.deepEqual(snapshot.nightTournamentTrophies,seen);
  state=snapshot;
  lastFriday=friday;
  // Minutos adicionais não podem duplicar troféu nem prêmio.
  const afterCash=state.cash;
  stepGame(state,2);
  assert.deepEqual(state.nightTournamentTrophies,seen);
  assert.equal(state.cash,afterCash);
  assert.equal(currentCampaignDay(state),friday+1);
 }
 const stats=summarizeNightTrophies(state.nightTournamentTrophies);
 assert.equal(stats.total,5);
 assert.equal(stats.finalsTwo,3);
 assert.equal(stats.finalsThree,2);
 assert.equal(stats.champions.reduce((sum,c)=>sum+c.titles,0),5);
 assert.equal(new Set(state.nightTournamentTrophies.map(t=>t.fridayDay)).size,5);
 assert.ok(prizes>0);
 assert.equal(isValidSave(state),true);
});
