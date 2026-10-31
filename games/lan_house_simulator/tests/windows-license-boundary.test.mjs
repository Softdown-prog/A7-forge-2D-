import {sourceModule,assertCompositionAdaptersExclude} from "./helpers/composition.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame,pcCount,isValidSave} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {gameYear,WINDOWS_ERAS,installedWindows} from "../dist/js/sim/era.js";
import {windowsHardwareIssues} from "../dist/js/sim/hardware.js";
import {stationPoweredOn} from "../dist/js/sim/stationPower.js";
import {stationOccupied} from "../dist/js/sim/computerModels.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {createWindowsLicensePort} from "../dist/js/application/windowsLicensePort.js";

test("projeção de Windows conserva exatamente os limites do motor por PC",()=>{
 const s=createGame(4401,"historical"),rows=createWindowsLicensePort(()=>s).rows();
 assert.equal(rows.length,pcCount(s));
 for(const row of rows){
  const edition=WINDOWS_ERAS.find(w=>w.id===installedWindows(s,row.index));
  const licensed=s.pcWindowsLicenses?.[row.index]===true;
  assert.equal(row.title,"PC "+(row.index+1)+" · "+edition.name+(licensed?" · Windows licenciado":" · sem licença Windows"));
  assert.equal(row.choices.length,WINDOWS_ERAS.length);
  for(const item of row.choices){
   const spec=WINDOWS_ERAS.find(w=>w.id===item.id);
   const reasons=windowsHardwareIssues(s,row.index,spec.id);
   const already=licensed&&edition.id===spec.id;
   assert.equal(item.label,spec.name+" · "+(gameYear(s)<spec.year?"🔒 "+spec.year:already?"Instalado":"R$ "+spec.cost));
   assert.equal(item.title,reasons.join(" "));
   assert.equal(item.disabled,gameYear(s)<spec.year||already||s.cash<spec.cost||
    reasons.length>0||stationPoweredOn(s,row.index)||stationOccupied(s,row.index)||
    !!s.repairJobs?.some(j=>j.pc===row.index));
  }
 }
});
test("ano, saldo e licença são refletidos sem alterar a partida",()=>{
 const s=createGame(4402,"historical"),port=createWindowsLicensePort(()=>s);
 assert.match(port.rows()[0].choices.find(c=>c.id==="win11").label,/🔒 2021/);
 s.totalMinutes=(2022-1998)*360*DAY_MINUTES;s.cash=0;
 assert.match(port.rows()[0].choices.find(c=>c.id==="win11").label,/R\$ 620/);
 assert.equal(port.rows()[0].choices.find(c=>c.id==="win11").disabled,true);
 s.cash=10000;s.pcWindowsLicenses??=[];s.pcWindowsLicenses[0]=true;
 assert.match(port.rows()[0].title,/licenciado/);
 assert.match(port.rows()[0].choices.find(c=>c.id===installedWindows(s,0)).label,/Instalado/);
});
test("a porta acompanha o save substituído e mantém o serializador",()=>{
 let s=createGame(4403,"historical");
 const port=createWindowsLicensePort(()=>s),old=s;
 const before=port.rows()[0].choices.find(c=>c.id==="win11").label;
 s=parseImportedSave(serializeSave(s));
 s.totalMinutes=(2022-1998)*360*DAY_MINUTES;
 s.cash=9500;
 assert.notEqual(s,old);
 assert.notEqual(port.rows()[0].choices.find(c=>c.id==="win11").label,before);
 assert.equal(port.rows().length,pcCount(s));
 assert.equal(isValidSave(s),true);
});
test("UI Windows desacoplada do motor e dados de clique preservados",()=>{
 const root=new URL("../src/",import.meta.url);
 const sections=readFileSync(new URL("ui/adminGpuLicenseSections.ts",root),"utf8");
 const ui=readFileSync(new URL("ui/windowsLicensePanel.ts",root),"utf8");
 const app=readFileSync(new URL("application/windowsLicensePort.ts",root),"utf8");
 assert.doesNotMatch(ui,/from\s*["']\.\.\/sim\//);
 assert.doesNotMatch(app,/\b(document|window|HTMLElement)\b/);
 assert.match(ui,/dataset\.winPc/);
 assert.match(ui,/dataset\.winEdition/);
 assert.match(ui,/syncPanelChildren\(panel,next\)/);
 assert.match(sourceModule("application/gamePorts.ts"),/createWindowsLicensePort\(getState\)/);
 assert.match(sourceModule("ui/gamePanels.ts"),/renderAdminGpuLicenseSections\(\{/);
 assert.match(sections,/renderWindowsLicensePanel\(options.licensePanel,options.windows\)/);
 assertCompositionAdaptersExclude(/\bwindowsHardwareIssues\(/);
});
