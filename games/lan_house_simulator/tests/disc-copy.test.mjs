import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,stepGame,isValidSave} from '../dist/js/sim/engine.js';
import {DAY_MINUTES} from '../dist/js/sim/types.js';
import {buyDiscCopier,setDiscCopyPrice,serveDiscCopy,discMediaCost,discCopiesToday,DISC_COPIES_PER_DAY} from '../dist/js/sim/discCopy.js';
import {serializeSave,parseImportedSave} from '../dist/js/sim/saveTransfer.js';
import {editableObjects} from '../dist/js/sim/editableObjects.js';
const at=(s,year)=>{s.totalMinutes=(year-1998)*360*DAY_MINUTES;};
const owned=(mode='classic')=>{const s=createGame(23,mode);at(s,2001);s.cash=20000;assert.equal(buyDiscCopier(s).ok,true);return s;};
const customer=id=>({id,stage:'to_pc',wallet:18});
test('copiadora desbloqueia em 2001, cobra uma vez e não cria nenhum objeto no salão',()=>{
 const s=createGame();s.cash=10000;const old=JSON.stringify(s);assert.equal(buyDiscCopier(s).ok,false);assert.equal(JSON.stringify(s),old);
 at(s,2001);s.cash=899;assert.equal(buyDiscCopier(s).ok,false);s.cash=10000;
 const layout=JSON.stringify(editableObjects(s)),before=s.cash,expenses=s.expenses;
 assert.equal(buyDiscCopier(s).ok,true);assert.equal(s.cash,before-900);assert.equal(s.expenses,expenses+900);
 assert.equal(JSON.stringify(editableObjects(s)),layout);const purchased=JSON.stringify(s);assert.equal(buyDiscCopier(s).ok,false);assert.equal(JSON.stringify(s),purchased);
});
test('preços independentes, mídia descontada e venda única persistem sem consumir RNG',()=>{
 for(const mode of ['classic','historical']){
  const s=owned(mode);assert.equal(setDiscCopyPrice(s,'cd',4).ok,true);assert.equal(setDiscCopyPrice(s,'dvd',7).ok,true);
  const before={cash:s.cash,revenue:s.revenue,expenses:s.expenses,rng:s.rng};let gross=0,cost=0;const kinds=new Set();
  for(let id=1;id<=300;id++){
   const c=customer(id),wallet=c.wallet;const sale=serveDiscCopy(s,c);if(!sale)continue;
   kinds.add(sale.kind);gross+=sale.revenue;cost+=sale.cost;
   assert.equal(sale.revenue,sale.quantity*s.discCopier.prices[sale.kind]);assert.equal(sale.cost,sale.quantity*discMediaCost(s,sale.kind));assert.equal(c.wallet,wallet-sale.revenue);
   const restored=parseImportedSave(serializeSave({...s,customers:[{...c,x:0,y:0,target:{x:0,y:0},costume:'regular',pcIndex:0,usedMinutes:0,waitingMinutes:0,offlineWait:0,happy:true}]}));
   assert.equal(serveDiscCopy(restored,restored.customers[0]),null);
  }
  assert.equal(kinds.size,2);assert.ok(gross>0);assert.equal(s.revenue-before.revenue,gross);assert.equal(s.expenses-before.expenses,cost);assert.equal(s.cash-before.cash,gross-cost);assert.equal(s.rng,before.rng);
  assert.equal(s.discCopier.cdCopies+s.discCopier.dvdCopies,DISC_COPIES_PER_DAY);
  s.totalMinutes+=DAY_MINUTES;assert.equal(discCopiesToday(s),0);
  for(let id=301;id<=500;id++)serveDiscCopy(s,customer(id));assert.ok(discCopiesToday(s)>0);assert.ok(discCopiesToday(s)<=DISC_COPIES_PER_DAY);
 }
});
test('não há renda ociosa, pedido fora do balcão, cópia acima da carteira ou repetida',()=>{
 const s=owned(),before=s.cash;assert.equal(serveDiscCopy(s,{...customer(1),stage:'using'}),null);assert.equal(s.cash,before);
 for(let id=1;id<300;id++)assert.equal(serveDiscCopy(s,{...customer(id),wallet:0}),null);
 assert.equal(s.cash,before);s.customers=[];s.reputation=10;s.pricePerHour=40;
 setDiscCopyPrice(s,"cd",80);setDiscCopyPrice(s,"dvd",80);stepGame(s,120);assert.equal(s.discCopier.revenue,0);
 const unowned=createGame();assert.equal(serveDiscCopy(unowned,customer(1)),null);
});
test('preço alto reduz procura real e alterações inválidas não mudam o estado',()=>{
 const low=owned(),high=owned();setDiscCopyPrice(high,'cd',8);setDiscCopyPrice(high,'dvd',12);
 let requestsLow=0,requestsHigh=0;for(let i=1;i<=300;i++){low.totalMinutes+=DAY_MINUTES;high.totalMinutes+=DAY_MINUTES;requestsLow+=!!serveDiscCopy(low,{...customer(i),wallet:100});requestsHigh+=!!serveDiscCopy(high,{...customer(i),wallet:100});}
 assert.ok(requestsLow>requestsHigh);assert.ok(requestsHigh>0);
 const before=JSON.stringify(low);for(const [kind,price] of [['cd',0],['dvd',81],['cd',NaN],['cd',1.5],['tape',5]])assert.equal(setDiscCopyPrice(low,kind,price).ok,false);assert.equal(JSON.stringify(low),before);
});
test('saves legados continuam válidos e dados inválidos da copiadora são recusados',()=>{
 assert.equal(isValidSave(createGame()),true);const s=owned();assert.deepEqual(parseImportedSave(serializeSave(s)).discCopier,s.discCopier);
 const corrupt=[{prices:null},{prices:{cd:-1,dvd:6}},{cdCopies:-1},{dayCopies:25},{day:1e9},{expenses:NaN},{revenue:-1}];
 for(const change of corrupt){const bad=structuredClone(s);Object.assign(bad.discCopier,change);assert.equal(isValidSave(bad),false);}
 const early=structuredClone(s);at(early,2000);assert.equal(isValidSave(early),false);
 const badCustomer=structuredClone(s);badCustomer.customers=[{...customer(1),discCopyChecked:'yes'}];assert.equal(isValidSave(badCustomer),false);
});
test('clientes reais geram receita de cópias dentro do motor e livros econômicos',()=>{
 const s=owned('historical');s.cash=50000;s.inventory={soda:200,candy:200,snacks:200};s.licensedGames=true;s.contentFilterInstalled=true;s.pcWindowsLicenses=[true,true,true];
 for(let i=0;i<4*DAY_MINUTES/120;i++)stepGame(s,120);
 assert.ok(s.served>0);assert.ok(s.discCopier.cdCopies>0);assert.ok(s.discCopier.dvdCopies>0);assert.ok(s.discCopier.revenue>s.discCopier.expenses);
 assert.ok(s.revenue>=s.discCopier.revenue);assert.ok(s.expenses>=900+s.discCopier.expenses);assert.equal(isValidSave(s),true);
 const saved=parseImportedSave(serializeSave(s));assert.deepEqual(saved.discCopier,s.discCopier);
});
test('sessão e cópias geram um único pagamento visual sem misturar a receita do PC',()=>{
 const s=owned();const before={cash:s.cash,revenue:s.revenue,expenses:s.expenses};
 s.customers=[{id:15,x:1.55,y:2.56,stage:'waiting',target:{x:1.55,y:2.56},costume:'regular',pcIndex:null,usedMinutes:0,waitingMinutes:0,offlineWait:0,happy:true,wallet:18}];
 stepGame(s,1);assert.ok(s.discCopier.revenue>0);assert.equal(s.paymentEffects.length,1);
 assert.equal(s.paymentEffects[0].amount,s.revenue-before.revenue);
 assert.equal(s.cash-before.cash,s.revenue-before.revenue-(s.expenses-before.expenses));
 assert.equal(s.stationLedger[0].sessionRevenue,s.revenue-before.revenue-s.discCopier.revenue);
 s.paymentEffects.splice(0);const sales=s.discCopier.revenue;stepGame(s,1);assert.equal(s.discCopier.revenue,sales);assert.equal(s.paymentEffects.length,0);
});
