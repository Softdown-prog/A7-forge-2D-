/** Static no-JS snapshot integrity; called only after prerender_clean_angular_site.mjs. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const output=resolve(process.env.LHS_SITE_ROOT??resolve(import.meta.dirname,'../out/site-clean-angular'));
const manifest=JSON.parse(readFileSync(resolve(output,'angular-prerender-manifest.json'),'utf8'));
const assets=JSON.parse(readFileSync(resolve(output,'angular-site-assets.json'),'utf8'));
assert.equal(manifest.method,'isolated-chromium-public-snapshot');
const guideCatalog=JSON.parse(readFileSync(resolve(import.meta.dirname,'../frontend-angular/src/site-rewrite/game-guides/guide-catalog.json'),'utf8'));const guidePages=guideCatalog.map(item=>item.path);assert.deepEqual(manifest.paths,['/','/jogar/','/sobre-o-jogo/',...guidePages,'/sobre-nos/',
 '/ajuda/','/contato/','/termos/','/privacidade/']);
assert.deepEqual(manifest.excluded,['/conta/','/conta/confirmar/','/donate/','/dados/']);
assert.equal(manifest.notFound,true);
for(const path of [...manifest.paths,'/404/']){
 const html=readFileSync(path==='/404/'?resolve(output,'404.html'):resolve(output,'.'+path,'index.html'),'utf8');
 assert.match(html,/<lhs-site data-lhs-public-prerender="true">/);
 assert.equal((html.match(/<main\b/g)||[]).length,1,'Main missing/duplicated: '+path);
 assert.equal((html.match(/<header\b/g)||[]).length,1,'Header missing/duplicated: '+path);
 assert.equal((html.match(/<footer\b/g)||[]).length,1,'Footer missing/duplicated: '+path);
 assert.equal((html.match(/<h1\b/g)||[]).length,1,'H1 missing/duplicated: '+path);
 assert.match(html,/<meta name="robots" content="noindex,nofollow">/);
 assert.ok(html.includes('src="/assets/site/'+assets.main+'"'));
 assert.ok(html.includes('href="/assets/site/'+assets.styles+'"'));
 assert.doesNotMatch(html,/react-entry\.js|website\/site\.mjs/i);
}
for(const path of manifest.excluded){
 const html=readFileSync(resolve(output,'.'+path,'index.html'),'utf8');
 assert.match(html,/<lhs-site><\/lhs-site>/,'Nonpublic route must remain CSR: '+path);
 assert.doesNotMatch(html,/data-lhs-public-prerender/);
}
console.log('Angular public prerender verified (no private routes included)');
