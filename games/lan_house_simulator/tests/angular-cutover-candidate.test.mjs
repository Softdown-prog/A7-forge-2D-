import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createAngularCutoverDocument,ANGULAR_CUTOVER_HOSTS} from
 '../frontend-angular/scripts/cutover_document.mjs';
const game=readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('Angular candidate replaces React with all thirteen unique hosts',()=>{
 const candidate=createAngularCutoverDocument(game);
 assert.equal(ANGULAR_CUTOVER_HOSTS.length,13);
 assert.ok(game.includes('./js/react-entry.js'));
 assert.ok(!candidate.includes('./js/react-entry.js'));
 assert.match(candidate,/src="\.\/__angular\/main\.js"/);
 assert.match(candidate,/href="\.\/__angular\/styles\.css"/);
 for(const id of ANGULAR_CUTOVER_HOSTS)
  assert.equal(candidate.split('id="'+id+'"').length,2,id);
 for(const id of ['game','react-menu-actions','react-menu-tour',
  'react-topbar-actions','react-quick-deck','react-shop-categories',
  'react-shop-search','react-admin-shortcuts','angular-computer-workspace',
  'angular-service-workspace','angular-admin-area-navigation'])
  assert.equal(candidate.split('id="'+id+'"').length,2,id);
 for(const id of ['shop-cash','organize-furniture','demolish-walls',
  'save-export','save-import-file','option-sound','notices','calendar-hud'])
  assert.ok(!candidate.includes('id="'+id+'"'),id+' should be owned by Angular runtime');
 assert.equal(createAngularCutoverDocument(game),candidate);
});
test('cutover fails closed on missing anchors or duplicate ids',()=>{
 assert.throws(()=>createAngularCutoverDocument(game.replace(
  '<script type="module" src="./js/react-entry.js"></script>','')),
  /One original anchor required/);
 assert.throws(()=>createAngularCutoverDocument(game.replace(
  '<h3>Investimento e finanças</h3>','<h3>Outra seção</h3>')),
  /Expected exactly one HTML anchor/);
 assert.throws(()=>createAngularCutoverDocument(game.replace(
  '<div id="merchandise-catalog"></div>','')),
  /One original anchor required/);
});
test('real-game Chromium tests use exactly the same cutover document',()=>{
 const browser=readFileSync(new URL('../frontend-angular/scripts/verify_integrated_game.mjs',import.meta.url),'utf8');
 assert.match(browser,/createAngularCutoverDocument\(original\)/);
 assert.doesNotMatch(browser,/const additionalAdminCutoverShell/);
});
