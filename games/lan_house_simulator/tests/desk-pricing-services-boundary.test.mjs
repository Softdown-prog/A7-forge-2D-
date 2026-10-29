import {sourceModule,assertCompositionAdaptersExclude} from "./helpers/composition.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {buyDiscCopier} from "../dist/js/sim/discCopy.js";
import {buyPrinter} from "../dist/js/sim/printService.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {createDeskPricingPort} from "../dist/js/application/deskPricingPort.js";
import {renderDeskServicePanels} from "../dist/js/ui/deskPricingPanel.js";

const setup=()=>{
 const discPanel={hidden:false},printPanel={hidden:false},discControls={},printControls={};
 const nodes=new Map([["disc-copy-panel",discPanel],["print-service-panel",printPanel]]);
 const state={created:[],synced:[],writes:[],active:[],requested:[]};
 class Node{
  constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.attrs={};this.textContent="";this.innerHTML="";}
  append(...values){this.children.push(...values);}
  setAttribute(k,v){this.attrs[k]=v;}
 }
 const doc={
  getElementById:id=>nodes.get(id)??null,
  createElement:tag=>{const node=new Node(tag);state.created.push(node);return node;}
 };
 const options={
  pricingTab:true,
  isActive:page=>{state.active.push(page);return true;},
  discControls,printControls,
  setText:(id,value)=>state.writes.push([id,value]),
  iconMarkup:()=>"<i>disc</i>",
  doc,sync:(current,next)=>state.synced.push([current,next])
 };
 return {discPanel,printPanel,discControls,printControls,nodes,state,options};
};
const stub=({discs=false,printer=false,discView=null,printView=null}={})=>{
 const calls={installed:0,discs:0,printing:0};
 const port={
  installed:()=>{calls.installed++;return {discs,printer};},
  discs:()=>{calls.discs++;return discView;},
  printing:()=>{calls.printing++;return printView;}
 };
 return {port,calls};
};
test("nenhum equipamento mantém áreas invisíveis e nem pede projeções",()=>{
 const x=setup(),s=stub();
 renderDeskServicePanels(s.port,x.options);
 assert.equal(x.discPanel.hidden,true);assert.equal(x.printPanel.hidden,true);
 assert.deepEqual(s.calls,{installed:1,discs:0,printing:0});
 assert.deepEqual(x.state.active,[]);
 assert.deepEqual(x.state.synced,[]);
});
test("apenas copiadora instalada torna sua seção visível sem mostrar impressora",()=>{
 const x=setup(),s=stub({discs:true});
 renderDeskServicePanels(s.port,{...x.options,pricingTab:false});
 assert.equal(x.discPanel.hidden,false);assert.equal(x.printPanel.hidden,true);
 assert.deepEqual(s.calls,{installed:1,discs:0,printing:0});
 assert.deepEqual(x.state.active,[]);
});
test("apenas impressora instalada torna sua seção visível sem copiar CD",()=>{
 const x=setup(),s=stub({printer:true});
 renderDeskServicePanels(s.port,{...x.options,pricingTab:false});
 assert.equal(x.discPanel.hidden,true);assert.equal(x.printPanel.hidden,false);
 assert.deepEqual(s.calls,{installed:1,discs:0,printing:0});
});
test("fora de Preços, não pede snapshots nem reconcilia controles",()=>{
 const x=setup(),s=stub({discs:true,printer:true});
 renderDeskServicePanels(s.port,{...x.options,pricingTab:false});
 assert.equal(x.discPanel.hidden,false);assert.equal(x.printPanel.hidden,false);
 assert.deepEqual(s.calls,{installed:1,discs:0,printing:0});
 assert.equal(x.state.created.length,0);assert.equal(x.state.synced.length,0);
});
test("só abre snapshot da página selecionada, sem remontar a outra",()=>{
 const x=setup(),s=stub({discs:true,printer:true});
 renderDeskServicePanels(s.port,{...x.options,isActive:page=>page==="discs"});
 assert.equal(s.calls.discs,1);assert.equal(s.calls.printing,0);
 assert.deepEqual(x.state.synced,[],"snapshot nulo não recria nós");
 const second=setup(),t=stub({discs:true,printer:true});
 renderDeskServicePanels(t.port,{...second.options,isActive:page=>page==="printing"});
 assert.equal(t.calls.discs,0);assert.equal(t.calls.printing,1);
 assert.deepEqual(second.state.synced,[]);
});
test("página sem host mantém preços intactos e não calcula relatório",()=>{
 const x=setup(),s=stub({discs:true,printer:true});
 renderDeskServicePanels(s.port,{...x.options,discControls:null,printControls:null});
 assert.deepEqual(s.calls,{installed:1,discs:0,printing:0});
 assert.deepEqual(x.state.active,[]);
});
test("copiadora real continua gerando dois controles e relatórios corretos",()=>{
 const x=setup(),s=createGame(9601,"historical");s.cash=4000;
 s.totalMinutes=3*360*720; // copiadora disponível após 2001, como no cenário legado.
 assert.equal(buyDiscCopier(s).ok,true);
 const before=JSON.stringify(s),port=createDeskPricingPort(()=>s);
 renderDeskServicePanels(port,{...x.options,isActive:page=>page==="discs"});
 assert.equal(x.discPanel.hidden,false);assert.equal(x.printPanel.hidden,true);
 assert.equal(x.state.synced.length,1);
 assert.equal(x.state.synced[0][0],x.discControls);
 assert.equal(x.state.synced[0][1].children.length,2);
 assert.deepEqual(x.state.writes.map(([id])=>id),["disc-copy-summary","disc-copy-capacity"]);
 assert.equal(JSON.stringify(s),before);
});
test("impressão real preserva botão de passo de preço e relatórios",()=>{
 const x=setup(),s=createGame(9602,"historical");s.cash=4000;
 assert.equal(buyPrinter(s).ok,true);
 const before=JSON.stringify(s),port=createDeskPricingPort(()=>s);
 renderDeskServicePanels(port,{...x.options,isActive:page=>page==="printing"});
 assert.equal(x.discPanel.hidden,true);assert.equal(x.printPanel.hidden,false);
 assert.equal(x.state.synced.length,1);
 assert.equal(x.state.synced[0][0],x.printControls);
 const action=x.state.synced[0][1].children[0].children[1];
 assert.equal(action.children[0].dataset.printDelta,"-0.5");
 assert.equal(action.children[2].dataset.printDelta,"0.5");
 assert.deepEqual(x.state.writes.map(([id])=>id),["print-service-summary","print-service-capacity"]);
 assert.equal(JSON.stringify(s),before);
});
test("importação de save volta a consultar a instância atual e equipamentos",()=>{
 let s=createGame(9603,"historical"),port=createDeskPricingPort(()=>s),x=setup();
 s.cash=5000;assert.equal(buyPrinter(s).ok,true);
 const original=s,old=JSON.stringify(s);
 renderDeskServicePanels(port,{...x.options,pricingTab:false});
 assert.equal(x.printPanel.hidden,false);
 s=parseImportedSave(serializeSave(s));
 assert.equal(isValidSave(s),true);
 s.printer=null;
 const after=setup();
 renderDeskServicePanels(port,{...after.options,pricingTab:false});
 assert.equal(after.printPanel.hidden,true);
 assert.equal(JSON.stringify(original),old);
});
test("ausência de elementos visuais é tolerada e os IDs não são alterados",()=>{
 const s=stub(),x=setup();
 renderDeskServicePanels(s.port,{...x.options,doc:{...x.options.doc,getElementById:()=>null}});
 assert.equal(s.calls.installed,1);
});
test("o main mantém lógica de seleção e não executa mutações de precificação",()=>{
 const root=new URL("../src/",import.meta.url);
 const ui=readFileSync(new URL("ui/deskPricingPanel.ts",root),"utf8");
 assert.doesNotMatch(ui,/from\s*["']\.\.\/sim\//);
 assert.doesNotMatch(ui,/\bGameState\b|addEventListener/);
 assert.ok(sourceModule("application/gamePorts.ts").includes("createDeskPricingPort(getState)"));
 assert.ok(sourceModule("ui/gamePanels.ts").includes("renderDeskServicePanels(deskPricingPort,{"));
 assert.ok(sourceModule("ui/gamePanels.ts").includes("isActive:page=>managementPanels.active(\"prices\",page)"));
 assert.ok(sourceModule("ui/gamePanels.ts").includes("sync:syncPanelChildren"));
 assertCompositionAdaptersExclude("discEconomy(");
 assertCompositionAdaptersExclude("printEconomy(");
});
