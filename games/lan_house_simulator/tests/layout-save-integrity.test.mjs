import assert from "node:assert/strict";
import test from "node:test";
import {createGame,isValidSave,stepGame} from "../dist/js/sim/engine.js";
import {expandShop} from "../dist/js/sim/economy.js";
import {editableObjects,moveLayoutObject} from "../dist/js/sim/editableObjects.js";
import {furnitureSlots} from "../dist/js/sim/furnitureLayout.js";
import {expandDirection} from "../dist/js/sim/room.js";
import {parseImportedSave,serializeSave} from "../dist/js/sim/saveTransfer.js";
import {availablePlacementSlots,placeFurniture,relocateFurniture,validFurniturePlacements} from "../dist/js/sim/shop.js";
import {buyPs1SecondSeat,buyPs1Station,ps1PlacementSlots} from "../dist/js/sim/ps1.js";
import {dismissEmployee,hireEmployee} from "../dist/js/sim/staff.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";

/**
 * Invariante: nenhuma ação aceita pelo jogo (ok:true) pode deixar a partida num
 * estado que o próprio jogo recusa gravar, exportar ou importar. Os casos abaixo
 * foram encontrados por campanhas aleatórias e reduzidos ao mínimo.
 */
const ok=r=>assert.equal(r.ok,true,r.message);
/** A partida grava localmente e sobrevive a exportar + importar. */
function assertSaveable(s,context){
 assert.equal(isValidSave(s),true,context+": a partida precisa continuar gravável");
 assert.doesNotThrow(()=>parseImportedSave(serializeSave(s)),context+": exportar e importar precisa funcionar");
}
const decorations=s=>editableObjects(s).filter(o=>o.id.startsWith("decor:")).map(o=>o.id).sort();

test("mover um PC não pode pôr a sua cadeira dentro de outro equipamento já reposicionado",()=>{
 const s=createGame(7);s.cash=100000;
 ok(expandShop(s));ok(expandShop(s));
 ok(moveLayoutObject(s,"pc:0",{x:8.25,y:3},2));
 ok(moveLayoutObject(s,"pc:1",{x:5.75,y:3.5},2));
 assertSaveable(s,"antes da mudança");
 const before=JSON.stringify(s.objectPlacements);
 const result=moveLayoutObject(s,"pc:1",{x:7.5,y:3.75},2);
 assert.equal(result.ok,false,"a cadeira do PC 2 cairia dentro da mesa do PC 1");
 assert.match(result.message,/assentos|ocupada|passagem/);
 assert.equal(JSON.stringify(s.objectPlacements),before,"mudança recusada não altera o salão");
 assertSaveable(s,"depois da mudança recusada");
 // Uma posição livre continua aceita: a regra nova não trava o editor.
 ok(moveLayoutObject(s,"pc:1",{x:5.75,y:3.25},2));
 assertSaveable(s,"depois de uma mudança válida");
});

test("ampliar o salão preserva decorações já instaladas em encaixes da grade",()=>{
 for(const direction of ["north","west","east"]){
  const s=createGame(7);s.cash=100000;
  // Ocupa todos os encaixes de parede e alguns de piso antes de ampliar.
  for(const slot of availablePlacementSlots(s,"poster"))placeFurniture(s,"poster",slot.id);
  for(const slot of availablePlacementSlots(s,"plant").slice(0,12))placeFurniture(s,"plant",slot.id);
  const installed=decorations(s);
  assert.ok(installed.length>=6,"o cenário precisa de decorações instaladas");
  assertSaveable(s,direction+": antes de ampliar");
  for(let level=0;level<5;level++){
   ok(expandDirection(s,direction));
   assert.equal(validFurniturePlacements(s),true,direction+" nível "+(level+1)+": móveis continuam válidos");
   assert.deepEqual(decorations(s).filter(id=>installed.includes(id)),installed,
    direction+" nível "+(level+1)+": nenhuma decoração some do salão");
   assertSaveable(s,direction+" nível "+(level+1));
  }
  // Encaixes continuam únicos e os ocupados não são oferecidos de novo.
  const ids=furnitureSlots(s).map(p=>p.id);
  assert.equal(new Set(ids).size,ids.length,"IDs de encaixe únicos");
  const taken=new Set((s.furniturePlacements??[]).map(p=>p.slotId));
  assert.equal(availablePlacementSlots(s,"poster").some(p=>taken.has(p.id)),false);
  // Um encaixe reservado novo não se sobrepõe a um pôster que já estava ali.
  const walls=furnitureSlots(s).filter(p=>p.surface==="wall"&&(p.axis??"x")==="x");
  for(const p of walls.filter(p=>taken.has(p.id)))
   assert.equal(walls.some(q=>q!==p&&!taken.has(q.id)&&/^wall-(west|east|north)-/.test(q.id)&&Math.abs(q.x-p.x)<.65),false,
    "encaixe reservado livre sobre o pôster "+p.id);
 }
});

test("partida já afetada volta a exportar e a editar os móveis",()=>{
 // Estado gravado por uma versão anterior: pôster num encaixe da grade que a
 // ampliação norte passou a esconder atrás de wall-north-1.
 const s=createGame(7);s.cash=100000;
 ok(placeFurniture(s,"poster","wall-grid-0.15"));
 s.roomExtensions={west:0,east:0,south:0,north:1};
 assert.equal(validFurniturePlacements(s),true);
 assertSaveable(s,"partida antiga");
 const destination=availablePlacementSlots(s,"poster")[0];
 assert.ok(destination,"há encaixe livre para reposicionar");
 ok(relocateFurniture(s,"wall-grid-0.15",destination.id));
 assertSaveable(s,"depois de reposicionar");
});

test("bancada de PlayStation não é instalada sobre um PC reposicionado",()=>{
 const s=createGame(7,"historical");delete s.topGamesUnlockMode;
 s.totalMinutes=4*360*DAY_MINUTES;s.cash=100000;
 assert.ok(ps1PlacementSlots(s).some(p=>p.id==="floor-2"),"sem mudanças o encaixe central é oferecido");
 ok(moveLayoutObject(s,"pc:0",{x:3.25,y:4.75},0));
 assert.equal(ps1PlacementSlots(s).some(p=>p.id==="floor-2"),false,"a bancada cobriria o PC 1");
 const cash=s.cash,refused=buyPs1Station(s,"floor-2");
 assert.equal(refused.ok,false);
 assert.equal(s.cash,cash,"compra recusada não cobra");
 assert.equal(s.ps1Stations?.length??0,0);
 assertSaveable(s,"depois da compra recusada");
 // Toda posição oferecida continua comprável e mantém a partida gravável.
 for(const slot of ps1PlacementSlots(s)){
  const copy=structuredClone(s);
  ok(buyPs1Station(copy,slot.id));
  assertSaveable(copy,"bancada em "+slot.id);
  const seat=buyPs1SecondSeat(copy,0);
  if(seat.ok)assertSaveable(copy,"segunda cadeira em "+slot.id);
 }
});

test("cargo desconhecido é recusado sem corromper a folha de pagamento",()=>{
 const s=createGame(7);
 for(const role of ["gerente","",null,undefined,"__proto__"]){
  assert.equal(hireEmployee(s,role).ok,false,"contratar "+String(role));
  assert.equal(dismissEmployee(s,role).ok,false,"dispensar "+String(role));
 }
 assert.equal(s.employees,undefined);
 assertSaveable(s,"depois de cargos inválidos");
 ok(hireEmployee(s,"technician"));
 stepGame(s,120);
 assertSaveable(s,"com técnico contratado");
});
