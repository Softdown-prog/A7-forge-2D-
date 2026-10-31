import test from "node:test";
import assert from "node:assert/strict";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {reviewNotices,missingWindowsLicenses} from "../dist/js/sim/notices.js";
import {createNoticeActionsPort} from "../dist/js/application/noticeActionsPort.js";
import {createNoticeInboxPort} from "../dist/js/application/noticeInboxPort.js";
import {createWindowsLicensePort} from "../dist/js/application/windowsLicensePort.js";
import {createStationActionsPort} from "../dist/js/application/stationActionsPort.js";
import {createShopActionsPort} from "../dist/js/application/shopActionsPort.js";
import {createShopCatalogOffersPort} from "../dist/js/application/shopCatalogOffersPort.js";
import {expandShop} from "../dist/js/sim/economy.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {chooseAvailablePc} from "../dist/js/sim/customerFlow.js";
import {tryServe} from "../dist/js/sim/customerDecisions.js";
import {pcActivityForStation,drawPcScreenActivity} from "../dist/js/render/pcScreenActivities.js";
import {eligibleEraGamePcs} from "../dist/js/sim/eraGames.js";
import {linuxMachineFor,LINUX_MACHINE_CATALOG} from "../dist/js/sim/linuxMachines.js";
import {stationModelName} from "../dist/js/sim/computerModels.js";
import {
 LINUX_CONTACT_DAY,LINUX_AUGUST_DAY,LINUX_MAIL_IDS,linuxDay,linuxUnlocked,
 nextLinuxLetter,isLinuxPc,operationalLinuxPcs,installLinux,startLinuxResearch
} from "../dist/js/sim/linuxQuest.js";
const setDay=(s,day)=>{s.totalMinutes=(day-1)*DAY_MINUTES;return s;};
const game=(day=LINUX_CONTACT_DAY)=>setDay(createGame(45,"historical"),day);
const ok=result=>assert.equal(result.ok,true,result.message);
function completeMission(){
 const s=game();reviewNotices(s);ok(startLinuxResearch(s));
 setDay(s,LINUX_CONTACT_DAY+30);reviewNotices(s);
 setDay(s,LINUX_CONTACT_DAY+75);reviewNotices(s);
 setDay(s,LINUX_AUGUST_DAY);reviewNotices(s);
 return s;
}
function physicalSpace(s){
 s.cash=5000;ok(expandShop(s));
 assert.equal(s.installedPcs,3);
}
function buy(s,id="linux-lab-99"){
 const index=s.installedPcs;
 ok(createShopActionsPort(()=>s).purchase(id));
 return index;
}
function workstation(){
 const s=completeMission();physicalSpace(s);const index=buy(s);
 return {s,index};
}
const visitor=(id=3)=>({id,stage:"waiting",x:1.55,y:2.56,target:{x:1.55,y:2.56},
 route:[],queueIndex:0,pcIndex:null,usedMinutes:0,waitingMinutes:0,offlineWait:0,
 happy:true,sessionMinutes:45,wallet:30,budgetAware:true,preference:"comfort",linuxEnthusiast:true});
