/** Build and validate an Angular LHS site artifact without publishing it.
 * Cross-platform CLI for the opt-in site pipeline (works on Windows, too).
 */
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const env={...process.env,LHS_SITE_ANGULAR_CANDIDATE:'1'};
for(const file of ['website/build.mjs','website/check.mjs'])
 execFileSync(process.execPath,[resolve(root,file)],{
  cwd:root,env,stdio:'inherit'
 });
console.log('Angular site candidate validated: out/site-angular (not deployed).');
