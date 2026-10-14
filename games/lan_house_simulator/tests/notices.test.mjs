import {withStationOff} from "./station-power-fixture.mjs";
import assert from "node:assert/strict";
import test from "node:test";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {reviewNotices,readNotice,unreadNotices,hireContentProgrammer,missingWindowsLicenses} from "../dist/js/sim/notices.js";
import {licenseWindows} from "../dist/js/sim/era.js";
import {licenseGames} from "../dist/js/sim/economy.js";
import {parseImportedSave,serializeSave} from "../dist/js/sim/saveTransfer.js";
import {sporadicMailSchedule} from "../dist/js/sim/mailCalendar.js";
const setDay=(s,n)=>{s.totalMinutes=(n-1)*DAY_MINUTES;};
test("correio distribui notificações entre anos sem acumular no primeiro mês",()=>{
 const s=createGame();reviewNotices(s);assert.equal(s.notices?.length??0,0);
 setDay(s,5);reviewNotices(s);assert.equal(s.notices?.length??0,0);
 const calendar=sporadicMailSchedule(s);
 const dates=["safety","windows","games"].map(id=>[id,calendar[id]]).sort((a,b)=>a[1]-b[1]);
 assert.ok(dates[0][1]>30);
 for(const [id,scheduledDay] of dates){
  setDay(s,scheduledDay);reviewNotices(s);reviewNotices(s);
  assert.equal(s.notices.filter(n=>n.id===id).length,1);
 }
 assert.equal(s.notices.filter(n=>["safety","windows","games"].includes(n.id)).length,3);
 const before=unreadNotices(s);
 assert.equal(readNotice(s,"safety"),true);
 assert.equal(unreadNotices(s),before-1);
 assert.equal(readNotice(s,"unknown"),false);
});
test("programador é contratação real sem cobrança repetida",()=>{
 const s=createGame();setDay(s,2);reviewNotices(s);
 const cash=s.cash,expenses=s.expenses;
 assert.equal(hireContentProgrammer(s).ok,true);
 assert.equal(s.cash,cash-320);assert.equal(s.expenses,expenses+320);
 assert.equal(hireContentProgrammer(s).ok,false);assert.equal(s.cash,cash-320);
});
test("multa de direitos autorais só acontece após carta e prazo relativo",()=>{
 const s=createGame();s.cash=10;setDay(s,12);reviewNotices(s);
 assert.equal(s.copyrightNoticeFine,undefined,"não deve multar antes da carta");
 const due=sporadicMailSchedule(s).games;
 setDay(s,due);reviewNotices(s);
 assert.ok(s.notices.some(n=>n.id==="games"));
 assert.equal(s.copyrightNoticeFine,undefined);
 setDay(s,due+6);reviewNotices(s);
 assert.equal(s.copyrightNoticeFine,undefined);
 setDay(s,due+7);reviewNotices(s);
 assert.equal(s.copyrightNoticeFine,true);
 assert.ok(s.cash<0);
 const after=s.cash;reviewNotices(s);assert.equal(s.cash,after);
 assert.ok(s.notices.some(n=>n.id==="copyright"&&n.severity==="urgent"));
});
test("multa de Windows depende da carta, e a licença adquirida impede penalização",()=>{
 const s=createGame();s.cash=2000;
 const due=sporadicMailSchedule(s).windows;
 setDay(s,due);reviewNotices(s);
 assert.ok(s.notices.some(n=>n.id==="windows"));
 for(let i=0;i<3;i++)assert.equal(withStationOff(s,i,()=>licenseWindows(s,i,"win98")).ok,true);
 setDay(s,due+100);reviewNotices(s);
 assert.equal(s.windowsNoticeFine,undefined);
});
test("Windows licenciado antes do prazo não recebe autuação",()=>{
 const s=createGame();s.cash=2000;
 for(let i=0;i<3;i++)assert.equal(withStationOff(s,i,()=>licenseWindows(s,i,"win98")).ok,true);
 assert.equal(missingWindowsLicenses(s),0);
 assert.equal(licenseGames(s).ok,true);
 setDay(s,20);reviewNotices(s);
 assert.equal(s.windowsNoticeFine,undefined);
 assert.equal(s.copyrightNoticeFine,undefined);
});
test("aviso e tratamento sobrevivem a save JSON legado",()=>{
 const s=createGame();setDay(s,sporadicMailSchedule(s).safety);reviewNotices(s);readNotice(s,"safety");
 const restored=parseImportedSave(serializeSave(s));
 assert.equal(restored.notices.length,1);
 assert.equal(unreadNotices(restored),0);
 assert.equal(isValidSave(restored),true);
 const legacy=createGame();delete legacy.notices;
 assert.equal(isValidSave(legacy),true);
});
