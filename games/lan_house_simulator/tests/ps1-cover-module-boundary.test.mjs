import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";
import {PS1_CD_CATALOG} from "../dist/js/sim/ps1.js";
import {PS1_COVER_DRAWINGS} from "../dist/js/ui/ps1Covers/registry.js";
import {ps1ProceduralCover} from "../dist/js/ui/ps1CoverArt.js";

const folder=new URL("../src/ui/ps1Covers/",import.meta.url);
const ids=PS1_CD_CATALOG.map(row=>row.id);

test("PS1 cover modules match all 13 real catalogue entries without duplicates",()=>{
 assert.equal(ids.length,13);
 assert.equal(new Set(ids).size,13);
 const drawings=readdirSync(folder).filter(n=>n.endsWith(".ts")&&!["registry.ts","primitives.ts"].includes(n));
 assert.deepEqual(drawings.sort(),ids.map(id=>id+".ts").sort());
 assert.deepEqual(Object.keys(PS1_COVER_DRAWINGS).sort(),[...ids].sort());
 for(const id of ids){
  assert.equal(typeof PS1_COVER_DRAWINGS[id],"function",id+" has a painter");
  const source=readFileSync(new URL(id+".ts",folder),"utf8");
  assert.match(source,/export function paint[A-Za-z0-9]+\(ctx:CanvasRenderingContext2D\):void\{/);
  assert.ok(source.includes("ctx"),"painter cannot be empty: "+id);
 }
 assert.equal(Object.isFrozen(PS1_COVER_DRAWINGS),true);
});

test("public PS1 cover API still uses the per-game renderer and secure SVG fallback",()=>{
 const source=readFileSync(new URL("../src/ui/ps1CoverArt.ts",import.meta.url),"utf8");
 assert.match(source,/PS1_COVER_DRAWINGS\[disc\.id\]/);
 assert.match(source,/typeof art==="function"/);
 assert.match(source,/cache\.get\(key\)/);
 assert.match(source,/data:image\/png;base64/);
 for(const disc of PS1_CD_CATALOG){
  const fallback=ps1ProceduralCover(disc,{createElement:()=>({})});
  assert.equal(fallback,"assets/ps1/covers/"+disc.id+".svg");
 }
 assert.equal(ps1ProceduralCover({id:"../invalid",title:"Other",genre:"Other"},{createElement:()=>({})}),
  "assets/ps1/covers/cosmo-blocos.svg");
});
