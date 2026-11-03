import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const prefix='backend/nest-preview/';

test('preview depends on real NestJS but cannot affect the Express production entry',()=>{
 const pkg=JSON.parse(read(prefix+'package.json'));
 const live=JSON.parse(read('backend/package.json'));
 assert.equal(pkg.private,true);
 for(const name of ['@nestjs/common','@nestjs/core','@nestjs/platform-express'])
  assert.equal(pkg.dependencies[name],'12.0.0');
 assert.equal(live.scripts.start,'node server.mjs');
 assert.match(read('backend/server.mjs'),/const app=express\(\)/);
 assert.doesNotMatch(read('backend/server.mjs'),/nest-preview|NestFactory/);
 const entry=read(prefix+'src/main.ts');
 assert.match(entry,/LHS_NEST_PREVIEW_ENABLED/);
 assert.match(entry,/127\.0\.0\.1/);
 assert.match(entry,/NODE_ENV==='production'/);
 assert.doesNotMatch(entry,/0\.0\.0\.0/);
});

test('middleware chain is typed, registered in order, and has no live business routes',()=>{
 const module=read(prefix+'src/app.module.ts');
 const controller=read(prefix+'src/preview.controller.ts');
 const origins=read(prefix+'src/middleware/origin-policy.middleware.ts');
 const trace=read(prefix+'src/middleware/trace.middleware.ts');
 assert.match(module,/implements NestModule/);
 assert.match(module,/consumer\.apply\(SecurityHeadersMiddleware,OriginPolicyMiddleware,TraceMiddleware\)/);
 assert.match(module,/RequestMethod\.ALL/);
 assert.match(controller,/@Controller\('__nest_probe'\)/);
 assert.match(controller,/@Get\('health'\)/);
 assert.match(origins,/ALLOWED_ORIGINS/);
 assert.match(origins,/response\.status\(403\)/);
 assert.match(trace,/X-LHS-Trace-Id/);
 assert.doesNotMatch(module+controller,/\/v1\/|\/webhooks\/|getFirestore|createPayments/);
});

test('preview has strict TS and isolated CI, with no deploy step',()=>{
 const ts=JSON.parse(read(prefix+'tsconfig.json'));
 for(const name of ['strict','noImplicitOverride','noUncheckedIndexedAccess',
  'exactOptionalPropertyTypes','noUnusedLocals','noUnusedParameters'])
  assert.equal(ts.compilerOptions[name],true,name);
 assert.equal(ts.compilerOptions.module,'NodeNext');
 assert.equal(ts.compilerOptions.experimentalDecorators,true);
 assert.ok(existsSync(new URL('../'+prefix+'test/http-contract.test.mjs',import.meta.url)));
 const workflow=read('../../.github/workflows/lhs-nest-middleware-preview.yml');
 assert.match(workflow,/npm ci --ignore-scripts/);
 assert.match(workflow,/npm run test/);
 assert.match(workflow,/node --test games\/lan_house_simulator\/tests\/nest-middleware-foundation\.test\.mjs/);
 assert.doesNotMatch(workflow,/^\s*run:\s*.*(?:cloudflare|deploy|docker push|publish)/im);
 assert.doesNotMatch(read('backend/package.json'),/@nestjs\/|nest-preview/);
});
