import test from "node:test";
import assert from "node:assert/strict";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {licenseGames,expandShop} from "../dist/js/sim/economy.js";
import {buyComputer} from "../dist/js/sim/shop.js";
import {buyPlatform} from "../dist/js/sim/hardware.js";
import {buyGpu} from "../dist/js/sim/gpu.js";
import {licenseWindows} from "../dist/js/sim/era.js";
import {toggleStationPower} from "../dist/js/sim/stationPower.js";
import {withStationOff} from "./station-power-fixture.mjs";
import {licenseGpuGame,toggleGpuGameInstallation,installGpuGameOnAvailablePcs,gpuGameInstalledOnPc,gpuGamePlayableOnPc,gpuGameInstallJob,tickGpuGameInstallations,gpuGameDownloadSlots} from "../dist/js/sim/gpuGames.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";

const ok=r=>assert.equal(r.ok,true,r.message);
function finish(s){
 for(let n=0;s.gpuGameInstallJobs?.length&&n<180;n++){
  s.totalMinutes++;tickGpuGameInstallations(s);
 }
 assert.equal(s.gpuGameInstallJobs?.length??0,0,"downloads concluem dentro do limite da simulação");
}
function setup(){
 const s=createGame(219,"historical");s.totalMinutes=7*360*DAY_MINUTES;s.cash=35000;
 ok(licenseGames(s));
 for(const i of [0,1,2]){
  ok(withStationOff(s,i,()=>buyPlatform(s,i,"platform05")));
  ok(withStationOff(s,i,()=>buyGpu(s,i,"gpu05")));
  ok(withStationOff(s,i,()=>licenseWindows(s,i,"winxp")));
 }
 ok(licenseGpuGame(s,"neon-rush"));
 return s;
}
test("instalação em lote atende PCs livres, ignora ocupados e desligados, sem custo",()=>{
 const s=setup();
 for(const i of [0,1,2])ok(toggleGpuGameInstallation(s,i,"neon-rush"));
 assert.deepEqual(s.gpuGameInstalls,[[],[],[]]);
 ok(toggleStationPower(s,1));
 s.customers=[{pcIndex:2,stage:"using"}];
 const cash=s.cash,expenses=s.expenses,rng=s.rng;
 const result=installGpuGameOnAvailablePcs(s,"neon-rush");
 assert.equal(result.ok,true);
 assert.match(result.message,/1 PC\(s\)/);
 assert.match(result.message,/2 aguardando/);
 assert.deepEqual(s.gpuGameInstalls,[[],[],[]]);
 assert.equal(gpuGameInstallJob(s,0).elapsedMinutes,0);
 assert.deepEqual([s.cash,s.expenses,s.rng],[cash,expenses,rng]);
 assert.deepEqual(parseImportedSave(serializeSave({...s,customers:[]})).gpuGameInstallJobs,s.gpuGameInstallJobs);
 assert.equal(installGpuGameOnAvailablePcs(s,"neon-rush").ok,false);
 s.customers=[];
 ok(toggleStationPower(s,1));
 ok(installGpuGameOnAvailablePcs(s,"neon-rush"));
 assert.deepEqual(s.gpuGameInstalls,[[],[],[]]);
 assert.deepEqual(s.gpuGameInstallJobs.map(x=>x.pc),[0,1,2]);
 finish(s);
 assert.deepEqual(s.gpuGameInstalls,[["neon-rush"],["neon-rush"],["neon-rush"]]);
 assert.equal(installGpuGameOnAvailablePcs(s,"neon-rush").ok,false);
 assert.equal(isValidSave(s),true);
});
test("instalar em estação nova após criar lista explícita não duplica título",()=>{
 const s=setup();
 ok(toggleGpuGameInstallation(s,2,"neon-rush"));
 // Nova estação aparece no salão após uma ampliação: ainda sem jogos instalados.
 ok(expandShop(s));
 s.installedPcs=3;
 const added=buyComputer(s);
 ok(added);
 assert.deepEqual(s.gpuGameInstalls,[["neon-rush"],["neon-rush"],[],[]]);
 ok(withStationOff(s,3,()=>buyPlatform(s,3,"platform05")));
 ok(withStationOff(s,3,()=>buyGpu(s,3,"gpu05")));
 ok(withStationOff(s,3,()=>licenseWindows(s,3,"winxp")));
 assert.equal(gpuGameInstalledOnPc(s,3,"neon-rush"),false);
 ok(toggleGpuGameInstallation(s,3,"neon-rush"));
 assert.deepEqual(s.gpuGameInstalls[3],[]);
 assert.equal(gpuGamePlayableOnPc(s,3,"neon-rush"),false);
 finish(s);
 assert.deepEqual(s.gpuGameInstalls[3],["neon-rush"]);
 assert.equal(gpuGamePlayableOnPc(s,3,"neon-rush"),true);
 assert.deepEqual(parseImportedSave(serializeSave(s)).gpuGameInstalls,s.gpuGameInstalls);
});
test("não aceitar distribuição de jogo inexistente, não licenciado ou antes do modo histórico",()=>{
 const s=setup();
 const before=JSON.stringify(s);
 for(const id of ["arena-do-futuro","jogo-inexistente"]){
  assert.equal(installGpuGameOnAvailablePcs(s,id).ok,false);
 }
 assert.equal(JSON.stringify(s),before);
});

