import test from "node:test";
import assert from "node:assert/strict";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {reviewNotices,missingWindowsLicenses} from "../dist/js/sim/notices.js";
import {createNoticeActionsPort} from "../dist/js/application/noticeActionsPort.js";
import {createNoticeInboxPort} from "../dist/js/application/noticeInboxPort.js";
import {createWindowsLicensePort} from "../dist/js/application/windowsLicensePort.js";
import {createStationActionsPort} from "../dist/js/application/stationActionsPort.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {chooseAvailablePc} from "../dist/js/sim/customerFlow.js";
import {tryServe} from "../dist/js/sim/customerDecisions.js";
import {pcActivityForStation,drawPcScreenActivity} from "../dist/js/render/pcScreenActivities.js";
import {eligibleEraGamePcs} from "../dist/js/sim/eraGames.js";
import {gpuGameCompatible,GPU_GAME_CATALOG} from "../dist/js/sim/gpuGames.js";
import {
 LINUX_CONTACT_DAY,LINUX_AUGUST_DAY,LINUX_MAIL_IDS,linuxDay,linuxUnlocked,
 nextLinuxLetter,isLinuxPc,operationalLinuxPcs,installLinux,bootWindows,startLinuxResearch
} from "../dist/js/sim/linuxQuest.js";
const setDay=(s,day)=>{s.totalMinutes=(day-1)*DAY_MINUTES;return s;};
const game=(day=LINUX_CONTACT_DAY)=>{const s=createGame(45,"historical");return setDay(s,day);};
const ok=result=>assert.equal(result.ok,true,result.message);
const letter=s=>createNoticeInboxPort(()=>s).snapshot().letters;
const visitor=(id=3)=>({id,stage:"waiting",x:1.55,y:2.56,target:{x:1.55,y:2.56},
 route:[],queueIndex:0,pcIndex:null,usedMinutes:0,waitingMinutes:0,offlineWait:0,
 happy:true,sessionMinutes:45,wallet:30,budgetAware:true,preference:"comfort",linuxEnthusiast:true});
