import test from "node:test";
import assert from "node:assert/strict";
import {sourceGraph} from "./helpers/sourceGraph.mjs";
import {featureBoundaryViolations,importSpecifiers} from "./helpers/featureBoundaries.mjs";

test("all tracked game source features remain independent",()=>{
 const graph=sourceGraph();
 assert.ok(graph.size>=400,"unexpectedly small TS source scan: "+graph.size);
 const files=new Map([...graph].map(([name,entry])=>[name,entry.text]));
 assert.deepEqual(featureBoundaryViolations(files),[]);
});

test("guard catches cross-family imports, sibling artists and cross-story dependencies",()=>{
 const files=new Map([
  ["render/posters/arcade.ts",'import {draw} from "../retail/vending.js";'],
  ["render/actors/clown.ts",'const other=await import("./vampire.js");'],
  ["render/posters/golf.ts",'export {art} from "./city.js";'],
  ["sim/stories/definitions/roof-leak.ts",'import "./neighbor-noise.js";'],
  ["render/scene/stations/ps1.ts",'import {x} from "./ps2.js";']
 ]);
 const violations=featureBoundaryViolations(files);
 assert.equal(violations.length,5,violations.join("\n"));
 assert.ok(violations.some(v=>v.includes("independent render families")));
 assert.ok(violations.some(v=>v.includes("actor appearance")));
 assert.ok(violations.some(v=>v.includes("poster artwork")));
 assert.ok(violations.some(v=>v.includes("story definition")));
 assert.ok(violations.some(v=>v.includes("console generations")));
});

test("side-effect, dynamic, re-export, single and double quote imports are scanned",()=>{
 const imports=importSpecifiers(
  'import "./a.js"; export * from \'./b.js\'; const x=import("./c.js"); '+
  'import type {Foo} from "./d.js"; const y=require("./e.js"); import z from "external";'
 );
 assert.deepEqual(imports,["./a.js","./b.js","./c.js","./d.js","./e.js","external"]);
 assert.deepEqual(featureBoundaryViolations(new Map([
  ["render/retail/soda.ts",'import "./../computers/crtMonitor.js";'],
  ["render/computers/lcdMonitor.ts",'const fn=import("../posters/arcade.js");']
 ])).length,2);
});

test("common root adapters and shared helpers remain valid dependencies",()=>{
 const files=new Map([
  ["render/posters/arcade.ts",'import type {PosterDesign} from "./types.js"; import {p} from "./crtScene.js";'],
  ["render/posters/registry.ts",'import {art} from "./arcade.js";'],
  ["render/actors/female-bob.ts",'import {f} from "./femaleRig.js";'],
  ["render/scene.ts",'import {p} from "./posters/arcade.js"; import {r} from "./retail/vending.js";'],
  ["sim/stories/definitions/roof-leak.ts",'import {choice} from "../builders.js";'],
  ["render/scene/stations/registry.ts",'import {a} from "./ps1.js"; import {b} from "./ps2.js";']
 ]);
 assert.deepEqual(featureBoundaryViolations(files),[]);
});