test("Forum email arrives in March 1999, without RNG or repeated messages",()=>{
 const s=game(LINUX_CONTACT_DAY-1),before=s.rng;reviewNotices(s);
 assert.equal(s.notices?.length??0,0);assert.equal(startLinuxResearch(s).ok,false);
 setDay(s,LINUX_CONTACT_DAY);reviewNotices(s);
 assert.equal(linuxDay(s),421);
 assert.equal(s.notices.length,1);
 assert.equal(s.notices[0].id,"linux-forum-contact");
 assert.match(s.notices[0].body,/estudantes/);
 assert.equal(s.rng,before);
 const ui=createNoticeInboxPort(()=>s).snapshot().letters[0];
 assert.ok(ui.items.some(i=>i.action==="linux-research"));
 assert.ok(!ui.items.some(i=>i.action==="decision"));
 reviewNotices(s);assert.equal(s.notices.length,1);
 assert.equal(isValidSave(s),true);
});
test("Research takes months and new hardware never unlocks early",()=>{
 const s=game();reviewNotices(s);const port=createNoticeActionsPort(()=>s);
 ok(port.startLinux());assert.equal(port.startLinux().ok,false);
 const shop=createShopCatalogOffersPort(()=>s,()=>0);
 assert.equal(shop.snapshot("linux-lab-99").disabled,true);
 setDay(s,LINUX_CONTACT_DAY+30);reviewNotices(s);
 assert.equal(s.notices[0].id,"linux-forum-guide");
 setDay(s,LINUX_CONTACT_DAY+75);reviewNotices(s);
 assert.equal(s.notices[0].id,"linux-forum-pilot");
 setDay(s,LINUX_AUGUST_DAY-1);reviewNotices(s);
 assert.equal(linuxUnlocked(s),false);
 setDay(s,LINUX_AUGUST_DAY);reviewNotices(s);
 assert.equal(linuxUnlocked(s),true);
 assert.equal(s.notices[0].id,"linux-forum-ready");
 assert.deepEqual(s.linuxMailSeenIds,LINUX_MAIL_IDS);
 assert.equal(s.rng,45);
 assert.equal(isValidSave(s),true);
});
test("Late response still requires 110 days of research; no batch mail",()=>{
 const s=game(LINUX_AUGUST_DAY+200);reviewNotices(s);ok(startLinuxResearch(s));
 assert.equal(linuxUnlocked(s),false);
 setDay(s,LINUX_AUGUST_DAY+309);assert.equal(linuxUnlocked(s),false);
 setDay(s,LINUX_AUGUST_DAY+310);assert.equal(linuxUnlocked(s),true);
 reviewNotices(s);assert.equal(s.notices.length,2);
});
test("New Linux PCs are purchased physically, not formatted from existing Windows",()=>{
 const s=completeMission();s.cash=5000;
 assert.equal(installLinux(s,0).ok,false,"Windows computer cannot become a dedicated Linux PC");
 assert.equal(createWindowsLicensePort(()=>s).rows()[0].linuxAction,null);
 assert.equal(createShopCatalogOffersPort(()=>s,()=>0).snapshot("linux-lab-99").disabled,true,
   "three original desks fill the main room");
 assert.equal(createShopActionsPort(()=>s).purchase("linux-lab-99").ok,false);
 physicalSpace(s);
 const previous=s.cash;
 const index=buy(s);
 assert.equal(index,3);assert.equal(s.installedPcs,4);
 assert.equal(s.cash,previous-LINUX_MACHINE_CATALOG[0].cost);
 assert.equal(s.expenses,650+LINUX_MACHINE_CATALOG[0].cost);
 assert.equal(isLinuxPc(s,index),true);
 assert.equal(linuxMachineFor(s,index),"linux-lab-99");
 assert.equal(s.pcLinuxInstalled[index],true);
 assert.equal(s.pcWindowsLicenses?.[index]===true,false,"no unlicensed Windows included");
 assert.equal(stationModelName(s,index),"Bancada Linux 99");
 assert.equal(missingWindowsLicenses(s),3);
 assert.equal(isValidSave(s),true);
});
test("Both Linux models coexist with Windows and have distinct prices and physical styles",()=>{
 const {s,index}=workstation();const second=buy(s,"linux-dev-99");
 assert.equal(second,index+1);assert.equal(s.installedPcs,5);
 assert.equal(linuxMachineFor(s,index),"linux-lab-99");
 assert.equal(linuxMachineFor(s,second),"linux-dev-99");
 assert.equal(isLinuxPc(s,0),false);
 assert.equal(isLinuxPc(s,index),true);assert.equal(isLinuxPc(s,second),true);
 assert.ok(s.cash>=0);
 assert.equal(createShopCatalogOffersPort(()=>s,()=>0).snapshot("linux-dev-99").disabled,true,
  "both expansion desks are full");
 assert.equal(isValidSave(s),true);
});
test("Switching a Linux workstation to Windows requires buying a Windows license",()=>{
 const {s,index}=workstation();const ops=createStationActionsPort(()=>s);
 const port=createWindowsLicensePort(()=>s);
 assert.equal(port.rows()[index].linuxAction.action,"windows");
 assert.equal(port.rows()[index].linuxAction.disabled,true);
 assert.equal(ops.linux(index,"windows").ok,false);
 ok(ops.power(index)); // turn off before changing operating systems
 assert.equal(ops.linux(index,"windows").ok,false);
 const cash=s.cash;
 ok(ops.windows(index,"win98"));
 assert.equal(s.cash,cash-120);assert.equal(isLinuxPc(s,index),false);
 assert.equal(s.pcWindowsLicenses[index],true);
 ok(ops.linux(index,"install"));assert.equal(isLinuxPc(s,index),true);
 ok(ops.linux(index,"windows"));assert.equal(isLinuxPc(s,index),false);
 assert.equal(ops.linux(0,"install").ok,false);
 assert.equal(isValidSave(s),true);
});
test("A student finds a real Linux station and pays a normal session",()=>{
 const {s,index}=workstation();const ops=createStationActionsPort(()=>s);
 s.pcPoweredOff=[true,true,true,false];
 const c=visitor();s.customers=[c];s.offlineUntil=s.totalMinutes+200;
 assert.deepEqual(operationalLinuxPcs(s),[index]);
 assert.equal(chooseAvailablePc(s,c),index);
 const previous=s.cash;
 tryServe(s,c);
 assert.equal(c.pcIndex,index);
 assert.equal(c.stage,"to_pc");
 assert.equal(s.linuxSessions,1);
 assert.equal(s.linuxRevenue,1.88);
 assert.equal(s.cash,previous+1.88);
 assert.equal(s.revenue,1.88);
 tryServe(s,c);assert.equal(s.linuxSessions,1);
 assert.equal(isValidSave(s),true);
});
test("Linux PCs cannot pretend to support installed Windows-only commercial games",()=>{
 const {s,index}=workstation();
 s.pcWindowsLicenses=[true,true,true,false];
 assert.deepEqual(eligibleEraGamePcs(s),[0,1,2]);
 assert.equal(eligibleEraGamePcs(s).includes(index),false);
});
test("Procedural monitor activity belongs to the purchased Linux PC",()=>{
 const {s,index}=workstation();
 assert.equal(pcActivityForStation(s,index,1999),"linux-terminal");
 assert.equal(pcActivityForStation(s,0,1999),null);
 const a=[],b=[];
 drawPcScreenActivity((...args)=>a.push(args),"linux-terminal",0);
 drawPcScreenActivity((...args)=>b.push(args),"linux-terminal",5);
 assert.ok(a.length>10);assert.notDeepEqual(a,b);
 assert.ok(a.every(x=>x[0]>=0&&x[1]>=0&&x[0]+x[2]<=1.00001&&x[1]+x[3]<=1.00001));
});
test("Save retains actual purchased model, money and OS; corrupt or impossible saves fail",()=>{
 const old=game();assert.equal(isValidSave(old),true);
 assert.equal(parseImportedSave(serializeSave(old)).pcLinuxModels,undefined);
 const {s,index}=workstation(),restored=parseImportedSave(serializeSave(s));
 assert.equal(linuxMachineFor(restored,index),"linux-lab-99");
 assert.equal(isLinuxPc(restored,index),true);
 assert.equal(restored.pcLinuxInstalled[index],true);
 assert.equal(nextLinuxLetter(restored),null);
 assert.equal(restored.cash,s.cash);assert.equal(restored.expenses,s.expenses);
 const a=structuredClone(restored);a.pcLinuxModels[index]="linux-invalid";
 assert.equal(isValidSave(a),false);
 const b=structuredClone(restored);b.pcLinuxInstalled[index]=false;
 assert.equal(isValidSave(b),false);
 const c=structuredClone(restored);c.linuxResearchStartedDay=undefined;
 assert.equal(isValidSave(c),false);
 const d=structuredClone(restored);d.linuxMailSeenIds=["linux-forum-ready","linux-forum-ready"];
 assert.equal(isValidSave(d),false);
});
