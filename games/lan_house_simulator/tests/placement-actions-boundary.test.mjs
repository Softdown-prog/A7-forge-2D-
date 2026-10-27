import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {createPlacementActionsPort} from "../dist/js/application/placementActionsPort.js";
import {expandDirection} from "../dist/js/sim/room.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";

const fresh=seed=>{const state=createGame(seed,"historical");state.cash=20000;return state;};

test("construir, instalar porta e remover divisoria usam o mesmo motor de colisao",()=>{
 const state=fresh(9200),port=createPlacementActionsPort(()=>state);
 const wall={axis:"y",x:4,y:4};
 assert.equal(port.canBuild(wall),true);
 assert.equal(port.walls("build").some(w=>w.axis===wall.axis&&w.x===wall.x&&w.y===wall.y),true);
 const start=state.cash;
 assert.equal(port.confirmWall("build",wall).ok,true);
 assert.equal(port.canBuild(wall),false);
 assert.ok(state.cash<start);
 assert.deepEqual(port.endpoints(wall).length,2);
 assert.equal(port.walls("door").some(w=>w.axis===wall.axis&&w.x===wall.x&&w.y===wall.y),true);
 assert.equal(port.confirmWall("door",wall).ok,true);
 assert.equal(port.walls("remove").some(w=>w.axis===wall.axis&&w.x===wall.x&&w.y===wall.y),true);
 const afterPurchase=[state.cash,state.expenses];
 assert.equal(port.confirmWall("remove",wall).ok,true,"remove primeiro a porta");
 assert.ok((state.interiorWalls??[]).some(w=>w.axis==="y"&&w.x===4&&w.y===4));
 assert.equal(port.confirmWall("remove",wall).ok,true,"remove depois a parede");
 assert.equal(state.interiorWalls?.length??0,0);
 assert.deepEqual([state.cash,state.expenses],afterPurchase,"demolicao sem reembolso");
 assert.equal(isValidSave(parseImportedSave(serializeSave(state))),true);
});

test("comandos invalidos sao recusados sem modificar o jogo",()=>{
 const state=fresh(9201),port=createPlacementActionsPort(()=>state),before=JSON.stringify(state);
 for(const result of [
  port.confirmWall("build",{axis:"x",x:NaN,y:4}),
  port.confirmWall("bad",{axis:"y",x:4,y:4}),
  port.confirmWall("door",{axis:"y",x:4,y:4}),
  port.place("unknown","floor-2",0),
  port.place("table","floor-2",9),
  port.move("","floor-2"),
  port.rotate(""),
  port.installAnnex("")
 ])assert.equal(result.ok,false,result.message);
 assert.equal(JSON.stringify(state),before);
 assert.equal(port.canBuild({axis:"y",x:Infinity,y:4}),false);
});

test("move, giro, compra e save importado usam sempre a instancia corrente",()=>{
 let state=fresh(9202);
 const port=createPlacementActionsPort(()=>state),original=state;
 const before=[state.cash,state.expenses];
 assert.equal(port.place("table","floor-2",0).ok,true);
 assert.equal(port.furniture().some(f=>f.slotId==="floor-2"),true);
 const afterPurchase=[state.cash,state.expenses];
 assert.notDeepEqual(afterPurchase,before);
 assert.equal(port.move("floor-2","floor-4").ok,true);
 assert.equal(port.rotate("floor-4").ok,true);
 assert.deepEqual([state.cash,state.expenses],afterPurchase,"movimentar nao gera nova cobranca");
 assert.equal(isValidSave(state),true);
 state=parseImportedSave(serializeSave(state));
 assert.equal(port.rotate("floor-4").ok,true);
 assert.equal(original.furniturePlacements?.find(f=>f.slotId==="floor-4")?.rotation,1);
 assert.equal(state.furniturePlacements?.find(f=>f.slotId==="floor-4")?.rotation,2);
 assert.equal(isValidSave(state),true);
});

test("PC anexo so instala apos ampliacao, com cobranca e save validos",()=>{
 const state=fresh(9203),port=createPlacementActionsPort(()=>state);
 const none=port.availableAnnex();
 assert.equal(none.length,0);
 assert.equal(port.installAnnex("wing-does-not-exist").ok,false);
 assert.equal(expandDirection(state,"west").ok,true);
 const available=port.availableAnnex();
 assert.ok(available.length>0,"ampliacao oferece vagas reais");
 const slot=available[0];
 assert.ok(port.annexSlots().some(s=>s.id===slot.id));
 const before=state.cash;
 const result=port.installAnnex(slot.id);
 assert.equal(result.ok,true,result.message);
 assert.ok(state.cash<before);
 assert.equal(port.availableAnnex().some(s=>s.id===slot.id),false);
 assert.equal(isValidSave(parseImportedSave(serializeSave(state))),true);
});

test("eventos do Canvas e toque continuam na interface; main nao executa os comandos",()=>{
 const root=new URL("../src/",import.meta.url);
 const main=readFileSync(new URL("main.ts",root),"utf8");
 const adapter=readFileSync(new URL("application/placementActionsPort.ts",root),"utf8");
 assert.match(main,/createPlacementActionsPort\(\(\)=>game\)/);
 assert.match(main,/placementActions\.confirmWall\(wallMode,wall\)/);
 assert.match(main,/canvas\.addEventListener\("pointermove"/);
 assert.match(main,/canvas\.addEventListener\("click"/);
 assert.doesNotMatch(main,/\b(buildWall|removeWall|installInteriorDoor|removeInteriorDoor|relocateFurniture|placeFurniture|installAnnexComputer|rotateFurniture)\s*\(/);
 assert.doesNotMatch(adapter,/\b(document|window|HTMLCanvasElement|pointermove|pointerup)\b/);
});
