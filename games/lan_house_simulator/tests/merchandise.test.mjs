import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,stepGame,isValidSave} from '../dist/js/sim/engine.js';
import {PRODUCTS,SUPPLIERS,availableProducts,orderMerchandise,receiveDueOrders,merchandiseStock,merchandisePrice,quoteOrder,setMerchandisePrice,chooseMerchandise,acceptsProduct,averageProductCost,productQuality} from '../dist/js/sim/merchandise.js';
import {chooseDecision} from '../dist/js/sim/decisions.js';
import {contractSupplier,stockItem,sellItem} from '../dist/js/sim/economy.js';
import {selectPurchase} from '../dist/js/sim/needs.js';
import {purchaseApproach} from '../dist/js/sim/layout.js';
import {serializeSave,parseImportedSave} from '../dist/js/sim/saveTransfer.js';
import {merchandiseDisplay,categoryStock} from '../dist/js/render/merchandiseDisplay.js';
import {priceIndex} from '../dist/js/sim/historicalEconomy.js';
import {GAME_LAST_MINUTE} from '../dist/js/sim/mailCalendar.js';
const make=(year=1998)=>{const s=createGame(1933,'historical');s.totalMinutes=(year-1998)*360*720;s.cash=2000;return s;};
const ok=r=>assert.equal(r.ok,true,r.message);
function visitor(s,id=901){const at=purchaseApproach('soda',s);return {id,...at,stage:'shopping',target:{...at},route:[],costume:'regular',pcIndex:null,usedMinutes:60,waitingMinutes:0,offlineWait:0,happy:true,needs:{thirst:90,hunger:90,energy:60},wallet:20};}
const round=n=>Math.round(n*100)/100;

