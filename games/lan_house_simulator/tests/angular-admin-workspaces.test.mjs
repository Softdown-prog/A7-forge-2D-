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
test('Angular task views read the confirmed native selection and schedule OnPush refresh',()=>{
 const ui=file('frontend-angular/src/workspaces.ts');
 const qa=file('frontend-angular/scripts/verify_integrated_game.mjs');
 const manager=file('src/ui/managementPanels.ts');
 assert.match(ui,/inject\(ChangeDetectorRef\)/);
 assert.match(ui,/this\.readNativeSelection\(\)/);
 assert.match(ui,/this\.cdr\.markForCheck\(\)/);
 assert.match(ui,/\.management-pages button\[aria-pressed="true"\]/);
 assert.match(ui,/if\(button&&!button\.disabled\)/);
 assert.match(ui,/button\.click\(\)/);
 assert.match(qa,/const awaitTaskParity=async/);
 assert.match(qa,/await awaitTaskParity\('finance',task\)/);
 assert.match(qa,/await awaitTaskParity\(group\.area,task\)/);
 assert.match(qa,/Native-only page change stays synchronized in Angular/);
 assert.match(manager,/lhs:management-page-selected/);
 assert.doesNotMatch(ui,/\b(?:resetGame|purchaseStation|orderMerchandise|localStorage)\b/);
});
test('Angular PC selector mirrors native controls without gameplay logic',()=>{
 const ui=file('frontend-angular/src/workspaces.ts');
 for(const needle of ['lhs:pc-maintenance-refreshed','data-lcd-select','data-hardware-select','original.click()','button.click()'])
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
 assert.match(angular,/inject\(ChangeDetectorRef\)/);
 assert.match(angular,/this\.readNativeSelection\(\)/);
 assert.match(angular,/this\.cdr\.markForCheck\(\)/);
 assert.match(file('frontend-angular/scripts/verify_integrated_game.mjs'),/awaitAdminAreaParity/);
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

test('Angular stock workspace mirrors native 2000 unlock and forwards task commands',()=>{
 const ui=file('frontend-angular/src/workspaces.ts');
 const markup=file('frontend-angular/src/templates/stock-workspace.html');
 const manager=file('src/ui/managementPanels.ts');
 const entry=file('frontend-angular/src/main.ts');
 const preview=file('frontend-angular/src/index.html');
 const css=file('frontend-angular/src/workspace.css');
 for(const task of ['catalog','suppliers','orders']){
  assert.match(ui,new RegExp("id:'"+task+"'"));
  assert.match(manager,new RegExp("id:'"+task+"'"));
 }
 assert.match(ui,/class StockWorkspaceComponent extends Workspace/);
 assert.match(ui,/catalogLocked=signal\(true\)/);
 assert.match(ui,/original\.disabled/);
 assert.match(ui,/lhs:admin-stock-updated/);
 assert.doesNotMatch(ui,/new MutationObserver/);
 assert.match(ui,/super\.ngOnInit\(\)/);
 assert.match(ui,/super\.ngOnDestroy\(\)/);
 assert.match(markup,/\[disabled\]="task\.id==='catalog'&&catalogLocked\(\)"/);
 assert.match(markup,/openTask\(task\.id\)/);
 assert.match(markup,/data-angular-task/);
 assert.match(manager,/angularRoot=area==='computers'/);
 assert.match(manager,/area==='stock'\?root\.querySelector\('#angular-stock-workspace'\)/);
 assert.match(manager,/MERCHANDISE_CATALOG_UNLOCK_YEAR=2000/);
 assert.match(entry,/StockWorkspaceComponent/);
 assert.match(entry,/stockWorkspaceHost/);
 assert.match(preview,/id="angular-stock-workspace"/);
 assert.match(css,/#angular-stock-workspace \+ \.management-pages/);
 assert.doesNotMatch(file('index.html'),/id="angular-stock-workspace"/);
 assert.doesNotMatch(ui,/from ['"][^'"]*\/(?:sim|render|application)\//);
 assert.doesNotMatch(ui,/orderMerchandise|setMerchandisePrice|localStorage|fetch\(/);
});


test('Angular finance task navigation delegates to native manager with safe restart',()=>{
 const ui=file('frontend-angular/src/workspaces.ts');
 const template=file('frontend-angular/src/templates/finance-workspace.html');
 const manager=file('src/ui/managementPanels.ts');
 const preview=file('frontend-angular/src/index.html');
 const entry=file('frontend-angular/src/main.ts');
 const css=file('frontend-angular/src/workspace.css');
 const original=file('index.html');
 for(const task of ['balance','usage','events','promotion','feedback','restart']){
  assert.match(ui,new RegExp("id:'"+task+"'"));
  assert.match(manager,new RegExp("id:'"+task+"'"));
  assert.match(template,new RegExp("data-angular-task"));
 }
 assert.match(ui,/class FinanceWorkspaceComponent extends Workspace/);
 assert.match(template,/\(click\)="openTask\(task\.id\)"/);
 assert.match(template,/task\.id==='restart'/);
 assert.match(template,/selected\(\)==='restart'/);
 assert.doesNotMatch(template,/#reset-game|\(click\)="reset/);
 assert.match(original,/id="reset-game"/);
 assert.match(manager,/area==='finance'\?root\.querySelector\('#angular-finance-workspace'\)/);
 assert.match(entry,/FinanceWorkspaceComponent/);
 assert.match(entry,/financeWorkspaceHost/);
 assert.match(preview,/id="angular-finance-workspace"/);
 assert.doesNotMatch(original,/id="angular-finance-workspace"/);
 assert.match(css,/#angular-finance-workspace \+ \.management-pages/);
 assert.doesNotMatch(ui,/from ['"][^'"]*\/(?:sim|render|application)\//);
 assert.doesNotMatch(ui,/resetGame|localStorage|fetch\(|createGame/);
});


test('Prices, licenses and consoles navigate existing native panels without engine logic',()=>{
 const ui=file('frontend-angular/src/workspaces.ts');
 const main=file('frontend-angular/src/main.ts');
 const template=file('frontend-angular/src/templates/admin-task-workspace.html');
 const management=file('src/ui/managementPanels.ts');
 const css=file('frontend-angular/src/workspace.css');
 const preview=file('frontend-angular/src/index.html');
 const published=file('index.html');
 const groups={
  prices:['hourly','insights','retail','printing','discs'],
  licenses:['windows','classic','gpu'],
  consoles:['stations','pricing','discs']
 };
 for(const [area,pages] of Object.entries(groups)){
  assert.match(ui,new RegExp("readonly area='"+area+"' as const"));
  assert.match(ui,new RegExp("readonly tasks=TASKS\\."+area));
  assert.match(main,new RegExp("'angular-"+area+"-workspace'"));
  assert.match(management,new RegExp("area==='"+area+"'\\?root\\.querySelector\\('#angular-"+area+"-workspace'\\)"));
  assert.ok(preview.includes('id="angular-'+area+'-workspace"'));
  assert.ok(!published.includes('id="angular-'+area+'-workspace"'));
  assert.ok(css.includes('#angular-'+area+'-workspace + .management-pages'));
  for(const page of pages){
   assert.match(management,new RegExp("id:'"+page+"'"));
   assert.match(ui,new RegExp("id:'"+page+"'"));
  }
 }
 // The original manager moves task contents. Never relocate Angular hosts
 // inside a page that can later become hidden.
 assert.match(management,/\.filter\(node=>node\.id!=='angular-prices-workspace'\)/);
 assert.match(management,/\.filter\(node=>node\.id!=='angular-licenses-workspace'\)/);
 assert.match(template,/data-angular-task/);
 assert.match(template,/openTask\(task\.id\)/);
 assert.match(template,/aria-controls/);
 assert.match(template,/aria-pressed/);
 assert.doesNotMatch(ui,/orderMerchandise|resetGame|localStorage|fetch\(|createGame/);
 assert.doesNotMatch(template,/\(click\)="buy|\(click\)="purchase/);
});
