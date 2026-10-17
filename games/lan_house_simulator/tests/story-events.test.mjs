import test from "node:test";
import assert from "node:assert/strict";
import {createGame,isValidSave,visitorArrivalChance} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {STORY_IDS,STORIES,storyVisitorMultiplier,storySeen,processStoryFollowups} from "../dist/js/sim/storyEvents.js";
import {chooseDecision,decisionOptions,scheduleDecisions} from "../dist/js/sim/decisions.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";

const day=(s,d)=>{s.totalMinutes=(d-1)*DAY_MINUTES;};
function letter(id){
 const s=createGame(72421);
 s.cash=50000;s.notices=[{id,title:STORIES[id].title,body:STORIES[id].body,day:7,read:false,severity:"warning"}];
 day(s,7);
 return s;
}
function runStory(id,choiceIndex,followupIndex){
 const s=letter(id);
 const starter=decisionOptions(id,s)[choiceIndex];
 assert.ok(starter,`missing first choice ${id}:${choiceIndex}`);
 const before=s.cash;
 assert.equal(chooseDecision(s,id,starter.id).ok,true);
 assert.equal(s.cash,before-starter.cost);
 assert.equal(chooseDecision(s,id,starter.id).ok,false,"primeira decisão não deve debitar duas vezes");
 assert.equal(s.storyRecords.length,1);
 assert.equal(s.storySeenIds.length,1);
 assert.equal(storySeen(s,id),true);
 assert.equal(s.notices.find(n=>n.id===id).resolved,starter.id);
 const restored=parseImportedSave(serializeSave(s));
 assert.equal(isValidSave(restored),true);
 const due=restored.storyRecords[0].dueDay;
 day(restored,due-1);processStoryFollowups(restored);
 assert.equal(restored.notices.filter(n=>n.id===id+":followup").length,0);
 day(restored,due);processStoryFollowups(restored);processStoryFollowups(restored);
 assert.equal(restored.notices.filter(n=>n.id===id+":followup").length,1,"retorno único");
 assert.equal(restored.storyRecords[0].stage,"awaiting");
 const follow=decisionOptions(id+":followup",restored)[followupIndex];
 assert.ok(follow,`missing followup option ${id}:${choiceIndex}:${followupIndex}`);
 assert.ok(follow.description.length>10);
 const cash=restored.cash;
 assert.equal(chooseDecision(restored,id+":followup",follow.id).ok,true);
 assert.equal(restored.cash,cash-follow.cost);
 assert.equal(chooseDecision(restored,id+":followup",follow.id).ok,false,"retorno não pode custar duas vezes");
 const final=parseImportedSave(serializeSave(restored));
 assert.equal(final.storyRecords[0].stage,"ending");
 day(final,final.storyRecords[0].dueDay);
 processStoryFollowups(final);processStoryFollowups(final);
 assert.equal(final.notices.filter(n=>n.id===id+":report").length,1);
 assert.match(final.notices.find(n=>n.id===id+":report").body,/Sua primeira decisão:/);
 assert.equal(final.storyRecords[0].stage,"done");
 assert.equal(decisionOptions(id+":report",final).length,0);
 // Um grande salto temporal não relança um evento resolvido, mesmo com carta removida.
 final.notices=final.notices.filter(n=>n.id!==id);
 day(final,Math.max(120,final.storyRecords[0].dueDay+30));
 scheduleDecisions(final);
 assert.equal(final.notices.some(n=>n.id===id),false);
 assert.equal(isValidSave(final),true);
 return final;
}
test("14 histórias com três escolhas e dois desdobramentos cada, todas persistentes e não repetidas",()=>{
 assert.equal(STORY_IDS.length,14);
 for(const id of STORY_IDS){
  assert.ok(STORIES[id].title.length>5);
  assert.ok(STORIES[id].body.length>30);
  assert.equal(STORIES[id].choices.length,3);
  for(let c=0;c<3;c++)for(let f=0;f<2;f++)runStory(id,c,f);
 }
});
test("ignorar barulho gera segunda reclamação e queda concreta de procura",()=>{
 const s=letter("neighbor-noise");
 const initial=visitorArrivalChance(s,0);
 assert.equal(chooseDecision(s,"neighbor-noise","noise-ignore").ok,true);
 assert.ok(visitorArrivalChance(s,0)<initial);
 const due=s.storyRecords[0].dueDay;
 day(s,due);processStoryFollowups(s);
 const followup=s.notices.find(n=>n.id==="neighbor-noise:followup");
 assert.match(followup.body,/segunda reclamação|reclamação foi protocolada/i);
 const before=s.reputation;
 assert.equal(chooseDecision(s,"neighbor-noise:followup","story-persist").ok,true);
 assert.ok(s.reputation<before);
 assert.ok(storyVisitorMultiplier(s)<1);
 assert.ok(visitorArrivalChance(s,0)<initial*.9);
 const prior=s.cash;
 assert.equal(chooseDecision(s,"neighbor-noise:followup","story-persist").ok,false);
 assert.equal(s.cash,prior);
 day(s,due+30);
 assert.equal(storyVisitorMultiplier(s),1,"penalidade de movimento expira sem evento repetido");
});
test("corrigir barulho devolve uma carta positiva e benefício de divulgação",()=>{
 const s=letter("neighbor-noise");
 assert.equal(chooseDecision(s,"neighbor-noise","noise-insulate").ok,true);
 day(s,s.storyRecords[0].dueDay);processStoryFollowups(s);
 assert.match(s.notices.find(n=>n.id==="neighbor-noise:followup").body,/agradeceram/);
 assert.equal(chooseDecision(s,"neighbor-noise:followup","story-consolidate").ok,true);
 assert.ok(s.storyVisitorEffects.some(e=>e.factor>1));
});
test("não participar de parceria opcional não acarreta multa injusta",()=>{
 for(const id of ["neighborhood-paper","community-drive"]){
  const s=letter(id);
  assert.equal(chooseDecision(s,id,STORIES[id].choices[2].id).ok,true);
  day(s,s.storyRecords[0].dueDay);processStoryFollowups(s);
  assert.equal(decisionOptions(id+":followup",s).at(-1).id,"story-let-go");
  const rep=s.reputation,cash=s.cash;
  assert.equal(chooseDecision(s,id+":followup","story-let-go").ok,true);
  assert.equal(s.cash,cash);assert.equal(s.reputation,rep);
 }
});
test("salvamentos adulterados com multiplicador inválido são rejeitados",()=>{
 const s=letter("neighbor-noise");
 assert.equal(chooseDecision(s,"neighbor-noise","noise-insulate").ok,true);
 const restored=parseImportedSave(serializeSave(s));
 restored.storyVisitorEffects[0].factor=400;
 assert.equal(isValidSave(restored),false);
 restored.storyVisitorEffects[0].factor=1.03;
 restored.storyRecords[0].dueDay=-5;
 assert.equal(isValidSave(restored),false);
});
test("modo histórico reajusta serviços sem mexer em carteira premium ou inflação duplicada",()=>{
 const s=createGame(72421,"historical");
 s.cash=1000;day(s,7);
 s.notices=[{id:"neighbor-noise",title:"Vizinhos",body:"Barulho",day:7,read:false,severity:"warning"}];
 assert.equal(decisionOptions("neighbor-noise",s)[0].cost,22);
 assert.equal(chooseDecision(s,"neighbor-noise","noise-insulate").ok,true);
 assert.equal(s.cash,978);
 const restored=parseImportedSave(serializeSave(s));
 assert.equal(restored.storyRecords[0].choice,"noise-insulate");
});

