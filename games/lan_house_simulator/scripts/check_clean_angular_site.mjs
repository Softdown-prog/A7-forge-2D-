import assert from 'node:assert/strict';
import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(process.env.LHS_SITE_ROOT??resolve(import.meta.dirname,'../out/site-clean-angular'));
const assets=JSON.parse(readFileSync(resolve(root,'angular-site-assets.json'),'utf8'));
const metadata=JSON.parse(readFileSync(resolve(import.meta.dirname,
 '../frontend-angular/src/site-rewrite/page-metadata.json'),'utf8'));
const guideCatalog=JSON.parse(readFileSync(resolve(import.meta.dirname,'../frontend-angular/src/site-rewrite/game-guides/guide-catalog.json'),'utf8'));const guidePaths=guideCatalog.map(item=>'sobre-o-jogo/guias/'+item.id+'-'+item.slug);for(const path of ['','jogar','sobre-o-jogo',...guidePaths,'sobre-nos','ajuda','contato','conta',
 'conta/confirmar','donate','termos','privacidade','dados']){
 const html=readFileSync(resolve(root,path,'index.html'),'utf8');
 assert.match(html,/<lhs-site(?: data-lhs-public-prerender="true")?><\/lhs-site>|<lhs-site data-lhs-public-prerender="true">/);
 assert.ok(html.includes('src="/assets/site/'+assets.main+'"'));
 assert.ok(html.includes('href="/assets/site/'+assets.styles+'"'));
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
assert.match(assets.main,/^main-[a-z0-9]{6,}\.js$/i);
assert.match(assets.styles,/^styles-[a-z0-9]{6,}\.css$/i);
const expected=new Set(assets.files);
assert.ok(expected.has(assets.main)&&expected.has(assets.styles));
const actual=readdirSync(resolve(root,'assets/site')).filter(x=>/\.(js|css)$/.test(x));
assert.deepEqual(actual.sort(),assets.files,'Every emitted JS/CSS must be content-hashed');
for(const name of assets.files)assert.ok(existsSync(resolve(root,'assets/site',name)));
assert.ok(!existsSync(resolve(root,'assets/site/main.js')));
assert.ok(!existsSync(resolve(root,'assets/site/styles.css')));
const headers=readFileSync(resolve(root,'_headers'),'utf8');
for(const name of assets.files)assert.ok(headers.includes(
 '/assets/site/'+name+'\n  Cache-Control: public, max-age=31536000, immutable'));
for(const path of ['/', '/donate/', '/conta/'])
 assert.ok(headers.includes(path+'\n  Cache-Control: no-cache, must-revalidate'));
for(const path of ['/account-config.json','/online-config.json'])
 assert.ok(headers.includes(path+'\n  Cache-Control: no-store'));
assert.doesNotMatch(headers,/\/assets\/\*|\/assets\/site\/\*/);
assert.match(readFileSync(resolve(root,'_headers'),'utf8'),/no-cache, must-revalidate/);
console.log('Clean Angular site: independent HTML, assets and routes verified');
