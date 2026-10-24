import test from "node:test";
import assert from "node:assert/strict";
import {createGame,isValidSave,stepGame} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {licenseGames} from "../dist/js/sim/economy.js";
import {licenseWindows} from "../dist/js/sim/era.js";
import {licenseEraGame,ERIC_MULTIPLAYER_GAME_ID} from "../dist/js/sim/eraGames.js";
import {tickMultiplayerVisitors,waitForMultiplayerFriends} from "../dist/js/sim/multiplayerVisitors.js";
import {tryServe} from "../dist/js/sim/customerDecisions.js";
import {advanceCustomer} from "../dist/js/sim/customerLifecycle.js";
import {sessionRevenue} from "../dist/js/sim/economy.js";
import {isReserved} from "../dist/js/sim/customerFlow.js";
import {counterQueueSlot} from "../dist/js/sim/checkoutQueue.js";
import {toggleStationPower} from "../dist/js/sim/stationPower.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {withStationOff} from "./station-power-fixture.mjs";

function prepared(seed=721){
 const s=createGame(seed,"historical");
 s.totalMinutes=2*360*DAY_MINUTES;s.cash=20000;s.reputation=10;
 s.ericSecondMailDelivered=true;
 assert.equal(licenseGames(s).ok,true);
 for(let i=0;i<3;i++)
  assert.equal(withStationOff(s,i,()=>licenseWindows(s,i,"win98")).ok,true);
 assert.equal(licenseEraGame(s,ERIC_MULTIPLAYER_GAME_ID).ok,true);
 const firstDay=2*360+1;
 const nextDay=firstDay+((seed%7-firstDay%7+7)%7);
 const minute=170+seed%110;
 s.totalMinutes=(nextDay-1)*DAY_MINUTES+minute;
 return s;
}
function collectVisitors(s){
 tickMultiplayerVisitors(s);
 assert.ok(s.multiplayerVisit,"a oportunidade encontra o salão");
 const v=s.multiplayerVisit;
 for(let k=0;k<20&&v.memberIds.length<v.size;k++){
  // Soleira desobstruída após a caminhada de cada novo amigo.
  for(const c of s.customers)if(c.multiplayerVisitId===v.id){c.x=2.6;c.y=3.4;}
  s.totalMinutes++;tickMultiplayerVisitors(s);
 }
 assert.equal(v.memberIds.length,v.size,"todos entraram por uma única porta, um de cada vez");
 const members=v.memberIds.map(id=>s.customers.find(c=>c.id===id));
 for(let i=0;i<members.length;i++){
  const q=counterQueueSlot(i,s),c=members[i];
  c.x=q.x;c.y=q.y;c.target={...q};c.route=[];c.stage="waiting";c.queueIndex=i;
 }
 return members;
}

test("grupinho de 2 ou 3 amigos entra, ocupa slots de fila e reserva PCs diferentes",()=>{
 const s=prepared(),members=collectVisitors(s),v=s.multiplayerVisit;
 assert.ok(v.size===2||v.size===3);
 assert.deepEqual(members.map(c=>c.multiplayerVisitId),Array(v.size).fill(v.id));
 assert.ok(s.nextCustomerId>=v.size+1);
 assert.equal(waitForMultiplayerFriends(s,members[0]),false);
 const booked=members.map(c=>c.multiplayerAssignedPc);
 assert.equal(new Set(booked).size,v.size);
 assert.ok(booked.every(pc=>Number.isInteger(pc)&&isReserved(s,pc)));
 assert.equal(isValidSave(s),true);
 const restored=parseImportedSave(serializeSave(s));
 assert.deepEqual(restored.multiplayerVisit,v);
 assert.deepEqual(restored.customers.map(c=>c.multiplayerAssignedPc),booked);
});

