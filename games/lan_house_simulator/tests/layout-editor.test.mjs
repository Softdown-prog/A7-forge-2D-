import test from "node:test";
import assert from "node:assert/strict";
import {createGame,stepGame,pcPosition,isValidSave} from "../dist/js/sim/engine.js";
import {editableObjects,moveLayoutObject,validateObjectPlacements,layoutGoals} from "../dist/js/sim/editableObjects.js";
import {purchaseApproach} from "../dist/js/sim/layout.js";
import {computerSeat} from "../dist/js/sim/route.js";
import {buyFurniture,furnitureLocations,availablePlacementSlots,placeFurniture} from "../dist/js/sim/shop.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {buildWall,canBuildWall} from "../dist/js/sim/walls.js";
import {navigableRoute} from "../dist/js/sim/navigation.js";
import {expandDirection} from "../dist/js/sim/room.js";
const fresh=()=>{const s=createGame();s.cash=20000;return s;};
test("editor reconhece PCs, balcão, máquinas, prateleira, lixeiras e pôsteres iniciais",()=>{
 const ids=new Set(editableObjects(fresh()).map(o=>o.id));
 for(const id of ["pc:0","pc:1","pc:2","counter","soda","candy","shelf","bin:0","bin:1","built-poster:0","built-poster:6"])assert.ok(ids.has(id),id);
});
test("quatro orientações de PC mantêm peças, caixa, desgaste e progresso no save",()=>{
 const s=fresh();s.pcWear=[12,22,32];s.pcTiers=[3,2,1];s.pcWindows=["win98","win98","win98"];
 const before={cash:s.cash,expenses:s.expenses,pcs:JSON.stringify([s.pcTiers,s.pcWear,s.pcWindows,s.pcGpus])};
 const seats=[];
 for(let rotation=0;rotation<4;rotation++){
  assert.equal(moveLayoutObject(s,"pc:0",{x:2.5,y:3},rotation).ok,true);
  seats.push(computerSeat(pcPosition(0,s)));
  assert.equal(isValidSave(s),true);assert.equal(validateObjectPlacements(s),true);
  assert.equal(parseImportedSave(serializeSave(s)).objectPlacements[0].rotation,rotation);
 }
 assert.equal(new Set(seats.map(p=>JSON.stringify(p))).size,4);
 assert.deepEqual({cash:s.cash,expenses:s.expenses,pcs:JSON.stringify([s.pcTiers,s.pcWear,s.pcWindows,s.pcGpus])},before);
});
test("sobreposição, borda, ID inválido e PC ocupado falham sem alterar estado",()=>{
 const s=fresh();let snapshot=JSON.stringify(s);
 for(const [id,p,r] of [["pc:0",{x:3.65,y:1.1},0],["soda",{x:8,y:3},0],["unknown",{x:3,y:3},0],["soda",{x:NaN,y:3},0],["pc:0",{x:2.5,y:3},8]]){assert.equal(moveLayoutObject(s,id,p,r).ok,false);assert.equal(JSON.stringify(s),snapshot);}
 s.customers=[{id:1,stage:"using",pcIndex:0,x:2.55,y:1.92,target:{x:2.55,y:1.92},route:[],costume:"regular",happy:true,usedMinutes:0,waitingMinutes:0,offlineWait:0}];snapshot=JSON.stringify(s);
 assert.equal(moveLayoutObject(s,"pc:0",{x:2.5,y:3},1).ok,false);assert.equal(JSON.stringify(s),snapshot);
});
test("máquina deslocada e girada conserva estoque e muda o atendimento",()=>{
 const s=fresh(),before=purchaseApproach("soda",s),inventory={...s.inventory};
 assert.equal(moveLayoutObject(s,"soda",{x:6,y:3},2).ok,true);
 assert.notDeepEqual(purchaseApproach("soda",s),before);assert.deepEqual(s.inventory,inventory);
 assert.ok(navigableRoute(s,{x:7.5,y:5.35},purchaseApproach("soda",s)));
});
test("salvamento rejeita objetos desconhecidos, duplicados e fora do salão",()=>{
 const s=fresh();assert.equal(moveLayoutObject(s,"pc:0",{x:2.5,y:3},1).ok,true);
 for(const patch of [p=>p.id="hack",p=>p.x=100,p=>p.rotation=8]){const data=JSON.parse(serializeSave(s));patch(data.state.objectPlacements[0]);assert.throws(()=>parseImportedSave(JSON.stringify(data)));}
 const data=JSON.parse(serializeSave(s));data.state.objectPlacements.push({...data.state.objectPlacements[0]});assert.throws(()=>parseImportedSave(JSON.stringify(data)));
});
test("comprar várias mesas usa posições reais e cobra cada unidade",()=>{
 const s=fresh(),cash=s.cash;
 for(let i=0;i<5;i++)assert.equal(buyFurniture(s,"table").ok,true);
 assert.equal(s.furniture.table,5);assert.equal(s.cash,cash-5*140);assert.equal(furnitureLocations(s).length,5);assert.equal(new Set(furnitureLocations(s).map(p=>p.slotId)).size,5);
 assert.equal(parseImportedSave(serializeSave(s)).furniture.table,5);
});
test("encaixes adicionais persistem quando as alas oeste e norte aumentam",()=>{
 const s=fresh();for(let i=0;i<5;i++)assert.equal(buyFurniture(s,"table").ok,true);
 const slots=furnitureLocations(s).map(p=>p.slotId);assert.ok(slots.some(id=>id.startsWith("floor-grid-")));
 assert.equal(expandDirection(s,"west").ok,true);assert.equal(expandDirection(s,"north").ok,true);
 assert.deepEqual(parseImportedSave(serializeSave(s)).furniturePlacements.map(p=>p.slotId),slots);
});
test("prateleira e pôster inicial podem mudar de lugar e persistem",()=>{
 const s=fresh();assert.equal(moveLayoutObject(s,"shelf",{x:1,y:3.8},1).ok,true);
 const old=purchaseApproach("snacks",createGame());assert.notDeepEqual(purchaseApproach("snacks",s),old);
 assert.equal(moveLayoutObject(s,"built-poster:2",{x:3.15,y:0},0).ok,true);
 assert.equal(parseImportedSave(serializeSave(s)).objectPlacements.length,2);
});
test("pôster reorganizado acompanha a parede após ampliar fundos e lateral",()=>{
 const s=fresh();assert.equal(moveLayoutObject(s,"built-poster:2",{x:3.15,y:0},0).ok,true);
 assert.equal(expandDirection(s,"north").ok,true);assert.equal(expandDirection(s,"west").ok,true);
 const saved=parseImportedSave(serializeSave(s));assert.equal(saved.objectPlacements[0].y,-2);assert.equal(saved.objectPlacements[0].x,3.15);
});
test("um segmento no antigo corredor aceita desvio, mas não atravessa uma mesa",()=>{
 const s=fresh();assert.equal(canBuildWall(s,{axis:"y",x:4,y:4}),true);
 assert.equal(buildWall(s,{axis:"y",x:4,y:4}).ok,true);
 assert.equal(canBuildWall(s,{axis:"y",x:4,y:1}),false,"segmento corta o PC 2");
 for(const goal of layoutGoals(s))assert.ok(navigableRoute(s,{x:7.5,y:5.35},goal));
});
test("salão reorganizado continua recebendo pagamentos e compras reais",()=>{
 const s=fresh();s.licensedGames=true;s.pcWindowsLicenses=[true,true,true];
 assert.equal(moveLayoutObject(s,"pc:0",{x:2.5,y:3},1).ok,true);
 assert.equal(moveLayoutObject(s,"soda",{x:6,y:3},2).ok,true);
 assert.equal(moveLayoutObject(s,"counter",{x:.75,y:1.75},0).ok,true);
 const start=s.revenue;
 for(let minute=0;minute<720;minute++)stepGame(s,1);
 assert.ok(s.served>=10,"a fila precisa continuar avançando");assert.ok(s.revenue>start);assert.ok(s.purchases>0);
 const restored=parseImportedSave(serializeSave(s));assert.deepEqual(restored.objectPlacements,s.objectPlacements);
});
