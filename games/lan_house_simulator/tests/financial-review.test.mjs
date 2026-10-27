import test from "node:test";
import assert from "node:assert/strict";
import {createGame,isValidSave,stepGame} from "../dist/js/sim/engine.js";
import {recordComputerUtilization,closeFinancialMonth,computerOccupancyPercent,expansionAdvice} from "../dist/js/sim/financialReview.js";
import {expandShop} from "../dist/js/sim/economy.js";
import {buyComputer} from "../dist/js/sim/shop.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {readFileSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";

test("ocupação conta minutos-PC de verdade, mesmo quando novas estações são compradas",()=>{
 const s=createGame();s.cash=5000;
 s.customers=[{id:1,x:1,y:2,stage:"using",target:{x:1,y:2},pcIndex:0,costume:"regular",usedMinutes:0,waitingMinutes:0,offlineWait:0,happy:true}];
 recordComputerUtilization(s);
 assert.equal(s.monthPcUsedMinutes,1);
 assert.equal(s.monthPcCapacityMinutes,3);
 assert.equal(expandShop(s).ok,true);
 assert.equal(buyComputer(s).ok,true);
 recordComputerUtilization(s);
 assert.equal(s.monthPcUsedMinutes,2);
 assert.equal(s.monthPcCapacityMinutes,7);
 assert.equal(computerOccupancyPercent(2,7),28.6);
 assert.equal(s.revenue,0,"amostragem nunca gera receitas");
});
test("fechamento mensal usa receitas e despesas existentes sem cobranças novas",()=>{
 const s=createGame();s.monthPcUsedMinutes=210;s.monthPcCapacityMinutes=600;
 s.revenue=450;s.expenses=230;s.monthRevenueBase=100;s.monthExpensesBase=50;
 const cash=s.cash;closeFinancialMonth(s);
 assert.equal(s.lastMonthPcUsedMinutes,210);
 assert.equal(s.lastMonthPcCapacityMinutes,600);
 assert.equal(computerOccupancyPercent(s.lastMonthPcUsedMinutes,s.lastMonthPcCapacityMinutes),35);
 assert.equal(s.lastMonthRevenue,350);
 assert.equal(s.lastMonthExpenses,180);
 assert.equal(s.cash,cash);
 assert.equal(s.monthPcUsedMinutes,0);assert.equal(s.monthPcCapacityMinutes,0);
 assert.equal(s.monthRevenueBase,s.revenue);assert.equal(s.monthExpensesBase,s.expenses);
});
test("30 dias de jogo fecham relatório financeiro com conta de luz",()=>{
 const s=createGame();s.cash=10000;s.licensedGames=true;s.pcWindowsLicenses=[true,true,true];
 s.totalMinutes=30*DAY_MINUTES-1;
 s.monthPcUsedMinutes=150;s.monthPcCapacityMinutes=3*(30*DAY_MINUTES-1);
 s.monthRevenueBase=0;s.monthExpensesBase=0;
 s.energyAccrued=86;
 stepGame(s,1);
 assert.equal(s.lastMonthPcUsedMinutes,150);
 assert.equal(s.lastMonthPcCapacityMinutes,30*DAY_MINUTES*3);
 assert.ok((s.lastMonthExpenses??0)>0,"inclui contas no fechamento");
 assert.equal(s.lastMonthRevenue,s.revenue);
 assert.equal(s.lastMonthExpenses,s.expenses);
});
test("aviso de expansão exige amostra antes de declarar capacidade ociosa",()=>{
 const s=createGame();
 assert.match(expansionAdvice(s),/três dias/);
 s.monthPcCapacityMinutes=DAY_MINUTES*3*3;s.monthPcUsedMinutes=500;
 assert.match(expansionAdvice(s),/Capacidade ociosa/);
 s.lastMonthPcCapacityMinutes=1000;s.lastMonthPcUsedMinutes=800;
 assert.match(expansionAdvice(s),/Computadores bastante utilizados/);
 assert.equal(computerOccupancyPercent(0,0),0);
});
test("relatórios sobrevivem save/export, campos antigos permanecem opcionais",()=>{
 const s=createGame();s.monthPcUsedMinutes=300;s.monthPcCapacityMinutes=500;
 const restored=parseImportedSave(serializeSave(s));
 assert.equal(restored.monthPcUsedMinutes,300);
 assert.equal(restored.monthPcCapacityMinutes,500);
 const old=createGame();for(const key of ["monthPcUsedMinutes","monthPcCapacityMinutes","monthRevenueBase","monthExpensesBase"])delete old[key];
 assert.equal(isValidSave(old),true);
 assert.equal(isValidSave({...s,monthPcUsedMinutes:-1}),false);
});
test("indicadores estão visíveis na aba Finanças do jogo",()=>{
 const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
 const html=readFileSync(resolve(root,"index.html"),"utf8");
 const main=readFileSync(resolve(root,"src/main.ts"),"utf8");
 const ui=readFileSync(resolve(root,"src/ui/monthlyFinancePanel.ts"),"utf8");
 for(const id of ["pc-utilization","previous-occupancy","monthly-statement","capacity-advice"]){
  assert.match(html,new RegExp('id="'+id+'"'));
  assert.ok(ui.includes('setText("'+id+'"'));
 }
 assert.match(main,/renderMonthlyFinancePanel\(monthlyFinancePort\.snapshot\(\),setText,document\)/);
});
