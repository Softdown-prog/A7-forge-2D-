import test from "node:test";
import assert from "node:assert/strict";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {tickPostman,POSTMAN_HANDOFF_MINUTES,postmanDoor,postmanCounter} from "../dist/js/sim/postmanDelivery.js";
import {TOP_GAMES_ISSUES,subscribeTopGames,cancelTopGames,
 dueTopGamesIssue,topGamesIssuePrice,topGamesKnowsGame} from "../dist/js/sim/topGamesMagazines.js";
import {reviewNotices,readNotice} from "../dist/js/sim/notices.js";
import {startLinuxResearch,LINUX_MAGAZINE_ISSUE_COST} from "../dist/js/sim/linuxQuest.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {actorStyleFor} from "../dist/js/render/actorArt.js";
import {workerRoute} from "../dist/js/sim/workerNavigation.js";
const at=(s,year,month=1,day=1)=>{
 s.totalMinutes=((year-1998)*360+(month-1)*30+day-1)*DAY_MINUTES;
 return s;
};
const game=(year=2002)=>{const s=at(createGame(872,"historical"),year);s.cash=3000;return s;};
const step=s=>{tickPostman(s);s.totalMinutes++;};
function travel(s,until,limit=180){
 const phases=new Set();
 for(let i=0;i<limit;i++){
  step(s);
  if(s.postmanDelivery)phases.add(s.postmanDelivery.phase);
  if(until(s))return phases;
 }
 assert.fail("Courier did not finish requested phase within "+limit+" simulated minutes");
}
test("real postman walks to Tony, pays only on handoff and emits one delivered issue",()=>{
 const s=game(),base=s.cash,spent=s.expenses,rng=s.rng;
 assert.equal(subscribeTopGames(s).ok,true);
 at(s,2002,1,14);
 step(s);assert.equal(s.postmanDelivery,undefined,"unpublished first issue is not delivered");
 assert.equal(s.cash,base);
 at(s,2002,1,15);
 assert.equal(dueTopGamesIssue(s)?.id,TOP_GAMES_ISSUES[0].id);
 tickPostman(s);
 assert.equal(s.postmanDelivery?.magazine,"top-games");
 assert.equal(s.postmanDelivery?.issueId,TOP_GAMES_ISSUES[0].id);
 assert.equal(s.postmanDelivery?.issueIndex,0);
 assert.equal(s.postmanDelivery?.phase,"arriving");
 assert.ok(Math.hypot(s.postmanDelivery.x-postmanDoor(s).x,s.postmanDelivery.y-postmanDoor(s).y)<1);
 assert.equal(s.cash,base,"no debit at spawn");
 assert.equal(s.notices?.some(n=>n.id===TOP_GAMES_ISSUES[0].id)??false,false);
 assert.equal(isValidSave(s),true);
 const phases=travel(s,x=>(x.topGamesReceivedIssues?.length??0)===1);
 assert.ok(phases.has("arriving")&&phases.has("handing"));
 assert.equal(s.cash,base-topGamesIssuePrice(s));
 assert.equal(s.expenses,spent+topGamesIssuePrice(s));
 assert.equal(topGamesKnowsGame(s,"ps1",TOP_GAMES_ISSUES[0].gameId),true);
 assert.equal(s.notices?.filter(n=>n.id===TOP_GAMES_ISSUES[0].id).length??0,1);
 assert.equal(s.notices?.find(n=>n.id===TOP_GAMES_ISSUES[0].id)?.severity,"info");
 assert.equal(s.rng,rng,"courier does not consume visitor RNG");
 assert.equal(isValidSave(s),true);
 assert.equal(readNotice(s,TOP_GAMES_ISSUES[0].id),true);
 travel(s,x=>x.postmanDelivery===undefined);
 for(let i=0;i<50;i++)step(s);
 assert.equal(s.topGamesReceivedIssues.length,1);
 assert.equal(s.cash,base-topGamesIssuePrice(s));
 assert.equal(s.notices?.filter(n=>n.id===TOP_GAMES_ISSUES[0].id).length,1);
 const style=actorStyleFor("postman",0);
 assert.equal(style.shirt,"#F4C949");assert.equal(style.pants,"#294F88");
 assert.equal(s.customers.length,0);
 assert.ok(postmanCounter(s));
});
test("reload during physical handoff preserves one edition and one payment",()=>{
 const s=game();assert.equal(subscribeTopGames(s).ok,true);at(s,2002,1,15);
 travel(s,x=>x.postmanDelivery?.phase==="handing");
 assert.equal(s.topGamesReceivedIssues?.length??0,0);
 assert.equal(isValidSave(s),true);
 const restored=parseImportedSave(serializeSave(s));
 assert.equal(restored.postmanDelivery.magazine,"top-games");
 assert.equal(restored.postmanDelivery.issueId,TOP_GAMES_ISSUES[0].id);
 const cash=restored.cash,expenses=restored.expenses;
 travel(restored,x=>(x.topGamesReceivedIssues?.length??0)===1,POSTMAN_HANDOFF_MINUTES+5);
 assert.equal(restored.cash,cash-topGamesIssuePrice(restored));
 assert.equal(restored.expenses,expenses+topGamesIssuePrice(restored));
 travel(restored,x=>x.postmanDelivery===undefined);
 for(let i=0;i<100;i++)step(restored);
 assert.equal(restored.topGamesReceivedIssues.length,1);
 assert.equal(restored.cash,cash-topGamesIssuePrice(restored));
 assert.equal(isValidSave(parseImportedSave(serializeSave(restored))),true);
});
test("pause or empty balance while walking cancels handoff without charge",()=>{
 for(const reason of ["pause","cash"]){
  const s=game(),start=s.cash;
  assert.equal(subscribeTopGames(s).ok,true);at(s,2002,1,15);
  travel(s,x=>x.postmanDelivery?.phase==="handing");
  if(reason==="pause")assert.equal(cancelTopGames(s).ok,true);
  else s.cash=0;
  assert.equal(isValidSave(s),true);
  travel(s,x=>x.postmanDelivery===undefined);
  assert.deepEqual(s.topGamesReceivedIssues,[]);
  assert.equal(s.expenses,0);
  assert.equal(s.cash,reason==="pause"?start:0);
  assert.equal(s.notices?.some(n=>n.id===TOP_GAMES_ISSUES[0].id),false);
  assert.equal(isValidSave(s),true);
  if(reason==="pause")assert.equal(subscribeTopGames(s).ok,true);
  else s.cash=start;
  travel(s,x=>(x.topGamesReceivedIssues?.length??0)===1);
  assert.equal(s.topGamesReceivedIssues.length,1);
  assert.equal(isValidSave(s),true);
 }
});
test("one shared actor serializes Top Games and delayed Linux subscription",()=>{
 const s=game(2006);
 reviewNotices(s);
 assert.equal(startLinuxResearch(s).ok,true);
 assert.equal(subscribeTopGames(s).ok,true);
 at(s,2006,1,30);
 assert.ok(dueTopGamesIssue(s));
 const beforeLinux=s.linuxMagazineIssuesReceived??0;
 const beforeTop=s.topGamesReceivedIssues?.length??0;
 const cash=s.cash,expenses=s.expenses;
 tickPostman(s);
 assert.equal(s.postmanDelivery?.magazine,"top-games",
  "older due edition from the same queue is delivered first");
 assert.equal(s.postmanDelivery?.issueIndex,0);
 travel(s,x=>(x.topGamesReceivedIssues?.length??0)===beforeTop+1);
 assert.equal(s.linuxMagazineIssuesReceived??0,beforeLinux,"no simultaneous Linux handoff");
 travel(s,x=>x.postmanDelivery===undefined);
 tickPostman(s);
 assert.equal(s.postmanDelivery?.magazine,undefined,"the same actor now delivers Linux");
 travel(s,x=>(x.linuxMagazineIssuesReceived??0)===beforeLinux+1);
 assert.equal(s.topGamesReceivedIssues.length,1);
 assert.equal(Math.round(s.cash*100),Math.round((cash-topGamesIssuePrice(s)-LINUX_MAGAZINE_ISSUE_COST)*100));
 assert.equal(Math.round(s.expenses*100),Math.round((expenses+topGamesIssuePrice(s)+LINUX_MAGAZINE_ISSUE_COST)*100));
 assert.equal(isValidSave(s),true);
});
test("wall blocking Tony's counter cannot produce a phantom magazine or payment",()=>{
 const s=game();assert.equal(subscribeTopGames(s).ok,true);
 at(s,2002,1,15);
 const before=s.cash;
 // A complete closed dividing wall: this geometry is deliberately
 // unreachable and cannot be built legally through the editor.
 s.interiorWalls=Array.from({length:8},(_,x)=>({axis:"x",x,y:4}));
 assert.equal(workerRoute(s,postmanDoor(s),postmanCounter(s)),null);
 for(let i=0;i<75;i++)step(s);
 assert.equal(s.postmanDelivery,undefined);
 assert.equal(s.topGamesReceivedIssues.length,0);
 assert.equal(s.cash,before);
 assert.equal(s.notices?.some(n=>n.id===TOP_GAMES_ISSUES[0].id)??false,false);
 // When the obstruction is cleared, the same issue is still pending.
 s.interiorWalls=[];
 travel(s,x=>(x.topGamesReceivedIssues?.length??0)===1);
 assert.equal(s.topGamesReceivedIssues.length,1);
 assert.equal(s.cash,before-topGamesIssuePrice(s));
});
test("courier validation rejects forged Top Games jobs but accepts original Linux save format",()=>{
 const s=game(),original=TOP_GAMES_ISSUES[0];
 assert.equal(subscribeTopGames(s).ok,true);at(s,2002,1,15);
 tickPostman(s);
 assert.equal(isValidSave(s),true);
 for(const bad of [
  {issueId:"top-games-ps2-not-a-game"},
  {issueIndex:28},
  {magazine:"something-else"},
  {issueId:TOP_GAMES_ISSUES[1].id},
  {magazine:undefined},
  {phase:"handing",progress:999}
 ]){
  const modified=structuredClone(s);
  modified.postmanDelivery={...modified.postmanDelivery,...bad};
  assert.equal(isValidSave(modified),false,JSON.stringify(bad));
 }
 const wrongYear=structuredClone(s);
 at(wrongYear,2001,1,15);
 assert.equal(isValidSave(wrongYear),false,"cannot carry a magazine before its publication");
 assert.equal(original.platform,"ps1");
 const linux=game(1999);
 at(linux,1999,3,1);reviewNotices(linux);
 assert.equal(startLinuxResearch(linux).ok,true);
 at(linux,1999,3,30);
 tickPostman(linux);
 assert.equal(linux.postmanDelivery?.magazine,undefined);
 assert.equal(isValidSave(linux),true);
 assert.equal(parseImportedSave(serializeSave(linux)).postmanDelivery.issueIndex,0);
});
