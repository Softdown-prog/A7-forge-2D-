import test from "node:test";
import assert from "node:assert/strict";
import {readCurrentSources,auditMigration} from "../frontend-angular/scripts/audit_migration.mjs";
const sources=readCurrentSources();

test("React and Angular keep seven stable roots and production is not prematurely switched",()=>{
 const report=auditMigration(sources);
 assert.equal(report.production.reactScript,true);
 assert.equal(report.production.reactBundleBuilt,true);
 assert.equal(report.production.angularScript,false);
 assert.equal(report.hosts.reactOwned.length,7);
 assert.deepEqual(report.hosts.reactHostsMissingAngular,[]);
 assert.deepEqual(report.hosts.reactHostsMissingPreview,[]);
 assert.deepEqual(report.hosts.mandatoryAngularHostsMissingGame,[]);
 assert.equal(report.status,"not-ready");
 assert.equal(report.decision,"no-merge-no-deploy");
 assert.ok(report.hosts.optionalAngularHostsMissingGame.includes("angular-notice-inbox"));
 assert.ok(report.hosts.optionalAngularHostsMissingGame.includes("angular-time-weather"));
});
test("current browser scripts evidence real PS1/PS2, saves, admin, and three widths, not all flows",()=>{
 const report=auditMigration(sources);
 const byId=Object.fromEntries(report.browserQa.checks.map(c=>[c.id,c]));
 for(const id of ["console-purchases","menu-save-transfer","sound-preferences",
  "admin-workspaces","desktop-mobile-touch","disabled-purchases",
  "shop-catalog-preview","hud-weather","mail-inbox","shop-search","keyboard-focus",
  "privacy-consent","layout-editor","account-donation","stock-management","finance-navigation","admin-task-navigation"]){
  assert.equal(byId[id].status,"script-evidence-found",id);
 }
 assert.equal(report.browserQa.workflowPresent,true);
 assert.ok(report.blockers.some(b=>b.id==="react-production-entry"));
 assert.ok(report.blockers.some(b=>b.id==="optional-angular-hosts"));
});
test("the audit detects missing hosts and disabled browser checks",()=>{
 const missing=auditMigration({...sources,
  angularEntry:sources.angularEntry.replace("['react-menu-tour',MenuTourComponent]",""),
  angularWorkflow:"no QA",
  integratedQa:""});
 assert.deepEqual(missing.hosts.reactHostsMissingAngular,["react-menu-tour"]);
 assert.equal(missing.browserQa.workflowPresent,false);
 assert.ok(missing.blockers.some(b=>b.id==="angular-workflow"));
 assert.equal(missing.browserQa.checks.find(c=>c.id==="console-purchases").status,
  "not-evidenced-in-script");
 assert.equal(missing.status,"not-ready");
});
test("report is stable, read-only and cannot claim merge readiness from a static marker check",()=>{
 const report=auditMigration(sources);
 assert.deepEqual(report,auditMigration(sources));
 assert.ok(report.blockers.length>=2);
 assert.equal(report.decision,"no-merge-no-deploy");
 assert.match(report.browserQa.caveat,/NOT proof/);
 assert.ok(report.nextSteps.length>=3);
});

test("privacy coverage audits actual banner controls and expiry without claiming runtime success",()=>{
 const report=auditMigration(sources);
 assert.equal(report.browserQa.checks.find(c=>c.id==="privacy-consent")?.status,
  "script-evidence-found");
 assert.match(sources.integratedQa,/privacyChoices/);
 assert.match(sources.integratedQa,/31\*24\*60\*60\*1000/);
 assert.match(sources.integratedQa,/localStorage\.getItem\(key\)/);
 assert.equal(report.status,"not-ready","Privacy checks alone must never authorize the cutover");
});

test("mobile layout editor checks real Canvas touch, rotation, removal and reload",()=>{
 const report=auditMigration(sources);
 assert.equal(report.browserQa.checks.find(c=>c.id==="layout-editor")?.status,
  "script-evidence-found");
 for(const token of [
  "page.touchscreen.tap","worldTouch","built-poster:2",
  "#layout-confirm","#layout-removal-cancel","#layout-removal-confirm",
  "restored.objectPlacements"
 ])assert.ok(sources.integratedQa.includes(token),token);
 assert.equal(report.status,"not-ready",
  "Mobile QA script coverage alone cannot authorize React removal");
});

