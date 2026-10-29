import {sourceModule,assertCompositionAdaptersExclude} from "./helpers/composition.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createEventLogRefresh} from "../dist/js/ui/eventLogRefresh.js";
import {createEventLogPort} from "../dist/js/application/eventLogPort.js";
import {createGame} from "../dist/js/sim/engine.js";
function fixture(){
 let revision="[]",renders=0,reads=0;
 const refresh=createEventLogRefresh(()=>{reads++;return {signature:revision,rows:[]};},()=>{renders++;});
 return {refresh,setRevision:v=>{revision=v;},counts:()=>[reads,renders]};
}
test("a primeira lista vazia é desenhada",()=>{
 const x=fixture();assert.equal(x.refresh.refresh(),true);assert.deepEqual(x.counts(),[1,1]);
});
test("mesma assinatura não remonta o DOM",()=>{
 const x=fixture();x.refresh.refresh();assert.equal(x.refresh.refresh(),false);assert.deepEqual(x.counts(),[2,1]);
});
test("nova assinatura dispara a pintura",()=>{
 const x=fixture();x.refresh.refresh();x.setRevision("nova");
 assert.equal(x.refresh.refresh(),true);assert.deepEqual(x.counts(),[2,2]);
});
test("assinatura anterior pode voltar e ser desenhada novamente",()=>{
 const x=fixture();x.refresh.refresh();x.setRevision("alterada");x.refresh.refresh();
 x.setRevision("[]");assert.equal(x.refresh.refresh(),true);assert.deepEqual(x.counts(),[3,3]);
});
test("a assinatura inicial vazia permanece sem pintura",()=>{
 let count=0;
 const p=createEventLogRefresh(()=>({signature:"",rows:[]}),()=>{count++;});
 assert.equal(p.refresh(),false);assert.equal(count,0);
});
test("objeto repassado ao renderizador não sofre cópia",()=>{
 const obj={signature:"hello",rows:[]};let seen;
 createEventLogRefresh(()=>obj,value=>{seen=value;}).refresh();
 assert.equal(seen,obj);
});
test("erro do renderizador não confirma a revisão",()=>{
 let calls=0;
 const p=createEventLogRefresh(()=>({signature:"first",rows:[]}),()=>{
  if(++calls===1)throw Error("DOM failure");
 });
 assert.throws(()=>p.refresh(),/DOM failure/);assert.equal(p.refresh(),true);assert.equal(calls,2);
});
test("erro ao consultar eventos não tenta renderizar",()=>{
 let count=0;const p=createEventLogRefresh(()=>{throw Error("read");},()=>{count++;});
 assert.throws(()=>p.refresh(),/read/);assert.equal(count,0);
});
test("instâncias diferentes não compartilham a última assinatura",()=>{
 const a=fixture(),b=fixture();a.refresh.refresh();
 assert.equal(a.refresh.refresh(),false);assert.equal(b.refresh.refresh(),true);
});
test("troca do save ativo altera o snapshot de eventos",()=>{
 let game=createGame(111),count=0;
 const port=createEventLogPort(()=>game);
 const p=createEventLogRefresh(()=>port.snapshot(),()=>{count++;});
 game.eventLog.push("D1 10:00 · Venda");p.refresh();
 game=createGame(222);game.eventLog.push("D1 11:00 · Internet");p.refresh();
 assert.equal(count,2);
});
test("refresh não modifica o conteúdo da partida",()=>{
 const game=createGame(123),before=JSON.stringify(game);
 const port=createEventLogPort(()=>game);
 const p=createEventLogRefresh(()=>port.snapshot(),()=>{});
 p.refresh();p.refresh();assert.equal(JSON.stringify(game),before);
});
test("limite de arquitetura sem simulação, DOM ou armazenamento",()=>{
 const file=readFileSync(new URL("../src/ui/eventLogRefresh.ts",import.meta.url),"utf8");
 assert.equal(file.includes('from "../sim/'),false);
 for(const forbidden of ["GameState","document","localStorage","requestAnimationFrame","setInterval","stepGame"])assert.equal(file.includes(forbidden),false);
});
test("main liga o cache por callback e não guarda a assinatura",()=>{
 assert.ok(sourceModule("ui/gamePanels.ts").includes("createEventLogRefresh(()=>eventLogPort.snapshot(),snapshot=>renderEventLog(events,snapshot,document,iconMarkup))"));
 assert.ok(sourceModule("ui/gamePanels.ts").includes("eventLogRefresh.refresh()"));
 assertCompositionAdaptersExclude("lastEventSignature");
});