test('legacy stock and prices remain authoritative; importing never books money',()=>{
 const s=make();s.inventory={soda:13,candy:7,snacks:2};s.supplierTier=2;s.retailPrices={soda:1.75,candy:1,snacks:2};
 const before=JSON.stringify(s),restored=parseImportedSave(serializeSave(s));
 assert.equal(JSON.stringify(s),before);assert.equal(restored.merchandise,undefined);
 assert.deepEqual(restored.inventory,s.inventory);assert.equal(merchandisePrice(restored,'soda'),1.75);
 assert.equal(merchandiseStock(restored,'pacoca'),0);
 ok(stockItem(restored,'soda'));assert.equal(restored.inventory.soda,23);
 assert.equal(restored.cash,1994.4);assert.equal(restored.expenses,5.6);
 assert.equal(categoryStock(restored,'soda'),23);
});
test('catalog progression and inflation keep independent stocks and preserve manual prices',()=>{
 const s=make();assert.equal(availableProducts(s).length,8);
 for(const p of PRODUCTS.filter(p=>p.year>1998))assert.equal(orderMerchandise(s,p.id,'basic').ok,false);
 const cost=quoteOrder(s,'chocolate','basic');ok(setMerchandisePrice(s,'chocolate',1.6));
 s.totalMinutes=22*360*720;assert.equal(availableProducts(s).length,12);
 assert.ok(quoteOrder(s,'chocolate','basic')>cost);assert.equal(merchandisePrice(s,'chocolate'),1.6);
 ok(orderMerchandise(s,'chocolate','basic'));assert.equal(merchandiseStock(s,'chocolate'),12);assert.equal(s.inventory.candy,15);
});
test('orders reject invalid quantities, insufficient cash, unavailable partner and capacity atomically',()=>{
 const s=make();
 for(const [id,supplier,n] of [['water','basic',0],['water','basic',1.5],['water','basic',NaN],['water','basic',51],['water','economy',2],['water','partner',1],['nope','basic',1]]){
  const before=JSON.stringify(s);assert.equal(orderMerchandise(s,id,supplier,n).ok,false);assert.equal(JSON.stringify(s),before);
 }
 s.cash=0;const before=JSON.stringify(s);assert.equal(orderMerchandise(s,'water','basic').ok,false);assert.equal(JSON.stringify(s),before);
 s.cash=2000;s.totalMinutes=GAME_LAST_MINUTE-1;assert.equal(orderMerchandise(s,'water','economy',3).ok,false);
});
test('prepaid delivery survives import, crosses month/year and never debits twice',()=>{
 let s=make();s.totalMinutes=360*720-100;
 ok(orderMerchandise(s,'water','economy',3));const paid=s.expenses,cash=s.cash;
 assert.equal(merchandiseStock(s,'water'),0);assert.equal(s.merchandise.orders.length,1);
 s=parseImportedSave(serializeSave(s));s.totalMinutes+=719;assert.deepEqual(receiveDueOrders(s),[]);
 s.totalMinutes++;assert.equal(receiveDueOrders(s).length,1);assert.equal(merchandiseStock(s,'water'),36);
 assert.equal(s.cash,cash);assert.equal(s.expenses,paid);assert.equal(s.merchandise.orders.length,0);
 assert.deepEqual(receiveDueOrders(s),[]);s=parseImportedSave(serializeSave(s));assert.deepEqual(receiveDueOrders(s),[]);
 assert.equal(merchandiseStock(s,'water'),36);
});
test('engine actually receives delivery on the calendar boundary',()=>{
 const s=make();ok(orderMerchandise(s,'pacoca','economy',3));s.totalMinutes=719;
 stepGame(s,1);assert.equal(merchandiseStock(s,'pacoca'),72);assert.equal(s.merchandise.orders.length,0);
 assert.ok(s.eventLog.some(l=>l.includes('Entrega recebida')));
});
test('supplier tradeoffs affect cash, quality, weighted cost and price acceptance',()=>{
 const normal=make(),quality=make(),economy=make(),partner=make();
 ok(orderMerchandise(normal,'water','basic'));ok(orderMerchandise(quality,'water','quality'));
 ok(orderMerchandise(economy,'water','economy',3));assert.equal(merchandiseStock(economy,'water'),0);
 economy.totalMinutes+=720;receiveDueOrders(economy);
 assert.ok(averageProductCost(economy,'water')<averageProductCost(normal,'water'));
 assert.ok(averageProductCost(quality,'water')>averageProductCost(normal,'water'));
 assert.equal(productQuality(quality,'water'),1.2);assert.ok(Math.abs(productQuality(economy,'water')-.92)<1e-9);
 const c=visitor(normal);ok(setMerchandisePrice(normal,'water',1.6));ok(setMerchandisePrice(quality,'water',1.6));
 assert.equal(acceptsProduct(normal,c,'water'),false);assert.equal(acceptsProduct(quality,c,'water'),true);
 ok(contractSupplier(partner));ok(orderMerchandise(partner,'water','partner'));
 assert.ok(averageProductCost(partner,'water')<averageProductCost(normal,'water'));
 assert.ok(partner.expenses>normal.expenses,'adhesion is not free money');
 const oldCost=averageProductCost(normal,'water');ok(orderMerchandise(normal,'water','quality'));
 assert.ok(Math.abs(averageProductCost(normal,'water')-(oldCost+averageProductCost(quality,'water'))/2)<1e-9);
 assert.ok(Math.abs(productQuality(normal,'water')-1.1)<1e-9);
});
test('real shopping route sells individual products once and consumes the correct needs',()=>{
 let s=make();s.inventory={soda:0,candy:0,snacks:0};ok(orderMerchandise(s,'water','basic'));ok(orderMerchandise(s,'cookies','basic'));
 const c=visitor(s);c.desiredItem=selectPurchase(c,s.inventory,s);assert.equal(c.desiredProduct,'water');s.customers=[c];s.nextCustomerId=902;
 const opening=s.cash,expenses=s.expenses;stepGame(s,1);
 assert.equal(c.wallet,19);assert.equal(c.purchasedDrink,true);assert.equal(c.desiredProduct,'cookies');
 assert.ok(c.needs.thirst<30);assert.equal(merchandiseStock(s,'water'),11);
 s=parseImportedSave(serializeSave(s));const loaded=s.customers.find(c=>c.id===901);
 for(let i=0;i<90&&loaded.stage!=='leaving';i++)stepGame(s,1);
 assert.equal(loaded.purchasedFood,true);assert.equal(merchandiseStock(s,'cookies'),11);
 assert.equal(s.purchases,2);assert.equal(s.revenue,2.75);assert.equal(s.expenses,expenses);assert.equal(round(s.cash-opening),2.75);
 assert.equal(s.merchandise.products.water.sold,1);assert.equal(s.merchandise.products.cookies.sold,1);
 assert.equal(loaded.retailConsumption.product,'cookies');assert.equal(loaded.wallet,17.25);
 assert.equal(selectPurchase(loaded,s.inventory,s),null);
});
test('two customers cannot buy the last item; repricing during queue is checked at service',()=>{
 for(const repriced of [false,true]){
  const s=make();s.inventory={soda:0,candy:0,snacks:0};ok(orderMerchandise(s,'water','basic'));s.merchandise.products.water.stock=1;
  const c=visitor(s);c.needs.hunger=0;c.desiredItem=selectPurchase(c,s.inventory,s);s.customers=[c];s.nextCustomerId=902;
  if(repriced)ok(setMerchandisePrice(s,'water',100));
  stepGame(s,1);assert.equal(s.purchases,repriced?0:1);
  const second=visitor(s,902);second.needs.hunger=0;second.desiredItem='soda';second.desiredProduct='water';s.customers=[second];s.nextCustomerId=903;
  stepGame(s,1);assert.equal(s.purchases,repriced?0:1);assert.equal(second.wallet,20);
 }
});
test('catalog selection respects budgets, preferences and no-stock, with no simulation RNG use',()=>{
 const s=make();s.inventory={soda:0,candy:0,snacks:0};ok(orderMerchandise(s,'gum','basic'));ok(orderMerchandise(s,'chocolate','quality'));
 const c=visitor(s),rng=s.rng;c.purchasedDrink=true;c.wallet=.5;
 assert.equal(chooseMerchandise(s,c,false),'gum');c.wallet=.24;assert.equal(chooseMerchandise(s,c,false),null);
 c.wallet=20;ok(setMerchandisePrice(s,'gum',100));ok(setMerchandisePrice(s,'chocolate',100));assert.equal(chooseMerchandise(s,c,false),null);assert.equal(s.rng,rng);
});
test('malformed merchandise and product/queue mismatch are rejected instead of corrupting recovery',()=>{
 const s=make();ok(orderMerchandise(s,'water','economy',3));
 const mutations=[v=>v.merchandise.orders.push({...v.merchandise.orders[0]}),v=>v.merchandise.orders[0].quantity=-1,v=>v.merchandise.orders[0].product='invalid',v=>v.merchandise.orders[0].dueMinute=Infinity,v=>v.merchandise.products.water={stock:NaN},v=>v.inventory=undefined];
 for(const mutate of mutations){const v=structuredClone(s);mutate(v);assert.equal(isValidSave(v),false);}
 const c=visitor(s);c.desiredItem='candy';c.desiredProduct='water';s.customers=[c];assert.equal(isValidSave(s),false);
});
test('stock display is bounded, caches unchanged arrays and removes sold-out identities',()=>{
 const s=make();s.inventory.soda=0;ok(orderMerchandise(s,'water','basic'));ok(orderMerchandise(s,'soda','basic'));
 const first=merchandiseDisplay(s,'soda');assert.equal(first.length,9);assert.ok(first.includes('water')&&first.includes('soda'));
 assert.equal(merchandiseDisplay(s,'soda'),first);s.inventory.soda=0;
 const next=merchandiseDisplay(s,'soda');assert.notEqual(next,first);assert.ok(next.every(id=>id==='water'));
 s.merchandise.products.water.stock=0;assert.deepEqual(merchandiseDisplay(s,'soda'),[]);
});
test('classic save keeps integer money after orders and new products, and exports correctly',()=>{
 const s=createGame(1);s.cash=2000;
 for(const supplier of ['basic','quality','economy'])ok(orderMerchandise(s,'gum',supplier,supplier==='economy'?3:1));
 assert.equal(Number.isInteger(s.cash),true);assert.equal(parseImportedSave(serializeSave(s)).cash,s.cash);
});
test('natural 7-day campaigns conserve cash and inventory; sales are limited by real visitors',()=>{
 const reports=[];
 for(const year of [1998,2005,2020,2030])for(const supplier of ['basic','economy','quality','partner']){
  const s=make(year);s.cash=20000;s.licensedGames=true;s.contentFilterInstalled=true;s.pcWindowsLicenses=[true,true,true];
  const opening=s.cash,initialStock=Object.values(s.inventory).reduce((a,b)=>a+b,0);let ordered=0;
  if(supplier==='partner')ok(contractSupplier(s));
  for(let day=0;day<7;day++){
   for(const p of availableProducts(s))if(merchandiseStock(s,p.id)<4&&!(s.merchandise?.orders??[]).some(o=>o.product===p.id)){
    const packs=supplier==='economy'?3:1;ok(orderMerchandise(s,p.id,supplier,packs));ordered+=packs*p.pack;
   }
   for(let minute=0;minute<720;minute+=60)stepGame(s,60);
   assert.equal(round(s.cash),round(opening+s.revenue-s.expenses));assert.ok(isValidSave(s));
  }
  const accounts=Object.values(s.merchandise.products),sold=accounts.reduce((n,a)=>n+a.sold,0),retailRevenue=accounts.reduce((n,a)=>n+a.revenue,0),cogs=accounts.reduce((n,a)=>n+a.costOfSales,0);
  const pending=s.merchandise.orders.reduce((n,o)=>n+o.quantity,0),remaining=PRODUCTS.reduce((n,p)=>n+merchandiseStock(s,p.id),0);
  assert.equal(initialStock+ordered,remaining+pending+sold);
  assert.equal(sold,s.purchases);assert.ok(sold<=2*(s.nextCustomerId-1));assert.ok(retailRevenue<=s.revenue+1e-6);
  assert.ok(retailRevenue-cogs>=0);assert.ok(retailRevenue-cogs<7*100*priceIndex(year),'gross retail margin stays below R$ 100/day in 1998 purchasing power');
  assert.equal(parseImportedSave(serializeSave(s)).cash,s.cash);
  reports.push({year,supplier,visitors:s.nextCustomerId-1,sold,retailRevenue:round(retailRevenue),grossMargin:round(retailRevenue-cogs),cash:round(s.cash),expenses:round(s.expenses)});
 }
 console.log('MERCHANDISE_CAMPAIGNS '+JSON.stringify(reports));
});

