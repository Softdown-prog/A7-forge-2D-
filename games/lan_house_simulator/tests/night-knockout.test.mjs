import test from "node:test";
import assert from "node:assert/strict";
import {createGame,isValidSave,stepGame} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {firstFridayEligibility,draftFridayMeetup} from "../dist/js/sim/fridayMeetup.js";
import {confirmFridayMeetup} from "../dist/js/sim/nightMeetup.js";
import {selectNightTournament,scoreTournamentMinute} from "../dist/js/sim/nightTournament.js";
import {knockoutCurrentMatch} from "../dist/js/sim/nightKnockout.js";
import {licenseGames} from "../dist/js/sim/economy.js";
import {licenseWindows} from "../dist/js/sim/era.js";
import {licenseEraGame,ERIC_MULTIPLAYER_GAME_ID} from "../dist/js/sim/eraGames.js";
import {toggleStationPower} from "../dist/js/sim/stationPower.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";

function fixture(seats){
 const s=createGame(9182,"historical");
 s.totalMinutes=3*360*DAY_MINUTES;s.cash=8000;s.multiplayerRoundsPlayed=1;
 assert.equal(licenseGames(s).ok,true);
 for(let i=0;i<3;i++){
  assert.equal(toggleStationPower(s,i).ok,true);
  assert.equal(licenseWindows(s,i,"win98").ok,true);
  assert.equal(toggleStationPower(s,i).ok,true);
 }
 assert.equal(licenseEraGame(s,ERIC_MULTIPLAYER_GAME_ID).ok,true);
 const friday=firstFridayEligibility(s).friday;
 assert.equal(draftFridayMeetup(s,seats).ok,true);
 return {s,friday};
}
function start(s,friday){
 assert.equal(selectNightTournament(s,"knockout").ok,true);
 const before={cash:s.cash,revenue:s.revenue,expenses:s.expenses,served:s.served};
 assert.equal(confirmFridayMeetup(s).ok,true);
 assert.equal(s.fridayMeetupDraft.format,"knockout");
 assert.deepEqual({cash:s.cash,revenue:s.revenue,expenses:s.expenses,served:s.served},before);
 s.totalMinutes=friday*DAY_MINUTES-1;
 stepGame(s,1);
 assert.ok(s.nightMeetup?.tournament);
 assert.equal(s.nightMeetup.tournament.mode,"knockout");
 assert.equal(isValidSave(s),true);
}
function runToEnd(s){
 while(s.nightMeetup)stepGame(s,1);
 return s.lastNightMeetup.tournament;
}
test("dupla: final direta somente com os dois sentados e score real; prêmio único",()=>{
 const {s,friday}=fixture(2);start(s,friday);
 let finalPlayed=false,awaited=false,paid=0,prizeAt7=0,expenseAt7=0;
 for(let i=0;i<720&&s.nightMeetup;i++){
  stepGame(s,1);
  const n=s.nightMeetup;if(!n)break;
  const t=n.tournament;
  if(n.phase==="arriving")assert.equal(t.bracket,undefined,"sem final antes de sentarem");
  paid=Math.max(paid,n.paidIds.length);
  if(t.bracket){
   assert.equal(t.bracket.seedIds.length,2);
   assert.equal(t.bracket.matches.length,1);
   const m=t.bracket.matches[0];
   assert.equal(m.stage,"final");
   if(m.rounds>0)finalPlayed=true;
   if(m.winnerId!==undefined)awaited=true;
   assert.equal(m.points.reduce((x,y)=>x+y,0),t.scores.reduce((z,row)=>z+row.points,0));
  }
  if(n.elapsed===540){
   assert.ok(awaited,"final precisa terminar antes das 7h");
   assert.equal(t.settled,true);
   prizeAt7=t.prizePaid;expenseAt7=s.expenses;
   assert.ok(prizeAt7>0&&prizeAt7<=40);
  }
  if(n.elapsed===550){
   assert.equal(t.prizePaid,prizeAt7);
   assert.equal(s.expenses,expenseAt7,"não há segunda premiação");
  }
 }
 assert.equal(paid,2);assert.equal(finalPlayed,true);
 const result=s.lastNightMeetup.tournament;
 assert.equal(result.mode,"knockout");
 assert.equal(result.bracket.matches.length,1);
 assert.equal(result.winnerId,result.bracket.winnerId);
 assert.equal(result.prizePaid,prizeAt7);
 assert.equal(isValidSave(s),true);
});
test("trio: classificatória, uma vaga automática e final, sem pontos fictícios",()=>{
 const {s,friday}=fixture(3);start(s,friday);
 let hadQualifier=false,hadFinal=false,pausedPoints=null;
 while(s.nightMeetup){
  stepGame(s,1);
  const n=s.nightMeetup;if(!n)break;
  const t=n.tournament;
  if(!t.bracket)continue;
  const matches=t.bracket.matches;
  assert.deepEqual(t.bracket.seedIds,t.scores.map(r=>r.id),"ordem persistente de inscrição");
  if(matches.length===1){
   hadQualifier=true;assert.equal(matches[0].stage,"qualifier");
   const bye=t.bracket.seedIds[2];
   assert.equal(t.scores.find(x=>x.id===bye).points,0,"participante que aguarda não pontua");
  }
  if(matches.length===2){
   hadFinal=true;const first=matches[0],final=matches[1];
   assert.equal(first.rounds,8);
   assert.equal(final.stage,"final");
   assert.deepEqual(final.playerIds,[first.winnerId,t.bracket.seedIds[2]]);
   if(n.elapsed===270){
    const snap=t.scores.map(x=>x.points);
    // Teste de pausa efetiva: ambos devem estar usando PC para pontuar.
    const c=s.customers.find(x=>x.id===final.playerIds[0]);
    if(c?.stage==="using"){
     const stage=c.stage;c.stage="shopping";
     scoreTournamentMinute(s);
     assert.deepEqual(t.scores.map(x=>x.points),snap);
     c.stage=stage;pausedPoints=snap;
    }
   }
  }
 }
 const last=s.lastNightMeetup.tournament;
 assert.ok(hadQualifier&&hadFinal,"a mesma madrugada executou as duas etapas");
 assert.equal(last.bracket.matches.length,2);
 assert.ok(last.bracket.matches.every(m=>m.winnerId!==undefined));
 assert.equal(last.winnerId,last.bracket.winnerId);
 assert.equal(last.bracket.matches[1].winnerId,last.winnerId);
 assert.equal(last.rankings.length,3);
 assert.ok(last.prizePaid>0&&last.prizePaid<=40);
 assert.equal(isValidSave(s),true);
});
test("save às 3h durante a chave: retoma campeão, caixa e prêmio idênticos",()=>{
 const {s,friday}=fixture(3);start(s,friday);
 while(s.nightMeetup.elapsed<300)stepGame(s,1);
 assert.equal(isValidSave(s),true);
 assert.ok(s.nightMeetup.tournament.bracket);
 const a=parseImportedSave(serializeSave(s)),b=parseImportedSave(serializeSave(s));
 assert.deepEqual(a.nightMeetup.tournament.bracket,b.nightMeetup.tournament.bracket);
 const ea=a.expenses,ca=a.cash;
 const ra=runToEnd(a),rb=runToEnd(b);
 assert.deepEqual(ra,rb);
 assert.equal(a.cash,b.cash);assert.equal(a.expenses,b.expenses);
 assert.equal(a.totalMinutes,friday*DAY_MINUTES);
 assert.ok(a.expenses>ea&&a.cash>ca-40);
 assert.equal(isValidSave(a),true);
});
test("save antigo de torneio por pontos funciona e alterações na chave são recusadas",()=>{
 const {s,friday}=fixture(3);start(s,friday);
 while(s.nightMeetup.elapsed<320)stepGame(s,1);
 const original=parseImportedSave(serializeSave(s));
 assert.equal(isValidSave(original),true);
 const forged=JSON.parse(JSON.stringify(original));
 forged.nightMeetup.tournament.bracket.winnerId=forged.nightMeetup.tournament.bracket.seedIds[2];
 assert.equal(isValidSave(forged),false);
 const fake=JSON.parse(JSON.stringify(original));
 fake.nightMeetup.tournament.bracket.matches[0].points[0]+=500;
 assert.equal(isValidSave(fake),false);
 const noSeed=JSON.parse(JSON.stringify(original));
 noSeed.nightMeetup.tournament.bracket.seedIds=[12345,56789,99999];
 assert.equal(isValidSave(noSeed),false);
 const money=JSON.parse(JSON.stringify(original));
 money.nightMeetup.tournament.prizePaid=50;
 assert.equal(isValidSave(money),false);
 const {s:old,friday:oldFriday}=fixture(2);
 assert.equal(selectNightTournament(old,"tournament").ok,true);
 assert.equal(confirmFridayMeetup(old).ok,true);
 old.totalMinutes=oldFriday*DAY_MINUTES-1;stepGame(old,1);
 const oldResult=runToEnd(old);
 assert.equal(oldResult.bracket,undefined);
 assert.equal(oldResult.mode,"league");
 assert.equal(isValidSave(old),true);
});
