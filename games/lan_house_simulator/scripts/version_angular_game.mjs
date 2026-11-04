/** Package the unchanged Canvas module graph with one content revision. */
import {createHash} from 'node:crypto';
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
export function versionAngularGame(site){
 const game=resolve(site,'game');
 const compatibility=resolve(game,'__angular/compatibility.css');
 writeFileSync(compatibility,readFileSync(compatibility,'utf8')+'\n.menu-topline a.game-site-return{display:inline-flex;align-items:center;min-height:44px;padding:8px 10px;border:1px solid #718b76;border-radius:4px;font-size:10px;white-space:nowrap;flex-shrink:0;text-decoration:none}.menu-topline{gap:12px}\n');
 const walk=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(resolve(dir,e.name)):[resolve(dir,e.name)]);
 const hash=createHash('sha256');
 for(const file of [...walk(resolve(game,'js')),...walk(resolve(game,'__angular'))].sort())hash.update(readFileSync(file));
 hash.update(readFileSync(resolve(game,'style.css')));
 const revision=hash.digest('hex').slice(0,12);
 for(const file of walk(resolve(game,'js')).filter(name=>/\.m?js$/.test(name))){
  writeFileSync(file,readFileSync(file,'utf8').replace(/(\b(?:from\s*|import\s*\(\s*|import\s*)["'])(\.\.?\/[^"']+\.m?js)(["'])/g,
   (_,prefix,path,quote)=>prefix+path+'?v='+revision+quote));
 }
 const path=resolve(game,'index.html');
 let html=readFileSync(path,'utf8');
 html=html.replace(/(<script type="module" src="\.\/(?:js|__angular)\/[^"?]+\.js)(">)/g,
  (_,prefix,end)=>prefix+'?v='+revision+end);
 html=html.replace(/href="(\.\/(?:style\.css|__angular\/(?:styles|compatibility)\.css))"/g,
  (_,href)=>'href="'+href+'?v='+revision+'"');
 html=html.replace('<title>','<meta name="robots" content="noindex,nofollow"><title>');
 html=html.replace('<span class="edition-label">','<a class="edition-label game-site-return" href="/">← Voltar ao site</a><span class="edition-label">');
 writeFileSync(path,html);
 writeFileSync(resolve(game,'style.css'),readFileSync(resolve(game,'style.css'),'utf8')
  .replace('./assets/ui/salon-preview.webp','./assets/ui/salon-preview.webp?v='+revision));
 return revision;
}
