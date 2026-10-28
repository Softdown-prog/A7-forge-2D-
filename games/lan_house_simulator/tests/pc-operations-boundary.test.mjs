import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame,pcCount,pcWear,pcBroken,isValidSave} from "../dist/js/sim/engine.js";
import {stationPoweredOn,toggleStationPower} from "../dist/js/sim/stationPower.js";
import {serviceVisitCost} from "../dist/js/sim/historicalEconomy.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {createPcOperationsPort} from "../dist/js/application/pcOperationsPort.js";
import {renderPcOperations} from "../dist/js/ui/pcOperationsPanel.js";

test("resumo e lista iniciais não alteram o motor nem RNG",()=>{
 const state=createGame(7101,"historical"),before=JSON.stringify(state),port=createPcOperationsPort(()=>state);
 const count=pcCount(state);
 assert.equal(port.summary(),count+" computadores · 0 ocupados · 0 desligados · 0 em manutenção");
 assert.equal(port.rows().length,count);
 assert.equal(JSON.stringify(state),before);
});
test("estação inicial mostra preço real do técnico e kit CRT bloqueado",()=>{
 const state=createGame(7102,"historical"),port=createPcOperationsPort(()=>state),first=port.rows()[0];
 const wear=pcWear(state,0);
 assert.equal(first.label.includes(" · desgaste "+Math.round(wear)+"%"),true);
 assert.equal(first.label.includes(" · MANUTENÇÃO"),pcBroken(state,0));
 assert.equal(first.poweredOn,true);
 assert.equal(first.powerLabel,"Desligar estação");
 assert.equal(first.upgradeLabel,"Kit CRT 2000 · 🔒 2000");
 assert.equal(first.upgradeDisabled,true);
 assert.equal(first.repairLabel,"Chamar técnico avulso · R$ "+serviceVisitCost(state,"repair",wear).toLocaleString("pt-BR"));
 assert.equal(first.repairDisabled,wear<1);
});
test("PC desligado, ano desbloqueado e caixa controlam oferta de upgrade",()=>{
 const state=createGame(7103,"historical"),port=createPcOperationsPort(()=>state);
 assert.equal(toggleStationPower(state,0).ok,true);
 assert.equal(stationPoweredOn(state,0),false);
 assert.ok(port.summary().includes("1 desligados"));
 assert.equal(port.rows()[0].powerLabel,"Ligar estação");
 state.totalMinutes=2*360*DAY_MINUTES;state.cash=1000;
 assert.equal(port.rows()[0].upgradeLabel,"Kit CRT 2000 · R$ 240");
 assert.equal(port.rows()[0].upgradeDisabled,false);
 state.cash=239;
 assert.equal(port.rows()[0].upgradeDisabled,true);
 state.cash=1000;state.pcTiers[0]=3;
 assert.equal(port.rows()[0].upgradeLabel,"Ver Peças e configuração");
 assert.equal(port.rows()[0].upgradeDisabled,true);
});
test("cliente e reparo em andamento impedem ações, sem duplicar pagamentos",()=>{
 const state=createGame(7104,"classic"),port=createPcOperationsPort(()=>state);
 state.customers.push({id:99,pcIndex:0,stage:"using"});
 const saved=JSON.stringify(state);
 assert.equal(port.rows()[0].powerDisabled,true);
 assert.equal(port.rows()[0].repairDisabled,true);
 assert.equal(JSON.stringify(state),saved);
 state.customers=[];
 state.repairJobs=[{pc:0,phase:"working",progress:5,duration:10}];
 const row=port.rows()[0];
 assert.equal(row.repairLabel,"Técnico · Reparando · 50%");
 assert.equal(row.repairDisabled,true);
 assert.deepEqual(row.progress,{max:10,value:5,ariaLabel:"Reparo do PC 1"});
 assert.equal(toggleStationPower(state,0).ok,true);
 assert.equal(port.rows()[0].powerDisabled,true);
});
test("porta lê save importado sem prender referência à partida anterior",()=>{
 let state=createGame(7105,"historical");
 const port=createPcOperationsPort(()=>state),original=state,before=JSON.stringify(state);
 state=parseImportedSave(serializeSave(state));
 assert.equal(isValidSave(state),true);
 assert.equal(toggleStationPower(state,1).ok,true);
 assert.equal(port.rows()[1].powerLabel,"Ligar estação");
 assert.equal(JSON.stringify(original),before);
});
class MockNode {
 constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.attributes={};this.textContent="";}
 append(...items){this.children.push(...items);}
 appendChild(item){this.children.push(item);}
 replaceChildren(...items){this.children=[...items];}
 setAttribute(name,value){this.attributes[name]=value;}
}
test("painel mantém data-pc-* para ações delegadas e barra de andamento",()=>{
 const state=createGame(7106,"classic");
 state.repairJobs=[{pc:0,phase:"working",progress:2,duration:8}];
 const port=createPcOperationsPort(()=>state);
 const doc={createElement:tag=>new MockNode(tag)},host=new MockNode("div");
 renderPcOperations(host,port.rows(),doc);
 assert.equal(host.children[0].tag,"strong");
 assert.equal(host.children[1].className,"station-power-hint");
 assert.equal(host.children.length,pcCount(state)+2);
 const first=host.children[2],meter=first.children[0];
 assert.equal(first.dataset.panelKey,"operation-0");
 assert.equal(meter.tag,"progress");
 assert.equal(meter.max,8);assert.equal(meter.value,2);
 assert.equal(meter.attributes["aria-label"],"Reparo do PC 1");
 const [label,power,repair,upgrade]=first.children.slice(1);
 assert.ok(label.textContent.startsWith("PC 1"));
 assert.deepEqual(power.dataset,{pcPower:"0"});
 assert.equal(power.id,"pc-power-0");
 assert.deepEqual(repair.dataset,{pcRepair:"0"});
 assert.equal(repair.disabled,true);
 assert.deepEqual(upgrade.dataset,{pcUpgrade:"0"});
});
test("fronteira da aplicação mantém DOM isolado e não muda o fluxo mobile",()=>{
 const root=new URL("../src/",import.meta.url);
 const app=readFileSync(new URL("application/pcOperationsPort.ts",root),"utf8");
 const ui=readFileSync(new URL("ui/pcOperationsPanel.ts",root),"utf8");
 const main=readFileSync(new URL("main.ts",root),"utf8");
 assert.doesNotMatch(app,/\b(document|window|HTMLElement|HTMLButtonElement)\b/);
 assert.doesNotMatch(ui,/from\s*["']\.\.\/sim\//);
 assert.doesNotMatch(ui,/\bGameState\b|addEventListener/);
 assert.ok(main.includes("createPcOperationsPort(()=>game)"));
 assert.ok(main.includes("renderPcOperations(maintenance,pcOperationsPort.rows(),document)"));
 assert.ok(main.includes("syncPanelChildren(liveMaintenance,maintenance)"));
 assert.ok(main.includes('panelChanged("computers"'));
 assert.ok(main.includes("installStationControls("));
 assert.doesNotMatch(main,/\bpcWear\(|\bpcBroken\(/);
});
