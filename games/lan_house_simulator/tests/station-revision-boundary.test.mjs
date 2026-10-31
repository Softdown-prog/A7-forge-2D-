import {sourceModule,assertCompositionAdaptersExclude} from "./helpers/composition.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createStationRevisionPort} from "../dist/js/application/stationRevisionPort.js";
import {createGame,pcCount} from "../dist/js/sim/engine.js";
import {stationOccupied} from "../dist/js/sim/computerModels.js";

function fixture(){
 let state=createGame(9731,"historical");
 const port=createStationRevisionPort(()=>state);
 return {port,state:()=>state,swap:next=>{state=next;}};
}
test("devolve os campos do painel em ordem e sem modificações",()=>{
 const x=fixture(),s=x.state(),year=2005,v=x.port.snapshot(year);
 assert.deepEqual(v,[
  year,s.cash,s.economyVersion,s.pcTiers,s.pcWindows,s.pcWindowsLicenses,
  s.pcPoweredOff,s.pcGpus,s.pcLcdModels,s.pcComponents,
  s.pcLinuxInstalled,s.pcOperatingSystems,s.linuxResearchStartedDay,Math.floor(s.totalMinutes/720),
  Array.from({length:pcCount(s)},(_,i)=>stationOccupied(s,i)),
  s.repairJobs?.map(j=>[j.pc,j.phase,Math.floor(j.progress/j.duration*4)])
 ]);
});
test("mantém doze posições anteriores e acrescenta quatro campos do Linux",()=>{
 const x=fixture();assert.equal(x.port.snapshot(1998).length,16);
});
test("ano de revisão é o ano fornecido pela interface",()=>{
 const x=fixture();assert.equal(x.port.snapshot(2004)[0],2004);
 assert.equal(x.port.snapshot(2005)[0],2005);
});
test("uma alteração de caixa fica visível no próximo snapshot",()=>{
 const x=fixture();const before=x.port.snapshot(1998);
 x.state().cash+=25;assert.equal(x.port.snapshot(1998)[1],before[1]+25);
});
test("a revisão preserva a referência real para tiers do jogo",()=>{
 const x=fixture(),s=x.state();assert.equal(x.port.snapshot(2000)[3],s.pcTiers);
});
test("a revisão preserva referências de licenças Windows",()=>{
 const x=fixture(),s=x.state();assert.equal(x.port.snapshot(2000)[5],s.pcWindowsLicenses);
});
test("a revisão preserva referências de GPUs",()=>{
 const x=fixture(),s=x.state();assert.equal(x.port.snapshot(2000)[7],s.pcGpus);
});
test("a revisão preserva referências de modelos LCD",()=>{
 const x=fixture(),s=x.state();assert.equal(x.port.snapshot(2000)[8],s.pcLcdModels);
});
test("a revisão preserva referências de componentes",()=>{
 const x=fixture(),s=x.state();assert.equal(x.port.snapshot(2000)[9],s.pcComponents);
});
test("ocupação usa exatamente o número real de estações",()=>{
 const x=fixture(),v=x.port.snapshot(2000);
 assert.equal(v[14].length,pcCount(x.state()));
});
test("cliente usando estação altera a revisão de ocupação",()=>{
 const x=fixture(),s=x.state();
 assert.equal(x.port.snapshot(2000)[14][0],false);
 s.customers.push({pcIndex:0,stage:"using"});
 assert.equal(x.port.snapshot(2000)[14][0],true);
});
test("cliente fora da estação deixa ocupação livre",()=>{
 const x=fixture(),s=x.state();
 s.customers.push({pcIndex:0,stage:"leaving"});
 assert.equal(x.port.snapshot(2000)[14][0],false);
});
test("fase e quartil de progresso de manutenção compõem revisão",()=>{
 const x=fixture();
 x.state().repairJobs=[{pc:0,phase:"fixing",progress:3,duration:8}];
 assert.deepEqual(x.port.snapshot(2000)[15],[[0,"fixing",1]]);
});
test("fases diferentes de reparo resultam em revisões diferentes",()=>{
 const x=fixture();
 x.state().repairJobs=[{pc:0,phase:"walking",progress:0,duration:8}];
 const before=JSON.stringify(x.port.snapshot(2000));
 x.state().repairJobs[0].phase="fixing";
 assert.notEqual(JSON.stringify(x.port.snapshot(2000)),before);
});
test("ausência de reparos preserva comportamento opcional",()=>{
 const x=fixture();x.state().repairJobs=undefined;
 assert.equal(x.port.snapshot(2000)[15],undefined);
});
test("troca de save é consultada na próxima chamada",()=>{
 const x=fixture();const previous=x.port.snapshot(2000);
 const imported=createGame(6511,"historical");imported.cash+=999;
 x.swap(imported);assert.equal(x.port.snapshot(2000)[1],imported.cash);
 assert.notEqual(x.port.snapshot(2000)[1],previous[1]);
});
test("o snapshot nunca altera a partida nem RNG",()=>{
 const x=fixture(),before=JSON.stringify(x.state());
 x.port.snapshot(2000);x.port.snapshot(2000);
 assert.equal(JSON.stringify(x.state()),before);
});
test("o aplicativo não contém DOM, timers ou escrita no save",()=>{
 const source=readFileSync(new URL("../src/application/stationRevisionPort.ts",import.meta.url),"utf8");
 for(const term of ["document","window","HTMLElement","localStorage","setInterval","requestAnimationFrame"])assert.equal(source.includes(term),false);
 for(const term of ["stepGame","applyResult","saveGame"])assert.equal(source.includes(term),false);
});
test("o main injeta o save atual e utiliza snapshot nos dois painéis",()=>{
 assert.ok(sourceModule("application/gamePorts.ts").includes("createStationRevisionPort(getState)"));
 assert.ok(sourceModule("ui/gamePanels.ts").includes("const stationRevision=stationRevisionPort.snapshot(year);"));
 assert.ok(sourceModule("ui/gamePanels.ts").includes("maintenanceChanged:()=>panelChanged"));
 assert.ok(sourceModule("ui/gamePanels.ts").includes("gpuChanged:()=>panelChanged"));
 assertCompositionAdaptersExclude("stationOccupied(game,i)");
});
