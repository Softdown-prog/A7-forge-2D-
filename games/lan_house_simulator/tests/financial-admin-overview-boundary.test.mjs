import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {monthlyBills,energyMonthlyEstimate} from "../dist/js/sim/economy.js";
import {priceIndex} from "../dist/js/sim/historicalEconomy.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {createFinancialAdminOverviewPort} from "../dist/js/application/financialAdminOverviewPort.js";
import {renderFinancialAdminTotals,renderFinancialAdminActivity} from "../dist/js/ui/financialAdminOverviewPanel.js";
const money=n=>"R$ "+n.toLocaleString("pt-BR");
const at=(year=1998,mode="historical")=>{
 const s=createGame(5504,mode);s.totalMinutes=(year-1998)*360*DAY_MINUTES;return s;
};
test("sem lançamentos, a projeção preserva a economia e as frases existentes",()=>{
 const s=at(),before=JSON.stringify(s),v=createFinancialAdminOverviewPort(()=>s).snapshot();
 assert.equal(v.bills,money(monthlyBills(s)));
 assert.equal(v.served,String(s.served+(s.printer?.walkIns??0)+(s.discCopier?.walkIns??0)));
 assert.ok(v.breakdown.startsWith("Contas: aluguel R$ 270 · internet R$ 110"));
 assert.match(v.breakdown,/Diárias cobradas apenas nos dias com atendimento efetivo/);
 assert.equal(v.activity,"Entradas R$ "+s.revenue+" · Saídas R$ "+s.expenses+
  " · Atendimentos "+s.served+" (PCs "+s.served+" · Impressões avulsas 0 · Cópias avulsas 0)");
 assert.equal(JSON.stringify(s),before);
});
test("IPCA anual mantém custos históricos e clássico preserva valores",()=>{
 for(const year of [1998,2001,2005,2025,2030]){
  const s=at(year),old=at(year,"classic");
  const v=createFinancialAdminOverviewPort(()=>s).snapshot();
  const classic=createFinancialAdminOverviewPort(()=>old).snapshot();
  assert.ok(v.breakdown.includes("aluguel "+money(Math.round(270*priceIndex(year)))+
   " · internet "+money(Math.round(110*priceIndex(year)))));
  assert.ok(classic.breakdown.startsWith("Contas: aluguel R$ 270 · internet R$ 110"));
  assert.equal(v.bills,money(monthlyBills(s)));
  assert.equal(classic.bills,money(monthlyBills(old)));
 }
});
test("despesas mostram ampliação, conexão, energia acumulada e salários",()=>{
 const s=at(2005);s.expansionLevel=2;s.internetTier=2;s.energyAccrued=88.6;s.employeePayrollAccrued=25.75;
 const v=createFinancialAdminOverviewPort(()=>s).snapshot(),index=priceIndex(2005);
 for(const [label,value] of [["aluguel",Math.round(610*index)],["internet",Math.round(195*index)],
  ["energia acumulada",89],["manutenção",Math.round(145*index)],["salários acumulados",25.75],
  ["projeção energia/mês",energyMonthlyEstimate(s)]])
  assert.ok(v.breakdown.includes(label+" "+money(value)));
 assert.equal(v.expansion,"Ampliação 2/2");
});
test("distingue atendimentos dos PCs, PlayStation, impressora e copiadora",()=>{
 const s=at();s.served=14;s.ps1Sessions=4;s.printer={walkIns:2};s.discCopier={walkIns:3};
 const v=createFinancialAdminOverviewPort(()=>s).snapshot();
 assert.equal(v.served,"19");
 assert.equal(v.activity,"Entradas R$ "+s.revenue+" · Saídas R$ "+s.expenses+
  " · Atendimentos 19 (PCs 10 · PlayStation 4 · Impressões avulsas 2 · Cópias avulsas 3)");
});
test("sessões antigas de PS1 permanecem no resumo mesmo sem bancadas",()=>{
 const s=at();s.served=7;s.ps1Sessions=2;s.ps1Stations=[];
 assert.match(createFinancialAdminOverviewPort(()=>s).snapshot().activity,/PCs 5 · PlayStation 2/);
});
test("porto lê a partida importada sem alterar a anterior",()=>{
 let s=at(),prior=s,before=JSON.stringify(s);const port=createFinancialAdminOverviewPort(()=>s);
 s=parseImportedSave(serializeSave(s));assert.equal(isValidSave(s),true);
 s.served=22;s.revenue=56;s.expenses=18;
 assert.match(port.snapshot().activity,/Entradas R\$ 56 · Saídas R\$ 18 · Atendimentos 22/);
 assert.equal(JSON.stringify(prior),before);
 s=at(2025);assert.equal(port.snapshot().bills,money(monthlyBills(s)));
});
test("interface usa os IDs originais e só exibe expansão na aba financeira",()=>{
 const entries=[],v=createFinancialAdminOverviewPort(()=>at()).snapshot(),setText=(id,val)=>entries.push([id,val]);
 renderFinancialAdminTotals(v,setText);
 assert.deepEqual(entries.map(x=>x[0]),["admin-bills","admin-served","monthly-breakdown"]);
 renderFinancialAdminActivity(v,setText,false);assert.equal(entries.at(-1)[0],"finance");
 renderFinancialAdminActivity(v,setText,true);
 assert.deepEqual(entries.slice(-2).map(x=>x[0]),["finance","expansion"]);
});
test("UI não depende de simulação nem registra eventos; main mantém painéis",()=>{
 const root=new URL("../src/",import.meta.url);
 const app=readFileSync(new URL("application/financialAdminOverviewPort.ts",root),"utf8");
 const ui=readFileSync(new URL("ui/financialAdminOverviewPanel.ts",root),"utf8");
 const main=readFileSync(new URL("main.ts",root),"utf8");
 assert.doesNotMatch(app,/\b(document|window|HTMLElement)\b/);
 assert.doesNotMatch(ui,/from\s*["']\.\.\/sim\//);
 assert.doesNotMatch(ui,/\bGameState\b|addEventListener/);
 assert.ok(main.includes("createFinancialAdminOverviewPort(()=>game)"));
 assert.ok(main.includes("renderFinancialAdminTotals(financialAdminOverview,setText)"));
 assert.ok(main.includes('renderFinancialAdminActivity(financialAdminOverview,setText,activeAdminTab==="finance")'));
 assert.ok(main.includes("renderFinancialBalance(financialBalancePort.balance(),setText,document)"));
 assert.ok(main.includes("renderMonthlyFinancePanel(monthlyFinancePort.snapshot(),setText,document)"));
});
