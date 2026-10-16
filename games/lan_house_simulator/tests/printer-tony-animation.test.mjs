import test from "node:test";
import assert from "node:assert/strict";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {buyPrinter,PRINTER_COST,printingAnimationActive,servePrinting} from "../dist/js/sim/printService.js";
import {shopPrice,SHOP_CATALOG} from "../dist/js/sim/shop.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {editableObjects} from "../dist/js/sim/editableObjects.js";

test("impressora de R$ 320 já vendida na loja libera serviço apenas após compra",()=>{
 const s=createGame(23,"historical"),catalog=SHOP_CATALOG.find(i=>i.id==="printer");
 assert.ok(catalog);
 assert.equal(shopPrice(s,"printer"),PRINTER_COST);
 assert.equal(PRINTER_COST,320);
 assert.equal(s.printer,undefined);
 assert.equal(printingAnimationActive(s),false);
 const collision=JSON.stringify(editableObjects(s)),cash=s.cash,expenses=s.expenses;
 assert.equal(buyPrinter(s).ok,true);
 assert.equal(s.cash,cash-320);
 assert.equal(s.expenses,expenses+320);
 assert.ok(s.printer);
 assert.equal(JSON.stringify(editableObjects(s)),collision,"a impressora fica sobre o balcão existente");
 assert.equal(buyPrinter(s).ok,false,"equipamento vendido uma vez");
 assert.equal(printingAnimationActive(s),false,"compra sozinha não anima atendimento");
});
test("Tony reage apenas à impressão realmente paga, sem mexer em RNG e caixa durante animação",()=>{
 const s=createGame(9,"historical");s.cash=1000;buyPrinter(s);
 s.totalMinutes=64;
 const c={id:4,stage:"to_pc",wallet:50};
 const beforeRng=s.rng;
 assert.equal(printingAnimationActive(s),false);
 const sale=servePrinting(s,c);
 assert.ok(sale);
 assert.equal(printingAnimationActive(s),true);
 assert.equal(s.printer.lastPrintedMinute,64);
 assert.equal(s.rng,beforeRng);
 const cash=s.cash,expenses=s.expenses,revenue=s.revenue;
 s.totalMinutes=72;
 assert.equal(printingAnimationActive(s),true);
 s.totalMinutes=73;
 assert.equal(printingAnimationActive(s),false);
 assert.deepEqual([s.cash,s.expenses,s.revenue],[cash,expenses,revenue]);
 assert.equal(isValidSave(s),true);
});
test("evento visual de impressão é persistente, opcional para campanhas antigas e validado",()=>{
 const s=createGame(11);s.cash=2000;buyPrinter(s);
 s.totalMinutes=321;
 assert.equal(servePrinting(s,{id:4,stage:"to_pc",wallet:30})?.pages>0,true);
 const loaded=parseImportedSave(serializeSave(s));
 assert.equal(loaded.printer.lastPrintedMinute,321);
 assert.equal(printingAnimationActive(loaded),true);
 const legacy=createGame(11);legacy.cash=2000;buyPrinter(legacy);
 assert.equal(isValidSave(legacy),true);
 assert.equal(parseImportedSave(serializeSave(legacy)).printer.lastPrintedMinute,undefined);
 for(const invalid of [-1,321.5,322,Number.NaN]){
  const bad=structuredClone(s);
  bad.printer.lastPrintedMinute=invalid;
  assert.equal(isValidSave(bad),false);
 }
});
