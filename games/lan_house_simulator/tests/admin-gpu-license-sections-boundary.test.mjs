import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {renderAdminGpuLicenseSections} from "../dist/js/ui/adminGpuLicenseSections.js";

class Node {
 constructor(tag="div"){
  this.tag=tag;this.dataset={};this.children=[];this.attrs={};this.textContent="";
  this.className="";this.hidden=false;this.disabled=false;
 }
 append(...nodes){this.children.push(...nodes);}
 appendChild(node){this.children.push(node);}
 setAttribute(k,v){this.attrs[k]=v;}
 querySelector(){return null;}
 querySelectorAll(){return [];}
}
function setup(){
 const calls=[],texts=[],hosts={gpuChoice:new Node(),gpuList:new Node(),windows:new Node(),
  classic:new Node(),gpuGames:new Node()};
 let admin=true,gpuTab=false,licensesTab=false,page="windows",gpuChange=true,
  windowsChange=true,classicChange=true,gpuGamesChange=true,selected=1;
 const buttons=new Map();
 const doc={createElement:tag=>new Node(tag),querySelector:selector=>{
  if(selector==="#license"){if(!buttons.has(selector))buttons.set(selector,new Node("button"));return buttons.get(selector);}
  return null;
 }};
 const options={
  get adminOpen(){return admin;},get gpuTab(){return gpuTab;},get licensesTab(){return licensesTab;},
  gpuPcChoice:hosts.gpuChoice,gpuList:hosts.gpuList,
  licensePanel:hosts.windows,eraGamePanel:hosts.classic,gpuGamePanel:hosts.gpuGames,
  gpuChanged:()=>{calls.push("gpuChanged");return gpuChange;},
  selectedGpuIndex:()=>{calls.push("selectedGpuIndex");selected=Math.min(selected,2);return selected;},
  licensePageActive:id=>{calls.push("page:"+id);return id===page;},
  windowsChanged:()=>{calls.push("windowsChanged");return windowsChange;},
  classicChanged:()=>{calls.push("classicChanged");return classicChange;},
  gpuGamesChanged:()=>{calls.push("gpuGamesChanged");return gpuGamesChange;},
  gpuCatalog:{snapshot:index=>{calls.push("gpuSnapshot:"+index);return {stations:[
   {index:0,label:"PC 1",selected:index===0},
   {index:1,label:"PC 2",selected:index===1}],replacementNote:"Troca",models:[]};}},
  basicGames:{snapshot:()=>{calls.push("basicSnapshot");return {
   statusLabel:"Regularização",buttonHidden:false,buttonDisabled:true,buttonLabel:"Regularizar"
  };}},
  windows:{rows:()=>{calls.push("windowsRows");return [];}},
  classic:{snapshot:()=>{calls.push("classicSnapshot");return {summary:"Clássicos",sections:[]};}},
  gpuGames:{snapshot:()=>{calls.push("gpuGamesSnapshot");return {downloads:[],note:"Sem jogos",cards:[]};}},
  downloads:{bandwidth:()=>{calls.push("bandwidth");return "Banda livre";},progress:()=>null},
  setText:(id,value)=>texts.push([id,value]),doc,
  sync:(host,next)=>{calls.push("sync");assert.ok(Object.values(hosts).includes(host));assert.ok(next instanceof Node);}
 };
 const render=()=>{
  const previous=globalThis.document;
  globalThis.document=doc;
  try{renderAdminGpuLicenseSections(options);}finally{
   if(previous===undefined)delete globalThis.document;
   else globalThis.document=previous;
  }
 };
 return {calls,texts,hosts,buttons,options,render,
  admin:v=>admin=v,gpu:v=>gpuTab=v,licenses:v=>licensesTab=v,page:v=>page=v,
  gpuChange:v=>gpuChange=v,classicChange:v=>classicChange=v,gpuGamesChange:v=>gpuGamesChange=v,
  selected:v=>selected=v};
}
test("status de licença básica permanece presente fora da aba Licenças",()=>{
 const f=setup();f.render();
 assert.deepEqual(f.texts,[["license-status","Regularização"]]);
 assert.equal(f.buttons.get("#license").disabled,true);
 assert.equal(f.calls.includes("basicSnapshot"),true);
 assert.equal(f.calls.includes("gpuChanged"),false);
});
test("catálogo GPU é consultado apenas na aba GPU aberta",()=>{
 const f=setup();f.gpu(true);f.render();
 assert.ok(f.calls.includes("gpuSnapshot:1"));
 assert.equal(f.calls.filter(x=>x==="sync").length,2);
 assert.deepEqual(f.hosts.gpuChoice.children,[]);
});
test("seleção GPU clampa o índice somente após invalidar painel",()=>{
 const f=setup();f.selected(99);f.gpu(true);f.render();
 assert.ok(f.calls.includes("gpuSnapshot:2"));
 assert.ok(f.calls.indexOf("gpuChanged")<f.calls.indexOf("selectedGpuIndex"));
});
test("catálogo GPU não refaz a projeção quando revisão estável",()=>{
 const f=setup();f.gpu(true);f.gpuChange(false);f.render();
 assert.equal(f.calls.includes("gpuSnapshot:1"),false);
 assert.equal(f.calls.includes("selectedGpuIndex"),false);
});
test("GPU sem um dos hosts mantém a interface básica intacta",()=>{
 const f=setup();f.gpu(true);f.options.gpuList=null;f.render();
 assert.equal(f.calls.includes("gpuChanged"),false);
 assert.ok(f.calls.includes("basicSnapshot"));
});
test("Administração fechada não consulta catálogo GPU nem licenças avançadas",()=>{
 const f=setup();f.gpu(true);f.licenses(true);f.admin(false);f.render();
 assert.ok(f.calls.includes("basicSnapshot"));
 assert.equal(f.calls.includes("gpuChanged"),false);
 assert.equal(f.calls.includes("windowsChanged"),false);
});
test("Licenças clássicas em página própria respeitam revisão",()=>{
 const f=setup();f.licenses(true);f.page("classic");f.render();
 assert.ok(f.calls.includes("classicSnapshot"));
 assert.ok(f.calls.includes("sync"));
 assert.equal(f.calls.includes("gpuGamesSnapshot"),false);
});
test("página de jogos avançados monta catálogo uma vez e atualiza medidores",()=>{
 const f=setup();f.licenses(true);f.page("gpu");f.render();
 assert.ok(f.calls.includes("gpuGamesSnapshot"));
 assert.equal(f.calls.includes("sync"),true);
 assert.equal(f.calls.includes("classicSnapshot"),false);
});
test("jogos GPU sem revisão não recriam os cartões",()=>{
 const f=setup();f.licenses(true);f.page("gpu");f.gpuGamesChange(false);f.render();
 assert.equal(f.calls.includes("gpuGamesSnapshot"),false);
 assert.equal(f.calls.includes("sync"),false);
});
test("somente Licenças > GPU deixa consultar os medidores",()=>{
 const f=setup();f.licenses(true);f.page("windows");f.options.licensePanel=null;f.render();
 assert.equal(f.calls.includes("bandwidth"),false);
 f.page("gpu");f.hosts.gpuGames.querySelector=()=>new Node();
 f.render();
 assert.ok(f.calls.includes("bandwidth"));
});
test("categorias inativas mantêm as portas sem chamadas",()=>{
 const f=setup();f.licenses(true);f.page("classic");f.classicChange(false);f.render();
 assert.equal(f.calls.includes("classicSnapshot"),false);
 assert.equal(f.calls.includes("windowsRows"),false);
 assert.equal(f.calls.includes("gpuGamesSnapshot"),false);
});
test("interfaces usam ports; main preserva guardas e não executa compra",()=>{
 const root=new URL("../src/",import.meta.url);
 const ui=readFileSync(new URL("ui/adminGpuLicenseSections.ts",root),"utf8");
 const main=readFileSync(new URL("main.ts",root),"utf8");
 assert.doesNotMatch(ui,/from\s*["']\.\.\/sim\//);
 assert.doesNotMatch(ui,/\bGameState\b|stepGame|addEventListener|save\(|localStorage/);
 assert.match(main,/renderAdminGpuLicenseSections\(\{/);
 assert.match(main,/gpuChanged:\(\)=>panelChanged\("gpuPcChoice",/);
 assert.match(main,/windowsChanged:\(\)=>panelChanged\("licensePanel",/);
 assert.match(main,/classicChanged:\(\)=>panelChanged\("eraGamePanel",/);
 assert.match(main,/gpuGamesChanged:\(\)=>panelChanged\("gpuGamePanel",/);
 assert.match(main,/installGameLicensingControls\(/);
 assert.match(main,/installStationControls\(/);
});
