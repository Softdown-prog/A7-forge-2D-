import test from "node:test";
import assert from "node:assert/strict";
import {createGame,isValidSave,pcCount,pcPosition} from "../dist/js/sim/engine.js";
import {annexComputerSlots,installAnnexComputer} from "../dist/js/sim/stations.js";
import {objectRect,editableObjects,layoutPlacementIssue,moveLayoutObject} from "../dist/js/sim/editableObjects.js";
import {roomBounds,expandDirection} from "../dist/js/sim/room.js";
import {computerSeat} from "../dist/js/sim/route.js";
import {navigableRoute} from "../dist/js/sim/navigation.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {expandShop} from "../dist/js/sim/economy.js";
import {buyComputer} from "../dist/js/sim/shop.js";
import {isReserved} from "../dist/js/sim/customerFlow.js";

test("PC da parede oeste fica paralelo à lateral com cadeira voltada para o salão",()=>{
 const s=createGame();s.cash=10000;
 assert.equal(expandDirection(s,"west").ok,true);
 const slot=annexComputerSlots(s).find(p=>p.id==="pc-west-1");
 assert.ok(slot);
 assert.equal(slot.position.rotation,3);
 const b=roomBounds(s);
 const seat=computerSeat(slot.position);
 assert.ok(seat.x>slot.position.x+.8,"cadeira deve ficar para o interior, não dentro da parede oeste");
 assert.ok(navigableRoute(s,{x:1.55,y:2.56},seat));
 assert.equal(installAnnexComputer(s,slot.id).ok,true);
 const index=pcCount(s)-1,station=pcPosition(index,s);
 const object=editableObjects(s).find(o=>o.id==="pc:"+index);
 assert.ok(object);
 assert.equal(station.rotation,3);
 assert.equal(layoutPlacementIssue(s,object),null);
 const rect=objectRect(object);
 assert.ok(rect.minX>b.minX+.03);
 assert.ok(rect.maxX<b.maxX-.03);
 assert.equal(isValidSave(s),true);
 const restored=parseImportedSave(serializeSave(s));
 assert.deepEqual(pcPosition(index,restored),station);
 assert.equal(restored.annexPcs[0].slotId,"pc-west-1");
});

test("ajuste padrão da ala oeste não sobrescreve PCs que o jogador reposicionou",()=>{
 const s=createGame();s.cash=10000;
 assert.equal(expandDirection(s,"west").ok,true);
 assert.equal(installAnnexComputer(s,"pc-west-1").ok,true);
 const index=pcCount(s)-1;
 assert.equal(moveLayoutObject(s,"pc:"+index,{x:2.5,y:3},0).ok,true);
 const moved=pcPosition(index,s);
 assert.equal(moved.rotation,0);
 assert.deepEqual({x:moved.x,y:moved.y},{x:2.5,y:3});
 assert.deepEqual(pcPosition(index,parseImportedSave(serializeSave(s))),moved);
});

test("a LAN group keeps its reserved annex PC when the main room gains a new PC",()=>{
 const s=createGame(821);s.cash=10000;
 assert.equal(expandDirection(s,"north").ok,true);
 assert.equal(installAnnexComputer(s,"pc-north-1").ok,true);
 assert.equal(pcCount(s),4);
 assert.equal(expandShop(s).ok,true);
 const guest={
  id:821,x:6.45,y:4.55,stage:"waiting",target:{x:6.45,y:4.55},
  costume:"regular",pcIndex:null,multiplayerAssignedPc:3,
  usedMinutes:0,waitingMinutes:0,offlineWait:0,happy:true
 };
 s.customers.push(guest);
 assert.equal(isReserved(s,3),true,"annex PC is reserved before purchase");
 const purchased=buyComputer(s);
 assert.equal(purchased.ok,true,purchased.message);
 assert.equal(pcCount(s),5);
 assert.equal(guest.multiplayerAssignedPc,4,"reservation follows the same annex PC");
 assert.equal(guest.pcIndex,null,"LAN customer has not paid yet");
 assert.equal(isReserved(s,3),false,"new main PC is not reserved by the annex guest");
 assert.equal(isReserved(s,4),true,"the original annex remains reserved");
});

test("PC no anexo não surge em cima de um visitante e pode ser instalado depois",()=>{
 const s=createGame(2027);s.cash=10000;
 assert.equal(expandDirection(s,"north").ok,true);
 const slot=annexComputerSlots(s).find(p=>p.id==="pc-north-1");
 assert.ok(slot);
 const guest={id:42,x:slot.position.x+.5,y:slot.position.y+.3,stage:"arriving",
  target:{x:slot.position.x+.5,y:slot.position.y+.3},costume:"regular",pcIndex:null,
  usedMinutes:0,waitingMinutes:0,offlineWait:0,happy:true};
 s.customers.push(guest);
 const cash=s.cash,expenses=s.expenses;
 const refused=installAnnexComputer(s,slot.id);
 assert.equal(refused.ok,false);
 assert.match(refused.message,/clientes saírem/);
 assert.equal(s.cash,cash,"o PC não foi cobrado");
 assert.equal(s.expenses,expenses,"nenhuma despesa sem instalação");
 assert.equal(s.annexPcs?.length??0,0);
 guest.x=6.5;guest.y=4.5;guest.target={x:6.5,y:4.5};
 const installed=installAnnexComputer(s,slot.id);
 assert.equal(installed.ok,true,installed.message);
 assert.equal(pcCount(s),4);
 assert.equal(s.annexPcs?.[0]?.slotId,slot.id);
});
