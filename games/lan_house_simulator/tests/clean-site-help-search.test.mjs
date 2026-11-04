import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../frontend-angular/src/site-rewrite');
const read=name=>readFileSync(resolve(root,name),'utf8');

test('Ajuda uses exactly one Angular standalone owner for FAQ state and HTML',()=>{
 const app=read('site-app.ts'),page=read('site-app.html');
 const component=read('help-search.ts'),markup=read('help-search.html');
 assert.match(app,/import \{HelpSearchComponent\} from '\.\/help-search'/);
 assert.match(app,/imports:\[[^\]]*HelpSearchComponent/);
 assert.match(page,/@case\('\/ajuda\/'\)\s*\{[\s\S]*?<lhs-help-search><\/lhs-help-search>/);
 assert.equal((page.match(/<lhs-help-search>/g)||[]).length,1);
 assert.doesNotMatch(app,/readonly query|readonly matched|changeQuery\(|clearQuery\(|normalizeSearch|\bfaq\b/);
 assert.doesNotMatch(page,/id="help-search"|matched\(\)|changeQuery\(|clearQuery\(/);
 assert.match(component,/selector:'lhs-help-search'/);
 assert.match(component,/ChangeDetectionStrategy\.OnPush/);
 assert.match(component,/readonly query=signal\(''\)/);
 assert.match(component,/readonly matched=computed\(/);
 assert.match(markup,/id="help-search"/);
 assert.match(markup,/role="status" aria-live="polite"/);
 assert.match(markup,/Nenhuma resposta encontrada/);
 assert.equal((markup.match(/id="help-search"/g)||[]).length,1);
});
test('Angular FAQ handles normalized queries, clear focus, semantic answers and no remote fetch',()=>{
 const component=read('help-search.ts'),html=read('help-search.html');
 assert.match(component,/normalizeSearch\(this\.query\(\)\)/);
 assert.match(component,/normalizeSearch\(question\+' '\+answer\)/);
 assert.match(component,/input\.focus\(\)/);
 assert.match(html,/\(input\)="changeQuery\(\$event\)"/);
 assert.match(html,/\(click\)="clearQuery\(searchBox\)"/);
 assert.match(html,/<details><summary>/);
 assert.doesNotMatch(component,/fetch\(|localStorage|document\.querySelector|innerHTML|website\/|react/);
});

test('FAQ preserves seven fully documented help answers without depending on legacy scripts',()=>{
 const source=read('site-data.ts');
 const raw=source.match(/export const faq=(\[[\s\S]*?\]) as const;/)?.[1];
 assert.ok(raw,'FAQ must be a standalone constant with literal, auditable answers');
 const faq=JSON.parse(raw);
 assert.equal(faq.length,7);
 assert.equal(new Set(faq.map(item=>item[0])).size,7,'No duplicated questions');
 for(const item of faq){
  assert.equal(item.length,2);
  assert.ok(item.every(s=>typeof s==='string'&&s.length>15));
 }
 const all=faq.map(item=>item[1]).join(' ');
 for(const detail of [
  'Loja Cookies','saves na nuvem','Não há assinatura obrigatória',
  'aparelho na horizontal','JavaScript e Canvas 2D',
  'Salvar em arquivo','Carregar arquivo','outro aparelho',
  'placa de vídeo e monitor','não promete ganhos reais',
  'não envie documentos ou dados pessoais'
 ])assert.ok(all.includes(detail),'Missing essential FAQ instruction: '+detail);
 // Import isolation is enforced by the TypeScript AST gate, not prose comments.
 assert.doesNotMatch(source,/^\s*(?:import|export)\s+.*(?:website\/|content\.mjs)/m);
});

test('first-day and save-transfer guide retains navigable anchors and privacy warnings',()=>{
 const html=read('help-search.html'),css=read('site.css');
 for(const anchor of ['comecar','salvar','duvidas']){
  assert.match(html,new RegExp('id="'+anchor+'"'));
  assert.equal((html.match(new RegExp('id="'+anchor+'"','g'))||[]).length,1);
  assert.match(html,new RegExp('href="/ajuda/#'+anchor+'"'));
 }
 for(const detail of [
  'Seu primeiro dia','Abra Administrar','Use Compras',
  'Salvar e levar para outro aparelho','Carregar arquivo',
  'A importação substitui a partida atual','Não abra saves de origem desconhecida',
  'Navegação privada','/conta/'
 ])assert.ok(html.includes(detail),'Lost institutional help guidance: '+detail);
 // Root base href makes fragment-only links resolve to the homepage.
 assert.doesNotMatch(html,/href="#(?:comecar|salvar|duvidas)"/);
 assert.match(html,/aria-label="Neste guia"/);
 assert.match(html,/class="wrap faq" id="duvidas"/);
 assert.match(css,/\.help-guide article\{scroll-margin-top:/);
 assert.match(css,/#duvidas\{scroll-margin-top:/);
 assert.doesNotMatch(html,/<script|\[innerHTML\]|onclick=|website\/|react-entry/i);
});
