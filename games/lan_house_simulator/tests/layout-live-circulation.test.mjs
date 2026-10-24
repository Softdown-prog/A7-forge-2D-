import test from "node:test";
import assert from "node:assert/strict";
import {createGame,stepGame,entrance,isValidSave,EXIT_REACH_DISTANCE} from "../dist/js/sim/engine.js";
import {moveLayoutObject,editableObjects,objectRect,objectTouchesCustomer} from "../dist/js/sim/editableObjects.js";
import {availablePlacementSlots,placeFurniture} from "../dist/js/sim/shop.js";
import {buildWall,canBuildWall,wallTouchesCustomer} from "../dist/js/sim/walls.js";
import {CUSTOMER_COLLISION_RADIUS} from "../dist/js/sim/checkoutQueue.js";
import {canTraverseLocalStep} from "../dist/js/sim/navigation.js";
import {serializeSave,parseImportedSave,snapshotGameState} from "../dist/js/sim/saveTransfer.js";

const customer=(id,x,y,stage="leaving")=>({
 id,x,y,stage,target:{x:7.5,y:5.35},route:[],pcIndex:null,
 costume:"regular",usedMinutes:0,waitingMinutes:0,offlineWait:0,happy:true
});
function unchanged(s,before){
 assert.equal(JSON.stringify(s),before,"obra recusada não altera save ou dinheiro");
 assert.equal(isValidSave(s),true);
}
test("máquina girada não invade o raio do corpo de cliente, ainda que o centro esteja fora",()=>{
 const s=createGame(41);s.cash=20000;
 const origin=editableObjects(s).find(o=>o.id==="soda");
 const moved={...origin,x:6,y:3,rotation:2};
 const rect=objectRect(moved);
 const visitor=customer(11,rect.minX-.25,(rect.minY+rect.maxY)/2);
 assert.equal(objectTouchesCustomer(moved,visitor),true);
 s.customers=[visitor];
 const before=JSON.stringify(s);
 const result=moveLayoutObject(s,"soda",{x:6,y:3},2);
 assert.equal(result.ok,false);
 assert.match(result.message,/cliente/i);
 unchanged(s,before);
 // Com passagem desocupada, o editor não deve proibir a mesma mudança.
 s.customers=[];
 assert.equal(moveLayoutObject(s,"soda",{x:6,y:3},2).ok,true);
 assert.equal(isValidSave(s),true);
});
test("móvel comprado não ocupa espaço do cliente nem cobra uma compra recusada",()=>{
 const s=createGame(74);s.cash=20000;
 const slot=availablePlacementSlots(s,"table").find(p=>p.id==="floor-2")??
    availablePlacementSlots(s,"table")[0];
 assert.ok(slot&&slot.surface==="floor");
 const dummy={id:"table-test",label:"Mesa",kind:"table",x:slot.x,y:slot.y,
   rotation:0,w:.55,d:.4,surface:"floor"};
 const rect=objectRect(dummy);
 const near=customer(19,rect.minX-.25,(rect.minY+rect.maxY)/2);
 assert.equal(objectTouchesCustomer(dummy,near),true);
 s.customers=[near];
 const before=JSON.stringify(s);
 const denied=placeFurniture(s,"table",slot.id);
 assert.equal(denied.ok,false);unchanged(s,before);
 s.customers=[];
 assert.equal(placeFurniture(s,"table",slot.id).ok,true);
 assert.equal(isValidSave(s),true);
 assert.equal(s.furniture.table,1);
});
test("parede não pode cortar o corpo de quem está atravessando o corredor",()=>{
 const s=createGame(88);s.cash=20000;
 const wall={axis:"y",x:4,y:4},visitor=customer(7,3.78,4.5);
 s.customers=[visitor];
 assert.equal(wallTouchesCustomer(s,wall),true);
 const before=JSON.stringify(s);
 assert.equal(canBuildWall(s,wall),false);
 const result=buildWall(s,wall);
 assert.equal(result.ok,false);unchanged(s,before);
 s.customers=[];
 assert.equal(wallTouchesCustomer(s,wall),false);
 assert.equal(canBuildWall(s,wall),true);
 assert.equal(buildWall(s,wall).ok,true);
 assert.equal(isValidSave(s),true);
});
test("distância de colisão do editor coincide com a caminhada",()=>{
 const s=createGame(18),wall={axis:"y",x:4,y:4};
 s.customers=[customer(1,4-CUSTOMER_COLLISION_RADIUS+.001,4.5)];
 assert.equal(wallTouchesCustomer(s,wall),true);
 s.customers[0].x=4-CUSTOMER_COLLISION_RADIUS-.001;
 assert.equal(wallTouchesCustomer(s,wall),false);
});
test("salão reorganizado após sair da obra continua preservando o save e a rota",()=>{
 let s=createGame(190);s.cash=20000;s.reputation=10;
 const c=customer(18,3.2,4.48);s.nextCustomerId=100;s.customers=[c];
 const moved=moveLayoutObject(s,"soda",{x:6,y:3},2);
 assert.equal(moved.ok,true);
 const wall={axis:"y",x:4,y:4};
 assert.equal(buildWall(s,wall).ok,true);
 const snapshot=parseImportedSave(serializeSave(s));
 const left=new Set();
 for(let minute=0;minute<110;minute++){
  const before=new Map(s.customers.map(c=>[c.id,{x:c.x,y:c.y,ref:c}]));
  stepGame(s,1);stepGame(snapshot,1);
  for(const [id,old] of before){
   const delta=Math.hypot(old.ref.x-old.x,old.ref.y-old.y);
   assert.ok(delta<=.55,"sem teleporte com divisória real");
   assert.ok(canTraverseLocalStep(s,old,old.ref),"sem atravessar parede");
   if(!s.customers.some(c=>c.id===id)){
    left.add(id);
    assert.ok(Math.hypot(old.ref.x-entrance(s).x,old.ref.y-entrance(s).y)<=EXIT_REACH_DISTANCE);
   }
  }
  if(left.has(18))break;
 }
 assert.ok(left.has(18),"cliente antigo chega à porta sem ficar preso");
 assert.deepEqual(JSON.parse(JSON.stringify(snapshotGameState(snapshot))),
  JSON.parse(JSON.stringify(snapshotGameState(s))),
  "salvar depois da obra conserva o movimento e a economia");
 assert.equal(isValidSave(s),true);
});
