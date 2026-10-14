import test from "node:test";
import assert from "node:assert/strict";
import {createGame,stepGame} from "../dist/js/sim/engine.js";
import {selectPurchase,consumePurchase,chooseSessionMinutes} from "../dist/js/sim/needs.js";
import {vendingApproach} from "../dist/js/sim/layout.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";

function shopping(wallet=25){
 const s=createGame(1933),at=vendingApproach("soda");
 const c={id:901,...at,stage:"shopping",target:{...at},route:[],costume:"regular",
  pcIndex:null,usedMinutes:60,sessionMinutes:60,waitingMinutes:0,offlineWait:0,happy:true,
  needs:{thirst:90,hunger:90,energy:60},wallet,desiredItem:"soda"};
 s.customers=[c];s.nextCustomerId=902;s.reputation=10;s.pricePerHour=40;
 return {s,c};
}
test("cliente com sede e fome compra bebida e alimento pelo trajeto real",()=>{
 const {s,c}=shopping(),opening=s.cash,initial={...s.inventory};
 stepGame(s,1);
 assert.equal(c.stage,"shopping");assert.equal(c.desiredItem,"snacks");
 assert.equal(c.purchasedDrink,true);assert.equal(c.purchasedFood,undefined);
 assert.equal(c.wallet,17);assert.ok(c.needs.thirst<55);
 assert.deepEqual(c.route.at(-1)??c.target,vendingApproach("candy"));
 for(let i=0;i<80&&c.stage!=="leaving";i++)stepGame(s,1);
 assert.equal(c.stage,"leaving");assert.equal(c.purchasedFood,true);
 assert.equal(c.wallet,8);assert.equal(s.cash-opening,17);assert.equal(s.revenue,17);
 assert.equal(s.purchases,2);assert.equal(initial.soda-s.inventory.soda,1);
 assert.equal(initial.snacks-s.inventory.snacks,1);
 assert.deepEqual(s.saleEffects.map(e=>[e.item,e.amount]),[["soda",8],["snacks",9]]);
 // Mesmo que as necessidades cresçam no caminho de saída, não comprar outra vez.
 c.needs.thirst=100;c.needs.hunger=100;
 assert.equal(selectPurchase(c,s.inventory,s),null);
});
test("orçamento pessoal e preço de comida podem impedir a segunda compra",()=>{
 for(const mode of ["budget","price","stock"]){
  const {s,c}=shopping(mode==="budget"?8:25);
  if(mode==="price")s.retailPrices={soda:8,candy:40,snacks:40};
  if(mode==="stock")s.inventory.candy=s.inventory.snacks=0;
  stepGame(s,1);assert.equal(c.stage,"leaving");assert.equal(s.purchases,1);
  assert.equal(c.wallet,mode==="budget"?0:17);assert.equal(s.revenue,8);
 }
});
test("doces substituem salgadinhos esgotados sem cobrar duas vezes o alimento",()=>{
 const {s,c}=shopping();s.inventory.snacks=0;
 stepGame(s,1);assert.equal(c.desiredItem,"candy");
 for(let i=0;i<80&&c.stage!=="leaving";i++)stepGame(s,1);
 assert.equal(s.purchases,2);assert.equal(s.revenue,13);assert.equal(c.wallet,12);
 assert.equal(c.purchasedFood,true);
 c.needs.hunger=100;assert.equal(selectPurchase(c,s.inventory,s),null);
});
test("save entre compras conserva orçamento, destino e bebida já comprada",()=>{
 const {s,c}=shopping();stepGame(s,1);
 const loaded=parseImportedSave(serializeSave(s)),lc=loaded.customers.find(v=>v.id===c.id);
 assert.equal(lc.purchasedDrink,true);assert.equal(lc.wallet,17);
 assert.equal(lc.desiredItem,"snacks");
 for(let i=0;i<80&&lc.stage!=="leaving";i++)stepGame(loaded,1);
 assert.equal(loaded.purchases,2);assert.equal(loaded.revenue,17);
 assert.equal(lc.purchasedFood,true);assert.equal(lc.wallet,8);
});
test("pacotes 30/45/60/90 dependem de perfil e necessidades, sem alteração neste ajuste",()=>{
 const profiles=[{id:1,energy:30,thirst:20},{id:1,energy:60,thirst:20},
  {id:2,energy:80,thirst:20},{id:3,energy:95,thirst:22}];
 assert.deepEqual(profiles.map(p=>chooseSessionMinutes({...p,needs:{...p,hunger:30}})),[30,45,60,90]);
 const c={id:1,needs:{thirst:90,hunger:90,energy:50},wallet:25};
 consumePurchase(c,"soda");consumePurchase(c,"snacks");
 assert.equal(c.needs.thirst,35);assert.equal(c.needs.hunger,35);
 assert.equal(c.wallet,25,"consumo não debita a transação uma segunda vez");
});
