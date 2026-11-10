import assert from "node:assert/strict";
import test from "node:test";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {isValidSave as validateSaveDirectly} from "../dist/js/sim/saveValidation.js";
import {
 SHOP_CATALOG,shopPrice,buyComputer,nextComputerPlacementIssue,
 buyFurniture,availablePlacementSlots,placeFurniture,validFurniturePlacements,
 removeFurniture,relocateFurniture,rotateFurniture
} from "../dist/js/sim/shop.js";
import {SHOP_CATALOG as catalogDirectly} from "../dist/js/sim/shop/catalog.js";
import {shopPrice as priceDirectly} from "../dist/js/sim/shop/pricing.js";
import {buyComputer as buyComputerDirectly,nextComputerPlacementIssue as placementIssueDirectly} from "../dist/js/sim/shop/computers.js";
import * as furniture from "../dist/js/sim/shop/furniture.js";

test("a fachada da loja preserva referências e preços dos módulos especializados",()=>{
 assert.strictEqual(SHOP_CATALOG,catalogDirectly);
 assert.strictEqual(shopPrice,priceDirectly);
 assert.strictEqual(buyComputer,buyComputerDirectly);
 assert.strictEqual(nextComputerPlacementIssue,placementIssueDirectly);
 const state=createGame();
 assert.equal(shopPrice(state,"computer"),320);
 assert.ok(SHOP_CATALOG.some(item=>item.id==="computer"));
 assert.ok(SHOP_CATALOG.some(item=>item.id==="poster"));
});

test("a fachada de móveis preserva todas as operações públicas",()=>{
 for(const [name,fn] of Object.entries({
  buyFurniture,availablePlacementSlots,placeFurniture,validFurniturePlacements,
  removeFurniture,relocateFurniture,rotateFurniture
 }))assert.strictEqual(fn,furniture[name],name);
});

test("o validador extraído mantém o contrato público do engine",()=>{
 assert.strictEqual(isValidSave,validateSaveDirectly);
 const valid=createGame();
 assert.equal(isValidSave(valid),true);
 const invalid={...valid,inventory:{...valid.inventory,soda:Number.POSITIVE_INFINITY}};
 assert.equal(isValidSave(invalid),false);
});
