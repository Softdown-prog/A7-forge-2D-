import test from "node:test";
import assert from "node:assert/strict";
import {createGame,isValidSave,stepGame} from "../dist/js/sim/engine.js";
import {WINDOWS_ERAS,installedWindows,licenseWindows} from "../dist/js/sim/era.js";
import {windowsInstallDurationMs,windowsInstallProgress,windowsInstallFor,
 finishWindowsInstallations,validWindowsInstallJobs} from "../dist/js/sim/windowsInstallation.js";
import {toggleStationPower,stationReadyForSessions,stationUpgradeIssue} from "../dist/js/sim/stationPower.js";
import {createWindowsLicensePort} from "../dist/js/application/windowsLicensePort.js";
import {createHardwarePanelPort} from "../dist/js/application/hardwarePanelPort.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {readFileSync} from "node:fs";
function ready(){
 const s=createGame(682,"historical");s.cash=10000;return s;
}
function off(s,pc){
 const r=toggleStationPower(s,pc);assert.equal(r.ok,true,r.message);
}
function begin(s,pc,edition="win98"){
 const before=Date.now(),r=licenseWindows(s,pc,edition),after=Date.now();
 assert.equal(r.ok,true,r.message);
 const job=windowsInstallFor(s,pc);assert.ok(job);
 assert.ok(job.startedAtMs>=before&&job.startedAtMs<=after);
 assert.equal(job.finishedAtMs-job.startedAtMs,windowsInstallDurationMs(edition));
 return job;
}
test("eight Windows versions increase from 10 to 80 real minutes",()=>{
 assert.equal(WINDOWS_ERAS.length,8);
 for(const [i,win] of WINDOWS_ERAS.entries())
  assert.equal(windowsInstallDurationMs(win.id),(i+1)*600000,win.name);
});
test("payment starts a job, cannot double-charge and must not enable Windows early",()=>{
 const s=ready();off(s,0);
 const initial=s.cash,expenses=s.expenses,job=begin(s,0);
 assert.equal(s.cash,initial-120);
 assert.equal(s.expenses,expenses+120);
 assert.equal(installedWindows(s,0),"win98");
 assert.notEqual(s.pcWindowsLicenses?.[0],true);
 assert.equal(stationReadyForSessions(s,0),false);
 assert.match(stationUpgradeIssue(s,0),/Windows/);
 assert.equal(toggleStationPower(s,0).ok,false);
 assert.equal(licenseWindows(s,0,"win98").ok,false);
 assert.equal(s.cash,initial-120);
 assert.equal(isValidSave(s),true);
 assert.equal(windowsInstallProgress(s,0,job.startedAtMs).percent,0);
 assert.equal(windowsInstallProgress(s,0,job.startedAtMs+300000).percent,50);
 assert.equal(windowsInstallProgress(s,0,job.startedAtMs+300000).remainingSeconds,300);
 assert.deepEqual(finishWindowsInstallations(s,job.finishedAtMs-1),[]);
});
test("simulation speed cannot finish install; wall clock finishes once and leaves PC off",()=>{
 const s=ready();off(s,0);
 const job=begin(s,0);
 stepGame(s,120);
 assert.notEqual(s.pcWindowsLicenses?.[0],true);
 assert.equal(finishWindowsInstallations(s,job.finishedAtMs).length,1);
 assert.equal(s.pcWindowsLicenses?.[0],true);
 assert.equal(s.pcPoweredOff?.[0],true);
 assert.equal(windowsInstallFor(s,0),null);
 assert.deepEqual(finishWindowsInstallations(s,job.finishedAtMs+100000),[]);
 assert.equal(toggleStationPower(s,0).ok,true);
 assert.equal(stationReadyForSessions(s,0),true);
 assert.equal(isValidSave(s),true);
});
test("two PC jobs finish independently and only the correct license is enabled",()=>{
 const s=ready();off(s,0);off(s,1);
 const first=begin(s,0);begin(s,1);
 const later=s.windowsInstallJobs.find(x=>x.pc===1);
 later.startedAtMs=first.startedAtMs+10000;
 later.finishedAtMs=later.startedAtMs+windowsInstallDurationMs("win98");
 assert.equal(validWindowsInstallJobs(s),true);
 assert.equal(finishWindowsInstallations(s,first.finishedAtMs).length,1);
 assert.equal(s.pcWindowsLicenses?.[0],true);
 assert.equal(s.pcWindowsLicenses?.[1],false);
 assert.equal(stationReadyForSessions(s,1),false);
 assert.equal(finishWindowsInstallations(s,later.finishedAtMs).length,1);
 assert.equal(s.pcWindowsLicenses?.[1],true);
});
test("saved job survives export/import and finishes after browser is closed",()=>{
 const s=ready();off(s,0);
 const job=begin(s,0);
 const imported=parseImportedSave(serializeSave(s));
 assert.equal(imported.windowsInstallJobs?.[0].finishedAtMs,job.finishedAtMs);
 assert.equal(windowsInstallProgress(imported,0,job.startedAtMs+240000).remainingSeconds,360);
 assert.equal(finishWindowsInstallations(imported,job.finishedAtMs+60000).length,1);
 assert.equal(imported.pcWindowsLicenses?.[0],true);
 assert.equal(imported.pcPoweredOff?.[0],true);
 assert.equal(isValidSave(parseImportedSave(serializeSave(imported))),true);
});
test("forged jobs and powered-on installs fail save validation, legacy saves remain valid",()=>{
 const s=ready();off(s,0);begin(s,0);
 const bad=[
  {...s,windowsInstallJobs:[{...s.windowsInstallJobs[0],edition:"win42"}]},
  {...s,windowsInstallJobs:[{...s.windowsInstallJobs[0],finishedAtMs:0}]},
  {...s,windowsInstallJobs:[...s.windowsInstallJobs,s.windowsInstallJobs[0]]},
  {...s,pcPoweredOff:[false,true,true]},
  {...s,windowsInstallJobs:[{...s.windowsInstallJobs[0],pc:201}]}
 ];
 for(const wrong of bad){assert.equal(validWindowsInstallJobs(wrong),false);assert.equal(isValidSave(wrong),false);}
 const old=ready();delete old.windowsInstallJobs;
 assert.equal(isValidSave(old),true);
});
test("real Windows and hardware panels show per-PC progress and disable operations",()=>{
 const s=ready();off(s,0);begin(s,0);
 const row=createWindowsLicensePort(()=>s).rows()[0];
 assert.equal(row.installation.name,"Windows 98");
 assert.equal(row.choices.every(x=>x.disabled),true);
 const hardware=createHardwarePanelPort(()=>s).snapshot(0,"platform","windows");
 assert.ok(hardware.installation);
 assert.equal(hardware.powerDisabled,true);
 assert.equal(hardware.windows.every(x=>x.disabled),true);
 assert.match(hardware.machineSubtitle,/Instalando/);
 const native=readFileSync(new URL("../src/ui/windowsLicensePanel.ts",import.meta.url),"utf8");
 const panel=readFileSync(new URL("../src/ui/hardwarePanel.ts",import.meta.url),"utf8");
 assert.ok(native.includes('createElement("progress")'));
 assert.ok(panel.includes('element("progress")'));
});
