import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {dispatchFrameEvents} from "../dist/js/application/frameEventDispatch.js";

function fixture({playing=true,hidden=false,arrivals=1}={}){
 const calls=[];
 let docHidden=hidden,newMail=arrivals;
 let served=2,previousServed=1,purchases=3,previousPurchases=1;
 const feedback=Object.fromEntries(["payments","sales","prints","keyboards","speech"].map(name=>[
  name,flag=>calls.push(name+":"+flag)
 ]));
 const options={
  playing,
  countNewMail:()=>{calls.push("countMail");return newMail;},
  isDocumentHidden:()=>{calls.push("isHidden");return docHidden;},
  notifyMail:()=>calls.push("playMail"),
  feedback,
  updateServed:()=>{calls.push("served");if(served>previousServed)previousServed=served;},
  updatePurchases:()=>{calls.push("purchases");if(purchases>previousPurchases)previousPurchases=purchases;}
 };
 return {calls,options,run:()=>dispatchFrameEvents(options),
  setHidden:v=>docHidden=v,setMail:v=>newMail=v,
  setServed:v=>served=v,setPurchases:v=>purchases=v,
  counters:()=>({previousServed,previousPurchases})};
}
test("cartas novas soam antes de pagamentos, vendas, impressão, teclado e fala",()=>{
 const h=fixture();h.run();
 assert.deepEqual(h.calls,[
  "countMail","isHidden","playMail","payments:true","served",
  "sales:true","prints:true","keyboards:true","purchases","speech:true"
 ]);
});
test("fora da partida não lê cartas mas percorre consumidores com flag false",()=>{
 const h=fixture({playing:false});h.run();
 assert.deepEqual(h.calls,[
  "payments:false","served","sales:false","prints:false","keyboards:false","purchases","speech:false"
 ]);
});
test("documento oculto consome as cartas sem produzir som",()=>{
 const h=fixture({hidden:true});h.run();
 assert.deepEqual(h.calls.slice(0,3),["countMail","isHidden","payments:true"]);
 assert.equal(h.calls.includes("playMail"),false);
});
test("sem carta nova não consulta visibilidade nem áudio",()=>{
 const h=fixture({arrivals:0});h.run();
 assert.equal(h.calls.includes("isHidden"),false);
 assert.equal(h.calls.includes("playMail"),false);
});
test("quantidade negativa de novidades não dispara som",()=>{
 const h=fixture({arrivals:-1});h.run();
 assert.equal(h.calls.includes("isHidden"),false);
 assert.equal(h.calls.includes("playMail"),false);
});
test("várias cartas chegadas no mesmo quadro tocam somente uma notificação",()=>{
 const h=fixture({arrivals:4});h.run();
 assert.equal(h.calls.filter(s=>s==="playMail").length,1);
});
test("quadro seguinte observa novas cartas por callback atualizado",()=>{
 const h=fixture();h.run();h.calls.length=0;h.setMail(0);h.run();
 assert.equal(h.calls[0],"countMail");
 assert.equal(h.calls.includes("playMail"),false);
});
test("o aviso toca quando a aba voltar a ficar visível, para entregas futuras",()=>{
 const h=fixture({hidden:true});h.run();h.calls.length=0;
 h.setHidden(false);h.setMail(1);h.run();
 assert.deepEqual(h.calls.slice(0,3),["countMail","isHidden","playMail"]);
});
test("marcadores de clientes são atualizados após pagamentos e antes de vendas",()=>{
 const h=fixture();h.run();
 const s=h.calls;
 assert.ok(s.indexOf("payments:true")<s.indexOf("served"));
 assert.ok(s.indexOf("served")<s.indexOf("sales:true"));
 assert.deepEqual(h.counters(),{previousServed:2,previousPurchases:3});
});
test("compras ficam depois do teclado e antes de balões de fala",()=>{
 const h=fixture();h.run();
 assert.ok(h.calls.indexOf("keyboards:true")<h.calls.indexOf("purchases"));
 assert.ok(h.calls.indexOf("purchases")<h.calls.indexOf("speech:true"));
});
test("contadores não retrocedem quando uma partida nova tem valores menores",()=>{
 const h=fixture();h.run();
 h.setServed(0);h.setPurchases(0);h.run();
 assert.deepEqual(h.counters(),{previousServed:2,previousPurchases:3});
});
test("falha de reprodução de carta não é mascarada e preserva ordem de interrupção",()=>{
 const h=fixture();h.options.notifyMail=()=>{h.calls.push("playMail");throw Error("audio");};
 assert.throws(()=>h.run(),/audio/);
 assert.deepEqual(h.calls,["countMail","isHidden","playMail"]);
});
test("falha no consumidor de vendas não processa impressão nem speech",()=>{
 const h=fixture();h.options.feedback.sales=()=>{h.calls.push("sales");throw Error("sale");};
 assert.throws(()=>h.run(),/sale/);
 assert.ok(h.calls.includes("payments:true"));
 assert.equal(h.calls.includes("prints:true"),false);
 assert.equal(h.calls.includes("speech:true"),false);
});
test("módulo não conhece DOM, simulação, dispositivo áudio ou timer de save",()=>{
 const root=new URL("../src/",import.meta.url);
 const main=readFileSync(new URL("main.ts",root),"utf8");
 const src=readFileSync(new URL("application/frameEventDispatch.ts",root),"utf8");
 assert.doesNotMatch(src,/from\s*["']\.\.\/(?:sim|audio|ui|render)\//);
 const runtime=src.replace(/\/\*[\s\S]*?\*\//g,"");
 assert.doesNotMatch(runtime,/\b(GameState|document|window|AudioContext|Soundscape|CanvasRenderingContext2D|localStorage|setInterval|requestAnimationFrame|stepGame)\b|\bsave\(/);
 assert.match(main,/dispatchFrameEvents\(\{/);
 assert.match(main,/countNewMail:\(\)=>consumeNewMail\(knownMailIds,game.notices\)/);
 assert.match(main,/notifyMail:\(\)=>soundscape.mail\(\)/);
 assert.match(main,/feedback:frameFeedback/);
 assert.match(main,/frameSimulation\.run\(\{/);
 assert.match(main,/advance:minutes=>stepGame\(game,minutes\)/);
 assert.ok(main.indexOf("dispatchFrameEvents({")>main.indexOf("frameSimulation.run({"));
});
