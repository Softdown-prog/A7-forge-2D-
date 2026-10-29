import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {installRuntimeInteractionBindings} from "../dist/js/ui/runtimeInteractionBindings.js";

function fixture({present=true,open=false,playing=true,editor=false,placing=false}={}){
 const registrations=[],actionsLog=[],listeners=new Map();
 let panel;
 if(present)panel={
  open,hasAttribute:name=>name==="open"&&panel.open,
  addEventListener:(name,fn)=>{registrations.push("panel:"+name);listeners.set("panel:"+name,fn);}
 };
 const doc={
  getElementById:name=>{assert.equal(name,"time-weather-panel");return panel??null;},
  addEventListener:(name,fn)=>{registrations.push("doc:"+name);listeners.set("doc:"+name,fn);}
 };
 const actions={
  playing:()=>playing,editorOpen:()=>editor,editingPlacement:()=>placing,
  closeEditor:()=>actionsLog.push("closeEditor"),
  stopPlacement:()=>actionsLog.push("stopPlacement"),
  showMenu:()=>actionsLog.push("showMenu"),
  refreshTimeWeather:()=>actionsLog.push("refreshTimeWeather")
 };
 const install=()=>installRuntimeInteractionBindings(doc,actions);
 const toggle=()=>listeners.get("panel:toggle")?.();
 const press=key=>listeners.get("doc:keydown")?.({key});
 return {doc,actions,install,toggle,press,actionsLog,registrations,listeners,
  setPanel:v=>{if(panel)panel.open=v;},
  replacePanel:v=>{panel=v;},
  setPlaying:v=>playing=v,setEditor:v=>editor=v,setPlacing:v=>placing=v};
}
test("instala primeiro o listener do calendário e depois o teclado",()=>{
 const x=fixture();x.install();assert.deepEqual(x.registrations,["panel:toggle","doc:keydown"]);
});
test("não executa callbacks de UI durante inicialização",()=>{
 const x=fixture();x.install();assert.deepEqual(x.actionsLog,[]);
});
test("abrir calendário e clima atualiza o HUD imediatamente",()=>{
 const x=fixture();x.install();x.setPanel(true);x.toggle();
 assert.deepEqual(x.actionsLog,["refreshTimeWeather"]);
});
test("fechar calendário e clima não solicita nova renderização",()=>{
 const x=fixture({open:true});x.install();x.setPanel(false);x.toggle();
 assert.deepEqual(x.actionsLog,[]);
});
test("toggle com painel fechado não consulta o estado da simulação",()=>{
 const x=fixture();x.actions.refreshTimeWeather=()=>{throw Error("unexpected");};
 x.install();assert.doesNotThrow(()=>x.toggle());
});
test("sem painel o teclado ainda funciona sem lançar exceção",()=>{
 const x=fixture({present:false});x.install();x.press("Escape");
 assert.deepEqual(x.registrations,["doc:keydown"]);
 assert.deepEqual(x.actionsLog,["showMenu"]);
});
test("reconsulta o painel ao receber toggle, em vez de capturar uma referência antiga",()=>{
 const x=fixture();x.install();
 x.replacePanel({hasAttribute:()=>false});x.toggle();
 assert.deepEqual(x.actionsLog,[]);
});
test("eventos de tecla diferentes de Escape são ignorados",()=>{
 const x=fixture();x.install();for(const k of ["Enter"," ","ArrowLeft","Esc","escape"])x.press(k);
 assert.deepEqual(x.actionsLog,[]);
});
test("Escape fora da partida não fecha menu nem editor",()=>{
 const x=fixture({playing:false,editor:true,placing:true});x.install();x.press("Escape");
 assert.deepEqual(x.actionsLog,[]);
});
test("Escape com editor ativo fecha primeiro o editor",()=>{
 const x=fixture({editor:true,placing:true});x.install();x.press("Escape");
 assert.deepEqual(x.actionsLog,["closeEditor"]);
});
test("Escape com posicionamento ativo cancela posicionamento",()=>{
 const x=fixture({placing:true});x.install();x.press("Escape");
 assert.deepEqual(x.actionsLog,["stopPlacement"]);
});
test("Escape sem edições abertas retorna para o menu",()=>{
 const x=fixture();x.install();x.press("Escape");
 assert.deepEqual(x.actionsLog,["showMenu"]);
});
test("alteração de editor é lida ao executar o evento, não na instalação",()=>{
 const x=fixture();x.install();x.setEditor(true);x.press("Escape");
 x.setEditor(false);x.setPlacing(true);x.press("Escape");
 assert.deepEqual(x.actionsLog,["closeEditor","stopPlacement"]);
});
test("alteração de isPlaying entre eventos é respeitada",()=>{
 const x=fixture();x.install();x.setPlaying(false);x.press("Escape");
 x.setPlaying(true);x.press("Escape");
 assert.deepEqual(x.actionsLog,["showMenu"]);
});
test("tecla e toggle usam seus próprios listeners, sem interferir",()=>{
 const x=fixture();x.install();x.setPanel(true);x.toggle();x.press("Escape");
 assert.deepEqual(x.actionsLog,["refreshTimeWeather","showMenu"]);
 assert.equal(x.listeners.size,2);
});
test("a interface não importa a simulação, Canvas, save ou áudio",()=>{
 const root=new URL("../src/",import.meta.url);
 const src=readFileSync(new URL("ui/runtimeInteractionBindings.ts",root),"utf8");
 assert.doesNotMatch(src,/from\s*["']\.\.\/(?:sim|application|render|audio)\//);
 assert.doesNotMatch(src,/\b(GameState|CanvasRenderingContext2D|localStorage|requestAnimationFrame|Soundscape|stepGame)\b|\bsave\(/);
});
test("main injeta as ações reais e mantém acesso ao estado atualizado",()=>{
 const root=new URL("../src/",import.meta.url);
 const main=readFileSync(new URL("main.ts",root),"utf8");
 assert.match(main,/installRuntimeInteractionBindings\(document,\{/);
 assert.match(main,/refreshTimeWeather:\(\)=>renderTimeWeatherPanel\(timeWeatherSnapshot\(game\),iconMarkup\)/);
 assert.match(main,/editorOpen:\(\)=>layoutEditor\.active/);
 assert.match(main,/editingPlacement:\(\)=>!!\(placingKind\|\|relocating\|\|wallMode\|\|installingAnnexPc\)/);
 assert.match(main,/if\(frameSchedule\.hud\(timestamp,/);
});
