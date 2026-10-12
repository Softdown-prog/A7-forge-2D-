import assert from "node:assert/strict";
import test from "node:test";
import { createGame, stepGame, online, dayNumber, pcCount } from "../dist/js/sim/engine.js";
import { demandFactor, sessionRevenue, monthlyBills, stockItem, upgradeInternet, expandShop, licenseGames, setHourlyPrice, sellItem } from "../dist/js/sim/economy.js";
test("preço alto reduz procura, rede offline reduz ainda mais",()=>{
  assert.ok(demandFactor(10,75,true,false)>demandFactor(20,75,true,false));
  assert.ok(demandFactor(10,75,true,false)>demandFactor(10,75,false,false));
});
test("sessão de 45 minutos e preços válidos",()=>{
  const s=createGame();
  assert.equal(sessionRevenue(12),9);
  assert.equal(setHourlyPrice(s,50).ok,false);
  assert.equal(setHourlyPrice(s,14).ok,true);
  assert.equal(s.pricePerHour,14);
});
test("estoque consome caixa, venda acrescenta margem",()=>{
  const s=createGame(),balance=s.cash;
  assert.equal(stockItem(s,"soda").ok,true);
  assert.equal(s.cash,balance-40);
  assert.equal(s.inventory.soda,22);
  assert.equal(sellItem(s,"soda").ok,true);
  assert.equal(s.cash,balance-32);
  assert.equal(s.inventory.soda,21);
});
test("compras e expansão alteram sistemas separadamente",()=>{
  const s=createGame();
  assert.equal(licenseGames(s).ok,true);
  assert.equal(s.licensedGames,true);
  assert.equal(upgradeInternet(s).ok,true);
  assert.equal(s.internetTier,2);
  s.cash=1200;
  assert.equal(expandShop(s).ok,true);
  assert.equal(pcCount(s),5);
});
test("mensalidades cobradas sem criar dinheiro",()=>{
  const s=createGame();
  const cost=monthlyBills(s);
  const balance=s.cash;
  for(let n=0;n<30;n++) for(let m=0;m<6;m++) stepGame(s,120);
  assert.equal(dayNumber(s),31);
  assert.ok(s.expenses>=cost);
  assert.ok(Number.isFinite(s.cash));
  assert.notEqual(s.cash,balance);
});
test("clientes são atendidos por máquina de estados",()=>{
  const s=createGame();
  s.customers.push({id:1,x:1.8,y:1.65,stage:"waiting",target:{x:1.8,y:1.65},
    costume:"regular",pcIndex:null,usedMinutes:0,waitingMinutes:0,offlineWait:0,happy:true});
  stepGame(s,1);
  assert.equal(s.served,1);
  assert.equal(s.customers[0]?.stage,"to_pc");
  assert.equal(s.revenue,9);
  s.offlineUntil=s.totalMinutes+10;
  assert.equal(online(s),false);
});

test("rotas usam corredor livre antes do balcão e dos computadores", async () => {
  const { hallwayRoute, computerSeat, AISLE_Y, COUNTER_QUEUE } = await import("../dist/js/sim/route.js");
  const { pcPosition, entrance } = await import("../dist/js/sim/engine.js");
  const s=createGame();
  const from=entrance(s), route=hallwayRoute(from,COUNTER_QUEUE);
  assert.equal(route[0].y,AISLE_Y);
  assert.deepEqual(route.at(-1),COUNTER_QUEUE);
  let point=from;
  for (const waypoint of route) {
    assert.ok(waypoint.x>=0 && waypoint.x<=7 && waypoint.y>=0 && waypoint.y<=6);
    assert.ok(point.x===waypoint.x || point.y===waypoint.y, "segmentos devem percorrer somente os eixos");
    point=waypoint;
  }
  for(let i=0;i<3;i++){
    const seat=computerSeat(pcPosition(i));
    const path=hallwayRoute(COUNTER_QUEUE,seat);
    assert.equal(path[0].y,AISLE_Y);
    assert.deepEqual(path.at(-1),seat);
    assert.ok(seat.y > pcPosition(i).y+0.7, "cadeira fica diante do monitor");
  }
});
test("dois visitantes reservam computadores distintos e sentam antes de usar",()=>{
  const s=createGame(9);
  for(let id=1;id<=2;id++) s.customers.push({
    id,x:1.55,y:2.56,stage:"waiting",target:{x:1.55,y:2.56},
    costume:"regular",pcIndex:null,usedMinutes:0,waitingMinutes:0,offlineWait:0,happy:true
  });
  stepGame(s,1);
  assert.equal(s.served,2);
  assert.deepEqual(s.customers.map(c=>c.pcIndex).sort(),[0,1]);
  const first=s.customers.find(c=>c.id===1);
  assert.ok(first);
  for(let i=0;i<35 && first.stage!=="using";i++) stepGame(s,1);
  assert.equal(first.stage,"using");
  assert.ok(first.route?.length===0);
  assert.equal(first.pcIndex,0);
});
test("cliente termina sessão, levanta e libera a estação",()=>{
  const s=createGame(42);
  const customer={
    id:99,x:2.6,y:3.87,stage:"using",target:{x:2.6,y:3.87},
    costume:"regular",pcIndex:0,usedMinutes:44,waitingMinutes:0,offlineWait:0,happy:true
  };
  s.customers.push(customer);
  stepGame(s,1);
  assert.equal(customer.stage,"standing");
  assert.equal(customer.pcIndex,0);
  stepGame(s,3);
  assert.equal(customer.pcIndex,null);
  assert.ok(customer.stage==="shopping" || customer.stage==="leaving");
});
