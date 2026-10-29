import {withStationOff} from "./station-power-fixture.mjs";
import assert from "node:assert/strict";
import test from "node:test";
import { createGame, stepGame, online, dayNumber, pcCount, pcWear, pcBroken } from "../dist/js/sim/engine.js";
import {shouldShowCustomerSpeech,complaintLine} from "../dist/js/sim/customerDialogue.js";
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
  s.totalMinutes=4*360*720;
  assert.equal(upgradeInternet(s).ok,true);
  assert.equal(s.internetTier,2);
  s.cash=1200;
  assert.equal(expandShop(s).ok,true);
  assert.equal(pcCount(s),3);
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
  assert.equal(s.served,1,"o caixa atende uma pessoa de cada vez");
  assert.equal(s.customers.filter(c=>c.pcIndex!==null).length,1);
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

test("desistência da fila não gera receita e só mostra balão ocasional",()=>{
 const s=createGame(1);
 for(let i=0;i<3;i++)s.customers.push({id:40+i,x:2,y:3,stage:"using",target:{x:2,y:3},costume:"regular",pcIndex:i,usedMinutes:1,waitingMinutes:0,offlineWait:0,happy:true});
 const c={id:99,x:1.55,y:2.56,stage:"waiting",target:{x:1.55,y:2.56},costume:"regular",pcIndex:null,usedMinutes:0,waitingMinutes:25,offlineWait:0,happy:true,needs:{thirst:10,hunger:10,energy:60},wallet:0};
 s.customers.push(c);const before=s.cash;
 stepGame(s,1);
 assert.equal(c.stage,"leaving");assert.equal(s.cash,before);
 const expectedLine=complaintLine("queue",c.id);
 const shouldSpeak=shouldShowCustomerSpeech(c.id,expectedLine,s.totalMinutes,"complaint");
 assert.equal(s.speechEffects?.length??0,Number(shouldSpeak),"falar não deve ser obrigatório em toda desistência");
 if(shouldSpeak)assert.equal(s.speechEffects?.[0]?.text,expectedLine);
 assert.equal(s.speechEffects?.splice(0).length??0,Number(shouldSpeak));
 assert.equal(s.speechEffects?.length??0,0);
});

