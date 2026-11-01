import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
const src=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('Angular admin snapshots are read-only, scoped and event-deduplicated',()=>{
 const bridge=src('src/ui/adminReactiveSummary.ts');
 const game=src('src/ui/gamePanels.ts');
 assert.match(bridge,/new WeakMap/);
 assert.match(bridge,/states\.get\(area\)===key/);
 assert.match(bridge,/area==="computers"\?"angular-computer-workspace"/);
 assert.match(bridge,/doc\.getElementById\(host\)/);
 assert.match(bridge,/lhs:admin-"/);
 for(const area of ['finance','stock','computers']){
  assert.ok(game.includes('publishAngularAdminSummary(document,"'+area+'"'));
 }
 assert.doesNotMatch(bridge,/localStorage|fetch\(|GameState|from ["'].*\/sim\//);
});
test('Finance, stock and computer islands subscribe once and clean up',()=>{
 const workspaces=src('frontend-angular/src/workspaces.ts');
 for(const area of ['finance','stock','computers']){
  const evt="'lhs:admin-"+area+"-updated'";
  assert.ok(workspaces.includes("addEventListener("+evt));
  assert.ok(workspaces.includes("removeEventListener("+evt));
 }
 assert.doesNotMatch(workspaces,/observer\.observe\(root,\{subtree:true,childList:true/);
 for(const area of ['finance','stock','computer']){
  const html=src('frontend-angular/src/templates/'+area+'-workspace.html');
  assert.match(html,/angular-workspace-live/);
 }
 assert.match(workspaces,/this\.syncLock\(\)/);
});

test('PC health uses a read-only port and only publishes changed values',()=>{
 const port=src('src/application/pcOperationsPort.ts');
 const game=src('src/ui/gamePanels.ts');
 const component=src('frontend-angular/src/workspaces.ts');
 const html=src('frontend-angular/src/templates/computer-workspace.html');
 for(const field of ['installed','poweredOff','broken','repairing','averageWear']){
  assert.match(port,new RegExp('readonly '+field+':number'));
  assert.ok(component.includes('view.'+field));
  assert.ok(html.includes('live.'+field));
 }
 assert.match(port,/Math\.round\(totalWear\/installed\)/);
 assert.match(game,/publishAngularAdminSummary\(document,"computers",\{\.\.\.pcOperationsPort\.overview\(\)\}\)/);
 assert.doesNotMatch(component,/requestAnimationFrame|setInterval\(/);
});
test('station switch synchronizes after native reconciliation without a DOM observer',()=>{
 const native=src('src/ui/adminComputerSections.ts');
 const workspaces=src('frontend-angular/src/workspaces.ts');
 assert.match(native,/lhs:pc-maintenance-refreshed/);
 assert.match(workspaces,/addEventListener\('lhs:pc-maintenance-refreshed'/);
 assert.match(workspaces,/removeEventListener\('lhs:pc-maintenance-refreshed'/);
 assert.doesNotMatch(workspaces,/new MutationObserver/);
 assert.match(native,/renderPcMaintenancePanel/);
});

test('Integrated Chromium QA checks real PC health, mobile selection and persisted power state',()=>{
 const qa=src('frontend-angular/scripts/verify_integrated_game.mjs');
 const workflow=readFileSync(new URL('../../../.github/workflows/lhs-angular-ui-preview.yml',import.meta.url),'utf8');
 for(const marker of [
  "pc-maintenance-'+width",
  '#angular-computer-workspace .angular-pc-health',
  '[data-angular-station="1"]','hardware-select-0',
  '#pc-power-0','[data-pc-repair="0"]',
  'save.pcPoweredOff?.[0]===false','save.pcPoweredOff?.[0]===true',
  'pcMaintenance:true','Desgaste médio'
 ])assert.ok(qa.includes(marker),marker);
 assert.match(qa,/for\(const width of \[1280,414,360\]\)/);
 assert.match(qa,/isMobile:mobile,hasTouch:mobile/);
 assert.match(workflow,/branches: \["main", "feat\/lhs-angular-ui-foundation"\]/);
 assert.match(workflow,/verify_integrated_game\.mjs/);
});
