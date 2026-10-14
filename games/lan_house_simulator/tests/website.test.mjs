import test from "node:test";
import assert from "node:assert/strict";
import {deleteLocalData,DATA_KEYS} from "../website/data-controls.mjs";
import {validateConfig} from "../website/build.mjs";
test("controle de dados apaga somente a partida e preserva outras aplicações",()=>{
 const values=new Map([[DATA_KEYS.save,"partida"],[DATA_KEYS.sound,"off"],["outro-projeto","importante"]]);
 deleteLocalData({removeItem:key=>values.delete(key)},"save");
 assert.deepEqual([...values],[[DATA_KEYS.sound,"off"],["outro-projeto","importante"]]);
});
test("redefinir som não apaga o save; tipo desconhecido é rejeitado",()=>{
 const calls=[];const storage={removeItem:key=>calls.push(key)};
 deleteLocalData(storage,"sound");assert.deepEqual(calls,[DATA_KEYS.sound]);
 assert.throws(()=>deleteLocalData(storage,"__proto__"));assert.throws(()=>deleteLocalData(storage,"todos"));assert.deepEqual(calls,[DATA_KEYS.sound]);
});
test("bloqueio de armazenamento é comunicado pelo chamador",()=>{
 assert.throws(()=>deleteLocalData({removeItem(){throw Error("SecurityError");}},"save"),/SecurityError/);
});
test("site privado aceita identidade pendente; público exige dados reais de operação",()=>{
 assert.doesNotThrow(()=>validateConfig({mode:"preview"}));
 const c={mode:"public",operator:"Nome informado pelo proprietário",email:"suporte@dominio.test",origin:"https://dominio.test"};
 assert.throws(()=>validateConfig({...c,email:null}),/responsável/);
 assert.throws(()=>validateConfig(c),/provedor/);
 assert.doesNotThrow(()=>validateConfig({...c,hosting:{provider:"Provedor configurado",retention:"Prazo confirmado",countries:"Locais confirmados",legalBasis:"Finalidades e bases confirmadas"}}));
});
test("configuração rejeita protocolo, caminho e contato inadequados",()=>{
 for(const origin of ["javascript:alert(1)","https://dominio.test/path","http://dominio.test","https://user:senha@dominio.test","https://dominio.test/?param=1"])assert.throws(()=>validateConfig({mode:"preview",origin}));
 assert.throws(()=>validateConfig({mode:"preview",email:"foo?subject=x@dominio.test"}));
});

test("política de privacidade informa dados e direitos sem divulgar detalhes internos de infraestrutura",async()=>{
 const {pages}=await import("../website/content.mjs");
 const privacy=pages({studio:"Softdown",email:"pessoal@example.test"}).find(page=>page.path==="privacidade");
 assert.ok(privacy);
 const html=privacy.body;
 for(const term of [/partida/i,/conta opcional/i,/dados técnicos/i,/prestadores de serviços/i,/transferências internacionais/i,/direitos/i,/\/contato\//,/\/dados\//])
  assert.match(html,term);
 for(const internal of [/Cloudflare/i,/Firebase/i,/Google Cloud/i,/Firestore/i,/Cloud Run/i,/us-central1/i,/bucket privado/i,/token/i,/lhs-save-v1/i,/softloady@/i,/pessoal@example\.test/i])
  assert.doesNotMatch(html,internal);
 assert.doesNotMatch(privacy.description,/infraestrutura de hospedagem/i);
});
