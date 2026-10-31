import test from "node:test";
import assert from "node:assert/strict";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {reviewNotices} from "../dist/js/sim/notices.js";
import {createNoticeActionsPort} from "../dist/js/application/noticeActionsPort.js";
import {createNoticeInboxPort} from "../dist/js/application/noticeInboxPort.js";
import {createShopActionsPort} from "../dist/js/application/shopActionsPort.js";
import {createShopCatalogOffersPort} from "../dist/js/application/shopCatalogOffersPort.js";
import {createWindowsLicensePort} from "../dist/js/application/windowsLicensePort.js";
import {createStationActionsPort} from "../dist/js/application/stationActionsPort.js";
import {expandShop} from "../dist/js/sim/economy.js";
import {parseImportedSave,serializeSave} from "../dist/js/sim/saveTransfer.js";
import {chooseAvailablePc} from "../dist/js/sim/customerFlow.js";
import {tryServe} from "../dist/js/sim/customerDecisions.js";
import {pcActivityForStation,drawPcScreenActivity} from "../dist/js/render/pcScreenActivities.js";
import {linuxMachineFor} from "../dist/js/sim/linuxMachines.js";
import {eligibleEraGamePcs} from "../dist/js/sim/eraGames.js";
import {
 LINUX_CONTACT_DAY,LINUX_AUGUST_DAY,LINUX_OCTOBER_DAY,
 LINUX_MAGAZINE_ENROLLMENT_COST,LINUX_MAGAZINE_ISSUE_COST,LINUX_MAGAZINE_TITLES,
 linuxNextMagazineDueDay,linuxUnlocked,linuxDay,LINUX_MAIL_IDS,
 nextLinuxLetter,isLinuxPc,installLinux,startLinuxResearch,operationalLinuxPcs
} from "../dist/js/sim/linuxQuest.js";
const setDay=(s,day)=>{s.totalMinutes=(day-1)*DAY_MINUTES;return s;};
const game=(day=LINUX_CONTACT_DAY)=>setDay(createGame(45,"historical"),day);
const ok=result=>assert.equal(result.ok,true,result.message);
const inbox=s=>createNoticeInboxPort(()=>s).snapshot().letters;
const shop=s=>createShopCatalogOffersPort(()=>s,()=>0);
function subscribe(){
 const s=game();reviewNotices(s);ok(createNoticeActionsPort(()=>s).startLinux());return s;
}
function completeSeries(){
 const s=subscribe();
 for(const end of [450,480,510,540,570,600]){setDay(s,end);reviewNotices(s);}
 setDay(s,LINUX_OCTOBER_DAY);reviewNotices(s);
 return s;
}
function physicalRoom(s){
 s.cash=5000;ok(expandShop(s));
}
function buy(s,id="linux-lab-99"){
 const index=s.installedPcs;
 ok(createShopActionsPort(()=>s).purchase(id));
 return index;
}
function equipped(){
 const s=completeSeries();physicalRoom(s);const index=buy(s);return {s,index};
}
const visitor=(id=3)=>({id,stage:"waiting",x:1.55,y:2.56,target:{x:1.55,y:2.56},
 route:[],queueIndex:0,pcIndex:null,usedMinutes:0,waitingMinutes:0,offlineWait:0,
 happy:true,sessionMinutes:45,wallet:30,budgetAware:true,preference:"comfort",linuxEnthusiast:true});
