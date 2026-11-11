import type {AccountCosmetic,CookieCosmeticId} from "../../application/accountGamePort.js";
import {vipProductThumbnail} from "../vipProductArt.js";

/** Cosmetic presentation only; balance checks and verified purchases stay in the account controller. */
export interface CosmeticCardDependencies {
 year:number;
 unequipped:Set<CookieCosmeticId>;
 loading:boolean;
 hasSession:boolean;
 balance:number|null;
 serverPrice:number|undefined;
 configured:boolean;
 onToggle(id:CookieCosmeticId,enabled:boolean):boolean;
 onStatus(message:string):void;
 onRedeem(item:AccountCosmetic):void;
}
const brl=(cents:number)=>(cents/100).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const priceToBrl=(cookies:number)=>brl(cookies*10);
function button(text:string,className="slice"):HTMLButtonElement{
 const el=document.createElement("button");el.type="button";el.className=className;el.textContent=text;return el;
}
function line(text:string,cls=""):HTMLElement{
 const node=document.createElement("p");node.className=cls;node.textContent=text;return node;
}

 export function renderCosmeticCard(item:AccountCosmetic,isOwned:boolean,deps:CosmeticCardDependencies):HTMLElement{
 const {year,unequipped,loading,hasSession,balance,serverPrice,configured,onToggle,onStatus,onRedeem}=deps;
  const el=document.createElement("article");el.className="account-item";
  const icon=document.createElement("div");
  icon.className="account-item-art";
  icon.dataset.cosmetic=item.id;
  icon.setAttribute("aria-hidden","true");
  const premiumArt=vipProductThumbnail(item.id);
  if(premiumArt){
   const img=document.createElement("img");img.src=premiumArt;
   img.alt="";img.loading="lazy";icon.append(img);
  }else{
   icon.textContent=({"headset-rgb-neon":"🎧","chair-gamer-neon":"💺","keyboard-rainbow-rgb":"⌨",
    "neon-open-sign":"✦","arcade-checker-floor":"▦","exclusive-arcade-posters":"▣"} as Record<string,string>)[item.id]??"✧";
  }
  const info=document.createElement("div");info.className="account-item-info";
  const name=document.createElement("strong");name.textContent=item.name;
  const detail=line(`${item.cookies} Cookies · ${priceToBrl(item.cookies)} · desde ${item.unlockYear}`,"account-item-price");
  const desc=line(item.description,"account-item-description");
  info.append(name,detail,desc);
  const control=document.createElement("div");control.className="account-item-control";
  const usable=year>=item.unlockYear;
  if(isOwned){
   const label=document.createElement("label");label.className="account-toggle";
   const check=document.createElement("input");check.type="checkbox";
   check.checked=!unequipped.has(item.id);
   check.dataset.premiumCosmetic=item.id;
   check.addEventListener("change",()=>{
    if(!onToggle(item.id,check.checked)){
     check.checked=false;return;
    }
    if(check.checked)unequipped.delete(item.id);else unequipped.add(item.id);
    onStatus(check.checked?"Item equipado.":"Item desequipado.");
   });
   label.append(check,document.createTextNode(check.checked?" Equipado":" Desequipado"));
   check.addEventListener("change",()=>{label.lastChild!.textContent=check.checked?" Equipado":" Desequipado";});
   control.append(line(usable?"Adquirido":"Aguardando ano de uso","account-owned-label"),label);
  }else{
   const buy=button("Resgatar · "+item.cookies+" Cookies");
   const server=serverPrice;
   const enabled=!loading&&hasSession&&balance!==null&&server===item.cookies&&
    balance>=item.cookies&&configured;
   buy.disabled=!enabled;
   buy.title=!hasSession?"Entre na conta para resgatar":
    server===undefined?"Catálogo do servidor ainda não está habilitado":
    server!==item.cookies?"Preço não confirmado pelo servidor":
    balance!==null&&balance<item.cookies?"Cookies insuficientes":"";
   buy.addEventListener("click",()=>onRedeem(item));
   control.append(buy);
  }
  el.append(icon,info,control);return el;
 }
