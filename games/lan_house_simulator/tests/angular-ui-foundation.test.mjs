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
  assert.match(entry,/dataset\.uiFramework='angular'/);
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
