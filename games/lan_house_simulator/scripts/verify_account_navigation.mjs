/** Account and checkout navigation against the canonical Angular artifact. */
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
for(const name of ['verify_clean_angular_account','verify_clean_angular_donate_history','verify_clean_angular_migration','verify_site_payment_completion'])
 execFileSync(process.execPath,[resolve(import.meta.dirname,name+'.mjs')],{stdio:'inherit',env:{...process.env,LHS_SITE_ROOT:resolve(import.meta.dirname,'../out/site')}});
