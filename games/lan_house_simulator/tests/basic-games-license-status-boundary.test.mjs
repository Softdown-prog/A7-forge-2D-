import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {basicGamesLicenseCost,licenseGames} from "../dist/js/sim/economy.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {createBasicGamesLicenseStatusPort} from "../dist/js/application/basicGamesLicenseStatusPort.js";
import {renderBasicGamesLicenseStatus} from "../dist/js/ui/basicGamesLicenseStatusPanel.js";
function campaign(year=1998,mode="historical"){
 const s=createGame(321,mode);s.totalMinutes=(year-1998)*360*DAY_MINUTES;return s;
}
test("1998: exibe taxa única, botão e aviso sem editar o save",()=>{
 const s=campaign(),before=JSON.stringify(s),v=createBasicGamesLicenseStatusPort(()=>s).snapshot();
 assert.equal(v.fee,basicGamesLicenseCost(s));
 assert.equal(v.buttonHidden,false);
 assert.equal(v.buttonDisabled,s.cash<v.fee);
 assert.equal(v.buttonLabel,"Regularizar jogos · "+v.fee.toLocaleString("pt-BR",{style:"currency",currency:"BRL"}));
 assert.match(v.statusLabel,/risco de multa/);
 assert.equal(JSON.stringify(s),before);
});
test("modo clássico mantém valor; histórico acompanha a economia por ano",()=>{
 for(const year of [1998,1999,2005,2025,2030]){
  const historic=campaign(year),classic=campaign(year,"classic");
  assert.equal(createBasicGamesLicenseStatusPort(()=>historic).snapshot().fee,basicGamesLicenseCost(historic));
  assert.equal(createBasicGamesLicenseStatusPort(()=>classic).snapshot().fee,450);
 }
});
test("saldo insuficiente bloqueia; licença adquirida fica oculta e permanente",()=>{
 const s=campaign(2005),port=createBasicGamesLicenseStatusPort(()=>s),fee=port.snapshot().fee;
 s.cash=fee-0.01;assert.equal(port.snapshot().buttonDisabled,true);
 s.cash=fee;assert.equal(port.snapshot().buttonDisabled,false);
 assert.equal(licenseGames(s).ok,true);
 s.cash=0;
 const view=port.snapshot();
 assert.equal(view.buttonHidden,true);
 assert.equal(view.buttonDisabled,true);
 assert.equal(view.statusLabel,"Jogos regularizados · licença permanente, sem renovação anual.");
 assert.ok(view.buttonLabel.endsWith(fee.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})));
});
test("porta lê o save novo sem modificar o anterior",()=>{
 let s=campaign(1998);const previous=s,old=JSON.stringify(s);
 const port=createBasicGamesLicenseStatusPort(()=>s);
 s=parseImportedSave(serializeSave(s));assert.equal(isValidSave(s),true);
 s.cash=10000;assert.equal(licenseGames(s).ok,true);
 assert.equal(port.snapshot().buttonHidden,true);
 assert.equal(JSON.stringify(previous),old);
 s=campaign(2030);assert.equal(port.snapshot().buttonHidden,false);
});
test("UI mantém id do status, botão e lida com botão ausente",()=>{
 const view=createBasicGamesLicenseStatusPort(()=>campaign()).snapshot();
 const button={hidden:true,disabled:false,textContent:"antigo"},calls=[];
 renderBasicGamesLicenseStatus(view,(id,text)=>calls.push([id,text]),{
  querySelector:query=>{assert.equal(query,"#license");return button;}
 });
 assert.deepEqual(calls,[["license-status",view.statusLabel]]);
 assert.equal(button.hidden,view.buttonHidden);
 assert.equal(button.disabled,view.buttonDisabled);
 assert.equal(button.textContent,view.buttonLabel);
 renderBasicGamesLicenseStatus(view,()=>{}, {querySelector:()=>null});
});
test("UI desacoplada do motor; fluxo de compra original continua no main",()=>{
 const root=new URL("../src/",import.meta.url);
 const app=readFileSync(new URL("application/basicGamesLicenseStatusPort.ts",root),"utf8");
 const ui=readFileSync(new URL("ui/basicGamesLicenseStatusPanel.ts",root),"utf8");
 const main=readFileSync(new URL("main.ts",root),"utf8");
 const sections=readFileSync(new URL("ui/adminGpuLicenseSections.ts",root),"utf8");
 assert.equal(app.includes("document."),false);
 assert.equal(ui.includes("../sim/"),false);
 assert.equal(ui.includes("GameState"),false);
 assert.equal(ui.includes("addEventListener"),false);
 assert.ok(main.includes("createBasicGamesLicenseStatusPort(()=>game)"));
 assert.ok(main.includes("renderAdminGpuLicenseSections({"));
 assert.ok(sections.includes("renderBasicGamesLicenseStatus(options.basicGames.snapshot(),options.setText,options.doc)"));
 assert.ok(main.includes("installGameLicensingControls("));
 const inbox=readFileSync(new URL("application/noticeInboxPort.ts",root),"utf8");
 assert.ok(inbox.includes("basicGamesLicenseCost(s).toLocaleString"));
 assert.ok(inbox.includes('text:"Regularizar jogos · "+'));
});
