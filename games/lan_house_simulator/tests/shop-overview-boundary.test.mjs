import {sourceModule,assertCompositionAdaptersExclude} from "./helpers/composition.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame,isValidSave,pcCount} from "../dist/js/sim/engine.js";
import {roomBounds,expandDirection} from "../dist/js/sim/room.js";
import {wallZoneCount} from "../dist/js/sim/walls.js";
import {annexComputerSlots} from "../dist/js/sim/stations.js";
import {editableObjects} from "../dist/js/sim/editableObjects.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {createShopOverviewPort} from "../dist/js/application/shopOverviewPort.js";
import {renderShopOverview} from "../dist/js/ui/shopOverviewPanel.js";
function createHarness(){
 let game=createGame(4701,"historical");
 game.cash=10000;
 const port=createShopOverviewPort(
  ()=>game,()=>editableObjects(game).length,()=>annexComputerSlots(game).length
 );
 return {port,get game(){return game;},setGame:next=>{game=next;}};
}
function oldSummary(game){
 const b=roomBounds(game),e=game.roomExtensions??{west:0,east:0,south:0};
 return "Caixa R$ "+game.cash+" · PCs "+pcCount(game)+"/"+
  (3+game.expansionLevel*2+annexComputerSlots(game).length)+
  " · Tamanho do salão "+(b.maxX-b.minX)+"×"+(b.maxY-b.minY)+
  " · Ampliações: esquerda "+e.west+"/5 · direita "+e.east+"/5 · fundos "+(e.north??0)+"/5 · Salas "+wallZoneCount(game);
}
test("o resumo mantém todos os textos atuais, sem alterar o save",()=>{
 const x=createHarness(),before=JSON.stringify(x.game),v=x.port.snapshot();
 assert.equal(v.cashText,oldSummary(x.game));
 assert.equal(v.organizeText,"Organizar salão: "+editableObjects(x.game).length+" objetos");
 assert.equal(v.demolishText,"Remover paredes e portas (0)");
 assert.equal(v.demolishDisabled,true);
 assert.equal(JSON.stringify(x.game),before);
});
test("o texto de caixa acompanha o valor atualizado, inclusive centavos",()=>{
 const x=createHarness();
 x.game.cash=1234.5;
 assert.match(x.port.snapshot().cashText,/Caixa R\$ 1234\.5/);
 x.game.cash=0;
 assert.match(x.port.snapshot().cashText,/Caixa R\$ 0 · PCs/);
});
test("salão original mantém tamanho e setores sem expansão",()=>{
 const x=createHarness(),v=x.port.snapshot();
 assert.match(v.cashText,/Tamanho do salão 8×6/);
 assert.match(v.cashText,/esquerda 0\/5 · direita 0\/5 · fundos 0\/5/);
 assert.equal(v.cashText,oldSummary(x.game));
});
test("expansões reais oeste, leste e norte atualizam vagas e medidas",()=>{
 const x=createHarness(),s=x.game;
 for(const dir of ["west","east","north"])assert.equal(expandDirection(s,dir).ok,true);
 const v=x.port.snapshot();
 assert.equal(v.cashText,oldSummary(s));
 assert.match(v.cashText,/Tamanho do salão 12×8/);
 assert.match(v.cashText,/esquerda 1\/5 · direita 1\/5 · fundos 1\/5/);
 assert.match(v.cashText,/PCs 3\/6/);
 assert.equal(isValidSave(s),true);
});
test("ampliação principal e PC novo mantêm o cálculo de capacidade",()=>{
 const x=createHarness(),s=x.game;
 s.expansionLevel=1;s.installedPcs=3;
 assert.match(x.port.snapshot().cashText,/PCs 3\/5/);
 assert.equal(x.port.snapshot().cashText,oldSummary(s));
});
test("divisória e porta existentes mantêm total e botão habilitado",()=>{
 const x=createHarness(),s=x.game;
 s.interiorWalls=[{axis:"x",x:1,y:2}];
 s.interiorDoors=[{axis:"x",x:2,y:2}];
 const v=x.port.snapshot();
 assert.equal(v.demolishText,"Remover paredes e portas (2)");
 assert.equal(v.demolishDisabled,false);
 assert.equal(v.cashText,oldSummary(s));
});
test("remoção de divisórias volta a bloquear botão",()=>{
 const x=createHarness(),s=x.game;
 s.interiorWalls=[{axis:"x",x:1,y:2}];
 assert.equal(x.port.snapshot().demolishDisabled,false);
 s.interiorWalls=[];
 assert.equal(x.port.snapshot().demolishDisabled,true);
 assert.equal(x.port.snapshot().demolishText,"Remover paredes e portas (0)");
});
test("contagem dos objetos usa a consulta atual e não é armazenada",()=>{
 let count=2;
 const game=createGame(4702),port=createShopOverviewPort(()=>game,()=>count,()=>0);
 assert.equal(port.snapshot().organizeText,"Organizar salão: 2 objetos");
 count=17;
 assert.equal(port.snapshot().organizeText,"Organizar salão: 17 objetos");
});
test("consulta de vagas anexas é dinâmica e independente de compras",()=>{
 let capacity=0;
 const game=createGame(4703),port=createShopOverviewPort(()=>game,()=>0,()=>capacity);
 assert.match(port.snapshot().cashText,/PCs 3\/3/);
 capacity=3;
 assert.match(port.snapshot().cashText,/PCs 3\/6/);
});
test("troca de partida importada altera apenas a instância ativa",()=>{
 const x=createHarness(),old=x.game,before=JSON.stringify(old);
 let imported=parseImportedSave(serializeSave(old));
 imported.cash=85;
 x.setGame(imported);
 assert.equal(x.port.snapshot().cashText,oldSummary(imported));
 assert.match(x.port.snapshot().cashText,/Caixa R\$ 85/);
 assert.equal(JSON.stringify(old),before);
 assert.equal(isValidSave(imported),true);
});
test("o render mantém seletores, estado e rótulos dos elementos",()=>{
 const x=createHarness(),view=x.port.snapshot();
 const nodes={"#organize-furniture":{disabled:true,textContent:""},
  "#demolish-walls":{disabled:false,textContent:""},
  "shop-cash":{textContent:""}};
 const requested=[];
 const doc={
  querySelector:sel=>{requested.push(sel);return nodes[sel]??null;},
  getElementById:id=>{requested.push(id);return nodes[id]??null;}
 };
 renderShopOverview(view,doc);
 assert.deepEqual(requested,["#organize-furniture","#demolish-walls","shop-cash"]);
 assert.equal(nodes["#organize-furniture"].disabled,false);
 assert.equal(nodes["#organize-furniture"].textContent,view.organizeText);
 assert.equal(nodes["#demolish-walls"].disabled,true);
 assert.equal(nodes["#demolish-walls"].textContent,view.demolishText);
 assert.equal(nodes["shop-cash"].textContent,view.cashText);
});
test("elementos ausentes não impedem atualizar os demais",()=>{
 const view=createHarness().port.snapshot();
 const cash={textContent:"antigo"};
 renderShopOverview(view,{
  querySelector:()=>null,
  getElementById:id=>id==="shop-cash"?cash:null
 });
 assert.equal(cash.textContent,view.cashText);
});
test("a interface não conhece o motor e main conserva os handlers",()=>{
 const root=new URL("../src/",import.meta.url);
 const app=readFileSync(new URL("application/shopOverviewPort.ts",root),"utf8");
 const ui=readFileSync(new URL("ui/shopOverviewPanel.ts",root),"utf8");
 assert.doesNotMatch(app,/\b(document|window|HTMLElement|HTMLButtonElement)\b/);
 assert.doesNotMatch(ui,/from\s*["']\.\.\/sim\//);
 assert.doesNotMatch(ui,/\bGameState\b|roomBounds|pcCount|wallZoneCount/);
 assert.match(sourceModule("application/gamePorts.ts"),/createShopOverviewPort\(getState/);
 assert.match(sourceModule("ui/gamePanels.ts"),/renderShopOverview\(shopOverviewPort\.snapshot\(\),document\)/);
 assert.match(sourceModule("ui/runtimeControls.ts"),/button\("organize-furniture",\(\)=>layoutEditor\.open\(\)\)/);
 assert.match(sourceModule("ui/runtimeControls.ts"),/button\("demolish-walls"/);
 assertCompositionAdaptersExclude(/\broomBounds\b|\bwallZoneCount\b/);
});
