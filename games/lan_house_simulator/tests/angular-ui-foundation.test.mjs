import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const file=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const root='frontend-angular/';

test('All six TypeScript/Angular strictness guards are enabled in the isolated Angular workspace',()=>{
  const config=JSON.parse(file(root+'tsconfig.json'));
  const app=JSON.parse(file(root+'tsconfig.app.json'));
  for(const name of ["strict","noImplicitOverride","noUncheckedIndexedAccess","exactOptionalPropertyTypes"])
    assert.equal(config.compilerOptions[name],true,'compilerOptions.'+name);
  for(const name of ["strictTemplates","strictInjectionParameters"])
    assert.equal(config.angularCompilerOptions[name],true,'angularCompilerOptions.'+name);
  assert.equal(app.extends,'./tsconfig.json');
});

test('Angular 22 uses a separate TypeScript 6 toolchain; TypeScript 7 game stays unchanged',()=>{
  const ui=JSON.parse(file(root+'package.json'));
  const game=JSON.parse(file('package.json'));
  assert.match(ui.dependencies['@angular/core'],/^~22\./);
  assert.equal(ui.devDependencies.typescript,'6.0.2');
  assert.equal(game.devDependencies.typescript,'7.0.2');
  assert.equal(game.dependencies.react,'19.2.4'); // Unpublished Angular preview must not break production.
  assert.ok(existsSync(new URL('../'+root+'angular.json',import.meta.url)));
});

