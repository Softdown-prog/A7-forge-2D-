import {sourceModule,assertCompositionAdaptersExclude} from "./helpers/composition.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame,pcCount,isValidSave} from "../dist/js/sim/engine.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {createStationLedgerPort} from "../dist/js/application/stationLedgerPort.js";

test("contabilidade por PC espelha o motor, sem mutar o save",()=>{
 const state=createGame(8150,"historical");
 const port=createStationLedgerPort(()=>state);
 const before=JSON.stringify(state);
 const rows=port.rows();
 assert.equal(rows.length,pcCount(state));
 assert.equal(rows[0].label,"PC 1");
 assert.deepEqual(rows.map(row=>row.sessions),Array(pcCount(state)).fill(0));
 assert.equal(rows[0].netRevenue,0);
 assert.equal(JSON.stringify(state),before);
});

test("receita, VIP, minutos e energia produzem DTOs independentes",()=>{
 const state=createGame(8151,"historical");
 state.stationLedger=[{
  sessions:3,vipSessions:1,sessionRevenue:101.5,vipRevenue:30,
  occupiedMinutes:124,energyShare:7.25
 }];
 const port=createStationLedgerPort(()=>state);
 const view=port.rows();
 assert.deepEqual(view[0],{
  label:"PC 1",sessions:3,vipSessions:1,occupiedMinutes:124,
  sessionRevenue:101.5,energyShare:7.25,netRevenue:94.25
 });
 state.stationLedger[0].sessionRevenue=200;
 assert.equal(view[0].sessionRevenue,101.5);
 assert.equal(port.rows()[0].netRevenue,192.75);
 assert.equal(port.rows()[1].sessions,0);
});

test("substituição e importação de save usam a partida corrente",()=>{
 let state=createGame(8152,"historical");
 const port=createStationLedgerPort(()=>state);
 const old=state;
 state=parseImportedSave(serializeSave(state));
 state.stationLedger=[{
  sessions:2,vipSessions:0,sessionRevenue:45,vipRevenue:0,
  occupiedMinutes:120,energyShare:5
 }];
 assert.notEqual(state,old);
 assert.equal(port.rows()[0].netRevenue,40);
 assert.equal(isValidSave(state),true);
 assert.equal(old.stationLedger?.[0]?.sessions??0,0);
});

test("fronteira mantém simulação fora do DOM e formato de tabela legado",()=>{
 const root=new URL("../src/",import.meta.url);
 const app=readFileSync(new URL("application/stationLedgerPort.ts",root),"utf8");
 const ui=readFileSync(new URL("ui/stationLedgerPanel.ts",root),"utf8");
 assert.doesNotMatch(app,/\b(document|window|HTMLElement|HTMLTableSectionElement)\b/);
 assert.doesNotMatch(ui,/from\s*["']\.\.\/sim\//);
 assert.doesNotMatch(ui,/\bGameState\b/);
 assert.match(ui,/document\.createElement\("th"\)/);
 assert.match(ui,/\.scope="row"/);
 assert.match(ui,/toLocaleString\("pt-BR"/);
 assert.match(ui,/syncPanelChildren\(host,next\)/);
 assert.match(sourceModule("application/gamePorts.ts"),/createStationLedgerPort\(getState\)/);
 assert.match(sourceModule("ui/gamePanels.ts"),/renderLedger:host=>renderStationLedgerRows\(host,stationLedgerPort\)/);
 assert.match(sourceModule("ui/gamePanels.ts"),/renderAdminComputerSections\(\{/);
 assertCompositionAdaptersExclude(/\bstationAccountingSummary\(/);
});
