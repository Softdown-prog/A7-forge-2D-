import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {createPs1ShopDiscPort} from "../dist/js/application/ps1ShopDiscPort.js";
import {createPs2Port} from "../dist/js/application/ps2Port.js";
import {projectPs1Disc,projectPs2Game} from "../dist/js/ui/shopConsoleAngularProjection.js";
import {renderPs1ShopDiscCatalog} from "../dist/js/ui/ps1ShopDiscCatalog.js";
import {renderPs2ShopCatalog} from "../dist/js/ui/ps2Panels.js";
import {UNKNOWN_TOP_GAMES_TITLE,UNKNOWN_TOP_GAMES_GENRE} from "../dist/js/ui/topGamesConcealment.js";
import {subscribeTopGames,receiveTopGamesIssue,TOP_GAMES_ISSUES} from "../dist/js/sim/topGamesMagazines.js";

function game(year){
 const s=createGame(9081,"historical");
 s.totalMinutes=(year-1998)*360*DAY_MINUTES;s.cash=10000;
 return s;
}
class MockElement{
 constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.attrs={};this.className="";this.textContent="";}
 append(...children){this.children.push(...children);}
 setAttribute(name,value){this.attrs[name]=value;}
 getContext(){return null;}
 querySelector(){return null;}
 querySelectorAll(){return [];}
}
const harness=()=>{
 const doc={createElement:tag=>new MockElement(tag)};
 return {doc,host:new MockElement("section")};
};
test("new PS1 campaigns conceal all unknown titles, genres and covers in Angular and native shop",()=>{
 const s=game(2002),rows=createPs1ShopDiscPort(()=>s).snapshot();
 assert.equal(rows.length,7);
 assert.ok(rows.every(r=>r.magazineLocked&&r.disabled));
 const projected=rows.map(projectPs1Disc);
 assert.ok(projected.every(r=>r.title===UNKNOWN_TOP_GAMES_TITLE&&
   r.genre===UNKNOWN_TOP_GAMES_GENRE&&r.cover===null&&r.disabled));
 assert.ok(projected.every(r=>r.buttonText==="Leia a revista Top Games"));
 assert.equal(projected.some(r=>r.title==="Turbo Circuito"),false);
 const {doc,host}=harness();
 renderPs1ShopDiscCatalog(host,createPs1ShopDiscPort(()=>s),true,doc);
 const cards=host.children.filter(n=>n.className.includes("ps1-cd-shop-card"));
 assert.equal(cards.length,7);
 for(const [index,card] of cards.entries()){
  const [art,metadata,heading,body,button]=card.children;
  assert.equal(art.children[0].children[0].tag,"span");
  assert.equal(art.children[0].children[0].className,"top-games-secret-cover");
  assert.equal(art.children[0].children[0].src,undefined);
  assert.equal(heading.textContent,UNKNOWN_TOP_GAMES_TITLE);
  assert.ok(metadata.textContent.includes(UNKNOWN_TOP_GAMES_GENRE));
  assert.match(body.textContent,/Receba a edição Top Games/);
  assert.equal(button.disabled,true);
  assert.equal(button.dataset.buyPs1Disc,rows[index].id,
   "existing delegated purchase target remains intact but disabled");
  assert.equal(JSON.stringify(card).includes(rows[index].title),false);
 }
 assert.equal(isValidSave(s),true);
});
test("receiving first PS1 issue reveals exactly its cover and title, not other games",()=>{
 const s=game(2002);assert.equal(subscribeTopGames(s).ok,true);
 s.totalMinutes+=14*DAY_MINUTES;
 assert.equal(receiveTopGamesIssue(s,TOP_GAMES_ISSUES[0].id).ok,true);
 const rows=createPs1ShopDiscPort(()=>s).snapshot().map(projectPs1Disc);
 assert.equal(rows[0].title,"Turbo Circuito");
 assert.match(rows[0].genre,/corrida/i);
 assert.ok(rows[0].cover?.includes("turbo-circuito"));
 assert.ok(rows.slice(1).every(r=>r.title===UNKNOWN_TOP_GAMES_TITLE&&r.cover===null));
 const {doc,host}=harness();
 renderPs1ShopDiscCatalog(host,createPs1ShopDiscPort(()=>s),true,doc);
 const cards=host.children.filter(n=>n.className.includes("ps1-cd-shop-card"));
 assert.equal(cards[0].children[0].children[0].children[0].tag,"img");
 assert.equal(cards[0].children[2].textContent,"Turbo Circuito");
 assert.equal(cards[1].children[2].textContent,UNKNOWN_TOP_GAMES_TITLE);
 assert.equal(isValidSave(s),true);
});
test("PS2 new campaigns mask every unknown game in both presentation paths",()=>{
 const s=game(2006),snapshot=createPs2Port(()=>s).snapshot();
 assert.equal(snapshot.games.length,7);
 assert.ok(snapshot.games.every(g=>g.magazineLocked&&g.disabled));
 const views=snapshot.games.map(projectPs2Game);
 assert.ok(views.every(g=>g.title===UNKNOWN_TOP_GAMES_TITLE&&g.cover===null));
 assert.ok(views.every(g=>g.genre===UNKNOWN_TOP_GAMES_GENRE&&g.buttonText==="Leia a revista Top Games"));
 const {doc,host}=harness();
 renderPs2ShopCatalog(host,createPs2Port(()=>s),doc);
 const cards=host.children.filter(n=>n.className.includes("ps2-game-card"));
 assert.equal(cards.length,7);
 for(const c of cards){
  assert.equal(c.children[0].tag,"span");
  assert.equal(c.children[0].className,"top-games-secret-cover");
  assert.equal(c.children[1].textContent,UNKNOWN_TOP_GAMES_TITLE);
  assert.match(c.children[2].textContent,/revista Top Games/i);
  assert.equal(c.children[3].disabled,true);
  assert.equal(c.children[3].textContent,"Leia a revista Top Games");
 }
 assert.equal(isValidSave(s),true);
});
test("PS2 issued magazine reveals only one title, and existing media never disappear",()=>{
 const s=game(2006);
 s.totalMinutes+=15*DAY_MINUTES;
 s.topGamesSubscriptionDay=(2002-1998)*360+1;
 s.topGamesSubscriptionActive=true;
 s.topGamesReceivedIssues=TOP_GAMES_ISSUES.slice(0,14).map(issue=>issue.id);
 s.topGamesLastDeliveryDay=(2006-1998)*360+15;
 assert.equal(isValidSave(s),true);
 const games=createPs2Port(()=>s).snapshot().games.map(projectPs2Game);
 assert.equal(games[0].title,"Cidade em Fuga");
 assert.ok(games[0].cover?.includes("cidade-em-fuga"));
 assert.ok(games.slice(1).every(g=>g.title===UNKNOWN_TOP_GAMES_TITLE&&g.cover===null));
 // A previously purchased disc stays visible even without a magazine record.
 const owned=game(2006);
 owned.ps2Games={"cidade-em-fuga":1};
 assert.equal(createPs2Port(()=>owned).snapshot().games[0].magazineLocked,false);
 assert.equal(projectPs2Game(createPs2Port(()=>owned).snapshot().games[0]).title,"Cidade em Fuga");
});
test("older campaigns still show all original PS1 and PS2 covers, and Angular template has a placeholder",()=>{
 for(const year of [2002,2006]){
  const s=game(year);delete s.topGamesUnlockMode;
  const ps1=createPs1ShopDiscPort(()=>s).snapshot().map(projectPs1Disc);
  assert.ok(ps1.every(g=>g.title!==UNKNOWN_TOP_GAMES_TITLE&&g.cover!==null));
  if(year===2006){
   const ps2=createPs2Port(()=>s).snapshot().games.map(projectPs2Game);
   assert.equal(ps2.length,7);
   assert.ok(ps2.every(g=>g.title!==UNKNOWN_TOP_GAMES_TITLE&&g.cover!==null));
  }
  assert.equal(isValidSave(s),true);
 }
 const template=readFileSync(new URL("../frontend-angular/src/templates/shop-catalog.html",import.meta.url),"utf8");
 assert.equal((template.match(/class="top-games-secret-cover"/g)??[]).length,2);
 assert.match(template,/@if\(disc\.cover\).*@else/);
 assert.match(template,/@if\(game\.cover\).*@else/);
});
