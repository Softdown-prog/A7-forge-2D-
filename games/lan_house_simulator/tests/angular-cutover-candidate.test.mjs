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
   'verify_catalog_preview.mjs','verify_integrated_game.mjs',
   'integrated-qa/privacy.mjs','integrated-qa/consoleReleaseGates.mjs',
   'integrated-qa/topGamesMagazineGates.mjs',
   'integrated-qa/mobileLayoutEditor.mjs',
   'integrated-qa/accountDonation.mjs',
   'integrated-qa/stockManagement.mjs'])
  assert.ok(workflow.includes('node --check frontend-angular/scripts/'+script),
   'Missing syntax check: '+script);
 assert.ok(workflow.indexOf('Syntax check cutover') <
  workflow.indexOf('Install Playwright for real Angular browser QA'));
 assert.match(workflow,/tests\/angular-integrated-scenario-boundary\.test\.mjs/,
  'The real cutover preview must enforce the modular scenario contract');
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
 assert.ok(build.includes('angularCandidate?"out/site-angular":"out/site-legacy"'));
 assert.ok(check.includes('angularCandidate?"../out/site-angular":"../out/site-legacy"'));
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
 assert.doesNotMatch(component,/from\s+['"][^'"]*react|localStorage|fetch\(/i);
 for(const token of ['siteNavigation','menu-toggle','Escape','aria-expanded','/ajuda/'])
  assert.ok(browser.includes(token),token);
});

