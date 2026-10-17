import test from "node:test";
import assert from "node:assert/strict";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {GAME_FIRST_YEAR,DAYS_PER_YEAR,additionalMailSchedule} from "../dist/js/sim/mailCalendar.js";
import {scheduleDecisions,decisionOptions,chooseDecision} from "../dist/js/sim/decisions.js";
import {STORY_IDS,STORIES,processStoryFollowups,storySeen} from "../dist/js/sim/storyEvents.js";
import {parseImportedSave,serializeSave} from "../dist/js/sim/saveTransfer.js";

const id="gpu-games-2005";
const at=(s,y,d)=>{s.totalMinutes=((y-GAME_FIRST_YEAR)*DAYS_PER_YEAR+d-1)*DAY_MINUTES;};
function deliver(seed=1185){
 const s=createGame(seed,"historical");s.cash=1200;
 for(let d=61;d<=90;d++){
  at(s,2005,d);scheduleDecisions(s);
  if(s.notices?.some(n=>n.id===id))return s;
 }
 throw Error("A carta de jogos com GPU não chegou no início de 2005");
}
test("marco das GPUs não aparece antes de 2005 nem em anos posteriores",()=>{
 const s=createGame(186,"historical");
 for(const y of [1998,2000,2004,2006,2030])
  for(const d of [1,61,75,90,300]){
   at(s,y,d);scheduleDecisions(s);
   assert.equal(s.notices?.some(n=>n.id===id)??false,false,y+"/"+d);
  }
 assert.equal(additionalMailSchedule(s,STORY_IDS.filter(k=>k!==id&&k!=="school-uniform-policy"))[id],undefined);
 assert.match(STORIES[id].body,/GPU|placa de vídeo/);
 assert.match(STORIES[id].body,/Windows/);
});
test("a carta chega uma vez em 2005, sem exigir compra ou usar RNG",()=>{
 for(const seed of [1,23,1185,72421,123456]){
  const s=deliver(seed),first=s.notices.find(n=>n.id===id);
  const rng=s.rng;
  assert.ok(first.day>=(2005-1998)*360+61&&first.day<=(2005-1998)*360+90);
  assert.equal(storySeen(s,id),true);
  assert.equal(s.rng,rng);
  assert.equal(s.storySeenIds.filter(k=>k===id).length,1);
  s.notices=s.notices.filter(n=>n.id!==id);
  for(let d=91;d<=150;d++){at(s,2005,d);scheduleDecisions(s);}
  assert.equal(s.notices.some(n=>n.id===id),false);
  assert.equal(isValidSave(parseImportedSave(serializeSave(s))),true);
 }
});
test("as três escolhas não compram GPUs nem licenças e preservam o save",()=>{
 for(const choice of ["gpu-plan","gpu-survey","gpu-defer"]){
  const s=deliver(),options=decisionOptions(id,s),rng=s.rng;
  assert.equal(options.length,3);
  const before=JSON.stringify({licensed:s.licensedGpuGames,hardware:s.pcHardware,gpu:s.pcGpu});
  const initialCash=s.cash;
  const picked=options.find(o=>o.id===choice);
  assert.ok(picked);
  assert.equal(chooseDecision(s,id,choice).ok,true);
  assert.equal(s.cash,Math.round((initialCash-picked.cost)*100)/100);
  assert.equal(s.rng,rng);
  assert.equal(JSON.stringify({licensed:s.licensedGpuGames,hardware:s.pcHardware,gpu:s.pcGpu}),before);
  assert.equal(chooseDecision(s,id,choice).ok,false);
  assert.equal(s.storyRecords.filter(r=>r.id===id).length,1);
  const restored=parseImportedSave(serializeSave(s));
  assert.equal(isValidSave(restored),true);
  const due=restored.storyRecords.find(r=>r.id===id).dueDay;
  restored.totalMinutes=(due-1)*DAY_MINUTES;
  processStoryFollowups(restored);processStoryFollowups(restored);
  assert.equal(restored.notices.filter(n=>n.id===id+":followup").length,1);
  const choices=decisionOptions(id+":followup",restored);
  assert.equal(choices.length,2);
  const selected=choice==="gpu-defer"?"story-let-go":choices[1].id;
  assert.equal(chooseDecision(restored,id+":followup",selected).ok,true);
  assert.equal(chooseDecision(restored,id+":followup",selected).ok,false);
  restored.totalMinutes=(restored.storyRecords.find(r=>r.id===id).dueDay-1)*DAY_MINUTES;
  processStoryFollowups(restored);processStoryFollowups(restored);
  assert.equal(restored.notices.filter(n=>n.id===id+":report").length,1);
  assert.equal(isValidSave(parseImportedSave(serializeSave(restored))),true);
 }
});
test("adiar os jogos avançados não multa nem reduz procura ou reputação",()=>{
 const s=deliver(),cash=s.cash,reputation=s.reputation,effects=JSON.stringify(s.storyVisitorEffects);
 assert.equal(chooseDecision(s,id,"gpu-defer").ok,true);
 assert.equal(s.cash,cash);
 assert.equal(s.reputation,reputation);
 assert.equal(JSON.stringify(s.storyVisitorEffects),effects);
 at(s,2005,s.storyRecords[0].dueDay-(2005-1998)*360);
 processStoryFollowups(s);
 assert.equal(decisionOptions(id+":followup",s)[1].id,"story-let-go");
 const after=s.cash;
 assert.equal(chooseDecision(s,id+":followup","story-let-go").ok,true);
 assert.equal(s.cash,after);
 assert.equal(s.reputation,reputation);
});
test("sem caixa, esperar pela GPU continua sendo uma escolha possível",()=>{
 const s=deliver();s.cash=0;
 const expensive=decisionOptions(id,s).find(o=>o.id==="gpu-plan");
 assert.ok(expensive.cost>0);
 assert.equal(chooseDecision(s,id,"gpu-plan").ok,false);
 assert.equal(s.notices.find(n=>n.id===id).resolved,undefined);
 assert.equal(chooseDecision(s,id,"gpu-defer").ok,true);
 assert.equal(s.cash,0);
});
