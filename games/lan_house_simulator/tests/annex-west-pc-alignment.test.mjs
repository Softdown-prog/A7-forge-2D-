import test from "node:test";
import assert from "node:assert/strict";
import {createGame,isValidSave,pcCount,pcPosition} from "../dist/js/sim/engine.js";
import {annexComputerSlots,installAnnexComputer} from "../dist/js/sim/stations.js";
import {objectRect,editableObjects,layoutPlacementIssue,moveLayoutObject} from "../dist/js/sim/editableObjects.js";
import {roomBounds,expandDirection} from "../dist/js/sim/room.js";
import {computerSeat} from "../dist/js/sim/route.js";
import {navigableRoute} from "../dist/js/sim/navigation.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";

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
