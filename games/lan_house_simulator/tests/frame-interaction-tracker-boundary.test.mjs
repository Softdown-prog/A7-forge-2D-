import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {installFrameInteractionTracker} from "../dist/js/ui/frameInteractionTracker.js";
import {createFrameSchedule} from "../dist/js/application/frameSchedule.js";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
function fixture(){
 let time=0;
 const docEvents=new Map(),winEvents=new Map(),registration=[];
 const doc={addEventListener:(name,listener,options)=>{docEvents.set(name,listener);registration.push({place:"doc",name,options});}};
 const win={addEventListener:(name,listener,options)=>{winEvents.set(name,listener);registration.push({place:"win",name,options});}};
 const tracker=installFrameInteractionTracker(doc,win,()=>time);
 return {
  tracker,docEvents,winEvents,registration,
  emit:(place,name,at)=>{time=at;const handler=(place==="doc"?docEvents:winEvents).get(name);assert.ok(handler,name);handler({type:name});}
 };
}
test("HUD começa sem atividade e sem toque pressionado",()=>{
 const x=fixture();
 assert.deepEqual(x.tracker.snapshot(),{lastScroll:-1000,lastInput:-1000,pointerHeld:false});
});
test("listeners continuam na captura e são passivos nos eventos de toque e rolagem",()=>{
 const x=fixture();
 assert.deepEqual(x.registration.map(r=>[r.place,r.name]),[
  ["doc","scroll"],["doc","pointerdown"],["doc","pointerup"],["doc","pointercancel"],["win","blur"]]);
 for(const registration of x.registration.slice(0,4))
  assert.deepEqual(registration.options,{capture:true,passive:true});
 assert.equal(x.registration[4].options,undefined);
});
test("scroll atualiza somente o instante de rolagem",()=>{
 const x=fixture();x.emit("doc","scroll",100);
 assert.deepEqual(x.tracker.snapshot(),{lastScroll:100,lastInput:-1000,pointerHeld:false});
 x.emit("doc","scroll",120);
 assert.equal(x.tracker.snapshot().lastScroll,120);
});
test("pointerdown marca dedo pressionado e instante da entrada",()=>{
 const x=fixture();x.emit("doc","pointerdown",250);
 assert.deepEqual(x.tracker.snapshot(),{lastScroll:-1000,lastInput:250,pointerHeld:true});
});
test("pointerdown repetido atualiza o momento sem liberar o toque",()=>{
 const x=fixture();x.emit("doc","pointerdown",250);x.emit("doc","pointerdown",320);
 assert.equal(x.tracker.snapshot().lastInput,320);
 assert.equal(x.tracker.snapshot().pointerHeld,true);
});
test("pointerup solta o toque e segura a atualização imediata do HUD",()=>{
 const x=fixture();x.emit("doc","pointerdown",100);x.emit("doc","pointerup",240);
 assert.deepEqual(x.tracker.snapshot(),{lastScroll:-1000,lastInput:240,pointerHeld:false});
});
test("pointercancel tem o mesmo encerramento que pointerup",()=>{
 const x=fixture();x.emit("doc","pointerdown",100);x.emit("doc","pointercancel",130);
 assert.deepEqual(x.tracker.snapshot(),{lastScroll:-1000,lastInput:130,pointerHeld:false});
});
test("perda de foco libera o toque sem substituir a marca temporal da entrada",()=>{
 const x=fixture();x.emit("doc","pointerdown",215);x.emit("win","blur",400);
 assert.deepEqual(x.tracker.snapshot(),{lastScroll:-1000,lastInput:215,pointerHeld:false});
});
test("scroll durante o toque mantém bloqueio até pointerup",()=>{
 const x=fixture();x.emit("doc","pointerdown",200);x.emit("doc","scroll",210);
 assert.deepEqual(x.tracker.snapshot(),{lastScroll:210,lastInput:200,pointerHeld:true});
 x.emit("doc","pointerup",230);
 assert.deepEqual(x.tracker.snapshot(),{lastScroll:210,lastInput:230,pointerHeld:false});
});
test("snapshots anteriores não mudam quando chegam novos eventos",()=>{
 const x=fixture(),initial=x.tracker.snapshot();
 x.emit("doc","scroll",42);
 assert.deepEqual(initial,{lastScroll:-1000,lastInput:-1000,pointerHeld:false});
 assert.notEqual(x.tracker.snapshot(),initial);
 assert.equal(x.registration.length,5,"consultar não reinstala listeners");
});
test("agenda do HUD mantém janelas de 450, 160 e 120 ms sem alteração",()=>{
 const x=fixture(),schedule=createFrameSchedule();
 const due=at=>schedule.hud(at,{playing:true,accountOpen:false,...x.tracker.snapshot()});
 assert.equal(due(451),true);
 x.emit("doc","scroll",850);
 assert.equal(due(905),false,"rolagem recente adia HUD");
 assert.equal(due(1100),true);
 x.emit("doc","pointerdown",1170);
 assert.equal(due(1600),false,"toque mantido suspende HUD");
 x.emit("doc","pointerup",1580);
 assert.equal(due(1650),false,"soltura recente ainda adia HUD");
 assert.equal(due(1710),true);
});
test("monitoramento visual não altera partida nem save importado",()=>{
 const game=createGame(9901,"historical"),before=JSON.stringify(game),x=fixture();
 x.emit("doc","pointerdown",100);
 x.emit("doc","scroll",120);
 x.emit("doc","pointercancel",130);
 assert.equal(JSON.stringify(game),before);
 assert.equal(isValidSave(parseImportedSave(serializeSave(game))),true);
});
test("fronteiras de UI preservam simulação, Canvas e listeners do editor mobile",()=>{
 const root=new URL("../src/",import.meta.url);
 const ui=readFileSync(new URL("ui/frameInteractionTracker.ts",root),"utf8");
 const main=readFileSync(new URL("main.ts",root),"utf8");
 const editor=readFileSync(new URL("ui/layoutEditor.ts",root),"utf8");
 assert.doesNotMatch(ui,/from\s*["']\.\.\/sim\//);
 assert.doesNotMatch(ui,/\b(GameState|stepGame|requestAnimationFrame)\b/);
 assert.match(main,/installFrameInteractionTracker\(document,window,\(\)=>performance\.now\(\)\)/);
 assert.match(main,/frameSchedule\.hud\(timestamp,\{playing:isPlaying,accountOpen,\.\.\.frameInteraction\.snapshot\(\)\}\)/);
 assert.match(main,/new IntersectionObserver/);
 const lifecycle=readFileSync(new URL("ui/pageSaveLifecycle.ts",root),"utf8");
 assert.match(main,/installPageSaveLifecycle\(\{win:window,doc:document,every:\(callback,ms\)=>window\.setInterval\(callback,ms\),save\}\)/);
 assert.match(lifecycle,/options\.every\(options\.save,8000\)/);
 assert.match(editor,/canvas\.addEventListener\("pointerup"/);
 assert.match(editor,/canvas\.addEventListener\("pointercancel"/);
});
