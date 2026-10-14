import assert from "node:assert/strict";
import test from "node:test";
import {createGame,entrance,stepGame,isValidSave} from "../dist/js/sim/engine.js";
import {addWaste,binStatus,binStates,binSpots,requestCleaning} from "../dist/js/sim/services.js";
import {actorStyleFor} from "../dist/js/render/actorArt.js";
import {parseImportedSave,serializeSave} from "../dist/js/sim/saveTransfer.js";

test("lixeira tem estados vazia, enchendo e cheia e nenhum depósito se perde",()=>{
 const s=createGame();
 assert.deepEqual(binStates(s),["empty","empty"]);
 addWaste(s,40);addWaste(s,30);addWaste(s,100);
 assert.deepEqual(s.binFill,[40,100]);
 assert.deepEqual(binStates(s),["filling","full"]);
 assert.equal(binStatus(0),"empty");
 assert.equal(binStatus(99.5),"filling");
 assert.equal(binStatus(100),"full");
 const reputation=s.reputation;
 addWaste(s,200);
 assert.deepEqual(s.binFill,[100,100]);
 assert.deepEqual(binStates(s),["full","full"]);
 assert.equal(s.overflowWaste,140);
 assert.ok(s.reputation<reputation);
 addWaste(s,5);
 assert.equal(s.overflowWaste,145);
 assert.deepEqual(s.binFill,[100,100]);
});

test("faxineiro usa a porta normal, limpa ambas as lixeiras e retorna pela porta",()=>{
 const s=createGame(),door=entrance(s);
 addWaste(s,60);addWaste(s,70);
 const cash=s.cash;
 assert.equal(requestCleaning(s).ok,true);
 assert.equal(s.cash,cash-55);
 assert.deepEqual({x:s.cleaningJob.x,y:s.cleaningJob.y},door);
 assert.equal(s.cleaningJob.facing,"north");
 assert.equal(requestCleaning(s).ok,false);
 let moved=false,worked=false,leaving=false,previous={...door};
 for(let i=0;i<300&&s.cleaningJob;i++){
  stepGame(s,1);
  const j=s.cleaningJob;
  if(j){
   const distance=Math.hypot(j.x-previous.x,j.y-previous.y);
   assert.ok(distance<.41,"faxineiro não deve teletransportar: "+distance);
   if(distance>.01)moved=true;
   if(j.phase==="working")worked=true;
   if(j.phase==="leaving")leaving=true;
   previous={x:j.x,y:j.y};
  }else{
   assert.ok(Math.hypot(previous.x-door.x,previous.y-door.y)<.55,"sai pela soleira");
  }
 }
 assert.equal(s.cleaningJob,undefined,"faxineiro precisa concluir e sair");
 assert.equal(moved,true);
 assert.equal(worked,true);
 assert.equal(leaving,true);
 assert.deepEqual(s.binFill,[0,0]);
 assert.deepEqual(binStates(s),["empty","empty"]);
});

test("lixeiras transbordadas geram lixo no chão que a limpeza remove",()=>{
 const s=createGame();addWaste(s,220);
 assert.deepEqual(s.binFill,[100,100]);
 assert.equal(s.overflowWaste,20);
 assert.equal(requestCleaning(s).ok,true);
 for(let i=0;i<300&&s.cleaningJob;i++)stepGame(s,1);
 assert.equal(s.cleaningJob,undefined);
 assert.equal(s.overflowWaste,0);
 assert.deepEqual(s.binFill,[0,0]);
});

test("apenas lixo no chão ainda permite limpar, sem cobrar duas vezes",()=>{
 const s=createGame();s.binFill=[0,0];s.overflowWaste=4;
 assert.equal(requestCleaning(s).ok,true);
 const after=s.cash;
 assert.equal(requestCleaning(s).ok,false);
 assert.equal(s.cash,after);
 for(let i=0;i<250&&s.cleaningJob;i++)stepGame(s,1);
 assert.equal(s.cleaningJob,undefined);
 assert.equal(s.overflowWaste,0);
});

test("roupas originais do faxineiro e técnico usam o catálogo visual dos atores",()=>{
 const cleaner=actorStyleFor("cleaner",0);
 const technician=actorStyleFor("technician",0);
 const client=actorStyleFor("regular",0);
 assert.notEqual(cleaner.shirt,client.shirt);
 assert.notEqual(technician.shirt,client.shirt);
 assert.notEqual(cleaner.shirt,technician.shirt);
 assert.ok(cleaner.skin.length===7&&cleaner.pants.length===7);
});

test("estado de lixo e direção da caminhada persistem sem invalidar saves antigos",()=>{
 const s=createGame();
 addWaste(s,210);requestCleaning(s);
 for(let i=0;i<4;i++)stepGame(s,1);
 const loaded=parseImportedSave(serializeSave(s));
 assert.equal(isValidSave(loaded),true);
 assert.deepEqual(loaded.binFill,s.binFill);
 assert.equal(loaded.overflowWaste,10);
 assert.ok(["north","south","east","west"].includes(loaded.cleaningJob.facing));
 assert.ok(binSpots(loaded).length===2);
 const legacy=createGame();delete legacy.binFill;delete legacy.overflowWaste;
 assert.equal(isValidSave(legacy),true);
 const bad=parseImportedSave(serializeSave(s));
 bad.overflowWaste=-3;
 assert.equal(isValidSave(bad),false);
});
