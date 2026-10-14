import test from "node:test";
import assert from "node:assert/strict";
import {createGame} from "../dist/js/sim/engine.js";
import {snapshotGameState,serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";

test("save longo descarta efeitos de frame sem perder GPUs, dinheiro ou histórico",()=>{
 const s=createGame(11);
 s.totalMinutes=900*720;
 s.cash=25891;s.revenue=57912;s.expenses=32871;
 s.pcGpus=["gpu09","gpu11","gpu13"];
 s.pcTiers=[2,3,3];
 s.paymentEffects=Array.from({length:5000},(_,i)=>({amount:20,x:i,y:i}));
 s.saleEffects=Array.from({length:5000},()=>({item:"soda",amount:8,x:2,y:3}));
 s.keyboardEffects=Array.from({length:5000},()=>({customerId:11,pcIndex:1}));
 s.speechEffects=Array.from({length:5000},()=>({text:"Mensagem temporária da cena".repeat(13),x:2,y:3,kind:"praise"}));
 assert.ok(JSON.stringify(s).length>2_000_000,"cenário reproduz arquivo excessivo");
 const snapshot=snapshotGameState(s);
 for(const name of ["paymentEffects","saleEffects","keyboardEffects","speechEffects"]){
  assert.equal(Object.hasOwn(snapshot,name),false,name);
  assert.ok(s[name].length>0,"não pode consumir os eventos da interface");
 }
 const serial=serializeSave(s);
 assert.ok(serial.length<2_000_000,"exportação não deve exceder limite");
 const imported=parseImportedSave(serial);
 assert.equal(imported.cash,s.cash);
 assert.equal(imported.revenue,s.revenue);
 assert.equal(imported.expenses,s.expenses);
 assert.deepEqual(imported.pcGpus,s.pcGpus);
 assert.deepEqual(imported.pcTiers,s.pcTiers);
 assert.equal(imported.totalMinutes,s.totalMinutes);
});
test("partidas antigas que contenham efeitos ainda são compatíveis com o importador",()=>{
 const s=createGame(4);
 s.speechEffects=[{text:"olá",x:0,y:0,kind:"praise"}];
 const envelope={format:"softdown-lan-house-save",exportVersion:1,exportedAt:new Date().toISOString(),state:s};
 const loaded=parseImportedSave(JSON.stringify(envelope));
 assert.equal(loaded.speechEffects.length,1);
 assert.equal(snapshotGameState(loaded).speechEffects,undefined);
 assert.ok(serializeSave(loaded));
});
