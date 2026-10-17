import test from "node:test";
import assert from "node:assert/strict";
import {createGame} from "../dist/js/sim/engine.js";
import {parseImportedSave,serializeSave} from "../dist/js/sim/saveTransfer.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";

test("saldo histórico com erro binário ínfimo após milhares de transações importa sem perder valores",()=>{
 const s=createGame(137,"historical");
 s.totalMinutes=(2013-1998)*360*DAY_MINUTES+90*DAY_MINUTES;
 s.cash=94492.13000001055;
 assert.equal(parseImportedSave(serializeSave(s)).cash,s.cash);
 // O testador vê exatamente o mesmo saldo ao salvar e importar.
 assert.equal(Math.round(parseImportedSave(serializeSave(s)).cash*100),9449213);
});
test("salvamento continua recusando frações monetárias reais, preço adulterado e saldo infinito",()=>{
 const s=createGame(137,"historical");
 const invalid=[
  {field:"cash",value:94492.130005},
  {field:"cash",value:94492.135},
  {field:"cash",value:Infinity},
  {field:"pricePerHour",value:2.50001},
  {field:"pricePerHour",value:3.005}
 ];
 for(const {field,value} of invalid){
  const old=s[field];s[field]=value;
  assert.throws(()=>parseImportedSave(serializeSave(s)),/fora dos limites|inválido/,field+" "+value);
  s[field]=old;
 }
});
test("modo clássico mantém exigência de preços e caixa inteiros",()=>{
 const s=createGame(23);
 s.cash=851.001;
 assert.throws(()=>parseImportedSave(serializeSave(s)));
 s.cash=851;
 s.pricePerHour=12.001;
 assert.throws(()=>parseImportedSave(serializeSave(s)));
});
