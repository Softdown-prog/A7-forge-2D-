import {sourceModule,assertCompositionAdaptersExclude} from "./helpers/composition.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {productPrice} from "../dist/js/sim/economy.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {createRetailPriceStatusPort} from "../dist/js/application/retailPriceStatusPort.js";
import {renderRetailPriceControls} from "../dist/js/ui/retailPriceControlsPanel.js";
const money=n=>"R$ "+n.toLocaleString("pt-BR");

test("projeção apresenta trio original e preços do motor sem mutar save",()=>{
 for(const mode of ["classic","historical"]){
  const state=createGame(8021,mode);
  const before=JSON.stringify(state),rows=createRetailPriceStatusPort(()=>state).snapshot();
  assert.deepEqual(rows.map(r=>r.id),["soda","candy","snacks"]);
  assert.deepEqual(rows.map(r=>r.label),["Refrigerante","Doce","Salgadinho"]);
  for(const row of rows){
   const price=productPrice(state,row.id);
   assert.equal(row.priceText,money(price));
   assert.equal(row.decreaseDisabled,price<=1);
   assert.equal(row.increaseDisabled,price>=40);
  }
  assert.equal(JSON.stringify(state),before);
 }
});

test("mínimo e máximo mantêm os limites existentes, sem editar preços",()=>{
 const state=createGame(8022,"classic"),port=createRetailPriceStatusPort(()=>state);
 state.retailPrices={soda:1,candy:40,snacks:9};
 const before=JSON.stringify(state),rows=port.snapshot();
 assert.equal(rows[0].decreaseDisabled,true);
 assert.equal(rows[0].increaseDisabled,false);
 assert.equal(rows[1].increaseDisabled,true);
 assert.equal(rows[1].decreaseDisabled,false);
 assert.equal(rows[2].decreaseDisabled,false);
 assert.equal(JSON.stringify(state),before);
});

test("a porta acompanha importação de save e não altera a instância anterior",()=>{
 let state=createGame(8023,"classic");
 const port=createRetailPriceStatusPort(()=>state),previous=state,before=JSON.stringify(state);
 state=parseImportedSave(serializeSave(state));
 state.retailPrices={soda:12,candy:4,snacks:8};
 assert.deepEqual(port.snapshot().map(row=>row.priceText),[money(12),money(4),money(8)]);
 assert.equal(JSON.stringify(previous),before);
 assert.equal(isValidSave(state),true);
});

class Node {
 constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.attributes={};this.className="";this.textContent="";this.disabled=false;this.id="";this.type="";}
 append(...nodes){this.children.push(...nodes);}
 setAttribute(name,value){this.attributes[name]=value;}
 insertAdjacentHTML(where,html){this.inserted=[where,html];}
}

test("painel preserva ordem, markup, atributos dos botões e link de catálogo",()=>{
 const state=createGame(8024,"classic"),rows=createRetailPriceStatusPort(()=>state).snapshot();
 const host=new Node("div"),doc={createElement:tag=>new Node(tag)};
 let calls=0,next;
 renderRetailPriceControls(host,rows,id=>"<i>"+id+"</i>",doc,(current,node)=>{
  calls++;assert.equal(current,host);next=node;
 });
 assert.equal(calls,1);
 assert.equal(next.children.length,4);
 for(let i=0;i<3;i++){
  const row=next.children[i],name=row.children[0],actions=row.children[1],item=rows[i];
  assert.equal(row.className,"price-control");
  assert.equal(name.textContent,item.label);
  assert.deepEqual(name.inserted,["afterbegin","<i>"+item.id+"</i>"]);
  assert.equal(actions.className,"price-actions");
  assert.equal(actions.children.length,3);
  const [down,amount,up]=actions.children;
  assert.equal(down.tag,"button");
  assert.deepEqual(down.dataset,{item:item.id,delta:"-1"});
  assert.equal(down.textContent,"−");
  assert.equal(down.disabled,item.decreaseDisabled);
  assert.equal(down.attributes["aria-label"],"Reduzir "+item.label);
  assert.equal(amount.tag,"strong");
  assert.equal(amount.textContent,item.priceText);
  assert.deepEqual(up.dataset,{item:item.id,delta:"1"});
  assert.equal(up.textContent,"+");
  assert.equal(up.disabled,item.increaseDisabled);
  assert.equal(up.attributes["aria-label"],"Aumentar "+item.label);
 }
 const link=next.children[3];
 assert.equal(link.id,"retail-full-catalog");
 assert.equal(link.textContent,"Ver todas as mercadorias e margens no Estoque");
 assert.equal(link.type,"button");
});

test("atualização usa reconciliador existente, sem listeners duplicados",()=>{
 const state=createGame(8025,"classic"),port=createRetailPriceStatusPort(()=>state);
 const host={listeners:["delegated-click"]},doc={createElement:tag=>new Node(tag)};
 let first,second;
 renderRetailPriceControls(host,port.snapshot(),()=>"",doc,(current,next)=>{
  assert.equal(current,host);first=next;
 });
 state.retailPrices={soda:10,candy:11,snacks:12};
 renderRetailPriceControls(host,port.snapshot(),()=>"",doc,(current,next)=>{
  assert.equal(current,host);second=next;
 });
 assert.equal(host.listeners[0],"delegated-click");
 assert.equal(first.children[0].children[1].children[1].textContent,money(8));
 assert.equal(second.children[0].children[1].children[1].textContent,money(10));
});

test("application sem DOM, UI sem motor e main mantém guarda de revisão",()=>{
 const root=new URL("../src/",import.meta.url);
 const app=readFileSync(new URL("application/retailPriceStatusPort.ts",root),"utf8");
 const ui=readFileSync(new URL("ui/retailPriceControlsPanel.ts",root),"utf8");
 const section=readFileSync(new URL("ui/adminPricingSections.ts",root),"utf8");
 assert.doesNotMatch(app,/\b(document|window|HTMLElement|HTMLButtonElement)\b/);
 assert.doesNotMatch(ui,/from\s*["']\.\.\/sim\//);
 assert.doesNotMatch(ui,/\bGameState\b|addEventListener/);
 assert.ok(sourceModule("application/gamePorts.ts").includes("createRetailPriceStatusPort(getState)"));
 assert.ok(section.includes("renderRetailPriceControls(options.retailControls,options.retail.snapshot(),"));
 assert.match(sourceModule("ui/gamePanels.ts"),/renderAdminPricingSections\(\{/);
 assert.ok(sourceModule("ui/gamePanels.ts").includes("panelChanged(\"retail\",adminPanelRevisionsPort.retail(),!liveOnly)"));
 assertCompositionAdaptersExclude(/\bproductPrice\(/);
});
