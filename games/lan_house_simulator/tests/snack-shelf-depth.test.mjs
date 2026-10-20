import test from "node:test";
import assert from "node:assert/strict";
import {RETAIL_DISPLAY_CAPACITY,snackShelfBagStyle,snackShelfPlacement,visibleRetailStock} from "../dist/js/render/retailArt.js";
import {createGame} from "../dist/js/sim/engine.js";
import {merchandiseDisplay} from "../dist/js/render/merchandiseDisplay.js";

test("classic chips display five distinct colorways even when stocked as one SKU",()=>{
 const styles=Array.from({length:5},(_,i)=>snackShelfBagStyle("snacks",i));
 assert.equal(new Set(styles.map(s=>s.color)).size,5);
 assert.ok(styles.every(s=>s.label==="CROC"&&s.flavour.length>0));
 assert.deepEqual(styles.map(s=>s.color),Array.from({length:5},(_,i)=>snackShelfBagStyle("snacks",i).color));
 assert.equal(snackShelfBagStyle("cookies",2).label,"BISC");
 assert.equal(snackShelfBagStyle("wholegrain",4).label,"INT");
});
test("two depth rows fit within the original rack footprint without extra units",()=>{
 const slots=Array.from({length:5},(_,i)=>snackShelfPlacement(i));
 assert.equal(slots.filter(s=>s.x>.30).length,3);
 assert.equal(slots.filter(s=>s.x<.30).length,2);
 for(const slot of slots){
  assert.ok(slot.x-slot.depth>=.035&&slot.x<=.46-.03,"rack depth bounds");
  assert.ok(slot.y>=.035&&slot.y+slot.span<=1.22-.035,"rack width bounds");
 }
 assert.equal(RETAIL_DISPLAY_CAPACITY.snacks,4*slots.length);
 assert.equal(visibleRetailStock(1,RETAIL_DISPLAY_CAPACITY.snacks),1);
 assert.equal(visibleRetailStock(200,RETAIL_DISPLAY_CAPACITY.snacks),20);
 assert.throws(()=>snackShelfPlacement(5),RangeError);
});
test("visual bag variations never modify inventory, save or product identity",()=>{
 const state=createGame(1998),before=JSON.stringify(state);
 const display=merchandiseDisplay(state,"snacks");
 assert.equal(display.length,Math.min(20,state.inventory.snacks));
 display.forEach((id,i)=>snackShelfBagStyle(id,i));
 assert.equal(JSON.stringify(state),before);
 assert.ok(display.every(id=>id==="snacks"));
 state.inventory.snacks=0;
 assert.deepEqual(merchandiseDisplay(state,"snacks"),[]);
});
