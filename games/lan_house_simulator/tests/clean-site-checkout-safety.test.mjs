import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
test('the checkout contract is test-only and production Donate remains disabled',()=>{
 const source=read('../frontend-angular/src/site-rewrite/checkout-contract.ts');
 const donate=read('../frontend-angular/src/site-rewrite/donate.ts');
 const markup=read('../frontend-angular/src/site-rewrite/donate.html');
 const account=read('../frontend-angular/src/site-rewrite/account-client.ts');
 assert.doesNotMatch(source,/\bfetch\s*\(|window\.location|document\.location|location\.assign|localStorage|sessionStorage/);
 assert.doesNotMatch(donate+markup+account,/checkout-contract|simulateSandboxCheckout/);
 assert.match(markup,/<button[^>]*\[attr\.data-donate-package\]="pack.id"[^>]*disabled/);
 assert.match(markup,/aria-disabled="true"/);
 assert.doesNotMatch(account,/path==='\/v1\/orders'&&body!==undefined/);
});
