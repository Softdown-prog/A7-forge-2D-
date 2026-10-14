import assert from "node:assert/strict";
import test from "node:test";
import {createGame,stepGame,pcBroken} from "../dist/js/sim/engine.js";
import {startRepair,pcUnderRepair,addWaste,requestCleaning,BIN_SPOTS} from "../dist/js/sim/services.js";
import {parseImportedSave,serializeSave} from "../dist/js/sim/saveTransfer.js";

test("técnico chega, trabalha 24 minutos e libera PC só ao terminar",()=>{
 const s=createGame();s.pcWear[0]=80;
 const originalCash=s.cash;
 assert.equal(startRepair(s,0).ok,true);
 assert.equal(s.cash,originalCash-76);
 assert.equal(pcBroken(s,0),true);
 assert.equal(pcUnderRepair(s,0),true);
 assert.equal(startRepair(s,0).ok,false);
 stepGame(s,20);
 assert.equal(s.pcWear[0],80);
 assert.equal(pcUnderRepair(s,0),true);
 for(let i=0;i<95 && pcBroken(s,0);i++)stepGame(s,1);
 assert.equal(s.pcWear[0],0);
 assert.equal(pcBroken(s,0),false);
});
test("PC em uso não aceita intervenção simultânea",()=>{
 const s=createGame();s.pcWear[1]=60;
 s.customers.push({id:1,pcIndex:1,stage:"using"});
 const cash=s.cash;
 assert.equal(startRepair(s,1).ok,false);
 assert.equal(s.cash,cash);
});
test("lixeiras acumulam até 100 e faxineiro percorre o salão",()=>{
 const s=createGame();addWaste(s,40);addWaste(s,30);addWaste(s,100);
 assert.deepEqual(s.binFill,[40,100]);
 const cash=s.cash;
 assert.equal(requestCleaning(s).ok,true);
 assert.equal(s.cash,cash-55);
 assert.equal(requestCleaning(s).ok,false);
 for(let i=0;i<130&&s.cleaningJob;i++)stepGame(s,1);
 assert.equal(s.cleaningJob,undefined);
 assert.ok(s.binFill.every(x=>x<5));
});
test("técnico, lixeiras e limpeza sobrevivem ao save",()=>{
 const s=createGame();s.pcWear[2]=40;startRepair(s,2);addWaste(s,30);requestCleaning(s);
 const restored=parseImportedSave(serializeSave(s));
 assert.equal(restored.repairJobs.length,1);
 assert.equal(restored.cleaningJob.phase,"arriving");
 assert.deepEqual(restored.binFill,s.binFill);
 const old=createGame();delete old.repairJobs;delete old.binFill;delete old.cleaningJob;
 assert.equal(pcBroken(old,0),false);
});
test("duas lixeiras estão posicionadas dentro do salão inicial",()=>{
 assert.equal(BIN_SPOTS.length,2);
 assert.ok(BIN_SPOTS.every(p=>p.x>=0&&p.x<=8&&p.y>=0&&p.y<=6));
});
