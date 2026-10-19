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

test("reputation consequences depend on what each preference values, not a new random roll",async()=>{
 const {preferenceSatisfactionAdjustment:score,preferenceSessionComment:line}=await import("../dist/js/sim/customerChoices.js");
 const evalAt=(preference,hourlyPrice,hardwareBonus=0,wait=0,other={})=>
  score({preference,waitingMinutes:wait,...other},{hourlyPrice,hardwareBonus,consoleSession:false});
 assert.equal(evalAt(undefined,40),0,"old saves have identical reputation rules");
 assert.ok(evalAt("economy",8)>evalAt("economy",18));
 assert.ok(evalAt("economy",18)>evalAt("economy",35));
 assert.ok(evalAt("economy",8)>0&&evalAt("economy",35)<0);
 assert.equal(line({preference:"economy"},evalAt("economy",35),false),"Esse preço pesou no bolso!");
 assert.ok(evalAt("comfort",12,.27)>evalAt("comfort",12,0));
 assert.ok(evalAt("comfort",12,0)<0);
 assert.equal(score({preference:"comfort",waitingMinutes:1},{hourlyPrice:12,hardwareBonus:0,consoleSession:true}),0);
 assert.ok(evalAt("gaming",12,0,0,{preferredGpuGame:"neon-rush",gpuGameCharged:true})>
  evalAt("gaming",12,0,0,{preferredGpuGame:"neon-rush",gpuGameCharged:false}));
 assert.ok(score({preference:"gaming",gpuGamer:false},{hourlyPrice:12,hardwareBonus:0,consoleSession:true})>0);
 assert.ok(evalAt("quick",12,0,0)>evalAt("quick",12,0,15));
 assert.ok(evalAt("quick",12,0,15)<0);
 assert.equal(line({preference:"quick"},evalAt("quick",12,0,15),false),"Demorou demais para me atender!");
 for(const profile of ["economy","comfort","gaming","quick"])
  for(const price of [0,8,12,26,60])for(const wait of [0,5,25,100]){
   const scoreValue=evalAt(profile,price,.25,wait);
   assert.ok(scoreValue>=-.18000001&&scoreValue<=.09000001);
  }
});
test("real session applies profile impact once and keeps revenue and save unchanged",async()=>{
 const {hardwareSatisfactionBonus}=await import("../dist/js/sim/economy.js");
 const perform=(preference,price=12,tier=1,wait=0)=>{
  const s=createGame(514);s.pricePerHour=price;s.reputation=70;
  s.pcTiers=[tier,1,1];s.totalMinutes=15;
  const c=waiting(s,2,preference);c.stage="using";c.pcIndex=0;c.waitingMinutes=wait;
  c.usedMinutes=29;c.sessionMinutes=30;c.target={x:2.2,y:2.1};
  s.customers=[c];
  const cash=s.cash,served=s.served,revenue=s.revenue,rng=s.rng;
  // No arrivals: the whole system still advances one real game minute.
  stepGame(s,1);
  assert.equal(c.stage,"standing");
  assert.equal(s.cash,cash);assert.equal(s.served,served);assert.equal(s.revenue,revenue);
  assert.equal(isValidSave(s),true);
  const saved=parseImportedSave(serializeSave(s));
  assert.equal(saved.customers[0].preference,preference);
  return {rep:s.reputation,speech:s.speechEffects?.at(-1)?.text,
   bonus:hardwareSatisfactionBonus(s,0),rng:s.rng};
 };
 const legacy=perform(undefined,12);
 const economicFair=perform("economy",12),economicExpensive=perform("economy",26);
 const baselineExpensive=perform(undefined,26);
 assert.ok(economicFair.rep>legacy.rep,"fair price helps the price-sensitive client");
 assert.ok(economicExpensive.rep<baselineExpensive.rep,"overpricing now hurts more");
 const comfortBasic=perform("comfort",12,1),comfortUpgraded=perform("comfort",12,3);
 assert.ok(comfortUpgraded.bonus>comfortBasic.bonus);
 assert.ok(comfortUpgraded.rep>comfortBasic.rep,"hardware investment pays off with demanding customers");
 const slow=perform("quick",12,1,18),fast=perform("quick",12,1,0);
 assert.ok(fast.rep>slow.rep);
 assert.equal(fast.speech,"Fui atendido rapidinho!");
 const oldAgain=perform(undefined,12);
 assert.equal(oldAgain.rep,legacy.rep,"legacy behavior reproducible");
});
