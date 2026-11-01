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
  "privacy-consent"]){
  assert.equal(byId[id].status,"script-evidence-found",id);
 }
 for(const id of ["layout-editor","account-donation"]){
  assert.equal(byId[id].status,"not-evidenced-in-script",id);
 }
 assert.equal(report.browserQa.workflowPresent,true);
 assert.ok(report.blockers.some(b=>b.id==="untested-integrated-flows"));
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
