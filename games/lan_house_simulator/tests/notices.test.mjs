import assert from "node:assert/strict";
import test from "node:test";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {reviewNotices,readNotice,unreadNotices,hireContentProgrammer,missingWindowsLicenses} from "../dist/js/sim/notices.js";
import {licenseWindows} from "../dist/js/sim/era.js";
import {licenseGames} from "../dist/js/sim/economy.js";
import {parseImportedSave,serializeSave} from "../dist/js/sim/saveTransfer.js";
const setDay=(s,n)=>{s.totalMinutes=(n-1)*DAY_MINUTES;};
test("envelope entrega cartas ao longo dos dias, sem duplicar",()=>{
 const s=createGame();reviewNotices(s);assert.equal(s.notices?.length??0,0);
 setDay(s,2);reviewNotices(s);assert.equal(s.notices.length,1);
 setDay(s,5);reviewNotices(s);reviewNotices(s);
 assert.equal(s.notices.length,3);
 assert.equal(unreadNotices(s),3);
 assert.equal(readNotice(s,"safety"),true);assert.equal(unreadNotices(s),2);
 assert.equal(readNotice(s,"unknown"),false);
});
test("programador é contratação real sem cobrança repetida",()=>{
 const s=createGame();setDay(s,2);reviewNotices(s);
 const cash=s.cash,expenses=s.expenses;
 assert.equal(hireContentProgrammer(s).ok,true);
 assert.equal(s.cash,cash-320);assert.equal(s.expenses,expenses+320);
 assert.equal(hireContentProgrammer(s).ok,false);assert.equal(s.cash,cash-320);
});
test("carta de direitos autorais multa uma única vez, inclusive caixa negativo",()=>{
 const s=createGame();s.cash=10;setDay(s,12);reviewNotices(s);
 assert.equal(s.copyrightNoticeFine,true);
 assert.ok(s.cash<0);
 const before=s.cash;reviewNotices(s);assert.equal(s.cash,before);
 assert.ok(s.notices.some(n=>n.id==="copyright"&&n.severity==="urgent"));
});
test("Windows licenciado antes do prazo não recebe autuação",()=>{
 const s=createGame();s.cash=2000;
 for(let i=0;i<3;i++)assert.equal(licenseWindows(s,i,"win98").ok,true);
 assert.equal(missingWindowsLicenses(s),0);
 assert.equal(licenseGames(s).ok,true);
 setDay(s,20);reviewNotices(s);
 assert.equal(s.windowsNoticeFine,undefined);
 assert.equal(s.copyrightNoticeFine,undefined);
});
test("aviso e tratamento sobrevivem a save JSON legado",()=>{
 const s=createGame();setDay(s,3);reviewNotices(s);readNotice(s,"safety");
 const restored=parseImportedSave(serializeSave(s));
 assert.equal(restored.notices.length,2);
 assert.equal(unreadNotices(restored),1);
 assert.equal(isValidSave(restored),true);
 const legacy=createGame();delete legacy.notices;
 assert.equal(isValidSave(legacy),true);
});
