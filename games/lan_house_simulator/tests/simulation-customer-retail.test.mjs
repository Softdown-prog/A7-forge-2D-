import {withStationOff} from "./station-power-fixture.mjs";
import assert from "node:assert/strict";
import test from "node:test";
import {createGame,stepGame,pcWear,pcBroken} from "../dist/js/sim/engine.js";
import {shouldShowCustomerSpeech,complaintLine} from "../dist/js/sim/customerDialogue.js";
import {customerSatisfactionDelta,repairComputer,sellItem} from "../dist/js/sim/economy.js";

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
 const retail=readFileSync(resolve(dirname(root),"retail/snackShelf.ts"),"utf8");
 assert.match(retail,/SALGADINHOS/);
 assert.match(retail,/for\(let row=0;row<4;row\+\+\)/);
 const owner=readFileSync(resolve(dirname(root),"scene/characters/owner.ts"),"utf8");
 assert.match(owner,/drawActor\(ctx,camera,\{\.\.\.position,kind:"owner"/);
 const counterModule=readFileSync(resolve(dirname(root),"scene/stations/counter.ts"),"utf8");
 assert.match(source,/drawSceneCounter\(ctx,camera,counter/);
 assert.match(counterModule,/drawCounter\(ctx,objectCamera/);
 assert.match(counterModule,/drawCounterPrinter\(/);
 assert.match(counterModule,/drawCounterDiscCopier\(/);
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
