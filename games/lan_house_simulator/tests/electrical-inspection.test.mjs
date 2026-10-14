import test from "node:test";
import assert from "node:assert/strict";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {decisionOptions,chooseDecision,scheduleDecisions,DECISIONS} from "../dist/js/sim/decisions.js";
import {reviewNotices} from "../dist/js/sim/notices.js";
import {parseImportedSave,serializeSave} from "../dist/js/sim/saveTransfer.js";

const gotoDay=(s,day)=>{s.totalMinutes=(day-1)*DAY_MINUTES;};
function discover(seed=72421,mode="classic"){
 const s=createGame(seed,mode);s.cash=10000;
 for(let d=4;d<=110&&!s.electricalInspectionSeen;d++){
  gotoDay(s,d);scheduleDecisions(s);
  const open=s.notices?.find(n=>n.id in DECISIONS&&!n.resolved);
  if(open&&open.id!=="electrical-inspection")
   assert.equal(chooseDecision(s,open.id,decisionOptions(open.id,s).at(-1).id).ok,true);
 }
 assert.equal(s.electricalInspectionSeen,true,"vistoria precisa ser sorteada sem ano/data fixa");
 return s;
}
test("Bombeiros: sorteio de evento único e carta identificável",()=>{
 const s=discover(),letter=s.notices.find(n=>n.id==="electrical-inspection");
 assert.ok(letter);assert.equal(letter.severity,"warning");
 assert.match(letter.body,/Bombeiros/);
 const original=s.notices.filter(n=>n.id===letter.id).length;
 for(let day=111;day<300;day+=7){gotoDay(s,day);scheduleDecisions(s);}
 assert.equal(s.notices.filter(n=>n.id==="electrical-inspection").length,original);
});
test("adequação completa é definitiva, contabiliza gastos e persiste no JSON",()=>{
 const s=discover();const cash=s.cash,expenses=s.expenses,rep=s.reputation;
 assert.equal(chooseDecision(s,"electrical-inspection","electrical-complete").ok,true);
 assert.equal(s.cash,cash-320);assert.equal(s.expenses,expenses+320);
 assert.equal(s.reputation,Math.min(100,rep+2));
 assert.equal(s.electricalWiringRegularized,true);
 const updated=s.cash;
 assert.equal(chooseDecision(s,"electrical-inspection","electrical-complete").ok,false);
 assert.equal(s.cash,updated);
 const restored=parseImportedSave(serializeSave(s));
 assert.equal(restored.electricalWiringRegularized,true);
 assert.equal(restored.notices.find(n=>n.id==="electrical-inspection").resolved,"electrical-complete");
 assert.equal(isValidSave(restored),true);
});
test("adequação essencial cobra apenas o preço próprio e elimina a pendência",()=>{
 const s=discover();const cash=s.cash;
 assert.equal(chooseDecision(s,"electrical-inspection","electrical-essential").ok,true);
 assert.equal(s.cash,cash-190);assert.equal(s.electricalWiringRegularized,true);
 gotoDay(s,500);reviewNotices(s);assert.equal(s.electricalInspectionFineApplied,undefined);
});
test("pedido de prazo é único, carta fica aberta e autuação não se repete",()=>{
 const s=discover();const cash=s.cash,day=Math.floor(s.totalMinutes/DAY_MINUTES)+1;
 assert.equal(chooseDecision(s,"electrical-inspection","electrical-defer").ok,true);
 assert.equal(s.electricalDeadlineDay,day+8);assert.equal(s.cash,cash);
 assert.equal(s.notices.find(n=>n.id==="electrical-inspection").resolved,undefined);
 assert.equal(chooseDecision(s,"electrical-inspection","electrical-defer").ok,false);
 gotoDay(s,day+8);reviewNotices(s);
 assert.equal(s.electricalInspectionFineApplied,undefined);
 gotoDay(s,day+9);reviewNotices(s);
 assert.equal(s.electricalInspectionFineApplied,true);
 const after=s.cash;reviewNotices(s);
 assert.equal(s.cash,after);assert.equal(s.notices.find(n=>n.id==="electrical-inspection").severity,"urgent");
 const restored=parseImportedSave(serializeSave(s));gotoDay(restored,day+20);reviewNotices(restored);
 assert.equal(restored.cash,after);
 assert.equal(chooseDecision(restored,"electrical-inspection","electrical-essential").ok,true);
 assert.equal(restored.electricalWiringRegularized,true);
});
test("sem dinheiro não cobra nem conclui; saves legados seguem válidos",()=>{
 const s=discover();s.cash=0;const expenses=s.expenses;
 assert.equal(chooseDecision(s,"electrical-inspection","electrical-essential").ok,false);
 assert.equal(s.expenses,expenses);assert.equal(s.electricalWiringRegularized,undefined);
 const restored=parseImportedSave(serializeSave(s));delete restored.electricalInspectionSeen;
 assert.equal(isValidSave(restored),true);
 restored.electricalDeadlineDay=-3;
 assert.equal(isValidSave(restored),false);
});
test("modo histórico usa custos proporcionais de 1998, não valores modernos",()=>{
 const s=discover(72421,"historical");gotoDay(s,16);s.cash=100;
 const choices=decisionOptions("electrical-inspection",s);
 assert.equal(choices.find(c=>c.id==="electrical-essential").cost,19);
 assert.equal(choices.find(c=>c.id==="electrical-complete").cost,32);
 assert.equal(chooseDecision(s,"electrical-inspection","electrical-essential").ok,true);
 assert.equal(s.cash,81);
});
test("regularização antes do prazo evita multa e não consome RNG de clientes",()=>{
 const s=discover(18);const rng=s.rng;
 assert.equal(chooseDecision(s,"electrical-inspection","electrical-defer").ok,true);
 assert.equal(s.rng,rng);
 assert.equal(chooseDecision(s,"electrical-inspection","electrical-complete").ok,true);
 gotoDay(s,s.electricalDeadlineDay+30);reviewNotices(s);
 assert.equal(s.electricalInspectionFineApplied,undefined);
});
