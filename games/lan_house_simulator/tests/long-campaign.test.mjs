import test from "node:test";
import assert from "node:assert/strict";
import {createGame,stepGame,pcCount} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {energyCostPerMinute,monthlyBills} from "../dist/js/sim/economy.js";
import {unreadNotices} from "../dist/js/sim/notices.js";

/** Campaign audit: execute the real simulation minute by minute without browser mocks,
 * cash injections, automatic licensing or synthetic purchases. */
test("campanha de 45 dias mantém contabilidade e indicadores estáveis",()=>{
 const s=createGame(72421),opening=s.cash,monthly=[];
 for(let d=0;d<45;d++){
  for(let m=0;m<DAY_MINUTES;m++)stepGame(s,1);
  assert.ok(Number.isFinite(s.cash),"caixa finito no dia "+(d+1));
  assert.ok(Number.isFinite(s.reputation)&&s.reputation>=10&&s.reputation<=100);
  assert.ok(Number.isFinite(s.energyAccrued)&&s.energyAccrued>=0);
  assert.ok((s.pcWear??[]).every(v=>Number.isFinite(v)&&v>=0&&v<=100));
  assert.ok((s.binFill??[]).every(v=>Number.isFinite(v)&&v>=0&&v<=100));
  assert.ok(unreadNotices(s)<=40);
  assert.equal(s.cash,opening+s.revenue-s.expenses,"balanço contábil dia "+(d+1));
  assert.ok(s.customers.length<=14);
  if((d+1)%15===0)monthly.push({day:d+1,cash:s.cash,revenue:s.revenue,expenses:s.expenses,served:s.served,lost:s.lostCustomers,reputation:s.reputation});
 }
 assert.ok(s.served>0,"deve existir atividade econômica");
 assert.equal(s.copyrightNoticeFine,true);
 assert.equal(s.windowsNoticeFine,true);
 assert.ok(s.notices.some(n=>n.id==="copyright"));
 assert.equal(s.eventLog.filter(msg=>msg.includes("Autuação de direitos autorais")).length<=1,true);
 // After formal notice no further random R$180 piracy penalties.
 const balance=s.cash;
 for(let d=0;d<5;d++)for(let m=0;m<DAY_MINUTES;m++)stepGame(s,1);
 assert.ok(!s.eventLog.some(x=>x.includes("Fiscalização encontrou jogos sem licença")));
 assert.equal(s.cash,opening+s.revenue-s.expenses);
 console.log("CAMPANHA 45 DIAS:",JSON.stringify(monthly),"fim:",JSON.stringify({cash:s.cash,served:s.served,pcCount:pcCount(s)}));
});
test("projeção da energia é estável e aumenta com computadores ocupados",()=>{
 const s=createGame();const standby=energyCostPerMinute(s,0),active=energyCostPerMinute(s,3);
 assert.ok(active>standby);assert.ok(Number.isFinite(monthlyBills(s)));
});
