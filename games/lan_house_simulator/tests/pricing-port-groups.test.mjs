import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame} from "../dist/js/sim/engine.js";
import {createGamePorts} from "../dist/js/application/gamePorts.js";
import {createPricingPorts} from "../dist/js/application/portGroups/pricingPorts.js";

const camera=()=>({originX:0,originY:0,zoom:1});
const names=["promotionStatusPort","pricingInsightsPort","hourlyPriceStatusPort","retailPriceStatusPort","deskPricingPort","pricingPort"];

test("the pricing group keeps every public GamePorts adapter and method",()=>{
 const state=createGame(72421,"historical");
 const getState=()=>state;
 const ports=createGamePorts(getState,camera),group=createPricingPorts(getState);
 assert.deepEqual(Object.keys(group),names);
 for(const [name,port] of Object.entries(group)){
  assert.ok(Object.hasOwn(ports,name),"missing GamePorts."+name);
  assert.deepEqual(Object.keys(ports[name]).sort(),Object.keys(port).sort(),name+" public methods changed");
 }
 assert.deepEqual(ports.hourlyPriceStatusPort.snapshot(),group.hourlyPriceStatusPort.snapshot());
 assert.deepEqual(ports.retailPriceStatusPort.snapshot(),group.retailPriceStatusPort.snapshot());
 assert.deepEqual(ports.promotionStatusPort.snapshot(),group.promotionStatusPort.snapshot());
 assert.deepEqual(ports.pricingInsightsPort.hourly(),group.pricingInsightsPort.hourly());
});

test("pricing commands and projections follow the active campaign after replacement",()=>{
 let state=createGame(2026,"historical");
 state.pricePerHour=2;
 const old=state,getState=()=>state;
 const ports=createGamePorts(getState,camera);
 const before=ports.hourlyPriceStatusPort.snapshot();
 state=createGame(2027,"historical");
 state.pricePerHour=2;
 assert.equal(ports.pricingPort.changeHourly(1).ok,true);
 assert.equal(state.pricePerHour,2.5);
 assert.equal(old.pricePerHour,2,"old save must remain untouched");
 assert.notDeepEqual(ports.hourlyPriceStatusPort.snapshot(),before);
 const group=createPricingPorts(getState);
 assert.deepEqual(ports.hourlyPriceStatusPort.snapshot(),group.hourlyPriceStatusPort.snapshot());
 assert.deepEqual(ports.retailPriceStatusPort.snapshot(),group.retailPriceStatusPort.snapshot());
 assert.deepEqual(ports.promotionStatusPort.snapshot(),group.promotionStatusPort.snapshot());
});

test("pricing composition stays separate from game rules and presentation",()=>{
 const root=readFileSync(new URL("../src/application/gamePorts.ts",import.meta.url),"utf8");
 const group=readFileSync(new URL("../src/application/portGroups/pricingPorts.ts",import.meta.url),"utf8");
 assert.match(root,/createPricingPorts\(getState\)/);
 for(const factory of ["PromotionStatus","PricingInsights","HourlyPriceStatus","RetailPriceStatus","DeskPricing","Pricing"]){
  assert.match(group,new RegExp("create"+factory+"Port\\(getState\\)"));
  assert.doesNotMatch(root,new RegExp("create"+factory+"Port\\(getState\\)"),"gamePorts must not own individual pricing factories");
 }
 assert.doesNotMatch(group,/\b(?:window|document|localStorage|CanvasRenderingContext2D)\b/);
 assert.doesNotMatch(group,/getState\(\)/,"pricing group must not read or cache the current state");
});