test("account and Donate browser evidence is mocked and cannot charge a player",()=>{
 const report=auditMigration(sources);
 assert.equal(report.browserQa.checks.find(c=>c.id==="account-donation")?.status,
  "script-evidence-found");
 for(const marker of ["accountDonationResults","angular-player-account",
  "identitytoolkit.googleapis.com","account-logout",
  "redemptions","orderCalls,0","cloudUploads,0",
  "No donation order or Mercado Pago charge"]){
  assert.ok(sources.integratedQa.includes(marker),marker);
 }
 assert.equal(report.decision,"no-merge-no-deploy");
});

test("stock browser evidence covers 2000 unlock, supplier order, price and persisted save",()=>{
 const report=auditMigration(sources);
 assert.equal(report.browserQa.checks.find(x=>x.id==="stock-management")?.status,
  "script-evidence-found");
 for(const text of ["stockManagementResults","angular-merchandise-catalog",
  "merchandise-order","merchandise-price-form","supplierTask",
  "restored.merchandise.orders.length"]){
  assert.ok(sources.integratedQa.includes(text),text);
 }
 assert.equal(report.decision,"no-merge-no-deploy");
});

test("finance Angular rehearsal shows all native pages without invoking reset",()=>{
 const report=auditMigration(sources);
 assert.equal(report.browserQa.checks.find(x=>x.id==="finance-navigation")?.status,
  "script-evidence-found");
 for(const marker of ["#angular-finance-workspace","#page-finance-",
  "financeSnapshot.ps1Stations","#reset-game",
  "Finance navigation cannot reset PS2 stations"]){
  assert.ok(sources.integratedQa.includes(marker),marker);
 }
 assert.equal(report.decision,"no-merge-no-deploy");
});

test("prices, licensing and consoles have integrated Angular navigation evidence",()=>{
 const report=auditMigration(sources);
 assert.equal(report.browserQa.checks.find(c=>c.id==="admin-task-navigation")?.status,
  "script-evidence-found");
 for(const marker of ["adminTaskMatrix","Angular task forwards native",
  "Only one native task page shown",
  "Navigation alone cannot purchase another PS1 disc",
  "Console navigation cannot purchase stations"]){
  assert.ok(sources.integratedQa.includes(marker),marker);
 }
 assert.equal(report.decision,"no-merge-no-deploy");
});


test("cutover audit includes standalone optional Angular hosts, not only tuple islands",()=>{
 const report=auditMigration(sources);
 for(const id of [
  "angular-shop-catalog","angular-shop-overview",
  "angular-player-account","angular-merchandise-catalog",
  "angular-stock-workspace","angular-finance-workspace",
  "angular-prices-workspace","angular-licenses-workspace",
  "angular-consoles-workspace"
 ]){
  assert.ok(report.hosts.optionalAngularHosts.includes(id),"Missing Angular host inventory: "+id);
  assert.ok(report.hosts.optionalAngularHostsMissingGame.includes(id),
   "React production must not accidentally contain preview-only host "+id);
 }
 for(const id of ["angular-computer-workspace","angular-service-workspace"]){
  assert.ok(report.hosts.optionalAngularHosts.includes(id));
  assert.ok(!report.hosts.optionalAngularHostsMissingGame.includes(id),
   "Already mounted game hosts must not become invented blockers: "+id);
 }
 assert.equal(report.decision,"no-merge-no-deploy");
});

test("isolated Angular preview explicitly renders calendar and mail safely",()=>{
 const report=auditMigration(sources);
 for(const id of ["mail-preview","weather-preview"]){
  assert.equal(report.browserQa.checks.find(c=>c.id===id)?.status,
   "script-evidence-found",id);
 }
 for(const marker of [
  "#angular-time-weather #time-weather-date",
  "#angular-notice-inbox #notices",
  "data-notice-read",
  "Untrusted inbox text never becomes an executable image"
 ])assert.ok(sources.previewQa.includes(marker),marker);
 assert.equal(report.decision,"no-merge-no-deploy");
});
