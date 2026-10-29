import {sourceModule,assertSourceCall} from "./helpers/composition.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {renderAdminComputerSections} from "../dist/js/ui/adminComputerSections.js";

function setup(page="operations"){
 const calls=[],ledger={tag:"tbody"},host={tag:"host"},created=[];
 const doc={
  activeElement:null,
  querySelector:selector=>{assert.equal(selector,"#station-ledger-rows");return ledger;},
  getElementById:id=>{assert.equal(id,"pc-maintenance");return host;},
  createElement:tag=>{assert.equal(tag,"div");const node={children:[],
   append(...items){this.children.push(...items);},replaceChildren(...items){this.children=[...items];}};
   created.push(node);return node;}
 };
 let open=true,tab=true,ledgerTab=false,changed=true,ledgerPresent=true,hostPresent=true,station=0;
 const options={
  get adminOpen(){return open;},get computersTab(){return tab;},
  ledgerActive:()=>{calls.push("ledgerActive");return ledgerTab;},
  currentPage:()=>{calls.push("page");return page;},
  maintenanceChanged:()=>{calls.push("changed");return changed;},
  selectedStation:()=>{calls.push("selected");return station;},
  clampSelectedStation:()=>{calls.push("clamp");station=Math.min(station,2);},
  renderLedger:actual=>{assert.equal(actual,ledger);calls.push("renderLedger");},
  renderOperations:actual=>{assert.ok(created.includes(actual));calls.push("operations");},
  renderHardware:(actual,p)=>{assert.ok(created.includes(actual));calls.push("hardware:"+p);},
  renderMonitors:actual=>{assert.ok(created.includes(actual));calls.push("monitors");},
  renderComputerSummary:actual=>{assert.ok(created.includes(actual));calls.push("summary");},
  decorate:actual=>{assert.ok(created.includes(actual));calls.push("decorate");},
  reconcile:(existing,next)=>{assert.equal(existing,host);assert.ok(created.includes(next));calls.push("reconcile");},
  doc
 };
 const originalLedgerQuery=doc.querySelector,originalHostQuery=doc.getElementById;
 doc.querySelector=selector=>ledgerPresent?originalLedgerQuery(selector):null;
 doc.getElementById=id=>hostPresent?originalHostQuery(id):null;
 const render=()=>{
  const prev=globalThis.HTMLButtonElement;
  globalThis.HTMLButtonElement=class {};
  try{renderAdminComputerSections(options);}finally{
   if(prev===undefined)delete globalThis.HTMLButtonElement;
   else globalThis.HTMLButtonElement=prev;
  }
 };
 return {calls,options,render,created,host,doc,
  setOpen:v=>open=v,setTab:v=>tab=v,setLedger:v=>ledgerTab=v,
  setChanged:v=>changed=v,setStation:v=>station=v,getStation:()=>station,
  setPage:v=>page=v,setLedgerPresent:v=>ledgerPresent=v,setHostPresent:v=>hostPresent=v};
}
test("administração fechada não reconstrói painel nem lê revisão",()=>{
 const f=setup();f.setOpen(false);f.render();
 assert.deepEqual(f.calls,[]);
 assert.equal(f.created.length,0);
});
test("outra aba administrativa não aciona dados dos computadores",()=>{
 const f=setup();f.setTab(false);f.render();
 assert.deepEqual(f.calls,[]);
});
test("página de receita por PC atualiza somente a tabela",()=>{
 const f=setup("ledger");f.setLedger(true);f.render();
 assert.deepEqual(f.calls,["ledgerActive","renderLedger","ledgerActive"]);
 assert.equal(f.created.length,0);
});
test("tabela de receita ausente não dispara renderização de manutenção",()=>{
 const f=setup("ledger");f.setLedger(true);f.setLedgerPresent(false);f.render();
 assert.deepEqual(f.calls,["ledgerActive"]);
});
test("operações reconstroem em container destacado e reconciliam no final",()=>{
 const f=setup("operations");f.render();
 assert.deepEqual(f.calls,["ledgerActive","ledgerActive","changed","page","operations","clamp","summary","decorate","reconcile"]);
 assert.equal(f.created.length,1);
});
test("hardware clampa estação antes de montar a configuração",()=>{
 const f=setup("hardware");f.setStation(8);f.render();
 assert.equal(f.getStation(),2);
 assert.ok(f.calls.indexOf("clamp")<f.calls.indexOf("hardware:hardware"));
 assert.ok(!f.calls.includes("operations"));
 assert.equal(f.calls.at(-1),"reconcile");
});
test("Windows utiliza o mesmo painel de peças com página preservada",()=>{
 const f=setup("windows");f.render();
 assert.ok(f.calls.includes("hardware:windows"));
 assert.ok(!f.calls.includes("monitors"));
});
test("monitores usam a seleção corrigida sem reconstruir outras páginas",()=>{
 const f=setup("monitors");f.render();
 assert.ok(f.calls.includes("monitors"));
 assert.ok(!f.calls.includes("operations"));
 assert.ok(!f.calls.includes("hardware:monitors"));
 assert.ok(f.calls.indexOf("clamp")<f.calls.indexOf("monitors"));
});
test("alteração não detectada não executa conteúdo nem altera foco",()=>{
 const f=setup();f.setChanged(false);f.render();
 assert.deepEqual(f.calls,["ledgerActive","ledgerActive","changed"]);
 assert.equal(f.created.length,0);
});
test("host de manutenção ausente não consulta revisão",()=>{
 const f=setup();f.setHostPresent(false);f.render();
 assert.deepEqual(f.calls,["ledgerActive"]);
});
test("tabela em página de operações permanece inativa",()=>{
 const f=setup("operations");f.render();
 assert.equal(f.calls.includes("renderLedger"),false);
 assert.equal(f.calls.includes("operations"),true);
});
test("troca de página e re-renderização não conservam container antigo",()=>{
 const f=setup("operations");
 f.render();const first=f.created[0];
 f.setPage("monitors");f.render();
 assert.notEqual(f.created[1],first);
 assert.equal(f.calls.filter(x=>x==="summary").length,2);
 assert.equal(f.calls.filter(x=>x==="reconcile").length,2);
});
test("seleção da estação é consultada pelo callback após construir",()=>{
 const f=setup("hardware");f.setStation(5);f.render();
 assert.equal(f.getStation(),2);
 assert.equal(f.calls.includes("selected"),false,"sem perda de foco não precisa consultar seleção");
});
test("UI não importa o motor e o main mantém os controladores existentes",()=>{
 const root=new URL("../src/",import.meta.url);
 const ui=readFileSync(new URL("ui/adminComputerSections.ts",root),"utf8");
 assert.doesNotMatch(ui,/from\s*["']\.\.\/sim\//);
 assert.doesNotMatch(ui,/\bGameState\b|stepGame|save\(|addEventListener|localStorage/);
 assert.match(sourceModule("ui/gamePanels.ts"),/renderAdminComputerSections\(\{/);
 assert.match(sourceModule("ui/gamePanels.ts"),/maintenanceChanged:\(\)=>panelChanged\("computers",/);
 assertSourceCall("ui/gamePanels.ts","renderHardwarePanel",["hardwarePanelPort.snapshot(state.selection.selectedLcdPc,state.selection.selectedHardwareTab,page)"]);
 assert.match(sourceModule("ui/gamePanels.ts"),/renderLcdMonitorsPanel\(host,lcdMonitorsPort.snapshot\(state\.selection\.selectedLcdPc\),lcdPreview,document\)/);
 assert.match(sourceModule("ui/gamePanels.ts"),/renderLedger:host=>renderStationLedgerRows\(host,stationLedgerPort\)/);
 assert.match(sourceModule("ui/runtimeControls.ts"),/installStationControls\(/);
});
