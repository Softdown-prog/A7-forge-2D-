import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeHelpText,matchesHelpQuery} from "../website/help-search.mjs";
import {pages} from "../website/content.mjs";

test("pesquisa ignora acentos, caixa, pontuação e ordem de palavras",()=>{
 assert.equal(normalizeHelpText("CÓPIAS, Save / PS2"),"copias save ps2");
 assert.ok(matchesHelpQuery("Salvar em arquivo JSON e continuar sua partida","PARTIDA salvar"));
 assert.ok(matchesHelpQuery("Compra de mídias PS2: cópias","cópias PS2"));
 assert.ok(matchesHelpQuery("Windows 98 e CRT",""));
 assert.ok(!matchesHelpQuery("Como comprar CDs PS1","sem internet"));
});
test("a busca é exclusiva da ajuda e mantém perguntas legíveis sem JavaScript",()=>{
 const sitePages=pages({studio:"Softdown",email:null});
 const help=sitePages.find(page=>page.path==="ajuda");
 const home=sitePages.find(page=>page.path==="");
 assert.ok(help&&home);
 assert.match(help.body,/id="help-search" type="search"/);
 assert.match(help.body,/id="help-search-results"[^>]+role="status"/);
 assert.match(help.body,/id="help-questions"/);
 assert.match(help.body,/id="help-search-tools" hidden/);
 assert.match(help.body,/<details><summary>/);
 assert.doesNotMatch(home.body,/id="help-search"/);
});
test("o build inclui o helper versionado e não expõe serviço remoto de busca",()=>{
 const build=readFileSync(new URL("../website/build.mjs",import.meta.url),"utf8");
 const site=readFileSync(new URL("../website/site.mjs",import.meta.url),"utf8");
 assert.match(build,/website\/help-search\.mjs/);
 assert.match(site,/import \{matchesHelpQuery\} from "\.\/help-search\.mjs"/);
 assert.match(site,/helpInput\.addEventListener\("input",refresh\)/);
 assert.match(site,/document\.addEventListener\("pointerdown"/);
 assert.doesNotMatch(site,/fetch\(|XMLHttpRequest/);
});
