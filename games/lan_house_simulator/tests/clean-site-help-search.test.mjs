import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../frontend-angular/src/site-rewrite');
const read=name=>readFileSync(resolve(root,name),'utf8');

test('Ajuda uses exactly one Angular standalone owner for FAQ state and HTML',()=>{
 const app=read('site-app.ts'),page=read('site-app.html');
 const component=read('help-search.ts'),markup=read('help-search.html');
 assert.match(app,/import \{HelpSearchComponent\} from '\.\/help-search'/);
 assert.match(app,/imports:\[[^\]]*HelpSearchComponent/);
 assert.match(page,/@case\('\/ajuda\/'\)\s*\{[\s\S]*?<lhs-help-search><\/lhs-help-search>/);
 assert.equal((page.match(/<lhs-help-search>/g)||[]).length,1);
 assert.doesNotMatch(app,/readonly query|readonly matched|changeQuery\(|clearQuery\(|normalizeSearch|\bfaq\b/);
 assert.doesNotMatch(page,/id="help-search"|matched\(\)|changeQuery\(|clearQuery\(/);
 assert.match(component,/selector:'lhs-help-search'/);
 assert.match(component,/ChangeDetectionStrategy\.OnPush/);
 assert.match(component,/readonly query=signal\(''\)/);
 assert.match(component,/readonly matched=computed\(/);
 assert.match(markup,/id="help-search"/);
 assert.match(markup,/role="status" aria-live="polite"/);
 assert.match(markup,/Nenhuma resposta encontrada/);
 assert.equal((markup.match(/id="help-search"/g)||[]).length,1);
});
test('Angular FAQ handles normalized queries, clear focus, semantic answers and no remote fetch',()=>{
 const component=read('help-search.ts'),html=read('help-search.html');
 assert.match(component,/normalizeSearch\(this\.query\(\)\)/);
 assert.match(component,/normalizeSearch\(question\+' '\+answer\)/);
 assert.match(component,/input\.focus\(\)/);
 assert.match(html,/\(input\)="changeQuery\(\$event\)"/);
 assert.match(html,/\(click\)="clearQuery\(searchBox\)"/);
 assert.match(html,/<details><summary>/);
 assert.doesNotMatch(component,/fetch\(|localStorage|document\.querySelector|innerHTML|website\/|react/);
});
