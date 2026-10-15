import test from "node:test";
import assert from "node:assert/strict";
import {createGame,stepGame,isValidSave} from "../dist/js/sim/engine.js";
import {buyPrinter,quotePrinter,servePrinting,setPrintPrice,printPaperInkCost,pagesPrintedToday,PRINT_PAGES_PER_DAY} from "../dist/js/sim/printService.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {editableObjects} from "../dist/js/sim/editableObjects.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
const customer=id=>({id,stage:"to_pc",wallet:30});
test("impressora é compra única, cobra o equipamento e não interfere nas posições do salão",()=>{
 const s=createGame();s.cash=319;assert.equal(quotePrinter(s).ok,false);
 const before=JSON.stringify(s),layout=JSON.stringify(editableObjects(s));
 assert.equal(buyPrinter(s).ok,false);assert.equal(JSON.stringify(s),before);
 s.cash=1000;const oldCash=s.cash,oldExpenses=s.expenses;
 assert.equal(buyPrinter(s).ok,true);assert.equal(s.cash,oldCash-320);
 assert.equal(s.expenses,oldExpenses+320);assert.equal(JSON.stringify(editableObjects(s)),layout);
 const purchased=JSON.stringify(s);
 assert.equal(buyPrinter(s).ok,false);assert.equal(JSON.stringify(s),purchased);
});
test("pedidos usam orçamento, custo por página, limite diário e persistem sem RNG",()=>{
 for(const mode of ["classic","historical"]){
  const s=createGame(15,mode);s.cash=10000;buyPrinter(s);
  const before={cash:s.cash,revenue:s.revenue,expenses:s.expenses,rng:s.rng};
  let gross=0,materials=0;const checked=[];
  for(let id=1;id<=400;id++){
   const c=customer(id),sale=servePrinting(s,c);
   if(!sale)continue;
   checked.push(c);gross+=sale.revenue;materials+=sale.cost;
   assert.equal(sale.revenue,sale.pages*s.printer.price);
   assert.equal(sale.cost,sale.pages*printPaperInkCost(s));
   assert.equal(servePrinting(s,c),null);
  }
  assert.equal(s.printer.dayPages,PRINT_PAGES_PER_DAY);
  assert.ok(checked.length>0);assert.equal(s.cash-before.cash,gross-materials);
  assert.equal(s.revenue-before.revenue,gross);
  assert.equal(s.expenses-before.expenses,materials);
  assert.equal(s.rng,before.rng);
  s.totalMinutes+=DAY_MINUTES;assert.equal(pagesPrintedToday(s),0);
  for(let id=401;id<=700;id++)servePrinting(s,customer(id));
  assert.ok(pagesPrintedToday(s)>0);
 }
});
test("serviço indisponível não produz receita nem venda repetida, preço alto reduz demanda",()=>{
 const s=createGame();const before=JSON.stringify(s);
 assert.equal(servePrinting(s,customer(1)),null);assert.equal(JSON.stringify(s),before);
 s.cash=20000;buyPrinter(s);
 for(let i=1;i<200;i++)assert.equal(servePrinting(s,{...customer(i),wallet:0}),null);
 assert.equal(servePrinting(s,{...customer(1),stage:"using"}),null);
 const low=createGame(),high=createGame();low.cash=high.cash=20000;buyPrinter(low);buyPrinter(high);
 setPrintPrice(high,12);
 let lows=0,highs=0;
 for(let id=1;id<=500;id++){low.totalMinutes+=DAY_MINUTES;high.totalMinutes+=DAY_MINUTES;lows+=!!servePrinting(low,customer(id));highs+=!!servePrinting(high,customer(id));}
 assert.ok(lows>highs);
 const unchanged=JSON.stringify(s);
 for(const price of [0,.25,20.5,NaN,Infinity,3.25])assert.equal(setPrintPrice(s,price).ok,false);
 assert.equal(JSON.stringify(s),unchanged);
});
test("save mantém serviço, idempotência e rejeita estado adulterado",()=>{
 const s=createGame();s.cash=2000;buyPrinter(s);
 s.customers=[{...customer(4),x:1,y:2,target:{x:2,y:2},costume:"regular",pcIndex:0,usedMinutes:0,waitingMinutes:0,offlineWait:0,happy:true}];
 servePrinting(s,s.customers[0]);
 const recovered=parseImportedSave(serializeSave(s));
 assert.deepEqual(recovered.printer,s.printer);
 assert.equal(servePrinting(recovered,recovered.customers[0]),null);
 const legacy=createGame();assert.equal(isValidSave(legacy),true);
 for(const change of [{price:0},{dayPages:36},{pages:-1},{revenue:NaN},{day:999999999}]){
  const bad=structuredClone(s);Object.assign(bad.printer,change);assert.equal(isValidSave(bad),false);
 }
 const badCustomer=structuredClone(s);badCustomer.customers=[{...s.customers[0],printChecked:"yes"}];assert.equal(isValidSave(badCustomer),false);
});
test("motor contabiliza impressão de cliente real no caixa e no pagamento visual",()=>{
 const s=createGame();s.cash=5000;buyPrinter(s);
 s.customers=[{id:4,x:1.55,y:2.56,stage:"waiting",target:{x:1.55,y:2.56},costume:"regular",pcIndex:null,usedMinutes:0,waitingMinutes:0,offlineWait:0,happy:true,wallet:30}];
 const before={revenue:s.revenue,expenses:s.expenses,cash:s.cash};
 stepGame(s,1);
 assert.equal(s.served,1);assert.ok(s.printer.pages>0,"cliente deve fazer pedido de impressão");assert.equal(s.paymentEffects.length,1);
 assert.equal(s.paymentEffects[0].amount,s.revenue-before.revenue);
 assert.equal(s.cash-before.cash,s.revenue-before.revenue-(s.expenses-before.expenses));
 assert.equal(isValidSave(s),true);
});
