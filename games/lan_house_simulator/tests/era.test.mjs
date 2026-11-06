import {withStationOff} from "./station-power-fixture.mjs";
import assert from "node:assert/strict";
import test from "node:test";
import {createGame} from "../dist/js/sim/engine.js";
import {gameYear,INTERNET_ERAS,WINDOWS_ERAS,licenseWindows} from "../dist/js/sim/era.js";
import {upgradeInternet,upgradeComputer} from "../dist/js/sim/economy.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {finishWindowsInstallations,windowsInstallFor} from "../dist/js/sim/windowsInstallation.js";

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
 assert.equal(withStationOff(s,0,()=>upgradeComputer(s,0)).ok,false);
 s.totalMinutes=2*360*DAY_MINUTES;
 assert.equal(withStationOff(s,0,()=>upgradeComputer(s,0)).ok,true);
 assert.equal(withStationOff(s,0,()=>upgradeComputer(s,0)).ok,false);
 s.totalMinutes=5*360*DAY_MINUTES;
 assert.equal(withStationOff(s,0,()=>upgradeComputer(s,0)).ok,true);
});
test("Windows exige licença separada por estação e respeita lançamento",()=>{
 const s=at(1998);
 assert.equal(withStationOff(s,0,()=>licenseWindows(s,0,"winxp")).ok,false);
 const first=withStationOff(s,0,()=>licenseWindows(s,0,"win98"));
 assert.equal(first.ok,true);
 assert.notEqual(s.pcWindowsLicenses?.[0],true,"payment starts installation, not an instant license");
 const win98=windowsInstallFor(s,0);
 assert.ok(win98);
 assert.equal(withStationOff(s,0,()=>licenseWindows(s,0,"win98")).ok,false);
 assert.equal(finishWindowsInstallations(s,win98.finishedAtMs).length,1);
 assert.equal(s.pcWindowsLicenses[0],true);
 assert.equal(s.pcWindowsLicenses[1],false);
 s.totalMinutes=3*360*DAY_MINUTES;
 const cash=s.cash,hardware=s.pcTiers[0];
 assert.equal(withStationOff(s,0,()=>licenseWindows(s,0,"winxp")).ok,true);
 assert.equal(s.cash,cash-WINDOWS_ERAS[2].cost);
 assert.equal(s.pcTiers[0],hardware);
 assert.equal(s.pcWindows[0],"win98","XP is not immediately installed after payment");
 const xp=windowsInstallFor(s,0);
 assert.ok(xp);
 assert.equal(finishWindowsInstallations(s,xp.finishedAtMs).length,1);
 assert.equal(s.pcWindows[0],"winxp");
});
