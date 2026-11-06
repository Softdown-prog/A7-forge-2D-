import test from "node:test";
import assert from "node:assert/strict";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {PS2_GAME_CATALOG,ps2ReleasedGames} from "../dist/js/sim/ps2.js";
import {reviewNotices,readNotice} from "../dist/js/sim/notices.js";
import {duePs2ReleaseAnnouncement,ps2ReleaseMailId,PS2_RELEASE_MAIL_YEARS} from "../dist/js/sim/ps2ReleaseMail.js";
import {parseImportedSave,serializeSave} from "../dist/js/sim/saveTransfer.js";

const at=(s,year,day=1)=>{s.totalMinutes=((year-1998)*360+day-1)*DAY_MINUTES;};
const mails=s=>(s.notices??[]).filter(n=>n.id.startsWith("ps2-games-"));
test("exactly two releases announced annually; the launch in 2006 preserves five originals",()=>{
 assert.deepEqual([...PS2_RELEASE_MAIL_YEARS],[2006,2007,2008,2009,2010]);
 for(const year of PS2_RELEASE_MAIL_YEARS){
  const s=createGame(100+year,"historical");
  at(s,year,1);
  const beforeRng=s.rng,cash=s.cash,expenses=s.expenses;
  const release=duePs2ReleaseAnnouncement(s);
  assert.ok(release,"current year has a one-time release announcement");
  assert.equal(release.id,ps2ReleaseMailId(year));
  const games=PS2_GAME_CATALOG.filter(g=>g.releaseYear===year);
  assert.equal(games.length,year===2006?7:2);
  assert.match(release.body,/revista Top Games/);
  assert.match(release.body,/carteiro/);
  for(const game of games)
   assert.equal(release.body.includes(game.title),false,
    "new campaign must discover "+game.title+" from the magazine, not the release notice");
  assert.ok(release.body.includes(String(ps2ReleasedGames(year).length)));
  if(year!==2010)assert.match(release.body,new RegExp(String(year+1)));
  else assert.match(release.body,/completo por enquanto/);
  reviewNotices(s);
  assert.deepEqual(s.ps2ReleaseMailSeenYears,[year]);
  assert.equal(mails(s).length,1);
  assert.equal(mails(s)[0].id,release.id);
  assert.equal(mails(s)[0].read,false);
  assert.equal(mails(s)[0].severity,"info");
  assert.equal(s.rng,beforeRng,"annual announcements do not consume visitor RNG");
  assert.equal(s.cash,cash,"launch notices do not purchase titles");
  assert.equal(s.expenses,expenses);
  assert.equal(isValidSave(s),true);
 }
});
test("legacy saves still receive their original PS2 release titles, without enabling magazine gates",()=>{
 for(const year of PS2_RELEASE_MAIL_YEARS){
  const old=createGame(year,"historical");
  delete old.topGamesUnlockMode; // previously exported campaigns are grandfathered
  at(old,year,1);
  const release=duePs2ReleaseAnnouncement(old);
  assert.ok(release);
  const titles=PS2_GAME_CATALOG.filter(g=>g.releaseYear===year).slice(-2);
  for(const game of titles)assert.ok(release.body.includes(game.title),game.title);
  assert.doesNotMatch(release.body,/revista Top Games/);
  assert.equal(old.topGamesSubscriptionDay,undefined);
  reviewNotices(old);
  assert.equal(mails(old).length,1);
  assert.equal(isValidSave(parseImportedSave(serializeSave(old))),true);
 }
});
test("no pre-release or classic-mode notices; saved campaigns do not backfill previous years",()=>{
 for(const year of [1998,2002,2005,2011,2030]){
  const s=createGame(40,"historical");at(s,year,1);
  reviewNotices(s);assert.equal(mails(s).length,0,String(year));
 }
 const classic=createGame(71,"classic");at(classic,2008,1);
 assert.equal(duePs2ReleaseAnnouncement(classic),null);
 reviewNotices(classic);assert.equal(mails(classic).length,0);
 const imported=createGame(72,"historical");at(imported,2009,12);
 reviewNotices(imported);
 assert.deepEqual(mails(imported).map(n=>n.id),["ps2-games-2009"]);
 assert.deepEqual(imported.ps2ReleaseMailSeenYears,[2009]);
});
test("yearly window is thirty days and delivers at most once after repeat reviews and reload",()=>{
 const s=createGame(340,"historical");
 at(s,2007,30);assert.ok(duePs2ReleaseAnnouncement(s));
 reviewNotices(s);reviewNotices(s);reviewNotices(s);
 assert.deepEqual(mails(s).map(n=>n.id),["ps2-games-2007"]);
 assert.equal(readNotice(s,"ps2-games-2007"),true);
 assert.equal(mails(s)[0].read,true);
 const saved=parseImportedSave(serializeSave(s));
 assert.deepEqual(saved.ps2ReleaseMailSeenYears,[2007]);
 saved.notices=[];
 reviewNotices(saved);
 assert.equal(mails(saved).length,0,"deleted notices never reappear within their year");
 at(saved,2008,3);
 reviewNotices(saved);reviewNotices(saved);
 assert.deepEqual(mails(saved).map(n=>n.id),["ps2-games-2008"]);
 assert.deepEqual(saved.ps2ReleaseMailSeenYears,[2007,2008]);
 assert.equal(isValidSave(saved),true);
 const afterWindow=createGame(341,"historical");at(afterWindow,2007,31);
 reviewNotices(afterWindow);assert.equal(mails(afterWindow).length,0);
});
test("save schema refuses duplicate, future or fabricated release history",()=>{
 const s=createGame(550,"historical");at(s,2008,1);
 assert.equal(isValidSave(s),true,"older saves without the optional field remain valid");
 for(const forged of [[2007,2007],[2009],[1999],[2011],[2006,2007,2008,2009,2010,2011],["2007"],null]){
  const changed=structuredClone(s);
  changed.ps2ReleaseMailSeenYears=forged;
  assert.equal(isValidSave(changed),false,JSON.stringify(forged));
  assert.throws(()=>parseImportedSave(JSON.stringify({
   format:"softdown-lan-house-save",exportVersion:1,exportedAt:new Date().toISOString(),state:changed
  })));
 }
 const clean=structuredClone(s);clean.ps2ReleaseMailSeenYears=[2006,2007,2008];
 assert.equal(isValidSave(clean),true);
 assert.deepEqual(parseImportedSave(serializeSave(clean)).ps2ReleaseMailSeenYears,[2006,2007,2008]);
});
