import test from "node:test";
import assert from "node:assert/strict";
import {createGame,pcPosition,stepGame} from "../dist/js/sim/engine.js";
import {workerRoute} from "../dist/js/sim/workerNavigation.js";
import {BIN_SPOTS,startRepair} from "../dist/js/sim/services.js";
import {buildWall,installInteriorDoor} from "../dist/js/sim/walls.js";
import {furnitureSlots,placeFurniture} from "../dist/js/sim/shop.js";
test("rota de funcionário desvia dos PCs sem passar pelo centro de bancadas",()=>{
 const s=createGame();
 const route=workerRoute(s,{x:7.5,y:5.35},{x:pcPosition(0,s).x+.55,y:pcPosition(0,s).y+.60});
 assert.ok(route?.length);
 for(const p of route)assert.ok(Math.hypot(p.x-pcPosition(0,s).x,p.y-pcPosition(0,s).y)>.35);
});
test("rota inclui acesso às duas lixeiras",()=>{
 const s=createGame();
 for(const spot of BIN_SPOTS)assert.ok(workerRoute(s,{x:7.5,y:5.35},spot)?.length);
});
test("técnico consegue finalizar um reparo após percorrer um caminho",()=>{
 const s=createGame();s.pcWear[0]=60;
 assert.equal(startRepair(s,0).ok,true);
 for(let i=0;i<180&&s.pcWear[0]>0;i++)stepGame(s,1);
 assert.equal(s.pcWear[0],0);
});
