import {withStationOff} from "./station-power-fixture.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame,isValidSave,visitorArrivalChance} from "../dist/js/sim/engine.js";
import {licenseGames} from "../dist/js/sim/economy.js";
import {licenseWindows} from "../dist/js/sim/era.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {ERA_GAME_CATALOG,quoteEraGame,licenseEraGame,eraGameVisitorMultiplier} from "../dist/js/sim/eraGames.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
function setup(mode="historical"){
 const s=createGame(18,mode);s.cash=4000;
 assert.equal(licenseGames(s).ok,true);
 assert.equal(withStationOff(s,0,()=>licenseWindows(s,0,"win98")).ok,true);
 return s;
}
test("cinco jogos por ano e capas distintas",()=>{
 assert.equal(ERA_GAME_CATALOG.length,10);
 assert.deepEqual([1998,1999].map(year=>ERA_GAME_CATALOG.filter(x=>x.year===year).length),[5,5]);
 assert.equal(new Set(ERA_GAME_CATALOG.map(x=>x.id)).size,10);
 assert.equal(new Set(ERA_GAME_CATALOG.map(x=>x.theme)).size,10);
});
test("restrições: contrato base, Windows, ano e dinheiro",()=>{
 const s=createGame(4,"historical");s.cash=4000;
 assert.match(quoteEraGame(s,"turbo-98").message,/direitos básicos/);
 assert.equal(licenseGames(s).ok,true);
 assert.match(quoteEraGame(s,"turbo-98").message,/Windows/);
 assert.equal(withStationOff(s,0,()=>licenseWindows(s,0,"win98")).ok,true);
 assert.equal(quoteEraGame(s,"turbo-98").ok,true);
 assert.match(quoteEraGame(s,"asfalto-noturno").message,/1999/);
 assert.equal(licenseEraGame(s,"asfalto-noturno").ok,false);
 s.totalMinutes=360*DAY_MINUTES;
 assert.equal(quoteEraGame(s,"asfalto-noturno").ok,true);
});
test("compra única registra despesa, save e aumento moderado da procura",()=>{
 const s=setup(),cash=s.cash,expenses=s.expenses,revenue=s.revenue,rng=s.rng;
 const before=visitorArrivalChance(s,0),title=ERA_GAME_CATALOG[0];
 assert.equal(licenseEraGame(s,title.id).ok,true);
 assert.equal(s.cash,cash-title.cost);
 assert.equal(s.expenses,expenses+title.cost);
 assert.equal(s.revenue,revenue);assert.equal(s.rng,rng);
 assert.equal(eraGameVisitorMultiplier(s),1.015);
 assert.ok(visitorArrivalChance(s,0)>before);
 assert.equal(licenseEraGame(s,title.id).ok,false);
 assert.equal(s.cash,cash-title.cost);
 assert.deepEqual(parseImportedSave(serializeSave(s)).licensedEraGames,[title.id]);
});
test("save antigo válido, IDs futuros, duplicados e inventados rejeitados",()=>{
 const s=setup();
 assert.ok(isValidSave(s));assert.equal(s.licensedEraGames,undefined);
 for(const licenses of [["fake"],["turbo-98","turbo-98"],["asfalto-noturno"]]){
  s.licensedEraGames=licenses;
  assert.equal(isValidSave(s),false,JSON.stringify(licenses));
  assert.throws(()=>serializeSave(s));
 }
 s.licensedEraGames=["turbo-98"];assert.equal(isValidSave(s),true);
 s.licensedGames=false;assert.equal(isValidSave(s),false);
 s.licensedGames=true;s.cash=0;
 assert.equal(licenseEraGame(s,"castelo-das-chaves").ok,false);
});
test("modo clássico também desbloqueia, sem GPU; bônus depende de PC licenciado",()=>{
 const s=setup("classic");
 assert.equal(licenseEraGame(s,"blocos-e-cores").ok,true);
 s.totalMinutes=360*DAY_MINUTES;
 assert.equal(licenseEraGame(s,"ilha-dos-segredos").ok,true);
 assert.equal(eraGameVisitorMultiplier(s),1.03);
 s.pcWindowsLicenses=[false,false,false];assert.equal(eraGameVisitorMultiplier(s),1);
});
test("UI mostra dois anos e mantém jogos GPU 2005+",()=>{
 const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
 const ts=readFileSync(new URL("../src/main.ts",import.meta.url),"utf8");
 const css=readFileSync(new URL("../style.css",import.meta.url),"utf8");
 assert.ok(html.includes('id="era-game-catalog"'));
 assert.ok(html.includes('id="gpu-game-catalog"'));
 assert.ok(ts.includes("quoteEraGame(game,title.id)"));
 assert.ok(ts.includes("licenseEraGame(game,id)"));
 assert.ok(css.includes(".era-game-cover"));
});
