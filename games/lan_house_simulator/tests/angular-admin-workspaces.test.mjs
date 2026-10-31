import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('Angular implements all eight computer/service pages from TypeScript navigation',()=>{
 const ui=file('frontend-angular/src/workspaces.ts');
 const adapter=file('src/ui/managementPanels.ts');
 for(const id of ['operations','hardware','windows','monitors','ledger','staff','network','access']){
  assert.ok(ui.includes("id:'"+id+"'"),id);
  assert.ok(adapter.includes("id:'"+id+"'"),id+' TS adapter');
 }
 for(const id of ['angular-computer-workspace','angular-service-workspace']){
  assert.ok(file('index.html').includes('id="'+id+'"'));
  assert.ok(file('frontend-angular/src/main.ts').includes("'"+id+"'"));
 }
 assert.match(adapter,/dispatchEvent\(new CustomEvent\('lhs:management-page-selected'/);
 assert.match(adapter,/node\.id!=='angular-service-workspace'/);
});
test('Angular PC selector mirrors native controls without gameplay logic',()=>{
 const ui=file('frontend-angular/src/workspaces.ts');
 for(const needle of ['MutationObserver','data-lcd-select','data-hardware-select','original.click()','button.click()'])
  assert.ok(ui.includes(needle),needle);
 assert.doesNotMatch(ui,/requestAnimationFrame|localStorage|createGame|purchase\(|save\(/);
 assert.doesNotMatch(ui,/from ['"][^'"]*\/(?:sim|render|application)\//);
});
test('Angular primary admin tabs follow the original controller, keyboard and mobile',()=>{
 const angular=file('frontend-angular/src/admin-area-navigation.ts');
 const template=file('frontend-angular/src/templates/admin-area-navigation.html');
 const controller=file('src/ui/adminAreaTabs.ts');
 const entry=file('frontend-angular/src/main.ts');
 assert.match(angular,/\.admin-tabs button\[data-admin-tab/);
 assert.match(angular,/original\.click\(\)/);
 assert.match(angular,/lhs:admin-area-selected/);
 assert.match(controller,/lhs:admin-area-selected/);
 assert.match(controller,/selectedArea!==area/);
 assert.match(template,/role="tablist"/);
 assert.match(template,/aria-selected/);
 assert.match(template,/aria-controls/);
 assert.match(template,/onKeydown\(\$event,tab.id\)/);
 assert.match(angular,/ArrowRight/);
 assert.match(angular,/ArrowLeft/);
 assert.match(angular,/Home/);
 assert.match(angular,/End/);
 assert.match(entry,/AdminAreaNavigationComponent/);
 assert.match(file('index.html'),/id="angular-admin-area-navigation"/);
 assert.match(file('frontend-angular/src/workspace.css'),/scroll-snap-type:x proximity/);
 assert.match(file('frontend-angular/src/workspace.css'),/html\[data-ui-framework="angular"\]/);
 assert.doesNotMatch(angular,/from ['"][^'"]*\/(?:sim|render|application)\//);
});
test('React entry remains operational until complete release',()=>{
 assert.match(file('index.html'),/src="\.\/js\/react-entry\.js"/);
 assert.match(file('frontend-angular/angular.json'),/workspace\.css/);
});
