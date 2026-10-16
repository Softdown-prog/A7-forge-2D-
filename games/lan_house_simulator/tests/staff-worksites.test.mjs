import assert from "node:assert/strict";
import test from "node:test";
import {createGame,entrance,pcPosition} from "../dist/js/sim/engine.js";
import {BIN_SPOTS,binSpots,requestCleaning,startRepair,tickServices} from "../dist/js/sim/services.js";
import {technicianWorkPoint,technicianContactPoint,cleanerWorkPoint,workerGroundDistance} from "../dist/js/sim/staffWorksites.js";
import {workerRoute} from "../dist/js/sim/workerNavigation.js";
import {canTraverseLocalStep} from "../dist/js/sim/navigation.js";
import {serializeSave} from "../dist/js/sim/saveTransfer.js";
import {serviceAccessIssues} from "../dist/js/sim/serviceAccess.js";

test("técnico trabalha no corredor, não sobre a mesa nem sobre a cadeira",()=>{
 const s=createGame(452);const p=pcPosition(0,s);
 const foot=technicianWorkPoint(p),contact=technicianContactPoint(p);
 const chair={x:p.x+.35,y:p.y+.82};
 assert.ok(foot.y>=p.y+1.1);
 assert.ok(workerGroundDistance(foot,chair)>.48);
 assert.ok(workerGroundDistance(foot,contact)>.58);
 assert.ok(canTraverseLocalStep(s,foot,contact));
 assert.ok(workerRoute(s,entrance(s),foot));
});
test("posição no piso gira com PCs de todas as quatro direções",()=>{
 const s=createGame(17),pc=pcPosition(1,s);
 const goals=[0,1,2,3].map(rotation=>technicianWorkPoint({...pc,rotation}));
 const center={x:pc.x+.55,y:pc.y+.35};
 for(const v of goals)assert.ok(Math.abs(workerGroundDistance(v,center)-workerGroundDistance(goals[0],center))<1e-8);
 assert.equal(new Set(goals.map(v=>v.x.toFixed(3)+":"+v.y.toFixed(3))).size,4);
});
test("faxineiro para junto à lixeira e não fica dentro dela",()=>{
 const s=createGame(11);s.binFill=[80,20];s.cash=2200;
 assert.equal(requestCleaning(s).ok,true);
 for(let i=0;i<180&&s.cleaningJob?.phase!=="working";i++)tickServices(s);
 assert.equal(s.cleaningJob?.phase,"working");
 const target=binSpots(s)[s.cleaningJob.binIndex];
 const stand=cleanerWorkPoint(target);
 assert.ok(workerGroundDistance(stand,target)>.5);
 assert.ok(workerGroundDistance(s.cleaningJob,stand)<.13);
 assert.ok(canTraverseLocalStep(s,stand,target));
});
test("técnico chega e sai pelo corredor com os pés sempre na mesma âncora",()=>{
 const s=createGame(10);s.cash=3000;s.pcWear=[100,0,0];
 assert.equal(startRepair(s,0).ok,true);
 const goal=technicianWorkPoint(pcPosition(0,s));
 let arrived=false,left=false,finished=false;
 for(let i=0;i<350;i++){
  tickServices(s);
  const job=s.repairJobs?.[0];
  if(job?.phase==="working"){
   arrived=true;
   assert.ok(workerGroundDistance(job,goal)<.13,"não pode teleportar os pés sobre a mesa");
  }
  if(job?.phase==="leaving")left=true;
  if(!job){finished=true;break;}
 }
 assert.ok(arrived&&left&&finished);
 assert.equal(s.pcWear[0],0);
});
test("diagnóstico e save usam a mesma posição de trabalho que a simulação",()=>{
 const s=createGame(1998);s.binFill=[80,0];s.pcWear=[100,0,0];
 const raw=JSON.parse(serializeSave(s)).state;
 const issues=serviceAccessIssues(s);
 assert.deepEqual(issues,[]);
 assert.deepEqual(JSON.parse(serializeSave(s)).state,raw);
 // Uma barreira entre técnico e computador inviabiliza o reparo,
 // mesmo que o corredor do lado de fora continue acessível.
 s.interiorWalls=[{axis:"x",x:2,y:2}];
 const issue=serviceAccessIssues(s).find(x=>x.kind==="pc"&&x.index===0);
 assert.ok(issue);
 assert.match(startRepair(s,0).message,/passagem/);
});
