import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {PS1_CD_CATALOG} from "../dist/js/sim/ps1.js";
import {ps1ProceduralCover} from "../dist/js/ui/ps1CoverArt.js";
import {projectPs1Disc} from "../dist/js/ui/shopConsoleAngularProjection.js";

function canvasHarness(){
 let creations=0;
 const doc={createElement(tag){
  assert.equal(tag,"canvas");creations++;
  const calls=[];
  const gradient={addColorStop(...args){calls.push(["stop",...args]);}};
  const ctx=new Proxy({},{
   set(_target,key,value){calls.push(["set",String(key),String(value)]);return true;},
   get(_target,key){
    if(key==="createLinearGradient")return (...args)=>{calls.push(["gradient",...args]);return gradient;};
    if(key==="measureText")return value=>({width:String(value).length*27});
    return (...args)=>{calls.push([String(key),...args]);};
   }
  });
  return {
   width:0,height:0,
   getContext(kind){assert.equal(kind,"2d");return ctx;},
   toDataURL(mime){
    assert.equal(mime,"image/png");
    return "data:image/png;base64,"+Buffer.from(JSON.stringify(calls)).toString("base64");
   }
  };
 }};
 return {doc,count:()=>creations};
}
test("all yearly procedural covers are distinct, deterministic and cached",()=>{
 const {doc,count}=canvasHarness();
 const all=PS1_CD_CATALOG.map(d=>ps1ProceduralCover(d,doc));
 assert.equal(all.length,13);
 assert.equal(new Set(all).size,PS1_CD_CATALOG.length,"different games need visibly different drawings");
 assert.ok(all.every(x=>x.startsWith("data:image/png;base64,")));
 assert.equal(count(),13,"one rasterization per game");
 for(let i=0;i<all.length;i++){
  assert.equal(ps1ProceduralCover(PS1_CD_CATALOG[i],doc),all[i]);
 }
 assert.equal(count(),13,"shop refresh must not repaint cached images");
});
test("without browser Canvas, fallback remains the original checked-in SVG art",()=>{
 for(const disc of PS1_CD_CATALOG){
  const expected="assets/ps1/covers/"+disc.id+".svg";
  assert.equal(ps1ProceduralCover({...disc,title:disc.title+" headless"},{createElement:()=>({})}),expected);
  assert.ok(existsSync(new URL("../"+expected,import.meta.url)),expected+" must exist");
 }
});
test("an unexpected disc id never creates an untrusted asset path",()=>{
 const fake={id:"../secret",title:"Unknown",genre:"Other"};
 assert.equal(ps1ProceduralCover(fake,{createElement:()=>({})}),
  "assets/ps1/covers/cosmo-blocos.svg");
});
test("real Angular catalogue projects the same UI-only cover generator",()=>{
 const source=readFileSync(new URL("../src/ui/shopConsoleAngularProjection.ts",import.meta.url),"utf8");
 assert.match(source,/cover:row\.magazineLocked\?null:ps1ProceduralCover\(row\)/);
 assert.match(readFileSync(new URL("../src/ui/ps1ShopDiscCatalog.ts",import.meta.url),"utf8"),
  /cover\.src=ps1ProceduralCover\(disc,doc\)/);
 const row={...PS1_CD_CATALOG[0],title:"Turbo Circuito headless projection",copies:0,disabled:false,noStation:false,magazineLocked:false,full:false,price:44};
 const view=projectPs1Disc(row);
 assert.equal(view.cover,"assets/ps1/covers/turbo-circuito.svg",
  "headless runs keep the same relative static fallback");
 const hidden=projectPs1Disc({...row,magazineLocked:true,disabled:true});
 assert.equal(hidden.cover,null,"unknown PS1 title must not generate a cover");
 assert.equal(hidden.title,"Jogo não revelado");
});
