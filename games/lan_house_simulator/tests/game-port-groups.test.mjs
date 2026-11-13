import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame} from "../dist/js/sim/engine.js";
import {createGamePorts} from "../dist/js/application/gamePorts.js";
import {createConsolePorts} from "../dist/js/application/portGroups/consolePorts.js";
import {createFinanceReportsPorts} from "../dist/js/application/portGroups/financeReportsPorts.js";

const consoleNames=["ps1Actions","ps2Port","ps1AdminPort","ps1ShopDiscPort","ps1ShopPlacementPort","ps1ShopOfferPort"];
const reportNames=["stationLedgerPort","monthlyFinancePort","financialBalancePort","financialAdminOverviewPort"];
const camera=()=>({originX:0,originY:0,zoom:1});

test("console and finance factories keep every public GamePorts member",()=>{
 let game=createGame(72421,"historical");
 const getState=()=>game;
 const ports=createGamePorts(getState,camera);
 const consoles=createConsolePorts(getState);
 const reports=createFinanceReportsPorts(getState);
 assert.deepEqual(Object.keys(consoles),consoleNames);
 assert.deepEqual(Object.keys(reports),reportNames);
 for(const [key,port] of [...Object.entries(consoles),...Object.entries(reports)]){
  assert.ok(Object.hasOwn(ports,key),"missing GamePorts."+key);
  assert.deepEqual(Object.keys(ports[key]).sort(),Object.keys(port).sort(),key+" must preserve its public methods");
 }
 assert.deepEqual(Object.keys(ports.ps1AdminPort.snapshot()).sort(),Object.keys(consoles.ps1AdminPort.snapshot()).sort());
 assert.deepEqual(ports.financialBalancePort.balance(),reports.financialBalancePort.balance());
 assert.deepEqual(ports.stationLedgerPort.rows(),reports.stationLedgerPort.rows());
});

test("grouped adapters use the replacement save rather than capturing stale state",()=>{
 let state=createGame(72421,"historical");
 state.cash=1450;
 const getState=()=>state;
 const grouped=createGamePorts(getState,camera);
 const directConsoles=createConsolePorts(getState);
 const directFinance=createFinanceReportsPorts(getState);
 assert.equal(grouped.ps1Actions.stationCount(),0);
 assert.equal(grouped.financialBalancePort.balance().cash,"R$ 1.450");
 const replacement=createGame(78787,"historical");
 replacement.cash=3270;
 replacement.ps1Stations=[{slotId:"floor-1",wear:0}];
 state=replacement;
 assert.equal(grouped.ps1Actions.stationCount(),1);
 assert.equal(directConsoles.ps1Actions.stationCount(),1);
 assert.equal(grouped.ps1AdminPort.snapshot().stationCount,1);
 assert.equal(grouped.financialBalancePort.balance().cash,"R$ 3.270");
 assert.deepEqual(grouped.financialBalancePort.balance(),directFinance.financialBalancePort.balance());
 assert.deepEqual(grouped.financialAdminOverviewPort.snapshot(),directFinance.financialAdminOverviewPort.snapshot());
});

test("gamePorts stays an adapter and never duplicates console or finance rules",()=>{
 const source=readFileSync(new URL("../src/application/gamePorts.ts",import.meta.url),"utf8");
 const consoleGroup=readFileSync(new URL("../src/application/portGroups/consolePorts.ts",import.meta.url),"utf8");
 const financeGroup=readFileSync(new URL("../src/application/portGroups/financeReportsPorts.ts",import.meta.url),"utf8");
 assert.match(source,/createConsolePorts\(getState\)/);
 assert.match(source,/createFinanceReportsPorts\(getState\)/);
 assert.doesNotMatch(source,/from\s*["']\.\/ps(?:1|2)(?:Actions|Admin|ShopDisc|ShopOffer|ShopPlacement)?Port\.js/);
 assert.doesNotMatch(source,/from\s*["']\.\/(?:stationLedger|monthlyFinance|financialBalance|financialAdminOverview)Port\.js/);
 for(const group of [consoleGroup,financeGroup]){
  assert.doesNotMatch(group,/\b(?:window|document|localStorage|CanvasRenderingContext2D)\b/);
  assert.doesNotMatch(group,/getState\(\)/,"construction must not snapshot the active campaign");
 }
});
