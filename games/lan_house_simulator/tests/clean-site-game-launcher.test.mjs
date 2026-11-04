import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const source=name=>readFileSync(resolve(root,'frontend-angular/src/site-rewrite',name),'utf8');

test('compatibility Jogar page offers a normal same-tab link to the original full-page game',()=>{
 const app=source('site-app.ts'),template=source('site-app.html');
 const launcher=source('game-launcher.ts'),html=source('game-launcher.html');
 assert.match(app,/import\s*\{GameLauncherComponent\}\s*from\s*'\.\/game-launcher'/);
 assert.match(template,/@case\('\/jogar\/'\)\s*\{[\s\S]*?<lhs-game-launcher><\/lhs-game-launcher>/);
 assert.match(launcher,/selector:'lhs-game-launcher'/);
 assert.match(launcher,/ChangeDetectionStrategy\.OnPush/);
 assert.match(html,/<a id="launch-game" class="button" href="\/game\/">/);
 assert.equal((html.match(/id="launch-game"/g)||[]).length,1);
 assert.match(html,/id="game-status" role="status"/);
 assert.match(html,/src="\/assets\/sala\.webp"/);
 assert.doesNotMatch(launcher+html,/<iframe|target=|window\.open|location\.|requestFullscreen|localStorage|fetch\(|import\(/);
});

test('every public Play entry targets the same-origin game and its return link targets home',()=>{
 assert.ok(source('site-data.ts').includes("{href:'/game/',label:'Jogar'}"));
 for(const name of ['site-app.html','about-game.html','about-us.html','home-details.html','account.html','help-search.html']){
  const html=source(name);
  assert.match(html,/href="\/game\/"/,name);
  assert.doesNotMatch(html,/href="\/jogar\/"|<iframe/,name);
 }
 const packager=readFileSync(resolve(root,'scripts/version_angular_game.mjs'),'utf8');
 assert.match(packager,/class="edition-label game-site-return" href="\/"/);
 assert.doesNotMatch(packager,/target="_blank"|target="_top"/);
});
