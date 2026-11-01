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
test('CI must reject malformed browser scripts before installing browsers',()=>{
 const workflow=readFileSync(new URL('../../../.github/workflows/lhs-angular-ui-preview.yml',import.meta.url),'utf8');
 for(const script of ['cutover_document.mjs','build_cutover_candidate.mjs',
   'verify_catalog_preview.mjs','verify_integrated_game.mjs'])
  assert.ok(workflow.includes('node --check frontend-angular/scripts/'+script),
   'Missing syntax check: '+script);
 assert.ok(workflow.indexOf('Syntax check cutover') <
  workflow.indexOf('Install Playwright for real Angular browser QA'));
});
test('shop-overview integrated check matches the real TypeScript cash read model',()=>{
 const native=readFileSync(new URL('../src/application/shopOverviewPort.ts',import.meta.url),'utf8');
 const qa=readFileSync(new URL('../frontend-angular/scripts/verify_integrated_game.mjs',import.meta.url),'utf8');
 assert.ok(native.includes('Caixa R$ '),'Native cash header prefix changed');
 assert.ok(native.includes(' · PCs '),'Native summary field changed');
 assert.match(qa,/label\.startsWith\('Caixa R\$ '\)/);
 assert.match(qa,/label\.includes\(' · PCs '\)/);
});
test('Angular site candidate shares site rules and keeps the default React output',()=>{
 const build=readFileSync(new URL('../website/build.mjs',import.meta.url),'utf8');
 const check=readFileSync(new URL('../website/check.mjs',import.meta.url),'utf8');
 const wrapper=readFileSync(new URL('../scripts/build_angular_site_candidate.mjs',import.meta.url),'utf8');
 const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
 assert.ok(build.includes('process.env.LHS_SITE_ANGULAR_CANDIDATE'));
 assert.ok(build.includes('angularCandidate?"out/site-angular":"out/site"'));
 assert.ok(check.includes('angularCandidate?"../out/site-angular":"../out/site"'));
 assert.match(build,/game\/__angular/);
 assert.match(build,/build_cutover_candidate\.mjs/);
 assert.match(build,/__angular\/styles\.css/);
 assert.match(wrapper,/LHS_SITE_ANGULAR_CANDIDATE:'1'/);
 assert.equal(pkg.scripts['build:site:angular:candidate'],
  'node scripts/build_angular_site_candidate.mjs');
});
test('real-game Chromium tests use exactly the same cutover document',()=>{
 const browser=readFileSync(new URL('../frontend-angular/scripts/verify_integrated_game.mjs',import.meta.url),'utf8');
 assert.match(browser,/createAngularCutoverDocument\(original\)/);
 assert.doesNotMatch(browser,/const additionalAdminCutoverShell/);
});

test('CI browser checks boot the actual static candidate on desktop and mobile',()=>{
 const workflow=readFileSync(new URL('../../../.github/workflows/lhs-angular-ui-preview.yml',import.meta.url),'utf8');
 const smoke=readFileSync(new URL('../frontend-angular/scripts/verify_static_candidate.mjs',import.meta.url),'utf8');
 assert.match(workflow,/node --check frontend-angular\/scripts\/verify_static_candidate\.mjs/);
 assert.match(workflow,/node frontend-angular\/scripts\/verify_static_candidate\.mjs/);
 assert.match(workflow,/lhs-angular-cutover-smoke/);
 assert.ok(workflow.indexOf('Assemble isolated static Angular cutover candidate') <
  workflow.indexOf('Smoke test the compiled Angular candidate'));
 for(const token of [
  "out/angular-cutover-candidate","dataset.gameReady","dataset.uiFramework",
  "No React bootstrap survives the candidate","'#game'","[1280,414]"
 ])assert.ok(smoke.includes(token),'Missing candidate browser check '+token);
});
