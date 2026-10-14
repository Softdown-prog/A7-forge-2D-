import assert from "node:assert/strict";
import {existsSync,readFileSync,readdirSync,statSync} from "node:fs";
import {resolve,dirname,extname,relative} from "node:path";
import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";
const root=resolve(import.meta.dirname,"../out/site");
const walk=p=>readdirSync(p).flatMap(n=>{const f=resolve(p,n);return statSync(f).isDirectory()?walk(f):[f];});
const files=walk(root),html=files.filter(f=>extname(f)===".html"),titles=new Set();let references=0;
const header=readFileSync(resolve(root,"_headers"),"utf8");
for(const file of html){
 const source=readFileSync(file,"utf8"),name=relative(root,file),site=!name.startsWith("game/");
 assert.match(source,/<html lang="pt-BR"/);assert.match(source,/name="viewport"/);
 if(site){
  assert.equal((source.match(/<h1\b/g)??[]).length,1,name+" deve ter um h1");
  assert.match(source,/id="conteudo"/);assert.match(source,/Pular para o conteúdo/);
  const title=source.match(/<title>(.*?)<\/title>/s)?.[1];assert.ok(title&&!titles.has(title),"Título único: "+name);titles.add(title);
  const ids=[...source.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,"IDs duplicados: "+name);
  const structured=source.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)?.[1];assert.ok(structured);assert.equal(JSON.parse(structured).inLanguage,"pt-BR");
  assert.ok(header.includes("'sha256-"+createHash("sha256").update(structured).digest("base64")+"'"),"JSON-LD autorizado por CSP");
  assert.ok(!/<(?:img|iframe|script)[^>]+(?:src|href)="https?:/i.test(source),"Recursos externos automáticos: "+name);
  for(const img of source.matchAll(/<img\b[^>]*>/g)){assert.match(img[0],/\balt="/);assert.match(img[0],/\bwidth="\d+"/);assert.match(img[0],/\bheight="\d+"/);}
 }
 for(const match of source.matchAll(/\b(?:href|src|data-src)="([^"]+)"/g)){
  const raw=match[1];if(/^(https?:|mailto:|data:|blob:)/.test(raw))continue;
  const u=new URL(raw,"https://local.test/"+name),path=resolve(root,"."+decodeURIComponent(u.pathname));
  assert.ok(path===root||path.startsWith(root+"/"));const target=existsSync(path)&&statSync(path).isDirectory()?resolve(path,"index.html"):path;
  assert.ok(existsSync(target),name+" → recurso inexistente "+raw);references++;
  if(u.hash){const text=readFileSync(target,"utf8"),id=decodeURIComponent(u.hash.slice(1));assert.ok(new RegExp('\\bid="'+id.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+'"').test(text),"Âncora inválida: "+raw);}
 }
}
for(const file of files.filter(f=>[".js",".mjs"].includes(extname(f)))){
 execFileSync(process.execPath,["--check",file],{stdio:"pipe"});
 for(const m of readFileSync(file,"utf8").matchAll(/(?:from\s*|import\s*\()\s*["'](\.[^"']+)["']/g))assert.ok(existsSync(resolve(dirname(file),m[1])),"Import inexistente: "+m[1]);
}
const play=readFileSync(resolve(root,"jogar/index.html"),"utf8");
assert.match(play,/<iframe[^>]*data-src="\/game\/"[^>]*hidden/);assert.ok(!/<iframe[^>]*\ssrc=/.test(play),"Jogo deve aguardar clique");
assert.ok(statSync(resolve(root,"assets/sala.webp")).size<100_000,"Imagem da home deve ter menos de 100 KB");
assert.ok(!readFileSync(resolve(root,"assets/site.mjs"),"utf8").includes("localStorage.clear"));
console.log(JSON.stringify({pages:titles.size,htmlFiles:html.length,localReferences:references,modules:files.filter(f=>[".js",".mjs"].includes(extname(f))).length,heroBytes:statSync(resolve(root,"assets/sala.webp")).size}));
