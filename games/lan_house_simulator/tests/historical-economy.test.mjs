import test from "node:test";
import assert from "node:assert/strict";
import {createGame,isValidSave,stepGame} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {setHourlyPrice,monthlyBills,sessionRevenue,energyCostPerMinute,wholesaleCost,productPrice} from "../dist/js/sim/economy.js";
import {allowableHourlyPrice,annualHourlyCeiling,priceIndex,qualityMultiplier,
 SESSION_PACKAGES,sessionPrice,normalizedHourlyPrice,clampPriceToEra} from "../dist/js/sim/historicalEconomy.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {hourlyPriceInsight,hourlyPriceScenarios,energyYearOutlook} from "../dist/js/sim/pricingInsights.js";
import {readFileSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";

function historical(year=1998){
 const s=createGame(91,"historical");
 s.totalMinutes=(year-1998)*360*DAY_MINUTES;
 return s;
}
test("1998: salário de referência R$ 130; teto inicial nominal R$ 3 e blocos reais",()=>{
 const s=historical();
 assert.equal(s.economyVersion,2);
 assert.equal(s.pricePerHour,2.5);
 assert.equal(priceIndex(1998),1);
 assert.equal(annualHourlyCeiling(1998),3);
 assert.equal(allowableHourlyPrice(s),3);
 assert.equal(setHourlyPrice(s,18).ok,false);
 assert.equal(setHourlyPrice(s,3).ok,true);
 assert.equal(setHourlyPrice(s,3.25).ok,false);
 assert.ok(setHourlyPrice(s,2.75).ok);
 assert.deepEqual([...SESSION_PACKAGES],[30,45,60,90,120,180,240]);
 assert.equal(sessionPrice(2.5,30),1.25);
 assert.equal(sessionPrice(2.5,90),3.75);
 assert.equal(sessionPrice(2.5,240),10);
 assert.equal(sessionRevenue(2.5,45,true),1.88);
 assert.equal(sessionRevenue(12,45),9);
 assert.ok(isValidSave(s));
});
test("IPCA oficial: tetos de 1999, 2010, 2024 sobem, sem inventar futuro",()=>{
 assert.ok(Math.abs(priceIndex(1999)-1.0165)<1e-7);
 assert.ok(annualHourlyCeiling(2010)>annualHourlyCeiling(2000));
 assert.ok(annualHourlyCeiling(2024)>annualHourlyCeiling(2010));
 assert.equal(annualHourlyCeiling(2028),annualHourlyCeiling(2026));
 const s=historical(2010);
 assert.ok(allowableHourlyPrice(s)<annualHourlyCeiling(2010),"Windows 98 envelhece");
 assert.equal(setHourlyPrice(s,18).ok,false);
 assert.ok(qualityMultiplier(s)<1);
 assert.ok(normalizedHourlyPrice(s,3)<3,"real price stays relative");
 const before=JSON.stringify(s),examples=hourlyPriceScenarios(s);
 assert.deepEqual(JSON.stringify(s),before);
 assert.ok(examples.every(x=>x.price<=allowableHourlyPrice(s)));
 assert.ok(hourlyPriceInsight(s).relativeDemandPercent>0);
});
test("inflação afeta aluguel, energia, atacado e varejo histórico; clássico intacto",()=>{
 const old=historical(1998),future=historical(2010),classic=createGame(91);
 old.energyAccrued=0;future.energyAccrued=0;classic.energyAccrued=0;
 assert.ok(monthlyBills(future)>monthlyBills(old));
 assert.equal(monthlyBills(classic),monthlyBills(old),"mesma base em 1998");
 assert.ok(energyCostPerMinute(future,0)>energyCostPerMinute(old,0));
 assert.ok(wholesaleCost(future,"soda")>wholesaleCost(old,"soda"));
 assert.ok(productPrice(future,"soda")>productPrice(old,"soda"));
 assert.equal(productPrice(classic,"soda"),8);
 assert.equal(wholesaleCost(classic,"soda"),40);
 assert.equal(classic.pricePerHour,12);
 assert.ok(setHourlyPrice(classic,22).ok);
 assert.deepEqual(energyYearOutlook(classic),{currentYear:1998,nextYear:1999,changePercent:3});
 assert.deepEqual(energyYearOutlook(old),{currentYear:1998,nextYear:1999,changePercent:1.6});
});
test("importação preserva modo histórico e modo clássico não vira outro modelo sozinho",()=>{
 const s=historical(),classic=createGame(100);
 const imported=parseImportedSave(serializeSave(s)),legacy=parseImportedSave(serializeSave(classic));
 assert.equal(imported.economyVersion,2);
 assert.equal(imported.pricePerHour,2.5);
 assert.equal(legacy.economyVersion,undefined);
 assert.equal(legacy.pricePerHour,12);
 assert.equal(clampPriceToEra(legacy),false);
 imported.economyVersion=17;
 assert.equal(isValidSave(imported),false);
});
test("virada de ano mantém índice das contas do mês encerrado e libera teto do próximo",()=>{
 const s=historical();
 s.totalMinutes=360*DAY_MINUTES-1;
 s.cash=10000;s.licensedGames=true;s.contentFilterInstalled=true;
 s.pcWindowsLicenses=[true,true,true];s.energyAccrued=20;
 const previous=monthlyBills({...s,energyAccrued:s.energyAccrued+energyCostPerMinute(s)});
 const opening=s.cash;
 stepGame(s,1);
 assert.equal(s.totalMinutes,360*DAY_MINUTES);
 assert.equal(s.cash,opening-previous);
 assert.ok(annualHourlyCeiling(1999)>=annualHourlyCeiling(1998));
 assert.ok(isValidSave(s));
});
test("a interface da nova partida oferece períodos e teto histórico, sem apagar salvar clássico",()=>{
 const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
 const main=readFileSync(resolve(root,"src/main.ts"),"utf8");
 const html=readFileSync(resolve(root,"index.html"),"utf8");
 for(const id of ["year-price-ceiling","equipment-price-ceiling","annual-ipca","session-package-prices"])
  assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(main,/createGame\(72421,"historical"\)/);
 assert.ok(main.includes("allowableHourlyPrice(game)"));
 assert.ok(main.includes("clampPriceToEra(decoded)"));
});
