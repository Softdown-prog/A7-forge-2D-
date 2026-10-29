import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {renderAdminFinanceSummary,renderAdminFinanceActivity} from "../dist/js/ui/adminFinanceSections.js";
function setup(){
 const calls={balance:0,watch:0,monthly:0,promotion:0,feedback:0,changed:0,pages:[],text:[]};
 const nodes=new Map();
 function node(id){
  if(!nodes.has(id)){
   const item={id,hidden:false,textContent:"",children:[],classes:new Set(),
    classList:{toggle(k,v){if(v)item.classes.add(k);else item.classes.delete(k);}},
    replaceChildren(){this.children=[];},
    querySelector:()=>null};
   nodes.set(id,item);
  }
  return nodes.get(id);
 }
 const host=node("customer-feedback-panel");
 host.querySelector=s=>({"#customer-feedback-summary":node("customer-feedback-summary"),
  "#customer-feedback-reasons":node("customer-feedback-reasons"),
  "#customer-feedback-list":node("customer-feedback-list")})[s]??null;
 const doc={getElementById:node,querySelector:s=>s==="#launch-promotion"?node("launch-promotion"):null};
 const overview={bills:"R$ 300",served:"3",breakdown:"Aluguel",activity:"Receitas",expansion:"Ampliação 1/2"};
 const balance={
  balance(){calls.balance++;return {cash:"R$ 200",summary:"Resumo",profit:"R$ -5",
   negative:true,opening:"0",income:"0",outgoing:"0",available:"0",reconciliation:null};},
  billWatch(){calls.watch++;return {title:"Próximo fechamento",status:"7 dias",warning:true};}
 };
 const monthly={snapshot(){calls.monthly++;return {
  utilization:"50%",previousOccupancy:"40%",billInfo:"Nenhum fechamento",
  receipt:null,statement:"Extrato",capacityAdvice:"Revisar"
 };}};
 const promotion={snapshot(){calls.promotion++;return {
  description:"Custo",status:"Sem promoção",buttonLabel:"Contratar",buttonDisabled:false
 };}};
 let financeTab=false,page=null,changed=true;
 const setText=(id,text)=>{calls.text.push([id,text]);node(id).textContent=text;};
 const summary=()=>({overview,balance,financeTab,pageActive:p=>{calls.pages.push(p);return page===p;},
  feedbackChanged:()=>{calls.changed++;return changed;},
  feedback:()=>{calls.feedback++;return {summary:"Duas avaliações",reasons:[],recent:[]};},setText,doc});
 const activity=()=>({overview,monthly,promotion,financeTab,setText,doc});
 return {calls,node,summary,activity,finance:v=>financeTab=v,page:v=>page=v,changed:v=>changed=v};
}
test("resumo de caixa e contas aparece fora da aba Finanças",()=>{
 const f=setup();renderAdminFinanceSummary(f.summary());
 for(const id of ["admin-cash","admin-profit","admin-bills","admin-served","monthly-breakdown"])
  assert.ok(f.calls.text.some(x=>x[0]===id),id);
 assert.equal(f.calls.balance,1);assert.equal(f.calls.watch,0);
});
test("resultado negativo mantém indicador no mesmo nó",()=>{
 const f=setup(),node=f.node("admin-profit");
 renderAdminFinanceSummary(f.summary());
 assert.equal(f.node("admin-profit"),node);
 assert.equal(node.classes.has("balance-negative"),true);
});
test("fora de Finanças não consulta revisões nem avaliações",()=>{
 const f=setup();renderAdminFinanceSummary(f.summary());
 assert.deepEqual(f.calls.pages,[]);
 assert.equal(f.calls.changed,0);assert.equal(f.calls.feedback,0);
});
test("apenas a página Balanço consulta aviso de fechamento",()=>{
 const f=setup();f.finance(true);f.page("balance");
 renderAdminFinanceSummary(f.summary());
 assert.equal(f.calls.watch,1);
 assert.equal(f.node("bill-watch-title").textContent,"Próximo fechamento");
 assert.equal(f.node("bill-watch").classes.has("bill-watch-warning"),true);
 assert.equal(f.calls.feedback,0);
});
test("opiniões sem alteração não remontam a lista",()=>{
 const f=setup();f.finance(true);f.page("feedback");f.changed(false);
 renderAdminFinanceSummary(f.summary());
 assert.equal(f.calls.changed,1);assert.equal(f.calls.feedback,0);
});
test("opiniões atualizadas mostram somente o resumo projetado",()=>{
 const f=setup();f.finance(true);f.page("feedback");
 renderAdminFinanceSummary(f.summary());
 assert.equal(f.calls.changed,1);assert.equal(f.calls.feedback,1);
 assert.equal(f.node("customer-feedback-summary").textContent,"Duas avaliações");
});
test("atividade sempre mostra entradas sem consultar mensalidade em outra aba",()=>{
 const f=setup();renderAdminFinanceActivity(f.activity());
 assert.deepEqual(f.calls.text,[["finance","Receitas"]]);
 assert.equal(f.calls.monthly,0);assert.equal(f.calls.promotion,0);
});
test("Finanças inclui expansão, mensalidade e panfletagem",()=>{
 const f=setup();f.finance(true);renderAdminFinanceActivity(f.activity());
 assert.equal(f.calls.monthly,1);assert.equal(f.calls.promotion,1);
 for(const id of ["finance","expansion","pc-utilization","monthly-statement","promotion-status"])
  assert.ok(f.calls.text.some(x=>x[0]===id),id);
 assert.equal(f.node("launch-promotion").textContent,"Contratar");
});
test("comprovante ainda não emitido permanece oculto e preservado",()=>{
 const f=setup();f.finance(true);const receipt=f.node("last-bill-details");
 renderAdminFinanceActivity(f.activity());
 assert.equal(receipt.hidden,true);
 assert.equal(f.node("last-bill-details"),receipt);
});
test("renderização repetida não recria o botão de panfletagem",()=>{
 const f=setup();f.finance(true);const button=f.node("launch-promotion");
 renderAdminFinanceActivity(f.activity());renderAdminFinanceActivity(f.activity());
 assert.equal(f.node("launch-promotion"),button);
 assert.equal(f.calls.promotion,2);
});
test("resumo mantém caixa antes de total de contas",()=>{
 const f=setup();renderAdminFinanceSummary(f.summary());
 const ids=f.calls.text.map(x=>x[0]);
 assert.ok(ids.indexOf("admin-cash")<ids.indexOf("admin-bills"));
});
test("UI financeira sem importação do motor; bootstrap mantém a revisão",()=>{
 const root=new URL("../src/",import.meta.url);
 const ui=readFileSync(new URL("ui/adminFinanceSections.ts",root),"utf8");
 const main=readFileSync(new URL("main.ts",root),"utf8");
 assert.doesNotMatch(ui,/from\s*["']\.\.\/sim\//);
 assert.doesNotMatch(ui,/\bGameState\b|stepGame|localStorage|addEventListener|save\(/);
 assert.match(main,/renderAdminFinanceSummary\(\{/);
 assert.match(main,/renderAdminFinanceActivity\(\{/);
 assert.match(main,/feedbackChanged:\(\)=>panelChanged\("customerFeedback",/);
 assert.match(main,/feedback:\(\)=>customerFeedbackSnapshot\(game\)/);
});
