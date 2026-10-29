import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {hireEmployee} from "../dist/js/sim/staff.js";
import {requestCleaning} from "../dist/js/sim/services.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {createStaffStatusPort} from "../dist/js/application/staffStatusPort.js";
import {renderStaffStatusPanel} from "../dist/js/ui/staffStatusPanel.js";
const money=n=>"R$ "+n.toLocaleString("pt-BR");

test("equipe descontratada e lixeiras vazias: projeção sem efeito colateral",()=>{
 const game=createGame(8101,"historical");
 const before=JSON.stringify(game),view=createStaffStatusPort(()=>game).snapshot();
 assert.match(view.cleanerControl,/Contratar faxineiro/);
 assert.match(view.technicianControl,/Contratar técnico/);
 assert.match(view.summary,/folha acumulada R\$ 0/);
 assert.match(view.cleanerActivity,/Sem contrato/);
 assert.match(view.technicianActivity,/Sem contrato/);
 assert.equal(view.cleanerProgress,null);
 assert.equal(view.technicianProgress,null);
 assert.equal(view.binSummary,"Lixeiras: 1: Vazia · 2: Vazia · faxineiro sem contrato");
 assert.equal(view.cleaningDisabled,true);
 assert.match(view.cleaningLabel,/Chamar faxineiro avulso/);
 assert.equal(JSON.stringify(game),before);
});

test("contratação, lixo e orçamento reproduzem rótulos e bloqueios anteriores",()=>{
 const game=createGame(8102,"historical");
 const port=createStaffStatusPort(()=>game);
 game.binFill=[15,0];
 game.cash=0;
 assert.equal(port.snapshot().cleaningDisabled,true,"avulso depende de saldo");
 game.cash=10000;
 assert.equal(port.snapshot().cleaningDisabled,false);
 assert.equal(hireEmployee(game,"cleaner").ok,true);
 assert.equal(hireEmployee(game,"technician").ok,true);
 game.cash=0;
 const view=port.snapshot();
 assert.equal(view.cleanerControl,"Dispensar faxineiro");
 assert.equal(view.technicianControl,"Dispensar técnico");
 assert.match(view.summary,/faxineiro contratado · técnico contratado/);
 assert.match(view.summary,/dias trabalhados neste mês: faxineiro 0, técnico 0/);
 assert.equal(view.cleaningLabel,"Solicitar limpeza · coberta pelo contrato");
 assert.equal(view.cleaningDisabled,false,"contrato não exige taxa de visita");
 assert.match(view.binSummary,/1: Enchendo · 15%/);
});

test("serviço em andamento preserva fases, porcentagem e bloqueio de solicitação",()=>{
 const game=createGame(8103,"historical");
 game.cash=10000;game.binFill=[80,0];
 assert.equal(hireEmployee(game,"cleaner").ok,true);
 assert.equal(requestCleaning(game).ok,true);
 const port=createStaffStatusPort(()=>game);
 let view=port.snapshot();
 assert.match(view.cleanerActivity,/A caminho/);
 assert.equal(view.cleanerProgress,null);
 assert.equal(view.cleaningDisabled,true);
 assert.equal(view.cleaningLabel,"Faxineiro · A caminho");
 game.cleaningJob.phase="working";
 game.cleaningJob.progress=5;
 view=port.snapshot();
 assert.match(view.cleanerActivity,/Limpando · 55%/);
 assert.equal(view.cleanerProgress,55);
 assert.equal(view.cleaningLabel,"Faxineiro · Limpando");
 const old=view.cleanerActivity;
 game.cleaningJob.progress=7;
 assert.equal(view.cleanerActivity,old,"snapshot mantém valores primitivos");
 assert.equal(port.snapshot().cleanerProgress,77);
 assert.equal(isValidSave(game),true);
});

test("porta lê a nova partida após importação sem modificar o save anterior",()=>{
 let game=createGame(8104,"historical");
 const port=createStaffStatusPort(()=>game),old=game,before=JSON.stringify(old);
 game=parseImportedSave(serializeSave(game));
 game.binFill=[100,0];
 assert.match(port.snapshot().binSummary,/1: Cheia/);
 assert.equal(JSON.stringify(old),before);
 assert.equal(isValidSave(game),true);
});

test("apresentador mantém botões, listener e elementos progress estáveis",()=>{
 const previous=globalThis.HTMLProgressElement;
 class Meter {constructor(){this.hidden=false;this.value=99;}}
 globalThis.HTMLProgressElement=Meter;
 try{
  const game=createGame(8105,"historical"),port=createStaffStatusPort(()=>game);
  const btns=new Map(["#clean-bins","#hire-technician","#clean-bins-now"].map(id=>[id,{textContent:"",disabled:false,clickHandlers:["click"]}]));
  const meters=new Map([["cleaner-progress",new Meter()],["technician-progress",new Meter()]]);
  const doc={querySelector:id=>btns.get(id)??null,getElementById:id=>meters.get(id)??null};
  const shown=new Map(),setText=(id,value)=>shown.set(id,value);
  renderStaffStatusPanel(port.snapshot(),setText,doc);
  assert.equal(meters.get("cleaner-progress").hidden,true);
  assert.equal(meters.get("cleaner-progress").value,0);
  assert.equal(btns.get("#clean-bins-now").disabled,true);
  assert.match(shown.get("staff-summary"),/Equipe/);
  game.binFill=[50,0];game.cash=10000;
  renderStaffStatusPanel(port.snapshot(),setText,doc);
  assert.equal(btns.get("#clean-bins-now").disabled,false);
  assert.equal(btns.get("#clean-bins-now").clickHandlers[0],"click");
  assert.equal(meters.get("cleaner-progress"),doc.getElementById("cleaner-progress"));
  assert.equal(btns.get("#clean-bins-now"),doc.querySelector("#clean-bins-now"));
 }finally{
  if(previous===undefined)delete globalThis.HTMLProgressElement;
  else globalThis.HTMLProgressElement=previous;
 }
});

test("UI desacoplada da simulação e o main preserva controle de aba e acesso",()=>{
 const root=new URL("../src/",import.meta.url);
 const app=readFileSync(new URL("application/staffStatusPort.ts",root),"utf8");
 const ui=readFileSync(new URL("ui/staffStatusPanel.ts",root),"utf8");
 const main=readFileSync(new URL("main.ts",root),"utf8");
 const sections=readFileSync(new URL("ui/adminServicesConsoles.ts",root),"utf8");
 assert.doesNotMatch(app,/\b(document|window|HTMLElement|HTMLProgressElement)\b/);
 assert.doesNotMatch(ui,/from\s*["']\.\.\/sim\//);
 assert.doesNotMatch(ui,/replaceChildren|innerHTML|addEventListener/);
 assert.ok(main.includes("createStaffStatusPort(()=>game)"));
 assert.ok(main.includes("renderAdminServicesConsoles({"));
 assert.ok(sections.includes("renderStaffStatusPanel(options.staff.snapshot(),options.setText,options.doc)"));
 assert.ok(main.includes('managementPanels.active("services","access")'));
 for(const id of ["clean-bins","hire-technician","clean-bins-now",
  "staff-summary","cleaner-activity","technician-activity","cleaner-progress","technician-progress","bin-status"])
  assert.ok(ui.includes('"'+id+'"')||ui.includes('"#'+id+'"'));
 assert.doesNotMatch(main,/\bstaffActivity\(/);
 assert.doesNotMatch(main,/\bbinStatus\(/);
});
