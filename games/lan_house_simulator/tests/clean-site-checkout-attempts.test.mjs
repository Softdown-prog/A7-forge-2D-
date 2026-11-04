import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSync} from 'esbuild';
const build=buildSync({entryPoints:[new URL('../frontend-angular/src/site-rewrite/checkout-attempts.ts',import.meta.url).pathname],bundle:true,format:'esm',platform:'node',write:false});
const {CheckoutAttempts,MAX_CHECKOUT_ATTEMPTS}=await import('data:text/javascript;base64,'+Buffer.from(build.outputFiles[0].text).toString('base64'));
const key='123e4567-e89b-42d3-a456-426614174000';
const other='123e4567-e89b-42d3-a456-426614174001';
function storage(){const values=new Map();return {getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};}
test('uncertain intent survives cancellation/reload and has a bounded retry budget',()=>{
 const s=storage();
 assert.equal(new CheckoutAttempts('api|alice',s).next('donate-5',()=>key),key);
 for(let i=1;i<MAX_CHECKOUT_ATTEMPTS;i++)
  assert.equal(new CheckoutAttempts('api|alice',s).next('donate-5',()=>other),key);
 assert.throws(()=>new CheckoutAttempts('api|alice',s).next('donate-5',()=>other),/Limite/);
});
test('another identity cannot reuse an earlier account intent; 410 permits a new explicit intent',()=>{
 const s=storage(),alice=new CheckoutAttempts('api|alice',s);
 alice.next('donate-5',()=>key);
 assert.equal(new CheckoutAttempts('api|bob',s).next('donate-5',()=>other),other);
 assert.equal(new CheckoutAttempts('api|alice',s).keyFor('donate-5',()=>other),key,
  'Returning to the first identity must recover its pending intent');
 const bob=new CheckoutAttempts('api|bob',s);bob.expire('donate-5');
 assert.equal(bob.next('donate-5',()=>key),key);
 bob.clear();assert.equal(s.getItem('lhs.checkout.sandbox.v1:'+encodeURIComponent('api|bob')),null);
});
test('storage denial prevents submission; unrelated local data is preserved',()=>{
 const s=storage();s.setItem('lhs-save-v1','preserve');
 const denied={...s,setItem:()=>{throw Error('denied');}};
 assert.throws(()=>new CheckoutAttempts('api|alice',denied).next('donate-5',()=>key),/denied/);
 assert.throws(()=>new CheckoutAttempts('api|alice',null).next('donate-5',()=>key));
 assert.equal(s.getItem('lhs-save-v1'),'preserve');
});
