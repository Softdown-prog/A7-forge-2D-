import {sourceModule} from "./helpers/composition.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame} from "../dist/js/sim/engine.js";
import {createPanelRevisionCache} from "../dist/js/application/panelRevisionCache.js";
import {createShopCatalogRevisionPort} from "../dist/js/application/shopCatalogRevisionPort.js";
import {createShopCatalogRefresh} from "../dist/js/ui/shopCatalogRefresh.js";

function fixture(){
 const calls=[],host={id:"catalog"},cache=createPanelRevisionCache();
 let open=true,currentHost=host,category="equipment",game=createGame(7801,"historical");
 const revision=createShopCatalogRevisionPort(()=>game);
 const refresh=createShopCatalogRefresh({
  isOpen:()=>{calls.push("open");return open;},
  host:()=>{calls.push("host");return currentHost;},
  revision:()=>{calls.push("revision");return revision.snapshot(category);},
  changed:(snapshot,force)=>{calls.push("changed:"+force);return cache("shop",snapshot,force);},
  render:node=>calls.push(["render",node])
 });
 return {refresh,calls,host,game:()=>game,
  open:v=>open=v,changeHost:v=>currentHost=v,category:v=>category=v,swap:v=>game=v};
}
test("primeiro desenho segue guarda de abertura, host, revisão e pintura",()=>{
 const x=fixture();assert.equal(x.refresh.refresh(),undefined);
 assert.deepEqual(x.calls,["open","host","revision","changed:true",["render",x.host]]);
});
test("loja fechada não consulta DOM, save nem cache",()=>{
 const x=fixture();x.open(false);x.refresh.refresh();
 assert.deepEqual(x.calls,["open"]);
});
test("loja sem host não calcula assinatura",()=>{
 const x=fixture();x.changeHost(null);x.refresh.refresh();
 assert.deepEqual(x.calls,["open","host"]);
});
test("revisão igual não reconstruirá catálogo no modo live",()=>{
 const x=fixture();x.refresh.refresh(false);x.calls.length=0;
 x.refresh.refresh(false);
 assert.deepEqual(x.calls,["open","host","revision","changed:false"]);
});
test("forçar renderização prevalece sobre cache igual",()=>{
 const x=fixture();x.refresh.refresh(false);x.calls.length=0;
 x.refresh.refresh(true);
 assert.deepEqual(x.calls,["open","host","revision","changed:true",["render",x.host]]);
});
test("sem argumento refresh usa force true igual ao renderShop anterior",()=>{
 const x=fixture();x.refresh.refresh(false);x.calls.length=0;x.refresh.refresh();
 assert.ok(x.calls.includes("changed:true"));
 assert.equal(x.calls.filter(c=>Array.isArray(c)&&c[0]==="render").length,1);
});
test("trocar categoria invalida o catálogo em modo live",()=>{
 const x=fixture();x.refresh.refresh(false);x.calls.length=0;
 x.category("consoles");x.refresh.refresh(false);
 assert.equal(x.calls.filter(c=>Array.isArray(c)&&c[0]==="render").length,1);
});
test("alteração no caixa de loja invalida sem alterar o save",()=>{
 const x=fixture();x.refresh.refresh(false);x.calls.length=0;
 x.game().cash+=12;x.refresh.refresh(false);
 assert.equal(x.calls.filter(c=>Array.isArray(c)&&c[0]==="render").length,1);
});
test("troca de save é consultada na próxima revisão",()=>{
 const x=fixture();x.refresh.refresh(false);x.calls.length=0;
 const imported=createGame(7802,"classic");imported.cash=999;
 x.swap(imported);x.refresh.refresh(false);
 assert.equal(x.calls.filter(c=>Array.isArray(c)&&c[0]==="render").length,1);
});
test("host atualizado é entregue ao pintor na próxima chamada",()=>{
 const x=fixture(),next={id:"replacement"};
 x.refresh.refresh(false);x.calls.length=0;x.changeHost(next);x.refresh.refresh(true);
 assert.ok(x.calls.some(c=>Array.isArray(c)&&c[1]===next));
});
test("loja reaberta respeita a assinatura anterior sem desenho forçado",()=>{
 const x=fixture();x.refresh.refresh(false);x.open(false);
 x.calls.length=0;x.refresh.refresh(false);x.open(true);x.refresh.refresh(false);
 assert.deepEqual(x.calls,["open","open","host","revision","changed:false"]);
});
test("reabrir com force atualiza a interface",()=>{
 const x=fixture();x.refresh.refresh(false);x.open(false);
 x.refresh.refresh(false);x.open(true);x.calls.length=0;x.refresh.refresh(true);
 assert.ok(x.calls.some(c=>Array.isArray(c)&&c[0]==="render"));
});
test("falha no teste de visibilidade impede qualquer outra chamada",()=>{
 const calls=[];
 const x=createShopCatalogRefresh({
  isOpen:()=>{calls.push("open");throw Error("open failure");},
  host:()=>{calls.push("host");return {};},
  revision:()=>{calls.push("revision");return [];},
  changed:()=>true,render:()=>{}
 });
 assert.throws(()=>x.refresh(),/open failure/);
 assert.deepEqual(calls,["open"]);
});
test("falha no cálculo de assinatura não chama cache nem pintor",()=>{
 const calls=[];
 const x=createShopCatalogRefresh({
  isOpen:()=>true,host:()=>({}),
  revision:()=>{calls.push("revision");throw Error("state failure");},
  changed:()=>{calls.push("changed");return true;},
  render:()=>{calls.push("render");}
 });
 assert.throws(()=>x.refresh(),/state failure/);
 assert.deepEqual(calls,["revision"]);
});
test("falha no cache não alcança renderização",()=>{
 const calls=[];
 const x=createShopCatalogRefresh({
  isOpen:()=>true,host:()=>({}),revision:()=>[],
  changed:()=>{calls.push("changed");throw Error("cache failure");},
  render:()=>calls.push("render")
 });
 assert.throws(()=>x.refresh(),/cache failure/);
 assert.deepEqual(calls,["changed"]);
});
test("erro no renderizador chega ao chamador",()=>{
 const x=createShopCatalogRefresh({
  isOpen:()=>true,host:()=>({}),revision:()=>[],
  changed:()=>true,render:()=>{throw Error("draw failure");}
 });
 assert.throws(()=>x.refresh(),/draw failure/);
});
test("não há listeners ou temporizadores criados pelo gate",()=>{
 const src=readFileSync(new URL("../src/ui/shopCatalogRefresh.ts",import.meta.url),"utf8");
 assert.doesNotMatch(src,/\b(addEventListener|setInterval|setTimeout|requestAnimationFrame|localStorage|document|window)\b/);
});
test("módulo UI não importa motor nem instancia Canvas",()=>{
 const src=readFileSync(new URL("../src/ui/shopCatalogRefresh.ts",import.meta.url),"utf8");
 assert.doesNotMatch(src,/from\s*["']\.\.\/(?:sim|render|audio)\//);
 assert.doesNotMatch(src,/\b(GameState|SceneRenderer|stepGame|shopPrice|HTMLElement)\b/);
});
test("renderização repetida não modifica caixa, clientes ou RNG",()=>{
 const x=fixture(),before=JSON.stringify(x.game());
 x.refresh.refresh(false);x.refresh.refresh(true);x.refresh.refresh(false);
 assert.equal(JSON.stringify(x.game()),before);
});
test("main mantém ofertas e controles, delegando apenas a atualização",()=>{
 assert.match(sourceModule("ui/gamePanels.ts"),/createShopCatalogRefresh\(\{/);
 assert.match(sourceModule("ui/gamePanels.ts"),/function renderShop\(force=true\):void\{shopCatalogRefresh\.refresh\(force\);\}/);
 assert.match(sourceModule("ui/gamePanels.ts"),/renderShopCatalog\(\{/);
 assert.match(sourceModule("ui/gamePanels.ts"),/items:SHOP_CATALOG/);
 assert.match(sourceModule("ui/gamePanels.ts"),/offer:id=>shopCatalogOffersPort\.snapshot\(id\)/);
 assert.match(sourceModule("ui/gamePanels.ts"),/selectedPs1Slot:\(\)=>state\.selection\.selectedPs1PlacementId/);
 assert.match(sourceModule("ui/gamePanels.ts"),/changed:\(revision,force\)=>panelChanged\("shop",revision,force\)/);
});
