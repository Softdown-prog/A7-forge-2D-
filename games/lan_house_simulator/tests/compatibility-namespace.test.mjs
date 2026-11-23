import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const source=relative=>readFileSync(new URL('../'+relative,import.meta.url),'utf8');
const core=[
 'index.html','style.css','src/compat/entry.mjs','src/ui/shopPanels.ts',
 'scripts/build.mjs','website/build.mjs','website/check.mjs',
 'frontend-angular/src/index.html','frontend-angular/src/main.ts',
 'frontend-angular/src/shop-search.ts',
 'frontend-angular/src/templates/menu-tour.html',
 'frontend-angular/src/templates/shop-search.html',
 'frontend-angular/src/templates/shop-categories.html',
 'frontend-angular/src/templates/admin-shortcuts.html',
 'frontend-angular/src/templates/quick-deck.html',
 'frontend-angular/scripts/cutover_document.mjs',
 'frontend-angular/scripts/integrated-qa/consoleReleaseGates.mjs'
];
const uiIds=[
 'ui-menu-actions','ui-menu-tour','ui-topbar-actions','ui-quick-deck',
 'ui-shop-categories','ui-shop-search','ui-admin-shortcuts'
];
test('framework-neutral UI IDs are shared by native game and Angular',()=>{
 const native=source('index.html'),angular=source('frontend-angular/src/main.ts');
 const shell=source('src/compat/entry.mjs');
 for(const id of uiIds){
  assert.ok(native.includes('id="'+id+'"'),'native '+id);
  assert.ok(angular.includes("'"+id+"'"),'angular '+id);
  assert.ok(shell.includes('mount("'+id+'"'),'standalone '+id);
 }
});
test('React-era DOM selectors and output URL cannot regress',()=>{
 for(const name of core){
  const data=source(name);
  assert.doesNotMatch(data,/react-(?:menu|topbar|quick|shop|admin|chapter|tab|entry|lime|accent)/,
   name+' contains a retired framework-specific token');
  assert.ok(!data.includes('react-entry.js'),name+' references a retired bundle');
 }
 const native=source('index.html'),cutover=source('frontend-angular/scripts/cutover_document.mjs');
 assert.ok(native.includes('src="./js/compat-entry.js"'));
 assert.ok(cutover.includes('src="./js/compat-entry.js"'));
 assert.ok(source('scripts/build.mjs').includes('dist/js/compat-entry.js'));
 assert.equal(existsSync(new URL('../src/react/entry.jsx',import.meta.url)),false);
 const worker=readFileSync(new URL('../../../.github/workflows/lan-house-simulator.yml',import.meta.url),'utf8');
 assert.ok(worker.includes('test -s dist/js/compat-entry.js'));
 assert.ok(worker.includes('test ! -e out/site/game/js/compat-entry.js'));
 assert.ok(!worker.includes('dist/js/react-entry.js'),'Old workflow fixture must be absent');
});
test('standalone DOM bundle cannot be accidentally relabeled as React',()=>{
 const build=source('scripts/build.mjs');
 const native=source('src/compat/entry.mjs');
 assert.ok(build.includes('gameUi==="compat"'));
 assert.ok(source('website/build.mjs').includes('LHS_SITE_UI!=="compat"'));
 assert.ok(native.includes('dataset.uiFramework="compat"'));
 assert.doesNotMatch(native,/createRoot|flushSync|react-dom\/client/);
});
