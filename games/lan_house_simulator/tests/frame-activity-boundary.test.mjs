import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {frameActivitySnapshot} from "../dist/js/application/frameActivity.js";

const base={
 playing:true,accountOpen:false,beforeCampaignEnd:true,editingLayout:false,
 placingFurniture:false,relocatingFurniture:false,editingWalls:false,installingAnnexPc:false
};
const flags=changes=>frameActivitySnapshot({...base,...changes});

test("partida em execução captura movimento e avança relógio",()=>{
 assert.deepEqual(flags({}),{advanceSimulation:true,captureMotion:true});
});
test("menu inicial não avança nem interpola",()=>{
 assert.deepEqual(flags({playing:false}),{advanceSimulation:false,captureMotion:false});
});
test("painel Minha Conta suspende simulação sem alterar estado",()=>{
 assert.deepEqual(flags({accountOpen:true}),{advanceSimulation:false,captureMotion:false});
});
test("editor visual suspende simulação durante os ajustes",()=>{
 assert.deepEqual(flags({editingLayout:true}),{advanceSimulation:false,captureMotion:false});
});
test("posição de móvel, reorganização, divisória e PC anexo suspendem relógio",()=>{
 for(const key of ["placingFurniture","relocatingFurniture","editingWalls","installingAnnexPc"]){
  const view=flags({[key]:true});
  assert.equal(view.advanceSimulation,false,key);
  assert.equal(view.captureMotion,false,key);
 }
});
test("após fim da campanha só a captura de movimento para: finalização permanece elegível",()=>{
 assert.deepEqual(flags({beforeCampaignEnd:false}),{advanceSimulation:true,captureMotion:false});
});
test("com fim da campanha e editor aberto, relógio continua suspenso",()=>{
 assert.deepEqual(flags({beforeCampaignEnd:false,editingLayout:true}),{advanceSimulation:false,captureMotion:false});
});
test("cada combinação reproduz os antigos predicados, sem regras novas",()=>{
 const bools=[false,true],keys=Object.keys(base);
 for(let mask=0;mask<(1<<keys.length);mask++){
  const params=Object.fromEntries(keys.map((key,i)=>[key,bools[(mask>>i)&1]]));
  const wasStep=params.playing&&!params.accountOpen&&!params.editingLayout&&!params.placingFurniture&&
   !params.relocatingFurniture&&!params.editingWalls&&!params.installingAnnexPc;
  const wasCapture=wasStep&&params.beforeCampaignEnd;
  assert.deepEqual(frameActivitySnapshot(params),{advanceSimulation:wasStep,captureMotion:wasCapture});
 }
});
test("projeção não toca no save e continua válida após exportação",()=>{
 const game=createGame(9701,"historical"),old=JSON.stringify(game);
 assert.equal(flags({editingWalls:true}).advanceSimulation,false);
 assert.equal(JSON.stringify(game),old);
 assert.equal(isValidSave(parseImportedSave(serializeSave(game))),true);
});
test("fronteira não importa o motor nem DOM; main mantém captura antes do step e persistência",()=>{
 const root=new URL("../src/",import.meta.url);
 const module=readFileSync(new URL("application/frameActivity.ts",root),"utf8");
 const main=readFileSync(new URL("main.ts",root),"utf8");
 assert.doesNotMatch(module,/from\s*["']\.\.\/(sim|ui|render|audio)\//);
 assert.doesNotMatch(module,/\b(document|window|GameState|HTMLElement|requestAnimationFrame)\b/);
 assert.ok(main.includes("frameActivitySnapshot({"));
 assert.ok(main.includes("beforeCampaignEnd:game.totalMinutes<GAME_LAST_MINUTE"));
 assert.ok(main.includes("if(wasSimulating!==simulating)"));
 const captured=main.indexOf("if(simulating&&game.leftoverMinutes+dt*4.0>=1)sceneMotion.capture(game)");
 const stepped=main.indexOf("if(advanceSimulation)stepGame(game,dt*4.0)");
 assert.ok(captured>=0&&stepped>captured);
 const lifecycle=readFileSync(new URL("ui/pageSaveLifecycle.ts",root),"utf8");
 assert.ok(main.includes("installPageSaveLifecycle({win:window,doc:document,every:setInterval,save})"));
 assert.match(lifecycle,/options\.every\(options\.save,8000\)/);
 assert.ok(main.includes("requestAnimationFrame(frame)"));
});
