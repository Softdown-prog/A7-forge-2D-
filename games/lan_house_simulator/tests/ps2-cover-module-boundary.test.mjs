import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";
import {PS2_GAME_CATALOG} from "../dist/js/sim/ps2.js";
import {PS2_COVER_DRAWINGS} from "../dist/js/ui/ps2Covers/registry.js";
import {ps2ProceduralCover} from "../dist/js/ui/ps2CoverArt.js";

const folder=new URL("../src/ui/ps2Covers/",import.meta.url);
const ids=PS2_GAME_CATALOG.map(row=>row.id);

test("PS2 has one procedural Canvas painter for each of its 15 games",()=>{
 assert.equal(ids.length,15);
 assert.equal(new Set(ids).size,15);
 const painters=readdirSync(folder).filter(n=>n.endsWith(".ts")&&!["registry.ts","primitives.ts"].includes(n));
 assert.deepEqual(painters.sort(),ids.map(id=>id+".ts").sort());
 assert.deepEqual(Object.keys(PS2_COVER_DRAWINGS).sort(),[...ids].sort());
 for(const id of ids){
  assert.equal(typeof PS2_COVER_DRAWINGS[id],"function","game lacks own painter: "+id);
  const source=readFileSync(new URL(id+".ts",folder),"utf8");
  assert.match(source,/export function paint[A-Za-z0-9]+\((?:c|ctx):CanvasRenderingContext2D\):void\{/);
  assert.ok(source.includes("c"),"empty art file: "+id);
 }
 assert.equal(Object.isFrozen(PS2_COVER_DRAWINGS),true);
});

test("PS2 cover public API preserves cached PNG rendering and safe SVG fallback",()=>{
 const source=readFileSync(new URL("../src/ui/ps2CoverArt.ts",import.meta.url),"utf8");
 assert.match(source,/PS2_COVER_DRAWINGS\[game\.id\]/);
 assert.match(source,/typeof painter==="function"/);
 assert.match(source,/cache\.get\(key\)/);
 assert.match(source,/data:image\/png;base64/);
 for(const game of PS2_GAME_CATALOG){
  assert.equal(ps2ProceduralCover(game,{createElement:()=>({})}),"assets/ps2/covers/"+game.id+".svg");
 }
 assert.equal(ps2ProceduralCover({id:"../invalid",title:"Unknown",genre:"Other"},{createElement:()=>({})}),"assets/ps2/covers/cidade-em-fuga.svg");
});
