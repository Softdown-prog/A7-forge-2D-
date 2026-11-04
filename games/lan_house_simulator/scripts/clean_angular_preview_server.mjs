/** QA uses the same static server and header rules as the frontend container. */
import {resolve} from 'node:path';
import {startSiteServer} from './site_server.mjs';
export function startCleanAngularPreview(){
 return startSiteServer({root:process.env.LHS_SITE_ROOT??resolve(import.meta.dirname,'../out/site-clean-angular')});
}
