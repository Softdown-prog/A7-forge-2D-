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
  assert.equal(pkg.dependencies[name],'12.1.3');
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
 assert.match(module,/consumer\.apply\(SecurityHeadersMiddleware,TraceMiddleware,OriginPolicyMiddleware\)/);
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

test('preview Firebase auth port fails closed, checks revocation and gates email',()=>{
 const auth=read(prefix+'src/middleware/firebase-auth.middleware.ts');
 const verifier=read(prefix+'src/firebase-token-verifier.ts');
 const gate=read(prefix+'src/middleware/verified-email.middleware.ts');
 const module=read(prefix+'src/app.module.ts');
 const bootstrap=read(prefix+'src/bootstrap.ts');
 const controller=read(prefix+'src/preview.controller.ts');
 assert.match(auth,/\^Bearer \(\\S\+\)\$/);
 assert.match(auth,/verifyIdToken\(match\[1\]!,true\)/);
 assert.match(auth,/status\(401\)/);
 assert.match(auth,/request\.uid=identity\.uid/);
 assert.match(gate,/email_verified!==true/);
 assert.match(gate,/status\(403\)/);
 assert.match(verifier,/disabledFirebaseVerifier/);
 assert.match(verifier,/throw new Error\('Firebase verifier is not configured/);
 assert.match(bootstrap,/useValue:verifier/);
 assert.match(bootstrap,/disabledFirebaseVerifier/);
 assert.match(module,/consumer\.apply\(FirebaseAuthMiddleware\)/);
 // GET handlers in Express/Nest can implicitly answer HEAD, so guard every verb.
 for(const path of ['auth','verified','limited'])
  assert.ok(module.includes("{path:'__nest_probe/"+path+"',method:RequestMethod.ALL}"));

 assert.match(module,/consumer\.apply\(VerifiedEmailMiddleware\)/);
 assert.match(controller,/@Get\('auth'\)/);
 assert.match(controller,/@Get\('verified'\)/);
 assert.doesNotMatch(bootstrap+module+auth+gate,/firebase-admin|createPayments|getFirestore|MP_ACCESS_TOKEN/);
});

test('quota is transaction-based and only applied after verified Firebase identity',()=>{
 const module=read(prefix+'src/app.module.ts');
 const bootstrap=read(prefix+'src/bootstrap.ts');
 const controller=read(prefix+'src/preview.controller.ts');
 const quota=read(prefix+'src/user-quota.ts');
 const middleware=read(prefix+'src/middleware/user-quota.middleware.ts');
 assert.match(module,/consumer\.apply\(UserQuotaMiddleware\)/);
 assert.match(module,/\{path:'__nest_probe\/limited',method:RequestMethod.ALL\}/);
 assert.ok(module.indexOf('consumer.apply(VerifiedEmailMiddleware)')<
  module.indexOf('consumer.apply(UserQuotaMiddleware)'));
 assert.match(bootstrap,/quota:UserQuotaPort=disabledUserQuota/);
 assert.match(bootstrap,/provide:USER_QUOTA_PORT,useValue:quota/);
 assert.match(controller,/@Get\('limited'\)/);
 assert.match(quota,/runTransaction\(async tx=>/);
 assert.match(quota,/collection\('rateLimits'\)\.doc\(uid\)/);
 assert.match(quota,/count>=30/);
 assert.match(quota,/new Date\(stamp\+120_000\)/);
 assert.match(quota,/disabledUserQuota/);
 assert.match(middleware,/quota\.reserve\(request\.uid\)/);
 for(const status of [401,403,429,503])
  assert.match(middleware,new RegExp('status\\('+status+'\\)'));
 assert.doesNotMatch(quota+middleware+bootstrap,
  /from ['"]firebase-admin|from ['"]@google-cloud\/firestore|createPayments|MP_WEBHOOK_SECRET/);
});


test('Firestore SDK can only connect to local emulator in explicitly isolated CI',()=>{
 const sdk=read(prefix+'src/emulator-firestore.ts');
 const main=read(prefix+'src/main.ts');
 const bootstrap=read(prefix+'src/bootstrap.ts');
 const pkg=JSON.parse(read(prefix+'package.json'));
 const ci=read('../../.github/workflows/lhs-nest-middleware-preview.yml');
 assert.match(sdk,/assertLocalFirestoreEmulatorAllowed\(\)/);
 assert.ok(sdk.indexOf('assertLocalFirestoreEmulatorAllowed();')<
  sdk.indexOf("import('firebase-admin/app')"));
 assert.match(sdk,/FIRESTORE_EMULATOR_HOST/);
 assert.match(sdk,/LHS_NEST_EMULATOR_ENABLED/);
 assert.match(sdk,/GOOGLE_APPLICATION_CREDENTIALS/);
 assert.match(sdk,/NODE_ENV==='production'/);
 assert.match(sdk,/demo-lhs-nest-quota/);
 assert.match(sdk,/db\.runTransaction/);
 assert.doesNotMatch(main+bootstrap,/emulator-firestore|openLocalFirestoreQuota/);
 assert.doesNotMatch(read('backend/server.mjs'),/openLocalFirestoreQuota|nest-preview/);
 assert.equal(pkg.devDependencies['firebase-admin'],'14.5.0');
 assert.equal(pkg.devDependencies['firebase-tools'],'15.34.1');
 assert.ok(existsSync(new URL('../'+prefix+'firebase.emulator.json',import.meta.url)));
 assert.ok(existsSync(new URL('../'+prefix+'test/firestore-emulator.integration.mjs',import.meta.url)));
 assert.match(ci,/actions\/setup-java@v4/);
 assert.match(ci,/java-version: "21"/);
 assert.match(ci,/LHS_NEST_EMULATOR_ENABLED: "1"/);
 assert.match(ci,/npm run test:emulator:ci/);
});


test('lockfile is committed and CI never re-resolves dependency versions',()=>{
 const pkg=JSON.parse(read(prefix+'package.json'));
 const lock=JSON.parse(read(prefix+'package-lock.json'));
 assert.equal(lock.lockfileVersion,3);
 assert.equal(lock.name,pkg.name);
 assert.deepEqual(lock.packages[''].dependencies,pkg.dependencies);
 assert.deepEqual(lock.packages[''].devDependencies,pkg.devDependencies);
 assert.deepEqual(lock.packages[''].engines,pkg.engines);
 for(const [name,entry] of Object.entries(lock.packages)){
  if(!name||!entry.resolved)continue;
  assert.ok(entry.resolved.startsWith('https://registry.npmjs.org/'),name);
  assert.match(entry.integrity??'',/^sha(?:256|384|512)-/,name);
 }
 const ci=read('../../.github/workflows/lhs-nest-middleware-preview.yml');
 assert.match(ci,/npm ci --ignore-scripts --no-audit --no-fund/);
 assert.doesNotMatch(ci,/npm install|npm update|package-lock-only/);
 assert.doesNotMatch(ci,/actions\\/upload-artifact@/);
});
