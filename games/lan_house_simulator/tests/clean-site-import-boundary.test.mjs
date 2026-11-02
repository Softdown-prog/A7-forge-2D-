import test from 'node:test';
import assert from 'node:assert/strict';
import {auditSite,auditSource} from '../scripts/check_clean_angular_imports.mjs';

function reject(source,code){
 assert.ok(auditSource(source,'site-app.ts').includes(code),
  'Expected '+code+' from '+source);
}

test('the entire institutional rewrite imports only canonical Angular modules',()=>{
 const result=auditSite();
 assert.ok(result.scanned.length>=13,'All existing TypeScript modules must be inspected');
 for(const name of ['account.ts','donate.ts','site-app.ts','main.ts',
  'checkout-sandbox-adapter.ts','email-confirmation.ts'])
  assert.ok(result.scanned.includes(name),'Missing '+name);
 assert.deepEqual(result.findings,[]);
});

test('legitimate Angular, local, type-only and JSON imports are accepted',()=>{
 assert.deepEqual(auditSource(
  "import {Component} from '@angular/core'; import {faq} from './site-data'; import metadata from './page-metadata.json';",
  'site-app.ts'),[]);
 assert.deepEqual(auditSource(
  "import type {SiteApp} from './site-app'; export {SiteApp as App} from './site-app';",
  'main.ts'),[]);
});

test('legacy site, React and unrelated packages cannot re-enter the app',()=>{
 reject("import React from 'react';",'non-angular-dependency-import');
 reject("export * from '../site/site-navigation';",'legacy-or-outside-angular-import');
 reject("import '../../website/site.mjs';",'legacy-or-outside-angular-import');
 reject("import {x} from '@other/utility';",'non-angular-dependency-import');
});

test('CommonJS and nonliteral dynamic imports cannot bypass the guard',()=>{
 reject("await import('../site/main');",'legacy-or-outside-angular-import');
 reject("await import(nextModule);",'nonliteral-dynamic-import');
 reject("const x=require('react');",'commonjs-require-forbidden');
 reject("import thing = require('react');",'commonjs-import-forbidden');
});

test('missing modules and invalid TS syntax fail closed',()=>{
 reject("import {x} from './missing-component';",'unresolved-angular-local-import');
 reject("import 'https://example.org/code.js';",'non-angular-dependency-import');
 reject("const = ;",'invalid-typescript-syntax');
});

test('comments and ordinary strings are not mistaken for imports',()=>{
 assert.deepEqual(auditSource(
  "const note = \"import React from 'react'\"; // import '../site/main'",
  'site-app.ts'),[]);
});


test('only the exact Canvas save validator is permitted in the Angular account',()=>{
 const legitimate="async function validate(){const modulePath='/game/js/sim/saveTransfer.js';return await import(modulePath);}";
 assert.deepEqual(auditSource(legitimate,'account.ts'),[]);
 assert.ok(auditSource(legitimate,'site-app.ts')
  .includes('non-angular-dependency-import'));
 const attack="async function validate(){const modulePath='/game/js/site.mjs';return await import(modulePath);}";
 assert.ok(auditSource(attack,'account.ts')
  .includes('non-angular-dependency-import'));
 const computed="async function validate(){const modulePath=location.hash;return await import(modulePath);}";
 assert.ok(auditSource(computed,'account.ts')
  .includes('nonliteral-dynamic-import'));
});
