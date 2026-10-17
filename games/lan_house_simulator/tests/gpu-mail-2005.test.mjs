import test from "node:test";
import assert from "node:assert/strict";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {GAME_FIRST_YEAR,DAYS_PER_YEAR,additionalMailSchedule} from "../dist/js/sim/mailCalendar.js";
import {scheduleDecisions,decisionOptions,chooseDecision} from "../dist/js/sim/decisions.js";
import {STORY_IDS,STORIES,processStoryFollowups,storySeen} from "../dist/js/sim/storyEvents.js";
import {parseImportedSave,serializeSave} from "../dist/js/sim/saveTransfer.js";
import {hasPlayableGpuGame,licenseGpuGame} from "../dist/js/sim/gpuGames.js";
import {licenseGames} from "../dist/js/sim/economy.js";
import {buyPlatform} from "../dist/js/sim/hardware.js";
import {buyGpu} from "../dist/js/sim/gpu.js";
import {licenseWindows} from "../dist/js/sim/era.js";
import {withStationOff} from "./station-power-fixture.mjs";

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


// Divulgação é uma ação real de negócio, mas só movimenta consumidores quando
// Tony consegue vender o serviço anunciado (GPU, Windows e jogo licenciados).
test("propaganda GPU sem título utilizável não cria demanda artificial",()=>{
 const s=deliver(416);s.cash=25000;
 const initialRng=s.rng;
 assert.equal(chooseDecision(s,id,"gpu-plan").ok,true);
 assert.equal((s.storyVisitorEffects??[]).some(e=>e.id===id+":start"),false);
 assert.equal(s.rng,initialRng);
 const record=s.storyRecords.find(r=>r.id===id);
 s.totalMinutes=(record.dueDay-1)*DAY_MINUTES;
 processStoryFollowups(s);
 assert.equal(chooseDecision(s,id+":followup","story-consolidate").ok,true);
 assert.equal((s.storyVisitorEffects??[]).some(e=>e.id===id+":followup"),false);
 assert.equal(isValidSave(parseImportedSave(serializeSave(s))),true);
});
test("apenas comprar GPU e Windows não ativa procura premium sem jogo licenciado",()=>{
 const s=deliver(415);s.cash=25000;
 assert.equal(hasPlayableGpuGame(s),false);
 assert.equal(licenseGames(s).ok,true);
 assert.equal(withStationOff(s,1,()=>buyPlatform(s,1,"platform05")).ok,true);
 assert.equal(withStationOff(s,1,()=>buyGpu(s,1,"gpu05")).ok,true);
 assert.equal(withStationOff(s,1,()=>licenseWindows(s,1,"winxp")).ok,true);
 assert.equal(hasPlayableGpuGame(s),false);
 assert.equal(chooseDecision(s,id,"gpu-survey").ok,true);
 assert.equal((s.storyVisitorEffects??[]).some(e=>e.id===id+":start"),false);
 const record=s.storyRecords.find(r=>r.id===id);
 s.totalMinutes=(record.dueDay-1)*DAY_MINUTES;
 processStoryFollowups(s);
 const before=JSON.stringify(s.pcWear),rep=s.reputation;
 assert.equal(chooseDecision(s,id+":followup","story-maintain").ok,true);
 assert.equal(JSON.stringify(s.pcWear),before);
 assert.equal(s.reputation,rep);
 assert.equal((s.storyVisitorEffects??[]).some(e=>e.id===id+":followup"),false);
});
test("licença avançada + estação compatível liberam divulgação sem vender sessões falsas",()=>{
 const s=deliver(414);s.cash=25000;
 assert.equal(licenseGames(s).ok,true);
 assert.equal(withStationOff(s,1,()=>buyPlatform(s,1,"platform05")).ok,true);
 assert.equal(withStationOff(s,1,()=>buyGpu(s,1,"gpu05")).ok,true);
 assert.equal(withStationOff(s,1,()=>licenseWindows(s,1,"winxp")).ok,true);
 assert.equal(licenseGpuGame(s,"neon-rush").ok,true);
 assert.equal(hasPlayableGpuGame(s),true);
 const previousRevenue=s.revenue,previousServed=s.served,previousCash=s.cash;
 assert.equal(chooseDecision(s,id,"gpu-plan").ok,true);
 assert.ok((s.storyVisitorEffects??[]).some(e=>e.id===id+":start"&&e.factor>1));
 assert.equal(s.revenue,previousRevenue);
 assert.equal(s.served,previousServed);
 assert.ok(s.cash<previousCash,"somente custo da campanha");
 const restored=parseImportedSave(serializeSave(s));
 assert.equal(hasPlayableGpuGame(restored),true);
 assert.equal(isValidSave(restored),true);
});

// A carta final não pode inventar perda econômica para uma escolha gratuita.
test("o relatório da pesquisa gratuita confirma ausência de punições indevidas",()=>{
 const s=deliver(994);s.cash=0;
 assert.equal(chooseDecision(s,id,"gpu-defer").ok,true);
 let rec=s.storyRecords.find(r=>r.id===id);
 s.totalMinutes=(rec.dueDay-1)*DAY_MINUTES;processStoryFollowups(s);
 assert.equal(chooseDecision(s,id+":followup","story-let-go").ok,true);
 rec=s.storyRecords.find(r=>r.id===id);
 s.totalMinutes=(rec.dueDay-1)*DAY_MINUTES;processStoryFollowups(s);
 const report=s.notices.find(n=>n.id===id+":report");
 assert.match(report.body,/sem novas penalidades ou gastos indiretos/);
 assert.doesNotMatch(report.body,/o episódio terminou com pendências/i);
 assert.equal(s.cash,0);
 assert.equal(isValidSave(parseImportedSave(serializeSave(s))),true);
});
