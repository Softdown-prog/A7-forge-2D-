import test from "node:test";
import assert from "node:assert/strict";
import {screenViewForMotion} from "../dist/js/render/direction.js";
import {screenWalkingStep} from "../dist/js/render/actorArt.js";
import {iso} from "../dist/js/render/isometric.js";
test("cada eixo do salão se converte na diagonal isométrica correspondente",()=>{
 const camera={originX:0,originY:0,zoom:1};
 for(const [dx,dy,expected] of [[1,0,"front-right"],[0,1,"front-left"],
  [-1,0,"back-left"],[0,-1,"back-right"]]){
  const projected=iso({x:dx,y:dy},camera);
  assert.equal(Math.sign(projected.x),Math.sign(dx-dy));
  assert.equal(Math.sign(projected.y),Math.sign(dx+dy));
  assert.equal(screenViewForMotion(dx,dy),expected);
 }
});
test("desvios diagonais reais distinguem frente, costas e perfil",()=>{
 assert.equal(screenViewForMotion(1,1),"front");
 assert.equal(screenViewForMotion(-1,-1),"back");
 assert.equal(screenViewForMotion(1,-1),"profile-right");
 assert.equal(screenViewForMotion(-1,1),"profile-left");
 assert.equal(screenViewForMotion(0,0,"west"),"back-left");
 assert.equal(screenViewForMotion(0,0,"east"),"front-right");
});
test("pés avançam em 2:1 nas visões de três quartos",()=>{
 for(const view of ["front-left","front-right","back-left","back-right"]){
  const a=screenWalkingStep(0,1,view),b=screenWalkingStep(1,1,view);
  const slope=(b.ankleY-a.ankleY)/(b.toeX-a.toeX);
  assert.ok(Math.abs(slope)>.25&&Math.abs(slope)<.75);
  assert.equal(Math.sign(slope),view.startsWith("back-")?-1:1);
 }
 assert.ok(screenWalkingStep(1,1,"front").ankleY>screenWalkingStep(0,1,"front").ankleY);
 assert.ok(screenWalkingStep(1,1,"back").ankleY<screenWalkingStep(0,1,"back").ankleY);
});
