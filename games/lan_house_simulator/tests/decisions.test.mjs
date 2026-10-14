import test from "node:test";
import assert from "node:assert/strict";
import {createGame} from "../dist/js/sim/engine.js";
import {scheduleDecisions,chooseDecision,DECISIONS,decisionOptions} from "../dist/js/sim/decisions.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {parseImportedSave,serializeSave} from "../dist/js/sim/saveTransfer.js";
test("eventos possuem duas ou três alternativas e persistem no save",()=>{
 const s=createGame();s.cash=5000;s.totalMinutes=15*DAY_MINUTES;
 scheduleDecisions(s);
 const event=s.notices?.find(n=>decisionOptions(n.id,s).length>0);assert.ok(event);
 assert.ok(decisionOptions(event.id,s).length>=2);
 const choice=decisionOptions(event.id,s)[0];
 const before=s.cash;
 assert.equal(chooseDecision(s,event.id,choice.id).ok,true);
 assert.ok(s.cash<=before+240);
 assert.equal(chooseDecision(s,event.id,choice.id).ok,false);
 const restored=parseImportedSave(serializeSave(s));
 assert.equal(restored.notices.find(n=>n.id===event.id).resolved,choice.id);
});
test("recusa não custa dinheiro e propostas não duplicam quando pendentes",()=>{
 const s=createGame();s.cash=100;s.totalMinutes=18*DAY_MINUTES;
 scheduleDecisions(s);const first=s.notices.length;s.totalMinutes+=7*DAY_MINUTES;
 scheduleDecisions(s);assert.equal(s.notices.length,first);
 const event=s.notices[0],last=decisionOptions(event.id,s).at(-1);
 const cash=s.cash;
 assert.equal(chooseDecision(s,event.id,last.id).ok,true);
 assert.equal(s.cash,cash);
});
test("decisões caras não gastam dinheiro quando caixa é insuficiente",()=>{
 const s=createGame();s.cash=0;s.totalMinutes=20*DAY_MINUTES;
 scheduleDecisions(s);const n=s.notices[0];
 const expensive=decisionOptions(n.id,s).find(o=>o.cost>0);
 assert.ok(expensive);
 assert.equal(chooseDecision(s,n.id,expensive.id).ok,false);
 assert.equal(s.cash,0);assert.equal(n.resolved,undefined);
});
