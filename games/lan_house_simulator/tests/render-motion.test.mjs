import test from "node:test";
import assert from "node:assert/strict";
import {createGame,stepGame} from "../dist/js/sim/engine.js";
import {SceneMotion} from "../dist/js/render/motion.js";
import {circulationScenario} from "../scripts/circulation_scenario.mjs";
const visitor=(stage="to_pc")=>({id:1,x:2,y:3,stage,pcIndex:0,target:{x:4,y:3},
 costume:"regular",usedMinutes:0,waitingMinutes:0,offlineWait:0,happy:true,poseMinutes:0});

test("posição avança entre minutos sem escrever no estado da simulação",()=>{
 const s=createGame(),motion=new SceneMotion();s.customers=[visitor()];motion.capture(s);
 s.customers[0].x=2.38;s.leftoverMinutes=.5;
 const snapshot=structuredClone(s),frame=motion.sample(s);
 assert.equal(frame.customers[0].x,2.19);assert.equal(frame.customers[0].y,3);
 assert.deepEqual(s,snapshot);assert.notEqual(frame.customers[0],s.customers[0]);
 assert.equal(motion.sample(s,0).customers[0].x,2);
 assert.equal(motion.sample(s,1).customers[0].x,2.38);
});
test("transições de assento e levantar conservam o PC até completar a apresentação",()=>{
 const s=createGame(),motion=new SceneMotion();s.customers=[visitor("sitting")];s.customers[0].poseMinutes=2;
 motion.capture(s);s.customers[0].stage="using";s.customers[0].poseMinutes=0;
 const halfway=motion.sample(s,.5).customers[0];
 assert.equal(halfway.stage,"sitting");assert.equal(halfway.poseMinutes,2.5);assert.equal(halfway.pcIndex,0);
 assert.equal(motion.sample(s,1).customers[0].stage,"using");
 s.customers[0].stage="standing";s.customers[0].poseMinutes=2;motion.capture(s);
 s.customers[0].stage="leaving";s.customers[0].pcIndex=null;s.customers[0].poseMinutes=3;
 assert.equal(motion.sample(s,.5).customers[0].pcIndex,0);
 assert.equal(motion.sample(s,1).customers[0].pcIndex,null);
});
test("reset, entrada e saída não deixam atores fantasmas ou movimento antigo",()=>{
 const s=createGame(),motion=new SceneMotion();s.customers=[visitor()];motion.capture(s);
 s.customers=[];assert.deepEqual(motion.sample(s,.5).customers,[]);
 s.customers=[{...visitor(),id:2,x:7.5,y:5.35}];assert.equal(motion.sample(s,.5).customers[0].x,7.5);
 motion.reset();s.customers[0].x=7;assert.equal(motion.sample(s,.1).customers[0].x,7);
});
test("não interpola um salto de save nem corta uma divisória com a linha visual",()=>{
 const s=createGame(),motion=new SceneMotion();s.customers=[visitor()];motion.capture(s);
 s.customers[0].x=7;assert.equal(motion.sample(s,.5).customers[0].x,7);
 s.customers[0].x=2.9;motion.capture(s);s.interiorWalls=[{axis:"y",x:3,y:3}];s.customers[0].x=3.1;
 assert.equal(motion.sample(s,.5).customers[0].x,3.1);
});
test("nova chegada começa na soleira, não sobre outro cliente no frame anterior",()=>{
 const s=createGame(),motion=new SceneMotion();motion.capture(s);
 s.customers=[{...visitor("arriving"),x:7.5,y:4.97}];
 assert.equal(motion.sample(s,0).customers[0].y,5.35);
 assert.equal(motion.sample(s,.5).customers[0].y,5.16);
 assert.equal(s.customers[0].y,4.97);
});
test("técnico e faxineiro também recebem posição/progresso intermediário",()=>{
 const s=createGame(),motion=new SceneMotion();
 s.repairJobs=[{pc:0,x:3,y:3,phase:"arriving",progress:0,duration:24}];
 s.cleaningJob={x:3,y:4,phase:"working",progress:2};motion.capture(s);
 s.repairJobs[0].x=3.35;s.cleaningJob.progress=3;
 const frame=motion.sample(s,.5);
 assert.equal(frame.repairJobs[0].x,3.175);assert.equal(frame.cleaningJob.progress,2.5);
 assert.equal(s.cleaningJob.progress,3);
});
test("60 apresentações por minuto não alteram a campanha nem o RNG",()=>{
 const a=circulationScenario(),b=structuredClone(a),motion=new SceneMotion();
 for(let minute=0;minute<180;minute++){
  motion.capture(a);stepGame(a,1);stepGame(b,1);
  for(let frame=0;frame<60;frame++)motion.sample(a,frame/60);
  assert.deepEqual(a,b);
 }
});
