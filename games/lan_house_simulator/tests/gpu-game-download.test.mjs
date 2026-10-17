import test from "node:test";
import assert from "node:assert/strict";
import {createGame,isValidSave,stepGame,chooseAvailablePc,entrance} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {licenseGames} from "../dist/js/sim/economy.js";
import {buyPlatform} from "../dist/js/sim/hardware.js";
import {buyGpu} from "../dist/js/sim/gpu.js";
import {licenseWindows} from "../dist/js/sim/era.js";
import {toggleStationPower} from "../dist/js/sim/stationPower.js";
import {withStationOff} from "./station-power-fixture.mjs";
import {licenseGpuGame,toggleGpuGameInstallation,gpuGameInstallJob,gpuGamePlayableOnPc,
 gpuGameInstallDuration,gpuGameInstallPausedReason,tickGpuGameInstallations,cancelGpuGameInstallation,
 validGpuGameInstallJobs} from "../dist/js/sim/gpuGames.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
const ok=r=>assert.equal(r.ok,true,r.message);
function ready(){
 const s=createGame(29,"historical");
 s.totalMinutes=7*360*DAY_MINUTES;s.cash=25000;
 ok(licenseGames(s));
 ok(withStationOff(s,0,()=>buyPlatform(s,0,"platform05")));
 ok(withStationOff(s,0,()=>buyGpu(s,0,"gpu05")));
 ok(withStationOff(s,0,()=>licenseWindows(s,0,"winxp")));
 ok(licenseGpuGame(s,"neon-rush"));
 ok(toggleGpuGameInstallation(s,0,"neon-rush"));
 return s;
}
test("download começa em 0%, avança pelo motor e não atende cliente antes de completar",()=>{
 const s=ready(),money=[s.cash,s.expenses,s.rng];
 ok(toggleGpuGameInstallation(s,0,"neon-rush"));
 const job=gpuGameInstallJob(s,0);
 assert.ok(job);assert.equal(job.elapsedMinutes,0);
 assert.equal(job.durationMinutes,gpuGameInstallDuration(s,"neon-rush"));
 assert.equal(gpuGamePlayableOnPc(s,0,"neon-rush"),false);
 const at=entrance(s);
 const customer={id:4,x:at.x,y:at.y,vip:false,gpuGamer:true,preferredGpuGame:"neon-rush"};
 assert.notEqual(chooseAvailablePc(s,customer),0);
 stepGame(s,1);
 assert.equal(gpuGameInstallJob(s,0).elapsedMinutes,1);
 assert.deepEqual([s.cash,s.expenses],money.slice(0,2));
 const cloned=parseImportedSave(serializeSave(s));
 assert.deepEqual(cloned.gpuGameInstallJobs,s.gpuGameInstallJobs);
 // Pausa na queda de internet sem perder progresso.
 s.offlineUntil=s.totalMinutes+100;
 for(let i=0;i<4;i++){s.totalMinutes++;tickGpuGameInstallations(s);}
 assert.equal(gpuGameInstallPausedReason(s,0),"sem internet");
 assert.equal(gpuGameInstallJob(s,0).elapsedMinutes,1);
 s.offlineUntil=s.totalMinutes;
 // Estação desligada também preserva o progresso.
 ok(toggleStationPower(s,0));
 s.totalMinutes++;tickGpuGameInstallations(s);
 assert.equal(gpuGameInstallPausedReason(s,0),"PC desligado");
 assert.equal(gpuGameInstallJob(s,0).elapsedMinutes,1);
 ok(toggleStationPower(s,0));
 for(let i=1;i<job.durationMinutes;i++){s.totalMinutes++;tickGpuGameInstallations(s);}
 assert.equal(gpuGameInstallJob(s,0),undefined);
 assert.equal(gpuGamePlayableOnPc(s,0,"neon-rush"),true);
 assert.equal(isValidSave(parseImportedSave(serializeSave(s))),true);
});
test("cancelar interrompe apenas o download e não remove a licença",()=>{
 const s=ready();
 ok(toggleGpuGameInstallation(s,0,"neon-rush"));
 assert.equal(gpuGameInstallJob(s,0).id,"neon-rush");
 ok(cancelGpuGameInstallation(s,0,"neon-rush"));
 assert.equal(gpuGameInstallJob(s,0),undefined);
 assert.equal(s.licensedGpuGames.includes("neon-rush"),true);
 assert.equal(s.gpuGameInstalls[0].includes("neon-rush"),false);
 assert.equal(cancelGpuGameInstallation(s,0,"neon-rush").ok,false);
 ok(toggleGpuGameInstallation(s,0,"neon-rush"));
 assert.equal(isValidSave(s),true);
});
test("importação rejeita downloads duplicados, títulos não licenciados e progresso fraudado",()=>{
 const s=ready();
 ok(toggleGpuGameInstallation(s,0,"neon-rush"));
 const job={...gpuGameInstallJob(s,0)};
 const bad=[
  [{...job,elapsedMinutes:-1}],
  [{...job,elapsedMinutes:job.durationMinutes}],
  [{...job,durationMinutes:1000}],
  [{...job,id:"jogo-inexistente"}],
  [{...job,id:"arena-do-futuro"}],
  [{...job,pc:99}],
  [job,{...job}],
  [{...job,elapsedMinutes:1.5}]
 ];
 for(const invalid of bad){
  s.gpuGameInstallJobs=invalid;
  assert.equal(validGpuGameInstallJobs(invalid,s),false);
  assert.equal(isValidSave(s),false);
  assert.throws(()=>serializeSave(s));
 }
 s.gpuGameInstallJobs=[job];
 assert.equal(isValidSave(parseImportedSave(serializeSave(s))),true);
});

test("download com hardware incompatível informa pausa e pode ser cancelado",()=>{
 const state=ready();
 ok(toggleGpuGameInstallation(state,0,"neon-rush"));
 const job=gpuGameInstallJob(state,0);
 const cost=state.cash,paid=state.expenses,rng=state.rng;
 // Se o jogador trocar/remover a GPU enquanto o download está ativo,
 // não pode virar instalação concluída por acidente.
 state.pcGpus[0]=null;
 assert.equal(gpuGameInstallPausedReason(state,0),"GPU ou Windows incompatível");
 for(let i=0;i<5;i++){state.totalMinutes++;tickGpuGameInstallations(state);}
 assert.equal(gpuGameInstallJob(state,0).elapsedMinutes,0);
 assert.equal(gpuGamePlayableOnPc(state,0,"neon-rush"),false);
 // A ação de cancelamento não exige compatibilidade nem internet.
 ok(cancelGpuGameInstallation(state,0,"neon-rush"));
 assert.equal(gpuGameInstallJob(state,0),undefined);
 assert.equal(state.licensedGpuGames.includes("neon-rush"),true);
 assert.deepEqual([state.cash,state.expenses,state.rng],[cost,paid,rng]);
});
