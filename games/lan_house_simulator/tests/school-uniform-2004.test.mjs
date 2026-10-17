import test from "node:test";
import assert from "node:assert/strict";
import {createGame,isValidSave,visitorArrivalChance} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {GAME_FIRST_YEAR,DAYS_PER_YEAR,additionalMailSchedule} from "../dist/js/sim/mailCalendar.js";
import {scheduleDecisions,decisionOptions,chooseDecision} from "../dist/js/sim/decisions.js";
import {STORY_IDS,STORIES,processStoryFollowups,storySeen} from "../dist/js/sim/storyEvents.js";
import {parseImportedSave,serializeSave} from "../dist/js/sim/saveTransfer.js";

const id="school-uniform-policy",year=2004;
const at=(s,y,d)=>{s.totalMinutes=((y-GAME_FIRST_YEAR)*DAYS_PER_YEAR+d-1)*DAY_MINUTES;};
function deliver(seed=2145){
 const s=createGame(seed,"historical");s.cash=3000;
 for(let d=121;d<=150;d++){
  at(s,2004,d);scheduleDecisions(s);
  if(s.notices?.some(n=>n.id===id))return s;
 }
 throw Error("Carta de uniforme não chegou na janela de 2004");
}
test("evento da escola é de 2004, não sorteado em outros anos",()=>{
 const s=createGame(892,"historical");
 for(const y of [1998,2000,2003,2005,2030])
  for(const d of [1,121,129,150,300]){
   at(s,y,d);scheduleDecisions(s);
   assert.equal(s.notices?.some(n=>n.id===id)??false,false,y+"/"+d);
  }
 assert.equal(additionalMailSchedule(s,STORY_IDS.filter(k=>k!==id&&k!=="gpu-games-2005"))[id],undefined);
 assert.ok(STORIES[id].body.includes("não uma proibição nacional"));
});
test("carta aparece uma só vez durante 2004, mesmo se removida da caixa",()=>{
 const s=deliver();
 const n=s.notices.find(n=>n.id===id);
 assert.ok(n.day>=(2004-1998)*360+121&&n.day<=(2004-1998)*360+150);
 assert.ok(storySeen(s,id));
 assert.equal(s.storySeenIds.filter(key=>key===id).length,1);
 s.notices=s.notices.filter(n=>n.id!==id);
 for(let d=151;d<220;d++){at(s,2004,d);scheduleDecisions(s);}
 assert.equal(s.notices.some(n=>n.id===id),false);
 at(s,2005,121);scheduleDecisions(s);
 assert.equal(s.notices.some(n=>n.id===id),false);
});
test("três decisões com custos, impacto real e validação de saves",()=>{
 const choices=["uniform-post-rule","uniform-talk","uniform-ignore"];
 for(const choice of choices){
  const s=deliver(),options=decisionOptions(id,s);
  assert.equal(options.length,3);
  assert.ok(options.every(o=>o.label.length>=12&&o.description.length>=25));
  const selected=options.find(o=>o.id===choice);
  const cash=s.cash,rep=s.reputation,visitors=visitorArrivalChance(s,0),rng=s.rng;
  assert.equal(chooseDecision(s,id,choice).ok,true);
  assert.equal(s.cash,Math.round((cash-selected.cost)*100)/100);
  assert.equal(s.rng,rng,"o calendário e a escolha não devem sortear visitantes");
  assert.equal(chooseDecision(s,id,choice).ok,false,"escolha idempotente");
  assert.equal(s.storyRecords.filter(r=>r.id===id).length,1);
  assert.equal(s.storyRecords.find(r=>r.id===id).stage,"pending");
  if(choice==="uniform-post-rule")assert.ok(s.reputation>rep);
  if(choice==="uniform-ignore"){
   assert.ok(s.reputation<rep);
   assert.ok(visitorArrivalChance(s,0)<visitors);
  }
  const imported=parseImportedSave(serializeSave(s));
  assert.equal(isValidSave(imported),true);
  at(imported,2004,imported.storyRecords.find(r=>r.id===id).dueDay-(2004-1998)*360);
  processStoryFollowups(imported);processStoryFollowups(imported);
  assert.equal(imported.notices.filter(n=>n.id===id+":followup").length,1);
  const follow=decisionOptions(id+":followup",imported);
  assert.equal(follow.length,2);
  const next=follow[choice==="uniform-ignore"?1:0];
  const oldCash=imported.cash;
  assert.equal(chooseDecision(imported,id+":followup",next.id).ok,true);
  assert.ok(imported.cash<=oldCash);
  assert.equal(chooseDecision(imported,id+":followup",next.id).ok,false);
  at(imported,2004,imported.storyRecords.find(r=>r.id===id).dueDay-(2004-1998)*360);
  processStoryFollowups(imported);
  assert.equal(imported.notices.filter(n=>n.id===id+":report").length,1);
  assert.equal(isValidSave(parseImportedSave(serializeSave(imported))),true);
 }
});
test("com caixa zerado, alternativas gratuitas continuam disponíveis",()=>{
 const s=deliver();s.cash=0;
 const expensive=decisionOptions(id,s).find(o=>o.id==="uniform-post-rule");
 assert.ok(expensive.cost>0);
 const tried=chooseDecision(s,id,expensive.id);
 assert.equal(tried.ok,false);
 assert.equal(s.notices.find(n=>n.id===id).resolved,undefined);
 assert.equal(s.cash,0);
 assert.equal(chooseDecision(s,id,"uniform-talk").ok,true);
 assert.equal(s.cash,0);
});
test("a história preserva as 12 histórias esporádicas e saves antigos",()=>{
 assert.equal(STORY_IDS.length,14);
 const s=createGame(2,"historical");
 const restored=parseImportedSave(serializeSave(s));
 assert.equal(restored.storySeenIds?.includes(id)??false,false);
 assert.equal(isValidSave(restored),true);
});
