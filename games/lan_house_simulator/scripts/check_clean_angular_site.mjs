import assert from 'node:assert/strict';
import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../out/site-clean-angular');
const metadata=JSON.parse(readFileSync(resolve(import.meta.dirname,
 '../frontend-angular/src/site-rewrite/page-metadata.json'),'utf8'));
for(const path of ['','jogar','sobre-o-jogo','sobre-nos','ajuda','contato','conta',
 'conta/confirmar','donate','termos','privacidade','dados']){
 const html=readFileSync(resolve(root,path,'index.html'),'utf8');
 assert.match(html,/<lhs-site><\/lhs-site>/);
 assert.match(html,/src="\/assets\/site\/main\.js"/);
 assert.match(html,/href="\/assets\/site\/styles\.css"/);
 assert.doesNotMatch(html,/\/assets\/site\.mjs|react-entry|data-angular-site-/i);
 const pathname=path?'/'+path+'/':'/';
 assert.equal(html.includes('<title>'+metadata[pathname].title+' · Lan House Simulator</title>'),true,
  'Wrong static title for '+pathname);
 assert.equal(html.includes('<meta name="description" content="'+metadata[pathname].description+'">'),true,
  'Wrong static description for '+pathname);
 assert.match(html,/<meta name="robots" content="noindex,nofollow">/);
 assert.match(html,/<meta property="og:type" content="website">/);
 assert.equal((html.match(/<meta name="description"/g)||[]).length,1);
}
const notFound=readFileSync(resolve(root,'404.html'),'utf8');
assert.ok(notFound.includes('<title>'+metadata['/404/'].title+' · Lan House Simulator</title>'));
assert.match(notFound,/<meta name="robots" content="noindex,nofollow">/);
assert.match(readFileSync(resolve(root,'conta/confirmar/index.html'),'utf8'),
 /<meta name="referrer" content="no-referrer">/);
assert.ok(existsSync(resolve(root,'game/__angular/main.js')));
assert.ok(!existsSync(resolve(root,'game/js/react-entry.js')));
for(const name of ['brand.svg','icons.svg','sala.webp',
 'pc-crt.svg','pc-lcd.svg','pc-led.svg','pc-arena.svg'])
 assert.ok(existsSync(resolve(root,'assets',name)),'Missing Angular site asset: '+name);
assert.match(readFileSync(resolve(root,'robots.txt'),'utf8'),/Disallow: \//);
assert.ok(readdirSync(resolve(root,'assets/site')).includes('main.js'));
assert.match(readFileSync(resolve(root,'_headers'),'utf8'),/no-cache, must-revalidate/);
console.log('Clean Angular site: independent HTML, assets and routes verified');
