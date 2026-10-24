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
import {nightMatchMarkers} from "../dist/js/render/nightMatchMarkers.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";

function fixture(seats){
 const s=createGame(8871,"historical");s.totalMinutes=3*360*DAY_MINUTES;
 s.cash=15000;s.multiplayerRoundsPlayed=1;
 assert.equal(licenseGames(s).ok,true);
 for(let i=0;i<3;i++){
  assert.equal(toggleStationPower(s,i).ok,true);
  assert.equal(licenseWindows(s,i,"win98").ok,true);
  assert.equal(toggleStationPower(s,i).ok,true);
 }
 assert.equal(licenseEraGame(s,ERIC_MULTIPLAYER_GAME_ID).ok,true);
 assert.deepEqual(nightMatchMarkers(s),[]);
 assert.equal(draftFridayMeetup(s,seats).ok,true);
 assert.equal(selectNightTournament(s,"knockout").ok,true);
 assert.equal(confirmFridayMeetup(s).ok,true);
 const day=s.fridayMeetupDraft.fridayDay;
 s.totalMinutes=day*DAY_MINUTES-1;stepGame(s,1);
 assert.ok(s.nightMeetup);
 assert.deepEqual(nightMatchMarkers(s),[],"não desenhar placar antes dos inscritos sentarem");
 return s;
}
function advanceUntil(s,condition,max=570){
 for(let i=0;i<max&&!condition();i++)stepGame(s,1);
 assert.ok(condition(),"estado esperado não foi alcançado pelo motor");
}
test("dupla: marcadores reais de rodada e campeão, sem mutar o jogo",()=>{
 const s=fixture(2);
 advanceUntil(s,()=>nightMatchMarkers(s).filter(m=>m.kind==="duel").length===2);
 const before=JSON.stringify(s);
 const markers=nightMatchMarkers(s);
 assert.equal(JSON.stringify(s),before,"renderização não pode editar o save");
 assert.equal(markers.length,2);
 assert.ok(markers.every(m=>s.nightMeetup.pcIndexes.includes(m.pcIndex)));
 assert.deepEqual(markers.map(m=>m.playerId),s.nightMeetup.tournament.bracket.seedIds);
 advanceUntil(s,()=>s.nightMeetup?.tournament?.bracket?.winnerId!==undefined);
 const crowned=nightMatchMarkers(s);
 assert.equal(crowned.filter(m=>m.kind==="champion").length,1);
 assert.equal(crowned.find(m=>m.kind==="champion")?.playerId,
  s.nightMeetup.tournament.bracket.winnerId);
 advanceUntil(s,()=>s.nightMeetup===undefined,550);
 assert.deepEqual(nightMatchMarkers(s),[]);
 assert.equal(isValidSave(s),true);
});
test("trio: semifinal, terceiro aguardando, eliminação e final em PCs presentes",()=>{
 let s=fixture(3);
 advanceUntil(s,()=>nightMatchMarkers(s).length===3);
 let markers=nightMatchMarkers(s);
 assert.equal(markers.filter(m=>m.kind==="duel").length,2);
 assert.equal(markers.filter(m=>m.kind==="waiting").length,1);
 const bracket=s.nightMeetup.tournament.bracket;
 assert.deepEqual(markers.filter(m=>m.kind==="duel").map(m=>m.playerId),bracket.seedIds.slice(0,2));
 const leave=markers.find(m=>m.kind==="duel");
 const customer=s.customers.find(c=>c.id===leave.playerId);
 customer.stage="shopping";
 assert.equal(nightMatchMarkers(s).some(m=>m.playerId===leave.playerId),false,
  "jogador fora do PC não recebe etiqueta de duelo");
 customer.stage="using";
 s=parseImportedSave(serializeSave(s));
 advanceUntil(s,()=>s.nightMeetup?.tournament?.bracket?.matches.length===2);
 markers=nightMatchMarkers(s);
 const loser=s.nightMeetup.tournament.bracket.seedIds.slice(0,2)
  .find(id=>id!==s.nightMeetup.tournament.bracket.matches[0].winnerId);
 // Durante a ida à loja, etiquetas desaparecem temporariamente. Ao voltar,
 // a mesma fonte da verdade deve apresentar o jogador eliminado.
 advanceUntil(s,()=>nightMatchMarkers(s).some(m=>m.playerId===loser&&
  m.kind==="eliminated"),90);
 assert.equal(nightMatchMarkers(s).filter(m=>m.kind==="duel").length,2);
 assert.equal(isValidSave(s),true);
});
