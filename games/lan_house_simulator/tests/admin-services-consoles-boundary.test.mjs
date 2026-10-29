import {sourceModule} from "./helpers/composition.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {renderAdminServicesConsoles} from "../dist/js/ui/adminServicesConsoles.js";

class Node {
 constructor(tag="div"){this.tag=tag;this.textContent="";this.disabled=false;this.hidden=false;
  this.dataset={};this.children=[];this.replacements=0;}
 append(...children){this.children.push(...children);}
 replaceChildren(...children){this.children=[...children];this.replacements++;}
}
class Progress extends Node {constructor(){super("progress");this.value=0;}}
function harness(){
 const calls=[],texts=[],nodes=new Map();
 const get=id=>{
  if(!nodes.has(id))nodes.set(id,id.endsWith("-progress")?new Progress():new Node(id));
  return nodes.get(id);
 };
 const doc={
  getElementById:get,
  querySelector:selector=>{
   if(!["#clean-bins","#hire-technician","#clean-bins-now","#show-service-access"].includes(selector))
    throw new Error("Unrecognized selector "+selector);
   return get(selector.slice(1));
  },
  createElement:tag=>new Node(tag)
 };
 let consolesTab=false,servicesTab=false,stations=false,access=false;
 let ps1View={
  consoleReady:false,stationCount:0,maxStations:3,sessions:0,revenue:0,
  hourlyPrice:2,ownedDiscs:0,readyStations:0,
  canDecreasePrice:false,canIncreasePrice:false,stations:[]
 };
 let staffView={
  cleanerControl:"Contratar faxineiro",technicianControl:"Contratar técnico",
  summary:"Equipe disponível",cleanerActivity:"Aguardando",technicianActivity:"Parado",
  cleanerProgress:null,technicianProgress:25,
  binSummary:"Lixeiras vazias",cleaningLabel:"Limpar agora",cleaningDisabled:false
 };
 let accessView={
  count:1,summary:"1 destino bloqueado",destinations:"Impressora sem rota",
  showDisabled:false,showLabel:"Ver bloqueios (1)",mapHint:"Impressora sem acesso"
 };
 const options={
  get consolesTab(){return consolesTab;},get servicesTab(){return servicesTab;},
  showPs1Stations:()=>{calls.push("showPs1Stations");return stations;},
  showServiceAccess:()=>{calls.push("showServiceAccess");return access;},
  accessSnapshot:()=>{calls.push("inspectServiceAccess");return accessView;},
  ps1:{snapshot:()=>{calls.push("ps1Snapshot");return ps1View;}},
  staff:{snapshot:()=>{calls.push("staffSnapshot");return staffView;}},
  setText:(id,value)=>{texts.push([id,value]);get(id).textContent=value;},
  money:value=>"R$ "+value,doc
 };
 const render=()=>{
  const previousDoc=globalThis.document,previousProgress=globalThis.HTMLProgressElement;
  globalThis.document=doc;globalThis.HTMLProgressElement=Progress;
  try{renderAdminServicesConsoles(options);}
  finally{
   if(previousDoc===undefined)delete globalThis.document;
   else globalThis.document=previousDoc;
   if(previousProgress===undefined)delete globalThis.HTMLProgressElement;
   else globalThis.HTMLProgressElement=previousProgress;
  }
 };
 return {calls,texts,get,options,render,
  consoleTab:value=>consolesTab=value,
  serviceTab:value=>servicesTab=value,
  stations:value=>stations=value,
  access:value=>access=value,
  ps1View:value=>ps1View=value,staffView:value=>staffView=value,
  accessView:value=>accessView=value};
}
test("abas diferentes não consultam PlayStation, equipe ou rotas",()=>{
 const f=harness();f.render();
 assert.deepEqual(f.calls,[]);
 assert.deepEqual(f.texts,[]);
});
test("aba Consoles atualiza resumo PS1 sem acessar a equipe",()=>{
 const f=harness();f.consoleTab(true);f.render();
 assert.deepEqual(f.calls,["showPs1Stations","ps1Snapshot"]);
 assert.ok(f.texts.some(([id])=>id==="ps1-overview"));
 assert.ok(f.texts.some(([id])=>id==="ps1-hourly"));
 assert.equal(f.get("ps1-price-up").disabled,true);
 assert.equal(f.get("ps1-price-down").disabled,true);
});
test("bancadas PS1 não são reconstruídas quando a subpágina está fechada",()=>{
 const f=harness();f.consoleTab(true);
 const stations=f.get("ps1-stations");stations.append(new Node("old"));
 f.render();
 assert.equal(stations.replacements,0);
 assert.equal(stations.children.length,1);
});
test("subpágina de bancadas PS1 ativa mostra a mensagem de desbloqueio",()=>{
 const f=harness();f.consoleTab(true);f.stations(true);
 f.render();
 assert.equal(f.get("ps1-stations").replacements,1);
 assert.equal(f.get("ps1-stations").children[0].textContent,"As bancadas de PlayStation chegam em 2002.");
});
test("preço do PS1 pode mudar entre renders sem modificar save retido",()=>{
 const f=harness();f.consoleTab(true);
 f.render();
 f.ps1View({...f.options.ps1.snapshot(),hourlyPrice:3,canIncreasePrice:true});
 f.render();
 assert.ok(f.texts.some(([id,value])=>id==="ps1-hourly"&&value.includes("3,00")));
 assert.equal(f.get("ps1-price-up").disabled,false);
 assert.equal(f.calls.includes("staffSnapshot"),false);
});
test("aba Serviços atualiza a equipe e não consulta PS1",()=>{
 const f=harness();f.serviceTab(true);f.render();
 assert.deepEqual(f.calls,["staffSnapshot","showServiceAccess"]);
 assert.ok(f.texts.some(([id,value])=>id==="staff-summary"&&value==="Equipe disponível"));
 assert.equal(f.get("clean-bins").textContent,"Contratar faxineiro");
 assert.equal(f.get("hire-technician").textContent,"Contratar técnico");
});
test("medidores da equipe respeitam estado ausente e percentagem",()=>{
 const f=harness();f.serviceTab(true);f.render();
 assert.equal(f.get("cleaner-progress").hidden,true);
 assert.equal(f.get("technician-progress").hidden,false);
 assert.equal(f.get("technician-progress").value,25);
});
test("serviço sem diagnóstico ativo não chama inspeção de acesso",()=>{
 const f=harness();f.serviceTab(true);f.render();
 assert.equal(f.calls.includes("inspectServiceAccess"),false);
 assert.equal(f.get("service-access-summary").textContent,"");
});
test("diagnóstico ativo consulta rotas depois de renderizar a equipe",()=>{
 const f=harness();f.serviceTab(true);f.access(true);f.render();
 assert.deepEqual(f.calls,["staffSnapshot","showServiceAccess","inspectServiceAccess"]);
 assert.equal(f.get("service-access-summary").textContent,"1 destino bloqueado");
 assert.equal(f.get("show-service-access").disabled,false);
});
test("sem bloqueios o botão de acesso fica desativado",()=>{
 const f=harness();f.serviceTab(true);f.access(true);
 f.accessView({count:0,summary:"Nenhuma rota bloqueada",destinations:"",
  showDisabled:true,showLabel:"Ver bloqueios (0)",mapHint:"Sem bloqueios"});
 f.render();
 assert.equal(f.get("show-service-access").disabled,true);
 assert.equal(f.get("show-service-access").textContent,"Ver bloqueios (0)");
});
test("mudança de equipe mantém botões existentes e seus atributos",()=>{
 const f=harness();f.serviceTab(true);
 const cleaner=f.get("clean-bins");
 cleaner.dataset.boundListener="existing";f.render();
 f.staffView({...f.options.staff.snapshot(),cleanerControl:"Dispensar faxineiro"});
 f.render();
 assert.equal(f.get("clean-bins"),cleaner);
 assert.equal(cleaner.dataset.boundListener,"existing");
 assert.equal(cleaner.textContent,"Dispensar faxineiro");
});
test("PlayStation e serviços nunca modificam a barra de diagnóstico no Canvas",()=>{
 const f=harness();f.consoleTab(true);f.render();
 f.consoleTab(false);f.serviceTab(true);f.access(true);f.render();
 assert.equal(f.get("service-access-toolbar").hidden,false);
 assert.equal(f.calls.filter(x=>x==="inspectServiceAccess").length,1);
});
test("camada de UI não importa simulação, e main mantém seleção e inspeção sob demanda",()=>{
 const root=new URL("../src/",import.meta.url);
 const ui=readFileSync(new URL("ui/adminServicesConsoles.ts",root),"utf8");
 assert.doesNotMatch(ui,/from\s*["']\.\.\/sim\//);
 assert.doesNotMatch(ui,/\bGameState\b|stepGame|save\(|addEventListener|localStorage/);
 assert.match(sourceModule("ui/gamePanels.ts"),/renderAdminServicesConsoles\(\{/);
 assert.match(sourceModule("ui/gamePanels.ts"),/accessSnapshot:\(\)=>serviceAccessStatusSnapshot\(inspectServiceAccess\(!liveOnly\)\)/);
 assert.match(sourceModule("ui/gamePanels.ts"),/showServiceAccess:\(\)=>state\.windows\.adminOpen&&managementPanels.active\("services","access"\)/);
 assert.match(sourceModule("ui/gamePanels.ts"),/renderServiceAccessOverlayStatus\(serviceAccessStatusSnapshot\(serviceAccessInspection\.snapshot\(\)\),state\.serviceAccessVisible,setText,document\)/);
 const cache=readFileSync(new URL("ui/serviceAccessInspectionCache.ts",root),"utf8");
 assert.match(cache,/current-updatedAt>1600/);
 assert.match(sourceModule("ui/runtimeControls.ts"),/installPs1Controls\(/);
 assert.match(sourceModule("ui/runtimeControls.ts"),/installServiceControls\(/);
});
