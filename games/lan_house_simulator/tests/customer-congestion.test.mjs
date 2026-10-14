import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,stepGame,entrance,EXIT_REACH_DISTANCE} from '../dist/js/sim/engine.js';
import {purchaseApproach} from '../dist/js/sim/layout.js';
import {retailQueueSlots} from '../dist/js/sim/retailQueue.js';
import {counterQueueSlot,CUSTOMER_COLLISION_RADIUS} from '../dist/js/sim/checkoutQueue.js';
import {serializeSave,parseImportedSave} from '../dist/js/sim/saveTransfer.js';
import {moveLayoutObject} from '../dist/js/sim/editableObjects.js';
import {expandDirection} from '../dist/js/sim/room.js';
const fixture=(item)=>{
 const s=createGame(1933);s.pricePerHour=40;s.reputation=10;s.inventory={soda:50,candy:50,snacks:50};s.nextCustomerId=100;
 const goal=item==='exit'?entrance(s):purchaseApproach(item,s);
 s.customers=Array.from({length:8},(_,i)=>({id:i+1,stage:item==='exit'?'leaving':'shopping',x:item==='exit'?5.3+(i%4)*.55:2.6+(i%4)*.55,y:item==='exit'?4.4+Math.floor(i/4)*.55:3.7+Math.floor(i/4)*.55,target:{...goal},route:[],pcIndex:null,costume:'regular',usedMinutes:0,waitingMinutes:0,offlineWait:0,happy:true,wallet:30,desiredItem:item==='exit'?'snacks':item,needs:{hunger:item==='snacks'||item==='candy'?100:0,thirst:item==='soda'?100:0,energy:60}}));return s;
};
for(const item of ['exit','snacks','soda','candy'])test(`oito clientes congestionados concluem ${item} sem atravessar corpos, cobrar em dobro ou esperar a virada`,()=>{
 const s=fixture(item),initial=s.cash;
 for(let minute=0;minute<360;minute++){
  stepGame(s,1);
  const group=s.customers.filter(c=>c.id<9);
  for(let i=0;i<group.length;i++)for(let j=i+1;j<group.length;j++)assert.ok(Math.hypot(group[i].x-group[j].x,group[i].y-group[j].y)>=CUSTOMER_COLLISION_RADIUS-1e-6);
  if(!group.length)break;
 }
 assert.equal(s.customers.filter(c=>c.id<9).length,0);
 assert.ok(s.totalMinutes<360);
 if(item==='exit'){assert.equal(s.purchases,0);assert.equal(s.cash,initial);}else{assert.ok(s.purchases>=8);assert.ok(s.purchases<=16);assert.equal(s.cash,initial+s.revenue-s.expenses);}
});
test('prateleira não toma o lugar reservado para a fila do caixa',()=>{
 const s=createGame(),goal=purchaseApproach('snacks',s);
 for(let i=0;i<10;i++)assert.ok(Math.hypot(goal.x-counterQueueSlot(i,s).x,goal.y-counterQueueSlot(i,s).y)>CUSTOMER_COLLISION_RADIUS);
 for(const item of ['snacks','soda','candy']){const slots=retailQueueSlots(s,item);assert.ok(slots.length>=8);for(let i=0;i<slots.length;i++)for(let j=i+1;j<slots.length;j++)assert.ok(Math.hypot(slots[i].x-slots[j].x,slots[i].y-slots[j].y)>=.64);}
 assert.ok(EXIT_REACH_DISTANCE<CUSTOMER_COLLISION_RADIUS);
});
test('fila de compras retoma do arquivo e segue máquina movida sem manter destino antigo',()=>{
 const s=fixture('soda');stepGame(s,12);const saved=parseImportedSave(serializeSave(s));saved.cash=20000;assert.equal(expandDirection(saved,'east').ok,true);
 assert.equal(moveLayoutObject(saved,'soda',{x:8.5,y:3},2).ok,true);
 for(let i=0;i<360&&saved.customers.some(c=>c.id<9);i++)stepGame(saved,1);
 assert.equal(saved.customers.some(c=>c.id<9),false);
});
test('três filas simultâneas atendem 14 clientes com bebida e alimento sem compras duplicadas',()=>{
 const s=createGame(1998);s.inventory={snacks:60,soda:60,candy:60};s.pricePerHour=40;s.reputation=10;s.nextCustomerId=100;
 s.customers=Array.from({length:14},(_,i)=>{const item=['snacks','soda','candy'][i%3];return {id:i+1,stage:'shopping',x:2.8+(i%4)*.6,y:3.6+Math.floor(i/4)*.6,target:purchaseApproach(item,s),route:[],pcIndex:null,costume:'regular',usedMinutes:0,waitingMinutes:0,offlineWait:0,happy:true,wallet:25,desiredItem:item,needs:{hunger:90,thirst:90,energy:60}};});
 for(let minute=0;minute<600&&s.customers.some(c=>c.id<15);minute++)stepGame(s,1);
 assert.equal(s.customers.some(c=>c.id<15),false);assert.equal(s.purchases,28);assert.ok(s.totalMinutes<600);
});


