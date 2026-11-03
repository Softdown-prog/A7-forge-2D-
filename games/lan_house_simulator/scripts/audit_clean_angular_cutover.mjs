/**
 * Read-only audit of the isolated Angular site artifact and its active release gate.
 *
 * This command never updates the deployed site or enables a payment flow.
 * A clean build may pass technical checks while the release remains NOT READY.
 */
import {existsSync,readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const PUBLIC_ROUTES=Object.freeze([
 '/', '/jogar/', '/sobre-o-jogo/', '/sobre-nos/',
 '/ajuda/', '/contato/', '/termos/', '/privacidade/'
]);
export const PRIVATE_ROUTES=Object.freeze([
 '/conta/', '/conta/confirmar/', '/donate/', '/dados/'
]);
export const SITE_ROUTES=Object.freeze([...PUBLIC_ROUTES,...PRIVATE_ROUTES]);

const file=(path)=>existsSync(path)?readFileSync(path,'utf8'):'';
const siteIndex=(root,path)=>file(path==='/404/'?resolve(root,'404.html'):
 resolve(root,'.'+path,'index.html'));
const check=(id,passed,detail)=>({id,passed,detail});
const block=(id,reason)=>({id,reason});

/**
 * Inspects evidence only. No "ready" result can be inferred from CI:
 * manual security, legal, mobile-device and production rollout approval
 * remain explicit blockers until separately validated.
 */
export function auditCleanAngularCutover({repoRoot,siteRoot}){
 const lhs=resolve(repoRoot,'games/lan_house_simulator');
 const angular=resolve(lhs,'frontend-angular/src/site-rewrite');
 const workflow=file(resolve(repoRoot,'.github/workflows/lhs-pages-sync.yml'));
 const legacyBuilder=file(resolve(lhs,'website/build.mjs'));
 const angularBuilder=file(resolve(lhs,'scripts/build_clean_angular_site.mjs'));
 const app=file(resolve(angular,'site-app.html'));
 const donate=file(resolve(angular,'donate.html'));
 const metadataText=file(resolve(angular,'page-metadata.json'));
 const manifestText=file(resolve(siteRoot,'angular-prerender-manifest.json'));
 const assetText=file(resolve(siteRoot,'angular-site-assets.json'));
 const results=[],blockers=[];
 let metadata={},manifest={},assets={};
 try{metadata=JSON.parse(metadataText);}catch{/* explicit failed check below */}
 try{manifest=JSON.parse(manifestText);}catch{/* explicit failed check below */}
 try{assets=JSON.parse(assetText);}catch{/* explicit failed check below */}
 const pagePaths=[...SITE_ROUTES,'/404/'];
 const allStaticPages=pagePaths.every(path=>siteIndex(siteRoot,path).length>0);
 results.push(check('angular-routes-built',allStaticPages,
  'Every public, account, donate and not-found route has its own HTML'));
 results.push(check('angular-metadata-complete',
  pagePaths.every(path=>typeof metadata[path]?.title==='string'&&
   typeof metadata[path]?.description==='string'),
  'All routes, including /404/, have title and description in Angular metadata'));
 const allPublic=PUBLIC_ROUTES.every(path=>{
  const html=siteIndex(siteRoot,path);
  return html.includes('<lhs-site data-lhs-public-prerender="true">')&&
   (html.match(/<main\b/g)||[]).length===1&&
   (html.match(/<h1\b/g)||[]).length===1;
 });
 results.push(check('public-pages-prerendered',allPublic,
  'All eight public pages include real static content with one main and one H1'));
 const allPrivate=PRIVATE_ROUTES.every(path=>{
  const html=siteIndex(siteRoot,path);
  return html.includes('<lhs-site></lhs-site>')&&
   !html.includes('data-lhs-public-prerender');
 });
 results.push(check('private-pages-never-snapshotted',allPrivate,
  'Account, confirmation, payments and data controls remain client-rendered'));
 results.push(check('snapshot-manifest-matches',
  manifest.version===1&&manifest.method==='isolated-chromium-public-snapshot'&&
   JSON.stringify(manifest.paths)===JSON.stringify(PUBLIC_ROUTES)&&
   JSON.stringify(manifest.excluded)===JSON.stringify(PRIVATE_ROUTES),
  'Prerender manifest distinguishes eight public and four sensitive pages'));
 const hashedName=/^[a-z][a-z0-9_-]*-[a-z0-9]{6,}\.(?:js|css)$/i;
 const emitted=Array.isArray(assets.files)?assets.files:[];
 const validAssets=emitted.length>=2&&emitted.every(name=>typeof name==='string'&&hashedName.test(name)&&
  existsSync(resolve(siteRoot,'assets/site',name)))&&
  emitted.includes(assets.main)&&emitted.includes(assets.styles)&&
  typeof assets.main==='string'&&/^main-[a-z0-9]{6,}\.js$/i.test(assets.main)&&
  typeof assets.styles==='string'&&/^styles-[a-z0-9]{6,}\.css$/i.test(assets.styles);
 results.push(check('content-hashed-angular-assets',validAssets,
  'All emitted Angular CSS/JS is recorded and content-hashed'));
 results.push(check('no-legacy-entry-in-angular-html',
  pagePaths.every(path=>{
   const html=siteIndex(siteRoot,path);
   return html.length>0&&!/react-entry\.js|website\/site\.mjs|\/assets\/site\.mjs/i.test(html);
  })&&
  angularBuilder.includes("src/site-rewrite/public/assets")&&
  !angularBuilder.includes("run(process.execPath,[resolve(root,'website/build.mjs')"),
  'Candidate uses its own canonical Angular assets, not legacy site entry scripts'));
 const noindex=pagePaths.every(path=>siteIndex(siteRoot,path).includes(
  '<meta name="robots" content="noindex,nofollow">'))&&
  file(resolve(siteRoot,'robots.txt')).includes('Disallow: /');
 results.push(check('preview-remains-noindex',noindex,
  'Pre-release artifact cannot be indexed by search engines'));
 const paymentsDisabled=donate.includes('disabled aria-disabled="true"')&&
  donate.includes('Indisponível nesta prévia')&&donate.includes("availability()==='sandbox-ready'");
 results.push(check('production-checkout-disabled',paymentsDisabled,
  'Production buttons are disabled while sandbox actions remain conditional'));
 const legacyIsLive=workflow.includes('npm run build:site')&&
  workflow.includes('npm run check:site')&&
  legacyBuilder.includes('out/site');
 const cleanIsLive=workflow.includes('npm run build:site:clean')&&
  workflow.includes('npm run check:site:clean')&&
  !workflow.includes('npm run build:site\n');
 results.push(check('active-deploy-identified',legacyIsLive||cleanIsLive,
  'Identify the actual CI production site builder, not an unused candidate'));
 if(legacyIsLive)blockers.push(block('legacy-deployment',
  'Cloudflare Pages workflow still publishes out/site via website/build.mjs'));
 if(!cleanIsLive&&!legacyIsLive)blockers.push(block('deployment-unverified',
  'Production workflow does not prove that out/site-clean-angular is published'));
 if(noindex)blockers.push(block('seo-noindex',
  'Candidate deliberately uses noindex,nofollow until SEO and public metadata sign-off'));
 if(app.includes('Versão Angular em revisão')||
    app.includes('Esta política não substitui a publicada atualmente'))
  blockers.push(block('legal-review',
   'Angular terms/privacy still carry draft notices requiring editorial/legal approval'));
 if(paymentsDisabled)blockers.push(block('production-payments',
  'Live payment buttons remain disabled; authenticated checkout parity is not released'));
 blockers.push(block('manual-acceptance',
  'Physical Android/browser, live Firebase/save parity, payment provider and rollout/CDN validation require explicit sign-off'));
 for(const item of results.filter(r=>!r.passed))
  blockers.push(block('failed-'+item.id,'Missing or invalid evidence: '+item.detail));
 return Object.freeze({
  schemaVersion:1,
  candidate:'out/site-clean-angular',
  deployedBy:legacyIsLive?'legacy-out/site':cleanIsLive?'angular-out/site-clean-angular':'unknown',
  status:'not-ready',
  checks:results,
  blockers
 });
}

const invoked=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(invoked){
 const repoRoot=resolve(import.meta.dirname,'../../..');
 const siteRoot=resolve(import.meta.dirname,'../out/site-clean-angular');
 const report=auditCleanAngularCutover({repoRoot,siteRoot});
 const path=resolve(import.meta.dirname,'../out/site-clean-angular-browser/cutover-readiness.json');
 mkdirSync(resolve(import.meta.dirname,'../out/site-clean-angular-browser'),{recursive:true});
 writeFileSync(path,JSON.stringify(report,null,2)+'\n');
 console.log('Angular release readiness:',report.status);
 console.log('Deployed site:',report.deployedBy);
 console.log('Evidence:',report.checks.filter(x=>x.passed).length+'/'+report.checks.length);
 for(const blocker of report.blockers)console.log('BLOCKER '+blocker.id+': '+blocker.reason);
 console.log('Report:',path);
 if(report.checks.some(x=>!x.passed))process.exitCode=1;
}
