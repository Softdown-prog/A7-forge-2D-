// Reproduz carga real do motor (fila, anexos, vendas e colisão), sem Canvas.
// Salva amostras por minuto para separar CPU de simulação da rasterização do navegador.
import {performance} from "node:perf_hooks";
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {stepGame,isValidSave} from "../dist/js/sim/engine.js";
import {circulationScenario} from "./circulation_scenario.mjs";

const output=resolve(process.argv[2]??"out/mobile-stability");
await mkdir(output,{recursive:true});
const quantile=(a,p)=>{
 const sorted=[...a].sort((x,y)=>x-y);
 return sorted[Math.min(sorted.length-1,Math.floor(sorted.length*p))]??0;
};
const results=[];
for(const seed of [20,1998,72421]){
 const state=circulationScenario(seed),durations=[],exited=new Set(),occupied=[];
 const initialCash=state.cash,initialRevenue=state.revenue,initialExpenses=state.expenses;
 let maxVisitors=state.customers.length;
 for(let minute=0;minute<360;minute++){
  const before=new Set(state.customers.map(c=>c.id)),t0=performance.now();
  stepGame(state,1);
  durations.push(performance.now()-t0);
  for(const id of before)if(!state.customers.some(c=>c.id===id))exited.add(id);
  occupied.push(state.customers.filter(c=>c.stage==="using").length);
  maxVisitors=Math.max(maxVisitors,state.customers.length);
 }
 if(!isValidSave(state))throw Error("Invalid save after 360-minute crowded scenario, seed "+seed);
 if(state.served<12||exited.size<15)
  throw Error("Low throughput in seed "+seed+": sessions "+state.served+" exits "+exited.size);
 if(Math.abs(state.cash-(initialCash+state.revenue-initialRevenue-(state.expenses-initialExpenses)))>1e-5)
  throw Error("Financial regression in crowded scenario, seed "+seed);
 const value={
  seed,minutes:360,served:state.served,exits:exited.size,purchases:state.purchases,
  peakCustomers:maxVisitors,peakUsing:Math.max(...occupied),
  simulationMeanMs:+(durations.reduce((a,b)=>a+b,0)/durations.length).toFixed(3),
  simulationP95Ms:+quantile(durations,.95).toFixed(3),
  simulationP99Ms:+quantile(durations,.99).toFixed(3),
  simulationMaxMs:+Math.max(...durations).toFixed(3)
 };
 console.log(JSON.stringify(value));results.push(value);
}
await writeFile(resolve(output,"simulation_360_minute_profiles.json"),JSON.stringify(results,null,2)+"\n");