test('Angular timeline isolates the legacy JavaScript handler and runs Chromium on both content pages',()=>{
 const build=readFileSync(new URL('../website/build.mjs',import.meta.url),'utf8');
 const legacy=readFileSync(new URL('../website/site.mjs',import.meta.url),'utf8');
 const entry=readFileSync(new URL('../frontend-angular/src/site/main.ts',import.meta.url),'utf8');
 const component=readFileSync(new URL('../frontend-angular/src/site/site-timeline.ts',import.meta.url),'utf8');
 const browser=readFileSync(new URL('../frontend-angular/scripts/verify_full_site.mjs',import.meta.url),'utf8');
 assert.match(build,/if\(angularCandidate\)\s*\{[\s\S]*?body=body\.replaceAll/);
 for(const key of ['escape(JSON.stringify(eras))','data-angular-site-timeline'])
  assert.ok(build.includes(key),key);
 assert.ok(legacy.includes("!document.querySelector('[data-angular-site-timeline]')"));
 assert.ok(entry.includes('createComponent(SiteTimelineComponent'));
 assert.ok(entry.includes("dataset['siteTimeline']='angular'"));
 for(const value of ['ChangeDetectionStrategy.OnPush','signal(0)','data-era-list','aria-pressed'])
  assert.ok(component.includes(value),value);
 assert.doesNotMatch(component,/from\s+['"][^'"]*react|innerHTML\s*=|fetch\(/i);
 for(const marker of ["'/sobre-o-jogo/'","'2005'","'2012'","'2024'",
   "timeline.locator('#era-image')","page.keyboard.press('Enter')",
   "siteAngularTimeline:"])
  assert.ok(browser.includes(marker),'Missing real Chromium check: '+marker);
});

test('Angular candidate owns Ajuda FAQ and Chromium verifies search, keyboard, touch',()=>{
 const build=readFileSync(new URL('../website/build.mjs',import.meta.url),'utf8');
 const native=readFileSync(new URL('../website/site.mjs',import.meta.url),'utf8');
 const content=readFileSync(new URL('../website/content.mjs',import.meta.url),'utf8');
 const entry=readFileSync(new URL('../frontend-angular/src/site/main.ts',import.meta.url),'utf8');
 const component=readFileSync(new URL('../frontend-angular/src/site/site-help.ts',import.meta.url),'utf8');
 const html=readFileSync(new URL('../frontend-angular/src/site/site-help.html',import.meta.url),'utf8');
 const css=readFileSync(new URL('../website/site.css',import.meta.url),'utf8');
 const browser=readFileSync(new URL('../frontend-angular/scripts/verify_full_site.mjs',import.meta.url),'utf8');
 assert.match(content,/export const faq = \[/);
 assert.match(css,/#duvidas\[data-angular-site-help\] \.faq summary>span\{margin-inline-end:10px\}/);
 assert.ok(build.includes('if(p.path==="ajuda")body=body.replace'));
 assert.ok(build.includes('escape(JSON.stringify(faq))'));
 assert.ok(native.includes("!document.querySelector('[data-angular-site-help]')"));
 assert.ok(entry.includes('createComponent(SiteHelpComponent'));
 assert.ok(entry.includes("dataset['siteHelp']='angular'"));
 for(const marker of ['ChangeDetectionStrategy.OnPush','signal(', 'normalize(', 'templateUrl'])
  assert.ok(component.includes(marker),marker);
 for(const marker of ['help-search-results', 'help-search-clear', 'aria-controls="help-questions"',
   '@for(item of questions', '(toggle)="onToggle(index,$event)"'])
  assert.ok(html.includes(marker),marker);
 assert.doesNotMatch(component,/from\s+['"][^'"]*react|innerHTML\s*=|fetch\(/i);
 for(const marker of ["'/ajuda/'", "dataset.siteHelp==='angular'",
   "search.fill('nao ha assinatura')", "search.fill('termo-que-nao-existe-no-faq-98765')",
   "page.keyboard.press('Enter')", "clear.tap()", "siteAngularHelp:"])
  assert.ok(browser.includes(marker),'Missing real browser help QA: '+marker);
});

test('institutional header/footer are complete Angular components with live-browser checks',()=>{
 const build=readFileSync(new URL('../website/build.mjs',import.meta.url),'utf8');
 const vanilla=readFileSync(new URL('../website/site.mjs',import.meta.url),'utf8');
 const entry=readFileSync(new URL('../frontend-angular/src/site/main.ts',import.meta.url),'utf8');
 const header=readFileSync(new URL('../frontend-angular/src/site/site-header.ts',import.meta.url),'utf8');
 const headerHtml=readFileSync(new URL('../frontend-angular/src/site/site-header.html',import.meta.url),'utf8');
 const footer=readFileSync(new URL('../frontend-angular/src/site/site-footer.ts',import.meta.url),'utf8');
 const footerHtml=readFileSync(new URL('../frontend-angular/src/site/site-footer.html',import.meta.url),'utf8');
 const browser=readFileSync(new URL('../frontend-angular/scripts/verify_full_site.mjs',import.meta.url),'utf8');
 for(const term of ['data-angular-site-header','data-angular-site-footer',
  'data-edition','angularCandidate?'])assert.ok(build.includes(term),term);
 assert.match(vanilla,/!document\.querySelector\('footer\[data-angular-site-footer\]'\)/);
 assert.match(entry,/createComponent\(SiteHeaderComponent/);
 assert.match(entry,/createComponent\(SiteFooterComponent/);
 assert.match(entry,/dataset\['siteHeader'\]='angular'/);
 assert.match(entry,/dataset\['siteFooter'\]='angular'/);
 assert.match(header,/imports:\[SiteNavigationComponent\]/);
 assert.match(header,/ChangeDetectionStrategy.OnPush/);
 for(const term of ['class="brand"','id="menu-toggle"','data-angular-site-nav'])
  assert.ok(headerHtml.includes(term),term);
 for(const term of ['ChangeDetectionStrategy.OnPush','signal(false)',
  "document.body.classList.toggle('reduce-motion',value)",
  "this.preference.addEventListener('change',this.onPreference)"])
  assert.ok(footer.includes(term),term);
 for(const term of ['footer-top wrap','nav class="footer-links"','id="motion-toggle"',
  '[attr.aria-pressed]="paused()"','(click)="toggleMotion()"',
  '/privacidade/','/dados/']) assert.ok(footerHtml.includes(term),term);
 assert.doesNotMatch(header+footer+headerHtml+footerHtml,
  /from\s+['"][^'"]*react|innerHTML\s*=|fetch\(/i);
 for(const term of ['siteHeader', 'siteFooter', "page.emulateMedia({reducedMotion:'reduce'})",
  "page.emulateMedia({reducedMotion:'no-preference'})",
  'Header overflow at','Footer overflow at','siteAngularHeaderFooter:'])
  assert.ok(browser.includes(term),term);
});

test('reload is a release gate: deep links, cached assets and game restart in Chromium',()=>{
 const build=readFileSync(new URL('../website/build.mjs',import.meta.url),'utf8');
 const qa=readFileSync(new URL('../frontend-angular/scripts/verify_full_site.mjs',import.meta.url),'utf8');
 const workflow=readFileSync(new URL('../../../.github/workflows/lhs-pages-sync.yml',import.meta.url),'utf8');
 assert.match(build,/\/assets\/\*\\n  Cache-Control: no-cache, must-revalidate/);
 assert.match(build,/\/game\/js\/\*\\n  Cache-Control: no-cache, must-revalidate/);
 assert.match(build,/\/game\/__angular\/\*\\n  Cache-Control: no-cache, must-revalidate/);
 for(const marker of ['page.reload({waitUntil:',"'/ajuda/'","'/conta/'","'/jogar/'",
  "siteLogo.evaluate", "FAQ search must work after F5",
  "Canvas must draw after a full-page reload",
  "gameReload?.status()","deepLinkRefresh:true","assert.deepEqual(errors,[]"])
  assert.ok(qa.includes(marker),'Reload regression test missing '+marker);
 assert.match(workflow,/LHS_CHECK_DEFAULT_SITE=1 node frontend-angular\/scripts\/verify_full_site\.mjs/);
});
