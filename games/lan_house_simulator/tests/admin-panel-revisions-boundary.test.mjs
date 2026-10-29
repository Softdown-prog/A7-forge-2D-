import {sourceModule,assertCompositionAdaptersExclude} from "./helpers/composition.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createAdminPanelRevisionsPort} from "../dist/js/application/adminPanelRevisionsPort.js";
import {createGame,online} from "../dist/js/sim/engine.js";

function fixture(){
 let state=createGame(7431,"historical");
 const port=createAdminPanelRevisionsPort(()=>state);
 return {port,state:()=>state,swap:next=>{state=next;}};
}
test("feedback mantém exatamente a janela de 720 minutos e a referência",()=>{
 const x=fixture(),s=x.state();
 s.totalMinutes=719;
 assert.deepEqual(x.port.feedback(),[0,s.customerFeedback]);
 assert.equal(x.port.feedback()[1],s.customerFeedback);
 s.totalMinutes=720;
 assert.deepEqual(x.port.feedback(),[1,s.customerFeedback]);
});
test("feedback respeita frações e janelas sucessivas",()=>{
 const x=fixture();x.state().totalMinutes=2161;
 assert.equal(x.port.feedback()[0],3);
});
test("pacotes preservam tarifa e classificação de economia histórica",()=>{
 const x=fixture(),s=x.state();
 assert.deepEqual(x.port.packages(),[s.pricePerHour,s.economyVersion===2]);
 s.economyVersion=1;
 assert.deepEqual(x.port.packages(),[s.pricePerHour,false]);
 s.economyVersion=2;
 assert.deepEqual(x.port.packages(),[s.pricePerHour,true]);
});
test("revisão de pacotes responde a atualização de preço",()=>{
 const x=fixture(),before=x.port.packages()[0];
 x.state().pricePerHour+=3;
 assert.equal(x.port.packages()[0],before+3);
});
test("varejo preserva a mesma referência de preços do save",()=>{
 const x=fixture(),s=x.state();
 assert.deepEqual(x.port.retail(),[s.retailPrices]);
 assert.equal(x.port.retail()[0],s.retailPrices);
});
test("varejo consulta novas referências em cada leitura",()=>{
 const x=fixture(),s=x.state(),before=x.port.retail()[0];
 s.retailPrices={...s.retailPrices};
 assert.equal(x.port.retail()[0],s.retailPrices);
 assert.notEqual(x.port.retail()[0],before);
});
test("desgaste não é lido em páginas que não são operações",()=>{
 const x=fixture();
 assert.equal(x.port.computerWear(false),null);
});
test("desgaste só arredonda nos painéis de operações",()=>{
 const x=fixture();
 x.state().pcWear=[0.49,1.5,2.51];
 assert.deepEqual(x.port.computerWear(true),[0,2,3]);
 assert.deepEqual(x.state().pcWear,[0.49,1.5,2.51]);
});
test("desgaste ausente permanece undefined quando operações está ativo",()=>{
 const x=fixture();x.state().pcWear=undefined;
 assert.equal(x.port.computerWear(true),undefined);
 assert.equal(x.port.computerWear(false),null);
});
test("revisão clássica mantém ordem e campos opcionais",()=>{
 const x=fixture(),s=x.state(),station=[1998,"station"];
 assert.deepEqual(x.port.classicGames(2002,station),
  [2002,station,s.licensedGames,s.licensedEraGames,s.ericSecondMailDelivered]);
 assert.equal(x.port.classicGames(2002,station)[1],station);
});
test("a revisão clássica acompanha a mudança do ano e de licenças",()=>{
 const x=fixture(),s=x.state(),station=[];
 const before=x.port.classicGames(2002,station);
 s.ericSecondMailDelivered=!s.ericSecondMailDelivered;
 const after=x.port.classicGames(2003,station);
 assert.equal(after[0],2003);
 assert.notDeepEqual(after,before);
});
test("revisão de jogos GPU mantém todos os nove campos na mesma ordem",()=>{
 const x=fixture(),s=x.state(),station=[2005];
 assert.deepEqual(x.port.gpuGames(2005,station),[
  2005,station,s.licensedGames,s.licensedGpuGames,s.pcPoweredOff,
  s.gpuGameInstalls,s.gpuGameInstallJobs?.map(j=>[j.pc,j.id,j.durationMinutes]),
  s.gpuGameDemand,online(s)
 ]);
});
test("revisão GPU retém referências vivas de instalação, demanda e energia",()=>{
 const x=fixture(),s=x.state(),revision=x.port.gpuGames(2013,[]);
 assert.equal(revision[4],s.pcPoweredOff);
 assert.equal(revision[5],s.gpuGameInstalls);
 assert.equal(revision[7],s.gpuGameDemand);
});
test("jobs GPU projetam apenas pc, id e duração",()=>{
 const x=fixture();
 x.state().gpuGameInstallJobs=[{pc:2,id:"gpu05",durationMinutes:7,progress:5}];
 assert.deepEqual(x.port.gpuGames(2005,[])[6],[[2,"gpu05",7]]);
});
test("jobs GPU ausentes preservam o valor opcional",()=>{
 const x=fixture();x.state().gpuGameInstallJobs=undefined;
 assert.equal(x.port.gpuGames(2005,[])[6],undefined);
});
test("troca de save afeta todos os snapshots sem recriar porta",()=>{
 const x=fixture(),imported=createGame(6511,"classic");
 imported.pricePerHour+=4;
 imported.totalMinutes=1440;
 x.swap(imported);
 assert.deepEqual(x.port.feedback(),[2,imported.customerFeedback]);
 assert.deepEqual(x.port.packages(),[imported.pricePerHour,imported.economyVersion===2]);
 assert.equal(x.port.retail()[0],imported.retailPrices);
 assert.deepEqual(x.port.classicGames(2000,[]),
  [2000,[],imported.licensedGames,imported.licensedEraGames,imported.ericSecondMailDelivered]);
 assert.equal(x.port.gpuGames(2000,[])[7],imported.gpuGameDemand);
});
test("snapshots não alteram o save nem o RNG",()=>{
 const x=fixture(),before=JSON.stringify(x.state());
 x.port.feedback();x.port.packages();x.port.retail();x.port.computerWear(true);
 x.port.classicGames(2002,[]);x.port.gpuGames(2013,[]);
 assert.equal(JSON.stringify(x.state()),before);
});
test("a porta não manipula DOM, persistência, temporizadores ou gameplay",()=>{
 const text=readFileSync(new URL("../src/application/adminPanelRevisionsPort.ts",import.meta.url),"utf8");
 for(const forbidden of ["document","HTMLElement","localStorage","setInterval","requestAnimationFrame","stepGame","saveGame","applyResult"])
  assert.equal(text.includes(forbidden),false,forbidden);
});
test("a composição do main usa a porta sem duplicar cálculo de revisões",()=>{
 assert.ok(sourceModule("application/gamePorts.ts").includes("createAdminPanelRevisionsPort(getState)"));
 for(const method of ["feedback()","packages()","retail()","computerMaintenance(","classicGames(year,stationRevision)","gpuGames(year,stationRevision)"])
  assert.ok(sourceModule("ui/gamePanels.ts").includes("adminPanelRevisionsPort."+method),method);
 const port=readFileSync(new URL("../src/application/adminPanelRevisionsPort.ts",import.meta.url),"utf8");
 assert.ok(port.includes("this.computerWear(operationsActive)"));
 assertCompositionAdaptersExclude("Math.floor(game.totalMinutes/720),game.customerFeedback");
 assertCompositionAdaptersExclude("game.gpuGameInstallJobs?.map");
 assertCompositionAdaptersExclude("game.pcWear?.map(Math.round)");
});
