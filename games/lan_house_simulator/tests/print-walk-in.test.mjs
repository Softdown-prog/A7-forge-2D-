import test from "node:test";
import assert from "node:assert/strict";
import {createGame,stepGame,isValidSave,visitorArrivalChance} from "../dist/js/sim/engine.js";
import {buyPrinter,printWalkInDemand,printWalkInDue,servePrinting,pagesPrintedToday,PRINT_PAGES_PER_DAY} from "../dist/js/sim/printService.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {counterQueueSlot} from "../dist/js/sim/checkoutQueue.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";

const nearly=(a,b)=>Math.abs(a-b)<1e-6;

test("visitas de impressão só existem após a compra e preços altos reduzem a procura",()=>{
 const s=createGame(18,"historical");
 assert.equal(printWalkInDemand(s),0);
 for(let minute=1;minute<=800;minute++){s.totalMinutes=minute;assert.equal(printWalkInDue(s),false);}
 s.totalMinutes=0;s.cash=2000;
 assert.equal(buyPrinter(s).ok,true);
 const base=printWalkInDemand(s);
 assert.ok(base>0 && base<.02);
 s.printer.price=20;
 assert.ok(printWalkInDemand(s)<base);
 s.printer.price=1.5;
 s.totalMinutes=DAY_MINUTES-65;assert.equal(printWalkInDue(s),false,"não admitir novas pessoas perto do fechamento");
 s.totalMinutes=0;s.printer.pages=35;s.printer.dayPages=35;
 assert.equal(pagesPrintedToday(s),35);
 assert.equal(printWalkInDemand(s),0);
 assert.equal(printWalkInDue(s),false);
});

test("impressão avulsa no balcão cobra apenas páginas, não reserva PC e persiste sem duplicar",()=>{
 const s=createGame(5,"historical");s.cash=5000;
 buyPrinter(s);s.pcPoweredOff=[true,true,true];
 const start=counterQueueSlot(0,s);
 s.customers=[{id:4,x:start.x,y:start.y,target:{...start},stage:"waiting",queueIndex:0,
  costume:"regular",serviceRequest:"printing",pcIndex:null,usedMinutes:0,waitingMinutes:0,
  offlineWait:0,happy:true,wallet:30}];
 s.nextCustomerId=5;
 const before={cash:s.cash,revenue:s.revenue,expenses:s.expenses,served:s.served,wear:[...s.pcWear]};
 assert.equal(visitorArrivalChance(s,0),0);
 stepGame(s,1);
 assert.equal(s.printer.walkIns,1);
 assert.ok(s.printer.pages>0);
 assert.equal(s.served,before.served,"contador de sessões mantém o significado original");
 assert.equal(s.customers[0].pcIndex,null);
 assert.deepEqual(s.pcWear,before.wear);
 assert.equal(s.paymentEffects.length,1);
 assert.equal(s.paymentEffects[0].amount,s.revenue-before.revenue);
 assert.ok(nearly(s.cash-before.cash,(s.revenue-before.revenue)-(s.expenses-before.expenses)));
 const saved=parseImportedSave(serializeSave(s));
 assert.equal(isValidSave(saved),true);
 assert.equal(saved.printer.walkIns,1);
 assert.equal(saved.customers[0].serviceRequest,"printing");
 assert.equal(saved.customers[0].printChecked,true);
 assert.equal(servePrinting(saved,saved.customers[0]),null);
 stepGame(saved,3);
 assert.equal(saved.printer.walkIns,1,"retomar partida não duplica atendimento");
});

test("impressora esgotada recusa novo pedido sem duplicar receita",()=>{
 const s=createGame(10);s.cash=5000;buyPrinter(s);
 s.printer.dayPages=PRINT_PAGES_PER_DAY;s.printer.pages=PRINT_PAGES_PER_DAY;
 const c={id:66,stage:"waiting",serviceRequest:"printing",wallet:100};
 const totals=[s.cash,s.revenue,s.expenses,s.printer.walkIns??0];
 assert.equal(servePrinting(s,c),null);
 assert.equal(c.printChecked,true);
 assert.deepEqual([s.cash,s.revenue,s.expenses,s.printer.walkIns??0],totals);
 assert.equal(servePrinting(s,c),null);
});

test("visitas sem PC têm fluxo físico determinístico por dois dias, com receita verificável",()=>{
 const s=createGame(31,"historical"),reference=createGame(31,"historical");
 s.cash=5000;reference.cash=5000;
 s.pcPoweredOff=reference.pcPoweredOff=[true,true,true];
 buyPrinter(s);
 for(let i=0;i<DAY_MINUTES*2;i++){stepGame(s,1);stepGame(reference,1);}
 assert.equal(s.rng,reference.rng,"a busca por impressões não consome sorteio de clientes normais");
 assert.equal(s.served,0);
 assert.ok((s.printer.walkIns??0)>0,"clientes exclusivos precisam completar a fila e pagar");
 assert.ok(s.printer.pages>0&&s.printer.pages<=PRINT_PAGES_PER_DAY*2);
 assert.ok(nearly(s.cash-5000,s.revenue-s.expenses));
 assert.deepEqual(s.pcWear,[0,0,0]);
 assert.equal(isValidSave(parseImportedSave(serializeSave(s))),true);
});

test("saves legados e dados avulsos inválidos",()=>{
 const old=createGame(11);
 assert.equal(isValidSave(old),true);
 assert.equal(isValidSave({...old,customers:[{id:7,serviceRequest:"fake",stage:"waiting"}]}),false);
 old.cash=1000;buyPrinter(old);
 assert.equal(isValidSave({...old,printer:{...old.printer,walkIns:-1}}),false);
 assert.equal(isValidSave({...old,printer:{...old.printer,walkIns:1.3}}),false);
 assert.equal(isValidSave({...old,printer:{...old.printer,walkIns:old.printer.pages+1}}),false);
 assert.equal(isValidSave(old),true);
 assert.equal(parseImportedSave(serializeSave(old)).printer.walkIns,undefined);
});
