import test from "node:test";
import assert from "node:assert/strict";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {buyPs1Station,buyPs1Disc,ps1DiscCopies,ps1PlayableDisc} from "../dist/js/sim/ps1.js";
import {buyPs2Station,buyPs2Game,ps2GameCopies,ps2PlayableGame} from "../dist/js/sim/ps2.js";
import {createPs1ShopDiscPort} from "../dist/js/application/ps1ShopDiscPort.js";
import {createPs2Port} from "../dist/js/application/ps2Port.js";
import {projectPs1Disc,projectPs2Game} from "../dist/js/ui/shopConsoleAngularProjection.js";
import {TOP_GAMES_ISSUES,subscribeTopGames,cancelTopGames,topGamesKnowsGame,topGamesIssuePrice} from "../dist/js/sim/topGamesMagazines.js";
import {tickPostman} from "../dist/js/sim/postmanDelivery.js";
import {parseImportedSave,serializeSave} from "../dist/js/sim/saveTransfer.js";

const on=(s,year,month=1,day=1)=>{
 s.totalMinutes=((year-1998)*360+(month-1)*30+day-1)*DAY_MINUTES;
 return s;
};
function fresh(year=2002){
 const s=createGame(4480,"historical");
 on(s,year);s.cash=20000;
 return s;
}
function handoff(s,max=150){
 const prior=s.topGamesReceivedIssues?.length??0;
 for(let i=0;i<max&&(s.topGamesReceivedIssues?.length??0)===prior;i++){
  tickPostman(s);s.totalMinutes++;
 }
 assert.equal(s.topGamesReceivedIssues?.length,prior+1,"courier must physically deliver one issue");
}
test("fresh 2002 campaign requires Top Games: direct engine purchase and Angular shop are locked",()=>{
 const s=fresh();
 assert.equal(s.topGamesUnlockMode,"magazines");
 assert.equal(buyPs1Station(s,"floor-2").ok,true);
 const row=()=>createPs1ShopDiscPort(()=>s).snapshot().find(x=>x.id==="turbo-circuito");
 assert.equal(row().magazineLocked,true);
 assert.equal(row().disabled,true);
 assert.equal(projectPs1Disc(row()).buttonText,"Leia a revista Top Games");
 const before=JSON.stringify(s);
 const blocked=buyPs1Disc(s,"turbo-circuito");
 assert.equal(blocked.ok,false);
 assert.match(blocked.message,/revista Top Games/);
 assert.equal(JSON.stringify(s),before,"blocked direct call must not mutate save or charge");
 assert.equal(subscribeTopGames(s).ok,true);
 assert.equal(row().magazineLocked,true,"subscribing is not the same as receiving");
 assert.equal(ps1DiscCopies(s,"turbo-circuito"),0);
 on(s,2002,1,14);tickPostman(s);
 assert.equal(s.postmanDelivery,undefined);
 assert.equal(row().magazineLocked,true);
 on(s,2002,1,15);
 const price=topGamesIssuePrice(s),cash=s.cash;
 handoff(s);
 assert.equal(s.cash,cash-price);
 assert.equal(row().magazineLocked,false);
 assert.equal(row().disabled,false);
 assert.equal(topGamesKnowsGame(s,"ps1","turbo-circuito"),true);
 assert.equal(ps1DiscCopies(s,"turbo-circuito"),0,"the magazine itself never grants a CD");
 assert.equal(buyPs1Disc(s,"turbo-circuito").ok,true);
 assert.equal(ps1PlayableDisc(s,0),"turbo-circuito");
 assert.equal(ps1DiscCopies(s,"turbo-circuito"),1);
 assert.equal(buyPs1Disc(s,"gol-de-rua").ok,false,"one edition does not unlock every game");
 assert.equal(cancelTopGames(s).ok,true);
 assert.equal(buyPs1Disc(s,"turbo-circuito").ok,true,"known game can be restocked after pausing");
 assert.equal(isValidSave(s),true);
});
test("PS2 requires its own issue even after Tony received all PS1 magazines",()=>{
 const s=fresh(2006),port=createPs2Port(()=>s);
 assert.equal(buyPs2Station(s,"floor-2").ok,true);
 const before=JSON.stringify(s),locked=port.snapshot().games.find(g=>g.id==="cidade-em-fuga");
 assert.equal(locked.magazineLocked,true);
 assert.equal(projectPs2Game(locked).disabled,true);
 assert.match(locked.buyText,/Top Games/);
 assert.equal(buyPs2Game(s,"cidade-em-fuga").ok,false);
 assert.equal(JSON.stringify(s),before);
 // Valid imported progression: 13 earlier issues acquired over 2002–2005.
 s.topGamesSubscriptionDay=(2002-1998)*360+1;
 s.topGamesSubscriptionActive=true;
 s.topGamesReceivedIssues=TOP_GAMES_ISSUES.slice(0,13).map(x=>x.id);
 s.topGamesLastDeliveryDay=(2005-1998)*360+30+15;
 assert.equal(isValidSave(s),true);
 assert.equal(port.snapshot().games.find(g=>g.id==="cidade-em-fuga").magazineLocked,true);
 on(s,2006,1,15);
 const fee=topGamesIssuePrice(s),cash=s.cash;
 handoff(s);
 assert.equal(s.topGamesReceivedIssues.length,14);
 assert.equal(s.cash,cash-fee);
 assert.equal(port.snapshot().games.find(g=>g.id==="cidade-em-fuga").magazineLocked,false);
 assert.equal(port.snapshot().games.find(g=>g.id==="arena-dos-guardioes").magazineLocked,true);
 assert.equal(buyPs2Game(s,"cidade-em-fuga").ok,true);
 assert.equal(ps2GameCopies(s,"cidade-em-fuga"),1);
 assert.equal(ps2PlayableGame(s,0),"cidade-em-fuga");
 assert.equal(buyPs2Game(s,"arena-dos-guardioes").ok,false);
 assert.equal(isValidSave(parseImportedSave(serializeSave(s))),true);
});
test("save migration preserves pre-magazine console ownership and future purchases",()=>{
 const s=fresh(2006);
 delete s.topGamesUnlockMode; // exact shape of an old campaign
 assert.equal(buyPs1Station(s,"floor-1").ok,true);
 assert.equal(buyPs1Disc(s,"turbo-circuito").ok,true);
 assert.equal(buyPs2Station(s,"floor-2").ok,true);
 assert.equal(buyPs2Game(s,"cidade-em-fuga").ok,true);
 assert.equal(isValidSave(s),true);
 const migrated=parseImportedSave(serializeSave(s));
 assert.equal(migrated.topGamesUnlockMode,undefined);
 assert.equal(migrated.ps1Discs["turbo-circuito"],1);
 assert.equal(migrated.ps2Games["cidade-em-fuga"],1);
 assert.equal(ps1PlayableDisc(migrated,0),"turbo-circuito");
 assert.equal(ps2PlayableGame(migrated,0),"cidade-em-fuga");
 assert.equal(buyPs2Game(migrated,"arena-dos-guardioes").ok,true,
  "older campaigns retain their prior unlock policy");
 assert.equal(isValidSave(migrated),true);
});
test("invalid unlock policy in imported saves is refused; classic mode is unchanged",()=>{
 const s=fresh();
 const malformed=structuredClone(s);malformed.topGamesUnlockMode="bypass";
 assert.equal(isValidSave(malformed),false);
 assert.throws(()=>parseImportedSave(serializeSave(s).replace('"magazines"','"bypass"')));
 const classic=createGame(118,"classic");
 assert.equal(classic.topGamesUnlockMode,undefined);
 assert.equal(isValidSave(classic),true);
 const invalid=structuredClone(classic);invalid.topGamesUnlockMode="magazines";
 assert.equal(isValidSave(invalid),false);
});
