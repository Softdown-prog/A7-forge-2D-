import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {createMonthlyFinancePort} from "../dist/js/application/monthlyFinancePort.js";
import {renderMonthlyFinancePanel} from "../dist/js/ui/monthlyFinancePanel.js";
const currency=n=>n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});

test("indicadores mensais sem histórico não mudam a partida",()=>{
 const state=createGame(9081,"historical");
 const before=JSON.stringify(state),view=createMonthlyFinancePort(()=>state).snapshot();
 assert.equal(view.utilization,"Ocupação neste mês: 0% dos minutos-PC disponíveis (0/0).");
 assert.equal(view.previousOccupancy,"Ocupação do último mês: sem histórico.");
 assert.match(view.billInfo,/Nenhum fechamento pago/);
 assert.equal(view.receipt,null);
 assert.match(view.statement,/primeiro mês completo/);
 assert.match(view.capacityAdvice,/três dias/);
 assert.equal(JSON.stringify(state),before);
});

test("textos e valores originais, sem arredondar centavos da fatura",()=>{
 const state=createGame(9082,"historical");
 state.monthPcUsedMinutes=2;state.monthPcCapacityMinutes=7;
 state.lastMonthPcUsedMinutes=800;state.lastMonthPcCapacityMinutes=1000;
 state.lastMonthRevenue=400;state.lastMonthExpenses=550.25;
 state.lastPaidMonthlyBill={
  endDay:30,rent:270,internet:110,energy:78.5,
  maintenance:75,wages:27.25,total:560.75,cashAfterPayment:289.25
 };
 const port=createMonthlyFinancePort(()=>state);
 const view=port.snapshot();
 assert.equal(view.utilization,"Ocupação neste mês: 28,6% dos minutos-PC disponíveis (2/7).");
 assert.equal(view.previousOccupancy,"Ocupação do último mês: 80%.");
 assert.equal(view.billInfo,"Último fechamento: mês 01/1998 · pago "+currency(560.75)+
  " · caixa após pagamento "+currency(289.25)+".");
 assert.equal(view.receipt.energy,currency(78.5));
 assert.equal(view.receipt.wages,currency(27.25));
 assert.equal(view.statement,"Fechamento anterior: entradas R$ 400 · saídas R$ 550,25 · resultado R$ -150,25. Inclui investimentos e multas pagos no período.");
 assert.match(view.capacityAdvice,/Computadores bastante utilizados/);
 state.lastPaidMonthlyBill.energy=100;
 assert.equal(view.receipt.energy,currency(78.5));
 assert.equal(port.snapshot().receipt.energy,currency(100));
});

test("a porta acompanha save importado e mantém o anterior intacto",()=>{
 let state=createGame(9083,"historical");
 const port=createMonthlyFinancePort(()=>state),old=state,before=JSON.stringify(state);
 state=parseImportedSave(serializeSave(state));
 state.monthPcCapacityMinutes=100;state.monthPcUsedMinutes=50;
 assert.notEqual(state,old);
 assert.match(port.snapshot().utilization,/50%/);
 assert.equal(JSON.stringify(old),before);
 assert.equal(isValidSave(state),true);
});

test("UI atualiza somente os nós existentes e abre o comprovante quando houver",()=>{
 const state=createGame(9084,"historical"),port=createMonthlyFinancePort(()=>state);
 const info={textContent:"antigo"},details={hidden:false};
 const dom={getElementById:id=>({"last-bill-info":info,"last-bill-details":details})[id]??null};
 const calls=new Map();
 const update=(id,value)=>calls.set(id,value);
 renderMonthlyFinancePanel(port.snapshot(),update,dom);
 assert.equal(details.hidden,true);
 assert.match(info.textContent,/Nenhum fechamento pago/);
 assert.match(calls.get("capacity-advice"),/três dias/);
 assert.equal(calls.has("last-bill-total"),false);
 state.lastPaidMonthlyBill={
  endDay:30,rent:270,internet:110,energy:80,maintenance:75,wages:0,total:535,cashAfterPayment:300
 };
 renderMonthlyFinancePanel(port.snapshot(),update,dom);
 assert.equal(details.hidden,false);
 assert.equal(calls.get("last-bill-total"),currency(535));
 assert.equal(dom.getElementById("last-bill-info"),info);
 assert.equal(dom.getElementById("last-bill-details"),details);
});

test("fronteira separa cálculos de negócio e DOM sem recriar elementos",()=>{
 const root=new URL("../src/",import.meta.url);
 const app=readFileSync(new URL("application/monthlyFinancePort.ts",root),"utf8");
 const ui=readFileSync(new URL("ui/monthlyFinancePanel.ts",root),"utf8");
 const main=readFileSync(new URL("main.ts",root),"utf8");
 const sections=readFileSync(new URL("ui/adminFinanceSections.ts",root),"utf8");
 assert.doesNotMatch(app,/\b(document|window|HTMLElement)\b/);
 assert.doesNotMatch(ui,/from\s*["']\.\.\/sim\//);
 assert.doesNotMatch(ui,/replaceChildren|innerHTML/);
 for(const id of ["pc-utilization","previous-occupancy","last-bill-info","last-bill-details",
  "last-bill-rent","last-bill-internet","last-bill-energy","last-bill-maintenance",
  "last-bill-wages","last-bill-total","monthly-statement","capacity-advice"])
  assert.ok(ui.includes('"'+id+'"'));
 assert.match(main,/createMonthlyFinancePort\(\(\)=>game\)/);
 assert.match(main,/renderAdminFinanceActivity\(\{/);
 assert.match(sections,/renderMonthlyFinancePanel\(options.monthly.snapshot\(\),options.setText,options.doc\)/);
 assert.doesNotMatch(main,/computerOccupancyPercent\(/);
});
