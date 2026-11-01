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
 assert.ok(candidate.includes('#shop-catalog{display:none!important}'),
  'Legacy purchase port remains in DOM but cannot be focused or displayed');
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
test('complete site defaults to Angular in migration branch and allows explicit React regression',()=>{
 const build=readFileSync(new URL('../website/build.mjs',import.meta.url),'utf8');
 const check=readFileSync(new URL('../website/check.mjs',import.meta.url),'utf8');
 const wrapper=readFileSync(new URL('../scripts/build_angular_site_candidate.mjs',import.meta.url),'utf8');
 const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
 assert.ok(build.includes('process.env.LHS_SITE_ANGULAR_CANDIDATE'));
 assert.ok(build.includes('process.env.LHS_SITE_UI!=="react"'));
 assert.match(build,/frontend-angular\/scripts\/build_cutover_candidate\.mjs/);
 assert.match(check,/React não pode inicializar no site Angular/);
 assert.ok(build.includes('angularCandidate?"out/site-angular":"out/site"'));
 assert.ok(check.includes('angularCandidate?"../out/site-angular":"../out/site"'));
 assert.match(build,/game\/__angular/);
 assert.match(build,/build_cutover_candidate\.mjs/);
 assert.match(build,/__angular\/styles\.css/);
 assert.match(wrapper,/LHS_SITE_ANGULAR_CANDIDATE:'1'/);
 assert.equal(pkg.scripts['build:site:angular:candidate'],
  'node scripts/build_angular_site_candidate.mjs');
});
test('the complete Angular site is exercised through the real CSP-protected iframe',()=>{
 const workflow=readFileSync(new URL('../../../.github/workflows/lhs-angular-ui-preview.yml',import.meta.url),'utf8');
 const browser=readFileSync(new URL('../frontend-angular/scripts/verify_full_site.mjs',import.meta.url),'utf8');
 const builder=readFileSync(new URL('../website/build.mjs',import.meta.url),'utf8');
 assert.match(workflow,/node --check frontend-angular\/scripts\/verify_full_site\.mjs/);
 assert.match(workflow,/node frontend-angular\/scripts\/verify_full_site\.mjs/);
 assert.match(workflow,/lhs-angular-full-site-qa/);
 assert.ok(workflow.indexOf('Build and verify the complete Angular site candidate')<
  workflow.indexOf('Validate full-site Angular iframe'));
 for(const token of ['#launch-game','#game-frame','/jogar/','dataset.uiFramework',
  'Content-Security-Policy','react-entry.js','[1280,414,360]'])
  assert.ok(browser.includes(token),'Browser must verify '+token);
 assert.ok(builder.includes('game/angular-candidate-report.json'),
  'Do not ship internal CI report in a candidate site');
});
test('published site preview checks the Angular cards and versioned Canvas renderer',()=>{
 const script=readFileSync(new URL('../scripts/verify_live_site_preview.mjs',import.meta.url),'utf8');
 assert.match(script,/el\.dataset\.uiFramework==="angular"/);
 assert.match(script,/angular-shop-catalog/);
 assert.match(script,/__angular\/main\.js/);
 assert.match(script,/js\/render\/actorSprites\.js/);
 const full=readFileSync(new URL('../frontend-angular/scripts/verify_full_site.mjs',import.meta.url),'utf8');
 assert.match(full,/LHS_CHECK_DEFAULT_SITE/);
});
test('the standard site build and CSP browser smoke are mandatory on the migration branch',()=>{
 const workflow=readFileSync(new URL('../../../.github/workflows/lhs-angular-ui-preview.yml',import.meta.url),'utf8');
 assert.match(workflow,/Validate default Angular site build and real public output/);
 assert.match(workflow,/npm run build:site/);
 assert.match(workflow,/npm run check:site/);
 assert.match(workflow,/LHS_CHECK_DEFAULT_SITE=1 node frontend-angular\/scripts\/verify_full_site\.mjs/);
 assert.match(workflow,/lhs-angular-default-site-qa/);
});
test('real-game Chromium tests use exactly the same cutover document',()=>{
 const browser=readFileSync(new URL('../frontend-angular/scripts/verify_integrated_game.mjs',import.meta.url),'utf8');
 assert.match(browser,/createAngularCutoverDocument\(original\)/);
 assert.doesNotMatch(browser,/const additionalAdminCutoverShell/);
});

