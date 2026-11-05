import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
test('the sandbox contract cannot silently create production orders',()=>{
 const source=read('../frontend-angular/src/site-rewrite/checkout-contract.ts');
 const donate=read('../frontend-angular/src/site-rewrite/donate.ts');
 const markup=read('../frontend-angular/src/site-rewrite/donate.html');
 const account=read('../frontend-angular/src/site-rewrite/account-client.ts');
 const adapter=read('../frontend-angular/src/site-rewrite/checkout-sandbox-adapter.ts');
 const backend=read('../backend/server.mjs');
 assert.doesNotMatch(source,/\bfetch\s*\(|window\.location|document\.location|location\.assign|localStorage|sessionStorage/);
 assert.match(donate,/validateSandboxQuote/);
 assert.match(donate,/createAuthenticatedSandboxAdapter/);
 assert.match(donate,/simulateSandboxCheckout/);
 assert.match(donate,/this\.availability\(\)!=='sandbox-ready'/);
 assert.doesNotMatch(donate,/location\.assign|window\.open|checkoutUrl/);
 assert.match(markup,/id="prepare-sandbox-order"/);
 assert.match(markup,/id="retry-sandbox-order"/);
 assert.match(account,/async postSandboxOrder\(/);
 assert.match(account,/'X-LHS-Sandbox-Only':'true'/);
 assert.match(backend,/assertSandboxOrderIntent\(req\.headers\['x-lhs-sandbox-only'\],sandbox\)/);
 assert.match(backend,/Idempotency-Key, X-LHS-Sandbox-Only/);
 assert.doesNotMatch(adapter,/location\.assign|window\.open/);
 assert.doesNotMatch(donate+markup,/\/v1\/orders['"]\s*,\s*\{|location\.assign|window\.open/);
 // The specialized account transport may POST; the generic api() allowlist stays read-only.
 assert.match(account,/if\(!\(path==='\/v1\/orders'&&body===undefined\)/);
 assert.match(donate,/this\.reviewState\.set\('confirmed'\)/);
 assert.match(donate,/this\.availability\(\)!=='sandbox-ready'/);
 assert.match(markup,/data-review-package/);
 assert.match(markup,/id="confirm-sandbox-review"/);
 assert.match(markup,/<button[^>]*\[attr\.data-donate-package\]="pack.id"[^>]*disabled/);
 assert.match(markup,/aria-disabled="true"/);
 assert.doesNotMatch(account,/path==='\/v1\/orders'&&body!==undefined/);
});

test('expired sandbox authentication cannot keep a retry button or another login\'s idempotency key',()=>{
 const source=read('../frontend-angular/src/site-rewrite/donate.ts');
 const browser=read('../scripts/verify_clean_angular_sandbox_review.mjs');
 assert.match(source,/error instanceof AccountError&&error\.status===401/);
 for(const statement of [
  'client.signOut();','this.orderKeys.clear();',
  'this.reviewClient=null;','this.reviewQuote.set(null);',
  'this.sandboxOrderId.set(null);','this.termsAccepted.set(false);',
  "this.reviewState.set('login-required');"
 ])assert.ok(source.includes(statement),'Missing expiration cleanup: '+statement);
 assert.match(browser,/orderStatus=401/);
 assert.match(browser,/New login needs new order key/);
 assert.match(browser,/Auth expiry must clear the stored session/);
 assert.match(browser,/401 refresh must preserve the order key/);
});
