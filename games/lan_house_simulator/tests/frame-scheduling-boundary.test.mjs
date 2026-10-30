import {sourceModule,assertSourceCall} from "./helpers/composition.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createFrameSchedule} from "../dist/js/application/frameSchedule.js";
import {createPanelRevisionCache} from "../dist/js/application/panelRevisionCache.js";

const scene={playing:true,accountOpen:false,visible:true,hidden:false,
 adminOpen:false,shopOpen:false,noticesOpen:false,coarse:false};
const menu={playing:false,accountOpen:false,hasRenderer:true,previewAvailable:true,
 hidden:false,reduceMotion:false};
const hud={playing:true,accountOpen:false,lastScroll:-1000,pointerHeld:false,lastInput:-1000};

test("delta limita saltos longos a 80ms, sem voltar o relógio visual",()=>{
 const clock=createFrameSchedule();
 assert.deepEqual(clock.begin(1000),{dt:0,elapsed:0});
 assert.deepEqual(clock.begin(1016),{dt:0.016,elapsed:0.016});
 assert.deepEqual(clock.begin(4000),{dt:0.08,elapsed:0.096});
 assert.deepEqual(clock.begin(3999),{dt:0,elapsed:0.096});
});

test("cena mobile respeita 30 FPS e suspende pintura sob painéis ou aba oculta",()=>{
 const clock=createFrameSchedule();
 assert.equal(clock.scene(17,{...scene,coarse:true}),false);
 assert.equal(clock.scene(34,{...scene,coarse:true}),true);
 assert.equal(clock.scene(50,{...scene,coarse:true}),false);
 assert.equal(clock.scene(67,{...scene,coarse:true}),true);
 assert.equal(clock.scene(68,scene),true,"desktop permite pintar a cada RAF");
 for(const blocked of [{playing:false},{accountOpen:true},{visible:false},{hidden:true},
  {adminOpen:true},{shopOpen:true},{noticesOpen:true}]){
  assert.equal(clock.scene(100,{...scene,...blocked}),false);
 }
});

test("prévia do menu usa limite estrito e só avança quando Canvas desenhou",()=>{
 const clock=createFrameSchedule();
 assert.equal(clock.menu(90,menu),false);
 assert.equal(clock.menu(91,menu),true);
 assert.equal(clock.menu(92,menu),true,"falha de desenho não deve atualizar a marca");
 clock.menuPainted(92);
 assert.equal(clock.menu(182,menu),false);
 assert.equal(clock.menu(183,menu),true);
 for(const blocked of [{playing:true},{accountOpen:true},{hasRenderer:false},
  {previewAvailable:false},{hidden:true},{reduceMotion:true}]){
  assert.equal(clock.menu(200,{...menu,...blocked}),false);
 }
});

test("HUD respeita limite de 450ms, toque ativo, scroll e conta aberta",()=>{
 const clock=createFrameSchedule();
 assert.equal(clock.hud(451,hud),true);
 assert.equal(clock.hud(800,hud),false);
 assert.equal(clock.hud(902,{...hud,lastScroll:900}),false);
 assert.equal(clock.hud(902,{...hud,pointerHeld:true}),false);
 assert.equal(clock.hud(902,{...hud,lastInput:900}),false);
 assert.equal(clock.hud(902,{...hud,accountOpen:true}),false);
 assert.equal(clock.hud(902,{...hud,playing:false}),false);
 assert.equal(clock.hud(902,hud),true);
 assert.equal(clock.hud(902,hud),false);
 assert.equal(clock.hud(1400,hud),true);
});

test("cache de painéis ignora revisões iguais e mantém forçar redesenho",()=>{
 const changed=createPanelRevisionCache();
 assert.equal(changed("shop",[1,{cash:20}],false),true);
 assert.equal(changed("shop",[1,{cash:20}],false),false);
 assert.equal(changed("notices",[1,{cash:20}],false),true);
 assert.equal(changed("shop",[1,{cash:21}],false),true);
 assert.equal(changed("shop",[1,{cash:21}],true),true);
 assert.equal(changed("shop",[1,{cash:21}],false),false);
});

test("o agendador não importa DOM/motor e main preserva simulação e autosave",()=>{
 const root=new URL("../src/",import.meta.url);
 for(const file of ["application/frameSchedule.ts","application/panelRevisionCache.ts"]){
  const source=readFileSync(new URL(file,root),"utf8");
  assert.doesNotMatch(source,/from\s*["']\.\.\/sim\//);
  assert.doesNotMatch(source,/\b(document|window|HTMLElement|requestAnimationFrame|GameState)\b/);
 }
 assert.match(sourceModule("ui/runtimeLoop.ts"),/frameSchedule\.begin\(timestamp\)/);
 const painter=readFileSync(new URL("ui/framePresentationCoordinator.ts",root),"utf8");
 assert.match(painter,/schedule\.scene\(input.timestamp/);
 assert.match(painter,/schedule\.menu\(input.timestamp/);
 assert.match(painter,/schedule\.menuPainted\(input.timestamp\)/);
 assert.match(painter,/schedule\.hud\(input.timestamp/);
 assert.match(sourceModule("ui/runtimeLoop.ts"),/createFramePresentationCoordinator\(frameSchedule\)/);
 assert.match(sourceModule("ui/gamePanels.ts"),/createPanelRevisionCache\(\)/);
 assert.match(sourceModule("ui/runtimeLoop.ts"),/requestAnimationFrame\(frame\)/);
 const lifecycle=readFileSync(new URL("ui/pageSaveLifecycle.ts",root),"utf8");
 assertSourceCall("ui/runtimeSessionController.ts","installPageSaveLifecycle",["{win:options.window,doc:document,every:(callback,ms)=>options.window.setInterval(callback,ms),save}"]);
 assert.match(lifecycle,/options\.every\(options\.save,8000\)/);
 assertSourceCall("application/gameFramePort.ts","stepGame",["getState()","minutes"]);
 const step=readFileSync(new URL("application/frameSimulationCoordinator.ts",root),"utf8");
 assert.match(step,/const minutes=dt\*4\.0/);
 assert.match(sourceModule("ui/runtimeLoop.ts"),/new IntersectionObserver/);
});
