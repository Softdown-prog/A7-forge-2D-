import test from "node:test";
import assert from "node:assert/strict";
import {createGame,stepGame} from "../dist/js/sim/engine.js";
import {vipArrivalEligible,vipReputationAdjustment} from "../dist/js/sim/vip.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
test("VIP não aparece antes de atingir reputação suficiente",()=>{
 const s=createGame();s.reputation=54;
 for(let i=0;i<150;i++)assert.equal(vipArrivalEligible(s,i),false);
});
test("VIP é determinístico e aumenta a frequência com reputação",()=>{
 const s=createGame();s.reputation=60;
 const baseline=Array.from({length:200},(_,i)=>vipArrivalEligible(s,i)).filter(Boolean).length;
 s.reputation=90;
 const elevated=Array.from({length:200},(_,i)=>vipArrivalEligible(s,i)).filter(Boolean).length;
 assert.ok(elevated>baseline);
 const id=47;assert.equal(vipArrivalEligible(s,id),vipArrivalEligible(s,id));
});
test("clientes VIP são mais exigentes com atraso e valorizam hardware",()=>{
 const c={vip:true,waitingMinutes:1,offlineWait:0};
 assert.ok(vipReputationAdjustment(c,.16)>vipReputationAdjustment(c,0));
 assert.ok(vipReputationAdjustment({...c,waitingMinutes:22,offlineWait:15},0)<0);
 assert.equal(vipReputationAdjustment({...c,vip:false},.16),0);
});
test("perfil VIP persiste no save e campo ausente continua válido",()=>{
 const s=createGame();s.reputation=95;
 for(let i=0;i<220&&s.customers.length===0;i++)stepGame(s,1);
 assert.ok(s.customers.length>0);
 s.customers[0].vip=true;
 assert.equal(parseImportedSave(serializeSave(s)).customers[0].vip,true);
 delete s.customers[0].vip;
 assert.equal(parseImportedSave(serializeSave(s)).customers[0].vip,undefined);
});
