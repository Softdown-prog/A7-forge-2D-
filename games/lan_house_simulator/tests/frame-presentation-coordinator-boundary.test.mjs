import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createFrameSchedule} from "../dist/js/application/frameSchedule.js";
import {createFramePresentationCoordinator} from "../dist/js/ui/framePresentationCoordinator.js";

const scene={playing:true,accountOpen:false,visible:true,hidden:false,adminOpen:false,
 shopOpen:false,noticesOpen:false,coarse:false};
const menu={playing:false,accountOpen:false,hasRenderer:true,previewAvailable:true,
 hidden:false,reduceMotion:false};
const hud={playing:true,accountOpen:false,lastScroll:-1000,pointerHeld:false,lastInput:-1000};
function fixture(gates={scene:true,menu:true,hud:true}){
 const calls=[],captured={};
 const schedule={
  scene:(t,f)=>{calls.push("gate:scene");captured.scene=[t,f];return gates.scene;},
  menu:(t,f)=>{calls.push("gate:menu");captured.menu=[t,f];return gates.menu;},
  menuPainted:t=>calls.push("painted:"+t),
  hud:(t,f)=>{calls.push("gate:hud");captured.hud=[t,f];return gates.hud;}
 };
 const input={timestamp:451,sceneFlags:scene,menuFlags:menu,hudFlags:hud,accessVisible:true,
  drawScene:()=>calls.push("scene"),
  drawAccessOverlay:()=>calls.push("access"),
  drawEditorOverlay:v=>calls.push("editor:"+v),
  paintMenu:done=>{calls.push("menu");done();},
  drawEffects:v=>calls.push("effects:"+v),
  drawPlacementOverlay:v=>calls.push("placement:"+v),
  refreshHud:()=>calls.push("hud")};
 const coordinator=createFramePresentationCoordinator(schedule);
 return {calls,captured,input,schedule,coordinator,render:()=>coordinator.render(input)};
}
test("ordem de pintura e HUD idêntica à anterior",()=>{
 const x=fixture();x.render();
 assert.deepEqual(x.calls,["gate:scene","scene","access","editor:true",
  "gate:menu","menu","painted:451","effects:true","placement:true","gate:hud","hud"]);
});
test("a API não retorna frame nem altera regras visuais",()=>{
 const x=fixture();assert.equal(x.render(),undefined);
});
test("cena fechada não desenha salão nem mapa de acesso",()=>{
 const x=fixture({scene:false,menu:true,hud:true});x.render();
 assert.equal(x.calls.includes("scene"),false);assert.equal(x.calls.includes("access"),false);
 assert.ok(x.calls.includes("editor:false"));assert.ok(x.calls.includes("effects:false"));
 assert.ok(x.calls.includes("placement:false"));
});
test("marcações de acesso só pintam quando habilitadas",()=>{
 const x=fixture();x.input.accessVisible=false;x.render();
 assert.equal(x.calls.includes("access"),false);assert.equal(x.calls.includes("scene"),true);
});
test("sem menu elegível não chama pintor nem avança timestamp",()=>{
 const x=fixture({scene:true,menu:false,hud:true});x.render();
 assert.equal(x.calls.includes("menu"),false);assert.equal(x.calls.includes("painted:451"),false);
});
test("sem HUD elegível não repinta painel",()=>{
 const x=fixture({scene:true,menu:true,hud:false});x.render();
 assert.ok(x.calls.includes("gate:hud"));assert.ok(!x.calls.includes("hud"));
});
test("todos os flags e timestamp são repassados sem normalização",()=>{
 const x=fixture();x.render();
 assert.equal(x.captured.scene[0],451);assert.equal(x.captured.scene[1],scene);
 assert.equal(x.captured.menu[1],menu);assert.equal(x.captured.hud[1],hud);
});
test("menu só marca relógio após confirmação do Canvas",()=>{
 const x=fixture();let done;
 x.input.paintMenu=cb=>{done=cb;};x.render();
 assert.equal(x.calls.includes("painted:451"),false);done();
 assert.equal(x.calls.includes("painted:451"),true);
});
test("falha no menu não marca desenho nem chama HUD",()=>{
 const x=fixture();x.input.paintMenu=()=>{throw Error("menu failed");};
 assert.throws(()=>x.render(),/menu failed/);
 assert.ok(!x.calls.some(s=>s.startsWith("painted:")));
 assert.ok(!x.calls.includes("gate:hud"));
});
test("erro de Canvas impede a continuação do frame",()=>{
 const x=fixture();x.input.drawScene=()=>{throw Error("canvas failed");};
 assert.throws(()=>x.render(),/canvas failed/);
 assert.deepEqual(x.calls,["gate:scene"]);
});
test("erro de atualização do HUD não é mascarado",()=>{
 const x=fixture();x.input.refreshHud=()=>{throw Error("hud failed");};
 assert.throws(()=>x.render(),/hud failed/);
});
test("callbacks são vivos mesmo após substituição da partida",()=>{
 const x=fixture();let current={cash:25};
 x.input.drawScene=()=>x.calls.push("cash:"+current.cash);
 x.render();current={cash:50};x.render();
 assert.ok(x.calls.includes("cash:25"));assert.ok(x.calls.includes("cash:50"));
});
test("pode trocar o pintor entre quadros",()=>{
 const x=fixture();x.render();
 x.input.drawScene=()=>x.calls.push("other-painter");x.render();
 assert.equal(x.calls.filter(v=>v==="other-painter").length,1);
});
test("agendador real mantém teto de 30 FPS no mobile",()=>{
 const x=fixture(),coordinator=createFramePresentationCoordinator(createFrameSchedule());
 x.input.sceneFlags={...scene,coarse:true};
 x.input.timestamp=17;coordinator.render(x.input);
 assert.equal(x.calls.includes("scene"),false);
 x.input.timestamp=34;coordinator.render(x.input);
 assert.equal(x.calls.filter(v=>v==="scene").length,1);
});
test("conta aberta impede cena, prévia e HUD com agendador real",()=>{
 const x=fixture(),coordinator=createFramePresentationCoordinator(createFrameSchedule());
 x.input.timestamp=901;
 x.input.sceneFlags={...scene,accountOpen:true};
 x.input.menuFlags={...menu,accountOpen:true};
 x.input.hudFlags={...hud,accountOpen:true};
 coordinator.render(x.input);
 assert.ok(!x.calls.includes("scene"));assert.ok(!x.calls.includes("menu"));
 assert.ok(!x.calls.includes("hud"));
});
test("menu real respeita intervalo estrito de 90 milissegundos",()=>{
 const x=fixture(),coordinator=createFramePresentationCoordinator(createFrameSchedule());
 x.input.sceneFlags={...scene,playing:false};x.input.hudFlags={...hud,playing:false};
 x.input.timestamp=90;coordinator.render(x.input);
 assert.ok(!x.calls.includes("menu"));
 x.input.timestamp=91;coordinator.render(x.input);
 assert.equal(x.calls.filter(v=>v==="menu").length,1);
 x.input.timestamp=181;coordinator.render(x.input);
 assert.equal(x.calls.filter(v=>v==="menu").length,1);
 x.input.timestamp=182;coordinator.render(x.input);
 assert.equal(x.calls.filter(v=>v==="menu").length,2);
});
test("redução de movimento bloqueia apenas prévia do menu",()=>{
 const x=fixture(),coordinator=createFramePresentationCoordinator(createFrameSchedule());
 x.input.timestamp=451;x.input.menuFlags={...menu,reduceMotion:true};
 coordinator.render(x.input);
 assert.ok(!x.calls.includes("menu"));assert.ok(x.calls.includes("effects:true"));
});
test("touch e scroll recente adiam HUD sem afetar controles do editor",()=>{
 const x=fixture(),coordinator=createFramePresentationCoordinator(createFrameSchedule());
 x.input.timestamp=451;x.input.hudFlags={...hud,pointerHeld:true};
 coordinator.render(x.input);assert.ok(!x.calls.includes("hud"));
 x.input.hudFlags={...hud,lastScroll:440};
 coordinator.render(x.input);assert.ok(!x.calls.includes("hud"));
 x.input.hudFlags={...hud};coordinator.render(x.input);
 assert.equal(x.calls.filter(v=>v==="hud").length,1);
});
test("módulo de interface não importa motor, browser, Canvas nem salva",()=>{
 const src=readFileSync(new URL("../src/ui/framePresentationCoordinator.ts",import.meta.url),"utf8");
 assert.doesNotMatch(src,/from\s*["']\.\.\/(sim|render|audio)\//);
 assert.doesNotMatch(src,/\b(GameState|stepGame|requestAnimationFrame|document|window|localStorage|CanvasRenderingContext2D)\b/);
});
test("main mantém simulação e correio antes da pintura",()=>{
 const main=readFileSync(new URL("../src/main.ts",import.meta.url),"utf8");
 const ui=readFileSync(new URL("../src/ui/framePresentationCoordinator.ts",import.meta.url),"utf8");
 assert.ok(main.includes("createFramePresentationCoordinator(frameSchedule)"));
 assert.ok(main.includes("framePresentation.render({"));
 assert.ok(main.indexOf("frameSimulation.run({")<main.indexOf("dispatchFrameEvents({"));
 assert.ok(main.indexOf("dispatchFrameEvents({")<main.indexOf("framePresentation.render({"));
 assert.ok(main.includes("paintMenu:painted=>{if(menuRenderer)menuPreviewPainter.paintFrame(elapsed,painted);}"));
 assert.ok(ui.includes("schedule.menuPainted(input.timestamp)"));
});
