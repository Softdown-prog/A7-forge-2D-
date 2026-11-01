import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(path)=>readFileSync(new URL(path,import.meta.url),'utf8');
test('local data interface is Angular only and has two-key allowlist',()=>{
 const component=read('../frontend-angular/src/site-rewrite/local-data.ts');
 const html=read('../frontend-angular/src/site-rewrite/local-data.html');
 const app=read('../frontend-angular/src/site-rewrite/site-app.ts');
 const host=read('../frontend-angular/src/site-rewrite/site-app.html');
 const browser=read('../scripts/verify_clean_angular_site.mjs');
 assert.match(component,/save:'lhs-save-v1'/);
 assert.match(component,/sound:'lhs\.sound'/);
 assert.match(component,/Object\.hasOwn\(LOCAL_DATA_KEYS,kind\)/);
 assert.match(component,/storage\.removeItem\(LOCAL_DATA_KEYS\[kind\]\)/);
 assert.doesNotMatch(component+html+host,/localStorage\.clear\(|website\/data-controls|innerHTML\s*=/);
 assert.match(component,/dialog\.returnValue!=='confirm'/);
 assert.match(component,/try\s*\{\s*removeOwnedLocalData\(window\.localStorage,kind\)/);
 assert.match(component,/ChangeDetectionStrategy.OnPush/);
 assert.match(app,/imports:\[LocalDataComponent,AccountComponent\]/);
 assert.match(host,/<lhs-local-data><\/lhs-local-data>/);
 for(const value of ['id="delete-local-save"','id="delete-local-sound"','id="delete-dialog"',
  'id="data-status"','role="status"','aria-live="polite"','id="confirm-delete"',
  '[disabled]="saveStatus()','[disabled]="soundStatus()','(close)="onClose(confirmation)"'])
  assert.ok(html.includes(value),value);
 for(const value of ["'/dados/'", "page.keyboard.press('Escape')",
   "'another-project-unrelated'", "new DOMException('Storage unavailable'",
   "localDataVerified:true", "page.reload({waitUntil:'networkidle'})"])
  assert.ok(browser.includes(value),value);
});
