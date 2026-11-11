import type {StoreConfig} from "./types.js";
function line(text:string,cls=""):HTMLElement{
 const node=document.createElement("p");node.className=cls;node.textContent=text;return node;
}
/** Donation link is shown only when server-backed payments are enabled. */
 export function renderDonate(donate:HTMLElement,store:StoreConfig|null):void{
  donate.replaceChildren();
  const title=document.createElement("strong");title.textContent="Apoiar o desenvolvimento";
  donate.append(title,line("R$ 5 = 50 Cookies · R$ 10 = 100 Cookies. Pagamento único.","account-subtext"));
  if(!store?.paymentsEnabled||!store?.packages){
   donate.append(line("Compra de Cookies ainda não disponível neste ambiente.","account-subtext"));return;
  }
  const link=document.createElement("a");link.href="/donate/";link.target="_top";
  link.className="slice";link.textContent="Adquirir Cookies no Donate";
  donate.append(link,line("Sua conta acompanha a navegação nesta aba. Depois do pagamento, volte e atualize o saldo.","account-subtext"));
 }
