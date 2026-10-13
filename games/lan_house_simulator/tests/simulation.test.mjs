import assert from "node:assert/strict";
import test from "node:test";
import { createGame, stepGame, online, dayNumber, pcCount, pcWear, pcBroken } from "../dist/js/sim/engine.js";
import { customerSatisfactionDelta, contractSupplier, supplierLevel, wholesaleCost, demandFactor, sessionRevenue, monthlyBills, stockItem, upgradeInternet, repairInternet, repairComputer, expandShop, licenseGames, setHourlyPrice, sellItem } from "../dist/js/sim/economy.js";
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
  const { pcPosition, entrance, roomWidth } = await import("../dist/js/sim/engine.js");
  const s=createGame();
  const from=entrance(s), route=hallwayRoute(from,COUNTER_QUEUE);
  assert.equal(route[0].y,AISLE_Y);
  assert.deepEqual(route.at(-1),COUNTER_QUEUE);
  let point=from;
  for (const waypoint of route) {
    assert.ok(waypoint.x>=0 && waypoint.x<=roomWidth(s) && waypoint.y>=0 && waypoint.y<=6);
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
    assert.ok(p.y>=1.0&&p.y<=2.1, "PC deve permanecer junto à parede traseira");
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

test("fornecedor parceiro exige investimento e aplica desconto só em novas compras",()=>{
  const s=createGame();
  assert.equal(supplierLevel(s),1);
  assert.equal(wholesaleCost(s,"soda"),40);
  s.cash=100;
  assert.equal(contractSupplier(s).ok,false);
  assert.equal(supplierLevel(s),1);
  s.cash=300;
  assert.equal(contractSupplier(s).ok,true);
  assert.equal(s.cash,120);
  assert.equal(s.expenses,180);
  assert.equal(supplierLevel(s),2);
  assert.equal(wholesaleCost(s,"soda"),32);
  assert.equal(wholesaleCost(s,"candy"),22);
  assert.equal(wholesaleCost(s,"snacks"),38);
  assert.equal(stockItem(s,"soda").ok,true);
  assert.equal(s.cash,88);
  assert.equal(s.expenses,212);
  assert.equal(s.inventory.soda,22);
  assert.equal(contractSupplier(s).ok,false);
  assert.equal(s.cash,88);
});
test("save legado sem supplierTier usa preço padrão e preserva estoque",()=>{
  const s=createGame();
  delete s.supplierTier;
  assert.equal(supplierLevel(s),1);
  assert.equal(wholesaleCost(s,"candy"),28);
  assert.equal(stockItem(s,"candy").ok,true);
  assert.equal(s.inventory.candy,29);
});

test("qualidade do atendimento considera preço, espera e falha de conexão",()=>{
 const good=customerSatisfactionDelta(12,0,0);
 assert.equal(good,0.22);
 assert.ok(customerSatisfactionDelta(30,0,0)<good);
 assert.ok(customerSatisfactionDelta(12,18,0)<good);
 assert.ok(customerSatisfactionDelta(12,0,8)<good);
 assert.ok(customerSatisfactionDelta(40,100,100)>=-0.9);
});
test("encerramento de sessão muda reputação sem fabricar receita",()=>{
 const s=createGame();
 s.customers.push({id:20,x:2.5,y:2.5,stage:"using",target:{x:2.5,y:2.5},costume:"regular",pcIndex:0,usedMinutes:44,waitingMinutes:0,offlineWait:0,happy:true});
 const before=s.cash;stepGame(s,1);
 assert.ok(s.reputation>75);assert.equal(s.cash,before);
 const bad=createGame();bad.pricePerHour=40;
 bad.customers.push({id:21,x:2.5,y:2.5,stage:"using",target:{x:2.5,y:2.5},costume:"regular",pcIndex:0,usedMinutes:44,waitingMinutes:23,offlineWait:7,happy:true});
 stepGame(bad,1);assert.ok(bad.reputation<75);assert.equal(bad.customers[0]?.happy,false);
});

test("pagamento confirmado gera efeito visual com valor real uma única vez",()=>{
 const s=createGame();
 s.customers.push({id:12,x:1.55,y:2.56,stage:"waiting",target:{x:1.55,y:2.56},costume:"regular",pcIndex:null,usedMinutes:0,waitingMinutes:0,offlineWait:0,happy:true});
 stepGame(s,1);
 assert.equal(s.paymentEffects?.length,1);
 const paid=sessionRevenue(s.pricePerHour,s.customers[0]?.sessionMinutes);
 assert.equal(s.paymentEffects?.[0]?.amount,paid);
 assert.equal(s.paymentEffects?.[0]?.x,1.55);
 assert.equal(s.cash,850+paid);
 const events=s.paymentEffects?.splice(0);
 assert.equal(events?.length,1);
 stepGame(s,1);
 assert.equal(s.paymentEffects?.length,0);
});

test("evento sonoro distingue compra de bebida dos demais produtos",()=>{
 const s=createGame(42);
 s.customers.push({id:55,x:6.15,y:1.65,stage:"shopping",target:{x:6.15,y:1.65},route:[],costume:"regular",pcIndex:null,usedMinutes:45,waitingMinutes:0,offlineWait:0,happy:true});
 const bought=s.purchases;
 stepGame(s,1);
 assert.equal(s.purchases,bought+1);
 assert.equal(s.saleEffects?.length,1);
 assert.ok(["soda","candy","snacks"].includes(s.saleEffects?.[0]?.item));
 assert.equal(s.saleEffects?.splice(0).length,1);
 stepGame(s,1);
 assert.equal(s.saleEffects?.length,0);
});
test("estoque esgotado não dispara som de venda",()=>{
 const s=createGame(51);
 s.inventory={soda:0,candy:0,snacks:0};
 s.customers.push({id:56,x:6.15,y:1.65,stage:"shopping",target:{x:6.15,y:1.65},route:[],costume:"regular",pcIndex:null,usedMinutes:45,waitingMinutes:0,offlineWait:0,happy:true});
 stepGame(s,1);
 assert.equal(s.purchases,0);
 assert.equal(s.saleEffects?.length??0,0);
});

test("necessidades evoluem de forma independente e direcionam compras após sessão",async()=>{
 const {initialNeeds,tickNeeds,selectPurchase}=await import("../dist/js/sim/needs.js");
 const a=initialNeeds(1),b=initialNeeds(2);
 assert.notDeepEqual(a,b);
 const s=createGame();
 const c={id:101,x:2,y:2,stage:"using",target:{x:2,y:2},costume:"regular",pcIndex:0,usedMinutes:0,waitingMinutes:0,offlineWait:0,happy:true,needs:{thirst:74,hunger:20,energy:90},wallet:10};
 tickNeeds(c);
 assert.ok(c.needs.thirst>74);
 assert.equal(selectPurchase(c,s.inventory),"soda");
 c.needs.thirst=5;c.needs.hunger=78;
 assert.equal(selectPurchase(c,s.inventory),"snacks");
 s.inventory.snacks=0;
 assert.equal(selectPurchase(c,s.inventory),"candy");
 c.wallet=0;
 assert.equal(selectPurchase(c,s.inventory),null);
});
test("cliente preserva sessão mesmo sedento e só compra ao terminar",()=>{
 const s=createGame();
 s.customers.push({id:101,x:2.55,y:2.54,stage:"using",target:{x:2.55,y:2.54},costume:"regular",pcIndex:0,usedMinutes:20,waitingMinutes:0,offlineWait:0,happy:true,needs:{thirst:98,hunger:5,energy:90},wallet:20});
 stepGame(s,1);
 assert.equal(s.customers[0].stage,"using");
 assert.equal(s.customers[0].pcIndex,0);
 assert.equal(s.purchases,0);
 s.customers[0].usedMinutes=44;
 stepGame(s,1);
 assert.equal(s.customers[0].stage,"standing");
 assert.equal(s.customers[0].desiredItem,"soda");
});

test("perfil e necessidades definem duração sem mudar saves legados",async()=>{
 const {chooseSessionMinutes}=await import("../dist/js/sim/needs.js");
 const base={id:3,needs:{thirst:22,hunger:30,energy:95}};
 assert.equal(chooseSessionMinutes(base),90);
 assert.equal(chooseSessionMinutes({id:2,needs:{thirst:20,hunger:30,energy:80}}),60);
 assert.equal(chooseSessionMinutes({id:1,needs:{thirst:90,hunger:30,energy:90}}),30);
 assert.equal(chooseSessionMinutes({id:1,needs:{thirst:20,hunger:30,energy:60}}),45);
});
test("pagamento proporcional ao contrato e liberação da cadeira na duração individual",()=>{
 const s=createGame();
 const c={id:3,x:1.55,y:2.56,stage:"waiting",target:{x:1.55,y:2.56},costume:"regular",pcIndex:null,usedMinutes:0,waitingMinutes:0,offlineWait:0,happy:true,needs:{thirst:20,hunger:20,energy:95}};
 s.customers.push(c);stepGame(s,1);
 assert.equal(c.sessionMinutes,90);
 assert.equal(s.revenue,18);
 assert.equal(s.paymentEffects?.[0]?.amount,18);
 c.stage="using";c.usedMinutes=45;
 stepGame(s,1);assert.equal(c.stage,"using");
 c.usedMinutes=89;stepGame(s,1);assert.equal(c.stage,"standing");
});

test("compra de refrigerante na máquina correta emite dinheiro real sem duplicar",async()=>{
 const s=createGame(82);
 const c={id:881,x:2,y:3,stage:"standing",target:{x:2,y:3},costume:"regular",pcIndex:0,usedMinutes:45,waitingMinutes:0,offlineWait:0,happy:true,poseMinutes:2,wantsSnack:true,desiredItem:"soda",wallet:20};
 s.customers.push(c);
 stepGame(s,1);
 assert.equal(c.stage,"shopping");
 const finalStop=c.route?.at(-1)??c.target;
 const {vendingApproach}=await import("../dist/js/sim/layout.js");
  assert.deepEqual(finalStop,vendingApproach("soda"),"destino final deve acompanhar a máquina de refrigerante");
 const prior=s.cash,stock=s.inventory.soda;
 for(let i=0;i<70&&s.purchases===0;i++)stepGame(s,1);
 assert.equal(s.purchases,1);
 assert.equal(s.cash-prior,8);
 assert.equal(s.inventory.soda,stock-1);
 assert.equal(s.saleEffects?.length,1);
 assert.deepEqual(s.saleEffects?.[0]?.item,"soda");
 assert.equal(s.saleEffects?.[0]?.amount,8);
 assert.ok(Number.isFinite(s.saleEffects?.[0]?.x));
 assert.ok(Number.isFinite(s.saleEffects?.[0]?.y));
 stepGame(s,1);assert.equal(s.purchases,1);
});

test("cliente reclama com balão quando desiste de fila sem gerar receita",()=>{
 const s=createGame(1);
 for(let i=0;i<3;i++)s.customers.push({id:40+i,x:2,y:3,stage:"using",target:{x:2,y:3},costume:"regular",pcIndex:i,usedMinutes:1,waitingMinutes:0,offlineWait:0,happy:true});
 const c={id:99,x:1.55,y:2.56,stage:"waiting",target:{x:1.55,y:2.56},costume:"regular",pcIndex:null,usedMinutes:0,waitingMinutes:25,offlineWait:0,happy:true};
 s.customers.push(c);const before=s.cash;
 stepGame(s,1);
 assert.equal(c.stage,"leaving");assert.equal(s.cash,before);
 assert.equal(s.speechEffects?.length,1);
 assert.equal(s.speechEffects?.[0]?.text,"Que fila enorme!");
 assert.equal(s.speechEffects?.splice(0).length,1);
 assert.equal(s.speechEffects?.length,0);
});

test("desgaste individual bloqueia novas reservas e reparo cobra uma única vez",()=>{
 const s=createGame();
 s.pcWear=[100,0,0];assert.equal(pcBroken(s,0),true);
 const c={id:42,x:1.55,y:2.56,stage:"waiting",target:{x:1.55,y:2.56},costume:"regular",pcIndex:null,usedMinutes:0,waitingMinutes:0,offlineWait:0,happy:true};
 s.customers.push(c);stepGame(s,1);assert.equal(c.pcIndex,1);
 const before=s.cash;
 assert.equal(repairComputer(s,0).ok,true);
 assert.equal(s.cash,before-90);assert.equal(pcWear(s,0),0);
 assert.equal(repairComputer(s,0).ok,false);assert.equal(s.cash,before-90);
 const old=createGame();delete old.pcWear;assert.equal(pcWear(old,0),0);
});

test("prateleira lateral libera a parede dos PCs sem deslocar as máquinas de refrigerante",async()=>{
 const {pcPosition}=await import("../dist/js/sim/engine.js");
 const {VENDING_MACHINES}=await import("../dist/js/sim/layout.js");
 assert.deepEqual([pcPosition(0).y,pcPosition(1).y,pcPosition(2).y],[1.10,1.10,1.10]);
 assert.deepEqual(VENDING_MACHINES.map(m=>[m.kind,m.x,m.y]),[["soda",5.80,0.18],["candy",6.60,0.18]]);
});

test("uma faixa adicional de piso e parede libera máquinas à direita da entrada",async()=>{
 const {roomWidth,entrance,pcPosition,createGame}=await import("../dist/js/sim/engine.js");
 const {VENDING_MACHINES,VENDING_WIDTH}=await import("../dist/js/sim/layout.js");
 const s=createGame();assert.equal(roomWidth(s),8);assert.equal(entrance(s).x,7.5);
 assert.ok(VENDING_MACHINES[1].x+VENDING_WIDTH<roomWidth(s));
 assert.ok(pcPosition(0).y<=1.10&&pcPosition(2).y<=1.10);
 s.expansionLevel=2;assert.equal(roomWidth(s),12);
});

test("expositor e proprietário permanecem desenhados no renderizador procedural",async()=>{
 const {readFileSync}=await import("node:fs");
 const {fileURLToPath}=await import("node:url");
 const {resolve,dirname}=await import("node:path");
 const root=resolve(dirname(fileURLToPath(import.meta.url)),"../src/render/scene.ts");
 const source=readFileSync(root,"utf8");
 assert.match(source,/SALGADINHOS/);
 assert.match(source,/for\(let row=0;row<4;row\+\+\)/);
 assert.match(source,/const plate=iso/);
});
