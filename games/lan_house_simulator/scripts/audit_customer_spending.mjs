// Three game days, real sessions/sales; compares stock/price/player operations.
import {createGame,stepGame,pcWear} from "../dist/js/sim/engine.js";
import {stockItem,licenseGames,setHourlyPrice,setProductPrice} from "../dist/js/sim/economy.js";
import {startRepair} from "../dist/js/sim/services.js";
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import assert from "node:assert/strict";

export function runSpendingScenario(tariff,managed,seed=1933,expensiveFood=false){
 const s=createGame(seed),opening=managed?10000:s.cash;
 if(managed){s.cash=opening;assert.equal(licenseGames(s).ok,true);}
 assert.equal(setHourlyPrice(s,tariff).ok,true);
 if(expensiveFood)for(const item of ["soda","candy","snacks"])assert.equal(setProductPrice(s,item,40).ok,true);
 const sessions={},sold={soda:0,candy:0,snacks:0},ages=[],servedIds=new Set(),birth=new Map();
 for(let min=0;min<720*3;min++){
  if(managed&&min%60===0){
   for(const item of ["soda","candy","snacks"])if(s.inventory[item]<5)assert.equal(stockItem(s,item).ok,true);
   for(let i=0;i<3;i++)if(pcWear(s,i)>=75&&!s.repairJobs?.some(j=>j.pc===i)&&!s.customers.some(c=>c.pcIndex===i))assert.equal(startRepair(s,i).ok,true);
  }
  stepGame(s,1);
  for(const c of s.customers){
   if(!birth.has(c.id))birth.set(c.id,s.totalMinutes);
   if(c.sessionMinutes&&!servedIds.has(c.id)){
    servedIds.add(c.id);sessions[c.sessionMinutes]=(sessions[c.sessionMinutes]??0)+1;ages.push(s.totalMinutes-birth.get(c.id));
   }
  }
  for(const e of s.saleEffects??[])sold[e.item]++;s.saleEffects=[];
  assert.equal(s.cash,opening+s.revenue-s.expenses,"Contabilidade no minuto "+min);
 }
 return {seed,tariff,managed,expensiveFood,served:s.served,sessions,sold,stock:s.inventory,
  ageBeforeContractMean:Math.round(ages.reduce((n,a)=>n+a,0)/Math.max(1,ages.length)),lost:s.lostCustomers};
}
if(process.argv[1]===import.meta.filename){
 const output=resolve(process.argv[2]??"out/spending"),label=process.argv[3]??"current",reports=[];
 await mkdir(output,{recursive:true});
 for(const tariff of [8,12,18,26])for(const managed of [false,true])reports.push(runSpendingScenario(tariff,managed));
 reports.push(runSpendingScenario(12,true,1933,true));
 await writeFile(resolve(output,"customer_spending_"+label+".json"),JSON.stringify(reports,null,2)+"\n");
 for(const row of reports)console.log(JSON.stringify(row));
}
