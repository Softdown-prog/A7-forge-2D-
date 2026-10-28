import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame,pcCount,isValidSave} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {GPU_CATALOG} from "../dist/js/sim/gpu.js";
import {hardwareFor,buildParts,requiredPsuWatts} from "../dist/js/sim/hardware.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {createGpuCatalogPort} from "../dist/js/application/gpuCatalogPort.js";
import {renderGpuCatalogPanel} from "../dist/js/ui/gpuCatalogPanel.js";
const campaign=year=>{const s=createGame(6804,"historical");s.cash=50000;s.totalMinutes=(year-1998)*360*DAY_MINUTES;return s;};

test("1998: cinco GPUs bloqueadas e leitura sem editar o save",()=>{
 const s=campaign(1998),before=JSON.stringify(s),view=createGpuCatalogPort(()=>s).snapshot(0);
 assert.equal(view.stations.length,pcCount(s));
 assert.deepEqual(view.stations.map(x=>x.selected),[true,false,false]);
 assert.deepEqual(view.models.map(x=>x.id),GPU_CATALOG.map(x=>x.id));
 assert.ok(view.models.every(x=>x.locked&&x.disabled));
 assert.deepEqual(view.models.map(x=>x.buttonLabel),GPU_CATALOG.map(x=>"🔒 Disponível em "+x.year));
 assert.match(view.replacementNote,/sem GPU dedicada/);
 assert.equal(JSON.stringify(s),before);
});
test("2005: fonte e custo calculados pelo mesmo motor econômico",()=>{
 const s=campaign(2005),port=createGpuCatalogPort(()=>s);
 const needed=requiredPsuWatts(hardwareFor(s,0),"gpu05");
 const enough=buildParts(hardwareFor(s,0)).psu.watts>=needed;
 let row=port.snapshot(0).models[0];
 assert.equal(row.locked,false);
 assert.ok(row.details.includes("fonte necessária "+needed+" W"));
 assert.equal(row.buttonLabel,enough?"Comprar · R$ 440":"Requer fonte de "+needed+" W");
 assert.equal(row.disabled,true,"estação ligada não permite upgrade");
 s.pcPoweredOff=[true,false,false];row=port.snapshot(0).models[0];
 assert.equal(row.disabled,!enough);
 assert.equal(s.cash,50000);
});
test("troca e placas obsoletas exibem somente o ganho incremental",()=>{
 const s=campaign(2013),port=createGpuCatalogPort(()=>s);
 s.pcGpus=["gpu09",null,null];
 let view=port.snapshot(0);
 assert.equal(view.models[0].buttonLabel,"Modelo anterior");
 assert.equal(view.models[2].buttonLabel,"Instalada");
 assert.ok(view.models[3].details.includes("ganho adicional 0,025"));
 assert.match(view.replacementNote,/PixelForce 260 instalada/);
 view=port.snapshot(1);
 assert.deepEqual(view.stations.map(x=>x.selected),[false,true,false]);
 assert.ok(view.models[3].details.includes("ganho adicional 0,110"));
 assert.match(view.replacementNote,/PC 2 sem GPU dedicada/);
});
test("cliente, reparo, PC ligado e caixa insuficiente bloqueiam a instalação",()=>{
 const s=campaign(2013),port=createGpuCatalogPort(()=>s);
 s.pcTiers=[3,3,3];s.pcPoweredOff=[true,false,false];
 const first=()=>port.snapshot(0).models[0];
 const enough=buildParts(hardwareFor(s,0)).psu.watts>=requiredPsuWatts(hardwareFor(s,0),"gpu05");
 assert.equal(first().disabled,!enough);
 s.customers.push({id:234,pcIndex:0,stage:"using"});
 assert.equal(first().disabled,true);
 s.customers=[];s.repairJobs=[{pc:0,phase:"working",progress:1,duration:8}];
 assert.equal(first().disabled,true);
 s.repairJobs=[];s.cash=0;assert.equal(first().disabled,true);
 s.cash=50000;s.pcPoweredOff=[false,false,false];assert.equal(first().disabled,true);
});
test("instância ativa muda após importação sem alterar a partida antiga",()=>{
 let s=campaign(2005),old=s,before=JSON.stringify(s);
 const port=createGpuCatalogPort(()=>s);
 s=parseImportedSave(serializeSave(s));assert.equal(isValidSave(s),true);
 s.pcPoweredOff=[true,false,false];s.cash=0;
 assert.equal(port.snapshot(0).models[0].disabled,true);
 assert.equal(JSON.stringify(old),before);
});
class FakeNode{
 constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.attributes={};this.textContent="";}
 append(...children){this.children.push(...children);}
 setAttribute(name,value){this.attributes[name]=value;}
}
test("DOM conserva data-gpu-select, data-gpu-buy, seleção e listener delegado",()=>{
 const s=campaign(2013),view=createGpuCatalogPort(()=>s).snapshot(1);
 const choices={listeners:["click"]},cards={listeners:["click"]},doc={createElement:t=>new FakeNode(t)};
 const touched=[],texts=new Map();let selection,catalog;
 renderGpuCatalogPanel(choices,cards,view,(id,value)=>texts.set(id,value),doc,(host,next)=>{
  touched.push(host);if(host===choices)selection=next;else catalog=next;
 });
 assert.deepEqual(touched,[choices,cards]);
 assert.equal(choices.listeners[0],"click");assert.equal(cards.listeners[0],"click");
 assert.deepEqual(selection.children.map(x=>x.dataset.gpuSelect),["0","1","2"]);
 assert.deepEqual(selection.children.map(x=>x.attributes["aria-pressed"]),["false","true","false"]);
 assert.equal(selection.children[1].className,"gpu-station selected");
 assert.deepEqual(catalog.children.map(x=>x.children[1].children[2].dataset.gpuBuy),GPU_CATALOG.map(x=>x.id));
 assert.equal(catalog.children[0].children[0].loading,"lazy");
 assert.equal(catalog.children[0].children[0].src,"./assets/gpu/gpu05.svg");
 assert.equal(catalog.children[0].children[1].children[2].type,"button");
 assert.equal(texts.get("gpu-replacement-note"),view.replacementNote);
});
test("componente sem motor, porta sem DOM e integração no main",()=>{
 const root=new URL("../src/",import.meta.url);
 const app=readFileSync(new URL("application/gpuCatalogPort.ts",root),"utf8");
 const ui=readFileSync(new URL("ui/gpuCatalogPanel.ts",root),"utf8");
 const main=readFileSync(new URL("main.ts",root),"utf8");
 assert.equal(app.includes("document."),false);
 assert.equal(ui.includes("../sim/"),false);
 assert.equal(ui.includes("GameState"),false);
 assert.equal(ui.includes("addEventListener"),false);
 assert.ok(main.includes("createGpuCatalogPort(()=>game)"));
 assert.ok(main.includes("renderGpuCatalogPanel(gpuPcChoice,gpuList,gpuCatalogPort.snapshot(selectedGpuPc),setText,document,syncPanelChildren)"));
 assert.ok(main.includes('panelChanged("gpuPcChoice"'));
 assert.ok(main.includes("installStationControls("));
 assert.equal(main.includes("for(const model of GPU_CATALOG)"),false);
});
