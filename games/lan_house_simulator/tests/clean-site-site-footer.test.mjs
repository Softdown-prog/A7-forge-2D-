import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const dir=resolve(import.meta.dirname,'../frontend-angular/src/site-rewrite');
const read=name=>readFileSync(resolve(dir,name),'utf8');

test('one Angular footer owns navigation and exposes a typed toggle event',()=>{
 const app=read('site-app.ts'),shell=read('site-app.html');
 const component=read('site-footer.ts'),markup=read('site-footer.html');
 assert.match(app,/import \{SiteFooterComponent\} from '\.\/site-footer'/);
 assert.match(app,/imports:\[[^\]]*SiteFooterComponent/);
 assert.match(shell,/<lhs-site-footer \[reduceMotion\]="reduceMotion\(\)" \(motionToggle\)="toggleMotion\(\)"><\/lhs-site-footer>/);
 assert.equal((shell.match(/<lhs-site-footer\b/g)||[]).length,1);
 assert.doesNotMatch(shell,/<footer\b|id="motion-toggle"|footerLinks|@for\(link of navigation/);
 assert.doesNotMatch(app,/readonly footerLinks|readonly navigation/);
 assert.match(component,/selector:'lhs-site-footer'/);
 assert.match(component,/ChangeDetectionStrategy\.OnPush/);
 assert.match(component,/readonly reduceMotion=input\.required<boolean>\(\)/);
 assert.match(component,/readonly motionToggle=output<void>\(\)/);
 assert.match(component,/requestMotionToggle\(\):void\{this\.motionToggle\.emit\(\);\}/);
 assert.equal((markup.match(/<footer\b/g)||[]).length,1);
 assert.equal((markup.match(/id="motion-toggle"/g)||[]).length,1);
 assert.match(markup,/\[attr\.aria-pressed\]="reduceMotion\(\)"/);
 assert.match(markup,/\(click\)="requestMotionToggle\(\)"/);
 assert.match(markup,/@for\(link of footerLinks;track link\.href\)/);
 assert.match(markup,/@for\(link of navigation;track link\.href\)/);
});

test('footer does not duplicate media handling or violate strict style CSP',()=>{
 const component=read('site-footer.ts'),shell=read('site-app.ts');
 assert.match(shell,/readonly reduceMotion=signal\(false\)/);
 assert.match(shell,/private readonly media=window\.matchMedia/);
 assert.match(shell,/toggleMotion\(\):void\{this\.reduceMotion\.update\(value=>!value\);\}/);
 assert.doesNotMatch(component,/styles:\s*\[|localStorage|fetch\(|addEventListener|window\.|document\.|react|website\/|innerHTML/i);
 assert.match(read('site.css'),/lhs-site-header,lhs-site-footer\{display:block\}/);
 assert.doesNotMatch(read('site-footer.html'),/<iframe|<script|\[innerHTML\]/i);
});