test("March 1999 email refers Tony to a newsstand and offers subscription",()=>{
 const s=game(LINUX_CONTACT_DAY-1);reviewNotices(s);
 assert.equal(startLinuxResearch(s).ok,false);
 setDay(s,LINUX_CONTACT_DAY);reviewNotices(s);
 assert.equal(linuxDay(s),421);
 const message=s.notices.find(n=>n.id==="linux-forum-contact");
 assert.ok(message);assert.match(message.body,/Banca da Praça Central/);
 const buttons=inbox(s).flatMap(x=>x.items).filter(x=>x.action==="linux-research");
 assert.equal(buttons.length,1);
 assert.match(buttons[0].text,/Assinar revista/);
 assert.ok(!inbox(s).some(n=>n.items.some(x=>x.action==="decision")));
 assert.equal(isValidSave(s),true);
});
test("Subscription costs R$ 8; no automatic payment and no duplicate signup",()=>{
 const s=game();reviewNotices(s);s.cash=7;
 assert.equal(startLinuxResearch(s).ok,false);
 assert.equal(s.linuxMagazineSubscriptionDay,undefined);
 s.cash=100;const before=s.cash;
 ok(startLinuxResearch(s));
 assert.equal(s.cash,before-LINUX_MAGAZINE_ENROLLMENT_COST);
 assert.equal(s.expenses,LINUX_MAGAZINE_ENROLLMENT_COST);
 assert.equal(s.linuxMagazineSubscriptionDay,421);
 assert.equal(s.linuxMagazineIssuesReceived,0);
 assert.equal(linuxNextMagazineDueDay(s),450);
 assert.equal(startLinuxResearch(s).ok,false);
 assert.equal(s.expenses,LINUX_MAGAZINE_ENROLLMENT_COST);
});
test("Each issue arrives at month end, March to August, charged once",()=>{
 const s=subscribe(),cash=s.cash,expense=s.expenses,rng=s.rng;
 const ends=[450,480,510,540,570,600];
 for(let i=0;i<6;i++){
  setDay(s,ends[i]-1);reviewNotices(s);
  assert.equal(s.linuxMagazineIssuesReceived,i);
  setDay(s,ends[i]);reviewNotices(s);
  assert.equal(s.linuxMagazineIssuesReceived,i+1);
  const id=LINUX_MAGAZINE_TITLES[i].id;
  assert.ok(s.notices.some(n=>n.id===id));
  assert.equal(s.linuxMagazineLastDeliveryDay,ends[i]);
  assert.equal(s.cash,Math.round((cash-(i+1)*LINUX_MAGAZINE_ISSUE_COST)*100)/100);
  assert.equal(s.expenses,expense+(i+1)*LINUX_MAGAZINE_ISSUE_COST);
  reviewNotices(s);assert.equal(s.linuxMagazineIssuesReceived,i+1);
  assert.equal(isValidSave(s),true);
 }
 assert.equal(s.rng,rng,"magazine schedule cannot change game RNG");
 assert.equal(new Set(s.linuxMailSeenIds).size,s.linuxMailSeenIds.length);
 assert.equal(LINUX_MAIL_IDS.length>=8,true);
 assert.equal(linuxUnlocked(s),false);
});
test("Machines are unavailable in August and September; unlock only October",()=>{
 const s=subscribe();for(const end of [450,480,510,540,570,600]){
  setDay(s,end);reviewNotices(s);
 }
 setDay(s,LINUX_AUGUST_DAY);
 assert.equal(linuxUnlocked(s),false);assert.equal(shop(s).snapshot("linux-lab-99").disabled,true);
 setDay(s,630);reviewNotices(s);
 assert.equal(linuxUnlocked(s),false);
 setDay(s,LINUX_OCTOBER_DAY);reviewNotices(s);
 assert.equal(linuxUnlocked(s),true);
 assert.equal(s.notices.some(n=>n.id==="linux-forum-ready"),true);
 assert.equal(isValidSave(s),true);
});
test("Missing money holds delivery, no overdraft or catch-up in one day",()=>{
 const s=subscribe();s.cash=4;
 setDay(s,450);reviewNotices(s);
 assert.equal(s.linuxMagazineIssuesReceived,0);
 assert.equal(s.cash,4);
 assert.equal(linuxNextMagazineDueDay(s),450);
 assert.match(inbox(s).find(x=>x.title.includes("Fórum da cidade")).items.find(x=>x.kind==="hint").text,/falta R/);
 s.cash=25;reviewNotices(s);
 assert.equal(s.linuxMagazineIssuesReceived,1);
 assert.equal(s.cash,13);assert.equal(s.linuxMagazineLastDeliveryDay,450);
 assert.equal(linuxNextMagazineDueDay(s),480);
 setDay(s,479);reviewNotices(s);
 assert.equal(s.linuxMagazineIssuesReceived,1);
 setDay(s,480);reviewNotices(s);assert.equal(s.linuxMagazineIssuesReceived,2);
 assert.equal(s.cash,1);
 assert.equal(isValidSave(s),true);
});
test("Late signup receives the old print collection monthly, never unlocks immediately",()=>{
 const s=game(LINUX_OCTOBER_DAY+200);reviewNotices(s);
 ok(startLinuxResearch(s));assert.equal(linuxUnlocked(s),false);
 assert.equal(s.linuxMagazineIssuesReceived,0);
 const first=linuxNextMagazineDueDay(s);
 for(let i=0;i<6;i++){
  const at=first+i*30;
  setDay(s,at);reviewNotices(s);
  assert.equal(s.linuxMagazineIssuesReceived,i+1);
 }
 assert.equal(linuxUnlocked(s),false);
 setDay(s,first+5*30+30);reviewNotices(s);
 assert.equal(linuxUnlocked(s),true);
});
test("Shop sells two NEW Linux PCs after magazine study, not Windows conversion",()=>{
 const s=completeSeries();s.cash=5000;
 assert.equal(installLinux(s,0).ok,false);
 assert.equal(createWindowsLicensePort(()=>s).rows()[0].linuxAction,null);
 assert.equal(shop(s).snapshot("linux-lab-99").disabled,true,"original three workstations occupy room");
 physicalRoom(s);
 const cash=s.cash,index=buy(s);
 assert.equal(index,3);assert.equal(s.cash,cash-440);
 assert.equal(linuxMachineFor(s,index),"linux-lab-99");
 assert.equal(isLinuxPc(s,index),true);
 assert.equal(s.pcLinuxInstalled[index],true);
 assert.equal(s.pcWindowsLicenses[index]===true,false);
 const second=buy(s,"linux-dev-99");
 assert.equal(second,4);
 assert.equal(linuxMachineFor(s,second),"linux-dev-99");
 assert.equal(isLinuxPc(s,0),false);
 assert.equal(shop(s).snapshot("linux-dev-99").disabled,true);
 assert.equal(isValidSave(s),true);
});
test("New Linux computer has no Windows license, and paid Windows can be booted",()=>{
 const {s,index}=equipped(),ops=createStationActionsPort(()=>s);
 assert.equal(createWindowsLicensePort(()=>s).rows()[index].linuxAction.disabled,true);
 assert.equal(ops.linux(index,"windows").ok,false);
 ok(ops.power(index));
 assert.equal(ops.linux(index,"windows").ok,false);
 const cash=s.cash;ok(ops.windows(index,"win98"));
 assert.equal(s.cash,cash-120);assert.equal(isLinuxPc(s,index),false);
 ok(ops.linux(index,"install"));assert.equal(isLinuxPc(s,index),true);
 ok(ops.linux(index,"windows"));assert.equal(isLinuxPc(s,index),false);
 assert.equal(isValidSave(s),true);
});
test("Real student pays for Linux-only workstation during internet outage",()=>{
 const {s,index}=equipped();
 s.pcPoweredOff=[true,true,true,false];
 const c=visitor();s.customers=[c];
 s.offlineUntil=s.totalMinutes+300;
 assert.deepEqual(operationalLinuxPcs(s),[index]);
 assert.equal(chooseAvailablePc(s,c),index);
 const cash=s.cash;
 tryServe(s,c);
 assert.equal(c.stage,"to_pc");
 assert.equal(c.pcIndex,index);
 assert.equal(s.linuxSessions,1);
 assert.equal(s.linuxRevenue,1.88);
 assert.equal(s.cash,cash+1.88);
 tryServe(s,c);assert.equal(s.linuxSessions,1);
 assert.equal(isValidSave(s),true);
});
test("Linux machines do not run Windows-only games without Windows",()=>{
 const {s,index}=equipped();s.pcWindowsLicenses=[true,true,true,false];
 assert.deepEqual(eligibleEraGamePcs(s),[0,1,2]);
 assert.equal(eligibleEraGamePcs(s).includes(index),false);
});
test("Linux monitor remains procedural and its owner is a physical Linux PC",()=>{
 const {s,index}=equipped();
 assert.equal(pcActivityForStation(s,index,1999),"linux-terminal");
 assert.equal(pcActivityForStation(s,0,1999),null);
 const p=[],next=[];
 drawPcScreenActivity((...x)=>p.push(x),"linux-terminal",0);
 drawPcScreenActivity((...x)=>next.push(x),"linux-terminal",5);
 assert.ok(p.length>10);assert.notDeepEqual(p,next);
 assert.ok(p.every(x=>x[0]>=0&&x[1]>=0&&x[0]+x[2]<=1.00001&&x[1]+x[3]<=1.00001));
});
test("Save preserves magazine progress, expenses and Linux machine; corrupt data rejected",()=>{
 const base=game();
 assert.equal(isValidSave(base),true);
 assert.equal(parseImportedSave(serializeSave(base)).linuxMagazineSubscriptionDay,undefined);
 const s=subscribe();setDay(s,450);reviewNotices(s);
 const partial=parseImportedSave(serializeSave(s));
 assert.equal(partial.linuxMagazineIssuesReceived,1);
 assert.equal(partial.linuxMagazineLastDeliveryDay,450);
 assert.equal(partial.expenses,s.expenses);
 const damaged=structuredClone(partial);damaged.linuxMagazineIssuesReceived=6;
 assert.equal(isValidSave(damaged),false);
 const impossible=structuredClone(partial);impossible.linuxMagazineLastDeliveryDay=700;
 assert.equal(isValidSave(impossible),false);
 const completed=completeSeries();physicalRoom(completed);const index=buy(completed);
 const restored=parseImportedSave(serializeSave(completed));
 assert.equal(linuxMachineFor(restored,index),"linux-lab-99");
 assert.equal(restored.linuxMagazineIssuesReceived,6);
 assert.equal(restored.pcLinuxInstalled[index],true);
 assert.equal(isLinuxPc(restored,index),true);
 assert.equal(restored.cash,completed.cash);
 assert.equal(nextLinuxLetter(restored),null);
});
