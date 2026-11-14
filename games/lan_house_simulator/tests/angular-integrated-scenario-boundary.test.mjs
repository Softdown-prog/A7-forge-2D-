import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyPrivacyChoices} from '../frontend-angular/scripts/integrated-qa/privacy.mjs';
import {verifyMobileLayoutEditor} from '../frontend-angular/scripts/integrated-qa/mobileLayoutEditor.mjs';
import {verifyAccountDonation} from '../frontend-angular/scripts/integrated-qa/accountDonation.mjs';
import {verifyStockManagement} from '../frontend-angular/scripts/integrated-qa/stockManagement.mjs';
import {verifyConsoleReleaseGates} from '../frontend-angular/scripts/integrated-qa/consoleReleaseGates.mjs';
import {verifyTopGamesMagazineGates} from '../frontend-angular/scripts/integrated-qa/topGamesMagazineGates.mjs';

const script=readFileSync(new URL('../frontend-angular/scripts/verify_integrated_game.mjs',import.meta.url),'utf8');
const cases=[
 ['privacy.mjs','verifyPrivacyChoices',verifyPrivacyChoices,'privacyChoices','expiresAfter30Days:true'],
 ['mobileLayoutEditor.mjs','verifyMobileLayoutEditor',verifyMobileLayoutEditor,'layoutEditorResults','Mobile moved and rotated PC survives real reload'],
 ['accountDonation.mjs','verifyAccountDonation',verifyAccountDonation,'accountDonationResults','No donation order or Mercado Pago charge'],
 ['stockManagement.mjs','verifyStockManagement',verifyStockManagement,'stockManagementResults','Reload does not bill pending merchandise deliveries twice'],
 ['consoleReleaseGates.mjs','verifyConsoleReleaseGates',verifyConsoleReleaseGates,'blocked','ps2Available:scenario.ps2Count'],
 ['topGamesMagazineGates.mjs','verifyTopGamesMagazineGates',verifyTopGamesMagazineGates,'magazineShop','buttonDisabled:!received']
];

test('integrated Chromium scenarios remain independently imported and invoked in order',()=>{
 let last=script.indexOf('const reports=[]');
 assert.ok(last>=0,'integrated reports must be initialized before scenario execution');
 for(const [file,name,fn,returnName,anchor] of cases){
  const module=readFileSync(new URL('../frontend-angular/scripts/integrated-qa/'+file,import.meta.url),'utf8');
  assert.equal(typeof fn,'function',name+' exported function');
  assert.match(module,new RegExp('export async function '+name+'\\('));
  assert.ok(module.includes(anchor),file+' retained browser assertion/report');
  assert.ok(module.includes('return '+returnName+';'),file+' reports its original results');
  assert.ok(script.includes("from './integrated-qa/"+file+"'"),'orchestrator imports '+file);
  const call=script.indexOf('const '+returnName+'=await '+name+'(');
  assert.ok(call>last,'scenario order must match pre-refactor sequence: '+name);
  last=call;
  assert.ok(!script.includes('const '+returnName+'=[];'),name+' must not duplicate its original inline loop');
 }
 assert.ok(script.indexOf("await writeFile(resolve(output,'results.json')")>last,'report is written only after the scenarios');
 for(const variable of ['reports','blocked','magazineShop','privacyChoices','layoutEditorResults','accountDonationResults','stockManagementResults'])
  assert.ok(script.includes(variable),'report must preserve '+variable);
});

test('independent scenarios never bypass the active Chromium environment',()=>{
 for(const [file,, ,returnName] of cases){
  const body=readFileSync(new URL('../frontend-angular/scripts/integrated-qa/'+file,import.meta.url),'utf8');
  assert.match(body,/browser\.newContext\(/,'must exercise real Chromium context');
  assert.match(body,/await page\.goto\(origin/,'must load the actual app');
  assert.match(body,/await context\.close\(\)/,'must close the scenario context');
  assert.ok(body.includes('const '+returnName+'=[];'));
 }
});

test('extracted mobile, account and stock scenarios retain their critical safeguards',()=>{
 const read=name=>readFileSync(new URL('../frontend-angular/scripts/integrated-qa/'+name,import.meta.url),'utf8');
 for(const token of ['page.touchscreen.tap','worldTouch','#layout-confirm','restored.objectPlacements'])
  assert.ok(read('mobileLayoutEditor.mjs').includes(token),'mobile editor: '+token);
 for(const token of ['identitytoolkit.googleapis.com','securetoken.googleapis.com','context.route(fakeApi','orderCalls,0','cloudUploads,0'])
  assert.ok(read('accountDonation.mjs').includes(token),'payment isolation: '+token);
 for(const token of ['merchandise-price-form','supplierTask','restored.merchandise.orders.length','Reload does not bill pending merchandise deliveries twice'])
  assert.ok(read('stockManagement.mjs').includes(token),'stock state: '+token);
});
