import test from "node:test";
import assert from "node:assert/strict";
import {createGame,stepGame,chooseAvailablePc,isValidSave} from "../dist/js/sim/engine.js";
import {visitorPreference,preferredSessionLength,maxServiceWait,prefersConsole,
 shouldConsiderConsole} from "../dist/js/sim/customerChoices.js";
import {counterQueueSlot} from "../dist/js/sim/checkoutQueue.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {ps1PlacementSlots,buyPs1Station,buyPs1Disc,ps1SessionPrice} from "../dist/js/sim/ps1.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";

function waiting(s,id,preference,wallet=40){
 const spot=counterQueueSlot(0,s);
 return {id,x:spot.x,y:spot.y,stage:"waiting",target:{...spot},route:[],queueIndex:0,
  costume:"regular",pcIndex:null,waitingMinutes:0,usedMinutes:0,offlineWait:0,happy:true,
  wallet,budgetAware:true,preference,sessionMinutes:90,needs:{thirst:15,hunger:15,energy:90}};
}
test("personalities are stable and equally represented without advancing the RNG",()=>{
 const s=createGame(832),rng=s.rng,found=new Set();
 for(let id=1;id<=80;id++){
  const a=visitorPreference(id,s.mailScheduleSeed),b=visitorPreference(id,s.mailScheduleSeed);
  assert.equal(a,b);found.add(a);
 }
 assert.deepEqual([...found].sort(),["comfort","economy","gaming","quick"]);
 assert.equal(s.rng,rng);
 assert.equal(preferredSessionLength({preference:"quick"},90),30);
 assert.equal(preferredSessionLength({preference:"economy"},120),45);
 assert.equal(preferredSessionLength({},90),90,"legacy visitor keeps duration");
 assert.equal(maxServiceWait({preference:"quick"}),8);
 assert.equal(maxServiceWait({vip:true}),19);
});
test("game, comfort and economy have different console priorities",()=>{
 const pc=m=>m/60*12,consolePrice=m=>m/60*5;
 assert.equal(prefersConsole({preference:"economy"},45,45,pc,consolePrice),true);
 assert.equal(prefersConsole({preference:"economy"},45,45,consolePrice,pc),false);
 assert.equal(prefersConsole({preference:"comfort"},45,45,pc,consolePrice),false);
 assert.equal(prefersConsole({preference:"gaming"},45,45,pc,consolePrice),true);
 assert.equal(prefersConsole({preference:"gaming",gpuGamer:true},45,45,pc,consolePrice),false);
 assert.equal(prefersConsole({preference:"quick"},45,45,pc,consolePrice),false);
 assert.equal(prefersConsole({},45,45,pc,consolePrice),true,"legacy console priority");
 assert.equal(prefersConsole({preference:"comfort"},null,45,pc,consolePrice),true);
 assert.equal(shouldConsiderConsole({id:1,preference:"gaming"},0),true);
});
test("quality-focused visitor chooses upgraded reachable PC, others retain first available",()=>{
 const s=createGame(9);s.pcTiers=[1,3,1];s.reputation=10;
 const regular=waiting(s,2,undefined),comfort=waiting(s,2,"comfort");
 assert.equal(chooseAvailablePc(s,regular),0);
 assert.equal(chooseAvailablePc(s,comfort),1);
});
test("quick visitor buys 30 minutes, rather than an unwanted 90-minute session",()=>{
 const s=createGame(91),c=waiting(s,2,"quick",35);s.customers=[c];s.reputation=10;
 const initial=s.cash;stepGame(s,1);
 assert.equal(c.stage,"to_pc");
 assert.equal(c.sessionMinutes,30);
 assert.equal(s.cash-initial,6);
 assert.equal(c.wallet,29);
 assert.equal(isValidSave(s),true);
 const loaded=parseImportedSave(serializeSave(s));
 assert.equal(loaded.customers[0].preference,"quick");
 loaded.customers[0].preference="bogus";
 assert.equal(isValidSave(loaded),false);
});
test("economy visitor chooses cheaper PS1 when both services are available",()=>{
 const s=createGame(31,"historical");s.totalMinutes=4*360*DAY_MINUTES;
 s.cash=5000;s.reputation=10;
 const pos=ps1PlacementSlots(s)[0];assert.ok(pos);
 assert.equal(buyPs1Station(s,pos.id).ok,true);
 assert.equal(buyPs1Disc(s,"turbo-circuito").ok,true);
 s.pricePerHour=3;s.ps1HourlyPrice=1;
 const c=waiting(s,7,"economy",20);
 s.customers=[c];const cash=s.cash;stepGame(s,1);
 assert.equal(c.stage,"to_pc");
 assert.equal(c.pcIndex,null);
 assert.equal(c.ps1StationIndex,0);
 assert.equal(c.sessionMinutes,45);
 assert.equal(s.cash-cash,ps1SessionPrice(s,45));
 assert.equal(s.served,1);
});
test("the quick shopper does not wait 25 minutes for a computer",()=>{
 const s=createGame(93);s.pcPoweredOff=[true,true,true];
 const c=waiting(s,3,"quick",9);c.waitingMinutes=8;
 c.needs.thirst=90;s.customers=[c];s.reputation=10;s.pricePerHour=40;
 stepGame(s,1);
 assert.equal(c.stage,"shopping");assert.equal(c.desiredItem,"soda");
 assert.equal(s.served,0);
 assert.equal(c.pcIndex,null);
});
