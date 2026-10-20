import test from "node:test";
import assert from "node:assert/strict";
import {createGame,stepGame,isValidSave} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {buyPs1Station,buyPs1Disc,buyPs1SecondSeat,ps1SecondSeatPrice,
 ps1OpenSeat,ps1Seat,ps1SeatApproach,ps1StationAvailable,ps1PlayableDisc,
 setPs1StationDisc,repairPs1Controls,validPs1State} from "../dist/js/sim/ps1.js";
import {serializeSave,parseImportedSave,snapshotGameState} from "../dist/js/sim/saveTransfer.js";
const ok=r=>assert.equal(r.ok,true,r.message);
function setup(){
 const s=createGame(314,"historical");
 s.totalMinutes=4*360*DAY_MINUTES;s.cash=5000;
 ok(buyPs1Station(s,"floor-2"));ok(buyPs1Disc(s,"gol-de-rua"));
 return s;
}
const visitor=(id,stage="waiting")=>({id,stage,x:1.55,y:2.56,
 target:{x:1.55,y:2.56},queueIndex:0,route:[],pcIndex:null,
 costume:"regular",usedMinutes:0,waitingMinutes:0,offlineWait:0,
 happy:true,sessionMinutes:45,wallet:20,needs:{thirst:0,hunger:0,energy:100}});
test("segundo assento é pago, opcional e persistente sem alterar CD original",()=>{
 const s=setup(),cash=s.cash,expenses=s.expenses,price=ps1SecondSeatPrice(s);
 assert.equal(ps1Seat(s,0,1),null);
 assert.equal(s.ps1Stations[0].secondSeat,undefined);
 s.cash=price-1;assert.equal(buyPs1SecondSeat(s,0).ok,false);
 s.cash=cash;ok(buyPs1SecondSeat(s,0));
 assert.equal(s.cash,cash-price);assert.equal(s.expenses,expenses+price);
 assert.equal(s.ps1Stations[0].secondSeat,true);
 assert.equal(ps1PlayableDisc(s,0),"gol-de-rua");
 const a=ps1Seat(s,0,0),b=ps1Seat(s,0,1);
 assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>.43);
 assert.ok(ps1SeatApproach(s,0,0).x<a.x);
 assert.ok(ps1SeatApproach(s,0,1).x>b.x);
 assert.equal(buyPs1SecondSeat(s,0).ok,false);
 assert.equal(isValidSave(s),true);
 assert.deepEqual(parseImportedSave(serializeSave(s)).ps1Stations,s.ps1Stations);
});
test("dois visitantes pagam individualmente e reservam assentos independentes",()=>{
 const s=setup();ok(buyPs1SecondSeat(s,0));
 const first=visitor(5);s.customers=[first];stepGame(s,1);
 assert.equal(first.ps1SeatIndex,0);assert.equal(first.ps1StationIndex,0);
 assert.equal(ps1OpenSeat(s,0),1);
 const second=visitor(10);second.queueIndex=0;
 s.customers.unshift(second);s.counterBusyUntil=s.totalMinutes;
 const a=ps1Seat(s,0,0);first.x=a.x;first.y=a.y;first.target={...a};
 first.route=[];first.stage="using";first.poseMinutes=0;
 stepGame(s,1);
 assert.equal(second.ps1StationIndex,0);assert.equal(second.ps1SeatIndex,1);
 assert.equal(ps1OpenSeat(s,0),null);assert.equal(ps1StationAvailable(s,0),false);
 assert.equal(s.ps1Sessions,2);assert.equal(s.ps1Revenue,3.76);
 assert.equal(setPs1StationDisc(s,0,null).ok,false);
 assert.equal(buyPs1SecondSeat(s,0).ok,false);
 assert.equal(repairPs1Controls(s,0).ok,false);
 assert.equal(isValidSave(s),true);
 const restored=parseImportedSave(serializeSave(s));
 assert.deepEqual(restored.customers.map(c=>c.ps1SeatIndex),s.customers.map(c=>c.ps1SeatIndex));
 let together=false;
 for(let minute=0;minute<32;minute++){
  stepGame(s,1);stepGame(restored,1);
  const active=s.customers.filter(c=>c.ps1StationIndex===0&&c.stage==="using");
  together ||= active.length===2;
 }
 assert.equal(together,true,"os dois devem jogar simultaneamente durante a partida real");
 assert.deepEqual(snapshotGameState(restored),snapshotGameState(s));
});
test("saves antigos têm uma cadeira e duplas adulteradas são rejeitadas",()=>{
 const s=setup(),old=parseImportedSave(serializeSave(s));
 assert.equal(old.ps1Stations[0].secondSeat,undefined);
 const a=visitor(5,"using");a.ps1StationIndex=0;
 a.x=ps1Seat(s,0).x;a.y=ps1Seat(s,0).y;s.customers=[a];
 assert.equal(ps1OpenSeat(s,0),null);assert.equal(validPs1State(s),true);
 const b=visitor(6,"using");b.ps1StationIndex=0;b.ps1SeatIndex=1;
 s.customers.push(b);
 assert.equal(validPs1State(s),false);assert.equal(isValidSave(s),false);
 s.customers.pop();s.ps1Stations[0].secondSeat="yes";
 assert.equal(validPs1State(s),false);
});
