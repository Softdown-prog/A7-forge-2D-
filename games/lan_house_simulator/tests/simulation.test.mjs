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
