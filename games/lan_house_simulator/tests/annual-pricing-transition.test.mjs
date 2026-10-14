import test from "node:test";
import assert from "node:assert/strict";
import {createGame,stepGame} from "../dist/js/sim/engine.js";
import {gameYear} from "../dist/js/sim/era.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {setHourlyPrice,energyCostPerMinute,monthlyBills,demandFactor,sessionRevenue} from "../dist/js/sim/economy.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {hourlyPriceScenarios,energyYearOutlook} from "../dist/js/sim/pricingInsights.js";

test("contas da virada usam consumo acumulado até último minuto, sem reajuste automático no preço",()=>{
 const s=createGame(19);
 s.totalMinutes=360*DAY_MINUTES-1;
 s.cash=10000;
 s.licensedGames=true;
 s.contentFilterInstalled=true;
 s.pcWindowsLicenses=[true,true,true];
 s.energyAccrued=123.45;
 assert.equal(setHourlyPrice(s,22).ok,true);
 const before=s.cash;
 const expectedBill=monthlyBills({...s,energyAccrued:s.energyAccrued+energyCostPerMinute(s,0)});
 assert.equal(gameYear(s),1998);
 stepGame(s,1);
 assert.equal(gameYear(s),1999);
 assert.equal(s.cash,before-expectedBill);
 assert.equal(s.expenses,expectedBill);
 assert.equal(s.energyAccrued,0);
 assert.equal(s.pricePerHour,22);
 assert.deepEqual(s.retailPrices,{soda:8,candy:5,snacks:9});
 assert.equal(energyYearOutlook(s).changePercent,3);
 const restored=parseImportedSave(serializeSave(s));
 assert.equal(restored.pricePerHour,22);
 assert.equal(restored.cash,s.cash);
 assert.equal(restored.totalMinutes,s.totalMinutes);
});

test("jogador pode alterar tarifa após a virada sem preço automático, subsídios ou receita inventada",()=>{
 const s=createGame(20);
 s.totalMinutes=13*360*DAY_MINUTES; // início de 2011
 s.cash=18000;
 assert.equal(setHourlyPrice(s,22).ok,true);
 const before=JSON.stringify({cash:s.cash,revenue:s.revenue,expenses:s.expenses,rng:s.rng});
 const oldDemand=demandFactor(22,s.reputation,true,false);
 const oldTicket=sessionRevenue(22);
 const scenarios=hourlyPriceScenarios(s);
 const raise=scenarios.find(x=>x.delta===2);
 assert.equal(raise.price,24);
 assert.equal(raise.grossIntakeIndex,Math.round(100*
  demandFactor(24,s.reputation,true,false)*sessionRevenue(24)/(oldDemand*oldTicket)));
 assert.equal(JSON.stringify({cash:s.cash,revenue:s.revenue,expenses:s.expenses,rng:s.rng}),before);
 assert.equal(setHourlyPrice(s,24).ok,true);
 assert.equal(s.pricePerHour,24);
 assert.equal(JSON.stringify({cash:s.cash,revenue:s.revenue,expenses:s.expenses,rng:s.rng}),before);
 const recovered=parseImportedSave(serializeSave(s));
 assert.equal(recovered.pricePerHour,24);
 assert.equal(recovered.totalMinutes,s.totalMinutes);
 assert.equal(recovered.cash,s.cash);
});
