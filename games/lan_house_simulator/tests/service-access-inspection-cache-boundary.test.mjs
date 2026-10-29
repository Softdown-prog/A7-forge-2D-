import {sourceModule,assertSourceCall} from "./helpers/composition.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame} from "../dist/js/sim/engine.js";
import {serviceAccessIssues} from "../dist/js/sim/serviceAccess.js";
import {createServiceAccessInspectionCache} from "../dist/js/ui/serviceAccessInspectionCache.js";

function fixture(){
 let clock=0,state=[{kind:"pc",index:0}],reads=0;
 const cache=createServiceAccessInspectionCache(()=>{reads++;return state;},()=>clock);
 return {cache,advance:ms=>{clock+=ms;},clock:ms=>{clock=ms;},
  setState:next=>{state=next;},reads:()=>reads};
}
test("antes do primeiro diagnóstico o snapshot está vazio",()=>{
 const x=fixture();assert.deepEqual(x.cache.snapshot(),[]);assert.equal(x.reads(),0);
});
test("a primeira consulta verifica o motor sem esperar 1600ms",()=>{
 const x=fixture();assert.equal(x.cache.inspect().length,1);assert.equal(x.reads(),1);
});
test("a consulta seguinte no mesmo instante utiliza cache",()=>{
 const x=fixture();const a=x.cache.inspect(),b=x.cache.inspect();
 assert.equal(a,b);assert.equal(x.reads(),1);
});
test("o snapshot não dispara inspeção nem avança o relógio",()=>{
 const x=fixture();x.cache.snapshot();x.cache.snapshot();assert.equal(x.reads(),0);
});
test("mudanças no estado são ignoradas antes de atingir 1600ms",()=>{
 const x=fixture();const first=x.cache.inspect();
 x.setState([{kind:"bin",index:1}]);x.advance(1599);
 assert.equal(x.cache.inspect(),first);assert.equal(x.reads(),1);
});
test("em exatamente 1600ms não atualiza: operador original era maior",()=>{
 const x=fixture();x.cache.inspect();x.advance(1600);
 assert.equal(x.cache.inspect().length,1);assert.equal(x.reads(),1);
});
test("em 1601ms recarrega o diagnóstico",()=>{
 const x=fixture();x.cache.inspect();x.setState([{kind:"bin",index:2}]);x.advance(1601);
 assert.equal(x.cache.inspect()[0].index,2);assert.equal(x.reads(),2);
});
test("relógio de atualização é reiniciado após nova inspeção",()=>{
 const x=fixture();x.cache.inspect();x.advance(1601);x.cache.inspect();
 x.advance(1500);x.cache.inspect();assert.equal(x.reads(),2);
 x.advance(101);x.cache.inspect();assert.equal(x.reads(),3);
});
test("forçar consulta ignora prazo mas mantém os mesmos dados",()=>{
 const x=fixture();x.cache.inspect();x.setState([{kind:"pc",index:4}]);
 assert.equal(x.cache.inspect(true)[0].index,4);assert.equal(x.reads(),2);
});
test("inspeção forçada reinicia prazo de cache",()=>{
 const x=fixture();x.cache.inspect();x.advance(500);x.cache.inspect(true);
 x.advance(1500);x.cache.inspect();assert.equal(x.reads(),2);
 x.advance(101);x.cache.inspect();assert.equal(x.reads(),3);
});
test("cache reflete estado vazio depois do prazo",()=>{
 const x=fixture();x.cache.inspect();x.setState([]);x.advance(1601);
 assert.deepEqual(x.cache.inspect(),[]);assert.deepEqual(x.cache.snapshot(),[]);
});
test("snapshot retorna a última consulta, sem forçar nova inspeção",()=>{
 const x=fixture();x.cache.inspect();x.setState([{kind:"bin",index:3}]);x.advance(500);
 assert.equal(x.cache.snapshot()[0].kind,"pc");assert.equal(x.reads(),1);
});
test("alteração da partida ativa é observada na próxima consulta",()=>{
 let game=createGame(1234,"historical"),reads=0;
 const cache=createServiceAccessInspectionCache(()=>{reads++;return serviceAccessIssues(game);},()=>0);
 const original=game;cache.inspect();game=createGame(5678,"historical");
 assert.notEqual(game,original);
 cache.inspect(true);assert.equal(reads,2);
});
test("não altera a partida nem o save durante leitura real do motor",()=>{
 const game=createGame(8123,"historical"),before=JSON.stringify(game);
 const cache=createServiceAccessInspectionCache(()=>serviceAccessIssues(game),()=>2000);
 cache.inspect();cache.snapshot();cache.inspect(true);
 assert.equal(JSON.stringify(game),before);
});
test("falha de consulta mantém resultado anterior e não atualiza prazo",()=>{
 const previous=[{kind:"pc",index:5}],calls=[];
 let at=0,fail=false;
 const cache=createServiceAccessInspectionCache(()=>{
  calls.push(at);if(fail)throw Error("route");return previous;
 },()=>at);
 assert.equal(cache.inspect(),previous);
 at=1601;fail=true;assert.throws(()=>cache.inspect(),/route/);
 assert.equal(cache.snapshot(),previous);
 fail=false;assert.equal(cache.inspect(),previous);
 assert.deepEqual(calls,[0,1601,1601]);
});
test("relógio regressivo mantém o cache até superar o limiar",()=>{
 const x=fixture();x.cache.inspect();x.clock(-200);
 x.cache.inspect();assert.equal(x.reads(),1);
 x.clock(1601);x.cache.inspect();assert.equal(x.reads(),2);
});
test("cada instância possui cache e instante independentes",()=>{
 const a=fixture(),b=fixture();a.cache.inspect();
 assert.equal(b.reads(),0);b.cache.inspect();a.advance(1700);a.cache.inspect();
 assert.equal(a.reads(),2);assert.equal(b.reads(),1);
});
test("interface não importa motor, DOM nem timers e main usa o cache",()=>{
 const root=new URL("../src/",import.meta.url);
 const source=readFileSync(new URL("ui/serviceAccessInspectionCache.ts",root),"utf8");
 assert.doesNotMatch(source,/from\s*["']\.\.\/(?:sim|application|render|audio)\//);
 assert.doesNotMatch(source,/\b(GameState|document|window|localStorage|CanvasRenderingContext2D|setInterval|requestAnimationFrame|stepGame)\b/);
 assertSourceCall("bootstrap/bootstrapGame.ts","createServiceAccessInspectionCache",["application.ports.accessIssues","()=>performance.now()"] );
 assertSourceCall("ui/gamePanels.ts","serviceAccessInspection.inspect",["force"]);
 assert.match(sourceModule("ui/gamePanels.ts"),/serviceAccessInspection\.snapshot\(\)/);
 assertSourceCall("render/gameScene.ts","renderer.drawServiceAccessOverlay",["source()","issues","elapsed"] );
});
