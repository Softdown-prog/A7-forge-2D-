import test from "node:test";
import assert from "node:assert/strict";
import {createGame,stepGame,isValidSave} from "../dist/js/sim/engine.js";
import {buyDiscCopier,discWalkInDemand,discWalkInDue,discWalkInKind,serveDiscCopy,setDiscCopyPrice,discCopiesToday,DISC_COPIES_PER_DAY} from "../dist/js/sim/discCopy.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {counterQueueSlot} from "../dist/js/sim/checkoutQueue.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
const openIn2001=(s)=>{s.totalMinutes=3*360*DAY_MINUTES; s.cash=10000;};
const purchased=()=>{const s=createGame(23,"historical");openIn2001(s);assert.equal(buyDiscCopier(s).ok,true);return s;};
const close=(a,b)=>Math.abs(a-b)<1e-6;

test("procura avulsa requer compra e 2001, respeita preço, limite, expediente e RNG",()=>{
 const s=createGame(12,"historical");
 assert.equal(discWalkInDemand(s),0);
 s.totalMinutes=3*360*DAY_MINUTES-1;
 assert.equal(discWalkInDue(s),false);
 openIn2001(s);assert.equal(buyDiscCopier(s).ok,true);
 const before=s.rng,low=discWalkInDemand(s);
 assert.ok(low>0&&low<.012);
 setDiscCopyPrice(s,"cd",30);setDiscCopyPrice(s,"dvd",60);
 assert.ok(discWalkInDemand(s)<low);
 for(let i=0;i<500;i++){s.totalMinutes=3*360*DAY_MINUTES+i;discWalkInDue(s);}
 assert.equal(s.rng,before,"o serviço não consome o sorteio de chegadas");
 s.totalMinutes=3*360*DAY_MINUTES+DAY_MINUTES-70;assert.equal(discWalkInDue(s),false);
 s.totalMinutes=3*360*DAY_MINUTES;
 s.discCopier.cdCopies=24;s.discCopier.dayCopies=24;
 assert.equal(discCopiesToday(s),24);assert.equal(discWalkInDemand(s),0);
 assert.equal(discWalkInDue(s),false);
});
test("cópia exclusiva é paga no balcão sem sessão, uso de PC nem cobrança repetida após save",()=>{
 const s=purchased();s.pcPoweredOff=[true,true,true];
 const start=counterQueueSlot(0,s);
 s.customers=[{id:15,x:start.x,y:start.y,target:{...start},stage:"waiting",queueIndex:0,
   costume:"regular",serviceRequest:"disc-copy",wallet:50,pcIndex:null,
   usedMinutes:0,waitingMinutes:0,offlineWait:0,happy:true}];
 s.nextCustomerId=16;
 const old={cash:s.cash,revenue:s.revenue,expenses:s.expenses,served:s.served,rng:s.rng,wear:[...s.pcWear]};
 stepGame(s,1);
 assert.equal(s.discCopier.walkIns,1);
 assert.ok(s.discCopier.cdCopies+s.discCopier.dvdCopies>0);
 assert.equal(s.served,old.served);
 assert.equal(s.customers[0].pcIndex,null);
 assert.deepEqual(s.pcWear,old.wear);
 assert.equal(s.paymentEffects.length,1);
 assert.equal(s.paymentEffects[0].amount,s.revenue-old.revenue);
 assert.ok(close(s.cash-old.cash,(s.revenue-old.revenue)-(s.expenses-old.expenses)));
 const restored=parseImportedSave(serializeSave(s));
 assert.equal(isValidSave(restored),true);
 assert.equal(restored.customers[0].serviceRequest,"disc-copy");
 assert.equal(restored.discCopier.walkIns,1);
 assert.equal(restored.customers[0].discCopyChecked,true);
 assert.equal(serveDiscCopy(restored,restored.customers[0]),null);
 stepGame(restored,3);assert.equal(restored.discCopier.walkIns,1);
});
test("sem mídia/capacidade/caixa não há receita avulsa imaginária",()=>{
 const s=purchased();
 const c={id:15,stage:"waiting",serviceRequest:"disc-copy",wallet:100};
 s.discCopier.cdCopies=24;s.discCopier.dayCopies=24;
 const previous=[s.cash,s.revenue,s.expenses,s.discCopier.walkIns??0];
 assert.equal(serveDiscCopy(s,c),null);
 assert.equal(c.discCopyChecked,true);
 assert.deepEqual([s.cash,s.revenue,s.expenses,s.discCopier.walkIns??0],previous);
 assert.equal(serveDiscCopy(s,c),null);
});
test("sorteio de visitantes avulsos não precisa de computador e respeita histórico",()=>{
 const s=purchased();
 s.pcPoweredOff=[true,true,true];
 const rng=s.rng;
 const found=[];
 for(let i=0;i<DAY_MINUTES;i++){
  s.totalMinutes=3*360*DAY_MINUTES+i;
  if(discWalkInDue(s))found.push(i);
 }
 assert.ok(found.length>0&&found.length<25);
 assert.equal(s.rng,rng);
 const copy=purchased();
 copy.pcPoweredOff=[true,true,true];
 for(let i=0;i<DAY_MINUTES*2;i++)stepGame(copy,1);
 assert.equal(copy.served,0);
 assert.ok((copy.discCopier.walkIns??0)>0,"um cliente avulso precisa alcançar o caixa e pagar");
 assert.ok(copy.discCopier.cdCopies+copy.discCopier.dvdCopies<=2*DISC_COPIES_PER_DAY);
 assert.deepEqual(copy.pcWear,[0,0,0]);
 assert.equal(isValidSave(parseImportedSave(serializeSave(copy))),true);
});
test("saves anteriores continuam válidos; contagem avulsa adulterada é rejeitada",()=>{
 const legacy=createGame(14);
 assert.equal(isValidSave(legacy),true);
 openIn2001(legacy);buyDiscCopier(legacy);
 assert.equal(legacy.discCopier.walkIns,undefined);
 assert.equal(parseImportedSave(serializeSave(legacy)).discCopier.walkIns,undefined);
 assert.equal(isValidSave(legacy),true);
 for(const count of [-1,1.5,NaN,Infinity,1]){
   const bad=structuredClone(legacy);bad.discCopier.walkIns=count;
   assert.equal(isValidSave(bad),false);
 }
 assert.equal(isValidSave({...legacy,customers:[{id:4,stage:"waiting",serviceRequest:"unknown"}]}),false);
 assert.equal(discWalkInKind(15),discWalkInKind(15),"o formato solicitado é determinístico");
});
