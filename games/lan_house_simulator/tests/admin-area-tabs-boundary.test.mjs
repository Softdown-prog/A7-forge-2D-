import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createAdminAreaTabs} from "../dist/js/ui/adminAreaTabs.js";

function harness({tabs=["prices","finance","computers"],sections=tabs}={}){
 const calls=[], buttons=tabs.map(name=>{
  const listeners=new Map(),attributes=new Map(),classes=new Set(["legacy"]);
  return {
   dataset:{adminTab:name},tabIndex:-9,attributes,classes,listeners,
   classList:{toggle:(key,active)=>{calls.push(["class",name,key,active]);if(active)classes.add(key);else classes.delete(key);}},
   setAttribute:(key,value)=>{calls.push(["aria",name,key,value]);attributes.set(key,value);},
   addEventListener:(type,handler)=>{calls.push(["listen",name,type]);listeners.set(type,handler);},
   click(){listeners.get("click")?.();}
  };
 });
 const panes=sections.map(name=>({dataset:{section:name},hidden:false}));
 const admin={
  scrollTop:125,
  querySelectorAll:selector=>{
   calls.push(["query",selector]);
   if(selector==="[data-admin-tab]")return buttons;
   if(selector==="[data-section]")return panes;
   throw Error("unexpected selector "+selector);
  }
 };
 const selected=[],actions=[];
 const tabsApi=createAdminAreaTabs(admin,
  area=>{selected.push(area);actions.push("select:"+area);},
  ()=>{actions.push("render");});
 return {calls,buttons,panes,admin,selected,actions,tabsApi};
}
test("consulta apenas os dois conjuntos de elementos existentes",()=>{
 const x=harness();
 assert.deepEqual(x.calls.filter(c=>c[0]==="query"),[["query","[data-admin-tab]"],["query","[data-section]"]]);
});
test("instala listener click uma única vez em cada aba",()=>{
 const x=harness();
 assert.deepEqual(x.calls.filter(c=>c[0]==="listen").map(c=>c[1]),["prices","finance","computers"]);
 assert.equal(x.buttons.every(b=>b.listeners.size===1),true);
});
test("não altera área ativa, scroll nem renderiza durante criação",()=>{
 const x=harness();
 assert.deepEqual(x.actions,[]);
 assert.equal(x.admin.scrollTop,125);
 assert.equal(x.panes.every(p=>p.hidden===false),true);
});
test("ativação programática chama seleção antes de atualizar a interface",()=>{
 const x=harness();x.calls.length=0;
 x.tabsApi.activate("prices");
 assert.deepEqual(x.selected,["prices"]);
 assert.equal(x.calls[0][0],"class");
 assert.deepEqual(x.actions,["select:prices"]);
});
test("aba selecionada usa classe active e atributo aria-selected",()=>{
 const x=harness();x.tabsApi.activate("finance");
 assert.equal(x.buttons[1].classes.has("active"),true);
 assert.equal(x.buttons[1].attributes.get("aria-selected"),"true");
});
test("abas não selecionadas perdem active e ficam aria-selected=false",()=>{
 const x=harness();x.tabsApi.activate("finance");
 for(const i of [0,2]){
  assert.equal(x.buttons[i].classes.has("active"),false);
  assert.equal(x.buttons[i].attributes.get("aria-selected"),"false");
 }
});
test("foco por teclado permanece apenas na aba selecionada",()=>{
 const x=harness();x.tabsApi.activate("computers");
 assert.deepEqual(x.buttons.map(b=>b.tabIndex),[-1,-1,0]);
});
test("seções de outras áreas ficam ocultas, sem remover elementos",()=>{
 const x=harness();const original=x.panes.slice();x.tabsApi.activate("finance");
 assert.deepEqual(x.panes.map(p=>p.hidden),[true,false,true]);
 assert.deepEqual(x.panes,original);
});
test("ativar pela API não reposiciona scroll nem dispara render",()=>{
 const x=harness();x.tabsApi.activate("finance");
 assert.equal(x.admin.scrollTop,125);
 assert.deepEqual(x.actions,["select:finance"]);
});
test("clique escolhe a aba, rola para o topo e solicita render",()=>{
 const x=harness();x.buttons[2].click();
 assert.deepEqual(x.actions,["select:computers","render"]);
 assert.equal(x.admin.scrollTop,0);
 assert.deepEqual(x.panes.map(p=>p.hidden),[true,true,false]);
});
test("clique respeita data-admin-tab atualizado após montagem",()=>{
 const x=harness();x.buttons[1].dataset.adminTab="stock";x.buttons[1].click();
 assert.deepEqual(x.selected,["stock"]);
 assert.deepEqual(x.panes.map(p=>p.hidden),[true,true,true]);
});
test("aba sem data-admin-tab usa prices como valor padrão",()=>{
 const x=harness();delete x.buttons[0].dataset.adminTab;x.buttons[0].click();
 assert.deepEqual(x.selected,["prices"]);
 assert.equal(x.panes[0].hidden,false);
});
test("trocar várias vezes não duplica listeners nem referências",()=>{
 const x=harness();x.tabsApi.activate("finance");x.tabsApi.activate("prices");x.buttons[2].click();
 assert.deepEqual(x.selected,["finance","prices","computers"]);
 assert.equal(x.buttons.every(b=>b.listeners.size===1),true);
});
test("área desconhecida conserva comportamento anterior e oculta todas",()=>{
 const x=harness();x.tabsApi.activate("nonexistent");
 assert.deepEqual(x.panes.map(p=>p.hidden),[true,true,true]);
 assert.equal(x.buttons.every(b=>b.tabIndex===-1),true);
});
test("nenhuma aba nem seção não causa exceções",()=>{
 const x=harness({tabs:[],sections:[]});
 assert.doesNotThrow(()=>x.tabsApi.activate("finance"));
 assert.deepEqual(x.selected,["finance"]);
});
test("sem seções, os botões ainda funcionam",()=>{
 const x=harness({sections:[]});x.buttons[0].click();
 assert.deepEqual(x.actions,["select:prices","render"]);
});
test("área selecionada pode ser reutilizada em renderizações frequentes",()=>{
 const x=harness();x.tabsApi.activate("prices");x.tabsApi.activate("prices");
 assert.deepEqual(x.selected,["prices","prices"]);
 assert.equal(x.panes[0].hidden,false);
});
test("sem acesso ao motor, save ou APIs de tempo",()=>{
 const source=readFileSync(new URL("../src/ui/adminAreaTabs.ts",import.meta.url),"utf8");
 assert.doesNotMatch(source,/from\s*["']\.\.\/(?:sim|application|audio|render)\//);
 assert.doesNotMatch(source,/\b(GameState|localStorage|document|window|stepGame|setInterval|requestAnimationFrame)\b/);
});
test("main injeta seleção, sincroniza área e mantém chamada inicial",()=>{
 const main=readFileSync(new URL("../src/main.ts",import.meta.url),"utf8");
 assert.match(main,/createAdminAreaTabs\(admin,tab=>\{/);
 assert.match(main,/activeAdminTab=tab;managementPanels\.syncArea\(tab\)/);
 assert.match(main,/function activateAdminTab\(tab:string\):void\{adminTabs\.activate\(tab\);\}/);
 assert.match(main,/activateAdminTab\(activeAdminTab\)/);
});
