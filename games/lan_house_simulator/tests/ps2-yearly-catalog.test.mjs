import test from "node:test";
import assert from "node:assert/strict";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {PS2_GAME_CATALOG,ps2ReleasedGames,ps2GamePrice,buyPs2Station,buyPs2Game,
 ps2GameCopies,ps2PlacementSlots,setPs2StationGame,ps2PlayableGame} from "../dist/js/sim/ps2.js";
import {createPs2Port} from "../dist/js/application/ps2Port.js";
import {parseImportedSave,serializeSave} from "../dist/js/sim/saveTransfer.js";
import {projectPs2Game} from "../dist/js/ui/shopConsoleAngularProjection.js";
import {readFileSync,existsSync} from "node:fs";

function state(year){
 const s=createGame(2010,"historical");
 s.totalMinutes=(year-1998)*360*DAY_MINUTES;
 s.cash=15000;
 return s;
}
function installed(year){
 const s=state(year),slot=ps2PlacementSlots(s)[0];
 assert.ok(slot,"real game should have room for PS2");
 assert.equal(buyPs2Station(s,slot.id).ok,true);
 return s;
}
const timeline=[[2005,0,null],[2006,7,2007],[2007,9,2008],[2008,11,2009],
 [2009,13,2010],[2010,15,null],[2011,15,null],[2030,15,null]];
test("five legacy PS2 releases remain; two more games yearly 2006–2010",()=>{
 assert.equal(PS2_GAME_CATALOG.length,15);
 assert.equal(new Set(PS2_GAME_CATALOG.map(g=>g.id)).size,15);
 assert.deepEqual(PS2_GAME_CATALOG.slice(0,5).map(g=>g.id),[
  "cidade-em-fuga","arena-dos-guardioes","futsal-de-bairro","cosmos-2006","batida-de-rua"
 ]);
 for(const [year,count,next] of timeline){
  const released=ps2ReleasedGames(year),port=createPs2Port(()=>state(year));
  const view=port.snapshot();
  assert.equal(released.length,count,"released PS2 games in "+year);
  assert.equal(view.games.length,count,"real shop in "+year);
  assert.equal(view.nextReleaseYear,next,"next promised year in "+year);
  assert.deepEqual(view.games.map(g=>g.id),released.map(g=>g.id));
  assert.ok(view.games.every(g=>g.releaseYear<=year));
 }
 for(const [year,expected] of [[2006,7],[2007,2],[2008,2],[2009,2],[2010,2]])
  assert.equal(PS2_GAME_CATALOG.filter(g=>g.releaseYear===year).length,expected);
 assert.equal(PS2_GAME_CATALOG.some(g=>g.releaseYear>2010),false);
});
test("future PS2 titles cannot be purchased or equipped by bypassing shop UI",()=>{
 const s=installed(2006);
 const initial=JSON.stringify(s);
 for(const game of PS2_GAME_CATALOG.filter(g=>g.releaseYear>2006)){
  const result=buyPs2Game(s,game.id);
  assert.equal(result.ok,false,"blocked "+game.title);
  assert.match(result.message,new RegExp(String(game.releaseYear)));
  assert.equal(setPs2StationGame(s,0,game.id).ok,false);
  assert.equal(ps2GamePrice(s,game.id),0);
 }
 assert.equal(JSON.stringify(s),initial,"blocked requests must not change saved game");
 assert.equal(isValidSave(s),true);
});
test("each annual launch can be bought, played and retained across actual save import",()=>{
 for(const year of [2006,2007,2008,2009,2010]){
  const s=installed(year);
  const launches=PS2_GAME_CATALOG.filter(g=>g.releaseYear===year);
  assert.ok(launches.length>=2);
  for(const game of launches){
   const quote=ps2GamePrice(s,game.id);
   assert.ok(quote>0);
   assert.equal(quote,game.basePrice,"each new launch is priced in its own year");
   const beforeCash=s.cash,beforeExpenses=s.expenses;
   const result=buyPs2Game(s,game.id);
   assert.equal(result.ok,true,result.message);
   assert.equal(Math.round((beforeCash-s.cash)*100),Math.round(quote*100));
   assert.equal(Math.round((s.expenses-beforeExpenses)*100),Math.round(quote*100));
   assert.equal(ps2GameCopies(s,game.id),1);
   assert.equal(setPs2StationGame(s,0,game.id).ok,true);
   assert.equal(ps2PlayableGame(s,0),game.id);
   assert.equal(isValidSave(s),true);
   const imported=parseImportedSave(serializeSave(s));
   assert.equal(isValidSave(imported),true);
   assert.equal(ps2PlayableGame(imported,0),game.id);
   assert.equal(createPs2Port(()=>imported).snapshot().stations[0].gameName,game.title);
  }
 }
});
test("PS2 save validation rejects unreleased disc inventory even if the user forges the ID",()=>{
 const s=installed(2006);
 assert.equal(buyPs2Game(s,"cidade-em-fuga").ok,true);
 assert.equal(isValidSave(s),true);
 s.ps2Games["batidas-do-futuro"]=1;
 assert.equal(isValidSave(s),false,"2010 stock is impossible in 2006");
 assert.throws(()=>parseImportedSave(serializeSave(s)));
 s.totalMinutes=(2010-1998)*360*DAY_MINUTES;
 assert.equal(isValidSave(s),true,"same stock becomes valid in its release year");
 const imported=parseImportedSave(serializeSave(s));
 assert.equal(imported.ps2Games["batidas-do-futuro"],1);
});
test("previously owned PS2 titles remain playable after 2010, without adding phantom unlocks",()=>{
 const s=installed(2006);
 assert.equal(buyPs2Game(s,"pistas-da-montanha").ok,true);
 s.totalMinutes=(2030-1998)*360*DAY_MINUTES;
 assert.equal(ps2PlayableGame(s,0),"pistas-da-montanha");
 assert.equal(isValidSave(s),true);
 assert.equal(createPs2Port(()=>s).snapshot().games.length,15);
 assert.equal(createPs2Port(()=>s).snapshot().nextReleaseYear,null);
});
test("all PS2 covers and visual scenes correspond to a released, original catalogue entry",()=>{
 const assets=new Set();
 for(const g of PS2_GAME_CATALOG){
  const filename="../assets/ps2/covers/"+g.id+".svg";
  assert.ok(existsSync(new URL(filename,import.meta.url)),filename);
  const svg=readFileSync(new URL(filename,import.meta.url),"utf8");
  assert.match(svg,new RegExp(String(g.releaseYear)));
  assert.match(svg,/viewBox="0 0 420 560"/);
  assets.add(filename);
  const row={...g,price:g.basePrice,copies:0,disabled:false,buyText:"Comprar jogo"};
  const angular=projectPs2Game(row);
  assert.equal(angular.releaseYear,g.releaseYear);
  assert.ok(angular.cover?.includes(g.id)||angular.cover?.startsWith("data:image/png;base64,"));
 }
 assert.equal(assets.size,PS2_GAME_CATALOG.length);
 const template=readFileSync(new URL("../frontend-angular/src/templates/shop-catalog.html",import.meta.url),"utf8");
 assert.match(template,/ps2\.nextReleaseYear/);
 assert.match(template,/game\.releaseYear/);
});
