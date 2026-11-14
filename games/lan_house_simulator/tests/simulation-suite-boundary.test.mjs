import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const suites=[
 ["simulation.test.mjs",24,"preço alto reduz procura, rede offline reduz ainda mais"],
 ["simulation-customer-retail.test.mjs",13,"necessidades evoluem de forma independente e direcionam compras após sessão"],
 ["simulation-runtime-ui.test.mjs",11,"menu inicial impede autoplay e oferece partida, continuar e opções"],
 ["simulation-layout.test.mjs",15,"mapa amplia 10 tiles norte, leste e oeste; porta sul não muda"]
];

test("simulação conserva as quatro suítes por domínio, sem títulos duplicados ou perdidos",()=>{
 const titles=[];
 for(const [name,minimum,anchor] of suites){
  const source=readFileSync(new URL("./"+name,import.meta.url),"utf8");
  const own=[...source.matchAll(/^test\((["'])(.*?)\1/gm)].map(match=>match[2]);
  assert.ok(own.length>=minimum,name+" perdeu testes de regressão");
  assert.ok(own.includes(anchor),name+" mudou de domínio sem atualizar o contrato");
  titles.push(...own);
 }
 assert.equal(titles.length,new Set(titles).size,"testes duplicados entre suítes");
 assert.ok(titles.length>=63,"a divisão não pode excluir testes existentes");
});
