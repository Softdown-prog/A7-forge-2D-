import {sourceModule,assertSourceCall,assertCallsInOrder} from "./helpers/composition.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createFrameSimulationCoordinator} from "../dist/js/application/frameSimulationCoordinator.js";

const active={
 playing:true,accountOpen:false,beforeCampaignEnd:true,
 editingLayout:false,placingFurniture:false,relocatingFurniture:false,
 editingWalls:false,installingAnnexPc:false
};
function fixture(){
 const calls=[],actions={
  resetMotion:()=>calls.push("reset"),
  captureMotion:()=>calls.push("capture"),
  advance:minutes=>calls.push(["advance",minutes])
 };
 const coordinator=createFrameSimulationCoordinator(actions);
 return {calls,coordinator,
  run:(activity={},dt=.25,leftover=0)=>coordinator.run({...active,...activity},dt,leftover)};
}
test("quadro ativo reinicia a interpolação antes de capturar e avançar",()=>{
 const x=fixture();x.run();
 assert.deepEqual(x.calls,["reset","capture",["advance",1]]);
});
test("avanço mantém proporção de quatro minutos simulados por segundo",()=>{
 const x=fixture();x.run({},.5);
 assert.deepEqual(x.calls,["reset","capture",["advance",2]]);
});
test("fração de minuto não produz captura prematura",()=>{
 const x=fixture();x.run({},.1,0);
 assert.deepEqual(x.calls,["reset",["advance",.4]]);
});
test("sobra de minuto exige captura antes do avanço",()=>{
 const x=fixture();x.run({},.1,.6);
 assert.deepEqual(x.calls,["reset","capture",["advance",.4]]);
});
test("limite exato de um minuto permite captura",()=>{
 const x=fixture();x.run({},.125,.5);
 assert.deepEqual(x.calls,["reset","capture",["advance",.5]]);
});
test("menu inicial não captura, não avança e não reinicia movimento novo",()=>{
 const x=fixture();x.run({playing:false});
 assert.deepEqual(x.calls,[]);
});
test("Minha conta suspende relógio e captura de movimento",()=>{
 const x=fixture();x.run({accountOpen:true});assert.deepEqual(x.calls,[]);
});
test("editor e operações de móveis suspendem movimento e simulação",()=>{
 for(const key of ["editingLayout","placingFurniture","relocatingFurniture","editingWalls","installingAnnexPc"]){
  const x=fixture();x.run({[key]:true});
  assert.deepEqual(x.calls,[],key);
 }
});
test("após fim da campanha avança finalização sem capturar movimento",()=>{
 const x=fixture();x.run({beforeCampaignEnd:false});
 assert.deepEqual(x.calls,[["advance",1]]);
});
test("ao iniciar movimento, reset ocorre apenas na primeira transição",()=>{
 const x=fixture();x.run();x.run();
 assert.deepEqual(x.calls,["reset","capture",["advance",1],"capture",["advance",1]]);
});
test("pausar editor depois de mover reseta uma única vez",()=>{
 const x=fixture();x.run();x.calls.length=0;
 x.run({editingLayout:true});x.run({editingLayout:true});
 assert.deepEqual(x.calls,["reset"]);
});
test("voltar do editor reseta antes da próxima captura e avanço",()=>{
 const x=fixture();x.run();x.run({editingLayout:true});x.calls.length=0;
 x.run();
 assert.deepEqual(x.calls,["reset","capture",["advance",1]]);
});
test("chegar ao fim da campanha reseta interpolação mantendo finalização",()=>{
 const x=fixture();x.run();x.calls.length=0;
 x.run({beforeCampaignEnd:false});x.run({beforeCampaignEnd:false});
 assert.deepEqual(x.calls,["reset",["advance",1],["advance",1]]);
});
test("retomar novo jogo restaura a captura sem manter estados antigos",()=>{
 const x=fixture();x.run();x.run({playing:false});x.calls.length=0;x.run();
 assert.deepEqual(x.calls,["reset","capture",["advance",1]]);
});
test("o módulo usa callbacks para consultar partida importada a cada frame",()=>{
 const x=fixture();let live={minutes:0};
 const calls=[],coordinator=createFrameSimulationCoordinator({
  resetMotion:()=>calls.push("reset"),
  captureMotion:()=>calls.push("capture:"+live.minutes),
  advance:minutes=>{live.minutes+=minutes;calls.push("advance:"+live.minutes);}
 });
 coordinator.run(active,.25,0);live={minutes:50};
 coordinator.run(active,.25,0);
 assert.deepEqual(calls,["reset","capture:0","advance:1","capture:50","advance:51"]);
});
test("erro na captura impede avançar e não é mascarado",()=>{
 const calls=[],coordinator=createFrameSimulationCoordinator({
  resetMotion:()=>calls.push("reset"),
  captureMotion:()=>{calls.push("capture");throw Error("motion failed");},
  advance:()=>calls.push("advance")
 });
 assert.throws(()=>coordinator.run(active,.25,0),/motion failed/);
 assert.deepEqual(calls,["reset","capture"]);
});
test("erro no passo da simulação não oculta a falha",()=>{
 const coordinator=createFrameSimulationCoordinator({
  resetMotion:()=>{},captureMotion:()=>{},
  advance:()=>{throw Error("step failed");}
 });
 assert.throws(()=>coordinator.run(active,.25,0),/step failed/);
});
test("cada coordenador mantém seu estado de transição isolado",()=>{
 const a=fixture(),b=fixture();a.run();b.run();
 a.calls.length=0;b.calls.length=0;a.run({playing:false});b.run();
 assert.deepEqual(a.calls,["reset"]);
 assert.deepEqual(b.calls,["capture",["advance",1]]);
});
test("fronteira não importa engine, render, DOM ou save",()=>{
 const root=new URL("../src/",import.meta.url);
 const coordinator=readFileSync(new URL("application/frameSimulationCoordinator.ts",root),"utf8");
 assert.doesNotMatch(coordinator,/from\s*["']\.\.\/(?:sim|render|ui|audio)\//);
 assert.doesNotMatch(coordinator,/\b(GameState|document|window|localStorage|CanvasRenderingContext2D|requestAnimationFrame|setInterval|stepGame)\b/);
 assert.match(coordinator,/frameActivitySnapshot\(activity\)/);
 assert.ok(coordinator.indexOf("actions.captureMotion()")<coordinator.indexOf("actions.advance(minutes)"));
 assert.match(sourceModule("ui/runtimeLoop.ts"),/const frameSimulation=createFrameSimulationCoordinator\(\{/);
 assertSourceCall("render/gameScene.ts","sceneMotion.capture",["source()"] );
 assertSourceCall("application/gameFramePort.ts","stepGame",["getState()","minutes"]);
 assert.match(sourceModule("ui/runtimeLoop.ts"),/frameSimulation\.run\(\{/);
 assertCallsInOrder("ui/runtimeLoop.ts",["frameSimulation.run","framePort.dispatch","framePresentation.render"]);
});
