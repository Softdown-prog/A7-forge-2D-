import test from "node:test";
import assert from "node:assert/strict";
import {createGame,isValidSave,chooseAvailablePc,entrance} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {licenseGames,sessionRevenue} from "../dist/js/sim/economy.js";
import {buyPlatform} from "../dist/js/sim/hardware.js";
import {buyGpu} from "../dist/js/sim/gpu.js";
import {licenseWindows} from "../dist/js/sim/era.js";
import {toggleStationPower} from "../dist/js/sim/stationPower.js";
import {withStationOff} from "./station-power-fixture.mjs";
import {licenseGpuGame,gpuGamePlayableOnPc,gpuGameInstalledOnPc,toggleGpuGameInstallation,validGpuGameInstalls,gpuGameSessionPrice,hasPlayableGpuGame,tickGpuGameInstallations,gpuGameInstallJob} from "../dist/js/sim/gpuGames.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
const ok=r=>assert.equal(r.ok,true,r.message);
function finish(s,pc){
 const job=gpuGameInstallJob(s,pc);
 assert.ok(job);
 for(let n=0;n<job.durationMinutes;n++){s.totalMinutes++;tickGpuGameInstallations(s);}
}
function ready(year=2005){
 const s=createGame(20,"historical");s.totalMinutes=(year-1998)*360*DAY_MINUTES;s.cash=30000;
 ok(licenseGames(s));
 for(const i of [0,1]){
  ok(withStationOff(s,i,()=>buyPlatform(s,i,"platform05")));
  ok(withStationOff(s,i,()=>buyGpu(s,i,"gpu05")));
  ok(withStationOff(s,i,()=>licenseWindows(s,i,"winxp")));
 }
 ok(licenseGpuGame(s,"neon-rush"));
 return s;
}
test("saves antigos preservam jogos; remover de um PC não afeta os outros nem o caixa",()=>{
 const s=ready(),cash=s.cash,expenses=s.expenses,rng=s.rng;
 assert.equal(s.gpuGameInstalls,undefined);
 assert.ok(gpuGamePlayableOnPc(s,0,"neon-rush")&&gpuGamePlayableOnPc(s,1,"neon-rush"));
 ok(toggleGpuGameInstallation(s,1,"neon-rush"));
 assert.deepEqual(s.gpuGameInstalls,[["neon-rush"],[],["neon-rush"]]);
 assert.equal(gpuGamePlayableOnPc(s,1,"neon-rush"),false);
 assert.equal(gpuGamePlayableOnPc(s,0,"neon-rush"),true);
 assert.equal(hasPlayableGpuGame(s),true);
 assert.equal(gpuGameSessionPrice(s,1,60,true,"neon-rush"),sessionRevenue(s.pricePerHour,60,true));
 assert.equal(s.cash,cash);assert.equal(s.expenses,expenses);assert.equal(s.rng,rng);
 assert.deepEqual(parseImportedSave(serializeSave(s)).gpuGameInstalls,s.gpuGameInstalls);
 ok(toggleGpuGameInstallation(s,1,"neon-rush"));
 assert.equal(gpuGamePlayableOnPc(s,1,"neon-rush"),false);
 assert.equal(gpuGameInstallJob(s,1).elapsedMinutes,0);
 finish(s,1);
 assert.equal(gpuGamePlayableOnPc(s,1,"neon-rush"),true);
});
test("cliente gamer não busca uma estação sem o jogo desejado instalado",()=>{
 const s=ready();ok(toggleGpuGameInstallation(s,0,"neon-rush"));
 const start=entrance(s);
 const gamer={id:4,x:start.x,y:start.y,vip:false,gpuGamer:true,preferredGpuGame:"neon-rush"};
 assert.equal(chooseAvailablePc(s,gamer),1);
 ok(toggleGpuGameInstallation(s,1,"neon-rush"));
 assert.equal(hasPlayableGpuGame(s),false);
 assert.equal(chooseAvailablePc(s,gamer),0,"sem jogo, os PCs continuam aceitando sessões comuns");
 ok(toggleGpuGameInstallation(s,0,"neon-rush"));
 ok(toggleGpuGameInstallation(s,1,"neon-rush"));
 assert.equal(chooseAvailablePc(s,gamer),2,"durante o download, PCs 1 e 2 ficam indisponíveis");
});
test("PC desligado, ocupado ou em manutenção não permite instalação",()=>{
 const s=ready();
 ok(toggleStationPower(s,0));
 const before=JSON.stringify(s);
 assert.equal(toggleGpuGameInstallation(s,0,"neon-rush").ok,false);
 assert.equal(JSON.stringify(s),before);
 ok(toggleStationPower(s,0));
 s.customers=[{pcIndex:0,stage:"using"}];
 assert.equal(toggleGpuGameInstallation(s,0,"neon-rush").ok,false);
 s.customers=[];
 s.repairJobs=[{pc:0,phase:"working"}];
 assert.equal(toggleGpuGameInstallation(s,0,"neon-rush").ok,false);
 s.repairJobs=[];
 assert.equal(toggleGpuGameInstallation(s,0,"arena-do-futuro").ok,false);
});
test("novas licenças e upgrades de GPU exigem PC compatível e instalação explícita",()=>{
 const s=ready(2009);ok(toggleGpuGameInstallation(s,1,"neon-rush"));
 for(const i of [0]){
  ok(withStationOff(s,i,()=>buyPlatform(s,i,"platform08")));
  ok(withStationOff(s,i,()=>buyGpu(s,i,"gpu09")));
  ok(withStationOff(s,i,()=>licenseWindows(s,i,"win7")));
 }
 ok(licenseGpuGame(s,"circuito-competitivo"));
 assert.equal(gpuGameInstalledOnPc(s,0,"circuito-competitivo"),true);
 assert.equal(gpuGameInstalledOnPc(s,1,"circuito-competitivo"),false);
 ok(withStationOff(s,1,()=>buyPlatform(s,1,"platform08")));
 ok(withStationOff(s,1,()=>buyGpu(s,1,"gpu09")));
 ok(withStationOff(s,1,()=>licenseWindows(s,1,"win7")));
 assert.equal(gpuGamePlayableOnPc(s,1,"circuito-competitivo"),false);
 ok(toggleGpuGameInstallation(s,1,"circuito-competitivo"));
 assert.equal(gpuGamePlayableOnPc(s,1,"circuito-competitivo"),false);
 finish(s,1);
 assert.equal(gpuGamePlayableOnPc(s,1,"circuito-competitivo"),true);
 assert.equal(isValidSave(parseImportedSave(serializeSave(s))),true);
});
test("instalações inválidas são rejeitadas, saves antigos permanecem válidos",()=>{
 const s=ready();
 for(const invalid of [
  [["neon-rush","neon-rush"]],
  [["jogo-falso"]],
  [["circuito-competitivo"]],
  [["neon-rush"],[],[],[]],
  [null],
  "neon-rush"
 ]){
  s.gpuGameInstalls=invalid;
  assert.equal(validGpuGameInstalls(invalid,s),false);
  assert.equal(isValidSave(s),false);
  assert.throws(()=>serializeSave(s));
 }
 delete s.gpuGameInstalls;
 assert.equal(isValidSave(parseImportedSave(serializeSave(s))),true);
});