test("cada amigo paga uma vez no caixa e ocupa seu próprio PC; reserva impede desligamento",()=>{
 const s=prepared(724),members=collectVisitors(s),slots=[],startCash=s.cash;
 for(const c of members){
  const prior=s.cash,priorServed=s.served;
  tryServe(s,c);
  assert.equal(c.stage,"to_pc","a pessoa sai do caixa caminhando");
  assert.ok(Number.isInteger(c.pcIndex));
  slots.push(c.pcIndex);
  assert.ok(s.cash>prior,"pagamento real acontece no balcão");
  assert.equal(s.served,priorServed+1);
  assert.equal(s.paymentEffects.length>=1,true);
  assert.match(toggleStationPower(s,c.pcIndex).message,/ocupado/);
  s.totalMinutes+=3;
 }
 assert.equal(new Set(slots).size,members.length);
 assert.ok(s.cash>startCash);
 assert.equal(isValidSave(parseImportedSave(serializeSave(s))),true);
 const paid=s.cash;
 s.totalMinutes+=1;
 assert.equal(waitForMultiplayerFriends(s,members[0]),false);
 assert.equal(s.cash,paid,"rever a reserva não cobra outra vez");
});

test("sem licença ou PCs compatíveis não surgem grupos e não há receita",()=>{
 const s=createGame(8,"historical");
 s.totalMinutes=2*360*DAY_MINUTES+230;
 s.multiplayerLastVisitDay=undefined;
 const before=s.cash;
 for(let i=0;i<360;i++){s.totalMinutes++;tickMultiplayerVisitors(s);}
 assert.equal(s.multiplayerVisit,undefined);
 assert.equal(s.cash,before);
 const eligible=prepared(12);
 eligible.pcPoweredOff=[false,false,true];
 eligible.pcWear[1]=100;
 tickMultiplayerVisitors(eligible);
 assert.equal(eligible.multiplayerVisit,undefined,"falta de duas máquinas bloqueia grupo");
});

test("salão lotado antes de pagar dispensa a turma sem gerar caixa nem PCs fantasmas",()=>{
 const s=prepared(14),members=collectVisitors(s);
 const money=s.cash,served=s.served;
 s.pcPoweredOff=[false,true,true];
 assert.equal(waitForMultiplayerFriends(s,members[0]),true);
 assert.equal(s.multiplayerVisit,undefined);
 assert.ok(members.every(c=>c.stage==="leaving"&&c.pcIndex===null));
 assert.equal(s.cash,money);assert.equal(s.served,served);
 assert.equal(isValidSave(s),true);
});

test("partidas anteriores sem dados de multiplayer seguem válidas",()=>{
 const s=createGame(9),old=parseImportedSave(serializeSave(s));
 assert.equal(old.multiplayerVisit,undefined);
 assert.equal(old.multiplayerLastVisitDay,undefined);
 assert.equal(isValidSave(old),true);
 old.multiplayerVisit={id:1,size:3,memberIds:[1,1],createdMinute:0};
 assert.equal(isValidSave(old),false);
});

test("a rodada LAN só começa com TODOS sentados e dura o mesmo tempo em PCs diferentes",()=>{
 const s=prepared(724),members=collectVisitors(s);
 // Todos reservam computadores reais; cada pagamento usa o balcão existente.
 for(const c of members){
  const previous=s.served;
  tryServe(s,c);
  assert.equal(c.stage,"to_pc");
  assert.equal(s.served,previous+1);
  s.totalMinutes+=3;
 }
 assert.equal(s.multiplayerVisit.paid,true);
 assert.ok(members.every(c=>c.sessionMinutes===s.multiplayerVisit.sessionMinutes));
 assert.equal(new Set(members.map(c=>c.pcIndex)).size,members.length);
 const money=s.cash,served=s.served;
 // O primeiro já sentou; ninguém começa a jogar enquanto os demais andam.
 members[0].stage="sitting";members[0].poseMinutes=3;
 advanceCustomer(s,members[0]);
 assert.equal(members[0].stage,"sitting");
 assert.equal(s.multiplayerVisit.startedMinute,undefined);
 // Último amigo chega; o grupo inicia no MESMO minuto.
 for(const c of members.slice(1)){c.stage="sitting";c.poseMinutes=3;}
 advanceCustomer(s,members[members.length-1]);
 assert.ok(Number.isInteger(s.multiplayerVisit.startedMinute));
 assert.ok(members.every(c=>c.stage==="using"&&c.usedMinutes===0));
 assert.equal(s.cash,money);assert.equal(s.served,served);
 const restored=parseImportedSave(serializeSave(s));
 assert.equal(isValidSave(restored),true);
 assert.equal(restored.multiplayerVisit.startedMinute,s.multiplayerVisit.startedMinute);
 // Sem internet externa: Setor Zero roda pela rede LOCAL.
 s.offlineUntil=s.totalMinutes+200;
 const minutes=s.multiplayerVisit.sessionMinutes;
 for(let i=1;i<=minutes;i++){
  s.totalMinutes++;
  for(const c of members)advanceCustomer(s,c);
  assert.ok(members.every(c=>c.usedMinutes===i),
   "todos jogam o mesmo número de minutos, inclusive durante a queda da internet");
  if(i<minutes)assert.ok(members.every(c=>c.stage==="using"));
 }
 assert.ok(members.every(c=>c.stage==="standing"));
 assert.equal(s.served,served);assert.equal(s.cash,money);
});

