import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {WORKSPACE_TASKS} from "../src/react/adminWorkspaceData.mjs";

const source=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("computer and service tasks match the existing TypeScript management pages",()=>{
 assert.deepEqual(WORKSPACE_TASKS.computers.map(task=>task.id),
  ["operations","hardware","windows","monitors","ledger"]);
 assert.deepEqual(WORKSPACE_TASKS.services.map(task=>task.id),
  ["staff","network","access"]);
 for(const [area,tasks] of Object.entries(WORKSPACE_TASKS)){
  const adapter=source("src/ui/managementPanels.ts");
  for(const task of tasks){
   assert.match(adapter,new RegExp("id:'"+task.id+"'"));
   assert.ok(task.label&&task.description);
  }
  assert.match(source("index.html"),new RegExp('id="react-'+(area==="computers"?"computer":"service")+'-workspace"'));
 }
});

test("React workspaces only navigate through original buttons and mirror station choice",()=>{
 const jsx=source("src/react/adminWorkspaces.jsx"),adapter=source("src/ui/managementPanels.ts");
 const entry=source("src/react/entry.jsx");
 assert.match(entry,/<ComputerWorkspace\/>/);
 assert.match(entry,/<ServicesWorkspace\/>/);
 assert.match(jsx,/\.management-pages button\[data-panel-choice=/);
 assert.match(jsx,/button\.click\(\)/);
 assert.match(jsx,/data-hardware-select/);
 assert.match(jsx,/data-lcd-select/);
 assert.match(jsx,/original\.click\(\)/);
 assert.match(jsx,/aria-pressed=\{station\.selected\}/);
 assert.match(adapter,/lhs:management-page-selected/);
 assert.match(adapter,/node\.id!==['"]react-service-workspace['"]/);
 assert.doesNotMatch(jsx,/requestAnimationFrame|localStorage|createGame|purchase\(|save\(/);
 assert.doesNotMatch(jsx,/from ["']\.\.\/(application|sim|render)\//);
});

test("native hardware and service controls remain present and keyboard accessible",()=>{
 const html=source("index.html"),css=source("style.css");
 for(const id of ["pc-maintenance","section-computers","section-services","staff-summary","internet"]){
  assert.match(html,new RegExp('id="'+id+'"'));
 }
 assert.match(source("src/ui/pcOperationsPanel.ts"),/dataset\.pcRepair/);
 assert.match(source("src/ui/hardwarePanel.ts"),/dataset\.hardwareSelect/);
 assert.match(source("src/ui/lcdMonitorsPanel.ts"),/dataset\.lcdSelect/);
 assert.match(css,/react-workspace-grid/);
 assert.match(css,/react-station-switch-buttons/);
 assert.match(css,/:focus-visible/);
 assert.doesNotMatch(css,/#section-computers\s*>\s*\.management-pages\s*\{\s*display:none/);
});
