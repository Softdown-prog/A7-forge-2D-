import test from "node:test";
import assert from "node:assert/strict";
import {createGame,stepGame,isValidSave} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {recordCustomerFeedback,sessionFeedbackReason,validCustomerFeedback,summarizeFeedback} from "../dist/js/sim/customerFeedback.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {counterQueueSlot} from "../dist/js/sim/checkoutQueue.js";

function guest(s,id){
 const p=counterQueueSlot(0,s);
 return {id,x:p.x,y:p.y,target:{...p},route:[],stage:"waiting",queueIndex:0,pcIndex:null,
  costume:"regular",usedMinutes:0,waitingMinutes:0,offlineWait:0,happy:true,
  sessionMinutes:30,needs:{thirst:0,hunger:0,energy:90},wallet:30,budgetAware:true};
}
test("history stores only real bounded reputation differences",()=>{
 const s=createGame(22),c={id:3,preference:"quick"};s.totalMinutes=12;
 recordCustomerFeedback(s,c,"espera","sessao",s.reputation);
 assert.equal(s.customerFeedback,undefined,"do not report an impact of zero");
 s.reputation=74.75;recordCustomerFeedback(s,c,"espera","sessao",75);
 assert.equal(s.customerFeedback.length,1);assert.equal(s.customerFeedback[0].delta,-.25);
 for(let i=0;i<50;i++){
  s.totalMinutes++;
  s.reputation=74+(i%10)/10;
  recordCustomerFeedback(s,{id:i+10},"atendimento","sessao",s.reputation-.1);
 }
 assert.equal(s.customerFeedback.length,24);
 assert.equal(s.customerFeedback[0].customerId,59);
 assert.equal(isValidSave(s),true);
 const loaded=parseImportedSave(serializeSave(s));
 assert.deepEqual(loaded.customerFeedback,s.customerFeedback);
 assert.deepEqual(summarizeFeedback(loaded),summarizeFeedback(s));
 delete loaded.customerFeedback;
 assert.equal(isValidSave(loaded),true,"old saves without feedback remain valid");
});
test("reason mapping distinguishes waiting, hardware, games, price and internet",()=>{
 const o={price:18,hardwareBonus:0,consoleSession:false};
 assert.equal(sessionFeedbackReason({offlineWait:7,preference:"quick",waitingMinutes:10},o),"internet");
 assert.equal(sessionFeedbackReason({offlineWait:0,preference:"quick",waitingMinutes:10},o),"espera");
 assert.equal(sessionFeedbackReason({offlineWait:0,preference:"economy",waitingMinutes:0},o),"preco");
 assert.equal(sessionFeedbackReason({offlineWait:0,preference:"comfort",waitingMinutes:0},o),"equipamentos");
 assert.equal(sessionFeedbackReason({offlineWait:0,preference:"gaming",preferredGpuGame:"neon-rush",gpuGameCharged:false,waitingMinutes:0},o),"jogos");
});
test("last-30-days display does not impersonate lifetime history",()=>{
 const s=createGame(3),c={id:1};
 s.totalMinutes=31*DAY_MINUTES;s.reputation=74.8;
 recordCustomerFeedback(s,c,"preco","sessao",75);
 s.customerFeedback.push({minute:0,customerId:0,reason:"internet",kind:"conexao",delta:-.1});
 const result=summarizeFeedback(s);
 assert.equal(result.records.length,1);
 assert.equal(result.negative,1);
 assert.equal(result.reasons[0][0],"preco");
 assert.equal(validCustomerFeedback([{minute:200,customerId:0,reason:"preco",kind:"sessao",delta:-.4}],100),false);
 assert.equal(validCustomerFeedback([{minute:1,customerId:0,reason:"preco",kind:"sessao",delta:-20}],10),false);
 assert.equal(validCustomerFeedback([{minute:1,customerId:0,reason:"html",kind:"sessao",delta:-.1}],10),false);
});
test("a real PC session records feedback once, without a second payment",()=>{
 const s=createGame(11),c=guest(s,3);s.reputation=70;s.totalMinutes=20;s.customers=[c];
 c.stage="using";c.pcIndex=0;c.usedMinutes=29;c.sessionMinutes=30;
 const {cash,revenue,served}=s;
 stepGame(s,1);
 assert.equal(c.stage,"standing");
 assert.equal(s.cash,cash);assert.equal(s.revenue,revenue);assert.equal(s.served,served);
 assert.equal(s.customerFeedback?.length,1);
 assert.equal(s.customerFeedback[0].kind,"sessao");
 assert.equal(s.customerFeedback[0].delta,Math.round((s.reputation-70)*10000)/10000);
 assert.equal(isValidSave(s),true);
 assert.equal(parseImportedSave(serializeSave(s)).customerFeedback[0].kind,"sessao");
});
test("desisting customer records actual loss, but no phantom loss at reputation floor",()=>{
 const s=createGame(91),c=guest(s,2);s.customers=[c];
 s.pcPoweredOff=[true,true,true];c.waitingMinutes=25;c.wallet=0;s.reputation=11;
 stepGame(s,1);
 assert.equal(s.customerFeedback?.[0].reason,"espera");
 assert.equal(s.customerFeedback?.[0].kind,"desistencia");
 const count=s.customerFeedback.length;
 const other=guest(s,6);other.waitingMinutes=25;other.wallet=0;s.customers=[other];s.reputation=10;
 stepGame(s,1);
 assert.equal(s.customerFeedback.length,count);
});