test('Angular owns existing menu/header/shop islands without reimplementing the game',()=>{
  const entry=file(root+'src/main.ts');
  const components=file(root+'src/components.ts');
  assert.match(entry,/createApplication\(\)/);
  assert.match(entry,/createComponent\(/);
  assert.match(entry,/dataset\['uiFramework'\]='angular'/);
  assert.match(entry,/js\/main\.js/);
  assert.doesNotMatch(components,/from ['"][^'"]*(?:\/sim\/|\/application\/|\/render\/|\/bootstrap\/)/);
  assert.doesNotMatch(components,/requestAnimationFrame|createGame|localStorage|purchase\(/);
  for(const id of [
    'react-menu-actions','react-menu-tour','react-topbar-actions',
    'react-quick-deck','react-shop-categories','react-shop-search','react-admin-shortcuts'
  ])assert.ok(entry.includes(id),id);
  for(const id of ['menu-new','menu-continue','menu-account','menu-options'])
    assert.ok(file(root+'src/templates/menu-actions.html').includes('id="'+id+'"'),id);
  for(const id of ['open-account','open-menu','open-shop','open-notices','open-admin','notices-count'])
    assert.ok(file(root+'src/templates/header-actions.html').includes('id="'+id+'"'),id);
  assert.match(file(root+'src/templates/shop-categories.html'),/data-shop-category/);
  assert.match(file(root+'src/navigation.ts'),/data-admin-tab/);
  assert.match(file(root+'src/navigation.ts'),/data-panel-choice/);
  assert.match(file(root+'src/components.ts'),/lhs:shop-catalog-updated/);
});

test('Angular preview cannot accidentally replace the current React runtime',()=>{
  assert.match(file('index.html'),/src="\.\/js\/react-entry\.js"/);
  assert.match(file('scripts/build.mjs'),/src\/react\/entry\.jsx/);
  assert.match(file('src/bootstrap/bootstrapGame.ts'),/dataset\.gameReady="true"/);
});

test('Angular menu settings and save transfer preserve native TypeScript contracts',()=>{
  const entry=file(root+'src/main.ts');
  const components=file(root+'src/menu-save-controls.ts');
  const preferences=file(root+'src/templates/menu-preferences.html');
  const transfer=file(root+'src/templates/save-transfer.html');
  const legacy=file('index.html');
  const menuPort=file('src/ui/gameMenuControls.ts');
  const savePort=file('src/ui/saveFileControls.ts');
  for(const id of ['menu-settings','option-sound']){
    assert.match(preferences,new RegExp('id="'+id+'"'));
    assert.match(legacy,new RegExp('id="'+id+'"'));
  }
  for(const id of ['save-export','save-import','save-import-file','save-message']){
    assert.match(transfer,new RegExp('id="'+id+'"'));
    assert.match(legacy,new RegExp('id="'+id+'"'));
  }
  assert.match(entry,/angular-save-transfer/);
  assert.match(entry,/angular-menu-preferences/);
  assert.match(file(root+'src/index.html'),/id="angular-save-transfer"/);
  assert.match(file(root+'src/index.html'),/id="angular-menu-preferences"/);
  assert.match(menuPort,/roots.soundToggle.addEventListener\("change"/);
  assert.match(menuPort,/roots.settingsPanel.hidden/);
  assert.match(savePort,/importFile.addEventListener\("change"/);
  assert.match(savePort,/exportButton.addEventListener\("click"/);
  assert.match(savePort,/importFile.click\(\)/);
  assert.match(transfer,/type="file"/);
  assert.match(transfer,/application\/json/);
  assert.match(transfer,/aria-live="polite"/);
  assert.doesNotMatch(components,/localStorage|new Blob|FileReader|importText|exportSnapshot|setSound/);
  assert.doesNotMatch(components,/from ['"][^'"]*\/(?:sim|render|application|bootstrap)\//);
  // Old game index must not mount Angular's duplicate control IDs yet.
  assert.doesNotMatch(legacy,/id="angular-(?:save-transfer|menu-preferences)"/);
});

test('Angular HUD uses read-only time/weather snapshots and preserves native DOM hooks',()=>{
 const component=file(root+'src/calendar-mail.ts');
 const hud=file(root+'src/templates/time-weather.html');
 const adapter=file('src/ui/timeWeatherPanel.ts');
 const preview=file(root+'src/index.html');
 const legacy=file('index.html');
 for(const id of ['time-weather-panel','calendar-hud','weather-hud','time-weather-date',
  'time-weather-day','time-weather-hour','time-weather-condition','time-weather-effect','time-weather-outlook']){
  assert.ok(hud.includes('id="'+id+'"'),id);
  assert.ok(legacy.includes('id="'+id+'"'),id+' legacy');
 }
 assert.match(component,/lhs:time-weather-updated/);
 assert.match(adapter,/publishedSnapshots/);
 assert.match(adapter,/lhs:time-weather-updated/);
 assert.match(preview,/id="angular-time-weather"/);
 assert.doesNotMatch(legacy,/id="angular-time-weather"/);
 assert.doesNotMatch(component,/innerHTML|localStorage|requestAnimationFrame/);
});
test('Angular mail preserves native notice actions and TypeScript port ownership',()=>{
 const component=file(root+'src/calendar-mail.ts');
 const inbox=file(root+'src/templates/notice-inbox.html');
 const presenter=file('src/ui/noticeWindowRefresh.ts');
 const controller=file('src/ui/noticeControls.ts');
 const legacy=file('index.html');
 for(const id of ['notices','notices-title','close-notices','notices-list']){
  assert.ok(inbox.includes('id="'+id+'"'));
  assert.ok(legacy.includes('id="'+id+'"'));
 }
 for(const attr of ['data-notice-read','data-notice-action','data-decision','data-choice'])
  assert.ok(inbox.includes(attr),attr);
 assert.match(inbox,/data-angular-owned="true"/);
 assert.match(inbox,/aria-live="polite"/);
 assert.match(inbox,/aria-modal="true"/);
 assert.match(presenter,/lhs:notice-status-updated/);
 assert.match(presenter,/lhs:notice-inbox-updated/);
 assert.match(presenter,/angularOwned/);
 assert.match(controller,/root\?\.addEventListener\("click"/);
 assert.match(component,/lhs:notice-inbox-updated/);
 assert.match(file(root+'src/main.ts'),/NoticeInboxComponent/);
 assert.doesNotMatch(component,/localStorage|port\.choose|markRead\(|GameState|requestAnimationFrame/);
 assert.doesNotMatch(inbox,/\(click\)=/);
 assert.doesNotMatch(legacy,/id="angular-notice-inbox"/);
});


test('Shop header Angular projection preserves cash, organize and demolition commands',()=>{
 const component=file(root+'src/shop-overview.ts');
 const template=file(root+'src/templates/shop-overview.html');
 const entry=file(root+'src/main.ts');
 const preview=file(root+'src/index.html');
 const adapter=file('src/ui/shopOverviewPanel.ts');
 const shopPanels=file('src/ui/shopPanels.ts');
 const snapshot=file('src/application/shopOverviewPort.ts');
 const legacy=file('index.html');
 for(const id of ['shop-cash','organize-furniture','demolish-walls']){
  assert.match(template,new RegExp('id="'+id+'"'));
  assert.match(legacy,new RegExp('id="'+id+'"'));
 }
 for(const field of ['organizeText','demolishText','demolishDisabled','cashText']){
  assert.ok(component.includes(field),field);
  assert.ok(snapshot.includes(field),field);
 }
 assert.match(component,/lhs:shop-overview-updated/);
 assert.match(adapter,/lhs:shop-overview-updated/);
 assert.match(adapter,/published\.get\(doc\)/);
 assert.match(adapter,/getElementById\("angular-shop-overview"\)/);
 assert.match(shopPanels,/!shop\.querySelector\('#angular-shop-overview'\)/);
 assert.match(template,/class="shop-guide"/);
 assert.match(template,/class="shop-organize-help"/);
 assert.match(template,/view\(\)\.demolishDisabled/);
 assert.match(entry,/ShopOverviewComponent/);
 assert.match(preview,/id="angular-shop-overview"/);
 assert.doesNotMatch(legacy,/id="angular-shop-overview"/);
 assert.doesNotMatch(component,/requestAnimationFrame|localStorage|createGame|purchase\(/);
 assert.doesNotMatch(component,/from ['"][^'"]*\/(?:sim|render|application|bootstrap)\//);
 assert.doesNotMatch(template,/\(click\)=/);
});

test('Angular strict compiler flags and ESLint enforce the requested quality gates',()=>{
  const cfg=JSON.parse(file(root+'tsconfig.json'));
  for(const flag of ['noUnusedLocals','noUnusedParameters','noImplicitReturns',
    'noFallthroughCasesInSwitch','noPropertyAccessFromIndexSignature']){
    assert.equal(cfg.compilerOptions[flag],true,'compilerOptions.'+flag);
  }
  const eslint=file(root+'eslint.config.mjs');
  const pkg=JSON.parse(file(root+'package.json'));
  const workflow=readFileSync(new URL('../../../.github/workflows/lhs-angular-ui-preview.yml',import.meta.url),'utf8');
  for(const rule of ['@typescript-eslint/no-explicit-any','@typescript-eslint/no-unused-vars',
    '@typescript-eslint/explicit-function-return-type','no-console']){
    assert.ok(eslint.includes(rule),rule);
  }
  assert.match(eslint,/no-explicit-any': 'error'/);
  assert.match(eslint,/no-unused-vars': 'error'/);
  assert.match(eslint,/explicit-function-return-type': 'warn'/);
  assert.match(eslint,/allow: \['warn', 'error'\]/);
  assert.equal(pkg.scripts.lint,'eslint src --ext .ts');
  assert.ok(pkg.devDependencies.eslint);
  assert.ok(pkg.devDependencies['typescript-eslint']);
  assert.match(workflow,/npm run lint --prefix frontend-angular/);
});

test('Angular workspace lockfile is complete and CI installs with npm ci',()=>{
  const pkg=JSON.parse(file(root+'package.json'));
  const lock=JSON.parse(file(root+'package-lock.json'));
  const workflow=readFileSync(new URL('../../../.github/workflows/lhs-angular-ui-preview.yml',import.meta.url),'utf8');
  assert.equal(lock.lockfileVersion,3);
  assert.equal(lock.name,pkg.name);
  assert.deepEqual(lock.packages[''].dependencies,pkg.dependencies);
  assert.deepEqual(lock.packages[''].devDependencies,pkg.devDependencies);
  for(const mod of ['node_modules/@angular/core','node_modules/@angular/cli',
    'node_modules/typescript','node_modules/eslint','node_modules/typescript-eslint']){
    assert.ok(lock.packages[mod]?.version,mod);
    assert.ok(lock.packages[mod]?.integrity || mod==='node_modules/typescript',mod+' integrity');
  }
  assert.match(workflow,/npm ci --prefix frontend-angular --no-audit --no-fund/);
  assert.match(workflow,/cache-dependency-path: games\/lan_house_simulator\/frontend-angular\/package-lock.json/);
  assert.doesNotMatch(workflow,/npm install --prefix frontend-angular/);
  assert.doesNotMatch(workflow,/LHS_RESOLVED_LOCK/);
});


test('Angular catalog displays only read-only regular shop offers and preserves native purchase commands',()=>{
 const presenter=file('src/ui/shopCatalogAngularProjection.ts');
 const renderer=file('src/ui/shopCatalogRenderer.ts');
 const component=file(root+'src/shop-catalog.ts');
 const template=file(root+'src/templates/shop-catalog.html');
 const preview=file(root+'src/index.html');
 const legacy=file('index.html');
 for(const field of ['disabled','buttonText','buttonTitle','placementHint','ownedText','artworkSrc']){
  assert.ok(presenter.includes(field),field);
  assert.ok(component.includes(field),field);
 }
 assert.match(presenter,/shopCardIcon/);
 assert.match(presenter,/lhs:shop-cards-updated/);
 assert.match(renderer,/regularShopCardView\(item,offer,serviceOffer,artworkSrc\)/);
 assert.match(renderer,/if\(item\.id!=="ps1"\)/);
 assert.match(renderer,/publishAngularShopCatalog/);
 assert.match(component,/document\.addEventListener\('lhs:shop-cards-updated'/);
 assert.match(component,/target\?\.click\(\)/);
 assert.match(template,/\[disabled\]="card\.disabled"/);
 assert.match(template,/\[attr\.data-buy\]="card\.id"/);
 assert.match(template,/track card\.id/);
 assert.match(template,/card\.artworkSrc/);
 assert.match(template,/\(click\)="purchase\(card\.id\)"/);
 assert.match(template,/consolesPending/);
 assert.match(preview,/id="angular-shop-catalog"/);
 assert.doesNotMatch(legacy,/id="angular-shop-catalog"/);
 assert.doesNotMatch(component,/from ['"][^'"]*\/(?:sim|application|render|bootstrap)\//);
 assert.doesNotMatch(component,/port\.purchase|new Game|localStorage|fetch\(/);
 assert.match(file(root+'src/main.ts'),/ShopCatalogComponent/);
});

test('Angular PS1 PS2 console shop preserves purchase handlers and readonly projections',()=>{
 const projection=file('src/ui/shopConsoleAngularProjection.ts');
 const renderer=file('src/ui/shopCatalogRenderer.ts');
 const component=file(root+'src/shop-catalog.ts');
 const template=file(root+'src/templates/shop-catalog.html');
 assert.match(projection,/projectPs1Disc/);
 assert.match(projection,/projectPs2Game/);
 assert.match(projection,/publishAngularConsoleShop/);
 assert.match(renderer,/projectConsoleShop/);
 assert.match(renderer,/publishAngularConsoleShop/);
 assert.match(component,/lhs:shop-consoles-updated/);
 assert.match(component,/buyPs1Disc/);
 assert.match(component,/buyPs2Game/);
 assert.match(component,/selectPs1/);
 assert.match(component,/selectPs2/);
 assert.match(template,/angular-ps1-placement/);
 assert.match(template,/angular-ps2-placement/);
 assert.match(template,/consoleShop\.ps1\.offerDisabled/);
 assert.match(template,/consoleShop\.ps2\.benchDisabled/);
 assert.doesNotMatch(component,/from ['"][^'"]*\/(?:sim|application|render|bootstrap)\//);
 assert.doesNotMatch(projection,/from ["']\.\.\/sim\//);
});

test('Legacy DOM-only catalog fixture can render without browser event APIs',()=>{
 const renderer=file('src/ui/shopCatalogRenderer.ts');
 assert.match(renderer,/typeof options\.doc\.getElementById==="function"/);
 assert.match(renderer,/typeof options\.host\.dispatchEvent==="function"/);
});

test('Admin area adapter does not assume an ownerDocument in lightweight DOM fixtures',()=>{
 const source=file('src/ui/adminAreaTabs.ts');
 assert.match(source,/if\(doc&&typeof doc\.dispatchEvent==="function"&&typeof CustomEvent==="function"\)/);
});
test('Console purchase forwarding uses actual DOM dataset camelCase keys',()=>{
 const source=file(root+'src/shop-catalog.ts');
 assert.match(source,/node\.dataset\[attribute\]===id/);
 assert.match(source,/this\.forward\('buyPs1Disc',id\)/);
 assert.match(source,/this\.forward\('buyPs2Game',id\)/);
 assert.doesNotMatch(source,/this\.forward\('data-buy-/);
});
