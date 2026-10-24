import test from "node:test";
import assert from "node:assert/strict";
import {createGame,isValidSave,stepGame} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {firstFridayEligibility,draftFridayMeetup} from "../dist/js/sim/fridayMeetup.js";
import {confirmFridayMeetup} from "../dist/js/sim/nightMeetup.js";
import {selectNightTournament,tournamentStandings} from "../dist/js/sim/nightTournament.js";
import {licenseGames} from "../dist/js/sim/economy.js";
import {licenseWindows} from "../dist/js/sim/era.js";
import {licenseEraGame,ERIC_MULTIPLAYER_GAME_ID} from "../dist/js/sim/eraGames.js";
import {toggleStationPower} from "../dist/js/sim/stationPower.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";

function fixture(seats=2,format="tournament"){
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
 assert.equal(selectNightTournament(s,format).ok,true);
 return {s,friday};
}
function reopenAfterNight(s,friday){
 s.totalMinutes=friday*DAY_MINUTES-1;
 stepGame(s,1);
 assert.ok(s.nightMeetup,"corujão começa depois do fechamento real");
 while(s.nightMeetup)stepGame(s,1);
 assert.equal(s.totalMinutes,friday*DAY_MINUTES);
 assert.equal(isValidSave(s),true);
}
test("inscrição do torneio é opcional, sem taxa ou cobrança antecipada; encontro livre preservado",()=>{
 const {s,friday}=fixture(2);
 const cash=s.cash,revenue=s.revenue,served=s.served;
 assert.equal(selectNightTournament(s,"free").ok,true);
 assert.equal(s.fridayMeetupDraft.format,"free");
 assert.equal(selectNightTournament(s,"tournament").ok,true);
 assert.equal(confirmFridayMeetup(s).ok,true);
 assert.equal(selectNightTournament(s,"free").ok,false,"depois de confirmar não pode trocar placar");
 assert.equal(s.cash,cash);assert.equal(s.revenue,revenue);assert.equal(s.served,served);
 assert.equal(isValidSave(s),true);
 assert.equal(JSON.parse(serializeSave(s)).fridayMeetupDraft.format,"tournament");
 const legacy=fixture(2,"free");
 assert.equal(confirmFridayMeetup(legacy.s).ok,true);
 reopenAfterNight(legacy.s,legacy.friday);
 assert.equal(legacy.s.lastNightMeetup.tournament,undefined,"corujão livre não recebe premiação");
});

test("classificação só conta minutos reais em PCs, prêmio sai do caixa uma única vez",()=>{
 const {s,friday}=fixture(2);
 assert.equal(confirmFridayMeetup(s).ok,true);
 s.totalMinutes=friday*DAY_MINUTES-1;
 stepGame(s,1);
 let scored=false,initialExpenses=s.expenses,atSeven=null,paidCheck=null;
 for(let i=1;i<720&&s.nightMeetup;i++){
  stepGame(s,1);
  const n=s.nightMeetup;
  if(!n)break;
  const t=n.tournament;
  assert.ok(t,"placar persistente somente dentro do turno noturno");
  if(n.elapsed===180)paidCheck={
    paid:n.paidIds.length,roster:t.scores.map(x=>x.id),
    points:t.scores.map(x=>x.points)
  };
  if(n.phase==="playing"&&t.scores.some(x=>x.rounds>=1)){
   scored=true;
   assert.ok(t.scores.every(row=>n.paidIds.includes(row.id)));
  }
  if(n.elapsed===540){
   atSeven={cash:s.cash,expenses:s.expenses,prize:t.prizePaid,leader:t.winnerId,
    points:t.scores.map(x=>x.points)};
   assert.equal(t.settled,true);
   assert.ok(t.winnerId!==undefined);
   assert.ok(t.prizePaid>0&&t.prizePaid<=40);
   assert.equal(Number((s.expenses-initialExpenses).toFixed(2)),t.prizePaid);
  }
  if(n.elapsed===550){
   assert.equal(s.cash,atSeven.cash,"após pagar não se paga novamente");
   assert.equal(s.expenses,atSeven.expenses);
   assert.equal(t.prizePaid,atSeven.prize);
  }
 }
 assert.equal(scored,true);
 assert.equal(paidCheck.paid,2);
 assert.equal(paidCheck.roster.length,2);
 const r=s.lastNightMeetup.tournament;
 assert.ok(r);assert.equal(r.winnerId,atSeven.leader);
 assert.equal(r.prizePaid,atSeven.prize);
 assert.ok(r.rankings[0].points>=r.rankings[1].points);
 assert.equal(s.expenses,initialExpenses+atSeven.prize);
 assert.equal(isValidSave(s),true);
});

test("salvar às 3h mantém score, ganhador e prêmio ao retomar; trio também compete",()=>{
 const {s,friday}=fixture(3);
 assert.equal(confirmFridayMeetup(s).ok,true);
 s.totalMinutes=friday*DAY_MINUTES-1;
 stepGame(s,1);
 while(s.nightMeetup.elapsed<300)stepGame(s,1);
 assert.ok(s.nightMeetup.tournament.scores.length===3);
 assert.ok(s.nightMeetup.tournament.scores.every(row=>row.rounds>=3));
 const a=JSON.parse(serializeSave(s)),b=JSON.parse(serializeSave(s));
 assert.equal(isValidSave(a),true);
 assert.deepEqual(a.nightMeetup.tournament,b.nightMeetup.tournament);
 for(const copy of [a,b])while(copy.nightMeetup)stepGame(copy,1);
 assert.deepEqual(a.lastNightMeetup,b.lastNightMeetup);
 assert.equal(a.cash,b.cash);assert.equal(a.expenses,b.expenses);
 assert.equal(a.lastNightMeetup.tournament.rankings.length,3);
 const ids=a.lastNightMeetup.tournament.rankings.map(x=>x.id);
 assert.equal(new Set(ids).size,3);
 assert.ok(a.lastNightMeetup.tournament.prizePaid<=40);
 assert.equal(isValidSave(a),true);
});

test("um save adulterado com ranking forjado é recusado",()=>{
 const {s,friday}=fixture(2);
 assert.equal(confirmFridayMeetup(s).ok,true);
 s.totalMinutes=friday*DAY_MINUTES-1;
 stepGame(s,1);
 const valid=JSON.parse(serializeSave(s));
 assert.equal(isValidSave(valid),true);
 const spoof=JSON.parse(JSON.stringify(valid));
 spoof.nightMeetup.tournament.scores.push({id:999999,points:4000,rounds:35});
 assert.equal(isValidSave(spoof),false);
 const money=JSON.parse(JSON.stringify(valid));
 money.nightMeetup.tournament.prizePaid=200;
 assert.equal(isValidSave(money),false);
 const noShow=JSON.parse(JSON.stringify(valid));
 noShow.fridayMeetupDraft={fridayDay:friday,seats:2,status:"draft",format:"bogus"};
 assert.equal(isValidSave(noShow),false);
});
