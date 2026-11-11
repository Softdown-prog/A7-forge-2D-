import type {Account} from "./types.js";
function line(text:string,cls=""):HTMLElement{
 const node=document.createElement("p");node.className=cls;node.textContent=text;return node;
}
/** Read-only ledger view of server-confirmed Cookie transactions. */
export function renderHistory(history:HTMLElement,account:Account|null,hasSession:boolean,cosmeticName:(id:string)=>string):void{
  history.replaceChildren();
  if(!hasSession)history.append(line("Entre na sua conta para ver seu histórico.","account-empty"));
  else if(!account?.transactions?.length)history.append(line("Nenhuma movimentação registrada.","account-empty"));
  else{
   for(const move of account.transactions){
    const article=document.createElement("article");article.className="account-ledger-row";
    const name=document.createElement("strong");name.textContent=move.type==="item"?
      "Resgate: "+cosmeticName(move.itemId??""):move.delta>0?"Crédito de Cookies":"Ajuste de saldo";
    const meta=document.createElement("small");
    const date=move.at?new Date(move.at):null;
    meta.textContent=(date&&!Number.isNaN(date.getTime())?date.toLocaleString("pt-BR"):"Data indisponível")+
      (move.mode==="sandbox"?" · teste":"");
    const amount=document.createElement("b");amount.textContent=(move.delta>0?"+":"")+move.delta+" Cookies";
    amount.dataset.sign=move.delta<0?"debit":"credit";
    const info=document.createElement("div");info.append(name,meta);
    article.append(info,amount);history.append(article);
   }
   if(account.transactions.length>=(account.historyLimit??40))
    history.append(line("Exibindo somente as movimentações recentes. O total de gastos considera todo o histórico.","account-subtext"));
 }
}
