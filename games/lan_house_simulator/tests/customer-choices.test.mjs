import test from "node:test";
import assert from "node:assert/strict";
import {createGame,stepGame,isValidSave} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {counterQueueSlot} from "../dist/js/sim/checkoutQueue.js";
import {sessionPlan,shouldConsiderConsole,emergencyRetailChoice,debitVisitorBudget} from "../dist/js/sim/customerChoices.js";
import {ps1PlacementSlots,buyPs1Station,buyPs1Disc} from "../dist/js/sim/ps1.js";
import {parseImportedSave,serializeSave} from "../dist/js/sim/saveTransfer.js";

const guest=(s,id,wallet,budgetAware=true)=>{
 const q=counterQueueSlot(0,s);
 return {id,x:q.x,y:q.y,target:{...q},route:[],stage:"waiting",queueIndex:0,
  pcIndex:null,costume:"regular",waitingMinutes:0,usedMinutes:0,offlineWait:0,happy:true,
  sessionMinutes:90,wallet,budgetAware,needs:{thirst:30,hunger:30,energy:85}};
};
test("plan offers only affordable installed duration, neither imaginary discounts nor fractions",()=>{
 const c={wallet:8,budgetAware:true};
 const quote=minutes=>Math.round(minutes/60*12*100)/100;
 assert.equal(sessionPlan(c,90,400,quote),30);
 assert.equal(sessionPlan(c,90,25,quote),null);
 assert.equal(sessionPlan({...c,wallet:5},90,400,quote),null);
 assert.equal(sessionPlan({...c,budgetAware:false},90,400,quote),90);
 assert.equal(sessionPlan({...c,budgetAware:false},90,60,quote),60);
 const old={wallet:0};
 assert.equal(sessionPlan(old,45,180,quote),45,"old save keeps old behavior");
});
test("console fallback applies when no accessible PC, including GPU fans",()=>{
 assert.equal(shouldConsiderConsole({id:7,gpuGamer:true},undefined),true);
 assert.equal(shouldConsiderConsole({id:7,gpuGamer:true},0),false);
 assert.equal(shouldConsiderConsole({id:5,gpuGamer:false},0),true);
});
test("budgeted client hires cheaper PC plan, pays once and keeps change",()=>{
 const s=createGame(89),c=guest(s,2,8);s.customers=[c];s.reputation=10;
 const before=s.cash;
 stepGame(s,1);
 assert.equal(c.stage,"to_pc");assert.equal(c.sessionMinutes,30);
 assert.equal(c.wallet,2);assert.equal(s.cash-before,6);
 assert.equal(s.served,1);assert.equal(s.revenue,6);
 stepGame(s,1);assert.equal(s.served,1);
 assert.equal(isValidSave(s),true);
 const saved=parseImportedSave(serializeSave(s));
 assert.equal(saved.customers[0].budgetAware,true);
 assert.equal(saved.customers[0].wallet,2);
});
test("unaffordable session gives up without charging or reserving PC",()=>{
 const s=createGame(89),c=guest(s,4);s.customers=[c];s.reputation=10;
 const before=s.cash;stepGame(s,1);
 assert.equal(c.stage,"leaving");assert.equal(s.cash,before);
 assert.equal(s.revenue,0);assert.equal(s.served,0);assert.equal(s.lostCustomers,1);
 assert.equal(c.pcIndex,null);
});
test("when no computer is free, after a patient wait visitor chooses affordable drink",()=>{
 const s=createGame(89),c=guest(s,3,8),q=counterQueueSlot(0,s);
 c.x=q.x;c.y=q.y;c.waitingMinutes=25;c.needs.thirst=96;c.sessionMinutes=45;
 s.inventory.soda=12;s.pricePerHour=40;s.reputation=10;
 s.pcPoweredOff=[true,true,true];s.customers=[c];
 const before=s.cash;stepGame(s,1);
 assert.equal(c.stage,"shopping");assert.equal(c.desiredItem,"soda");
 assert.equal(c.pcIndex,null);assert.equal(s.served,0);assert.equal(s.cash,before);
 assert.equal(emergencyRetailChoice(s,c),"soda");
});
test("console fallback serves waiting visitor when all PCs are off, with real CD and budget",()=>{
 const s=createGame(314,"historical");
 s.totalMinutes=4*360*DAY_MINUTES;s.cash=5000;s.reputation=10;
 const slot=ps1PlacementSlots(s)[0];assert.ok(slot);
 assert.equal(buyPs1Station(s,slot.id).ok,true);
 assert.equal(buyPs1Disc(s,"turbo-circuito").ok,true);
 s.pcPoweredOff=[true,true,true];
 const c=guest(s,7,5);c.sessionMinutes=45;
 s.customers=[c];const initial=s.cash;
 stepGame(s,1);
 assert.equal(c.stage,"to_pc");assert.equal(c.ps1StationIndex,0);
 assert.equal(c.pcIndex,null);assert.ok(c.wallet<5);
 assert.ok(s.cash>initial);assert.equal(s.ps1Sessions,1);
 assert.equal(isValidSave(s),true);
});
