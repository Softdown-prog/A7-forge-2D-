import {sourceModule,assertSourceCall} from "./helpers/composition.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame,pcPosition,isValidSave} from "../dist/js/sim/engine.js";
import {computerSeat} from "../dist/js/sim/route.js";
import {createMenuScenePreview} from "../dist/js/application/menuScenePreviewPort.js";
import {createMenuPreviewPainter} from "../dist/js/ui/menuPreviewPainter.js";

test("prévia contém duas estações com clientes posicionados nas cadeiras",()=>{
 const preview=createMenuScenePreview();
 assert.equal(preview.customers.length,2);
 for(const [i,c] of preview.customers.entries()){
  const seat=computerSeat(pcPosition(i,preview));
  assert.equal(c.x,seat.x);
  assert.equal(c.y,seat.y);
  assert.deepEqual(c.target,seat);
  assert.equal(c.pcIndex,i);
  assert.equal(c.stage,"using");
  assert.equal(c.facing,"north");
 }
});
test("prévia usa a mesma semente ornamental de antes",()=>{
 const a=createMenuScenePreview(),b=createGame(98);
 assert.equal(a.seed,b.seed);
 assert.equal(a.totalMinutes,b.totalMinutes);
 assert.equal(a.cash,b.cash);
 assert.equal(a.customers.length,2);
});
test("prévia não consome estado do jogo ativo nem altera suas regras",()=>{
 const active=createGame(72421),before=JSON.stringify(active);
 const preview=createMenuScenePreview();
 assert.equal(JSON.stringify(active),before);
 assert.notEqual(active,preview);
 assert.equal(isValidSave(active),true);
});
test("cada montagem de prévia recebe nova instância sem compartilhar arrays",()=>{
 const a=createMenuScenePreview(),b=createMenuScenePreview();
 a.customers[0].x=999;
 assert.notEqual(a.customers[0].x,b.customers[0].x);
 assert.notEqual(a.customers,b.customers);
});
test("a imagem de amostra não exige salvar, importar nem criar conta",()=>{
 const preview=createMenuScenePreview();
 assert.ok(preview.customers.every(c=>c.usedMinutes===0&&c.waitingMinutes===0&&c.offlineWait===0));
 assert.ok(preview.customers.every(c=>c.happy));
});
test("pintura inicial utiliza tempo zero e mantém a prévia disponível",()=>{
 const frames=[],p=createMenuPreviewPainter(elapsed=>frames.push(elapsed));
 p.paintInitial();assert.deepEqual(frames,[0]);
 assert.equal(p.available(),true);
});
test("o callback de pintura bem sucedida informa somente o quadro concluído",()=>{
 const calls=[],p=createMenuPreviewPainter(dt=>calls.push("draw:"+dt));
 p.paintFrame(4.5,()=>calls.push("painted"));
 assert.deepEqual(calls,["draw:4.5","painted"]);
 assert.equal(p.available(),true);
});
test("falha inicial de Canvas não lança exceção nem bloqueia navegação",()=>{
 let count=0;
 const painter=createMenuPreviewPainter(()=>{count++;throw Error("Canvas indisponível");});
 assert.doesNotThrow(()=>painter.paintInitial());
 assert.equal(painter.available(),false);
 painter.paintFrame(2,()=>{throw Error("não deveria notificar");});
 assert.equal(count,1);
});
test("falha em um frame não marca instante de pintura nem repete tentativa",()=>{
 let count=0,painted=0;
 const painter=createMenuPreviewPainter(()=>{count++;throw Error("context lost");});
 painter.paintFrame(9,()=>painted++);
 painter.paintFrame(10,()=>painted++);
 assert.equal(painter.available(),false);
 assert.equal(count,1);
 assert.equal(painted,0);
});
test("erro ao atualizar o instante também desativa somente a prévia",()=>{
 const painter=createMenuPreviewPainter(()=>{});
 painter.paintFrame(2,()=>{throw Error("timestamp");});
 assert.equal(painter.available(),false);
});
test("falha do desenho inicial não interfere no save existente",()=>{
 const active=createGame(1052),before=JSON.stringify(active);
 const painter=createMenuPreviewPainter(()=>{throw Error("no canvas");});
 painter.paintInitial();
 assert.equal(JSON.stringify(active),before);
});
test("ordem do loop preserva gate de menu e confirmação somente após desenho",()=>{
 const root=new URL("../src/",import.meta.url);
 assert.match(sourceModule("render/gameScene.ts"),/createMenuScenePreview\(\)/);
 assert.match(sourceModule("render/gameScene.ts"),/createMenuPreviewPainter\(elapsed=>menuRenderer\?\.draw\(menuPreview,elapsed\)\)/);
 assert.match(sourceModule("render/gameScene.ts"),/menuPreviewPainter\.paintInitial\(\)/);
 assertSourceCall("ui/runtimeLoop.ts","scene.menuAvailable");
 const frame=readFileSync(new URL("ui/framePresentationCoordinator.ts",root),"utf8");
 assertSourceCall("ui/runtimeLoop.ts","scene.paintMenu",["elapsed","painted"]);assertSourceCall("render/gameScene.ts","menuPreviewPainter.paintFrame",["elapsed","painted"]);
 assert.match(frame,/schedule\.menu\(input\.timestamp,input\.menuFlags\)/);
 assert.match(frame,/input\.paintMenu\(\(\)=>schedule\.menuPainted\(input\.timestamp\)\)/);
});
test("módulo de apresentação do menu não importa motor, DOM ou simulação",()=>{
 const root=new URL("../src/",import.meta.url);
 const module=readFileSync(new URL("render/menuPreviewPainter.ts",root),"utf8");
 const app=readFileSync(new URL("application/menuScenePreviewPort.ts",root),"utf8");
 assert.doesNotMatch(module,/from\s*["']\.\.\/(?:sim|application|render|audio)\//);
 assert.doesNotMatch(module,/\b(GameState|document|window|SceneRenderer|requestAnimationFrame|stepGame|localStorage)\b/);
 assert.match(app,/createGame\(98\)/);
 assert.match(app,/computerSeat\(pcPosition\(i,sample\)\)/);
 assert.doesNotMatch(app,/\b(document|window|localStorage|requestAnimationFrame)\b/);
});
