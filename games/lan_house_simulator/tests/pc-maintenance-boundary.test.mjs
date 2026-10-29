import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {renderPcMaintenancePanel} from "../dist/js/ui/pcMaintenancePanel.js";

class Button{
 constructor({id="",lcdBuy,lcdSelect,connected=true,disabled=false}={}){
  this.id=id;this.dataset={};if(lcdBuy!==undefined)this.dataset.lcdBuy=lcdBuy;
  if(lcdSelect!==undefined)this.dataset.lcdSelect=lcdSelect;
  this.isConnected=connected;this.disabled=disabled;this.focusCalls=[];
 }
 focus(opts){this.focusCalls.push(opts);}
}
function setup(focused=null,selected=2){
 const host={
  present:new Set(focused?[focused]:[]),
  selectors:new Map(),
  queries:[],
  contains:node=>host.present.has(node),
  querySelector:selector=>{host.queries.push(selector);return host.selectors.get(selector)??null;}
 };
 const calls=[],doc={activeElement:focused,createElement:tag=>{
  assert.equal(tag,"div");return {tag,nodes:[]};
 }};
 const actions={
  build:container=>{calls.push(["build",container]);},
  decorate:container=>{calls.push(["decorate",container]);},
  reconcile:(existing,next)=>{calls.push(["reconcile",existing,next]);},
  selectedStation:()=>selected
 };
 return {host,calls,doc,actions,focused};
}
const run=fixture=>{
 const previous=globalThis.HTMLButtonElement;
 globalThis.HTMLButtonElement=Button;
 try{renderPcMaintenancePanel(fixture.host,fixture.actions,fixture.doc);}
 finally{if(previous===undefined)delete globalThis.HTMLButtonElement;else globalThis.HTMLButtonElement=previous;}
};
test("constrói fora do painel e executa montagem, ícones e reconciliação nesta ordem",()=>{
 const x=setup();run(x);
 assert.deepEqual(x.calls.map(e=>e[0]),["build","decorate","reconcile"]);
 assert.equal(x.calls[0][1],x.calls[1][1]);
 assert.equal(x.calls[1][1],x.calls[2][2]);
 assert.equal(x.calls[2][1],x.host);
 assert.deepEqual(x.host.queries,[]);
});
test("foco existente e conectado não é roubado ao atualizar os controles",()=>{
 const current=new Button({id:"hardware-select-1"}),x=setup(current);
 run(x);assert.deepEqual(current.focusCalls,[]);assert.deepEqual(x.host.queries,[]);
});
test("botão destruído volta ao mesmo ID após a reconciliação",()=>{
 const current=new Button({id:"hardware-select-1",connected:false}),x=setup(current);
 const restored=new Button();x.host.selectors.set("#hardware-select-1",restored);
 run(x);
 assert.deepEqual(restored.focusCalls,[{preventScroll:true}]);
 assert.deepEqual(x.host.queries,["#hardware-select-1","#hardware-select-2"]);
});
test("estação antiga desabilitada usa a estação selecionada como fallback",()=>{
 const current=new Button({id:"hardware-power-8",disabled:true}),x=setup(current,2);
 const found=new Button({disabled:true}),fallback=new Button();
 x.host.selectors.set("#hardware-power-8",found);
 x.host.selectors.set("#hardware-select-2",fallback);
 run(x);
 assert.deepEqual(found.focusCalls,[]);
 assert.deepEqual(fallback.focusCalls,[{preventScroll:true}]);
});
test("kit LCD recompõe foco por data-lcd-buy, sem alterar compra",()=>{
 const current=new Button({lcdBuy:"lcd-2005",connected:false}),x=setup(current);
 const restored=new Button();x.host.selectors.set('[data-lcd-buy="lcd-2005"]',restored);
 run(x);
 assert.deepEqual(restored.focusCalls,[{preventScroll:true}]);
 assert.equal(x.host.queries[0],'[data-lcd-buy="lcd-2005"]');
});
test("seletor LCD inexistente recai no modelo selecionado da aba",()=>{
 const current=new Button({lcdSelect:"1",connected:false}),x=setup(current);
 const fallback=new Button();
 x.host.selectors.set('.lcd-upgrades [aria-pressed="true"]',fallback);
 run(x);
 assert.deepEqual(fallback.focusCalls,[{preventScroll:true}]);
 assert.deepEqual(x.host.queries,[
  '[data-lcd-select="1"]','.lcd-upgrades [aria-pressed="true"]'
 ]);
});
test("foco fora do painel ou botão sem identificador não provoca buscas",()=>{
 const current=new Button({id:"hardware-select-7"}),x=setup(current);
 x.host.present.clear();run(x);assert.deepEqual(x.host.queries,[]);
 const anonymous=new Button(),y=setup(anonymous);
 run(y);assert.deepEqual(y.host.queries,[]);
});
test("sem controle substituto a atualização não lança exceções",()=>{
 const current=new Button({lcdSelect:"7",connected:false}),x=setup(current);
 assert.doesNotThrow(()=>run(x));
 assert.deepEqual(x.host.queries,['[data-lcd-select="7"]','.lcd-upgrades [aria-pressed="true"]']);
});
test("separação não desloca motor nem listeners, main mantém invalidatório e saves",()=>{
 const root=new URL("../src/",import.meta.url);
 const ui=readFileSync(new URL("ui/pcMaintenancePanel.ts",root),"utf8");
 const main=readFileSync(new URL("main.ts",root),"utf8");
 const sections=readFileSync(new URL("ui/adminComputerSections.ts",root),"utf8");
 assert.doesNotMatch(ui,/from\s*["']\.\.\/sim\//);
 assert.doesNotMatch(ui,/\bGameState\b|addEventListener/);
 assert.ok(main.includes('panelChanged("computers"'));
 assert.ok(main.includes("renderAdminComputerSections({"));
 assert.ok(sections.includes("renderPcMaintenancePanel(host"));
 assert.ok(main.includes("renderHardwarePanel(game,selectedLcdPc,year,selectedHardwareTab,page)"));
 assert.ok(main.includes("renderLcdMonitorsPanel(host,lcdMonitorsPort.snapshot(selectedLcdPc),lcdPreview,document)"));
 assert.ok(main.includes("installStationControls("));
});
