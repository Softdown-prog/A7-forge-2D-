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
import {nightMatchReactions} from "../dist/js/render/nightMatchMarkers.js";
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
 assert.equal(draftFridayMeetup(s,seats).ok,true);
 assert.equal(selectNightTournament(s,"knockout").ok,true);
 assert.equal(confirmFridayMeetup(s).ok,true);
 s.totalMinutes=s.fridayMeetupDraft.fridayDay*DAY_MINUTES-1;stepGame(s,1);
 assert.deepEqual(nightMatchReactions(s),[],"sem comemorar antes do resultado");
 return s;
}
function advance(s,done,max=560){
 for(let i=0;i<max&&!done();i++)stepGame(s,1);
 assert.ok(done(),"a partida real deve terminar");
}
for(const seats of [2,3]){
 test(seats+" jogadores: reações reais ao resultado, save e expiração",()=>{
  let s=fixture(seats);
  advance(s,()=>s.nightMeetup?.tournament?.bracket?.matches[0]?.winnerId!==undefined);
  const m=s.nightMeetup.tournament.bracket.matches[0];
  assert.equal(m.resolvedAtElapsed,s.nightMeetup.elapsed);
  assert.equal(m.resolvedAtElapsed%12,0);
  const reactions=nightMatchReactions(s);
  assert.equal(reactions.length,2);
  assert.equal(reactions.find(r=>r.kind==="win")?.playerId,m.winnerId);
  assert.equal(reactions.find(r=>r.kind==="loss")?.playerId,
    m.playerIds.find(id=>id!==m.winnerId));
  assert.equal(reactions[0].stage,seats===2?"final":"qualifier");
  assert.ok(reactions.every(r=>r.ageMinutes===0&&s.nightMeetup.pcIndexes.includes(r.pcIndex)));
  const before=JSON.stringify(s);
  nightMatchReactions(s);
  assert.equal(JSON.stringify(s),before,"efeito não edita simulação");
  s=parseImportedSave(serializeSave(s));
  assert.equal(nightMatchReactions(s).length,2,"efeito legítimo após recarregar");
  const winner=s.customers.find(c=>c.id===m.winnerId);
  winner.stage="shopping";
  assert.equal(nightMatchReactions(s).some(r=>r.playerId===m.winnerId),false);
  winner.stage="using";
  for(let i=0;i<9;i++)stepGame(s,1);
  assert.deepEqual(nightMatchReactions(s),[],"reação não repete");
  assert.equal(isValidSave(s),true);
 });
}
test("timestamp adulterado falha; save antigo continua válido e sem reação tardia",()=>{
 const s=fixture(2);
 advance(s,()=>s.nightMeetup?.tournament?.bracket?.matches[0]?.winnerId!==undefined);
 const saved=parseImportedSave(serializeSave(s));
 const forged=structuredClone(saved);
 forged.nightMeetup.tournament.bracket.matches[0].resolvedAtElapsed=saved.nightMeetup.elapsed+12;
 assert.equal(isValidSave(forged),false);
 const decimal=structuredClone(saved);
 decimal.nightMeetup.tournament.bracket.matches[0].resolvedAtElapsed=12.5;
 assert.equal(isValidSave(decimal),false);
 const old=structuredClone(saved);
 delete old.nightMeetup.tournament.bracket.matches[0].resolvedAtElapsed;
 assert.equal(isValidSave(old),true);
 assert.deepEqual(nightMatchReactions(old),[]);
});
