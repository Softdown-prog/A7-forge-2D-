// SAC LHS: trusted GitHub Actions host, no VPS, API, deployment or worker changes.
import {execFileSync,spawnSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {appendFile,mkdir,readFile,rm,writeFile} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
const game=fileURLToPath(new URL('../',import.meta.url));
const repo=path.resolve(game,'../..');
const workspace=path.join(game,'frontend-angular');
const sac=path.join(repo,'.sac-toolchain');
const reportDir=path.join(game,'out/sac-angular-site-rewrite');
const sourceSha=process.env.GITHUB_SHA;
const sacSha='06a0c5756098009165397ff6c3c45db089493de8';
const validStatuses=new Set(['pass','fail','unverified','infra-error','not-applicable']);
const status=x=>validStatuses.has(x?.status)?x.status:'unverified';
const code=x=>typeof x?.code==='string'&&/^[a-z][a-z0-9-]{0,63}$/.test(x.code)?x.code:'none';
function sourceManifest(){
 const prefix='games/lan_house_simulator/frontend-angular/';
 const raw=execFileSync('git',['-C',repo,'ls-files','-z','--',prefix],
   {encoding:'utf8',timeout:10000,maxBuffer:5000000});
 const files=raw.split('\0').filter(Boolean).map(p=>p.startsWith(prefix)?p.slice(prefix.length):'')
   .filter(p=>p.startsWith('src/')||['angular.json','package.json','package-lock.json',
    'tsconfig.json','tsconfig.app.json','tsconfig.site.json','tsconfig.site-rewrite.json'].includes(p)).sort();
 const required=['package.json','package-lock.json','angular.json','tsconfig.site-rewrite.json',
  'src/site-rewrite/main.ts','src/site-rewrite/index.html'];
 if(files.length<8||files.length>2048||new Set(files).size!==files.length||
   !required.every(p=>files.includes(p))||files.some(p=>p.split('/').some(q=>
     q==='..'||q==='node_modules'||q==='.git'||q.startsWith('.env'))))
   throw Error('invalid-source-manifest');
 return files;
}
async function writeReport(report){
 await mkdir(reportDir,{recursive:true});
 await writeFile(path.join(reportDir,'report.json'),JSON.stringify(report,null,2)+'\n');
 if(!process.env.GITHUB_STEP_SUMMARY)return;
 const lines=['### Lan House Simulator — SAC site-rewrite',
  '', '| Etapa | Estado |','| --- | --- |',
  ...['pre','build','post'].map(p=>'| '+p+' | '+report.phases[p].status+' |'),
  '| browser | '+report.phases.browser.status+' |',
  '', 'Estático: **'+(report.static_pipeline_pass?'aprovado':'não aprovado')+'**.',
  'Guardian isolado: **'+(report.browser_pass?'aprovado':'não aprovado / não verificado')+'**.',
  '', 'LHS SHA: '+(report.source_sha??'não comprovado'),'SAC SHA: '+report.sac_commit];
 for(const c of report.phases.browser.cases??[]){
   lines.push('- Cenário `'+c.id+'`: '+c.status+(c.codes.length?' ('+c.codes.join(', ')+')':''));
 }
 for(const f of report.diagnostic?.findings??[]){
   lines.push('- **'+f.phase+'/'+f.code+'** — '+f.title+'. '+f.next_step);
 }
 await appendFile(process.env.GITHUB_STEP_SUMMARY,lines.join('\n')+'\n');
}
const browser={status:'unverified',executed:false,code:'not-executed',cases:[]};
const guardian={
  schema_version:1,timeout_ms:8000,cases:[
    {id:'motion-toggle',path:'/',expect_visible:['lhs-site h1','#motion-toggle'],
      actions:[{click:'#motion-toggle',expect_visible:'#motion-toggle[aria-pressed="true"]'}]},
    {id:'help-faq-expand',path:'/ajuda/',
      expect_visible:['lhs-site h1','#help-search','section.faq details:first-of-type summary'],
      actions:[{click:'section.faq details:first-of-type summary',
        expect_visible:'section.faq details:first-of-type[open] p'}]}
  ]
};
async function main(){
 if(!/^[0-9a-f]{40}$/.test(sourceSha??''))throw Error('commit-not-proven');
 const [{prepareBuild,sealBuild,auditPipeline},{makeDiagnosticReport},{verifyPipelineBrowserSandbox}]=await Promise.all([
  import(pathToFileURL(path.join(sac,'packages/angular-pipeline/src/index.mjs')).href),
  import(pathToFileURL(path.join(sac,'scripts/sac_diagnostic_report.mjs')).href),
  import(pathToFileURL(path.join(sac,'packages/angular-guardian/src/sandbox.mjs')).href)]);
 const angularVersion=JSON.parse(await readFile(path.join(workspace,'node_modules/@angular/core/package.json'),'utf8')).version;
 if(!/^22\.\d{1,3}\.\d{1,3}$/.test(angularVersion))throw Error('unsupported-angular-profile');
 const profile={schema_version:1,profile_id:'lhs-site-rewrite',angular_version:angularVersion,
  capabilities:['angular','workspace','static-dist'],mode:'angular-only',mount:'/',
  bundle_hints:{index:'index.html',angular_host:'lhs-site',
    angular_entrypoints:['main.js'],assets:[],legacy_react_entrypoints:[]},
  rules:['SAC-PRE001','SAC-P001'].map(rule_id=>({
    rule_id,version:'1.0.0',required:true,enforcement:'blocking'}))};
 const resources={workspace,dist:'dist/site-rewrite/browser',sourceFiles:sourceManifest()};
 const context={profile,resources,sourceSha,key:randomBytes(32)};
 const {session,report:pre}=await prepareBuild(context);
 let audit=pre;
 let receipt;
 let verifiedBrowser;
 if(session){
   await rm(path.join(workspace,'dist/site-rewrite'),{recursive:true,force:true});
   const run=spawnSync(process.execPath,
    ['node_modules/@angular/cli/bin/ng.js','build','site-rewrite','--configuration','production'],
    {cwd:workspace,shell:false,stdio:'inherit',timeout:240000,
      env:{...process.env,NG_CLI_ANALYTICS:'false',CI:'true'}});
   const buildStatus=run.status===0&&!run.error?'pass':'fail';
   receipt=await sealBuild({...context,session,buildStatus});
   audit=await auditPipeline({...context,receipt});
   if(audit.static_pipeline_pass===true){
     verifiedBrowser=await verifyPipelineBrowserSandbox({
       pipeline:{...context,receipt},guardian,timeoutMs:100000,
       image:process.env.SAC_SANDBOX_IMAGE
     });
   }
 }
 const browserEvidence=verifiedBrowser?.browser??browser;
 const browserPass=verifiedBrowser?.browser_pass===true &&
   verifiedBrowser.network_isolation==='container-network-none' &&
   browserEvidence.sandbox==='docker-network-none';
 const diagnostic=makeDiagnosticReport(verifiedBrowser??{
   status:audit.status,static_result:audit,static_pipeline_pass:audit.static_pipeline_pass,
   browser,browser_pass:false,deployment_authorized:false,network_isolation:'not-executed'
 });
 const result={schema_version:1,project:'lan-house-simulator',angular_target:'site-rewrite',
   source_sha:sourceSha,sac_commit:sacSha,execution:'github-actions-browser',
   phases:{pre:{status:status(audit.phases?.pre),code:code(audit.phases?.pre)},
    build:{status:status(audit.phases?.build),code:code(audit.phases?.build)},
    post:{status:status(audit.phases?.post),code:code(audit.phases?.post)},
    browser:{status:status(browserEvidence),code:code(browserEvidence),
      executed:browserEvidence.executed===true,
      sandbox:browserEvidence.sandbox==='docker-network-none'?'docker-network-none':null,
      cases:Array.isArray(browserEvidence.cases)?browserEvidence.cases.map(c=>({
        id:c.id,status:c.status,codes:c.codes
      })):[]}},
   static_pipeline_pass:audit.static_pipeline_pass===true,
   browser_pass:browserPass,network_isolation:verifiedBrowser?.network_isolation??'not-executed',
   deployment_authorized:false,diagnostic};
 await writeReport(result);
 if(!result.static_pipeline_pass||!result.browser_pass){
   process.exitCode=1;console.error('SAC: verificações incompletas/falharam; consulte report.json.');
 }else console.log('SAC estático e Guardian/Chromium aprovados (sem deploy).');
}
await main().catch(async err=>{
 const reason=/manifest|commit|profile/.test(err?.message??'')?'invalid-diagnostic-input':'diagnostic-runner-error';
 await writeReport({schema_version:1,project:'lan-house-simulator',angular_target:'site-rewrite',
  source_sha:/^[0-9a-f]{40}$/.test(sourceSha??'')?sourceSha:null,sac_commit:sacSha,
  execution:'github-actions-static',phases:{
   pre:{status:'unverified',code:reason},build:{status:'unverified',code:'not-executed'},
   post:{status:'unverified',code:'not-executed'},browser},
  static_pipeline_pass:false,browser_pass:false,deployment_authorized:false,diagnostic:null});
 process.exitCode=1;
});
