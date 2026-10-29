import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {renderFrameVisualLayers} from "../dist/js/ui/frameVisualLayers.js";

function harness({sceneVisible=true,accessVisible=true}={}){
 const calls=[];
 const callbacks={
  drawScene:()=>calls.push("scene"),
  drawAccessOverlay:()=>calls.push("access"),
  drawEditorOverlay:()=>calls.push("editor"),
  drawMenuPreview:()=>calls.push("menu"),
  drawEffects:()=>calls.push("effects"),
  drawPlacementOverlay:()=>calls.push("placement")
 };
 return {calls,layers:{sceneVisible,accessVisible,...callbacks},callbacks,
  render(){return renderFrameVisualLayers(this.layers);}};
}
test("quadro visível mantém ordem cena, acesso, editor, menu, efeitos e colocação",()=>{
 const x=harness();assert.equal(x.render(),undefined);
 assert.deepEqual(x.calls,["scene","access","editor","menu","effects","placement"]);
});
test("sem acesso bloqueado não pinta marcações de serviço",()=>{
 const x=harness({accessVisible:false});x.render();
 assert.deepEqual(x.calls,["scene","editor","menu","effects","placement"]);
});
test("cena não visível evita desenhar Canvas e mapa de acesso",()=>{
 const x=harness({sceneVisible:false});x.render();
 assert.deepEqual(x.calls,["editor","menu","effects","placement"]);
});
test("acesso ativo não força desenho quando Canvas do salão está oculto",()=>{
 const x=harness({sceneVisible:false,accessVisible:true});x.render();
 assert.equal(x.calls.includes("scene"),false);
 assert.equal(x.calls.includes("access"),false);
});
test("editor permanece depois da cena e antes do menu",()=>{
 const x=harness();x.render();
 assert.ok(x.calls.indexOf("scene")<x.calls.indexOf("editor"));
 assert.ok(x.calls.indexOf("editor")<x.calls.indexOf("menu"));
});
test("efeitos permanecem depois do menu e antes do editor de colocação",()=>{
 const x=harness();x.render();
 assert.ok(x.calls.indexOf("menu")<x.calls.indexOf("effects"));
 assert.ok(x.calls.indexOf("effects")<x.calls.indexOf("placement"));
});
test("cada camada só é chamada uma vez por quadro",()=>{
 const x=harness();x.render();
 for(const name of ["scene","access","editor","menu","effects","placement"])
  assert.equal(x.calls.filter(v=>v===name).length,1);
});
test("dois quadros chamam os renders duas vezes sem criar ouvintes",()=>{
 const x=harness();x.render();x.render();
 assert.equal(x.calls.length,12);
 assert.deepEqual(x.calls.slice(0,6),x.calls.slice(6));
});
test("mudança de visibilidade entre quadros não preserva dados antigos",()=>{
 const x=harness();x.render();x.calls.length=0;
 x.layers.sceneVisible=false;
 x.render();assert.deepEqual(x.calls,["editor","menu","effects","placement"]);
 x.calls.length=0;x.layers.sceneVisible=true;x.layers.accessVisible=false;
 x.render();assert.deepEqual(x.calls,["scene","editor","menu","effects","placement"]);
});
test("camada do menu permanece responsável por tratar seu próprio erro de Canvas",()=>{
 const x=harness();x.callbacks.drawMenuPreview=()=>{x.calls.push("menu");throw new Error("paint failed");};
 x.layers.drawMenuPreview=x.callbacks.drawMenuPreview;
 assert.throws(()=>x.render(),/paint failed/);
 assert.deepEqual(x.calls,["scene","access","editor","menu"]);
});
test("callbacks podem consultar save importado sem o coordenador reter estado",()=>{
 const state={cash:100};
 const x=harness();
 x.layers.drawScene=()=>x.calls.push("scene:"+state.cash);
 x.layers.drawEffects=()=>x.calls.push("effects:"+state.cash);
 x.render();state.cash=250;x.render();
 assert.ok(x.calls.includes("scene:100"));
 assert.ok(x.calls.includes("scene:250"));
 assert.ok(x.calls.includes("effects:250"));
});
test("coordenador não importa motor, áudio, renderer nem APIs de browser",()=>{
 const root=new URL("../src/",import.meta.url);
 const module=readFileSync(new URL("ui/frameVisualLayers.ts",root),"utf8");
 const main=readFileSync(new URL("main.ts",root),"utf8");
 assert.doesNotMatch(module,/from\s*["']\.\.\/(?:sim|audio|render)\//);
 assert.doesNotMatch(module,/\b(GameState|stepGame|requestAnimationFrame|document|window|CanvasRenderingContext2D|addEventListener)\b/);
 assert.match(main,/renderFrameVisualLayers\(\{/);
 assert.match(main,/frameSchedule.scene\(timestamp,/);
 assert.match(main,/frameSchedule.menu\(timestamp,/);
 assert.match(main,/frameSchedule.menuPainted\(timestamp\)/);
 assert.match(main,/frameSchedule.hud\(timestamp,/);
 assert.match(main,/if\(advanceSimulation\)stepGame\(game,dt\*4\.0\)/);
 const lifecycle=readFileSync(new URL("ui/pageSaveLifecycle.ts",root),"utf8");
 assert.match(main,/installPageSaveLifecycle\(\{win:window,doc:document,every:setInterval,save\}\)/);
 assert.match(lifecycle,/options\.every\(options\.save,8000\)/);
 assert.match(main,/requestAnimationFrame\(frame\)/);
});
