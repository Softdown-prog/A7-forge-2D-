import test from "node:test";
import assert from "node:assert/strict";
import {createGame} from "../dist/js/sim/engine.js";
import {INITIAL_CASH,financialSnapshot} from "../dist/js/sim/financialClarity.js";

test("capital inicial está sincronizado com criação da partida",()=>{
 const state=createGame();
 assert.equal(state.cash,INITIAL_CASH);
 const result=financialSnapshot(state);
 assert.deepEqual(result,{
  openingCash:850,income:0,outgoing:0,netResult:0,availableCash:850,differenceCents:0
 });
});
test("valores reais da captura: resultado negativo não é um segundo saldo",()=>{
 const state=createGame(99,"historical");
 state.cash=386.49;state.revenue=900;state.expenses=1363.51;
 const before=JSON.stringify(state);
 const result=financialSnapshot(state);
 assert.equal(Math.round(result.netResult*100),-46351);
 assert.equal(Math.round(result.availableCash*100),38649);
 assert.equal(result.differenceCents,0);
 assert.equal(JSON.stringify(state),before,"o painel não muda a economia");
});
test("partida importada com diferença de caixa apresenta alerta, sem inventar lançamentos",()=>{
 const state=createGame(91);
 state.cash=430;state.revenue=200;state.expenses=100;
 const result=financialSnapshot(state);
 assert.equal(result.differenceCents,-52000);
 assert.equal(result.availableCash,430);
 assert.equal(result.netResult,100);
});
