import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');

test('Terms and Privacy retain 21 sections and a single Angular document owner',()=>{
 const legal=read('../frontend-angular/src/site-rewrite/legal-content.ts');
 const page=read('../frontend-angular/src/site-rewrite/site-app.html');
 const app=read('../frontend-angular/src/site-rewrite/site-app.ts');
 const owner=read('../frontend-angular/src/site-rewrite/legal-document.ts');
 const template=read('../frontend-angular/src/site-rewrite/legal-document.html');
 const css=read('../frontend-angular/src/site-rewrite/site.css');
 const browser=read('../scripts/verify_clean_angular_site.mjs');
 assert.equal((legal.match(/"id":/g)||[]).length,21);
 for(const id of ['projeto','acesso','donate','direitos','responsavel',
  'seguranca','menores','atualizacoes'])
  assert.ok(legal.includes('"id": "'+id+'"'),id);
 assert.ok(legal.includes('Lei Geral de Proteção de Dados Pessoais'));
 assert.doesNotMatch(legal,/innerHTML|website\/content.mjs/);
 assert.match(app,/import \{LegalDocumentComponent\} from '\.\/legal-document'/);
 assert.match(app,/imports:\[[^\]]*LegalDocumentComponent/);
 assert.doesNotMatch(app,/legalSections|termsSections|privacySections/);
 assert.match(page,/@if\(path==='\/termos\/'\|\|path==='\/privacidade\/'\)\{\s*<lhs-legal-document \[path\]="path"><\/lhs-legal-document>/);
 assert.equal((page.match(/<lhs-legal-document\b/g)||[]).length,1);
 assert.doesNotMatch(page,/class="wrap legal-grid"|class="legal-index"|class="legal-body"|legalSections/);
 assert.match(page,/Versão Angular em revisão/);
 assert.doesNotMatch(page,/Conteúdo integral pendente de migração/);
 assert.match(owner,/selector:'lhs-legal-document'/);
 assert.match(owner,/ChangeDetectionStrategy\.OnPush/);
 assert.match(owner,/readonly path=input\.required<SitePath>\(\)/);
 assert.match(owner,/readonly sections=computed\(\(\)=>this\.path\(\)==='\/termos\/'\?termsSections:privacySections\)/);
 assert.doesNotMatch(owner,/styles:\s*\[|innerHTML|fetch\(|document\.|window\.|website\/|react/i);
 assert.equal((template.match(/@for\(item of sections\(\);track item\.id\)/g)||[]).length,2);
 assert.match(template,/\[attr\.aria-labelledby\]/);
 assert.match(template,/\[href\]="path\(\)\+'#'\+item\.id"/);
 assert.match(template,/<aside class="legal-index">/);
 assert.match(template,/<article class="legal-body"/);
 assert.equal((template.match(/class="wrap legal-grid"/g)||[]).length,1);
 assert.match(css,/lhs-legal-document\{display:block\}/);
 assert.match(css,/@media\(max-width:520px\)/);
 assert.ok(browser.includes("'/termos/','/privacidade/'"));
 assert.ok(browser.includes('const expected=terms?10:11'));
 assert.ok(browser.includes("location.hash==='#'+id&&location.pathname===pathname"));
 assert.ok(browser.includes("page.reload({waitUntil:'networkidle'})"));
});

test('legal document has no iframe, scripts or duplicate payment/game state',()=>{
 const app=read('../frontend-angular/src/site-rewrite/site-app.html');
 const document=read('../frontend-angular/src/site-rewrite/legal-document.html');
 assert.match(app,/@case\('\/conta\/'\)/);
 assert.match(app,/@case\('\/donate\/'\)/);
 assert.match(app,/@case\('\/jogar\/'\)/);
 assert.doesNotMatch(document,/<iframe|<script|\[innerHTML\]|onclick=/i);
});
