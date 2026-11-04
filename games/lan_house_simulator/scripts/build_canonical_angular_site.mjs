/** The default site build is exclusively Angular, including public prerender. */
import {execFileSync} from 'node:child_process';
import {cpSync,rmSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {verifyApprovedArtifact} from './approved_site_artifact.mjs';
const root=resolve(import.meta.dirname,'..');
if(existsSync(resolve(root,'.lhs-approved-site.json'))){
 verifyApprovedArtifact(root,resolve(root,'out/site'));
 execFileSync(process.execPath,[resolve(root,'scripts/check_canonical_angular_site.mjs')],{cwd:root,stdio:'inherit'});
 console.log('Using the exact reviewed Angular artifact; no recompilation');
 process.exit(0);
}
for(const name of ['build_clean_angular_site','check_clean_angular_site',
 'prerender_clean_angular_site','check_clean_angular_prerender'])
 execFileSync(process.execPath,[resolve(root,'scripts/'+name+'.mjs')],{
  cwd:root,stdio:'inherit',env:{...process.env,LHS_SITE_ROOT:resolve(root,'out/site-clean-angular')}
 });
const output=resolve(root,'out/site');
rmSync(output,{recursive:true,force:true});
cpSync(resolve(root,'out/site-clean-angular'),output,{recursive:true});
writeFileSync(resolve(output,'site-build.json'),JSON.stringify({schemaVersion:1,
 framework:'angular',source:'frontend-angular/src/site-rewrite',publicPrerender:true,
 productionCheckoutEnabled:false},null,2)+'\n');
console.log('Canonical Angular site:',output);
