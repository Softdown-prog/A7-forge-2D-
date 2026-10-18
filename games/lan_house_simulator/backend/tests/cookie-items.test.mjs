import test from "node:test";
import assert from "node:assert/strict";
import {COOKIE_ITEMS,summarizeLedger,totalItemSpending} from "../../cookie-items.mjs";
test("catálogo de nove cosméticos tem preços aprovados em Cookies",()=>{
 assert.equal(Object.keys(COOKIE_ITEMS).length,9);
 assert.deepEqual(Object.fromEntries(Object.entries(COOKIE_ITEMS).map(([id,p])=>[id,p.cookies])),{
  "headset-rgb-neon":40,"chair-gamer-neon":50,
  "keyboard-rainbow-rgb":25,"neon-open-sign":30,
  "arcade-checker-floor":25,"exclusive-arcade-posters":12,
  "tony-cyber":60,"aquarium-rgb":45,"pixel-led-clock":30
 });
 assert.ok(Object.values(COOKIE_ITEMS).every(p=>Number.isSafeInteger(p.cookies)&&p.cookies>0));
});
test("histórico não mistura crédito, sandbox e resgates no total gasto",()=>{
 const activity=summarizeLedger([
  {id:"one",type:"item",delta:-40,itemId:"headset-rgb-neon",at:"2026-10-18T12:00:00Z"},
  {id:"two",type:"credit",delta:100,at:"2026-10-18T12:10:00Z",mode:"production"},
  {id:"three",type:"item",delta:-25,itemId:"keyboard-rainbow-rgb",at:{toDate:()=>new Date("2026-10-18T12:30:00Z")}}
 ]);
 assert.equal(totalItemSpending(activity),65);
 assert.equal(activity[2].at,"2026-10-18T12:30:00.000Z");
 assert.equal(activity[1].delta,100);
 assert.equal(totalItemSpending([]),0);
});
