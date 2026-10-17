import test from "node:test";
import assert from "node:assert/strict";
import {createGame,stepGame,isValidSave} from "../dist/js/sim/engine.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {INITIAL_CASH,financialSnapshot,monthlyClosingSnapshot,paidMonthlyBillReceipt,validPaidMonthlyBill} from "../dist/js/sim/financialClarity.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {monthlyBills} from "../dist/js/sim/economy.js";

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

test("fechamento em intervalos de 30 dias, sem cobrar caixa antecipadamente",()=>{
 const s=createGame(31,"historical");
 s.cash=386.49;s.energyAccrued=220;
 const before=JSON.stringify(s);
 for(const [day,remaining] of [[1,30],[23,8],[24,7],[29,2],[30,1],[31,30],[60,1],[61,30]]){
  s.totalMinutes=(day-1)*DAY_MINUTES;
  const snap=monthlyClosingSnapshot(s);
  assert.equal(snap.daysRemaining,remaining,"dia "+day);
  assert.equal(snap.provision,monthlyBills(s));
  assert.equal(snap.shortfall,Math.max(0,Math.round((snap.provision-s.cash)*100)/100));
  assert.equal(snap.coversProvision,s.cash>=snap.provision);
  assert.equal(snap.campaignEnding,false);
 }
 s.totalMinutes=0;
 assert.equal(JSON.stringify(s),before,"consulta não realiza cobranças nem muda o save");
});
test("alerta depende de insuficiência real no momento e reconhece fim da campanha",()=>{
 const s=createGame(42,"historical");
 s.totalMinutes=29*DAY_MINUTES;
 s.cash=1;
 const warning=monthlyClosingSnapshot(s);
 assert.equal(warning.daysRemaining,1);
 assert.ok(warning.shortfall>0);
 assert.equal(warning.coversProvision,false);
 s.cash=100000;
 assert.equal(monthlyClosingSnapshot(s).coversProvision,true);
 s.totalMinutes=(33*360-1)*DAY_MINUTES;
 assert.equal(monthlyClosingSnapshot(s).campaignEnding,true);
});

test("fechamento real guarda as cinco parcelas e preserva o caixa cobrado",()=>{
 const s=createGame(13,"historical");
 s.cash=1800;
 s.totalMinutes=30*DAY_MINUTES-1;
 s.energyAccrued=78.5;
 s.employeePayrollAccrued=27.25;
 const bill=monthlyBills({...s,totalMinutes:s.totalMinutes});
 const cashBefore=s.cash,expensesBefore=s.expenses;
 stepGame(s,1);
 const receipt=s.lastPaidMonthlyBill;
 assert.ok(receipt,"comprovante registrado ao entrar no dia 31");
 assert.equal(receipt.endDay,30);
 assert.equal(receipt.total,bill,"nenhum centavo adicional foi cobrado");
 assert.equal(Math.round(s.cash*100),Math.round((cashBefore-bill)*100));
 assert.equal(Math.round(s.expenses*100),Math.round((expensesBefore+bill)*100));
 assert.equal(receipt.cashAfterPayment,s.cash);
 assert.equal(Math.round((receipt.rent+receipt.internet+receipt.energy+
   receipt.maintenance+receipt.wages)*100),Math.round(receipt.total*100));
 assert.equal(s.energyAccrued,0);
 assert.equal(s.employeePayrollAccrued,0);
 assert.equal(isValidSave(s),true);
 assert.deepEqual(parseImportedSave(serializeSave(s)).lastPaidMonthlyBill,receipt);
});
test("comprovante só é substituído no próximo fechamento; saves antigos válidos",()=>{
 const s=createGame(41,"historical");
 assert.equal(validPaidMonthlyBill(undefined,s),true);
 assert.equal(s.lastPaidMonthlyBill,undefined);
 s.totalMinutes=30*DAY_MINUTES-1;s.cash=5000;
 stepGame(s,1);
 const first=structuredClone(s.lastPaidMonthlyBill);
 s.totalMinutes=60*DAY_MINUTES-1;
 assert.deepEqual(s.lastPaidMonthlyBill,first);
 stepGame(s,1);
 assert.equal(s.lastPaidMonthlyBill.endDay,60);
 assert.equal(isValidSave(s),true);
 delete s.lastPaidMonthlyBill;
 assert.equal(isValidSave(parseImportedSave(serializeSave(s))),true);
});
test("comprovantes adulterados e cobrança em data futura são rejeitados",()=>{
 const s=createGame(17,"historical");
 s.totalMinutes=30*DAY_MINUTES-1;s.cash=5000;
 stepGame(s,1);
 const good=structuredClone(s.lastPaidMonthlyBill);
 const invalid=[
  {...good,endDay:31},
  {...good,endDay:60},
  {...good,endDay:-30},
  {...good,total:good.total+1},
  {...good,energy:-0.01},
  {...good,wages:NaN},
  {...good,cashAfterPayment:Infinity},
  "fake bill",null
 ];
 for(const altered of invalid){
  s.lastPaidMonthlyBill=altered;
  assert.equal(validPaidMonthlyBill(altered,s),false);
  assert.equal(isValidSave(s),false);
  assert.throws(()=>serializeSave(s));
 }
 s.lastPaidMonthlyBill=good;
 assert.equal(validPaidMonthlyBill(good,s),true);
});