test("desgaste individual bloqueia novas reservas e reparo cobra uma única vez",()=>{
 const s=createGame();
 s.pcWear=[100,0,0];assert.equal(pcBroken(s,0),true);
 const c={id:42,x:1.55,y:2.56,stage:"waiting",target:{x:1.55,y:2.56},costume:"regular",pcIndex:null,usedMinutes:0,waitingMinutes:0,offlineWait:0,happy:true};
 s.customers.push(c);stepGame(s,1);assert.equal(c.pcIndex,1);
 const before=s.cash;
 assert.equal(repairComputer(s,0).ok,true);
 assert.equal(s.cash,before-90);assert.equal(pcBroken(s,0),true);
 const afterHire=s.cash;assert.equal(repairComputer(s,0).ok,false);assert.equal(s.cash,afterHire);
 for(let i=0;i<100&&s.repairJobs?.length;i++)stepGame(s,1);
 assert.ok(pcWear(s,0)<3,"PC reparado pode voltar a acumular desgaste ao receber clientes");
 assert.equal(pcBroken(s,0),false);
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
 assert.match(source,/drawSnackShelf/);
 const retail=readFileSync(resolve(dirname(root),"retailArt.ts"),"utf8");
 assert.match(retail,/SALGADINHOS/);
 assert.match(retail,/for\(let row=0;row<4;row\+\+\)/);
 assert.match(source,/drawActor\(this.ctx,camera,\{\.\.\.position,kind:"owner"/);
 assert.match(source,/drawCounter\(this.ctx,objectCamera/);
});

test("preços de venda individuais alteram receita e respeitam saves antigos",async()=>{
 const {setProductPrice,productPrice,sellItem,upgradeComputer}=await import("../dist/js/sim/economy.js");
 const s=createGame();
 assert.equal(productPrice(s,"soda"),8);
 assert.equal(setProductPrice(s,"soda",13).ok,true);
 assert.equal(sellItem(s,"soda").ok,true);
 assert.equal(s.revenue,13);
 assert.equal(setProductPrice(s,"candy",41).ok,false);
 delete s.retailPrices;assert.equal(productPrice(s,"soda"),8);
 s.totalMinutes=2*360*720;
 const before=s.cash;assert.equal(withStationOff(s,0,()=>upgradeComputer(s,0)).ok,true);
 assert.equal(s.pcTiers?.[0],2);assert.equal(s.cash,before-240);
});

test("hardware atualizado dá satisfação real sem cobrar novamente por sessão",async()=>{
 const {hardwareSatisfactionBonus,upgradeComputer,customerSatisfactionDelta}=await import("../dist/js/sim/economy.js");
 const s=createGame();
 assert.equal(hardwareSatisfactionBonus(s,0),0);
 s.totalMinutes=2*360*720;
 const before=s.cash;
 assert.equal(withStationOff(s,0,()=>upgradeComputer(s,0)).ok,true);
 assert.equal(s.cash,before-240);
 assert.equal(hardwareSatisfactionBonus(s,0),0.08);
 assert.equal(hardwareSatisfactionBonus(s,1),0);
 s.totalMinutes=5*360*720;
 assert.equal(withStationOff(s,0,()=>upgradeComputer(s,0)).ok,true);
 assert.equal(hardwareSatisfactionBonus(s,0),0.16);
 assert.equal(withStationOff(s,0,()=>upgradeComputer(s,0)).ok,false);
 const old=createGame();delete old.pcTiers;
 assert.equal(hardwareSatisfactionBonus(old,0),0);
 assert.ok(customerSatisfactionDelta(20,10,0)+hardwareSatisfactionBonus(s,0)>customerSatisfactionDelta(20,10,0));
});

test("arte dos três níveis de hardware permanece ligada ao estado real do PC",async()=>{
 const {readFileSync}=await import("node:fs");
 const {resolve,dirname}=await import("node:path");
 const {fileURLToPath}=await import("node:url");
 const source=readFileSync(resolve(dirname(fileURLToPath(import.meta.url)),"../src/render/retroComputer.ts"),"utf8");
 assert.match(source,/s\.pcTiers\?\.\[index\]\?\?1/);
 assert.match(source,/tier===3\?/);
 assert.match(source,/if\(tier>1\)/);
 const s=createGame();assert.deepEqual(s.pcTiers,[1,1,1]);
 const {upgradeComputer}=await import("../dist/js/sim/economy.js");
 s.totalMinutes=2*360*720;
 assert.equal(withStationOff(s,1,()=>upgradeComputer(s,1)).ok,true);assert.deepEqual(s.pcTiers,[1,2,1]);
});

test("menu inicial impede autoplay e oferece partida, continuar e opções",async()=>{
 const {readFileSync}=await import("node:fs");
 const {resolve,dirname}=await import("node:path");
 const {fileURLToPath}=await import("node:url");
 const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
 const html=readFileSync(resolve(root,"index.html"),"utf8");
 const source=readFileSync(resolve(root,"src/main.ts"),"utf8");
 for(const id of ["start-screen","menu-new","menu-continue","menu-options","option-sound","open-menu"])assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(source,/frameSimulation\.run\(\{/);
 assert.match(source,/advance:minutes=>stepGame\(game,minutes\)/);
 const frame=readFileSync(resolve(root,"src/application/frameActivity.ts"),"utf8");
 assert.match(frame,/advanceSimulation=input\.playing&&!input\.accountOpen&&!input\.editingLayout/);
 for(const condition of ["placingFurniture","relocatingFurniture","editingWalls","installingAnnexPc"])
  assert.ok(frame.includes("!input."+condition),condition);
 assert.match(source,/if\(!isPlaying\)return;/);
 assert.match(source,/showMenu\(\);\r?\nrequestAnimationFrame\(frame\);/);
});

test("exportação e importação preservam a partida e rejeitam JSON inválido",async()=>{
 const {serializeSave,parseImportedSave}=await import("../dist/js/sim/saveTransfer.js");
 const s=createGame();s.cash=1245;s.pricePerHour=16;s.inventory.snacks=33;s.pcTiers=[1,3,1];
 const text=serializeSave(s), restored=parseImportedSave(text);
 assert.deepEqual(restored,s);assert.notEqual(restored,s);
 assert.throws(()=>parseImportedSave("{broken"),/JSON inválido/);
 assert.throws(()=>parseImportedSave(JSON.stringify(s)),/incompatível/);
 const edited=JSON.parse(text);edited.state.inventory.snacks=-200;
 assert.throws(()=>parseImportedSave(JSON.stringify(edited)),/fora dos limites/);
 const tooLong="x".repeat(2_000_001);assert.throws(()=>parseImportedSave(tooLong),/muito grande/);
});

test("compras de computadores e móveis cobram e persistem sem alterar saves legados",async()=>{
 const {buyComputer,buyFurniture}=await import("../dist/js/sim/shop.js");
 const s=createGame();
 assert.equal(buyComputer(s).ok,false);
 assert.equal(expandShop(s).ok,true);
 assert.equal(pcCount(s),3);
 s.cash=1000;
 assert.equal(buyComputer(s).ok,true);assert.equal(pcCount(s),4);
 assert.equal(s.pcTiers?.[3],1);
 const before=s.cash;
 assert.equal(buyFurniture(s,"poster").ok,true);assert.equal(s.cash,before-45);
 assert.equal(buyFurniture(s,"plant").ok,true);
 assert.equal(buyFurniture(s,"table").ok,true);
 assert.equal(buyFurniture(s,"table").ok,true);
 const legacy=createGame();delete legacy.installedPcs;legacy.expansionLevel=1;
 assert.equal(pcCount(legacy),5);
});

test("colocação guiada só cobra na confirmação e impede colisão",async()=>{
 const {placeFurniture,availablePlacementSlots,occupiedFurnitureSlots}=await import("../dist/js/sim/shop.js");
 const {serializeSave,parseImportedSave}=await import("../dist/js/sim/saveTransfer.js");
 const s=createGame(); const cash=s.cash;
 assert.ok(availablePlacementSlots(s,"plant").length>4);
 assert.equal(placeFurniture(s,"plant","wall-1").ok,false);
 assert.equal(s.cash,cash);
 assert.equal(placeFurniture(s,"plant","floor-1").ok,true);
 assert.equal(s.cash,cash-85);
 assert.equal(occupiedFurnitureSlots(s).has("floor-1"),true);
 assert.equal(placeFurniture(s,"table","floor-1").ok,false);
 assert.equal(placeFurniture(s,"table","floor-2").ok,true);
 assert.equal(placeFurniture(s,"poster","floor-3").ok,false);
 assert.equal(placeFurniture(s,"poster","wall-1").ok,true);
 assert.deepEqual(parseImportedSave(serializeSave(s)).furniturePlacements,s.furniturePlacements);
 const tampered=JSON.parse(serializeSave(s));
 tampered.state.furniturePlacements[0].slotId="wall-1";
 assert.throws(()=>parseImportedSave(JSON.stringify(tampered)),/Posicionamento/);
});
test("móveis antigos reservam espaços para não haver duplicação",async()=>{
 const {buyFurniture,placeFurniture,occupiedFurnitureSlots}=await import("../dist/js/sim/shop.js");
 const s=createGame();s.cash=1000;
 assert.equal(buyFurniture(s,"plant").ok,true);
 assert.equal(occupiedFurnitureSlots(s).has("floor-1"),true);
 assert.equal(placeFurniture(s,"plant","floor-1").ok,false);
 assert.equal(placeFurniture(s,"plant","floor-3").ok,true);
 assert.equal(s.furniture?.plant,2);
 assert.equal(s.furniturePlacements?.length,2);
});

test("reorganizar móveis existentes preserva caixa, despesas, posse e save",async()=>{
 const {placeFurniture,relocateFurniture,furnitureLocations,availablePlacementSlots,occupiedFurnitureSlots}=await import("../dist/js/sim/shop.js");
 const {serializeSave,parseImportedSave}=await import("../dist/js/sim/saveTransfer.js");
 const s=createGame();s.cash=2000;
 assert.equal(placeFurniture(s,"plant","floor-1").ok,true);
 assert.equal(placeFurniture(s,"table","floor-2").ok,true);
 assert.equal(placeFurniture(s,"poster","wall-1").ok,true);
 const before=JSON.stringify({cash:s.cash,expenses:s.expenses,furniture:s.furniture});
 const old=JSON.stringify(s.furniturePlacements);
 assert.equal(relocateFurniture(s,"floor-1","floor-2").ok,false);
 assert.equal(relocateFurniture(s,"floor-1","wall-2").ok,false);
 assert.equal(relocateFurniture(s,"unknown","floor-3").ok,false);
 assert.equal(relocateFurniture(s,"floor-1","floor-1").ok,false);
 assert.equal(JSON.stringify(s.furniturePlacements),old);
 assert.equal(relocateFurniture(s,"floor-1","floor-3").ok,true);
 assert.equal(JSON.stringify({cash:s.cash,expenses:s.expenses,furniture:s.furniture}),before);
 assert.equal(s.furniturePlacements.find(p=>p.kind==="plant").slotId,"floor-3");
 assert.equal(occupiedFurnitureSlots(s).has("floor-1"),false);
 assert.equal(availablePlacementSlots(s,"plant").some(p=>p.id==="floor-1"),true);
 assert.equal(furnitureLocations(s).length,3);
 const recovered=parseImportedSave(serializeSave(s));
 assert.deepEqual(recovered.furniturePlacements,s.furniturePlacements);
 assert.equal(recovered.cash,s.cash);assert.equal(recovered.expenses,s.expenses);
});
test("reposicionamento de save antigo converte móveis com segurança sem recomprar",async()=>{
 const {buyFurniture,relocateFurniture,furnitureLocations,validFurniturePlacements}=await import("../dist/js/sim/shop.js");
 const s=createGame();s.cash=2000;
 assert.equal(buyFurniture(s,"plant").ok,true);
 assert.equal(buyFurniture(s,"poster").ok,true);
 delete s.furniturePlacements; // Simulate an actual pre-placement save.
 assert.equal(s.furniturePlacements,undefined);
 const snapshot={cash:s.cash,expenses:s.expenses,furniture:JSON.stringify(s.furniture)};
 assert.equal(relocateFurniture(s,"floor-1","floor-4").ok,true);
 assert.deepEqual([...s.furniturePlacements].sort((a,b)=>a.kind.localeCompare(b.kind)),[{kind:"plant",slotId:"floor-4"},{kind:"poster",slotId:"wall-1"}].sort((a,b)=>a.kind.localeCompare(b.kind)));
 assert.equal(validFurniturePlacements(s),true);
 assert.equal(furnitureLocations(s).length,2);
 assert.deepEqual({cash:s.cash,expenses:s.expenses,furniture:JSON.stringify(s.furniture)},snapshot);
 assert.equal(relocateFurniture(s,"floor-1","floor-3").ok,false);
});
test("modo de organizar fica disponível no catálogo sem afetar a compra",async()=>{
 const {readFileSync}=await import("node:fs");
 const {resolve,dirname}=await import("node:path");
 const {fileURLToPath}=await import("node:url");
 const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
 const html=readFileSync(resolve(root,"index.html"),"utf8");
 const main=readFileSync(resolve(root,"src/main.ts"),"utf8");
 assert.match(html,/id="organize-furniture"/);
 assert.match(main,/placementActions\.move\(relocationFrom,slot.id\)/);
 assert.match(readFileSync(resolve(root,"src/application/placementActionsPort.ts"),"utf8"),/relocateFurniture\(getState\(\),from,to\)/);
 assert.match(main,/frameSimulation\.run\(\{/);
 assert.match(main,/advance:minutes=>stepGame\(game,minutes\)/);
 assert.match(main,/relocatingFurniture:relocating,editingWalls:!!wallMode,installingAnnexPc/);
});

test("audio uses independent volume hierarchy and a bounded gentle typing phrase",async()=>{
 const {AUDIO_LEVELS,KEYBOARD_DURATION,keyboardPattern}=await import("../dist/js/audio/soundscape.js");
 assert.ok(AUDIO_LEVELS.keyboard<AUDIO_LEVELS.mouse);
 assert.ok(AUDIO_LEVELS.mouse<AUDIO_LEVELS.smallSale);
 assert.ok(AUDIO_LEVELS.smallSale<AUDIO_LEVELS.income);
 assert.equal(KEYBOARD_DURATION,3.5);
 const strokes=keyboardPattern();
 assert.ok(strokes.length>=18&&strokes.length<=28);
 assert.ok(strokes[0].at>=0&&strokes.at(-1).at<KEYBOARD_DURATION);
 assert.ok(strokes.some((s,i)=>i>0&&Math.abs(s.at-strokes[i-1].at-0.156)>0.005));
 assert.ok(strokes.every(x=>x.strength>0&&x.strength<=1));
});
test("session transition emits a single keyboard event, never per gameplay frame",()=>{
 const s=createGame();
 s.customers=[{id:601,x:2.55,y:1.92,target:{x:2.55,y:1.92},route:[],stage:"sitting",pcIndex:0,
  costume:"regular",poseMinutes:2,usedMinutes:0,waitingMinutes:0,offlineWait:0,happy:true}];
 stepGame(s,1);
 assert.equal(s.customers[0].stage,"using");
 assert.deepEqual(s.keyboardEffects,[{customerId:601,pcIndex:0}]);
 stepGame(s,5);
 assert.equal(s.keyboardEffects.length,1,"no new keyboard sound for an ongoing session");
});
test("UI click audio uses one delegated handler and game money is event-driven",async()=>{
 const {readFileSync}=await import("node:fs");
 const {resolve,dirname}=await import("node:path");
 const {fileURLToPath}=await import("node:url");
 const source=readFileSync(resolve(dirname(fileURLToPath(import.meta.url)),"../src/main.ts"),"utf8");
 const audioUi=readFileSync(resolve(dirname(fileURLToPath(import.meta.url)),"../src/ui/soundInputBindings.ts"),"utf8");
 assert.match(source,/installSoundInputBindings\(document,soundscape\)/);
 assert.match(audioUi,/doc\.addEventListener\("click",event=>/);
  const feedback=readFileSync(resolve(dirname(fileURLToPath(import.meta.url)),"../src/application/frameFeedbackPort.ts"),"utf8");
  assert.match(source,/createFrameFeedbackPort\(\(\)=>game,soundscape/);
  const dispatch=readFileSync(resolve(dirname(fileURLToPath(import.meta.url)),"../src/application/frameEventDispatch.ts"),"utf8");
  assert.match(source,/dispatchFrameEvents\(\{/);
  assert.match(dispatch,/options\.feedback\.payments\(options\.playing\)/);
  assert.match(feedback,/audio\.income\("payment"\)/);
  assert.match(dispatch,/options\.feedback\.sales\(options\.playing\)/);
  assert.match(feedback,/audio\.income\("sale"\)/);
  assert.match(dispatch,/options\.feedback\.keyboards\(options\.playing\)/);
  assert.match(feedback,/audio\.keyboard\(\)/);
 assert.doesNotMatch(source,/new Audio\(/);
 assert.doesNotMatch(source,/playOriginalSound/);
});

test("mapa amplia 10 tiles norte, leste e oeste; porta sul não muda",async()=>{
 const {roomBounds,expandDirection,validRoomExtensions}=await import("../dist/js/sim/room.js");
 const {entrance}=await import("../dist/js/sim/engine.js");
 const {serializeSave,parseImportedSave}=await import("../dist/js/sim/saveTransfer.js");
 const s=createGame();s.cash=50000;
 assert.deepEqual(roomBounds(s),{minX:0,maxX:8,minY:0,maxY:6});
 for(const dir of ["west","east","north"]){
   for(let i=0;i<5;i++)assert.equal(expandDirection(s,dir).ok,true,dir+i);
   assert.equal(expandDirection(s,dir).ok,false,"limite em "+dir);
 }
 assert.deepEqual(roomBounds(s),{minX:-10,maxX:18,minY:-10,maxY:6});
 assert.deepEqual(entrance(s),{x:7.5,y:5.35});
 assert.equal(expandDirection(s,"south").ok,false);
 assert.equal(validRoomExtensions(s),true);
 assert.deepEqual(roomBounds(parseImportedSave(serializeSave(s))),roomBounds(s));
 const legacy=createGame();legacy.roomExtensions={west:2,east:1,south:2};
 assert.equal(validRoomExtensions(legacy),true);
 assert.deepEqual(roomBounds(legacy),{minX:-4,maxX:10,minY:0,maxY:10});
 assert.deepEqual(entrance(legacy),{x:7.5,y:5.35});
 const bad=JSON.parse(serializeSave(s));bad.state.roomExtensions.north=15;
 assert.throws(()=>parseImportedSave(JSON.stringify(bad)),/Extensões/);
});
test("a câmera contém cantos do piso expandido, incluindo paredes e espessura da plataforma",async()=>{
 const {cameraForGame,iso}=await import("../dist/js/render/isometric.js");
 const {roomBounds}=await import("../dist/js/sim/room.js");
 const s=createGame();s.expansionLevel=2;s.roomExtensions={west:5,east:5,south:0,north:5};
 const b=roomBounds(s),camera=cameraForGame(s);
 for(const x of [b.minX,b.maxX])for(const y of [0,b.maxY])for(const z of [0,155,-24]){
  const projected=iso({x,y},camera,z);
  assert.ok(projected.x>15&&projected.x<985,"projeção X dentro do canvas: "+JSON.stringify(projected));
  assert.ok(projected.y>8&&projected.y<600,"projeção Y dentro do canvas: "+JSON.stringify(projected));
 }
});
test("slots novos têm bloqueio de ocupação e móveis de piso giram pelas quatro direções",async()=>{
 const {expandDirection}=await import("../dist/js/sim/room.js");
 const {furnitureSlots,placeFurniture,rotateFurniture,relocateFurniture,validFurniturePlacements}=await import("../dist/js/sim/shop.js");
 const {serializeSave,parseImportedSave}=await import("../dist/js/sim/saveTransfer.js");
 const s=createGame();s.cash=10000;
 for(const dir of ["west","east","north"])assert.equal(expandDirection(s,dir).ok,true);
 const ids=furnitureSlots(s).map(x=>x.id);
 for(const id of ["floor-west-1","floor-east-1","floor-north-1-a","wall-west-1","wall-east-1"])assert.ok(ids.includes(id),id);
 assert.equal(placeFurniture(s,"table","floor-north-1-a").ok,true);
 const previous={cash:s.cash,expenses:s.expenses};
 for(let n=1;n<=4;n++){
  assert.equal(rotateFurniture(s,"floor-north-1-a").ok,true);
  assert.equal(s.furniturePlacements.find(p=>p.slotId==="floor-north-1-a")?.rotation,n%4);
 }
 assert.deepEqual({cash:s.cash,expenses:s.expenses},previous);
 assert.equal(relocateFurniture(s,"floor-north-1-a","floor-west-1").ok,true);
 assert.equal(s.furniturePlacements.find(p=>p.slotId==="floor-west-1")?.rotation,0);
 assert.equal(validFurniturePlacements(s),true);
 assert.deepEqual(parseImportedSave(serializeSave(s)).furniturePlacements,s.furniturePlacements);
 assert.equal(rotateFurniture(s,"missing").ok,false);
});
test("ampliação norte/leste/oeste não move a porta nem desvia a saída",async()=>{
 const {expandDirection}=await import("../dist/js/sim/room.js");
 const {entrance}=await import("../dist/js/sim/engine.js");
 const s=createGame();s.cash=9000;
 const original=entrance(s);
 assert.equal(expandDirection(s,"north").ok,true);
 assert.equal(expandDirection(s,"east").ok,true);
 assert.equal(expandDirection(s,"west").ok,true);
 assert.deepEqual(entrance(s),original);
});
test("interfaces responsivas possuem expansão direcional e controle de rotação",async()=>{
 const {readFileSync}=await import("node:fs");const {resolve,dirname}=await import("node:path");
 const {fileURLToPath}=await import("node:url");
 const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
 const html=readFileSync(resolve(root,"index.html"),"utf8");
 const source=readFileSync(resolve(root,"src/main.ts"),"utf8");
 assert.match(html,/id="rotate-furniture"/);
 assert.match(source,/installShopControls\(shopCatalog,createShopActionsPort/);
  const port=readFileSync(resolve(root,"src/application/shopActionsPort.ts"),"utf8");
  assert.match(port,/expandDirection\(s,direction\)/);
 assert.match(source,/placementActions\.rotate\(relocationFrom\)/);
  assert.match(readFileSync(resolve(root,"src/application/placementActionsPort.ts"),"utf8"),/rotateFurniture\(getState\(\),id\)/);
 // The grid may change with the visual identity. capture_identity.mjs verifies
 // actual overflow and interaction at 1440, 414 and 360 pixels in Chromium.
 assert.match(html,/name="viewport"[^>]+width=device-width/);
});

test("a ampliação libera slots e capacidade real para novas decorações",async()=>{
 const {expandDirection}=await import("../dist/js/sim/room.js");
 const {furnitureLimit,placeFurniture,furnitureLocations,validFurniturePlacements,availablePlacementSlots}=await import("../dist/js/sim/shop.js");
 const {serializeSave,parseImportedSave}=await import("../dist/js/sim/saveTransfer.js");
 const s=createGame();s.cash=20000;
 for(const dir of ["west","east","north"])assert.equal(expandDirection(s,dir).ok,true);
 assert.ok(furnitureLimit(s,"poster")>=5);
 assert.ok(furnitureLimit(s,"plant")>6);
 assert.ok(furnitureLimit(s,"table")>4);
 for(const id of availablePlacementSlots(s,"poster").slice(0,4).map(p=>p.id))
  assert.equal(placeFurniture(s,"poster",id).ok,true,id);
 for(const id of ["floor-1","floor-2","floor-west-1","floor-east-1","floor-north-1-a","floor-north-1-b"])
  assert.equal(placeFurniture(s,"plant",id).ok,true,id);
 assert.equal(placeFurniture(s,"plant","floor-3").ok,true,"capacidade depende do espaço livre");
 assert.equal(furnitureLocations(s).length,11);
 assert.equal(validFurniturePlacements(s),true);
 assert.equal(parseImportedSave(serializeSave(s)).furniturePlacements.length,11);
});

test("parede interna tem prévia, custo, bloqueio das rotas e remoção sem reembolso",async()=>{
 const {buildWall,removeWall,canBuildWall,wallCandidates,WALL_COST,wallZoneCount}=await import("../dist/js/sim/walls.js");
 const {serializeSave,parseImportedSave}=await import("../dist/js/sim/saveTransfer.js");
 const {expandDirection}=await import("../dist/js/sim/room.js");
 const s=createGame();s.cash=10000;
 assert.equal(expandDirection(s,"north").ok,true);
 assert.ok(wallCandidates(s).length>70);
 assert.equal(WALL_COST,30);
 const wall={axis:"x",x:1,y:-1};
 assert.equal(canBuildWall(s,wall),true);
 const before=s.cash;
 assert.equal(buildWall(s,wall).ok,true);
 assert.equal(s.cash,before-30);
 assert.equal(buildWall(s,wall).ok,false);
 assert.equal(s.cash,before-30);
 assert.deepEqual(parseImportedSave(serializeSave(s)).interiorWalls,[wall]);
 assert.equal(removeWall(s,wall).ok,true);
 assert.equal(s.cash,before-30);
 assert.equal(removeWall(s,wall).ok,false);
 assert.equal(wallZoneCount(s),1);
});
test("paredes podem desviar trajetos e respeitam bordas externas",async()=>{
 const {buildWall,canBuildWall,validInteriorWalls}=await import("../dist/js/sim/walls.js");
 const s=createGame();s.cash=10000;
 assert.equal(buildWall(s,{axis:"x",x:2,y:0}).ok,false);
 assert.equal(buildWall(s,{axis:"x",x:2,y:6}).ok,false);
 assert.equal(buildWall(s,{axis:"y",x:0,y:2}).ok,false);
 // Segmento transversal ao corredor principal dos clientes.
 assert.equal(canBuildWall(s,{axis:"y",x:4,y:4}),true);
 assert.equal(validInteriorWalls(s),true);
});
test("paredes criam setores físicos fechados na grade sem alterar os PCs",async()=>{
 const {buildWall,wallZoneCount}=await import("../dist/js/sim/walls.js");
 const {expandDirection}=await import("../dist/js/sim/room.js");
 const s=createGame();s.cash=12000;
 assert.equal(expandDirection(s,"north").ok,true);
 // Isola um tile no anexo norte, sem interferir nos fluxos dos computadores.
 for(const wall of [{axis:"x",x:1,y:-1},{axis:"x",x:1,y:0},
  {axis:"y",x:1,y:-1},{axis:"y",x:2,y:-1}]){
  assert.equal(buildWall(s,wall).ok,true,JSON.stringify(wall));
 }
 assert.ok(wallZoneCount(s)>=2);
});

test("anexo permite PC adicional com cobrança única e é salvo sem mudar PCs antigos",async()=>{
 const {expandDirection}=await import("../dist/js/sim/room.js");
 const {annexComputerSlots,installAnnexComputer,availableAnnexComputers}=await import("../dist/js/sim/stations.js");
 const {pcCount,pcPosition,createGame}=await import("../dist/js/sim/engine.js");
 const {serializeSave,parseImportedSave}=await import("../dist/js/sim/saveTransfer.js");
 const s=createGame();s.cash=5000;
 assert.equal(expandDirection(s,"north").ok,true);
 const p=pcPosition(0),slot=annexComputerSlots(s).find(x=>x.wing==="north");
 assert.ok(slot);
 const before=s.cash;
 assert.equal(installAnnexComputer(s,slot.id).ok,true);
 assert.equal(s.cash,before-320);assert.equal(pcCount(s),4);
 assert.deepEqual(pcPosition(0,s),p);
 assert.deepEqual(pcPosition(3,s),slot.position);
 assert.equal(installAnnexComputer(s,slot.id).ok,false);
 assert.equal(s.cash,before-320);
 assert.ok(!availableAnnexComputers(s).some(x=>x.id===slot.id));
 const restored=parseImportedSave(serializeSave(s));
 assert.deepEqual(restored.annexPcs,s.annexPcs);
 assert.deepEqual(pcPosition(3,restored),slot.position);
});
test("rotas existentes não mudam com paredes fora de seus corredores",async()=>{
 const {createGame,entrance}=await import("../dist/js/sim/engine.js");
 const {expandDirection}=await import("../dist/js/sim/room.js");
 const {buildWall}=await import("../dist/js/sim/walls.js");
 const {navigableRoute}=await import("../dist/js/sim/navigation.js");
 const {COUNTER_QUEUE,hallwayRoute}=await import("../dist/js/sim/route.js");
 const s=createGame();s.cash=5000;expandDirection(s,"north");
 const origin=entrance(s),before=hallwayRoute(origin,COUNTER_QUEUE);
 assert.equal(buildWall(s,{axis:"x",x:1,y:-1}).ok,true);
 assert.deepEqual(navigableRoute(s,origin,COUNTER_QUEUE),before);
});
test("converter parede em porta preserva a passagem e o contador de salas",async()=>{
 const {createGame}=await import("../dist/js/sim/engine.js");
 const {expandDirection}=await import("../dist/js/sim/room.js");
 const {buildWall,installInteriorDoor,removeInteriorDoor,wallZoneCount,validInteriorDoors}=await import("../dist/js/sim/walls.js");
 const {serializeSave,parseImportedSave}=await import("../dist/js/sim/saveTransfer.js");
 const {navigableRoute}=await import("../dist/js/sim/navigation.js");
 const s=createGame();s.cash=5000;expandDirection(s,"north");
 const segment={axis:"x",x:1,y:-1};
 assert.equal(buildWall(s,segment).ok,true);
 const cash=s.cash;
 assert.equal(installInteriorDoor(s,segment).ok,true);
 assert.equal(s.cash,cash-80);
 assert.equal(s.interiorWalls.length,0);assert.equal(s.interiorDoors.length,1);
 assert.equal(validInteriorDoors(s),true);
 assert.ok(navigableRoute(s,{x:1.5,y:-.5},{x:1.5,y:-1.5}));
 assert.deepEqual(parseImportedSave(serializeSave(s)).interiorDoors,s.interiorDoors);
 assert.equal(installInteriorDoor(s,segment).ok,false);
 assert.equal(removeInteriorDoor(s,segment).ok,true);
 assert.equal(s.interiorDoors.length,0);
});
test("manutenção e upgrades reconhecem os PCs nas expansões",async()=>{
 const {createGame,pcCount}=await import("../dist/js/sim/engine.js");
 const {expandDirection}=await import("../dist/js/sim/room.js");
 const {installAnnexComputer}=await import("../dist/js/sim/stations.js");
 const {upgradeComputer,repairComputer}=await import("../dist/js/sim/economy.js");
 const s=createGame();s.cash=6000;expandDirection(s,"east");
 assert.equal(installAnnexComputer(s,"pc-east-1").ok,true);
 assert.equal(pcCount(s),4);
 s.totalMinutes=2*360*720;
 assert.equal(withStationOff(s,3,()=>upgradeComputer(s,3)).ok,true);
 assert.equal(s.pcTiers[3],2);
 s.pcWear[3]=90;
 assert.equal(repairComputer(s,3).ok,true);
 assert.ok(s.repairJobs?.some(j=>j.pc===3));
 for(let i=0;i<120&&s.repairJobs?.length;i++)stepGame(s,1);
 assert.equal(s.pcWear[3],0);
});
test("índices dos anexos são preservados quando o jogador instala mais PCs tradicionais",async()=>{
 const {createGame,pcCount,pcPosition}=await import("../dist/js/sim/engine.js");
 const {expandDirection}=await import("../dist/js/sim/room.js");
 const {installAnnexComputer}=await import("../dist/js/sim/stations.js");
 const {expandShop}=await import("../dist/js/sim/economy.js");
 const {buyComputer}=await import("../dist/js/sim/shop.js");
 const s=createGame();s.cash=15000;expandDirection(s,"north");installAnnexComputer(s,"pc-north-1");
 s.pcTiers[3]=3;s.pcWear[3]=44;
 const pos=pcPosition(3,s);
 assert.equal(expandShop(s).ok,true);
 assert.equal(buyComputer(s).ok,true);
 assert.equal(pcCount(s),5);
 assert.deepEqual(pcPosition(4,s),pos);
 assert.equal(s.pcTiers[4],3);assert.equal(s.pcWear[4],44);
});

test("sala norte fechada obriga cliente a atravessar a porta até o PC adicional",async()=>{
 const {createGame,stepGame,pcCount,pcPosition,entrance}=await import("../dist/js/sim/engine.js");
 const {expandDirection}=await import("../dist/js/sim/room.js");
 const {buildWall,installInteriorDoor,wallZoneCount}=await import("../dist/js/sim/walls.js");
 const {installAnnexComputer}=await import("../dist/js/sim/stations.js");
 const {navigableRoute}=await import("../dist/js/sim/navigation.js");
 const {COUNTER_QUEUE,computerSeat}=await import("../dist/js/sim/route.js");
 const s=createGame();s.cash=20000;
 assert.equal(expandDirection(s,"north").ok,true);
 for(let x=0;x<8;x++)assert.equal(buildWall(s,{axis:"x",x,y:-1}).ok,true,"segmento "+x);
 const locked=navigableRoute(s,COUNTER_QUEUE,{x:5.35,y:-1.06});
 assert.equal(locked,null,"a porta não pode ser atravessada enquanto fechada");
 assert.equal(installAnnexComputer(s,"pc-north-1").ok,false,"sala sem entrada não recebe PC");
 assert.equal(installInteriorDoor(s,{axis:"x",x:4,y:-1}).ok,true);
 assert.equal(wallZoneCount(s),2,"duas salas mesmo com portal");
 assert.equal(installAnnexComputer(s,"pc-north-1").ok,true);
 assert.equal(pcCount(s),4);
 const {serializeSave,parseImportedSave}=await import("../dist/js/sim/saveTransfer.js");
 const restored=parseImportedSave(serializeSave(s));
 assert.equal(restored.interiorDoors.length,1);
 assert.equal(restored.interiorWalls.length,7);
 assert.equal(restored.annexPcs.length,1);
 const route=navigableRoute(s,COUNTER_QUEUE,computerSeat(pcPosition(3,s)));
 assert.ok(route&&route.some(p=>p.y< -1),"caminho passa para o lado norte da parede");
 const make=(id,stage,pcIndex,x,y)=>({id,stage,pcIndex,x,y,target:{x,y},route:[],
  costume:"regular",usedMinutes:0,sessionMinutes:300,waitingMinutes:0,offlineWait:0,happy:true,poseMinutes:0});
 s.customers=[
  make(1,"using",0,2.55,1.92),make(2,"using",1,4,1.92),make(3,"using",2,5.35,1.92),
  make(4,"waiting",null,COUNTER_QUEUE.x,COUNTER_QUEUE.y)
 ];
 stepGame(s,1);
 const customer=s.customers.find(c=>c.id===4);
 assert.equal(customer.stage,"to_pc");
 assert.equal(customer.pcIndex,3);
 assert.ok([customer.target,...customer.route].some(p=>p.y< -1));
 stepGame(s,55);
 assert.ok(["sitting","using","standing"].includes(customer.stage),"cliente chegou à área do anexo: "+customer.stage);
 assert.deepEqual(entrance(s),{x:7.5,y:5.35});
});
