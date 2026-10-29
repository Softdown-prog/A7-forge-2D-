import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame} from "../dist/js/sim/engine.js";
import {paintFeedbackPopups} from "../dist/js/render/feedbackPopupPainter.js";

function setup(){
 const draws=[],cameras=[];
 const ctx={
  save:()=>draws.push(["save"]),restore:()=>draws.push(["restore"]),
  strokeText:(...args)=>draws.push(["strokeText",...args]),
  fillText:(...args)=>draws.push(["fillText",...args]),
  beginPath:()=>draws.push(["beginPath"]),
  roundRect:(...args)=>draws.push(["roundRect",...args]),
  fill:()=>draws.push(["fill"]),stroke:()=>draws.push(["stroke"]),
  measureText:text=>{draws.push(["measureText",text]);return {width:50};}
 };
 for(const prop of ["globalAlpha","textAlign","lineWidth","font","strokeStyle","fillStyle"]){
  Object.defineProperty(ctx,prop,{
   set(value){draws.push([prop,value]);},configurable:true
  });
 }
 const camera=()=>{cameras.push("camera");return {originX:100,originY:200,zoom:1};};
 const queues={payments:[],sales:[],speech:[]};
 const paint=(dt=.25,visible=true)=>paintFeedbackPopups(ctx,camera,queues,dt,visible);
 return {ctx,draws,cameras,queues,paint};
}
test("sem efeitos, nada é desenhado, mas cada camada consulta câmera",()=>{
 const x=setup();x.paint();
 assert.equal(x.draws.length,0);assert.equal(x.cameras.length,3);
});
test("pagamento avança idade e desenha valor com R$",()=>{
 const x=setup();x.queues.payments.push({amount:17,x:1,y:1,age:0});
 x.paint();
 assert.equal(x.queues.payments[0].age,.25);
 assert.ok(x.draws.some(d=>d[0]==="fillText"&&d[1]==="+R$ 17"));
});
test("venda avança idade e desenha valor com R$",()=>{
 const x=setup();x.queues.sales.push({amount:6,x:0,y:1,age:0});
 x.paint();
 assert.equal(x.queues.sales[0].age,.25);
 assert.ok(x.draws.some(d=>d[0]==="fillText"&&d[1]==="+R$ 6"));
});
test("comentário avança idade e desenha texto",()=>{
 const x=setup();x.queues.speech.push({text:"Bom!",x:1,y:2,kind:"praise",age:0});
 x.paint();
 assert.equal(x.queues.speech[0].age,.25);
 assert.ok(x.draws.some(d=>d[0]==="fillText"&&d[1]==="Bom!"));
});
test("ordem de camadas permanece pagamento, venda e fala",()=>{
 const x=setup();x.queues.payments.push({amount:1,x:0,y:0,age:0});
 x.queues.sales.push({amount:2,x:0,y:0,age:0});
 x.queues.speech.push({text:"Sim",x:0,y:0,kind:"praise",age:0});
 x.paint();
 assert.deepEqual(x.draws.filter(d=>d[0]==="fillText").map(d=>d[1]),["+R$ 1","+R$ 2","Sim"]);
});
test("cada balão salva e restaura o contexto sem atravessar a camada seguinte",()=>{
 const x=setup();x.queues.payments.push({amount:1,x:0,y:0,age:0});
 x.queues.sales.push({amount:2,x:0,y:0,age:0});
 x.queues.speech.push({text:"x",x:0,y:0,kind:"complaint",age:0});
 x.paint();
 assert.equal(x.draws.filter(d=>d[0]==="save").length,3);
 assert.equal(x.draws.filter(d=>d[0]==="restore").length,3);
});
test("balões de pagamento expiram ao atingir 1,35 segundos",()=>{
 const x=setup();x.queues.payments.push({amount:1,x:0,y:0,age:1.1});
 x.paint(.25);
 assert.deepEqual(x.queues.payments,[]);
 assert.deepEqual(x.draws,[]);
});
test("balões de venda expiram ao atingir 1,35 segundos",()=>{
 const x=setup();x.queues.sales.push({amount:1,x:0,y:0,age:1.1});
 x.paint(.25);
 assert.deepEqual(x.queues.sales,[]);
});
test("comentário expira ao atingir 2,6 segundos",()=>{
 const x=setup();x.queues.speech.push({text:"x",kind:"complaint",x:0,y:0,age:2.5});
 x.paint(.1);
 assert.deepEqual(x.queues.speech,[]);
});
test("Canvas invisível não desenha, mas continua envelhecendo os efeitos",()=>{
 const x=setup();x.queues.payments.push({amount:1,x:0,y:0,age:0});
 x.queues.sales.push({amount:2,x:0,y:0,age:0});
 x.queues.speech.push({text:"x",kind:"praise",x:0,y:0,age:0});
 x.paint(.2,false);
 assert.deepEqual(x.queues.payments.map(p=>p.age),[.2]);
 assert.deepEqual(x.queues.sales.map(p=>p.age),[.2]);
 assert.deepEqual(x.queues.speech.map(p=>p.age),[.2]);
 assert.deepEqual(x.draws,[]);
 assert.equal(x.cameras.length,3);
});
test("Canvas invisível remove efeitos expirados como o loop antigo",()=>{
 const x=setup();x.queues.payments.push({amount:1,x:0,y:0,age:1.3});
 x.queues.sales.push({amount:2,x:0,y:0,age:1.3});
 x.queues.speech.push({text:"x",kind:"praise",x:0,y:0,age:2.55});
 x.paint(.1,false);
 assert.deepEqual([x.queues.payments.length,x.queues.sales.length,x.queues.speech.length],[0,0,0]);
});
test("remove efeitos vencidos de trás para frente sem pular vizinhos",()=>{
 const x=setup();
 for(let i=0;i<4;i++)x.queues.payments.push({amount:i,x:0,y:0,age:1.34});
 x.paint(.02);
 assert.equal(x.queues.payments.length,0);
});
test("efeitos novos são preservados após limpar expirados",()=>{
 const x=setup();
 x.queues.payments.push({amount:1,x:0,y:0,age:1.3},{amount:2,x:0,y:0,age:0});
 x.paint(.1);
 assert.deepEqual(x.queues.payments.map(p=>p.amount),[2]);
 assert.equal(x.queues.payments[0].age,.1);
});
test("estilos de valores preservam fontes e contornos distintos",()=>{
 const x=setup();
 x.queues.payments.push({amount:1,x:0,y:0,age:0});
 x.queues.sales.push({amount:2,x:0,y:0,age:0});
 x.paint();
 assert.deepEqual(x.draws.filter(d=>d[0]==="font").map(d=>d[1]),
  ["bold 20px system-ui,sans-serif","bold 17px system-ui,sans-serif"]);
 assert.deepEqual(x.draws.filter(d=>d[0]==="lineWidth").map(d=>d[1]),[3.2,3]);
});
test("comentário elogiando mantém fundo e borda verdes",()=>{
 const x=setup();x.queues.speech.push({text:"Legal",kind:"praise",x:0,y:0,age:0});
 x.paint();
 assert.ok(x.draws.some(d=>d[0]==="fillStyle"&&d[1]==="#e3f9e9"));
 assert.ok(x.draws.some(d=>d[0]==="strokeStyle"&&d[1]==="#227348"));
});
test("comentário crítico mantém fundo e borda quentes",()=>{
 const x=setup();x.queues.speech.push({text:"Ruim",kind:"complaint",x:0,y:0,age:0});
 x.paint();
 assert.ok(x.draws.some(d=>d[0]==="fillStyle"&&d[1]==="#fff2df"));
 assert.ok(x.draws.some(d=>d[0]==="strokeStyle"&&d[1]==="#9c5238"));
});
test("texto longo fica limitado a balão de largura máxima 190",()=>{
 const x=setup();x.ctx.measureText=()=>({width:500});
 x.queues.speech.push({text:"frase longa",kind:"praise",x:0,y:0,age:0});
 x.paint();
 assert.ok(x.draws.some(d=>d[0]==="roundRect"&&d[3]===190));
});
test("projeção isométrica conserva a altura do pagamento",()=>{
 const x=setup();x.queues.payments.push({amount:10,x:1,y:1,age:0});
 x.paint(.25);
 const fill=x.draws.find(d=>d[0]==="fillText");
 assert.equal(fill[2],100);assert.equal(fill[3],200+64-94-.25*43);
});
test("alpha reduz na cauda final sem mudar tempo de vida",()=>{
 const x=setup();x.queues.payments.push({amount:1,x:0,y:0,age:1});
 x.paint(.1);
 const alpha=x.draws.find(d=>d[0]==="globalAlpha");
 assert.ok(alpha);assert.ok(Math.abs(alpha[1]-.625)<1e-9);
});
test("nenhuma alteração no save original durante renderização de filas",()=>{
 const game=createGame(1001,"historical"),before=JSON.stringify(game),x=setup();
 x.queues.payments.push({amount:1,x:1,y:1,age:0});
 x.paint();
 assert.equal(JSON.stringify(game),before);
});
test("exceção do Canvas não é ignorada e não redesenha camadas posteriores",()=>{
 const x=setup();x.ctx.strokeText=()=>{throw Error("canvas failed");};
 x.queues.payments.push({amount:1,x:1,y:1,age:0});
 x.queues.sales.push({amount:2,x:1,y:1,age:0});
 assert.throws(()=>x.paint(),/canvas failed/);
 assert.equal(x.queues.sales[0].age,0);
});
test("módulo de renderização não conhece o motor nem acessa o navegador",()=>{
 const root=new URL("../src/",import.meta.url);
 const src=readFileSync(new URL("render/feedbackPopupPainter.ts",root),"utf8");
 const main=readFileSync(new URL("main.ts",root),"utf8");
 assert.doesNotMatch(src,/from\s*["']\.\.\/sim\//);
 assert.doesNotMatch(src,/\b(GameState|stepGame|localStorage|document|window|requestAnimationFrame|Soundscape)\b/);
 assert.match(main,/paintFeedbackPopups\(view!,\(\)=>cameraForGame\(game\),popupQueues,dt,paintScene\)/);
 assert.match(main,/createFrameFeedbackPort\(\(\)=>game,soundscape,popupQueues\)/);
 assert.doesNotMatch(main,/function paintPayments\(/);
});
