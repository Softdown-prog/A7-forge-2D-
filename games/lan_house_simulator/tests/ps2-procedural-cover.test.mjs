import test from "node:test";
import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
import {PS2_GAME_CATALOG} from "../dist/js/sim/ps2.js";
import {PS1_CD_CATALOG} from "../dist/js/sim/ps1.js";
import {ps2ProceduralCover} from "../dist/js/ui/ps2CoverArt.js";
import {projectPs2Game} from "../dist/js/ui/shopConsoleAngularProjection.js";
import {renderPs2ShopCatalog} from "../dist/js/ui/ps2Panels.js";

function canvasHarness(){
 let created=0;
 return {
  count:()=>created,
  doc:{createElement(tag){
   assert.equal(tag,"canvas");created++;
   const calls=[];
   const gradient={addColorStop(...args){calls.push(["stop",...args]);}};
   const ctx=new Proxy({},{
    set(_target,k,value){calls.push(["set",String(k),String(value)]);return true;},
    get(_target,k){
     if(k==="createLinearGradient")return (...args)=>{calls.push(["gradient",...args]);return gradient;};
     if(k==="measureText")return text=>({width:String(text).length*29});
     return (...args)=>calls.push([String(k),...args]);
    }
   });
   return {width:0,height:0,getContext(mime){assert.equal(mime,"2d");return ctx;},
    toDataURL(mime){assert.equal(mime,"image/png");
     return "data:image/png;base64,"+Buffer.from(JSON.stringify(calls)).toString("base64");}};
  }}
 };
}
test("five existing PS2 titles have distinct original, deterministic, cached 420x560 covers",()=>{
 assert.equal(PS2_GAME_CATALOG.length,5);
 const h=canvasHarness();
 const images=PS2_GAME_CATALOG.map(g=>ps2ProceduralCover(g,h.doc));
 assert.equal(images.length,5);
 assert.equal(new Set(images).size,5,"each game must show a different original drawing");
 assert.ok(images.every(v=>v.startsWith("data:image/png;base64,")));
 assert.equal(h.count(),5);
 for(let i=0;i<images.length;i++)assert.equal(ps2ProceduralCover(PS2_GAME_CATALOG[i],h.doc),images[i]);
 assert.equal(h.count(),5,"reopening shop must not rerasterize artworks");
});
test("headless or disabled Canvas retains a checked-in SVG for every PS2 game",()=>{
 for(const game of PS2_GAME_CATALOG){
  const fallback="assets/ps2/covers/"+game.id+".svg";
  assert.ok(existsSync(new URL("../"+fallback,import.meta.url)),fallback);
  assert.ok(existsSync(new URL("../dist/"+fallback,import.meta.url)),
   "production game build must include local PS2 cover: "+fallback);
  const source=readFileSync(new URL("../"+fallback,import.meta.url),"utf8");
  assert.match(source,/viewBox="0 0 420 560"/);
  assert.match(source,/<svg\b/);
  assert.equal(ps2ProceduralCover({...game,title:game.title+" headless"},{createElement:()=>({})}),fallback);
 }
});
test("unsafe and unknown ids cannot construct arbitrary relative asset paths",()=>{
 assert.equal(ps2ProceduralCover({id:"../secret",title:"Secret",genre:"Other"},{createElement:()=>({})}),
  "assets/ps2/covers/cidade-em-fuga.svg");
 assert.equal(ps2ProceduralCover({id:"not-a-game",title:"Unknown",genre:"Other"},{createElement:()=>({})}),
  "assets/ps2/covers/cidade-em-fuga.svg");
});
test("Angular shop projects each existing game with original cover and same price/button",()=>{
 for(const game of PS2_GAME_CATALOG){
  const row={...game,copies:1,price:99.5,disabled:false,buyText:"Comprar jogo"};
  const view=projectPs2Game(row);
  assert.equal(view.id,game.id);assert.equal(view.title,game.title);assert.equal(view.genre,game.genre);
  assert.equal(view.copies,1);assert.equal(view.disabled,false);
  assert.match(view.buttonText,/R\$\s*99,50/);
  assert.ok(view.cover==="assets/ps2/covers/"+game.id+".svg"||
   view.cover?.startsWith("data:image/png;base64,"),
   "a previously cached original PNG or the checked-in SVG is valid");
 }
 const projection=readFileSync(new URL("../src/ui/shopConsoleAngularProjection.ts",import.meta.url),"utf8");
 assert.match(projection,/cover:ps2ProceduralCover\(row\)/);
 const template=readFileSync(new URL("../frontend-angular/src/templates/shop-catalog.html",import.meta.url),"utf8");
 assert.match(template,/class="angular-ps2-cover"/);
});
test("native shop has one portrait image per PS2 title, no generic game thumbnail",()=>{
 class Node {
  constructor(tag){this.tagName=tag;this.children=[];this.attrs={};this.dataset={};this.disabled=false;}
  append(...elements){this.children.push(...elements);}
  setAttribute(k,v){this.attrs[k]=v;}
  getContext(){return null;}
 }
 const doc={createElement:tag=>new Node(tag)};
 const host=new Node("section");
 const port={snapshot(){return {benchDisabled:true,benchText:"Disponível em 2006",benchPrice:980,slots:[],
  games:PS2_GAME_CATALOG.map(g=>({...g,price:100,copies:0,disabled:true,buyText:"Disponível em 2006"}))};}};
 renderPs2ShopCatalog(host,port,doc);
 assert.equal(host.children.length,7,"heading, PS2 console and five games");
 for(let i=0;i<PS2_GAME_CATALOG.length;i++){
  const card=host.children[i+2],cover=card.children[0],game=PS2_GAME_CATALOG[i];
  assert.equal(cover.tagName,"img");
  assert.equal(cover.className,"ps2-game-cover");
  assert.ok(cover.src==="assets/ps2/covers/"+game.id+".svg"||
   cover.src.startsWith("data:image/png;base64,"),
   "native card uses cached procedural PNG or the local SVG fallback");
  assert.equal(cover.width,420);assert.equal(cover.height,560);
  assert.match(cover.alt,new RegExp(game.title));
  assert.equal(card.children.at(-1).disabled,true,"visual change must not unlock game");
 }
});
test("PS1 retains the five original physical games and covers during future catalog expansions",()=>{
 assert.ok(PS1_CD_CATALOG.length>=5);
 assert.deepEqual(PS1_CD_CATALOG.slice(0,5).map(g=>g.id),[
  "turbo-circuito","gol-de-rua","ilha-dos-cristais","luta-neon","cosmo-blocos"
 ]);
 for(const game of PS1_CD_CATALOG){
  assert.ok(existsSync(new URL("../assets/ps1/covers/"+game.id+".svg",import.meta.url)));
 }
});