test("quatro propostas antigas agora têm retorno contextual para cada escolha",()=>{
 const cases={
  "supplier-offer":["supplier-accept","supplier-decline"],
  "school-booking":["school-accept","school-decline"],
  "gaming-tournament":["tournament-host","tournament-small","tournament-decline"],
  "equipment-fault":["fault-express","fault-basic","fault-delay"]
 };
 for(const [id,choices] of Object.entries(cases))for(const picked of choices){
  const s=createGame(72421);
  s.cash=9000;s.pcWear=[55,45,25];day(s,10);
  s.notices=[{id,title:id,body:"Proposta",day:10,read:false,severity:"info"}];
  const prior=s.cash;
  assert.equal(chooseDecision(s,id,picked).ok,true,id+" "+picked);
  assert.equal(s.storyRecords?.length,1);
  const rec=s.storyRecords[0];
  assert.equal(rec.id,id);assert.equal(rec.choice,picked);
  assert.equal(s.notices[0].resolved,picked);
  assert.equal(chooseDecision(s,id,picked).ok,false);
  assert.ok(s.cash<=prior+240);
  const restored=parseImportedSave(serializeSave(s));
  day(restored,rec.dueDay);processStoryFollowups(restored);
  const options=decisionOptions(id+":followup",restored);
  assert.equal(options.length,2,id+" return choices");
  const follow=options[1];
  assert.equal(chooseDecision(restored,id+":followup",follow.id).ok,true);
  const next=parseImportedSave(serializeSave(restored));
  day(next,next.storyRecords[0].dueDay);processStoryFollowups(next);
  assert.equal(next.notices.filter(n=>n.id===id+":report").length,1);
  assert.match(next.notices.find(n=>n.id===id+":report").body,/Sua primeira decisão:/);
  assert.equal(next.storyRecords[0].stage,"done");
  next.notices=[];
  for(let d=100;d<150;d++){day(next,d);scheduleDecisions(next);}
  assert.ok(!next.notices.some(n=>n.id===id),"legacy event not repeated: "+id);
 }
});

