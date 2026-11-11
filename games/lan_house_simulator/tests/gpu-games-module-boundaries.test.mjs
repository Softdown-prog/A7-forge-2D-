import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import * as gpuGames from "../dist/js/sim/gpuGames.js";
import * as catalog from "../dist/js/sim/gpuGames/catalog.js";
import * as compatibility from "../dist/js/sim/gpuGames/compatibility.js";
import * as downloads from "../dist/js/sim/gpuGames/downloads.js";
import * as licensing from "../dist/js/sim/gpuGames/licensing.js";
import * as visitors from "../dist/js/sim/gpuGames/visitors.js";
import {createGame} from "../dist/js/sim/engine.js";

test("GPU game facade preserves the exact public functions and catalog by identity",()=>{
 const modules=[catalog,compatibility,downloads,licensing,visitors];
 const merged=Object.assign({},...modules);
 assert.deepEqual(Object.keys(gpuGames).sort(),Object.keys(merged).sort());
 for(const [key,value] of Object.entries(merged))
  assert.strictEqual(gpuGames[key],value,key+" is a facade re-export, not a duplicate implementation");
});

test("catalog and download modules can be consumed without the original mega-module",()=>{
 const s=createGame(2005,"historical"),before=JSON.stringify(s);
 assert.deepEqual(catalog.GPU_GAME_CATALOG.map(g=>g.year),[2005,2009,2013]);
 for(const title of catalog.GPU_GAME_CATALOG){
  assert.strictEqual(catalog.gpuGameSpec(title.id),title);
  assert.ok(downloads.gpuGameInstallDuration(s,title.id)>=5);
 }
 assert.equal(downloads.gpuGameInstallJob(s,0),undefined);
 assert.ok(gpuGames.gpuGameSessionPrice(s,0,30,false)>=0);
 assert.equal(JSON.stringify(s),before,"catalog, quote and price reads must not mutate saves");
});

test("modular GPU facade has no stale implementations or duplicated catalog",()=>{
 const src=readFileSync(new URL("../src/sim/gpuGames.ts",import.meta.url),"utf8");
 for(const name of ["gpuGameCompatible","tickGpuGameInstallations","quoteGpuGame","gpuGameSessionPrice"])
  assert.doesNotMatch(src,new RegExp("function\\s+"+name+"\\s*\\("),name+" belongs to its own module");
 assert.doesNotMatch(src,/\bGPU_GAME_CATALOG\s*=\s*\[/);
});
