import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame,pcCount,isValidSave} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {LCD_CATALOG,stationModelName} from "../dist/js/sim/computerModels.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {createLcdMonitorsPort} from "../dist/js/application/lcdMonitorsPort.js";
import {renderLcdMonitorsPanel} from "../dist/js/ui/lcdMonitorsPanel.js";
const at=(year=1998,mode="historical")=>{
 const s=createGame(2880,mode);s.totalMinutes=(year-1998)*360*DAY_MINUTES;s.cash=5000;return s;
};
test("1998: catálogo é projetado sem disponibilizar kits antes da época",()=>{
 const s=at(),old=JSON.stringify(s),port=createLcdMonitorsPort(()=>s);
 const view=port.snapshot(0);
 assert.equal(view.choices.length,pcCount(s));
 assert.deepEqual(view.choices.map(c=>c.label),["PC 1","PC 2","PC 3"]);
 assert.deepEqual(view.choices.map(c=>c.selected),[true,false,false]);
 assert.deepEqual(view.models.map(x=>x.id),LCD_CATALOG.map(x=>x.id));
 assert.ok(view.models.every(x=>x.locked&&x.buttonDisabled));
 assert.deepEqual(view.models.map(x=>x.buttonLabel),LCD_CATALOG.map(x=>"🔒 Chega em "+x.year));
 assert.equal(view.installedLabel,"PC 1 · instalado: "+stationModelName(s,0)+" · ano 1998");
 assert.equal(JSON.stringify(s),old);
});
test("kits liberados dependem de hardware nível 3, estação desligada e dinheiro",()=>{
 const s=at(2005),port=createLcdMonitorsPort(()=>s);
 assert.equal(port.snapshot(0).models[0].buttonLabel,"Requer hardware 3");
 s.pcTiers=[3,3,3];
 assert.equal(port.snapshot(0).models[0].buttonLabel,"Desligue a estação");
 s.pcPoweredOff=[true,false,false];
 assert.equal(port.snapshot(0).models[0].buttonLabel,"Instalar · R$ 580");
 assert.equal(port.snapshot(0).models[0].buttonDisabled,false);
 s.cash=579;
 assert.equal(port.snapshot(0).models[0].buttonLabel,"Caixa insuficiente · R$ 580");
 assert.equal(port.snapshot(0).models[0].buttonDisabled,true);
 assert.equal(port.snapshot(0).models[1].buttonLabel,"🔒 Chega em 2008");
});
test("ocupação e reparos impedem instalar kits, sem mexer nos chamados",()=>{
 const s=at(2008),port=createLcdMonitorsPort(()=>s);
 s.pcTiers=[3,3,3];s.pcPoweredOff=[true,false,false];
 s.customers.push({id:44,pcIndex:0,stage:"using"});
 assert.equal(port.snapshot(0).models[0].buttonLabel,"Estação ocupada");
 assert.equal(port.snapshot(0).models[0].buttonDisabled,true);
 s.customers=[];
 s.repairJobs=[{pc:0,phase:"working",duration:10,progress:2}];
 const before=JSON.stringify(s);
 assert.equal(port.snapshot(0).models[0].buttonLabel,"Estação ocupada");
 assert.equal(JSON.stringify(s),before);
});
test("projeção trata modelo instalado, geração anterior e bônus de satisfação",()=>{
 const s=at(2012),port=createLcdMonitorsPort(()=>s);
 s.pcTiers=[3,3,3];s.pcPoweredOff=[true,false,false];
 s.pcLcdModels=["lcd08",null,null];
 const view=port.snapshot(0);
 assert.equal(view.models[0].buttonLabel,"Geração anterior");
 assert.equal(view.models[0].buttonDisabled,true);
 assert.equal(view.models[1].buttonLabel,"Instalado");
 assert.equal(view.models[1].buttonDisabled,true);
 assert.equal(view.models[2].buttonLabel,"Instalar · R$ 1280");
 assert.equal(view.models[2].benefit,"Satisfação +1.5 p.p. · economia de energia em relação ao CRT.");
 assert.ok(view.installedLabel.includes("Panorama 19"));
});
test("alternância de PC mantém botões exclusivos da estação escolhida",()=>{
 const s=at(2024),port=createLcdMonitorsPort(()=>s);
 s.pcTiers=[3,1,3];s.pcPoweredOff=[true,false,false];
 const one=port.snapshot(0),two=port.snapshot(1);
 assert.deepEqual(one.choices.map(x=>x.selected),[true,false,false]);
 assert.deepEqual(two.choices.map(x=>x.selected),[false,true,false]);
 assert.equal(one.models[0].buttonDisabled,false);
 assert.equal(two.models[0].buttonLabel,"Requer hardware 3");
 assert.ok(two.installedLabel.startsWith("PC 2 ·"));
});
test("porta acompanha o save carregado sem guardar o GameState anterior",()=>{
 let s=at(2005),previous=s,old=JSON.stringify(s),port=createLcdMonitorsPort(()=>s);
 s=parseImportedSave(serializeSave(s));assert.equal(isValidSave(s),true);
 s.pcTiers=[3,3,3];s.pcPoweredOff=[true,false,false];
 assert.equal(port.snapshot(0).models[0].buttonDisabled,false);
 assert.equal(JSON.stringify(previous),old);
});
class MockNode{
 constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.attrs={};this.textContent="";}
 append(...nodes){this.children.push(...nodes);}
 setAttribute(k,v){this.attrs[k]=v;}
}
test("DOM preserva ordem, data-lcd-select, data-lcd-buy, aria e preview",()=>{
 const s=at(2005),port=createLcdMonitorsPort(()=>s),view=port.snapshot(0);
 const host=new MockNode("div"),doc={createElement:tag=>new MockNode(tag)},calls=[];
 renderLcdMonitorsPanel(host,view,id=>{calls.push(id);return "preview:"+id;},doc);
 assert.equal(host.children.length,1);
 const [title,hint,nav,installed,catalog]=host.children[0].children;
 assert.equal(title.textContent,"Da era CRT aos LCDs");
 assert.equal(hint.className,"lcd-note");
 assert.equal(nav.attrs["aria-label"],"Estação para instalar kit LCD");
 assert.deepEqual(nav.children.map(x=>x.dataset.lcdSelect),["0","1","2"]);
 assert.deepEqual(nav.children.map(x=>x.attrs["aria-pressed"]),["true","false","false"]);
 assert.equal(installed.dataset.lcdCurrent,"");
 assert.equal(catalog.children.length,5);
 assert.deepEqual(calls,LCD_CATALOG.map(x=>x.id));
 for(let i=0;i<catalog.children.length;i++){
  const card=catalog.children[i],art=card.children[0],info=card.children[1],button=info.children[3];
  assert.equal(art.src,"preview:"+view.models[i].id);
  assert.equal(art.alt,view.models[i].artAlt);
  assert.equal(art.width,320);assert.equal(art.height,190);
  assert.equal(button.dataset.lcdBuy,view.models[i].id);
  assert.equal(button.disabled,view.models[i].buttonDisabled);
  assert.equal(button.textContent,view.models[i].buttonLabel);
 }
});
test("camadas não misturam motor, DOM e roteamento mobile",()=>{
 const root=new URL("../src/",import.meta.url);
 const app=readFileSync(new URL("application/lcdMonitorsPort.ts",root),"utf8");
 const ui=readFileSync(new URL("ui/lcdMonitorsPanel.ts",root),"utf8");
 const main=readFileSync(new URL("main.ts",root),"utf8");
 const sections=readFileSync(new URL("ui/adminComputerSections.ts",root),"utf8");
 assert.doesNotMatch(app,/\b(document|window|HTMLElement|HTMLButtonElement)\b/);
 assert.doesNotMatch(ui,/from\s*["']\.\.\/sim\//);
 assert.doesNotMatch(ui,/\bGameState\b|addEventListener/);
 assert.ok(main.includes("renderLcdMonitorsPanel(host,lcdMonitorsPort.snapshot(selectedLcdPc),lcdPreview,document)"));
 assert.ok(main.includes("createLcdMonitorsPort(()=>game)"));
 const focus=readFileSync(new URL("ui/pcMaintenancePanel.ts",root),"utf8");
 assert.ok(main.includes("reconcile:syncPanelChildren"));
 assert.ok(main.includes("renderAdminComputerSections({"));
 assert.ok(sections.includes("renderPcMaintenancePanel(host"));
 assert.ok(focus.includes("focusSelector"));
 assert.ok(focus.includes("host.querySelector<HTMLButtonElement>(focusSelector)"));
 assert.ok(main.includes("installStationControls("));
 assert.ok(!main.includes("for(const model of LCD_CATALOG)"));
});
