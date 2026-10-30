import {sourceModule} from "./helpers/composition.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {renderAdminPricingSections} from "../dist/js/ui/adminPricingSections.js";

class Button {
 constructor(){this.hidden=false;this.disabled=false;this.dataset={};this.attributes={};this.children=[];this.textContent="";}
 setAttribute(key,value){this.attributes[key]=value;}
 append(...children){this.children.push(...children);}
}
globalThis.HTMLButtonElement=Button;
class Element {
 constructor(tag="div"){this.tag=tag;this.id="";this.className="";this.dataset={};this.children=[];this.textContent="";this.attributes={};this.html="";}
 replaceChildren(...children){this.children=[...children];}
 append(...children){this.children.push(...children);}
 insertAdjacentHTML(where,html){this.html+=html;}
 setAttribute(key,value){this.attributes[key]=value;}
}
const hourly=Object.freeze({
 priceLabel:"R$ 1,50/h",historical:true,yearCeiling:"Teto",equipmentCeiling:"Computador",
 inflation:"IPCA",decreaseDisabled:true,increaseDisabled:false,
 packages:["30 minutos — R$ 1,00","1 h — R$ 1,50"]
});
function setup(page=null,{hasPackages=true,hasRetail=true,changed=true}={}){
 const calls={hourly:0,energy:0,retail:0,packageChecks:0,retailChecks:0,active:[],texts:[],sync:[]};
 const packages=new Element("ul"),retailControls=hasRetail?new Element():null;
 const fields=new Map();
 for(const id of ["price-down","price-up","migrate-historical-pricing"])fields.set(id,new Button());
 if(hasPackages)fields.set("session-package-prices",packages);
 const doc={
  getElementById:id=>fields.get(id)??null,
  createElement:tag=>tag==="button"?new Button():new Element(tag)
 };
 const opts={
  hourly,
  insights:{
   hourly:()=>{calls.hourly++;return {demand:"Demanda",satisfaction:"Avaliação",
    caution:"Atenção",lower:"Reduzir",current:"Manter",higher:"Aumentar"};},
   energy:()=>{calls.energy++;return {label:"Energia anual"};}
  },
  retail:{snapshot:()=>{calls.retail++;return [{id:"soda",label:"Refrigerante",
   priceText:"R$ 4",decreaseDisabled:false,increaseDisabled:true}];}},
  pricingTab:page!==null,
  active:kind=>{calls.active.push(kind);return kind===page;},
  packagesChanged:()=>{calls.packageChecks++;return changed;},
  retailChanged:()=>{calls.retailChecks++;return changed;},
  retailControls,
  setText:(id,value)=>calls.texts.push([id,value]),
  iconMarkup:id=>"<icon:"+id+">",
  doc,
  sync:(current,next)=>{calls.sync.push([current,next]);}
 };
 return {calls,opts,packages,retailControls,fields};
}
const render=x=>renderAdminPricingSections(x.opts);