test("desdobramento da conta de luz impacta energia do próximo mês",()=>{
 const s=letter("unexpected-power-bill");
 assert.equal(chooseDecision(s,"unexpected-power-bill","bill-ignore").ok,true);
 day(s,s.storyRecords[0].dueDay);processStoryFollowups(s);
 const pending=s.energyAccrued??0;
 assert.equal(chooseDecision(s,"unexpected-power-bill:followup","story-persist").ok,true);
 assert.ok(s.energyAccrued>=pending+90,"despesa entra na energia acumulada, sem criar receita");
 assert.equal(s.storyRecords[0].stage,"ending");
});
test("ações do retorno são específicas da história e não botões clonados",()=>{
 const noise=letter("neighbor-noise");
 chooseDecision(noise,"neighbor-noise","noise-ignore");
 day(noise,noise.storyRecords[0].dueDay);processStoryFollowups(noise);
 assert.match(decisionOptions("neighbor-noise:followup",noise)[1].label,/segunda reclamação/);
 const roof=letter("roof-leak");
 chooseDecision(roof,"roof-leak","roof-ignore");
 day(roof,roof.storyRecords[0].dueDay);processStoryFollowups(roof);
 assert.match(decisionOptions("roof-leak:followup",roof)[1].label,/infiltração/);
});

test("decisões gratuitas continuam acessíveis com caixa negativo",()=>{
 const s=letter("neighbor-noise");s.cash=-80;
 assert.equal(chooseDecision(s,"neighbor-noise","noise-ignore").ok,true);
 assert.equal(s.cash,-80);
 day(s,s.storyRecords[0].dueDay);processStoryFollowups(s);
 assert.equal(chooseDecision(s,"neighbor-noise:followup","story-persist").ok,true);
 assert.equal(s.cash,-80);
 const legacy=createGame(72421);legacy.cash=-25;legacy.notices=[{id:"school-booking",title:"Escola",body:"Convite",day:1,read:false,severity:"info"}];
 assert.equal(chooseDecision(legacy,"school-booking","school-decline").ok,true);
 assert.equal(legacy.cash,-25);
});
