import assert from "node:assert/strict";
import test from "node:test";
import {createGame,stepGame} from "../dist/js/sim/engine.js";
import {energyCostPerMinute,energyMonthlyEstimate,monthlyBills} from "../dist/js/sim/economy.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";

test("mais computadores ligados aumentam energia em repouso",()=>{
 const s=createGame();const base=energyCostPerMinute(s,0);
 s.installedPcs=5;s.pcTiers=[1,1,1,1,1];assert.ok(energyCostPerMinute(s,0)>base);
});
test("computador usado custa mais energia que ocioso",()=>{
 const s=createGame();
 assert.ok(energyCostPerMinute(s,1)>energyCostPerMinute(s,0));
 assert.ok(energyCostPerMinute(s,3)>energyCostPerMinute(s,1));
});
test("hardware avançado e anos futuros aumentam consumo",()=>{
 const s=createGame();const initial=energyCostPerMinute(s,2);
 s.pcTiers=[3,3,3];assert.ok(energyCostPerMinute(s,2)>initial);
 const modern=energyCostPerMinute(s,2);
 s.totalMinutes=9*360*DAY_MINUTES;assert.ok(energyCostPerMinute(s,2)>modern);
});
test("medidor acumula ao passar os minutos e não cobra antes do vencimento",()=>{
 const s=createGame();const cash=s.cash;
 stepGame(s,10);
 assert.ok(s.energyAccrued>0);
 assert.equal(s.cash,cash);
});
test("mensalidade cobra consumo acumulado uma única vez e zera o medidor",()=>{
 const s=createGame();s.cash=10000;
 s.totalMinutes=30*DAY_MINUTES-1;
 s.energyAccrued=153.45;
 const expected=monthlyBills(s);
 const cash=s.cash;
 stepGame(s,1);
 assert.equal(s.cash,cash-expected);
 assert.equal(s.energyAccrued,0);
});
test("saves antigos sem medidor continuam com conta estimada",()=>{
 const s=createGame();delete s.energyAccrued;
 assert.ok(energyMonthlyEstimate(s)>0);
 assert.ok(monthlyBills(s)>0);
});
