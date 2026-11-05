import test from "node:test";
import assert from "node:assert/strict";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {PS1_CD_CATALOG,PS1_MAX_STATIONS,ps1ReleasedDiscs,
 buyPs1Station,ps1PlacementSlots,buyPs1Disc,setPs1StationDisc,ps1PlayableDisc,
 ps1DiscPrice} from "../dist/js/sim/ps1.js";
import {createPs1ShopDiscPort} from "../dist/js/application/ps1ShopDiscPort.js";
import {createPs1AdminPort} from "../dist/js/application/ps1AdminPort.js";
import {parseImportedSave,serializeSave} from "../dist/js/sim/saveTransfer.js";

const years=[[2001,0],[2002,7],[2003,9],[2004,11],[2005,13],[2006,13],[2030,13]];
function state(year){
 const s=createGame(21019,"historical");
 s.totalMinutes=(year-1998)*360*DAY_MINUTES;
 s.cash=10000;
 return s;
}
function installed(year){
 const s=state(year);
 assert.equal(buyPs1Station(s,ps1PlacementSlots(s)[0].id).ok,true);
 return s;
}
test("five original discs plus two every year through 2005; none after PS2 release",()=>{
 assert.equal(PS1_CD_CATALOG.length,13);
 assert.equal(new Set(PS1_CD_CATALOG.map(d=>d.id)).size,13);
 for(const [year,expected] of years){
  const released=ps1ReleasedDiscs(year);
  assert.equal(released.length,expected,"released catalog "+year);
  const s=state(year),port=createPs1ShopDiscPort(()=>s);
  const rows=port.snapshot();
  assert.equal(rows?.length??0,expected,"visible shop catalog "+year);
  if(rows){
   assert.deepEqual(rows.map(row=>row.id),released.map(d=>d.id));
   for(const row of rows){
    const data=PS1_CD_CATALOG.find(d=>d.id===row.id);
    assert.equal(row.releaseYear,data.releaseYear);
    assert.equal(row.disabled,true,"without console must remain blocked");
   }
  }
 }
 for(const [year,number] of [[2002,7],[2003,2],[2004,2],[2005,2]]){
  assert.equal(PS1_CD_CATALOG.filter(d=>d.releaseYear===year).length,number);
 }
 assert.equal(PS1_CD_CATALOG.some(d=>d.releaseYear>2005),false);
});
test("game engine rejects purchases before release even when command bypasses interface",()=>{
 const s=installed(2002);
 const future=PS1_CD_CATALOG.filter(d=>d.releaseYear>2002);
 const untouched=JSON.stringify(s);
 for(const disc of future){
  const result=buyPs1Disc(s,disc.id);
  assert.equal(result.ok,false,disc.title);
  assert.match(result.message,new RegExp(String(disc.releaseYear)));
  assert.equal(setPs1StationDisc(s,0,disc.id).ok,false);
 }
 assert.equal(JSON.stringify(s),untouched,"a blocked purchase must not mutate economy or save");
 assert.equal(isValidSave(s),true);
});
test("all annual releases become buyable at the correct year, survive save import and power the TV",()=>{
 for(const releaseYear of [2002,2003,2004,2005]){
  const s=installed(releaseYear);
  const available=createPs1ShopDiscPort(()=>s).snapshot();
  const fresh=PS1_CD_CATALOG.filter(d=>d.releaseYear===releaseYear);
  assert.ok(fresh.length>=2);
  for(const disc of fresh){
   const row=available.find(r=>r.id===disc.id);
   assert.equal(row.disabled,false,disc.title);
   const before=s.cash;
   const price=ps1DiscPrice(s,disc.id);
   assert.ok(price>0);
   assert.equal(buyPs1Disc(s,disc.id).ok,true,disc.title);
   assert.equal(Math.round((before-s.cash)*100),Math.round(price*100));
   assert.equal(s.ps1Discs[disc.id],1);
   assert.equal(setPs1StationDisc(s,0,disc.id).ok,true);
   assert.equal(ps1PlayableDisc(s,0),disc.id);
   const imported=parseImportedSave(serializeSave(s));
   assert.equal(isValidSave(imported),true,"save import "+disc.id);
   assert.equal(ps1PlayableDisc(imported,0),disc.id);
   assert.equal(createPs1AdminPort(()=>imported).snapshot().stations[0].discName,disc.title);
  }
 }
});
test("future-year stock cannot be smuggled into a saved game",()=>{
 const s=installed(2002);
 assert.equal(buyPs1Disc(s,"turbo-circuito").ok,true);
 assert.equal(isValidSave(s),true);
 s.ps1Discs["agentes-da-noite"]=1;
 assert.equal(isValidSave(s),false);
 s.totalMinutes=(2005-1998)*360*DAY_MINUTES;
 assert.equal(isValidSave(s),true);
});
test("old PS1 stock and stations continue to work in 2006 without new PS1 games",()=>{
 const s=installed(2005);
 const last=PS1_CD_CATALOG.filter(d=>d.releaseYear===2005);
 assert.equal(last.length,2);
 for(const disc of last)assert.equal(buyPs1Disc(s,disc.id).ok,true);
 s.totalMinutes=(2006-1998)*360*DAY_MINUTES;
 assert.equal(isValidSave(s),true);
 assert.equal(ps1ReleasedDiscs(2006).length,13);
 assert.equal(createPs1ShopDiscPort(()=>s).snapshot().length,13);
 for(const disc of last)assert.equal(s.ps1Discs[disc.id],1);
 assert.equal(PS1_MAX_STATIONS,3);
});
