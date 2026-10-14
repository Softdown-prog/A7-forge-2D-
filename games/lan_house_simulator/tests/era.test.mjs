import assert from "node:assert/strict";
import test from "node:test";
import {createGame} from "../dist/js/sim/engine.js";
import {gameYear,INTERNET_ERAS,WINDOWS_ERAS,licenseWindows} from "../dist/js/sim/era.js";
import {upgradeInternet,upgradeComputer} from "../dist/js/sim/economy.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";

function at(year){const s=createGame(101);s.cash=20000;s.totalMinutes=(year-1998)*360*DAY_MINUTES;return s;}
test("ano do jogo segue calendário de 360 dias sem desbloquear cedo",()=>{
 assert.equal(gameYear(at(1998)),1998);
 assert.equal(gameYear(at(2000)),2000);
 assert.equal(gameYear(at(2007)),2007);
 assert.equal(gameYear({...at(2000),totalMinutes:2*360*DAY_MINUTES-1}),1999);
});
test("internet discada até 2002 e fibra somente de 2007 em diante",()=>{
 const s=at(1998);const before=s.cash;
 assert.equal(upgradeInternet(s).ok,false);assert.equal(s.cash,before);
 s.totalMinutes=4*360*DAY_MINUTES;
 assert.equal(upgradeInternet(s).ok,true);
 assert.equal(s.internetTier,2);
 assert.equal(upgradeInternet(s).ok,false);
 s.totalMinutes=9*360*DAY_MINUTES;
 assert.equal(upgradeInternet(s).ok,true);
 assert.equal(s.internetTier,3);
 assert.equal(INTERNET_ERAS[2].year,2007);
});
test("hardware tem época própria e não compra antes do ano",()=>{
 const s=at(1998);
 assert.equal(upgradeComputer(s,0).ok,false);
 s.totalMinutes=2*360*DAY_MINUTES;
 assert.equal(upgradeComputer(s,0).ok,true);
 assert.equal(upgradeComputer(s,0).ok,false);
 s.totalMinutes=5*360*DAY_MINUTES;
 assert.equal(upgradeComputer(s,0).ok,true);
});
test("Windows exige licença separada por estação e respeita lançamento",()=>{
 const s=at(1998);
 assert.equal(licenseWindows(s,0,"winxp").ok,false);
 const first=licenseWindows(s,0,"win98");
 assert.equal(first.ok,true);
 assert.equal(s.pcWindowsLicenses[0],true);
 assert.equal(s.pcWindowsLicenses[1],false);
 assert.equal(licenseWindows(s,0,"win98").ok,false);
 s.totalMinutes=3*360*DAY_MINUTES;
 const cash=s.cash,hardware=s.pcTiers[0];
 assert.equal(licenseWindows(s,0,"winxp").ok,true);
 assert.equal(s.cash,cash-WINDOWS_ERAS[2].cost);
 assert.equal(s.pcTiers[0],hardware);
});
