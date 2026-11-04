import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const source=name=>readFileSync(resolve(root,'frontend-angular/src/site-rewrite',name),'utf8');

test('Jogar is a standalone Angular component with a single owner for the iframe',()=>{
 const app=source('site-app.ts'),template=source('site-app.html');
 const launcher=source('game-launcher.ts'),html=source('game-launcher.html');
 assert.match(app,/import\s*\{GameLauncherComponent\}\s*from\s*'\.\/game-launcher'/);
 assert.match(app,/imports:\[[^\]]*GameLauncherComponent/);
 assert.match(template,/@case\('\/jogar\/'\)\s*\{[\s\S]*?<lhs-game-launcher><\/lhs-game-launcher>/);
 assert.doesNotMatch(template,/id="game-frame"|id="launch-game"|gameOpen\(\)|startGame\(\)/);
 assert.doesNotMatch(app,/gameOpen|startGame\(/);
 assert.match(launcher,/selector:'lhs-game-launcher'/);
 assert.match(launcher,/ChangeDetectionStrategy\.OnPush/);
 assert.match(launcher,/readonly open=signal\(false\)/);
 assert.match(launcher,/launch\(\):void\{/);
 assert.match(launcher,/this\.state\.set\('loading'\);this\.open\.set\(true\)/);
 assert.match(launcher,/clearTimeout\(this\.timeout\)/);
 assert.doesNotMatch(launcher,/styles:\s*\[/,'Launcher must respect the deployed CSP');
 assert.match(html,/\(load\)="loaded\(frame\)"/);
 assert.match(html,/id="game-status" role="status"/);
 assert.match(html,/id="fullscreen"/);
 assert.match(html,/@if\(open\(\)\)/);
 assert.match(html,/<iframe id="game-frame" src="\/game\/"[^>]*><\/iframe>/);
 assert.match(html,/<button[^>]+id="launch-game"[^>]+\(click\)="launch\(\)"/);
 assert.equal((html.match(/<iframe\b/g)||[]).length,1);
 assert.equal((html.match(/id="launch-game"/g)||[]).length,1);
 assert.match(html,/target="_blank" rel="noopener"/);
});

test('Jogar uses original preview asset and only mounts the Canvas on demand',()=>{
 const template=source('game-launcher.html');
 assert.match(template,/@else\s*\{/);
 assert.match(template,/src="\/assets\/sala\.webp"/);
 assert.ok(template.indexOf('@if(open())')<template.indexOf('<iframe'));
 assert.ok(template.indexOf('@else')<template.indexOf('id="launch-game"'));
 assert.doesNotMatch(source('game-launcher.ts'),/localStorage|fetch\(|import\(/);
});
