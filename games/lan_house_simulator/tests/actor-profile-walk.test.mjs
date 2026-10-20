import test from "node:test";
import assert from "node:assert/strict";
import {profileWalkingStep} from "../dist/js/render/actorArt.js";

test("perfil avança as pernas no eixo do passo, não as abre de frente à câmera",()=>{
 const restNear=profileWalkingStep(0,1),restFar=profileWalkingStep(0,-1);
 const stepNear=profileWalkingStep(1,1),stepFar=profileWalkingStep(1,-1);
 assert.ok(stepNear.toeX>restNear.toeX);
 assert.ok(stepFar.toeX<restFar.toeX);
 assert.ok(stepFar.ankleY<restFar.ankleY,"pé de trás levanta enquanto o outro avança");
 assert.ok(stepNear.kneeX>restNear.kneeX);
 assert.ok(stepFar.kneeX<restFar.kneeX);
});
test("as pernas trocam de função a cada meio passo e mantêm âncoras estáveis",()=>{
 for(const phase of [-1,-0.5,0,0.5,1]){
  const a=profileWalkingStep(phase,-1),b=profileWalkingStep(phase,1);
  assert.equal(a.hipX,-b.hipX);
  for(const value of [...Object.values(a),...Object.values(b)])assert.ok(Number.isFinite(value));
 }
 assert.ok(profileWalkingStep(-1,1).ankleY<profileWalkingStep(0,1).ankleY);
 assert.ok(profileWalkingStep(-1,-1).toeX>profileWalkingStep(0,-1).toeX);
});
