import test from "node:test";
import assert from "node:assert/strict";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {PS1_CD_CATALOG} from "../dist/js/sim/ps1.js";
import {PS2_GAME_CATALOG} from "../dist/js/sim/ps2.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {TOP_GAMES_TITLE,TOP_GAMES_ISSUES,TOP_GAMES_MONTHLY_BASE_PRICE,
 subscribeTopGames,cancelTopGames,topGamesIssuePrice,topGamesKnowsGame,
 nextTopGamesIssue,nextTopGamesDeliveryDay,dueTopGamesIssue,receiveTopGamesIssue
} from "../dist/js/sim/topGamesMagazines.js";

const at=(s,year,month=1,day=1)=>{
 s.totalMinutes=((year-1998)*360+(month-1)*30+day-1)*DAY_MINUTES;
};
const starter=(year=2002)=>{
 const s=createGame(2002,"historical");at(s,year);s.cash=5000;return s;
};
test("Top Games derives one original issue from each PS1 and PS2 title, with no duplicate games or months",()=>{
 assert.equal(TOP_GAMES_TITLE,"Top Games");
 assert.equal(TOP_GAMES_ISSUES.length,PS1_CD_CATALOG.length+PS2_GAME_CATALOG.length);
 assert.equal(TOP_GAMES_ISSUES.length,28);
 assert.equal(new Set(TOP_GAMES_ISSUES.map(m=>m.id)).size,28);
 const original=[
  ...PS1_CD_CATALOG.map(g=>"ps1:"+g.id),
  ...PS2_GAME_CATALOG.map(g=>"ps2:"+g.id)
 ];
 assert.deepEqual(TOP_GAMES_ISSUES.map(m=>m.platform+":"+m.gameId),original);
 for(const [year,count] of [[2002,7],[2003,2],[2004,2],[2005,2],
  [2006,7],[2007,2],[2008,2],[2009,2],[2010,2]]){
  const issues=TOP_GAMES_ISSUES.filter(m=>m.releaseYear===year);
  assert.equal(issues.length,count);
  assert.deepEqual(issues.map(m=>m.releaseMonth),Array.from({length:count},(_,i)=>i+1));
  for(const issue of issues)
   assert.equal(issue.publicationDay,(year-1998)*360+(issue.releaseMonth-1)*30+15);
 }
});
test("subscription opt-in never bills early, charges exactly once on each physical issue receipt",()=>{
 const s=starter();
 const before=JSON.stringify(s),cash=s.cash,expenses=s.expenses;
 assert.equal(subscribeTopGames(s).ok,true);
 assert.equal(s.cash,cash);assert.equal(s.expenses,expenses);
 assert.equal(s.topGamesSubscriptionActive,true);
 assert.equal(subscribeTopGames(s).ok,false);
 const first=TOP_GAMES_ISSUES[0];
 assert.equal(nextTopGamesIssue(s)?.id,first.id);
 assert.equal(nextTopGamesDeliveryDay(s),first.publicationDay);
 assert.equal(dueTopGamesIssue(s),null);
 assert.equal(receiveTopGamesIssue(s,first.id).ok,false,"no preview unlock");
 assert.equal(topGamesKnowsGame(s,"ps1",first.gameId),false);
 at(s,2002,1,15);
 assert.equal(topGamesIssuePrice(s),TOP_GAMES_MONTHLY_BASE_PRICE);
 assert.equal(dueTopGamesIssue(s)?.id,first.id);
 assert.equal(receiveTopGamesIssue(s,first.id).ok,true);
 assert.equal(s.cash,cash-12);assert.equal(s.expenses,expenses+12);
 assert.equal(s.topGamesReceivedIssues?.length,1);
 assert.equal(topGamesKnowsGame(s,"ps1",first.gameId),true);
 assert.equal(topGamesKnowsGame(s,"ps1",TOP_GAMES_ISSUES[1].gameId),false);
 assert.equal(receiveTopGamesIssue(s,first.id).ok,false,"double charge blocked");
 assert.equal(s.cash,cash-12);
 assert.equal(dueTopGamesIssue(s),null,"next magazine cannot arrive the same month");
 assert.equal(isValidSave(s),true);
 assert.notEqual(JSON.stringify(s),before);
});
test("no money: no magazine, no unlock, no charge; subscription may be paused and resumed",()=>{
 const s=starter();assert.equal(subscribeTopGames(s).ok,true);
 at(s,2002,1,15);
 const issue=dueTopGamesIssue(s);
 assert.ok(issue);
 s.cash=0;
 assert.equal(receiveTopGamesIssue(s,issue.id).ok,false);
 assert.equal(s.topGamesReceivedIssues?.length,0);
 assert.equal(s.expenses,0);
 assert.equal(cancelTopGames(s).ok,true);
 assert.equal(cancelTopGames(s).ok,false);
 assert.equal(dueTopGamesIssue(s),null);
 s.cash=30;
 assert.equal(subscribeTopGames(s).ok,true);
 assert.equal(receiveTopGamesIssue(s,issue.id).ok,true);
 assert.equal(s.topGamesSubscriptionDay,(2002-1998)*360+1,
  "resuming must not reset subscription or grant backdated months");
 assert.equal(isValidSave(s),true);
});
test("exactly one eligible issue per month; older collection can be caught up, never in one batch",()=>{
 const s=starter();assert.equal(subscribeTopGames(s).ok,true);
 for(let i=0;i<7;i++){
  at(s,2002,i+1,15);
  const issue=dueTopGamesIssue(s);
  assert.equal(issue?.id,TOP_GAMES_ISSUES[i].id);
  assert.equal(receiveTopGamesIssue(s,issue.id).ok,true);
  assert.equal(receiveTopGamesIssue(s,TOP_GAMES_ISSUES[i+1]?.id??issue.id).ok,false);
 }
 assert.equal(s.topGamesReceivedIssues?.length,7);
 assert.equal(dueTopGamesIssue(s),null);
 at(s,2003,1,14);assert.equal(dueTopGamesIssue(s),null);
 at(s,2003,1,15);assert.equal(dueTopGamesIssue(s)?.gameId,PS1_CD_CATALOG[7].id);
 const late=starter(2010);
 assert.equal(subscribeTopGames(late).ok,true);
 assert.equal(dueTopGamesIssue(late)?.id,TOP_GAMES_ISSUES[0].id,
  "older editions are available to a later subscriber, without a bulk catchup");
 assert.equal(receiveTopGamesIssue(late,TOP_GAMES_ISSUES[0].id).ok,true);
 assert.equal(dueTopGamesIssue(late),null);
 at(late,2010,2,1);
 assert.equal(dueTopGamesIssue(late)?.id,TOP_GAMES_ISSUES[1].id);
});
test("save import accepts legacy campaigns and paid issues, rejects duplicates and future issues",()=>{
 const old=starter();
 assert.equal(isValidSave(old),true);
 assert.equal(parseImportedSave(serializeSave(old)).topGamesSubscriptionDay,undefined);
 const s=starter();assert.equal(subscribeTopGames(s).ok,true);
 at(s,2002,1,15);const magazine=dueTopGamesIssue(s);
 assert.ok(magazine);
 assert.equal(receiveTopGamesIssue(s,magazine.id).ok,true);
 const restored=parseImportedSave(serializeSave(s));
 assert.deepEqual(restored.topGamesReceivedIssues,[magazine.id]);
 assert.equal(restored.topGamesLastDeliveryDay,s.topGamesLastDeliveryDay);
 assert.equal(isValidSave(restored),true);
 const malformed=[
  {topGamesReceivedIssues:[magazine.id,magazine.id]},
  {topGamesReceivedIssues:["top-games-hacked"]},
  {topGamesReceivedIssues:[TOP_GAMES_ISSUES[1].id]},
  {topGamesReceivedIssues:[...TOP_GAMES_ISSUES.map(m=>m.id)]},
  {topGamesLastDeliveryDay:s.topGamesLastDeliveryDay+1e6},
  {topGamesSubscriptionActive:"sim"}
 ];
 for(const patch of malformed){
  const invalid={...structuredClone(s),...patch};
  assert.equal(isValidSave(invalid),false,JSON.stringify(patch));
  assert.throws(()=>parseImportedSave(JSON.stringify({
   format:"softdown-lan-house-save",exportVersion:1,
   exportedAt:"2002-01-01T00:00:00.000Z",state:invalid
  })));
 }
});
