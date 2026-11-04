import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');

test('Contato is rendered by one standalone Angular component with no duplicate site owner',()=>{
 const app=read('../frontend-angular/src/site-rewrite/site-app.ts');
 const page=read('../frontend-angular/src/site-rewrite/site-app.html');
 const component=read('../frontend-angular/src/site-rewrite/contact.ts');
 const html=read('../frontend-angular/src/site-rewrite/contact.html');
 const styles=read('../frontend-angular/src/site-rewrite/site.css');
 assert.match(app,/import \{ContactComponent\} from '\.\/contact'/);
 assert.match(app,/imports:\[[^\]]*ContactComponent/);
 assert.match(page,/@case\('\/contato\/'\)\s*\{\s*<lhs-contact><\/lhs-contact>\s*\}/);
 assert.equal((page.match(/<lhs-contact>/g)||[]).length,1);
 assert.doesNotMatch(page,/mailto:|class="contact-card"/);
 assert.match(component,/selector:'lhs-contact'/);
 assert.match(component,/ChangeDetectionStrategy\.OnPush/);
 assert.match(component,/templateUrl:'\.\/contact\.html'/);
 assert.equal((html.match(/<h1\b/g)||[]).length,1);
 assert.equal((html.match(/class="contact-card"/g)||[]).length,2);
 assert.match(styles,/\.contact-grid\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(styles,/@media\(max-width:800px\)\{\.contact-grid\{grid-template-columns:1fr\}\}/);
 assert.doesNotMatch(component+html,/<form\b|<script\b|<iframe\b|\[innerHTML\]|fetch\(|window\.open|onclick=|website\/|react-entry/i);
});

test('Contato keeps configured private support email and functional help/privacy routes',()=>{
 const html=read('../frontend-angular/src/site-rewrite/contact.html');
 const config=read('../website/config.mjs');
 const configuredEmail=config.match(/\bemail:\s*"([^"]+)"/)?.[1];
 assert.ok(configuredEmail,'The published contact config must identify the email');
 assert.equal((html.match(/href="mailto:/g)||[]).length,1);
 assert.ok(html.includes('href="mailto:'+configuredEmail+'"'),'Contact email changed without site config');
 for(const route of ['/ajuda/','/dados/','/privacidade/'])
  assert.equal((html.match(new RegExp('href="'+route+'"','g'))||[]).length,1,
   'Missing or duplicate Contact route '+route);
 for(const text of ['Problemas e sugestões','Suporte privado e privacidade',
  'etapas para reproduzir','Não compartilhe senhas',
  'controles de dados locais','política de privacidade'])
  assert.ok(html.includes(text),'Missing support guidance '+text);
 assert.doesNotMatch(html,/action=|<input\b|<textarea\b|data-collect=/i);
});
