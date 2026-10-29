import {sourceModule,assertCompositionAdaptersExclude} from "./helpers/composition.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
 createVisibleAdminTextWriter,formatAdminMoney,
 renderAdminWindowVisibility,renderShopWindowVisibility,renderAdminDisclosure
} from "../dist/js/ui/adminShell.js";

const field=(initial="",hiddenSection=null)=>{
 let text=initial,assignments=0;
 return {
  closest:selector=>{
   assert.equal(selector,".admin-section[hidden],.management-page[hidden]");
   return hiddenSection;
  },
  get textContent(){return text;},
  set textContent(value){assignments++;text=value;},
  get writes(){return assignments;}
 };
};

test("texto do painel visível atualiza o elemento com mesmo ID",()=>{
 const target=field("antigo"),seen=[];
 const setText=createVisibleAdminTextWriter({getElementById:id=>{seen.push(id);return id==="admin-cash"?target:null;}});
 setText("admin-cash","R$ 100");
 assert.deepEqual(seen,["admin-cash"]);
 assert.equal(target.textContent,"R$ 100");
 assert.equal(target.writes,1);
});
test("texto idêntico não provoca escrita repetida no DOM",()=>{
 const target=field("R$ 100");
 const setText=createVisibleAdminTextWriter({getElementById:()=>target});
 setText("cash","R$ 100");
 assert.equal(target.writes,0);
 setText("cash","R$ 101");
 setText("cash","R$ 101");
 assert.equal(target.writes,1);
});
test("aba administrativa oculta preserva texto até ficar visível",()=>{
 let hidden={tag:"section"},target=field("anterior");
 target.closest=selector=>{assert.match(selector,/admin-section/);return hidden;};
 const setText=createVisibleAdminTextWriter({getElementById:()=>target});
 setText("admin-profit","novo");
 assert.equal(target.textContent,"anterior");
 hidden=null;
 setText("admin-profit","novo");
 assert.equal(target.textContent,"novo");
});
test("subpágina administrativa oculta não é atualizada",()=>{
 const target=field("anterior",{tag:"page"});
 const setText=createVisibleAdminTextWriter({getElementById:()=>target});
 setText("monthly-breakdown","novo");
 assert.equal(target.textContent,"anterior");
 assert.equal(target.writes,0);
});
test("elementos ausentes não interrompem o painel",()=>{
 const setText=createVisibleAdminTextWriter({getElementById:()=>null});
 assert.doesNotThrow(()=>setText("not-found","R$ 40"));
});
test("consulta DOM a cada render não retém elementos de outra página",()=>{
 let active=field("antigo");
 const setText=createVisibleAdminTextWriter({getElementById:()=>active});
 const first=active;
 setText("pc","primeiro");
 active=field("novo");
 setText("pc","segundo");
 assert.equal(first.textContent,"primeiro");
 assert.equal(active.textContent,"segundo");
});
test("formatação monetária conserva localidade brasileira original",()=>{
 for(const amount of [0,1,1000,1234.5,-20,1000000.75])
  assert.equal(formatAdminMoney(amount),"R$ "+amount.toLocaleString("pt-BR"));
 assert.equal(formatAdminMoney(1000),"R$ 1.000");
});
test("janela administrativa continua a alternar hidden",()=>{
 const admin={hidden:true};
 renderAdminWindowVisibility(admin,true);
 assert.equal(admin.hidden,false);
 renderAdminWindowVisibility(admin,false);
 assert.equal(admin.hidden,true);
});
test("loja conserva hidden e aria-expanded com mesmo seletor",()=>{
 const shop={hidden:true},calls=[],button={setAttribute:(k,v)=>calls.push([k,v])};
 const doc={querySelector:sel=>{assert.equal(sel,"#open-shop");return button;}};
 renderShopWindowVisibility(shop,true,doc);
 assert.equal(shop.hidden,false);
 renderShopWindowVisibility(shop,false,doc);
 assert.equal(shop.hidden,true);
 assert.deepEqual(calls,[["aria-expanded","true"],["aria-expanded","false"]]);
});
test("loja sem DOM ou botão mantém o fluxo seguro",()=>{
 assert.doesNotThrow(()=>renderShopWindowVisibility(null,true,{querySelector:()=>null}));
 const shop={hidden:true};
 renderShopWindowVisibility(shop,true,{querySelector:()=>null});
 assert.equal(shop.hidden,false);
});
test("disclosure administrativo conserva o atributo aria-expanded",()=>{
 const calls=[],controls={setAttribute:(k,v)=>calls.push([k,v])};
 renderAdminDisclosure(controls,true);
 renderAdminDisclosure(controls,false);
 assert.deepEqual(calls,[["aria-expanded","true"],["aria-expanded","false"]]);
});
test("main delega apenas o DOM; UI não altera motor, listeners ou save",()=>{
 const root=new URL("../src/",import.meta.url);
 const ui=readFileSync(new URL("ui/adminShell.ts",root),"utf8");
 const offerTest=readFileSync(new URL("../tests/shop-catalog-offers-boundary.test.mjs",root),"utf8");
 assert.doesNotMatch(ui,/from\s*["']\.\.\/sim\//);
 assert.doesNotMatch(ui,/\bGameState\b|stepGame|addEventListener|save\(|localStorage|requestAnimationFrame/);
 assert.match(sourceModule("ui/gamePanels.ts"),/const setText=createVisibleAdminTextWriter\(document\)/);
 assert.match(sourceModule("ui/gamePanels.ts"),/formatAdminMoney/);
 assert.match(sourceModule("ui/gamePanels.ts"),/renderAdminWindowVisibility\(admin,state\.windows\.adminOpen\)/);
 assert.match(sourceModule("ui/gamePanels.ts"),/renderShopWindowVisibility\(shop,state\.windows\.shopOpen,document\)/);
 assert.match(sourceModule("ui/gamePanels.ts"),/renderAdminDisclosure\(controls,state\.windows\.adminOpen\)/);
 assertCompositionAdaptersExclude(/const setText=\(id:string,value:string\)/);
 assert.match(offerTest,/x\.game\.expansionLevel=1;x\.game\.installedPcs=3/);
});
