import test from "node:test";
import assert from "node:assert/strict";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {DAYS_PER_YEAR,GAME_FIRST_YEAR} from "../dist/js/sim/mailCalendar.js";
import {scheduleDecisions,chooseDecision,decisionOptions} from "../dist/js/sim/decisions.js";
import {processStoryFollowups} from "../dist/js/sim/storyEvents.js";
import {parseImportedSave,serializeSave} from "../dist/js/sim/saveTransfer.js";

const uniform="school-uniform-policy",gpu="gpu-games-2005";
const setDate=(s,y,d)=>{s.totalMinutes=((y-GAME_FIRST_YEAR)*DAYS_PER_YEAR+d-1)*DAY_MINUTES;};
function roundTrip(s){
 const restored=parseImportedSave(serializeSave(s));
 assert.equal(isValidSave(restored),true);
 assert.deepEqual(restored.storySeenIds,s.storySeenIds);
 return restored;
}
function arrive(s,id,year,first,last){
 for(let day=first;day<=last;day++){
  setDate(s,year,day);scheduleDecisions(s);
  if(s.notices.some(n=>n.id===id))return;
 }
 assert.fail("A carta não chegou: "+id);
}
function finish(s,id,initial,followup){
 assert.equal(chooseDecision(s,id,initial).ok,true);
 assert.equal(chooseDecision(s,id,initial).ok,false,"evitar cobranças duplicadas");
 const first=s.storyRecords.find(r=>r.id===id);
 assert.ok(first);
 s.totalMinutes=(first.dueDay-1)*DAY_MINUTES;
 processStoryFollowups(s);processStoryFollowups(s);
 assert.equal(s.notices.filter(n=>n.id===id+":followup").length,1);
 assert.equal(decisionOptions(id+":followup",s).some(o=>o.id===followup),true);
 assert.equal(chooseDecision(s,id+":followup",followup).ok,true);
 const next=s.storyRecords.find(r=>r.id===id);
 s.totalMinutes=(next.dueDay-1)*DAY_MINUTES;
 processStoryFollowups(s);processStoryFollowups(s);
 assert.equal(s.notices.filter(n=>n.id===id+":report").length,1);
 assert.equal(next.stage,"done");
 return roundTrip(s);
}
test("transição 2004 → 2005 preserva decisões, equipamentos e RNG de clientes",()=>{
 for(const seed of [1,23,72421,123456,987654]){
  let s=createGame(seed,"historical");s.cash=10000;
  const rng=s.rng;
  arrive(s,uniform,2004,121,150);
  s=finish(roundTrip(s),uniform,"uniform-talk","story-maintain");
  assert.ok(s.storySeenIds.includes(uniform));
  const after2004=s.storyRecords.find(r=>r.id===uniform);
  assert.equal(after2004.stage,"done");
  arrive(s,gpu,2005,61,90);
  assert.equal(s.storySeenIds.filter(x=>x===uniform).length,1);
  assert.equal(s.storySeenIds.filter(x=>x===gpu).length,1);
  const owned=JSON.stringify({licensedGpuGames:s.licensedGpuGames,gpus:s.stationGpus,hardware:s.pcHardware});
  s=finish(roundTrip(s),gpu,"gpu-defer","story-let-go");
  assert.equal(JSON.stringify({licensedGpuGames:s.licensedGpuGames,gpus:s.stationGpus,hardware:s.pcHardware}),owned);
  assert.equal(s.rng,rng,"nenhuma carta consome o sorteio de clientes");
  assert.equal(s.storyRecords.filter(r=>r.id===uniform).length,1);
  assert.equal(s.storyRecords.filter(r=>r.id===gpu).length,1);
  s.notices=[];setDate(s,2006,120);scheduleDecisions(s);
  assert.equal(s.notices.some(n=>n.id===uniform||n.id===gpu),false);
  assert.equal(isValidSave(parseImportedSave(serializeSave(s))),true);
 }
});
test("importar partida de 2005 sem as novas cartas não altera hardware ou dinheiro",()=>{
 const old=createGame(1632,"historical");
 setDate(old,2005,110);
 delete old.storySeenIds;delete old.storyRecords;
 const original={cash:old.cash,windows:JSON.stringify(old.windowsLicenses),
  gpus:JSON.stringify(old.stationGpus),licenses:JSON.stringify(old.licensedGpuGames)};
 const migrated=roundTrip(old);
 scheduleDecisions(migrated);
 assert.equal((migrated.notices??[]).some(n=>n.id===uniform||n.id===gpu),false,
  "importação fora das janelas não injeta cartas retroativas");
 assert.equal(migrated.cash,original.cash);
 assert.equal(JSON.stringify(migrated.windowsLicenses),original.windows);
 assert.equal(JSON.stringify(migrated.stationGpus),original.gpus);
 assert.equal(JSON.stringify(migrated.licensedGpuGames),original.licenses);
});
