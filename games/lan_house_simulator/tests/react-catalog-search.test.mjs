import test from "node:test";
import assert from "node:assert/strict";
import {normalizeCatalogSearch,catalogSearchMatch} from "../src/react/catalogSearch.mjs";

test("search normalizes Brazilian accents, case and whitespace",()=>{
 assert.equal(normalizeCatalogSearch("  VÍDEO  GAMES  "),"video games");
 assert.equal(normalizeCatalogSearch("Peças e Configuração"),"pecas e configuracao");
 assert.ok(catalogSearchMatch("impressora",["Impressora térmica","Serviços de impressão"]));
 assert.ok(catalogSearchMatch("copia",["Copiadora","Cópias de CD / DVD"]));
 assert.ok(catalogSearchMatch("PLayStation",["Bancada PlayStation 2","Televisão"]));
 assert.ok(!catalogSearchMatch("impressora",["Bancada PS2","Jogo de futebol"]));
 assert.ok(catalogSearchMatch("",["Qualquer item"]));
});
