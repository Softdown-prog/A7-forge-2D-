import assert from 'node:assert/strict';
import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../out/site-clean-angular');
for(const path of ['','jogar','sobre-o-jogo','sobre-nos','ajuda','contato','conta',
 'conta/confirmar','donate','termos','privacidade','dados']){
 const html=readFileSync(resolve(root,path,'index.html'),'utf8');
 assert.match(html,/<lhs-site><\/lhs-site>/);
 assert.match(html,/src="\/assets\/site\/main\.js"/);
 assert.match(html,/href="\/assets\/site\/styles\.css"/);
 assert.doesNotMatch(html,/\/assets\/site\.mjs|react-entry|data-angular-site-/i);
}
assert.ok(existsSync(resolve(root,'game/__angular/main.js')));
assert.ok(!existsSync(resolve(root,'game/js/react-entry.js')));
assert.ok(existsSync(resolve(root,'assets/brand.svg')));
assert.match(readFileSync(resolve(root,'robots.txt'),'utf8'),/Disallow: \//);
assert.ok(readdirSync(resolve(root,'assets/site')).includes('main.js'));
assert.match(readFileSync(resolve(root,'_headers'),'utf8'),/no-cache, must-revalidate/);
console.log('Clean Angular site: independent HTML, assets and routes verified');
