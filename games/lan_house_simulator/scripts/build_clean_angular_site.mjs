/** Independent Angular site artifact. No production deploy and no legacy website/build.mjs. */
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {cpSync,existsSync,mkdirSync,readFileSync,readdirSync,rmSync,writeFileSync} from 'node:fs';
import {resolve,dirname,extname} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const angular=resolve(root,'frontend-angular');
const output=resolve(root,'out/site-clean-angular');
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
const paths=['','jogar','sobre-o-jogo','sobre-nos','ajuda','contato',
 'conta','conta/confirmar','donate','termos','privacidade','dados'];
for(const path of paths){
 const dir=resolve(output,path);
 mkdirSync(dir,{recursive:true});
 writeFileSync(resolve(dir,'index.html'),index);
}
writeFileSync(resolve(output,'404.html'),index);
writeFileSync(resolve(output,'robots.txt'),'User-agent: *\nDisallow: /\n');
writeFileSync(resolve(output,'_headers'),[
 '/*','  X-Content-Type-Options: nosniff',
 '  Referrer-Policy: strict-origin-when-cross-origin',
 "  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'self'",
 '  Cache-Control: no-cache, must-revalidate',
 '/assets/*','  Cache-Control: no-cache, must-revalidate',
 '/game/*','  Cache-Control: no-cache, must-revalidate',''].join('\n'));
const modules=readdirSync(resolve(output,'assets/site')).filter(file=>
 ['.js','.mjs'].includes(extname(file)));
for(const name of modules)assert.doesNotMatch(
 readFileSync(resolve(output,'assets/site',name),'utf8'),
 /react-entry\.js|website\/site\.mjs|alpine\.js|bootstrap\.min\.js/i);
console.log('Isolated Angular site built, NOT deployed:',output);
