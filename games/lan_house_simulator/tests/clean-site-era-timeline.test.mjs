import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const folder=resolve(import.meta.dirname,'../frontend-angular/src/site-rewrite');
const read=name=>readFileSync(resolve(folder,name),'utf8');

test('timeline has a single standalone Angular owner and only appears on the correct routes',()=>{
 const app=read('site-app.ts'),page=read('site-app.html');
 const owner=read('era-timeline.ts'),view=read('era-timeline.html');
 assert.match(app,/import \{EraTimelineComponent\} from '\.\/era-timeline'/);
 assert.match(app,/imports:\[[^\]]*EraTimelineComponent/);
 assert.match(page,/@if\(path==='\/'\|\|path==='\/sobre-o-jogo\/'\)\{\s*<lhs-era-timeline><\/lhs-era-timeline>/);
 assert.equal((page.match(/<lhs-era-timeline>/g)||[]).length,1);
 assert.doesNotMatch(page,/id="evolucao"|selectedEra\(\)|selectEra\(i\)/);
 assert.doesNotMatch(app,/readonly eras|readonly era=signal|selectedEra|selectEra\(/);
 assert.match(owner,/selector:'lhs-era-timeline'/);
 assert.match(owner,/ChangeDetectionStrategy\.OnPush/);
 assert.match(owner,/readonly era=signal\(0\)/);
 assert.match(owner,/readonly selectedEra=computed\(/);
 assert.match(view,/id="evolucao" aria-label="Evolução dos computadores"/);
 assert.equal((view.match(/id="evolucao"/g)||[]).length,1);
 assert.match(view,/@for\(item of eras;track item\.year;let i=\$index\)/);
 assert.match(view,/\[attr\.aria-pressed\]="era\(\)===i"/);
 assert.match(view,/\(click\)="selectEra\(i\)"/);
 assert.match(view,/<img \[src\]="selectedEra\(\)\.image"/);
});

test('timeline does not load legacy framework, store state or mutate the Canvas simulation',()=>{
 const owner=read('era-timeline.ts'),view=read('era-timeline.html');
 assert.match(owner,/import \{eras\} from '\.\/site-data'/);
 assert.match(owner,/Number\.isInteger\(index\)/);
 assert.match(owner,/index>=0&&index<this\.eras\.length/);
 assert.doesNotMatch(owner,/fetch\(|localStorage|document\.|window\.|react|website\/|import\(/i);
 assert.doesNotMatch(view,/<iframe|<script|\[innerHTML\]/i);
});
