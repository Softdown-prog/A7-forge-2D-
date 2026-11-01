/** Independent Angular site artifact. No production deploy and no legacy website/build.mjs. */
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {cpSync,existsSync,mkdirSync,readFileSync,readdirSync,rmSync,writeFileSync} from 'node:fs';
import {resolve,dirname,extname} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const angular=resolve(root,'frontend-angular');
const output=resolve(root,'out/site-clean-angular');
const accountConfig=JSON.parse(readFileSync(resolve(root,'account-config.json'),'utf8'));
const accountApi=new URL(accountConfig.apiUrl);
assert.ok(accountApi.protocol==='https:'&&!accountApi.username&&!accountApi.password&&
 accountApi.pathname==='/'&&!accountApi.search&&!accountApi.hash,'Invalid configured account API origin');
const accountApiOrigin=accountApi.origin;
const npm=process.platform==='win32'?'npm.cmd':'npm';
function run(program,args,env=process.env){
 execFileSync(program,args,{cwd:root,stdio:'inherit',env});
}
if(!existsSync(resolve(angular,'node_modules/@angular/cli/package.json')))
 run(npm,['ci','--prefix','frontend-angular','--no-audit','--no-fund']);
run(process.execPath,[resolve(root,'scripts/build.mjs')],{...process.env,LHS_GAME_UI:'angular'});
run(npm,['run','build','--prefix','frontend-angular']);
run(process.execPath,[resolve(angular,'scripts/build_cutover_candidate.mjs')]);
run(npm,['run','build:site-rewrite','--prefix','frontend-angular']);
const compiled=resolve(angular,'dist/site-rewrite/browser');
let index=readFileSync(resolve(compiled,'index.html'),'utf8');
assert.match(index,/src="main\.js"/);
assert.match(index,/href="styles\.css"/);
index=index.replace('src="main.js"','src="/assets/site/main.js"')
 .replace('href="styles.css"','href="/assets/site/styles.css"');
assert.doesNotMatch(index,/website\/site\.mjs|react-entry\.js/);
rmSync(output,{recursive:true,force:true});
mkdirSync(resolve(output,'assets'),{recursive:true});
cpSync(compiled,resolve(output,'assets/site'),{recursive:true});
rmSync(resolve(output,'assets/site/index.html'),{force:true});
// All public assets for the new institutional site live inside Angular.
const siteAssetRoot=resolve(angular,'src/site-rewrite/public/assets');
const siteAssets=['brand.svg','icons.svg','sala.webp',
 'pc-crt.svg','pc-lcd.svg','pc-led.svg','pc-arena.svg'];
for(const name of siteAssets){
 const source=resolve(siteAssetRoot,name);
 assert.ok(existsSync(source),'Missing canonical Angular site asset: '+name);
 const destination=resolve(output,'assets',name);
 mkdirSync(dirname(destination),{recursive:true});
 cpSync(source,destination);
}
cpSync(resolve(root,'out/angular-cutover-candidate'),resolve(output,'game'),{recursive:true});
rmSync(resolve(output,'game/angular-candidate-report.json'),{force:true});
assert.ok(!existsSync(resolve(output,'game/js/react-entry.js')));
for(const file of ['account-config.json','online-config.json'])
 cpSync(resolve(root,file),resolve(output,file));
const pageMetadata=JSON.parse(readFileSync(resolve(angular,'src/site-rewrite/page-metadata.json'),'utf8'));
const paths=['','jogar','sobre-o-jogo','sobre-nos','ajuda','contato',
 'conta','conta/confirmar','donate','termos','privacidade','dados'];
assert.equal(Object.keys(pageMetadata).length,paths.length+1,'Metadata coverage must match Angular routes including 404');
const escapeMeta=value=>value.replace(/&/g,'&amp;').replace(/"/g,'&quot;')
 .replace(/</g,'&lt;').replace(/>/g,'&gt;');
function pageHead(pathname){
 const data=pageMetadata[pathname];
 assert.ok(data&&typeof data.title==='string'&&typeof data.description==='string',
  'Missing Angular route metadata: '+pathname);
 const title=escapeMeta(data.title+' · Lan House Simulator');
 const description=escapeMeta(data.description);
 // Preview is deliberately non-indexable until full prerender, SEO review and cutover.
 const tags='<meta name="robots" content="noindex,nofollow">'+
  '<meta property="og:type" content="website">'+
  '<meta property="og:locale" content="pt_BR">'+
  '<meta property="og:title" content="'+title+'">'+
  '<meta property="og:description" content="'+description+'">'+
  '<meta name="twitter:card" content="summary">'+
  (pathname==='/conta/confirmar/'?'<meta name="referrer" content="no-referrer">':'');
 const html=index.replace(/<title>[^<]*<\/title>/i,'<title>'+title+'</title>')
  .replace(/<meta\s+name="description"[^>]*>/i,
   '<meta name="description" content="'+description+'">')
  .replace('<head>','<head>'+tags);
 assert.ok(html.includes('<title>'+title+'</title>')&&
  html.includes('<meta name="description" content="'+description+'">'),
  'Failed to replace static Angular route metadata: '+pathname);
 return html;
}
for(const path of paths){
 const dir=resolve(output,path);
 mkdirSync(dir,{recursive:true});
 writeFileSync(resolve(dir,'index.html'),pageHead(path?'/'+path+'/':'/'));
}
writeFileSync(resolve(output,'404.html'),pageHead('/404/'));
writeFileSync(resolve(output,'robots.txt'),'User-agent: *\nDisallow: /\n');
writeFileSync(resolve(output,'_headers'),[
 '/*','  X-Content-Type-Options: nosniff',
 '  Referrer-Policy: strict-origin-when-cross-origin',
 // Only explicitly configured authenticated service origins may receive connections.
 "  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com "+accountApiOrigin+"; frame-src 'self'; object-src 'none'; base-uri 'self'",
 '  Cache-Control: no-cache, must-revalidate',
 '/assets/*','  Cache-Control: no-cache, must-revalidate',
 '/game/*','  Cache-Control: no-cache, must-revalidate',''].join('\n'));
const modules=readdirSync(resolve(output,'assets/site')).filter(file=>
 ['.js','.mjs'].includes(extname(file)));
for(const name of modules)assert.doesNotMatch(
 readFileSync(resolve(output,'assets/site',name),'utf8'),
 /react-entry\.js|website\/site\.mjs|alpine\.js|bootstrap\.min\.js/i);
console.log('Isolated Angular site built, NOT deployed:',output);