test("banda compartilhada usa rodízio justo e não altera caixa nem sorteios",()=>{
 const s=setup();
 for(const i of [0,1,2])ok(toggleGpuGameInstallation(s,i,"neon-rush"));
 ok(installGpuGameOnAvailablePcs(s,"neon-rush"));
 assert.equal(gpuGameDownloadSlots(s),1);
 const balance=[s.cash,s.expenses,s.rng];
 const advance=(n)=>{
  for(let step=0;step<n;step++){s.totalMinutes++;tickGpuGameInstallations(s);}
 };
 advance(9);
 assert.deepEqual(s.gpuGameInstallJobs.map(x=>x.elapsedMinutes),[3,3,3],
  "três PCs revezam uma conexão discada sem favorecer sempre o primeiro");
 const persisted=parseImportedSave(serializeSave(s));
 assert.deepEqual(persisted.gpuGameInstallJobs,s.gpuGameInstallJobs);
 const before=s.gpuGameInstallJobs.reduce((sum,job)=>sum+job.elapsedMinutes,0);
 s.internetTier=2;
 assert.equal(gpuGameDownloadSlots(s),2);
 advance(6);
 assert.equal(s.gpuGameInstallJobs.reduce((sum,job)=>sum+job.elapsedMinutes,0),before+12,
  "nível 2 permite exatamente duas transferências por minuto");
 const saved=JSON.parse(serializeSave(s));
 assert.deepEqual(parseImportedSave(JSON.stringify(saved)).gpuGameInstallJobs,s.gpuGameInstallJobs);
 s.internetTier=3;
 assert.equal(gpuGameDownloadSlots(s),3);
 const prior=s.gpuGameInstallJobs.reduce((sum,job)=>sum+job.elapsedMinutes,0);
 advance(2);
 assert.equal(s.gpuGameInstallJobs.reduce((sum,job)=>sum+job.elapsedMinutes,0),prior+6);
 assert.deepEqual([s.cash,s.expenses,s.rng],balance);
 finish(s);
 assert.deepEqual(s.gpuGameInstalls,[["neon-rush"],["neon-rush"],["neon-rush"]]);
});
test("downloads pausados liberam a banda; reconexão continua do mesmo progresso",()=>{
 const s=setup();
 for(const i of [0,1,2])ok(toggleGpuGameInstallation(s,i,"neon-rush"));
 ok(installGpuGameOnAvailablePcs(s,"neon-rush"));
 ok(toggleStationPower(s,1));
 const advance=(n)=>{for(let i=0;i<n;i++){s.totalMinutes++;tickGpuGameInstallations(s);}};
 advance(8);
 assert.equal(s.gpuGameInstallJobs[1].elapsedMinutes,0);
 assert.equal(s.gpuGameInstallJobs[0].elapsedMinutes+s.gpuGameInstallJobs[2].elapsedMinutes,8);
 const before=s.gpuGameInstallJobs.map(j=>j.elapsedMinutes);
 s.offlineUntil=s.totalMinutes+6;
 advance(4);
 assert.deepEqual(s.gpuGameInstallJobs.map(j=>j.elapsedMinutes),before);
 s.offlineUntil=s.totalMinutes;
 ok(toggleStationPower(s,1));
 advance(9);
 assert.deepEqual(s.gpuGameInstallJobs.map(j=>j.elapsedMinutes-before[j.pc]),[3,3,3]);
 assert.equal(isValidSave(parseImportedSave(serializeSave(s))),true);
});
