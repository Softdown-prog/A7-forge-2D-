import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'../frontend-angular/src/site-rewrite');
const read=name=>readFileSync(resolve(root,name),'utf8');

test('the global Angular shell delegates all header navigation state to one standalone component',()=>{
 const app=read('site-app.ts'),page=read('site-app.html');
 const owner=read('site-header.ts'),markup=read('site-header.html');
 assert.match(app,/import \{SiteHeaderComponent\} from '\.\/site-header'/);
 assert.match(app,/imports:\[[^\]]*SiteHeaderComponent/);
 assert.match(page,/<lhs-site-header \[path\]="path"><\/lhs-site-header>/);
 assert.equal((page.match(/<lhs-site-header/g)||[]).length,1);
 assert.doesNotMatch(page,/<header\b|id="site-nav"|openMenu\(\)|toggleMenu\(\)|closeMenu\(\)/);
 assert.doesNotMatch(app,/openMenu|toggleMenu\(|closeMenu\(/);
 assert.match(owner,/selector:'lhs-site-header'/);
 assert.doesNotMatch(owner,/styles:\s*\[/,'CSP forbids inline Angular component styles');
 assert.match(read('site.css'),/lhs-site-header\{display:block\}/);
 assert.match(owner,/ChangeDetectionStrategy\.OnPush/);
 assert.match(owner,/readonly path=input\.required<SitePath>\(\)/);
 assert.match(owner,/readonly openMenu=signal\(false\)/);
 assert.match(owner,/@HostListener\('document:keydown\.escape'\)/);
 assert.match(markup,/<header class="header">/);
 assert.equal((markup.match(/id="site-nav"/g)||[]).length,1);
 assert.match(markup,/<nav id="site-nav" class="nav"/);
 assert.match(markup,/\[attr\.aria-expanded\]="openMenu\(\)"/);
 assert.match(markup,/\[class\.open\]="openMenu\(\)"/);
 assert.ok(markup.includes("[attr.aria-current]=\"path()===link.href||(path()==='/jogar/'&&link.href==='/game/')?'page':null\""));
 assert.match(markup,/\(click\)="closeMenu\(\)"/);
});

test('the responsive header is keyboard accessible without legacy listeners or side effects',()=>{
 const owner=read('site-header.ts'),markup=read('site-header.html');
 assert.match(owner,/readonly navigation=navigation/);
 assert.match(owner,/toggleMenu\(\):void\{this\.openMenu\.update\(value=>!value\);\}/);
 assert.match(owner,/onEscape\(\):void\{/);
 assert.match(owner,/this\.toggle\(\)\?\.nativeElement\.focus\(\)/);
 assert.match(owner,/@HostListener\('document:pointerdown'/);
 assert.match(owner,/@HostListener\('window:resize'\)/);
 assert.match(markup,/aria-controls="site-nav"/);
 assert.match(markup,/aria-label="Navegação principal"/);
 assert.doesNotMatch(owner,/localStorage|fetch\(|document\.addEventListener|window\.addEventListener|react|website\/|innerHTML/i);
 assert.doesNotMatch(markup,/<iframe|<script|\[innerHTML\]/i);
});
