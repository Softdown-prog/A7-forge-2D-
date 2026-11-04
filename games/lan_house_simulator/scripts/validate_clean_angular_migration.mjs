/** One reproducible, fail-fast validation entrypoint. No deploy or live API writes. */
import {spawnSync,execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const output=resolve(root,'out/site-clean-angular-browser');
mkdirSync(output,{recursive:true});
const npm=process.platform==='win32'?'npm.cmd':'npm';
const steps=[
 ['published-html-inventory',process.execPath,['scripts/snapshot_published_site.mjs']],
 ['node-and-engine',npm,['test']],
 ['backend-contracts',process.execPath,['--test',...execFileSync('git',['ls-files','backend/tests/*.test.mjs'],{cwd:root,encoding:'utf8'}).trim().split('\n')]],
 ['angular-lint',npm,['run','lint','--prefix','frontend-angular']],
 ['checkout-strict-types',process.execPath,['frontend-angular/node_modules/typescript/bin/tsc',
  '--ignoreConfig','--noEmit','--strict','--noUnusedLocals','--noUnusedParameters',
  '--noUncheckedIndexedAccess','--exactOptionalPropertyTypes','--noImplicitReturns',
  '--noFallthroughCasesInSwitch','--noPropertyAccessFromIndexSignature','--target','ES2022',
  '--module','ES2022','--moduleResolution','bundler','--lib','ES2022,DOM','--skipLibCheck',
  ...['checkout-contract','checkout-sandbox-adapter','checkout-attempts','production-checkout-contract']
   .map(name=>'frontend-angular/src/site-rewrite/'+name+'.ts')]],
 ['legacy-build',npm,['run','build:site']],
 ['legacy-check',npm,['run','check:site']],
 ['angular-build',npm,['run','build:site:clean']],
 ['angular-check',npm,['run','check:site:clean']],
 ...['prerender_clean_angular_site','check_clean_angular_prerender','audit_clean_angular_cutover',
  'verify_clean_angular_confirmation','verify_clean_angular_account','verify_clean_angular_site',
  'verify_clean_angular_donate_history','verify_clean_angular_sandbox_review',
  'verify_clean_angular_migration'].map(name=>[name,process.execPath,['scripts/'+name+'.mjs']])
];
const report={sourceSha:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),
 workingTreeDirty:!!execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim(),
 startedAt:new Date().toISOString(),passed:false,productionDeployed:false,steps:[]};
for(const [id,program,args] of steps){
 console.log('VALIDATE',id);
 const start=Date.now();
 const result=spawnSync(program,args,{cwd:root,stdio:'inherit',timeout:1200000,
  env:{...process.env,NG_CLI_ANALYTICS:'false',CI:'true'}});
 report.steps.push({id,passed:result.status===0&&!result.error,durationMs:Date.now()-start});
 report.finishedAt=new Date().toISOString();
 writeFileSync(resolve(output,'validation-results.json'),JSON.stringify(report,null,2)+'\n');
 if(result.status!==0||result.error)process.exit(result.status||1);
}
report.passed=true;
writeFileSync(resolve(output,'validation-results.json'),JSON.stringify(report,null,2)+'\n');
console.log('Full Angular migration validation passed. Production remains unchanged.');
