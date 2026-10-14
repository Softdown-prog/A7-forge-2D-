import test from "node:test";
import assert from "node:assert/strict";
import {PRAISE_LINES,COMPLAINT_LINES,praiseLine,complaintLine} from "../dist/js/sim/customerDialogue.js";

const oldPraise=["Curti demais!"];
const oldComplaints=["Que fila enorme!","Internet caiu!","Internet lenta!","Demorou demais!","Está caro!"];

test("cinco novos elogios e cinco críticas novas sem apagar frases aprovadas",()=>{
 assert.equal(PRAISE_LINES.length,6);
 assert.ok(oldPraise.every(line=>PRAISE_LINES.includes(line)));
 assert.equal(new Set(PRAISE_LINES).size,PRAISE_LINES.length);
 const allCriticism=[...new Set(Object.values(COMPLAINT_LINES).flat())];
 assert.ok(oldComplaints.every(line=>allCriticism.includes(line)));
 assert.equal(PRAISE_LINES.filter(line=>!oldPraise.includes(line)).length,5);
 assert.equal(allCriticism.filter(line=>!oldComplaints.includes(line)).length,5);
});
test("todas as falas são curtas, legíveis e adequadas ao contexto da reclamação",()=>{
 for(const line of [...PRAISE_LINES,...Object.values(COMPLAINT_LINES).flat()]){
  assert.ok(line.length<=28,"frase longa para balão: "+line);
  assert.ok(line.length>4);
 }
 assert.ok(COMPLAINT_LINES.queue.every(line=>/fila|PC livre/.test(line)));
 assert.ok(COMPLAINT_LINES.outage.every(line=>/Internet|Conexão|jogar/.test(line)));
 assert.ok(COMPLAINT_LINES["slow-internet"].every(line=>/Internet|Conexão|jogar/.test(line)));
 assert.ok(COMPLAINT_LINES.price.every(line=>/caro|preço/.test(line)));
});
test("falas variam por visitante e não precisam alterar RNG nem salvar estado adicional",()=>{
 for(let id=0;id<24;id++){
  assert.equal(praiseLine(id),PRAISE_LINES[id%PRAISE_LINES.length]);
  assert.equal(complaintLine("queue",id),COMPLAINT_LINES.queue[id%COMPLAINT_LINES.queue.length]);
 }
 assert.equal(new Set(Array.from({length:12},(_,i)=>praiseLine(i))).size,6);
 assert.equal(new Set(Array.from({length:12},(_,i)=>complaintLine("queue",i))).size,3);
 assert.equal(complaintLine("outage",4),complaintLine("outage",4));
});
