import test from "node:test";
import assert from "node:assert/strict";
import {walkingLeg,walkAxis,walkPhase,WALK_CYCLE_DISTANCE} from "../dist/js/render/walkCycle.js";
import {SceneMotion} from "../dist/js/render/motion.js";
import {createGame} from "../dist/js/sim/engine.js";
const views=["front","back","profile-left","profile-right","front-left","front-right","back-left","back-right"];
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);

test("pé de apoio permanece no mesmo ponto do chão nas oito direções",()=>{
 for(const view of views)for(const side of [-1,1]){
  const axis=walkAxis(view),flip=view.endsWith("-left")?-1:1;
  // Each foot supports the body for a different half of the cycle.
  const offset=side===1?0:WALK_CYCLE_DISTANCE/2;
  const samples=[1,4,8,12,17].map(d=>{
   const distance=d+offset,leg=walkingLeg(walkPhase(distance),side,view);
   close(leg.lift,0);
   return {x:flip*(axis.x*distance+leg.toeX),y:axis.y*distance+leg.ankleY};
  });
  for(const p of samples){close(p.x,samples[0].x);close(p.y,samples[0].y);}
 }
});
test("pé suspenso levanta, retorna e pousa sem salto nas oito direções",()=>{
 for(const view of views){
  const start=walkingLeg(walkPhase(20),1,view),mid=walkingLeg(walkPhase(30),1,view);
  assert.ok(mid.lift>5);close(start.lift,0);
  for(const edge of [0,20,40]){
   const a=walkingLeg(walkPhase(edge-1e-6),1,view),b=walkingLeg(walkPhase(edge+1e-6),1,view);
   assert.ok(Math.hypot(a.toeX-b.toeX,a.ankleY-b.ankleY)<.0001);
  }
  assert.deepEqual(walkingLeg(0,1,view,false),walkingLeg(999,1,view,false));
 }
});
const customer=()=>({id:7,x:2,y:3,stage:"to_pc",pcIndex:0,target:{x:4,y:3},
 costume:"regular",usedMinutes:0,waitingMinutes:0,offlineWait:0,happy:true});
test("fase acompanha a distância interpolada e continua entre minutos e curvas",()=>{
 const s=createGame(),m=new SceneMotion();s.customers=[customer()];m.capture(s);
 s.customers[0].x+=.3;
 const snapshot=structuredClone(s);
 const at=t=>m.sample(s,t).customers[0].renderMotion;
 close(at(.5).distance,Math.hypot(.3*64,.3*32)*.5);
 assert.equal(at(0).view,"front-right");assert.equal(at(0).moving,true);
 const end=at(1).distance;m.capture(s);
 s.customers[0].y+=.2;
 close(at(0).distance,end);assert.equal(at(.5).view,"front-left");
 assert.ok(at(.5).distance>end);
 s.customers[0].y-=.2;assert.deepEqual(s,snapshot);
});
test("parar conserva vista e fase, sem animar filas ou saltos de save",()=>{
 const s=createGame(),m=new SceneMotion();s.customers=[customer()];m.capture(s);
 s.customers[0].x+=.2;s.customers[0].y-=.2;
 const end=m.sample(s,1).customers[0].renderMotion;
 assert.equal(end.view,"profile-right");m.capture(s);
 const stopped=m.sample(s,.5).customers[0].renderMotion;
 assert.equal(stopped.view,"profile-right");close(stopped.distance,end.distance);assert.equal(stopped.moving,false);
 s.customers[0].x+=3;
 const teleport=m.sample(s,.5).customers[0].renderMotion;
 assert.equal(teleport.moving,false);close(teleport.distance,end.distance);
 m.reset();close(m.sample(s,.5).customers[0].renderMotion.distance,0);
});
test("primeira passada da soleira continua na captura seguinte sem reiniciar",()=>{
 const s=createGame(),m=new SceneMotion();m.capture(s);
 s.customers=[{...customer(),stage:"arriving",x:7.5,y:4.97}];
 const end=m.sample(s,1).customers[0].renderMotion.distance;
 assert.ok(end>0);m.capture(s);s.customers[0].y-=.2;
 close(m.sample(s,0).customers[0].renderMotion.distance,end);
});