test('35-day starter businesses pay monthly bills while retail stays cash-backed',()=>{
 const reports=[];
 for(const supplier of ['basic','economy','quality','partner']){
  const s=createGame(1933,'historical'),opening=s.cash;
  s.licensedGames=true;s.contentFilterInstalled=true;s.pcWindowsLicenses=[true,true,true];
  if(supplier==='partner')ok(contractSupplier(s));
  for(let day=0;day<35;day++){
   for(const p of availableProducts(s))if(merchandiseStock(s,p.id)<4&&!(s.merchandise?.orders??[]).some(o=>o.product===p.id)){
    const packs=supplier==='economy'?3:1,quote=quoteOrder(s,p.id,supplier,packs);
    if(s.cash>=quote+500)ok(orderMerchandise(s,p.id,supplier,packs));
   }
   for(let minute=0;minute<720;minute+=60)stepGame(s,60);
   assert.equal(round(s.cash),round(opening+s.revenue-s.expenses));
  }
  assert.ok(s.lastPaidMonthlyBill,'monthly bills were actually settled');
  assert.ok(s.cash>0,'business can fund normal orders without a cash injection');
  assert.ok(s.purchases>0);assert.ok(isValidSave(s));
  reports.push({supplier,opening,closing:round(s.cash),revenue:round(s.revenue),expenses:round(s.expenses),purchases:s.purchases});
 }
 console.log('MERCHANDISE_MONTH '+JSON.stringify(reports));
});

test('existing supplier mail offer contributes its real cost without charging twice',()=>{
 const s=make();s.notices=[{id:'supplier-offer',title:'Proposta',body:'Lote',read:false,severity:'info'}];
 const old=s.inventory.soda,opening=s.cash,book=averageProductCost(s,'soda')*old;
 ok(chooseDecision(s,'supplier-offer','supplier-accept'));
 assert.equal(s.cash,opening-140);assert.equal(s.expenses,140);assert.equal(s.inventory.soda,old+35);
 assert.ok(Math.abs(averageProductCost(s,'soda')-(book+140)/(old+35))<1e-9);
 const unchanged=JSON.stringify(s);assert.equal(chooseDecision(s,'supplier-offer','supplier-accept').ok,false);assert.equal(JSON.stringify(s),unchanged);
});