test('the integrated browser test enforces Escape modal precedence',()=>{
 const qa=readFileSync(new URL('../frontend-angular/scripts/verify_integrated_game.mjs',import.meta.url),'utf8');
 assert.match(qa,/Escape closes the mail dialog without leaving the game/);
 assert.match(qa,/Escape must not reopen the main menu while a dialog owns focus/);
 const bindings=readFileSync(new URL('../src/ui/runtimeInteractionBindings.ts',import.meta.url),'utf8');
 assert.match(bindings,/\["admin","shop","notices"\]/);
});
test('Angular passes the same 12-hex cache revision to native Canvas imports',()=>{
 const entry=readFileSync(new URL('../frontend-angular/src/main.ts',import.meta.url),'utf8');
 const browser=readFileSync(new URL('../frontend-angular/scripts/verify_full_site.mjs',import.meta.url),'utf8');
 const legacy=readFileSync(new URL('../scripts/verify_live_site_preview.mjs',import.meta.url),'utf8');
 assert.match(entry,/uiEntry\?new URL\(uiEntry\.src\)\.searchParams\.get\('v'\)/);
 assert.match(entry,/gameUrl\.searchParams\.set\('v',revision\)/);
 assert.match(browser,/Unversioned native game module/);
 assert.match(legacy,/dataset\.gameReady==="true"/);
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

test('production Angular site does not compile throwaway React JS',()=>{
 const standalone=readFileSync(new URL('../scripts/build.mjs',import.meta.url),'utf8');
 const site=readFileSync(new URL('../website/build.mjs',import.meta.url),'utf8');
 const checker=readFileSync(new URL('../website/check.mjs',import.meta.url),'utf8');
 // The native Canvas is compiled in both modes; only React is optional.
 assert.match(standalone,/typescript\/bin\/tsc/);
 assert.match(standalone,/const gameUi=process\.env\.LHS_GAME_UI\?\?"react"/);
 assert.match(standalone,/if\(gameUi==="react"\)/);
 assert.match(standalone,/await import\("esbuild"\)/);
 assert.match(site,/LHS_GAME_UI:angularSite\?"angular":"react"/);
 assert.match(site,/process\.env\.LHS_SITE_UI!=="react"/);
 // The candidate never needs the React artifact; the standalone /dist
 // build can still generate it and the explicit React site remains available.
 assert.match(checker,/!existsSync\(resolve\(root,"game\/js\/react-entry\.js"\)\)/);
 assert.ok(checker.includes('else assert.match(gameHtml,/src='),
  'The explicit legacy React site still has its own check');
 assert.ok(checker.includes('react-entry.js'));
});

test('Cloudflare publication blocks on real Angular browser behavior',()=>{
 const workflow=readFileSync(new URL('../../../.github/workflows/lhs-pages-sync.yml',import.meta.url),'utf8');
 const browser=readFileSync(new URL('../frontend-angular/scripts/verify_full_site.mjs',import.meta.url),'utf8');
 assert.match(workflow,/LHS_CHECK_DEFAULT_SITE=1 node frontend-angular\/scripts\/verify_full_site\.mjs/);
 const preflight=workflow.indexOf('Conferir abertura real antes de publicar');
 const guard=workflow.indexOf('LHS_CHECK_DEFAULT_SITE=1 node frontend-angular/scripts/verify_full_site.mjs');
 const publish=workflow.indexOf('Sincronizar somente o LHS e publicar');
 assert.ok(preflight>=0&&guard>preflight&&publish>guard,
  'Angular browser QA must finish before the Pages mirror is updated');
 assert.match(browser,/\[1280,414,360\]/);
 for(const check of ['page.on(\'response\'','page.on(\'requestfailed\'',
  'angular-pc-health','page.on(\'pageerror\'',
  'Content Security Policy','close-admin','data-angular-task="hardware"']){
  assert.ok(browser.includes(check),'Missing browser release check: '+check);
 }
});

test('the new institutional site Angular navigation is isolated and browser-tested',()=>{
 const angular=JSON.parse(readFileSync(new URL('../frontend-angular/angular.json',import.meta.url),'utf8'));
 const pkg=JSON.parse(readFileSync(new URL('../frontend-angular/package.json',import.meta.url),'utf8'));
 const site=readFileSync(new URL('../website/build.mjs',import.meta.url),'utf8');
 const native=readFileSync(new URL('../website/site.mjs',import.meta.url),'utf8');
 const component=readFileSync(new URL('../frontend-angular/src/site/site-navigation.ts',import.meta.url),'utf8');
 const browser=readFileSync(new URL('../frontend-angular/scripts/verify_full_site.mjs',import.meta.url),'utf8');
 assert.ok(angular.projects['site-shell']);
 assert.match(pkg.scripts['build:site-shell'],/ng build site-shell/);
 assert.match(site,/if\(angularCandidate\)/);
 assert.match(site,/data-angular-site-nav/);
 assert.match(site,/site-angular\/main\.js/);
 assert.match(native,/!menu\.hasAttribute\("data-angular-site-nav"\)/);
 for(const token of ['createApplication','createComponent','changeDetectorRef.detectChanges'])
  assert.ok(readFileSync(new URL('../frontend-angular/src/site/main.ts',import.meta.url),'utf8').includes(token));
 assert.match(component,/ChangeDetectionStrategy\.OnPush/);
 assert.match(component,/signal\(false\)/);
 assert.doesNotMatch(component,/react|React|localStorage|fetch\(/);
 for(const token of ['siteNavigation','menu-toggle','Escape','aria-expanded','/ajuda/'])
  assert.ok(browser.includes(token),token);
});
