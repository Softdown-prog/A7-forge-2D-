import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {drawLayoutEditorOverlay,drawPlacementInteractionOverlays} from "../dist/js/render/interactionOverlays.js";

const state=createGame(9801,"historical");
const wall={axis:"x",x:3,y:4},pending={axis:"y",x:2,y:3};
const idle={
 visible:true,editWall:null,placingKind:null,hoveredPlacement:null,purchaseRotation:0,
 relocating:false,relocationFrom:null,wallMode:null,pendingWall:null,
 hoveredWall:null,installingAnnexPc:false,hoveredAnnexPc:null
};
const fake=()=>{
 const calls=[];
 const renderer=Object.fromEntries([
  "drawLayoutOverlay","drawWallPreview","drawPlacementCandidates",
  "drawRelocationCandidates","drawDoorCandidates","drawAnnexPcCandidates"
 ].map(name=>[name,(...args)=>calls.push([name,...args])]));
 return {renderer,calls};
};
test("cena oculta não desenha nenhum overlay, mesmo com todos os modos ativos",()=>{
 const a=fake(),v={...idle,visible:false,editWall:wall,placingKind:"table",
  relocating:true,wallMode:"door",installingAnnexPc:true,hoveredWall:pending};
 drawLayoutEditorOverlay(a.renderer,state,20,{visible:false,active:true,selected:"pc:0",draft:null});
 drawPlacementInteractionOverlays(a.renderer,state,v);
 assert.deepEqual(a.calls,[]);
});
test("editor inativo não desenha seleção nem altera o estado",()=>{
 const a=fake();drawLayoutEditorOverlay(a.renderer,state,12,{visible:true,active:false,selected:"pc:0",draft:null});
 assert.deepEqual(a.calls,[]);
});
test("editor ativo desenha exatamente seleção, rascunho e tempo recebidos",()=>{
 const a=fake(),draft={id:"pc:0",kind:"pc",label:"PC",x:0,y:0,rotation:0,w:1,d:1,surface:"floor"};
 drawLayoutEditorOverlay(a.renderer,state,14,{visible:true,active:true,selected:"pc:0",draft});
 assert.deepEqual(a.calls,[["drawLayoutOverlay",state,"pc:0",draft,14]]);
});
test("sem ferramentas ativas, a fase de prévia não desenha nada",()=>{
 const a=fake();drawPlacementInteractionOverlays(a.renderer,state,idle);
 assert.equal(a.calls.length,0);
});
test("prévia de parede do editor usa modo destaque, antes das compras",()=>{
 const a=fake();
 drawPlacementInteractionOverlays(a.renderer,state,{...idle,editWall:wall,placingKind:"plant",hoveredPlacement:"floor-2",purchaseRotation:3});
 assert.deepEqual(a.calls.map(x=>x[0]),["drawWallPreview","drawPlacementCandidates"]);
 assert.deepEqual(a.calls[0],["drawWallPreview",state,wall,true]);
 assert.deepEqual(a.calls[1],["drawPlacementCandidates",state,"plant","floor-2",3]);
});
test("reorganização conserva origem e destino das vagas existentes",()=>{
 const a=fake();
 drawPlacementInteractionOverlays(a.renderer,state,{...idle,relocating:true,relocationFrom:"floor-1",hoveredPlacement:"floor-4"});
 assert.deepEqual(a.calls,[["drawRelocationCandidates",state,"floor-1","floor-4"]]);
});
test("modo porta desenha candidatos e prefere a parede pendente",()=>{
 const a=fake();
 drawPlacementInteractionOverlays(a.renderer,state,{...idle,wallMode:"door",pendingWall:pending,hoveredWall:wall});
 assert.deepEqual(a.calls,[["drawDoorCandidates",state,pending]]);
});
test("parede usa posição de hover quando não existe prévia confirmada",()=>{
 const a=fake();
 drawPlacementInteractionOverlays(a.renderer,state,{...idle,wallMode:"build",hoveredWall:wall});
 assert.deepEqual(a.calls,[["drawWallPreview",state,wall,false]]);
});
test("modo de remoção preserva sinalização de demolição",()=>{
 const a=fake();
 drawPlacementInteractionOverlays(a.renderer,state,{...idle,wallMode:"remove",pendingWall:pending});
 assert.deepEqual(a.calls,[["drawWallPreview",state,pending,true]]);
});
test("instalação de PC anexo preserva ID da vaga selecionada",()=>{
 const a=fake();
 drawPlacementInteractionOverlays(a.renderer,state,{...idle,installingAnnexPc:true,hoveredAnnexPc:"west-1"});
 assert.deepEqual(a.calls,[["drawAnnexPcCandidates",state,"west-1"]]);
});
test("ordem das cinco prévias e duas fases de pintura é determinística",()=>{
 const a=fake();
 drawLayoutEditorOverlay(a.renderer,state,11,{visible:true,active:true,selected:null,draft:null});
 a.calls.push(["popups","entre seleção e prévias"]);
 drawPlacementInteractionOverlays(a.renderer,state,{...idle,editWall:wall,placingKind:"poster",relocating:true,
  wallMode:"door",pendingWall:pending,installingAnnexPc:true});
 assert.deepEqual(a.calls.map(x=>x[0]),[
  "drawLayoutOverlay","popups","drawWallPreview","drawPlacementCandidates",
  "drawRelocationCandidates","drawDoorCandidates","drawAnnexPcCandidates"]);
});
test("renderizador não modifica saldo, RNG, relógio nem save importado",()=>{
 const game=createGame(9802),before=JSON.stringify(game),a=fake();
 drawPlacementInteractionOverlays(a.renderer,game,{...idle,placingKind:"table",purchaseRotation:2});
 assert.equal(JSON.stringify(game),before);
 assert.equal(isValidSave(parseImportedSave(serializeSave(game))),true);
});
test("orquestração fica no render; main preserva popups, ordem e controles touch",()=>{
 const root=new URL("../src/",import.meta.url);
 const render=readFileSync(new URL("render/interactionOverlays.ts",root),"utf8");
 const main=readFileSync(new URL("main.ts",root),"utf8");
 assert.doesNotMatch(render,/\b(document|window|addEventListener|requestAnimationFrame|stepGame)\b/);
 assert.match(main,/drawLayoutEditorOverlay\(renderer,game,elapsed/);
 assert.match(main,/drawPlacementInteractionOverlays\(renderer,game/);
 assert.match(main,/paintPayments\(dt,paintScene\)/);
 const early=main.indexOf("drawLayoutEditorOverlay(renderer,game,elapsed");
 const popups=main.indexOf("paintPayments(dt,paintScene)");
 const late=main.indexOf("drawPlacementInteractionOverlays(renderer,game");
 assert.ok(early>=0&&popups>early&&late>popups);
 assert.match(main,/canvas\.addEventListener\("pointermove"/);
 assert.match(main,/canvas\.addEventListener\("click"/);
 assert.match(main,/setInterval\(save,8000\)/);
});