test('fechamento às 21h leva clientes por uma saída visível em vez de apagar a lista',()=>{
 const s=createGame(2026),door=entrance(s);s.totalMinutes=659;
 s.pricePerHour=40;s.reputation=10;s.nextCustomerId=100;
 const positions=[[5.1,4.40],[4.5,4.40],[3.9,4.40],[3.3,4.40],[2.7,4.40],[2.1,4.40],[6.7,3.7],[5.9,3.1]];
 s.customers=positions.map(([x,y],i)=>({
  id:i+1,x,y,stage:i<5?'waiting':i<7?'shopping':'using',
  target:{x,y},route:[],pcIndex:i===7?0:null,costume:'regular',
  usedMinutes:i===7?20:0,sessionMinutes:45,waitingMinutes:0,offlineWait:0,happy:true,
  desiredItem:'soda',wallet:30,needs:{hunger:20,thirst:30,energy:65}
 }));
 const ids=s.customers.map(c=>c.id),cash=s.cash,served=s.served,purchases=s.purchases;
 stepGame(s,1);
 assert.ok(s.customers.length>0,'não sumir ao anunciar fechamento');
 assert.ok(s.customers.some(c=>c.stage==='leaving'));
 assert.equal(s.customers.find(c=>c.id===8)?.stage,'using','sessão em andamento não é cortada às 21h');
 for(let i=0;i<59&&s.customers.some(c=>ids.includes(c.id));i++){
  stepGame(s,1);
  const group=s.customers.filter(c=>ids.includes(c.id));
  for(let a=0;a<group.length;a++)for(let b=a+1;b<group.length;b++)
   assert.ok(Math.hypot(group[a].x-group[b].x,group[a].y-group[b].y)>=CUSTOMER_COLLISION_RADIUS-1e-6,
     'visitantes atravessaram corpos ao sair');
 }
 assert.equal(s.totalMinutes,719);
 assert.equal(s.customers.filter(c=>ids.includes(c.id)).length,0,'todos saem pela porta antes das 22h');
 assert.equal(s.served,served,'sem sessões cobradas durante fechamento');
 assert.equal(s.purchases,purchases,'sem vendas após fechamento');
 assert.equal(s.cash,cash);
 assert.deepEqual(entrance(s),door);
});
test('corta novas chegadas às 20h30, preservando o atendimento regular durante o dia',async()=>{
 const {visitorArrivalChance,LAST_ADMISSION_MINUTE,CLOSING_START_MINUTE}=await import('../dist/js/sim/engine.js');
 const s=createGame(1222);assert.equal(LAST_ADMISSION_MINUTE,630);
 assert.equal(CLOSING_START_MINUTE,660);
 s.totalMinutes=629;assert.ok(visitorArrivalChance(s,0)>0);
 s.totalMinutes=630;assert.equal(visitorArrivalChance(s,0),0);
 s.totalMinutes=660;assert.equal(visitorArrivalChance(s,0),0);
});
test('cliente atrasado à virada do dia continua saindo em vez de evaporar',()=>{
 const s=createGame(987);s.totalMinutes=719;s.reputation=10;
 s.customers=[{id:9,x:5.4,y:3.8,stage:'using',target:{x:5.4,y:3.8},route:[],pcIndex:0,
  costume:'regular',usedMinutes:10,sessionMinutes:45,waitingMinutes:0,offlineWait:0,happy:true}];
 stepGame(s,1);
 assert.equal(s.totalMinutes,720);
 assert.equal(s.customers.length,1);
 assert.equal(s.customers[0].stage,'leaving');
 for(let i=0;i<110&&s.customers.length;i++)stepGame(s,1);
 assert.equal(s.customers.length,0,'terminar trajeto até a porta');
});
