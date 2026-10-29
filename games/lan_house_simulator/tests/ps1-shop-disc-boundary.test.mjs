import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {PS1_CD_CATALOG,PS1_MAX_STATIONS,ps1DiscPrice,ps1PlacementSlots,buyPs1Station,buyPs1Disc} from "../dist/js/sim/ps1.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {createPs1ShopDiscPort} from "../dist/js/application/ps1ShopDiscPort.js";
import {renderPs1ShopDiscCatalog} from "../dist/js/ui/ps1ShopDiscCatalog.js";

function inYear(year=2002,mode="historical"){
 const s=createGame(97001,mode);s.totalMinutes=(year-1998)*360*DAY_MINUTES;s.cash=10000;return s;
}
function station(s){
 assert.equal(buyPs1Station(s,ps1PlacementSlots(s)[0].id).ok,true);
 return s;
}
class Node {
 constructor(tag){this.tag=tag;this.className="";this.children=[];this.dataset={};this.attrs={};this.parent=null;this.textContent="";this.disabled=false;}
 setAttribute(name,value){this.attrs[name]=value;}
 append(...nodes){
  for(const node of nodes){
   if(node.parent)node.parent.children.splice(node.parent.children.indexOf(node),1);
   node.parent=this;this.children.push(node);
  }
 }
 after(node){
  const siblings=this.parent?.children;if(!siblings)return;
  if(node.parent)node.parent.children.splice(node.parent.children.indexOf(node),1);
  const at=siblings.indexOf(this);siblings.splice(at+1,0,node);node.parent=this.parent;
 }
}
function harness(consolePresent=true){
 const host=new Node("section"),doc={createElement:tag=>new Node(tag)};
 let consoleCard=null;
 if(consolePresent){consoleCard=new Node("article");consoleCard.className="shop-card";host.append(consoleCard);}
 host.querySelector=selector=>selector==='button[data-buy="ps1"]'&&consoleCard?{closest:()=>consoleCard}:null;
 host.querySelectorAll=selector=>host.children.filter(node=>
  node.className.split(" ").some(name=>name.startsWith("ps1-")&&selector.includes("."+name)));
 return {host,doc,consoleCard};
}
test("antes de 2002 não libera catálogo",()=>{
 assert.equal(createPs1ShopDiscPort(()=>inYear(2001)).snapshot(),null);
});
test("partida clássica não libera CDs mesmo em 2004",()=>{
 assert.equal(createPs1ShopDiscPort(()=>inYear(2004,"classic")).snapshot(),null);
});
test("catálogo conserva títulos, ordem, preços e não altera save",()=>{
 const s=inYear(),before=JSON.stringify(s),rows=createPs1ShopDiscPort(()=>s).snapshot();
 assert.deepEqual(rows.map(row=>row.id),PS1_CD_CATALOG.map(row=>row.id));
 for(const row of rows){
  const original=PS1_CD_CATALOG.find(d=>d.id===row.id);
  assert.equal(row.title,original.title);assert.equal(row.genre,original.genre);
  assert.equal(row.price,ps1DiscPrice(s,row.id));assert.equal(row.copies,0);
  assert.equal(row.noStation,true);assert.equal(row.disabled,true);
 }
 assert.equal(JSON.stringify(s),before);
});
test("sem bancada não compra CD; com bancada e dinheiro libera todos",()=>{
 const s=inYear(),port=createPs1ShopDiscPort(()=>s);
 assert.ok(port.snapshot().every(d=>d.noStation&&d.disabled&&!d.full));
 station(s);
 assert.ok(port.snapshot().every(d=>!d.noStation&&!d.disabled&&!d.full));
});
test("caixa insuficiente impede compra sem alterar preço",()=>{
 const s=station(inYear());s.cash=0;
 assert.ok(createPs1ShopDiscPort(()=>s).snapshot().every(d=>d.disabled&&!d.noStation&&d.price>0));
});
test("limite de cópias por CD é o original",()=>{
 const s=station(inYear()),port=createPs1ShopDiscPort(()=>s);
 for(let i=0;i<PS1_MAX_STATIONS;i++)assert.equal(buyPs1Disc(s,"turbo-circuito").ok,true);
 const row=port.snapshot().find(d=>d.id==="turbo-circuito");
 assert.equal(row.copies,PS1_MAX_STATIONS);assert.equal(row.full,true);assert.equal(row.disabled,true);
 assert.equal(buyPs1Disc(s,"turbo-circuito").ok,false);
});
test("importação reorienta a porta para a partida nova",()=>{
 let s=station(inYear()),port=createPs1ShopDiscPort(()=>s);
 assert.equal(buyPs1Disc(s,"gol-de-rua").ok,true);
 const old=s,before=JSON.stringify(s);
 s=parseImportedSave(serializeSave(s));
 assert.equal(isValidSave(s),true);
 assert.equal(buyPs1Disc(s,"gol-de-rua").ok,true);
 assert.equal(port.snapshot().find(d=>d.id==="gol-de-rua").copies,2);
 assert.equal(JSON.stringify(old),before);
});
test("outra aba nunca consulta o port nem monta cards",()=>{
 const x=harness();renderPs1ShopDiscCatalog(x.host,{snapshot:()=>{throw Error("snapshot desnecessário");}},false,x.doc);
 assert.equal(x.host.children.length,1);
 renderPs1ShopDiscCatalog(x.host,{snapshot:()=>null},true,x.doc);
 assert.equal(x.host.children.length,1);
});
test("cinco cartões ficam junto ao console e conservam capa, dataset e formatação",()=>{
 const s=station(inYear()),x=harness(),port=createPs1ShopDiscPort(()=>s);
 renderPs1ShopDiscCatalog(x.host,port,true,x.doc);
 assert.equal(x.host.children[0],x.consoleCard);
 assert.equal(x.host.children[1].className,"ps1-shop-heading");
 assert.equal(x.host.children[2].className,"catalog-game-note ps1-shop-note");
 const cards=x.host.children.slice(3);assert.equal(cards.length,PS1_CD_CATALOG.length);
 for(let i=0;i<cards.length;i++){
  const [art,category,title,description,button]=cards[i].children,disc=PS1_CD_CATALOG[i];
  assert.equal(art.attrs["aria-hidden"],"true");
  assert.equal(art.children[0].children[0].src,"assets/ps1/covers/"+disc.id+".svg");
  assert.equal(art.children[0].children[0].loading,"lazy");
  assert.equal(art.children[0].children[0].width,420);
  assert.equal(category.textContent,"CD de PS1 · "+disc.genre);
  assert.equal(title.textContent,disc.title);
  assert.equal(description.textContent,"Cópias no acervo: 0 · compra definitiva, sem renovação.");
  assert.equal(button.dataset.buyPs1Disc,disc.id);
  assert.equal(button.disabled,false);
  assert.equal(button.textContent,"Comprar CD · "+ps1DiscPrice(s,disc.id).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}));
 }
});
test("sem cartão de console, catálogo ainda é renderizado",()=>{
 const s=inYear(),x=harness(false);
 renderPs1ShopDiscCatalog(x.host,createPs1ShopDiscPort(()=>s),true,x.doc);
 assert.equal(x.host.children.length,PS1_CD_CATALOG.length+2);
 assert.equal(x.host.children[0].className,"ps1-shop-heading");
 assert.equal(x.host.children[2].children[4].textContent,"Instale uma bancada primeiro");
});
test("motivos de bloqueio respeitam ordem bancada, acervo cheio e dinheiro",()=>{
 const s=inYear(),port=createPs1ShopDiscPort(()=>s);
 let x=harness(false);renderPs1ShopDiscCatalog(x.host,port,true,x.doc);
 assert.equal(x.host.children[2].children[4].textContent,"Instale uma bancada primeiro");
 station(s);s.cash=0;
 x=harness(false);renderPs1ShopDiscCatalog(x.host,port,true,x.doc);
 assert.match(x.host.children[2].children[4].textContent,/Caixa insuficiente/);
 s.cash=10000;
 for(let i=0;i<PS1_MAX_STATIONS;i++)assert.equal(buyPs1Disc(s,"turbo-circuito").ok,true);
 x=harness(false);renderPs1ShopDiscCatalog(x.host,port,true,x.doc);
 assert.equal(x.host.children[2].children[4].textContent,"Acervo completo");
});
test("UI não conhece sim; a compra ainda é delegada e o main usa a porta",()=>{
 const root=new URL("../src/",import.meta.url);
 const app=readFileSync(new URL("application/ps1ShopDiscPort.ts",root),"utf8");
 const ui=readFileSync(new URL("ui/ps1ShopDiscCatalog.ts",root),"utf8");
 const main=readFileSync(new URL("main.ts",root),"utf8");
 const catalog=readFileSync(new URL("ui/shopCatalogRenderer.ts",root),"utf8");
 assert.doesNotMatch(app,/\b(document|window|HTMLElement|HTMLButtonElement)\b/);
 assert.doesNotMatch(ui,/from\s*["']\.\.\/sim\//);
 assert.doesNotMatch(ui,/\bGameState\b|addEventListener/);
 assert.match(main,/createPs1ShopDiscPort\(\(\)=>game\)/);
 assert.match(main,/discs:ps1ShopDiscPort/);
 assert.match(catalog,/renderPs1ShopDiscCatalog\(options\.host,options\.discs,options\.currentCategory\(\)==="consoles",options\.doc\)/);
 assert.match(main,/installShopControls\(shopCatalog,createShopActionsPort\(\(\)=>game\)/);
 assert.doesNotMatch(main,/\bps1DiscPrice\(|\bps1DiscCopies\(/);
});
