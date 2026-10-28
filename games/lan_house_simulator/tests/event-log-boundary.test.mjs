import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {createEventLogPort} from "../dist/js/application/eventLogPort.js";
import {renderEventLog} from "../dist/js/ui/eventLogPanel.js";
const game=()=>createGame(1203,"historical");
class Node{
 constructor(tag){this.tag=tag;this.children=[];this.textContent="";this.innerHTML="";}
 append(...items){this.children.push(...items);}
 appendChild(item){this.children.push(item);}
 replaceChildren(...items){this.children=[...items];}
}
const doc={createElement:tag=>new Node(tag),createTextNode:text=>({tag:"#text",textContent:text})};
test("nenhum evento gera lista vazia sem alterar a partida",()=>{
 const s=game();s.eventLog=[];
 const before=JSON.stringify(s),v=createEventLogPort(()=>s).snapshot();
 assert.equal(v.signature,"[]");assert.deepEqual(v.rows,[]);
 assert.equal(JSON.stringify(s),before);
});
test("somente seis eventos recentes, na mesma ordem e com assinatura JSON compatível",()=>{
 const s=game();s.eventLog=Array.from({length:12},(_,i)=>"D"+(i+1)+" 10:00 · Evento "+i);
 const before=JSON.stringify(s),v=createEventLogPort(()=>s).snapshot();
 assert.equal(v.rows.length,6);assert.equal(v.rows[0].text,"Evento 0");
 assert.equal(v.rows[5].time,"D6 10:00");
 assert.equal(v.signature,JSON.stringify(s.eventLog.slice(0,6)));
 assert.equal(JSON.stringify(s),before);
});
test("separa prefixo de dia e hora sem perder caracteres ou mensagens sem prefixo",()=>{
 const s=game();s.eventLog=["D12 14:30 · Cliente · voltou","Registro avulso","D1 10:00 · "];
 assert.deepEqual(createEventLogPort(()=>s).snapshot().rows.map(x=>[x.time,x.text]),
  [["D12 14:30","Cliente · voltou"],[null,"Registro avulso"],["D1 10:00",""]]);
});
test("pagamentos e vendas prevalecem sobre internet, seguidos de PCs e cartas",()=>{
 const s=game();s.eventLog=["Cliente pagou no PC","Venda via internet","Internet conectada","PC ligado","Carta recebida","computador quebrado"];
 assert.deepEqual(createEventLogPort(()=>s).snapshot().rows.map(x=>x.icon),
  ["coins","coins","network","computer","mail","computer"]);
});
test("cache de assinatura só muda quando os seis visíveis mudam",()=>{
 const s=game();s.eventLog=["Original"];const port=createEventLogPort(()=>s);
 const first=port.snapshot().signature;
 assert.equal(port.snapshot().signature,first);
 s.eventLog.unshift("Mais recente");assert.notEqual(port.snapshot().signature,first);
 s.eventLog=Array.from({length:7},(_,i)=>"Evento "+i);
 const six=port.snapshot().signature;s.eventLog[6]="Outro evento oculto";
 assert.equal(port.snapshot().signature,six);
});
test("importação de save não deixa a porta apontar para a partida antiga",()=>{
 let s=game();s.eventLog=["D1 10:00 · Original"];
 const old=s,before=JSON.stringify(s),port=createEventLogPort(()=>s);
 s=parseImportedSave(serializeSave(s));assert.equal(isValidSave(s),true);
 s.eventLog.unshift("D1 10:01 · Novo");
 assert.equal(port.snapshot().rows[0].text,"Novo");
 assert.equal(JSON.stringify(old),before);
});
test("componente mantém o DOM com ícone, time e texto e esvazia de forma correta",()=>{
 const s=game();s.eventLog=["D5 12:30 · Venda confirmada","Sem formato"];
 const root=new Node("ul"),calls=[];
 renderEventLog(root,createEventLogPort(()=>s).snapshot(),doc,name=>{calls.push(name);return "<svg>"+name+"</svg>";});
 assert.deepEqual(calls,["coins","mail"]);
 assert.equal(root.children.length,2);
 const li=root.children[0],span=li.children[0];
 assert.equal(li.innerHTML,"<svg>coins</svg>");
 assert.equal(span.children[0].tag,"time");assert.equal(span.children[0].textContent,"D5 12:30");
 assert.equal(span.children[1].textContent,"Venda confirmada");
 assert.equal(root.children[1].children[0].textContent,"Sem formato");
 renderEventLog(root,{signature:"[]",rows:[]},doc,()=>"<svg/>");
 assert.deepEqual(root.children,[]);
});
test("UI não importa motor nem mexe no áudio; main mantém invalidatório de DOM",()=>{
 const base=new URL("../src/",import.meta.url);
 const app=readFileSync(new URL("application/eventLogPort.ts",base),"utf8");
 const ui=readFileSync(new URL("ui/eventLogPanel.ts",base),"utf8");
 const main=readFileSync(new URL("main.ts",base),"utf8");
 assert.doesNotMatch(app,/\b(document|window|HTMLElement)\b/);
 assert.doesNotMatch(ui,/from\s*["']\.\.\/sim\//);
 assert.doesNotMatch(ui,/\bGameState\b|addEventListener/);
 assert.ok(main.includes("createEventLogPort(()=>game)"));
 assert.ok(main.includes("renderEventLog(events,eventHistory,document,iconMarkup)"));
 assert.ok(main.includes("eventHistory.signature!==lastEventSignature"));
 assert.ok(main.includes("lastEventSignature=eventHistory.signature"));
});
