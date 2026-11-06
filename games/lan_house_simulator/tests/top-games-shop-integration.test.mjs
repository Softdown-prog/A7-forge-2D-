import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {createTopGamesShopPort} from "../dist/js/application/topGamesShopPort.js";
import {createShopActionsPort} from "../dist/js/application/shopActionsPort.js";
import {projectConsoleShop} from "../dist/js/ui/shopConsoleAngularProjection.js";
import {renderTopGamesSubscription} from "../dist/js/ui/topGamesShopPanel.js";
import {installShopControls} from "../dist/js/ui/shopControls.js";

const fixture=(year=2002,mode="historical")=>{
 const s=createGame(1234,mode);
 s.totalMinutes=(year-1998)*360*DAY_MINUTES;
 s.cash=1200;
 return s;
};
function fakeElement(tag){
 const el={
  tagName:tag.toUpperCase(),dataset:{},className:"",children:[],
  textContent:"",disabled:false,append(...items){this.children.push(...items);}
 };
 return el;
}
test("Top Games read model follows the active historical campaign, not cached Angular state",()=>{
 let state=fixture(2001);
 const port=createTopGamesShopPort(()=>state);
 let view=port.snapshot();
 assert.equal(view.available,false);
 assert.equal(view.actionDisabled,true);
 assert.equal(view.received,0);
 assert.equal(view.total,28);
 assert.match(view.buttonText,/2002/);
 state=fixture(2002);
 view=port.snapshot();
 assert.equal(view.available,true);
 assert.equal(view.active,false);
 assert.equal(view.actionDisabled,false);
 assert.equal(view.actionId,"top-games-subscribe");
 assert.match(view.status,/sem taxa inicial/i);
 assert.ok(view.editionPrice>0);
 state=fixture(2006);
 assert.equal(port.snapshot().actionId,"top-games-subscribe");
 state=fixture(2030,"classic");
 assert.equal(port.snapshot().actionDisabled,true);
});
test("store actions subscribe and pause via one business path, and do not charge until postman arrives",()=>{
 let state=fixture();
 const read=createTopGamesShopPort(()=>state),actions=createShopActionsPort(()=>state);
 const cash=state.cash,expenses=state.expenses;
 assert.equal(actions.purchase("top-games-cancel").ok,false);
 assert.equal(actions.purchase("top-games-subscribe").ok,true);
 assert.equal(read.snapshot().active,true);
 assert.equal(read.snapshot().actionId,"top-games-cancel");
 assert.equal(read.snapshot().nextIssueNumber,1);
 assert.equal(state.cash,cash);
 assert.equal(state.expenses,expenses);
 assert.equal(actions.purchase("top-games-subscribe").ok,false);
 assert.equal(actions.purchase("top-games-cancel").ok,true);
 assert.equal(read.snapshot().active,false);
 assert.equal(read.snapshot().actionId,"top-games-subscribe");
 assert.equal(read.snapshot().buttonText,"Retomar assinatura");
 assert.equal(actions.purchase("top-games-cancel").ok,false);
 state=parseImportedSave(serializeSave(state));
 assert.equal(isValidSave(state),true);
 assert.equal(read.snapshot().buttonText,"Retomar assinatura");
 assert.equal(actions.purchase("top-games-subscribe").ok,true);
 assert.equal(read.snapshot().received,0);
 assert.equal(state.cash,cash);
});
test("native monthly magazine card displays live status and delegated data-buy actions",()=>{
 const state=fixture();
 const port=createTopGamesShopPort(()=>state);
 const host={children:[],append(node){this.children.push(node);}};
 const doc={createElement:fakeElement};
 renderTopGamesSubscription(host,port.snapshot(),doc);
 assert.equal(host.children.length,1);
 const card=host.children[0];
 assert.equal(card.className,"shop-card top-games-subscription");
 assert.equal(card.children[0].textContent,"Top Games · assinatura mensal");
 const button=card.children.find(node=>node.tagName==="BUTTON");
 assert.equal(button.dataset.buy,"top-games-subscribe");
 assert.equal(button.disabled,false);
 assert.match(card.children[2].textContent,/0 de 28/);
 const actions=createShopActionsPort(()=>state);
 const root={listeners:{},addEventListener(type,callback){this.listeners[type]=callback;},
  querySelector(){return null;}};
 const ElementBefore=globalThis.Element,ButtonBefore=globalThis.HTMLButtonElement;
 class FakeElement{closest(){return this;}}
 class FakeButton extends FakeElement{constructor(data){super();this.dataset=data;this.disabled=false;}}
 globalThis.Element=FakeElement;globalThis.HTMLButtonElement=FakeButton;
 try{
  const results=[];
  installShopControls(root,actions,{onPlacement(){throw Error("unexpected placement");},
   onPurchase(result,id){results.push({result,id});}});
  root.listeners.click({target:new FakeButton({buy:"top-games-subscribe"})});
  assert.equal(results[0].id,"top-games-subscribe");
  assert.equal(results[0].result.ok,true);
  assert.equal(state.topGamesSubscriptionActive,true);
  root.listeners.click({target:new FakeButton({buy:"top-games-cancel"})});
  assert.equal(results[1].result.ok,true);
  assert.equal(state.topGamesSubscriptionActive,false);
  host.children.length=0;
  renderTopGamesSubscription(host,port.snapshot(),doc);
  assert.equal(host.children[0].children.at(-1).textContent,"Retomar assinatura");
 }finally{
  if(ElementBefore===undefined)delete globalThis.Element;
  else globalThis.Element=ElementBefore;
  if(ButtonBefore===undefined)delete globalThis.HTMLButtonElement;
  else globalThis.HTMLButtonElement=ButtonBefore;
 }
});
test("Angular projection is read-only and uses exactly the same shop command target",()=>{
 const state=fixture();
 const magazine=createTopGamesShopPort(()=>state).snapshot();
 const view=projectConsoleShop({text:"PS1",disabled:false},[],null,null,null,null,null,magazine);
 assert.deepEqual(view.topGames,magazine);
 assert.equal(view.topGames.actionId,"top-games-subscribe");
 assert.equal(projectConsoleShop({text:"PS1",disabled:false},[],null,null,null,null,null).topGames,null,
  "legacy projection callers remain valid");
 const root=new URL("../",import.meta.url);
 const angular=readFileSync(new URL("frontend-angular/src/shop-catalog.ts",root),"utf8");
 const template=readFileSync(new URL("frontend-angular/src/templates/shop-catalog.html",root),"utf8");
 const renderer=readFileSync(new URL("src/ui/shopCatalogRenderer.ts",root),"utf8");
 assert.match(angular,/purchase\(id:string\)/);
 assert.match(template,/angular-top-games/);
 assert.match(template,/purchase\(magazine\.actionId\)/);
 assert.match(renderer,/renderTopGamesSubscription\(/);
 assert.doesNotMatch(angular,/from ['"]\.\.\/sim\//);
 assert.doesNotMatch(renderer,/from ['"]\.\.\/sim\//);
});
