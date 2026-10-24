import test from "node:test";
import assert from "node:assert/strict";
import {createGame,isValidSave,visitorArrivalChance} from "../dist/js/sim/engine.js";
import {reviewNotices,readNotice} from "../dist/js/sim/notices.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {DAYS_PER_YEAR} from "../dist/js/sim/mailCalendar.js";
import {ERIC_SECOND_MAIL_ID,ERIC_FIRST_MAIL_ID,ericFirstMailDayOfYear,ericSecondMailDayOfYear} from "../dist/js/sim/ericStory.js";
import {ERIC_MULTIPLAYER_GAME_ID,ERA_GAME_CATALOG,quoteEraGame,licenseEraGame,eraGameVisitorMultiplier,multiplayerEligiblePcs,multiplayerGameKnown} from "../dist/js/sim/eraGames.js";
import {licenseGames} from "../dist/js/sim/economy.js";
import {licenseWindows} from "../dist/js/sim/era.js";
import {toggleStationPower} from "../dist/js/sim/stationPower.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {withStationOff} from "./station-power-fixture.mjs";

const at=(s,year,day=1)=>{s.totalMinutes=((year-1998)*DAYS_PER_YEAR+day-1)*DAY_MINUTES;};
const letters=(s,id)=>(s.notices??[]).filter(n=>n.id===id);
const licensePc=(s,i)=>assert.equal(withStationOff(s,i,()=>licenseWindows(s,i,"win98")).ok,true);

test("segunda mensagem de Eric aparece uma vez em junho/julho de 2000",()=>{
 for(const seed of [1,77,1998,72421]){
  const s=createGame(seed,"historical"),first=ericFirstMailDayOfYear(s);
  const second=ericSecondMailDayOfYear(s);
  assert.ok(first>=8&&first<=51);
  assert.ok(second>=156&&second<=200);
  at(s,2000,first);reviewNotices(s);
  const cash=s.cash,rng=s.rng,expenses=s.expenses;
  assert.equal(letters(s,ERIC_FIRST_MAIL_ID).length,1);
  at(s,2000,second-1);reviewNotices(s);
  assert.equal(letters(s,ERIC_SECOND_MAIL_ID).length,0);
  at(s,2000,second);reviewNotices(s);reviewNotices(s);
  assert.equal(letters(s,ERIC_SECOND_MAIL_ID).length,1);
  assert.match(letters(s,ERIC_SECOND_MAIL_ID)[0].body,/Tony|primo|computadores/i);
  assert.equal(s.cash,cash);assert.equal(s.expenses,expenses);assert.equal(s.rng,rng);
  assert.equal(s.ericSecondMailDelivered,true);
  assert.equal(readNotice(s,ERIC_SECOND_MAIL_ID),true);
  const reload=parseImportedSave(serializeSave(s));
  assert.equal(reload.ericSecondMailDelivered,true);
  reload.notices=[];
  at(reload,2000,210);reviewNotices(reload);
  assert.equal(letters(reload,ERIC_SECOND_MAIL_ID).length,0);
  assert.equal(isValidSave(reload),true);
 }
});

test("cartas não aparecem atrasadas e a reentrada fica possível em 2001",()=>{
 const s=createGame(8,"historical");at(s,2000,ericSecondMailDayOfYear(s));
 reviewNotices(s);assert.equal(letters(s,ERIC_SECOND_MAIL_ID).length,0);
 const old=createGame(8,"historical");at(old,2001);
 reviewNotices(old);assert.equal(letters(old,ERIC_SECOND_MAIL_ID).length,0);
 assert.equal(multiplayerGameKnown(old),true);
 old.ericSecondMailDelivered="yes";assert.equal(isValidSave(old),false);
});

test("Setor Zero tem licença real e procura só com dois PCs operacionais",()=>{
 const title=ERA_GAME_CATALOG.find(t=>t.id===ERIC_MULTIPLAYER_GAME_ID);
 assert.ok(title);assert.equal(title.year,2000);
 const s=createGame(54,"historical");s.cash=3000;
 assert.equal(quoteEraGame(s,title.id).ok,false);
 at(s,2000,170);
 assert.match(quoteEraGame(s,title.id).message,/Eric/);
 s.ericSecondMailDelivered=true;
 assert.match(quoteEraGame(s,title.id).message,/direitos básicos/);
 assert.equal(licenseGames(s).ok,true);
 assert.match(quoteEraGame(s,title.id).message,/Windows/);
 licensePc(s,0);
 assert.match(quoteEraGame(s,title.id).message,/dois PCs/);
 licensePc(s,1);
 assert.deepEqual(multiplayerEligiblePcs(s),[0,1]);
 const before=visitorArrivalChance(s,0);
 const cash=s.cash,expenses=s.expenses,revenue=s.revenue,rng=s.rng;
 assert.equal(licenseEraGame(s,title.id).ok,true);
 assert.equal(s.cash,cash-title.cost);assert.equal(s.expenses,expenses+title.cost);
 assert.equal(s.revenue,revenue);assert.equal(s.rng,rng);
 assert.ok(visitorArrivalChance(s,0)>before);
 assert.equal(eraGameVisitorMultiplier(s),1.015);
 assert.equal(licenseEraGame(s,title.id).ok,false);
 const saved=parseImportedSave(serializeSave(s));
 assert.deepEqual(saved.licensedEraGames,[title.id]);
 assert.equal(isValidSave(saved),true);
 assert.equal(toggleStationPower(s,1).ok,true);
 assert.equal(eraGameVisitorMultiplier(s),1);
 assert.equal(toggleStationPower(s,1).ok,true);
 assert.equal(eraGameVisitorMultiplier(s),1.015);
 s.pcWear[1]=100;
 assert.equal(eraGameVisitorMultiplier(s),1);
 s.pcWear[1]=0;
 assert.equal(eraGameVisitorMultiplier(s),1.015);
});

test("em 2001, jogador que perdeu a carta ainda pode licenciar o jogo",()=>{
 const s=createGame(9,"historical");s.cash=3000;
 assert.equal(licenseGames(s).ok,true);
 licensePc(s,0);licensePc(s,1);
 at(s,1999,360);assert.equal(quoteEraGame(s,ERIC_MULTIPLAYER_GAME_ID).ok,false);
 at(s,2000,100);assert.equal(quoteEraGame(s,ERIC_MULTIPLAYER_GAME_ID).ok,false);
 at(s,2001,1);assert.equal(multiplayerGameKnown(s),true);
 assert.equal(quoteEraGame(s,ERIC_MULTIPLAYER_GAME_ID).ok,true);
 assert.equal(licenseEraGame(s,ERIC_MULTIPLAYER_GAME_ID).ok,true);
 assert.equal(isValidSave(parseImportedSave(serializeSave(s))),true);
});
