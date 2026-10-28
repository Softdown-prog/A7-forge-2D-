import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame,isValidSave,stepGame} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {gpuDemandReport,recordGpuGameRequest,recordGpuGameSession,validGpuGameDemand,gpuLicenseCoverage} from "../dist/js/sim/gpuDemand.js";
import {parseImportedSave,serializeSave} from "../dist/js/sim/saveTransfer.js";
import {licenseGames} from "../dist/js/sim/economy.js";
import {buyPlatform} from "../dist/js/sim/hardware.js";
import {buyGpu} from "../dist/js/sim/gpu.js";
import {licenseWindows} from "../dist/js/sim/era.js";
import {licenseGpuGame} from "../dist/js/sim/gpuGames.js";
import {withStationOff} from "./station-power-fixture.mjs";

const observed=(s,id)=>gpuDemandReport(s).find(r=>r.id===id);
const accept=(result)=>assert.equal(result.ok,true,result.message);
test("métricas observam pedidos, atendimento e receita premium sem alterar economia ou RNG",()=>{
 const s=createGame(42,"historical");s.totalMinutes=(2005-1998)*360*DAY_MINUTES;
 const before={cash:s.cash,revenue:s.revenue,rng:s.rng,served:s.served};
 recordGpuGameRequest(s,"neon-rush");recordGpuGameRequest(s,"neon-rush");
 recordGpuGameSession(s,"neon-rush",true,.75);
 recordGpuGameSession(s,"neon-rush",false,0);
 assert.deepEqual(observed(s,"neon-rush"),{id:"neon-rush",name:"Neon Rush Online",
  requested:2,played:1,basic:1,withoutSession:0,premiumRevenue:.75});
 assert.deepEqual({cash:s.cash,revenue:s.revenue,rng:s.rng,served:s.served},before);
 assert.deepEqual(parseImportedSave(serializeSave(s)).gpuGameDemand,s.gpuGameDemand);
});
test("pedido já em fila ao importar save é reconciliado no primeiro atendimento",()=>{
 const s=createGame(13,"historical");recordGpuGameSession(s,"neon-rush",false,0);
 assert.equal(observed(s,"neon-rush").requested,1);
 assert.equal(observed(s,"neon-rush").basic,1);
 assert.equal(isValidSave(s),true);
});
test("métricas falsificadas, negativas e incoerentes são rejeitadas",()=>{
 const s=createGame(42,"historical");
 for(const invalid of [
  {"fake":{requested:1,played:0,basic:0,premiumCents:0}},
  {"neon-rush":{requested:1,played:2,basic:0,premiumCents:0}},
  {"neon-rush":{requested:1,played:0,basic:0,premiumCents:-1}},
  {"neon-rush":{requested:1.5,played:0,basic:0,premiumCents:0}}
 ]){
  assert.equal(validGpuGameDemand(invalid),false);
  s.gpuGameDemand=invalid;assert.equal(isValidSave(s),false);
 }
 delete s.gpuGameDemand;assert.equal(isValidSave(s),true);
});
test("clientes reais registram pedidos, uso e cobranças sem sessão artificial",()=>{
 const s=createGame(91,"historical");s.cash=30000;s.totalMinutes=(2005-1998)*360*DAY_MINUTES;
 accept(licenseGames(s));
 accept(withStationOff(s,1,()=>buyPlatform(s,1,"platform05")));
 accept(withStationOff(s,1,()=>buyGpu(s,1,"gpu05")));
 accept(withStationOff(s,1,()=>licenseWindows(s,1,"winxp")));
 accept(licenseGpuGame(s,"neon-rush"));
 for(let i=0;i<4*DAY_MINUTES;i+=120)stepGame(s,120);
 const row=observed(s,"neon-rush");
 assert.ok(row.requested>0);
 assert.ok(row.played>0);
 assert.ok(row.requested>=row.played+row.basic);
 assert.ok(s.served>=row.played+row.basic);
 assert.equal(isValidSave(parseImportedSave(serializeSave(s))),true);
});
test("interface apresenta o histórico real na aba de licenças",()=>{
 const app=readFileSync(new URL("../src/application/gpuGamesCatalogPort.ts",import.meta.url),"utf8");
 assert.match(app,/gpuDemandReport\(game\)/);
 assert.match(app,/observed.premiumRevenue/);
 assert.match(app,/pedidos sem sessão concluída/);
});

test("cobertura da licença usa apenas adicional de cada título e não altera o caixa",()=>{
 const s=createGame(3,"historical");s.totalMinutes=(2013-1998)*360*DAY_MINUTES;
 const cash=s.cash,rng=s.rng;
 assert.equal(gpuLicenseCoverage(s,"neon-rush"),undefined,"sem licença, sem cobertura fictícia");
 s.licensedGames=true;
 s.licensedGpuGames=["neon-rush","circuito-competitivo"];
 assert.deepEqual(gpuLicenseCoverage(s,"neon-rush"),{
  licenseCost:580,premiumRevenue:0,remaining:580,coveragePercent:0,covered:false
 });
 recordGpuGameRequest(s,"neon-rush");
 recordGpuGameSession(s,"neon-rush",true,300);
 let status=gpuLicenseCoverage(s,"neon-rush");
 assert.equal(status.remaining,280);
 assert.equal(status.coveragePercent,51.7);
 assert.equal(status.covered,false);
 recordGpuGameRequest(s,"neon-rush");
 recordGpuGameSession(s,"neon-rush",true,280);
 status=gpuLicenseCoverage(s,"neon-rush");
 assert.equal(status.remaining,0);
 assert.equal(status.coveragePercent,100);
 assert.equal(status.covered,true);
 assert.equal(gpuLicenseCoverage(s,"circuito-competitivo").premiumRevenue,0,
  "adicionais não são atribuídos automaticamente a outro título");
 assert.equal(s.cash,cash);
 assert.equal(s.rng,rng);
 assert.deepEqual(parseImportedSave(serializeSave(s)).gpuGameDemand,s.gpuGameDemand);
});
test("painel não confunde adicional do jogo solicitado com o máximo de outro jogo",()=>{
 const app=readFileSync(new URL("../src/application/gpuGamesCatalogPort.ts",import.meta.url),"utf8");
 assert.match(app,/gpuGameHourlyRate\(game,i,title.id\)/);
 assert.match(app,/gpuLicenseCoverage\(game,title.id\)/);
 assert.match(app,/Não inclui GPU, Windows, energia ou demais despesas; não é lucro/);
});
