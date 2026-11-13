import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame} from "../dist/js/sim/engine.js";
import {furnitureSlots} from "../dist/js/sim/furnitureLayout.js";
import {cameraForGame} from "../dist/js/render/isometric.js";
import {collectPs1Entries} from "../dist/js/render/scene/stations/ps1.js";
import {collectPs2Entries} from "../dist/js/render/scene/stations/ps2.js";
import {CONSOLE_PAINTERS,createConsoleRegistry,collectConsoleEntries} from "../dist/js/render/scene/stations/registry.js";

test("each console generation is registered independently and duplicates are rejected",()=>{
 assert.deepEqual([...CONSOLE_PAINTERS.keys()],["ps1","ps2"]);
 assert.strictEqual(CONSOLE_PAINTERS.get("ps1"),collectPs1Entries);
 assert.strictEqual(CONSOLE_PAINTERS.get("ps2"),collectPs2Entries);
 assert.throws(()=>createConsoleRegistry([["ps1",collectPs1Entries],["ps1",collectPs2Entries]]),/Duplicate console painter/);
});

test("PS1 and PS2 entries preserve scene depth and original registration order",()=>{
 const s=createGame(72421,"historical"),slots=furnitureSlots(s).filter(p=>p.surface==="floor");
 assert.ok(slots.length>=2,"real furniture slots required");
 s.ps1Stations=[{slotId:slots[0].id,wear:12,secondSeat:true}];
 s.ps2Stations=[{slotId:slots[1].id,wear:22,secondSeat:false,poweredOff:true}];
 const ctx={},camera=cameraForGame(s);
 const p1=collectPs1Entries(ctx,camera,s,10),p2=collectPs2Entries(ctx,camera,s,10);
 const together=collectConsoleEntries(ctx,camera,s,10);
 assert.equal(p1.length,1);assert.equal(p2.length,1);
 assert.deepEqual(together.map(e=>e.depth),[p1[0].depth,p2[0].depth]);
 for(const e of together){assert.ok(Number.isFinite(e.depth));assert.equal(typeof e.paint,"function");}
});

test("central SceneRenderer no longer knows PS1 or PS2 station wiring",()=>{
 const source=readFileSync(new URL("../src/render/scene.ts",import.meta.url),"utf8");
 assert.match(source,/collectConsoleEntries\(ctx,camera,s,elapsedSeconds\)/);
 for(const banned of ["ps1StationPoint","ps2StationPoint","drawPs1Station","drawPs2Station"])
  assert.equal(source.includes(banned),false,"console painter should be owned by its generation: "+banned);
});