test("orçamento do integrante mais pobre reduz o pacote para TODOS, sem cobrar outro valor",()=>{
 const s=prepared(721),members=collectVisitors(s);
 const halfHour=sessionRevenue(s.pricePerHour,30,s.economyVersion===2);
 members[1].wallet=halfHour;
 assert.equal(waitForMultiplayerFriends(s,members[0]),false);
 assert.equal(s.multiplayerVisit.sessionMinutes,30);
 for(const c of members){
  const prior=s.revenue;
  tryServe(s,c);
  assert.equal(c.stage,"to_pc");
  assert.equal(c.sessionMinutes,30);
  assert.equal(s.revenue-prior,halfHour);
  s.totalMinutes+=3;
 }
 assert.equal(isValidSave(parseImportedSave(serializeSave(s))),true);
});

test("simulação completa usa a porta, a fila e os PCs reais sem montar uma cena paralela",()=>{
 const s=prepared(721);
 tickMultiplayerVisitors(s);
 assert.ok(s.multiplayerVisit);
 const id=s.multiplayerVisit.id,ids=s.multiplayerVisit.memberIds;
 let observedReady=false;
 for(let i=0;i<170;i++){
  stepGame(s,1);
  const visit=s.multiplayerVisit;
  if(visit?.id===id&&visit.startedMinute!==undefined){
   const guests=visit.memberIds.map(cid=>s.customers.find(c=>c.id===cid)).filter(Boolean);
   if(guests.length===visit.size&&guests.every(c=>c.pcIndex!==null)){
    assert.equal(new Set(guests.map(c=>c.pcIndex)).size,visit.size);
    assert.ok(guests.every(c=>["using","standing","shopping","leaving"].includes(c.stage)));
    observedReady=true;
    break;
   }
  }
 }
 assert.equal(observedReady,true,"o salão REAL deve conseguir iniciar a partida conjunta");
 assert.ok(s.eventLog.some(line=>line.includes("MESMA partida em rede")));
 assert.equal(isValidSave(s),true);
});

test("regressão real: terceiro amigo atrasado ainda consegue sentar após 85 minutos",()=>{
 const s=prepared(721);
 tickMultiplayerVisitors(s);
 const groupId=s.multiplayerVisit.id;
 let reachedAfter85=false,started=false;
 for(let minute=1;minute<=125;minute++){
  stepGame(s,1);
  const visit=s.multiplayerVisit;
  if(visit?.id!==groupId)break;
  if(minute>85&&visit.memberIds.length===3&&visit.startedMinute===undefined)
   reachedAfter85=true;
  if(visit.startedMinute!==undefined){
   const members=visit.memberIds.map(id=>s.customers.find(c=>c.id===id));
   assert.equal(members.length,3);
   assert.ok(members.every(c=>c&&c.stage==="using"));
   assert.equal(new Set(members.map(c=>c.pcIndex)).size,3);
   assert.equal(visit.paid,true);
   started=true;break;
  }
 }
 assert.equal(reachedAfter85,true,"a fila real exige esperar o terceiro sem cancelar");
 assert.equal(started,true,"os três iniciam no salão de verdade, não num cenário montado");
 assert.equal(isValidSave(s),true);
});
