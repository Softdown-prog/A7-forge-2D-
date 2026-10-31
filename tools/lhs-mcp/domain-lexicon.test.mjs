import test from "node:test";
import assert from "node:assert/strict";
import {queryTerms,contextFromSource,searchContext} from "./context-search.mjs";
test("LHS domain synonyms resolve to stable concepts",()=>{
 const pairs=[
  ["licenças de computadores",["license","computer"]],
  ["manutenção do PS2",["maintenance","ps2"]],
  ["carteiro e correspondência",["mail"]],
  ["reputação dos clientes",["reputation","customer"]],
  ["desgaste de equipamentos",["wear","hardware"]],
  ["estoque dos fornecedores",["stock","supplier"]],
  ["painel de configurações",["panel","settings"]],
  ["corujão madrugada",["night"]],
  ["fibra óptica",["network"]],
  ["cookies de doação",["cookie","donation"]],
  ["exportação importar partida",["transfer","load","save"]],
  ["controles do console PS1",["controls","console","ps1"]],
  ["desenhar cartões do catálogo",["render","card","catalog"]],
  ["arte do PS2",["art","ps2"]]
 ];
 for(const [query,wanted] of pairs){
  const actual=queryTerms(query);
  for(const term of wanted)assert.ok(actual.includes(term),query+" missing "+term+" got "+actual);
 }
});
test("source index matches natural Portuguese intents without leaking string literals",()=>{
 const content='// Manutenção das bancadas PS2 e desgaste por sessão.\n'+
 'export function maintainPs2Hardware() {}\n'+
 'const privateApiKey="NEVER-LEAK-XYZ";\n';
 const context=contextFromSource(content,".ts");
 const index={files:[{path:"games/lan_house_simulator/src/sim/consoleService.ts",
  ext:".ts",symbols:[{name:"maintainPs2Hardware",line:2,kind:"function"}],
  contextTerms:context.terms,contextHeadings:context.headings}]};
 const result=searchContext(index,"manutenção PS2",{limit:5});
 assert.equal(result.length,1);
 assert.equal(result[0].matchedTerms,2);
 assert.equal(JSON.stringify(context).includes("NEVER-LEAK-XYZ"),false);
});
