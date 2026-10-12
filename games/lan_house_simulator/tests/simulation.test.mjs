import assert from "node:assert/strict";
import test from "node:test";
import { createGame, stepGame, online, dayNumber, pcCount } from "../dist/js/sim/engine.js";
import { demandFactor, sessionRevenue, monthlyBills, stockItem, upgradeInternet, repairInternet, expandShop, licenseGames, setHourlyPrice, sellItem } from "../dist/js/sim/economy.js";
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

test("PCs e cadeiras permanecem dentro das salas em todas as expansões",async()=>{
  const s=createGame();
  const { pcPosition, roomWidth }=await import("../dist/js/sim/engine.js");
  for(let expansion=0;expansion<=2;expansion++){
    s.expansionLevel=expansion;
    for(let i=0;i<pcCount(s);i++){
      const p=pcPosition(i);
      assert.ok(p.x-0.16>=0&&p.x+0.8<roomWidth(s), "mesa "+i+" deve caber na largura");
      assert.ok(p.y-0.2>=0&&p.y+1.1<6, "cadeira "+i+" deve caber no piso");
    }
  }
});

test("paleta de personagens é estável por identidade e independente da animação",async()=>{
  const { actorStyleFor, actorHitbox }=await import("../dist/js/render/actorArt.js");
  const { cameraForRoom,iso }=await import("../dist/js/render/isometric.js");
  assert.deepEqual(actorStyleFor("regular",19),actorStyleFor("regular",19));
  assert.notDeepEqual(actorStyleFor("regular",19),actorStyleFor("regular",20));
  assert.notEqual(actorStyleFor("owner",0).shirt,actorStyleFor("clown",0).shirt);
  assert.notEqual(actorStyleFor("vampire",0).skin,actorStyleFor("stitched-monster",0).skin);
  const camera=cameraForRoom(7),center=iso({x:1.45,y:1.05},camera);
  const box=actorHitbox(camera,1.45,1.05);
  assert.ok(box.x<center.x&&box.x+box.width>center.x);
  assert.ok(box.y<center.y&&box.y+box.height>center.y);
});

test("quatro direções, parada e visão de costas no PC",async()=>{
  const {directionFromDelta,movementDirection,COMPUTER_DIRECTION}=await import("../dist/js/render/direction.js");
  assert.equal(directionFromDelta(1,0),"east");
  assert.equal(directionFromDelta(-1,0),"west");
  assert.equal(directionFromDelta(0,1),"south");
  assert.equal(directionFromDelta(0,-1),"north");
  assert.equal(directionFromDelta(0,0,"west"),"west");
  assert.equal(movementDirection({x:3,y:4},{x:3,y:2}),"north");
  assert.equal(COMPUTER_DIRECTION,"north");
});
test("mesas próximas da parede e cadeiras no corredor interno",async()=>{
  const {pcPosition}=await import("../dist/js/sim/engine.js");
  const {computerSeat,AISLE_Y}=await import("../dist/js/sim/route.js");
  for(let i=0;i<3;i++){
    const p=pcPosition(i),seat=computerSeat(p);
    assert.ok(p.y>=1.3&&p.y<=2.1);
    assert.ok(seat.y<AISLE_Y);
  }
});

test("máquinas compartilham a mesma parede e cliente aguarda diante das vitrines",async()=>{
  const {VENDING_MACHINES,VENDING_WIDTH,VENDING_DEPTH,VENDING_APPROACH}=await import("../dist/js/sim/layout.js");
  const {VENDING_QUEUE,AISLE_Y}=await import("../dist/js/sim/route.js");
  assert.equal(VENDING_MACHINES.length,2);
  assert.equal(VENDING_MACHINES[0].y,VENDING_MACHINES[1].y);
  assert.ok(VENDING_MACHINES[0].x+VENDING_WIDTH<VENDING_MACHINES[1].x);
  assert.deepEqual(VENDING_QUEUE,VENDING_APPROACH);
  assert.ok(VENDING_QUEUE.y>VENDING_MACHINES[0].y+VENDING_DEPTH);
  assert.ok(VENDING_QUEUE.y<AISLE_Y);
  assert.ok(VENDING_QUEUE.x>VENDING_MACHINES[0].x);
  assert.ok(VENDING_QUEUE.x<VENDING_MACHINES[1].x+VENDING_WIDTH);
});
test("fileira de computadores não cruza o corredor nem a profundidade das máquinas",async()=>{
  const {pcPosition}=await import("../dist/js/sim/engine.js");
  const {VENDING_MACHINES,VENDING_DEPTH}=await import("../dist/js/sim/layout.js");
  const {computerSeat,AISLE_Y}=await import("../dist/js/sim/route.js");
  for(let i=0;i<3;i++){
    const p=pcPosition(i);
    assert.ok(p.y-0.18>VENDING_MACHINES[0].y+VENDING_DEPTH);
    assert.ok(computerSeat(p).y<AISLE_Y);
    if(i>0)assert.ok(p.x-pcPosition(i-1).x>0.95);
  }
});

test("reparo emergencial só cobra durante queda e devolve a conexão",()=>{
  const s=createGame();s.totalMinutes=10;
  assert.equal(repairInternet(s).ok,false);
  assert.equal(s.cash,850);
  s.offlineUntil=36;
  const expense=s.expenses;
  assert.equal(repairInternet(s).ok,true);
  assert.equal(s.cash,775);
  assert.equal(s.expenses,expense+75);
  assert.equal(online(s),true);
  assert.equal(repairInternet(s).ok,false);
  assert.equal(s.cash,775);
});
test("reparo de fibra custa mais, sem gerar dinheiro ou alterar upgrades",()=>{
  const s=createGame();s.internetTier=3;s.totalMinutes=15;s.offlineUntil=60;s.cash=20;
  assert.equal(repairInternet(s).ok,false);
  assert.equal(s.offlineUntil,60);
  s.cash=130;
  assert.equal(repairInternet(s).ok,true);
  assert.equal(s.cash,5);
  assert.equal(s.internetTier,3);
  assert.equal(s.offlineUntil,15);
});
