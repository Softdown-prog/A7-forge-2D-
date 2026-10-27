import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {financialSnapshot,monthlyClosingSnapshot} from "../dist/js/sim/financialClarity.js";
import {monthlyBills} from "../dist/js/sim/economy.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {GAME_END_DAY} from "../dist/js/sim/mailCalendar.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {createFinancialBalancePort} from "../dist/js/application/financialBalancePort.js";
import {renderFinancialBalance,renderFinancialBillWatch} from "../dist/js/ui/financialBalancePanel.js";
const money=n=>"R$ "+n.toLocaleString("pt-BR");
const currency=n=>n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});

test("demonstrativo concilia receitas, saldo e mensalidade sem alterar o save",()=>{
 const state=createGame(891,"historical");
 state.cash=386.49;state.revenue=900;state.expenses=1363.51;
 const before=JSON.stringify(state),view=createFinancialBalancePort(()=>state).balance();
 const financial=financialSnapshot(state);
 assert.equal(view.cash,money(state.cash));
 assert.equal(view.summary,"Caixa "+money(state.cash)+" · contas/mês "+money(monthlyBills(state)));
 assert.equal(view.profit,money(financial.netResult));
 assert.equal(view.negative,true);
 assert.equal(view.opening,currency(financial.openingCash));
 assert.equal(view.income,currency(financial.income));
 assert.equal(view.outgoing,currency(financial.outgoing));
 assert.equal(view.available,currency(financial.availableCash));
 assert.equal(view.reconciliation,null);
 assert.equal(JSON.stringify(state),before);
});

test("divergência do caixa após importação mostra alerta mas não inventa movimento",()=>{
 const state=createGame(892);
 state.cash=430;state.revenue=200;state.expenses=100;
 const before=JSON.stringify(state),view=createFinancialBalancePort(()=>state).balance();
 assert.equal(view.negative,false);
 assert.equal(view.profit,"R$ 100");
 assert.ok(view.reconciliation.includes(currency(-520)));
 assert.match(view.reconciliation,/Confira o histórico em Finanças/);
 assert.equal(JSON.stringify(state),before);
});

test("aviso de contas acompanha 7 dias, saldo suficiente e fim da campanha",()=>{
 const state=createGame(893,"historical");
 const port=createFinancialBalancePort(()=>state);
 state.cash=0;state.totalMinutes=23*DAY_MINUTES;
 let view=port.billWatch(),closing=monthlyClosingSnapshot(state);
 assert.equal(view.title,"Próximo fechamento em 7 dias do jogo");
 assert.equal(view.status,"Provisão acumulada até agora: "+currency(closing.provision)+
  ". Se a cobrança fosse agora, faltariam "+currency(closing.shortfall)+".");
 assert.equal(view.warning,true);
 state.cash=100000;
 view=port.billWatch();
 assert.match(view.status,/O caixa atual cobre este valor/);
 assert.equal(view.warning,false);
 state.totalMinutes=(GAME_END_DAY-1)*DAY_MINUTES;
 view=port.billWatch();
 assert.equal(view.title,"Calendário encerrando");
 assert.equal(view.warning,false);
 assert.match(view.status,/não há outro fechamento agendado/);
});

test("porta segue partida restaurada sem reter referência ao save anterior",()=>{
 let state=createGame(894,"historical");
 const port=createFinancialBalancePort(()=>state);
 const prior=state,before=JSON.stringify(prior);
 state=parseImportedSave(serializeSave(state));
 state.cash=123;
 assert.equal(port.balance().cash,"R$ 123");
 assert.equal(JSON.stringify(prior),before);
 assert.equal(isValidSave(state),true);
});

test("UI altera somente atributos dos mesmos elementos, inclusive após divergência",()=>{
 const state=createGame(895,"historical"),port=createFinancialBalancePort(()=>state);
 const nodes=new Map();
 const getElementById=id=>{
  if(!nodes.has(id)){
   const classes=new Set();
   nodes.set(id,{hidden:false,textContent:"",classes,
    classList:{toggle(name,active){if(active)classes.add(name);else classes.delete(name);}}});
  }
  return nodes.get(id);
 };
 const doc={getElementById},shown=new Map();
 const update=(id,value)=>shown.set(id,value);
 renderFinancialBalance(port.balance(),update,doc);
 assert.equal(getElementById("balance-reconciliation").hidden,true);
 state.cash=5;state.revenue=900;state.expenses=1100;
 renderFinancialBalance(port.balance(),update,doc);
 assert.equal(getElementById("balance-reconciliation").hidden,false);
 assert.match(getElementById("balance-reconciliation").textContent,/Atenção/);
 assert.equal(getElementById("admin-profit").classes.has("balance-negative"),true);
 renderFinancialBillWatch(port.billWatch(),doc);
 assert.match(getElementById("bill-watch-title").textContent,/fechamento/);
 assert.equal(getElementById("bill-watch"),nodes.get("bill-watch"));
});

test("application sem DOM e UI sem motor: main mantém filtros de abas",()=>{
 const root=new URL("../src/",import.meta.url);
 const app=readFileSync(new URL("application/financialBalancePort.ts",root),"utf8");
 const ui=readFileSync(new URL("ui/financialBalancePanel.ts",root),"utf8");
 const main=readFileSync(new URL("main.ts",root),"utf8");
 assert.doesNotMatch(app,/\b(document|window|HTMLElement|HTMLButtonElement)\b/);
 assert.doesNotMatch(ui,/from\s*["']\.\.\/sim\//);
 assert.doesNotMatch(ui,/replaceChildren|innerHTML/);
 for(const id of ["admin-cash","management-summary-value","admin-profit","balance-opening",
  "balance-income","balance-outgoing","balance-available","balance-reconciliation",
  "bill-watch-title","bill-watch-status","bill-watch"])
  assert.ok(ui.includes('"'+id+'"'));
 assert.ok(main.includes("createFinancialBalancePort(()=>game)"));
 assert.ok(main.includes("renderFinancialBalance(financialBalancePort.balance(),setText,document)"));
 assert.ok(main.includes("renderFinancialBillWatch(financialBalancePort.billWatch(),document)"));
 assert.doesNotMatch(main,/\bfinancialSnapshot\(/);
 assert.doesNotMatch(main,/\bmonthlyClosingSnapshot\(/);
});