function completeMission(){
 const s=game();
 reviewNotices(s);ok(startLinuxResearch(s));
 setDay(s,LINUX_CONTACT_DAY+30);reviewNotices(s);
 setDay(s,LINUX_CONTACT_DAY+75);reviewNotices(s);
 setDay(s,LINUX_AUGUST_DAY);reviewNotices(s);
 return s;
}
test("March 1999 forum email arrives once with no retroactive event in 1998",()=>{
 const s=game(LINUX_CONTACT_DAY-1),before=s.rng;
 reviewNotices(s);assert.equal(s.notices?.length??0,0);
 assert.equal(startLinuxResearch(s).ok,false);
 setDay(s,LINUX_CONTACT_DAY);reviewNotices(s);
 assert.equal(linuxDay(s),421);
 assert.equal(s.notices.length,1);
 assert.equal(s.notices[0].id,"linux-forum-contact");
 assert.match(s.notices[0].body,/Tony/);
 assert.match(s.notices[0].body,/estudantes/);
 assert.equal(s.rng,before,"mission cannot consume the customer RNG");
 reviewNotices(s);assert.equal(s.notices.length,1);
 const ui=letter(s)[0];
 assert.equal(ui.items.filter(x=>x.action==="linux-research").length,1);
 assert.ok(!ui.items.some(x=>x.action==="decision"));
 assert.ok(isValidSave(s));
});
test("Research cannot be bypassed; the forum responds across April, June and August",()=>{
 const s=game();reviewNotices(s);
 const action=createNoticeActionsPort(()=>s);
 ok(action.startLinux());assert.equal(action.startLinux().ok,false);
 assert.equal(s.linuxResearchStartedDay,LINUX_CONTACT_DAY);
 assert.equal(linuxUnlocked(s),false);
 setDay(s,LINUX_CONTACT_DAY+29);reviewNotices(s);assert.equal(s.notices.length,1);
 setDay(s,LINUX_CONTACT_DAY+30);reviewNotices(s);
 assert.equal(s.notices[0].id,"linux-forum-guide");
 setDay(s,LINUX_CONTACT_DAY+75);reviewNotices(s);
 assert.equal(s.notices[0].id,"linux-forum-pilot");
 setDay(s,LINUX_AUGUST_DAY-1);reviewNotices(s);assert.equal(linuxUnlocked(s),false);
 setDay(s,LINUX_AUGUST_DAY);reviewNotices(s);
 assert.equal(s.notices[0].id,"linux-forum-ready");
 assert.equal(linuxUnlocked(s),true);
 assert.deepEqual(s.linuxMailSeenIds,LINUX_MAIL_IDS);
 assert.equal(s.rng,45);
 assert.equal(isValidSave(s),true);
});
test("Starting the research late still requires actual days; no retroactive delivery batch",()=>{
 const s=game(LINUX_AUGUST_DAY+200);reviewNotices(s);
 assert.equal(s.notices.length,1);
 ok(startLinuxResearch(s));
 assert.equal(linuxUnlocked(s),false,"cannot skip 110 days by waiting to read the email");
 setDay(s,LINUX_AUGUST_DAY+309);
 assert.equal(linuxUnlocked(s),false);
 setDay(s,LINUX_AUGUST_DAY+310);
 assert.equal(linuxUnlocked(s),true);
 reviewNotices(s);
 assert.equal(s.notices.length,2,"only one follow-up per calendar tick");
});
test("Linux installation respects year, locked power, busy machines and keeps Windows",()=>{
 const s=game();reviewNotices(s);ok(startLinuxResearch(s));
 assert.equal(installLinux(s,0).ok,false);
 setDay(s,LINUX_AUGUST_DAY);
 assert.equal(installLinux(s,0).ok,false,"must switch the workstation off");
 const ops=createStationActionsPort(()=>s),windows=createWindowsLicensePort(()=>s);
 assert.match(windows.rows()[0].linuxAction.label,/Linux/);
 assert.equal(windows.rows()[0].linuxAction.disabled,true);
 ok(ops.power(0));ok(ops.linux(0,"install"));
 assert.equal(isLinuxPc(s,0),true);
 assert.equal(s.pcLinuxInstalled[0],true);
 assert.equal(windows.rows()[0].linuxAction.action,"windows");
 assert.match(windows.rows()[0].title,/Linux ativo/);
 assert.equal(isValidSave(s),true);
 assert.equal(ops.linux(0,"install").ok,false);
 ok(ops.linux(0,"windows"));assert.equal(isLinuxPc(s,0),false);
 assert.equal(s.pcLinuxInstalled[0],true);
 ok(ops.linux(0,"install"));assert.equal(isLinuxPc(s,0),true);
 assert.equal(missingWindowsLicenses(s),2,"a Linux-only workstation does not run Windows");
 ok(ops.power(0));const cash=s.cash,expense=s.expenses;
 assert.equal(ops.linux(0,"windows").ok,false,"occupied? No: powered-on swap must be blocked");
 assert.equal(s.cash,cash);assert.equal(s.expenses,expense);
});
test("Linux PC serves and charges a real forum programmer, even during an outage",()=>{
 const s=completeMission();s.cash=500;
 ok(createStationActionsPort(()=>s).power(0));ok(installLinux(s,0));
 ok(createStationActionsPort(()=>s).power(0));
 s.pcPoweredOff=[false,true,true];
 const c=visitor();s.customers=[c];const expected=1.88; // R$ 2.50/h * 45 min in historical mode
 assert.equal(chooseAvailablePc(s,c),0);
 s.offlineUntil=s.totalMinutes+300;
 const cash=s.cash;
 tryServe(s,c);
 assert.equal(c.stage,"to_pc");
 assert.equal(c.pcIndex,0);
 assert.equal(s.linuxSessions,1);
 assert.equal(s.linuxRevenue,expected);
 assert.equal(s.cash,cash+expected);
 assert.equal(s.revenue,expected);
 tryServe(s,c);assert.equal(s.linuxSessions,1,"no double billing");
 assert.equal(isValidSave(s),true);
});
test("Linux cannot masquerade as a Windows game machine",()=>{
 const s=completeMission();ok(createStationActionsPort(()=>s).power(0));ok(installLinux(s,0));
 s.pcWindowsLicenses=[true,true,false];
 assert.deepEqual(eligibleEraGamePcs(s),[1]);
 if(GPU_GAME_CATALOG.length)assert.equal(gpuGameCompatible(s,0,GPU_GAME_CATALOG[0]),false);
 assert.equal(isValidSave(s),true);
});
test("Linux screen is procedural green code; older Windows PC visuals stay unchanged",()=>{
 const s=completeMission();
 ok(createStationActionsPort(()=>s).power(0));ok(installLinux(s,0));
 assert.equal(pcActivityForStation(s,0,1999),"linux-terminal");
 assert.equal(pcActivityForStation(s,1,1999),null);
 const first=[],later=[];
 drawPcScreenActivity((...args)=>first.push(args),"linux-terminal",0);
 drawPcScreenActivity((...args)=>later.push(args),"linux-terminal",5);
 assert.ok(first.length>10);
 assert.notDeepEqual(first,later);
 assert.ok(first.some(x=>x[4]==="#a0dfaa"||x[4]==="#c8f5b6"));
 assert.ok(first.every(x=>x[0]>=0&&x[1]>=0&&x[0]+x[2]<=1.00001&&x[1]+x[3]<=1.00001));
});
test("Save persists progress, OS installation and invoices; legacy states remain readable",()=>{
 const legacy=game();assert.equal(isValidSave(legacy),true);
 assert.equal(parseImportedSave(serializeSave(legacy)).linuxResearchStartedDay,undefined);
 const s=completeMission();ok(createStationActionsPort(()=>s).power(0));ok(installLinux(s,0));
 const restored=parseImportedSave(serializeSave(s));
 assert.equal(isLinuxPc(restored,0),true);
 assert.deepEqual(restored.linuxMailSeenIds,s.linuxMailSeenIds);
 assert.equal(restored.pcLinuxInstalled[0],true);
 assert.equal(nextLinuxLetter(restored),null);
 const bad=structuredClone(restored);bad.pcLinuxInstalled[0]=false;
 assert.equal(isValidSave(bad),false);
 const invalid=structuredClone(restored);invalid.linuxResearchStartedDay=undefined;
 assert.equal(isValidSave(invalid),false);
 const corruption=structuredClone(restored);corruption.linuxMailSeenIds=["linux-forum-ready","linux-forum-ready"];
 assert.equal(isValidSave(corruption),false);
});
