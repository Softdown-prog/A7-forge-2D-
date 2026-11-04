import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');

test('one standalone Angular owner per About route; no legacy bundle or duplicated timeline',()=>{
 const app=read('../frontend-angular/src/site-rewrite/site-app.ts');
 const page=read('../frontend-angular/src/site-rewrite/site-app.html');
 const game=read('../frontend-angular/src/site-rewrite/about-game.ts');
 const us=read('../frontend-angular/src/site-rewrite/about-us.ts');
 const gameHtml=read('../frontend-angular/src/site-rewrite/about-game.html');
 const usHtml=read('../frontend-angular/src/site-rewrite/about-us.html');
 for(const [name,filename,source] of [
  ['AboutGameComponent','about-game',game],['AboutUsComponent','about-us',us]
 ]){
  assert.ok(app.includes("import {"+name+"} from './"+filename+"'"));
  assert.ok(app.includes(name+',EraTimelineComponent') || app.includes(name+','));
  assert.match(source,/ChangeDetectionStrategy\.OnPush/);
  assert.ok(source.includes("templateUrl:'./"+filename+".html'"));
 }
 assert.ok(page.includes("<lhs-about-game></lhs-about-game>"));
 assert.ok(page.includes("<lhs-about-us></lhs-about-us>"));
 assert.equal((page.match(/<lhs-about-game>/g)||[]).length,1);
 assert.equal((page.match(/<lhs-about-us>/g)||[]).length,1);
 assert.ok(page.includes("@if(path==='/'||path==='/sobre-o-jogo/')"));
 assert.equal((page.match(/<lhs-era-timeline><\/lhs-era-timeline>/g)||[]).length,1);
 assert.equal((gameHtml.match(/<h1\b/g)||[]).length,1);
 assert.equal((usHtml.match(/<h1\b/g)||[]).length,1);
 const forbidden=/<script\b|<iframe\b|\[innerHTML\]|fetch\(|onclick=|website\/|react-entry|<lhs-era-timeline/i;
 assert.doesNotMatch(game+gameHtml+us+usHtml,forbidden);
});

test('About game retains all six core experiences, canonical image and game CTA',()=>{
 const html=read('../frontend-angular/src/site-rewrite/about-game.html');
 assert.equal((html.match(/class="about-feature"/g)||[]).length,6);
 for(const title of [
  'Administração','Cada PC tem uma história','Anos que abrem possibilidades',
  'Comércio no balcão','Um salão para crescer','Sua partida vai com você'
 ])assert.ok(html.includes('<h3>'+title+'</h3>'),'Missing game feature '+title);
 for(const text of ['1998','três PCs','receita por estação','placa-mãe',
  'Estoque, reposições','divisórias','Salve sua partida em arquivo'])
  assert.ok(html.includes(text),'Missing gameplay explanation '+text);
 assert.match(html,/<img class="about-salon" src="\/assets\/sala\.webp"[^>]*alt="[^"]+"/);
 assert.match(html,/href="\/game\/"/);
});

test('About us retains independent studio identity, truthful scope, and internal routes',()=>{
 const html=read('../frontend-angular/src/site-rewrite/about-us.html');
 const css=read('../frontend-angular/src/site-rewrite/site.css');
 for(const text of [
  'Softdown é um projeto independente','Terminal de Bairro','desenho procedural',
  'experiência individual','progresso local','não estão incluídos',
  'Feito para quem viveu essa época'
 ])assert.ok(html.includes(text),'Missing studio information '+text);
 for(const dest of ['/contato/','/sobre-o-jogo/','/game/'])
  assert.equal((html.match(new RegExp('href="'+dest+'"','g'))||[]).length,1);
 assert.match(html,/<img src="\/assets\/brand\.svg" alt="Marca Softdown"/);
 assert.match(css,/\.about-feature-grid\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(css,/@media\(max-width:700px\)\{\.about-story\{grid-template-columns:1fr\}/);
 const qa=read('../scripts/verify_clean_angular_site.mjs');
 assert.ok(qa.includes("'/sobre-nos/','/ajuda/'"));
 assert.ok(qa.includes("const features=page.locator('lhs-about-game .about-feature')"));
 assert.ok(qa.includes("page.locator('lhs-about-us')"));
});
