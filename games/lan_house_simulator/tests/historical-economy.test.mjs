import test from "node:test";
import assert from "node:assert/strict";
import {createGame,isValidSave,stepGame} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {setHourlyPrice,setProductPrice,monthlyBills,sessionRevenue,energyCostPerMinute,wholesaleCost,productPrice} from "../dist/js/sim/economy.js";
import {serviceVisitCost,allowableHourlyPrice,annualHourlyCeiling,priceIndex,qualityMultiplier,
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
 assert.ok(normalizedHourlyPrice(s,3)>3,"a tarifa ajustada compara poder de compra, não reais nominais");
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
 assert.ok([1.6,1.7].includes(energyYearOutlook(old).changePercent));
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
 assert.match(main,/newGameForPlayer\(72421,"historical"\)/);
  const session=readFileSync(resolve(root,"src/application/gameSessionPort.ts"),"utf8");
  assert.match(main,/createGameSessionPort\(/);
  assert.match(session,/const fresh=createGame\(seed,mode\)/);
 assert.match(main,/crypto\.getRandomValues/);
 const pricing=readFileSync(resolve(root,"src/application/hourlyPriceStatusPort.ts"),"utf8");
 const display=readFileSync(resolve(root,"src/ui/hourlyPriceStatusPanel.ts"),"utf8");
 assert.ok(pricing.includes("allowableHourlyPrice(game)"));
 assert.ok(display.includes("session-package-prices")===false);
 assert.ok(main.includes("renderSessionPackages(hourlyPriceStatus.packages,durations,document)"));
 // Save local agora é decodificado em localSave.ts; o estado recuperado
 // passa pelo ajuste de teto (que não altera o modo clássico).
  assert.match(session,/loadLocalSave\(store\)/);
  assert.match(session,/if\(loaded\.state\)\{/);
  assert.match(session,/clampPriceToEra\(loaded\.state\)/);
});

test("preço histórico de técnicos e limpeza é consistente com a época e não altera o clássico",()=>{
 const old=historical(1998),today=historical(2024),classic=createGame(19);
 assert.equal(serviceVisitCost(old,"cleaning"),12);
 assert.equal(serviceVisitCost(classic,"cleaning"),55);
 assert.equal(serviceVisitCost(classic,"repair",75),73);
 assert.equal(serviceVisitCost(old,"repair",75),16);
 assert.ok(serviceVisitCost(today,"cleaning")>50&&serviceVisitCost(today,"cleaning")<65);
 assert.ok(serviceVisitCost(today,"repair",75)>70&&serviceVisitCost(today,"repair",75)<90);
 const expected=Math.round(12*priceIndex(2024)*100)/100;
 assert.equal(serviceVisitCost(today,"cleaning"),expected);
 const cash=old.cash,revenue=old.revenue,expenses=old.expenses;
 serviceVisitCost(old,"repair",80);
 assert.deepEqual([old.cash,old.revenue,old.expenses],[cash,revenue,expenses],
   "cotação não pode alterar dinheiro nem RNG");
});

test("alterar um preço de produto em 1998 não converte os outros para a tabela clássica",()=>{
 const s=historical(1998);
 assert.equal(s.retailPrices,undefined);
 assert.deepEqual(["soda","candy","snacks"].map(item=>productPrice(s,item)),[1.5,1,2]);
 assert.equal(setProductPrice(s,"soda",1.75).ok,true);
 assert.deepEqual(s.retailPrices,{soda:1.75,candy:1,snacks:2});
 assert.deepEqual(parseImportedSave(serializeSave(s)).retailPrices,s.retailPrices);
 const in2012=historical(2012);
 const original=["soda","candy","snacks"].map(item=>productPrice(in2012,item));
 assert.equal(setProductPrice(in2012,"snacks",5.25).ok,true);
 assert.equal(productPrice(in2012,"soda"),original[0]);
 assert.equal(productPrice(in2012,"candy"),original[1]);
 const classic=createGame();
 assert.equal(setProductPrice(classic,"soda",9).ok,true);
 assert.deepEqual(classic.retailPrices,{soda:9,candy:5,snacks:9});
});