test("com Administração em outra aba, mantém tarifa e energia sem reconstruir listas",()=>{
 const x=setup();
 render(x);
 assert.equal(x.calls.hourly,0);
 assert.equal(x.calls.energy,1);
 assert.equal(x.calls.retail,0);
 assert.equal(x.calls.packageChecks,0);
 assert.equal(x.calls.retailChecks,0);
 assert.equal(x.packages.children.length,0);
 assert.deepEqual(x.calls.sync,[]);
 assert.ok(x.calls.texts.some(([id])=>id==="energy-year-outlook"));
});
test("painel por hora monta exatamente os pacotes projetados",()=>{
 const x=setup("hourly");render(x);
 assert.deepEqual(x.packages.children.map(li=>li.textContent),hourly.packages);
 assert.equal(x.calls.packageChecks,1);
 assert.equal(x.calls.hourly,0);
 assert.equal(x.calls.energy,1);
});
test("revisão sem alteração impede recriar o pacote",()=>{
 const x=setup("hourly",{changed:false});
 x.packages.append(new Element("li"));
 render(x);
 assert.equal(x.packages.children.length,1);
 assert.equal(x.calls.packageChecks,1);
});
test("sem elemento de pacotes, não consulta a revisão",()=>{
 const x=setup("hourly",{hasPackages:false});
 render(x);
 assert.equal(x.calls.packageChecks,0);
 assert.equal(x.calls.energy,1);
});
test("aba de insights consulta projeção sob demanda e atualiza os seis campos",()=>{
 const x=setup("insights");render(x);
 assert.equal(x.calls.hourly,1);
 assert.equal(x.calls.energy,1);
 for(const id of ["price-demand-insight","price-satisfaction-insight","price-caution",
 "price-scenario-lower","price-scenario-current","price-scenario-higher"])
  assert.ok(x.calls.texts.some(([name])=>name===id),id);
 assert.equal(x.calls.packageChecks,0);
 assert.equal(x.calls.retailChecks,0);
});
test("preço de varejo só consulta o port quando aba e revisão estão ativas",()=>{
 const x=setup("retail");render(x);
 assert.equal(x.calls.retail,1);
 assert.equal(x.calls.retailChecks,1);
 assert.equal(x.calls.sync.length,1);
 assert.equal(x.calls.sync[0][0],x.retailControls);
 assert.equal(x.calls.hourly,0);
});
test("preço de varejo sem revisão não cria controles nem consulta motor",()=>{
 const x=setup("retail",{changed:false});
 render(x);
 assert.equal(x.calls.retailChecks,1);
 assert.equal(x.calls.retail,0);
 assert.equal(x.calls.sync.length,0);
});
test("controles de varejo ausentes dispensam consulta de revisão",()=>{
 const x=setup("retail",{hasRetail:false});
 render(x);
 assert.equal(x.calls.retailChecks,0);
 assert.equal(x.calls.retail,0);
});
test("botões de varejo conservam ids, valores e indicadores acessíveis",()=>{
 const x=setup("retail");render(x);
 const next=x.calls.sync[0][1];
 const line=next.children[0],actions=line.children[1];
 assert.equal(line.className,"price-control");
 assert.equal(actions.children[0].dataset.item,"soda");
 assert.equal(actions.children[0].dataset.delta,"-1");
 assert.equal(actions.children[1].textContent,"R$ 4");
 assert.equal(actions.children[2].dataset.delta,"1");
 assert.equal(actions.children[2].disabled,true);
 assert.equal(actions.children[2].attributes["aria-label"],"Aumentar Refrigerante");
 assert.equal(next.children[1].id,"retail-full-catalog");
});
test("botões de valor por hora conservam estados e modo histórico",()=>{
 const x=setup("hourly");render(x);
 assert.equal(x.fields.get("price-down").disabled,true);
 assert.equal(x.fields.get("price-up").disabled,false);
 assert.equal(x.fields.get("migrate-historical-pricing").hidden,true);
 assert.ok(x.calls.texts.some(([id,text])=>id==="price"&&text==="R$ 1,50/h"));
});
test("modo clássico mostra botão de migração sem modificar o motor",()=>{
 const x=setup("insights");
 x.opts.hourly={...hourly,historical:false};
 render(x);
 assert.equal(x.fields.get("migrate-historical-pricing").hidden,false);
});
test("render repetido não multiplica listeners nem utiliza GameState",()=>{
 const x=setup("insights");render(x);render(x);
 assert.equal(x.calls.hourly,2);
 assert.equal(x.calls.energy,2);
 assert.deepEqual(x.calls.sync,[]);
 const root=new URL("../src/",import.meta.url);
 const ui=readFileSync(new URL("ui/adminPricingSections.ts",root),"utf8");
 assert.doesNotMatch(ui,/from\s*["']\.\.\/sim\//);
 assert.doesNotMatch(ui,/\bGameState\b|stepGame|save\(|addEventListener|localStorage/);
 assert.match(sourceModule("ui/gamePanels.ts"),/renderAdminPricingSections\(\{/);
 assert.match(sourceModule("ui/gamePanels.ts"),/packagesChanged:\(\)=>panelChanged\("durations",adminPanelRevisionsPort\.packages\(\),!liveOnly\)/);
 assert.match(sourceModule("ui/gamePanels.ts"),/retailChanged:\(\)=>panelChanged\("retail",adminPanelRevisionsPort\.retail\(\),!liveOnly\)/);
 assert.match(sourceModule("ui/gamePanels.ts"),/renderDeskServicePanels\(deskPricingPort,\{/);
});
