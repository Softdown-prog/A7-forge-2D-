/** All browser contracts run against the exact default artifact. No legacy fallback. */
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const env={...process.env,LHS_SITE_ROOT:resolve(root,'out/site')};
for(const name of ['verify_clean_angular_confirmation','verify_clean_angular_account',
 'verify_clean_angular_site','verify_clean_angular_donate_history',
 'verify_clean_angular_sandbox_review','verify_clean_angular_migration'])
 execFileSync(process.execPath,[resolve(import.meta.dirname,name+'.mjs')],{cwd:root,stdio:'inherit',env});
