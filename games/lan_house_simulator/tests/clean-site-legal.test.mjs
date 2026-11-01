import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(path)=>readFileSync(new URL(path,import.meta.url),'utf8');
test('Terms and Privacy are independent Angular-owned pages',()=>{
 const legal=read('../frontend-angular/src/site-rewrite/legal-content.ts');
 const template=read('../frontend-angular/src/site-rewrite/site-app.html');
 const app=read('../frontend-angular/src/site-rewrite/site-app.ts');
 const css=read('../frontend-angular/src/site-rewrite/site.css');
 const browser=read('../scripts/verify_clean_angular_site.mjs');
 assert.equal((legal.match(/"id":/g)||[]).length,21);
 for(const id of ['projeto','acesso','donate','direitos','responsavel',
   'seguranca','menores','atualizacoes'])
  assert.ok(legal.includes('"id": "'+id+'"'),id);
 assert.ok(legal.includes('Lei Geral de Proteção de Dados Pessoais'));
 assert.ok(!legal.includes('innerHTML') && !legal.includes('website/content.mjs'));
 assert.ok(app.includes("import {termsSections,privacySections} from './legal-content'"));
 assert.ok(template.includes('@for(item of legalSections;track item.id)'));
 assert.ok(template.includes('[attr.aria-labelledby]'));
 assert.ok(template.includes('[href]="\'#\'+item.id"'));
 assert.ok(template.includes('Versão Angular em revisão'));
 assert.ok(!template.includes('Conteúdo integral pendente de migração'));
 assert.ok(css.includes('.legal-grid')&&css.includes('@media(max-width:520px)'));
 assert.ok(browser.includes("'/termos/','/privacidade/'"));
 assert.ok(browser.includes('const expected=terms?10:11'));
 assert.ok(browser.includes("location.hash==='#'+id"));
 assert.ok(browser.includes("page.reload({waitUntil:'networkidle'})"));
});
