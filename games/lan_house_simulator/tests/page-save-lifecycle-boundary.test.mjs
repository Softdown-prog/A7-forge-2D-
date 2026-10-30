import {sourceModule,assertSourceCall} from "./helpers/composition.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {installPageSaveLifecycle} from "../dist/js/ui/pageSaveLifecycle.js";

function harness(){
 const actions=[],win=new Map(),doc=new Map(),intervals=[];
 const page={hidden:false,addEventListener:(name,listener)=>{
  actions.push("doc:"+name);doc.set(name,listener);
 }};
 const browser={addEventListener:(name,listener)=>{
  actions.push("window:"+name);win.set(name,listener);
 }};
 const saves=[];let active="partida-1998";
 const save=()=>{saves.push(active)};
 const every=(callback,ms)=>{actions.push("interval:"+ms);intervals.push({callback,ms});};
 const install=()=>installPageSaveLifecycle({win:browser,doc:page,every,save});
 return {actions,win,doc,page,intervals,saves,save,install,active:value=>active=value};
}
test("instala timer de oito segundos e três eventos em ordem original",()=>{
 const x=harness();x.install();
 assert.deepEqual(x.actions,[
  "interval:8000","window:beforeunload","window:pagehide","doc:visibilitychange"
 ]);
 assert.equal(x.intervals[0].ms,8000);
});
test("registrar o ciclo de vida não salva antecipadamente",()=>{
 const x=harness();x.install();assert.deepEqual(x.saves,[]);
});
test("o intervalo usa exatamente o mesmo callback de save",()=>{
 const x=harness();x.install();assert.equal(x.intervals[0].callback,x.save);
 x.intervals[0].callback();assert.deepEqual(x.saves,["partida-1998"]);
});
test("beforeunload chama save somente no evento",()=>{
 const x=harness();x.install();x.win.get("beforeunload")();
 assert.deepEqual(x.saves,["partida-1998"]);
});
test("pagehide preserva progresso mesmo sem beforeunload no celular",()=>{
 const x=harness();x.install();x.win.get("pagehide")();
 assert.deepEqual(x.saves,["partida-1998"]);
});
test("beforeunload e pagehide compartilham a função original",()=>{
 const x=harness();x.install();
 assert.equal(x.win.get("beforeunload"),x.save);
 assert.equal(x.win.get("pagehide"),x.save);
});
test("visibilitychange com documento visível não salva",()=>{
 const x=harness();x.install();x.doc.get("visibilitychange")();
 assert.deepEqual(x.saves,[]);
});
test("visibilitychange salva quando a aba fica oculta",()=>{
 const x=harness();x.install();x.page.hidden=true;x.doc.get("visibilitychange")();
 assert.deepEqual(x.saves,["partida-1998"]);
});
test("o estado hidden é consultado na hora do evento",()=>{
 const x=harness();x.install();const handler=x.doc.get("visibilitychange");
 x.page.hidden=true;handler();x.page.hidden=false;handler();x.page.hidden=true;handler();
 assert.equal(x.saves.length,2);
});
test("salvamento consulta a partida ativa após importar novo save",()=>{
 const x=harness();x.install();
 x.active("partida-importada");x.intervals[0].callback();
 x.active("partida-da-nuvem");x.win.get("pagehide")();
 assert.deepEqual(x.saves,["partida-importada","partida-da-nuvem"]);
});
test("uma instalação não registra eventos duplicados",()=>{
 const x=harness();x.install();
 assert.equal(x.win.size,2);assert.equal(x.doc.size,1);assert.equal(x.intervals.length,1);
});
test("erro do callback permanece visível ao fluxo de salvamento existente",()=>{
 const actions=[],save=()=>{throw Error("storage blocked")};
 installPageSaveLifecycle({
  win:{addEventListener:(name,cb)=>actions.push([name,cb])},
  doc:{hidden:true,addEventListener:()=>{}},
  every:()=>{},save
 });
 assert.throws(()=>actions[0][1](),/storage blocked/);
});
test("temporizador mantém o contexto nativo de Window ao ser injetado",()=>{
 const calls=[],win={
  setInterval(callback,ms){
   if(this!==win)throw Error("Illegal invocation");
   calls.push(["interval",ms]);return 1;
  },
  addEventListener:()=>{}
 };
 const doc={hidden:false,addEventListener:()=>{}};
 const every=(callback,ms)=>win.setInterval(callback,ms);
 assert.doesNotThrow(()=>installPageSaveLifecycle({win,doc,every,save:()=>{}}));
 assert.deepEqual(calls,[["interval",8000]]);
});
test("coordenador não acessa estado, serialização, RNG ou APIs cloud",()=>{
 const root=new URL("../src/",import.meta.url);
 const src=readFileSync(new URL("ui/pageSaveLifecycle.ts",root),"utf8");
 assert.doesNotMatch(src,/from\s*["']\.\.\/(sim|audio|application|render)\//);
 assert.doesNotMatch(src,/\b(GameState|localStorage|sessionStorage|fetch|stepGame|JSON\.stringify|requestAnimationFrame)\b/);
 assert.match(src,/options\.every\(options\.save,8000\)/);
 assert.match(src,/addEventListener\("pagehide",options\.save\)/);
 assertSourceCall("ui/runtimeSessionController.ts","installPageSaveLifecycle",["{win:options.window,doc:document,every:(callback,ms)=>options.window.setInterval(callback,ms),save}"]);
 assert.match(sourceModule("ui/runtimeLoop.ts"),/requestAnimationFrame\(frame\)/);
});
