/** React-only presentation: no simulation imports, business decisions, or save access.
 * All actions delegate to the existing, tested DOM controller buttons.
 */
import React,{useEffect,useLayoutEffect,useState} from "react";
import {catalogSearchMatch} from "./catalogSearch.mjs";

const SHOP_CATEGORIES=[
 {id:"equipment",label:"Computadores e serviços",icon:"▣",hint:"Equipar o salão"},
 {id:"consoles",label:"Videogames e CDs",icon:"◇",hint:"Diversão por época"},
 {id:"building",label:"Construção",icon:"▦",hint:"Expandir o espaço"},
 {id:"decoration",label:"Decoração",icon:"✦",hint:"Dar personalidade"}
];

export function ShopCategories(){
 const [current,setCurrent]=useState("equipment");
 useLayoutEffect(()=>{
  const nav=document.getElementById("react-shop-categories");
  if(!nav)return;
  const sync=event=>{
   const value=event.detail;
   if(SHOP_CATEGORIES.some(category=>category.id===value))setCurrent(value);
  };
  nav.addEventListener("lhs:shop-category-selected",sync);
  return ()=>nav.removeEventListener("lhs:shop-category-selected",sync);
 },[]);
 return <>{SHOP_CATEGORIES.map(category=><button key={category.id} type="button"
  className="react-shop-category" data-shop-category={category.id}
  aria-pressed={current===category.id} title={category.hint}>
  <span className="react-shop-icon" aria-hidden="true">{category.icon}</span>
  <span className="react-shop-label">{category.label}</span>
 </button>)}</>;
}

function navigateToArea(area,page){
 const admin=document.getElementById("admin");
 if(!admin)return "Painel administrativo indisponível.";
 if(admin.hidden)document.getElementById("open-admin")?.click();
 const tab=admin.querySelector('[data-admin-tab="'+area+'"]');
 if(!(tab instanceof HTMLButtonElement))return "Seção indisponível.";
 tab.click();
 if(page){
  const selector='#section-'+area+' .management-pages [data-panel-choice="'+page+'"]';
  const task=admin.querySelector(selector);
  if(task instanceof HTMLButtonElement){
   if(task.disabled){
    // A regra do ano continua exclusivamente no controlador TypeScript.
    admin.querySelector('#section-stock [data-panel-choice="suppliers"]')?.click();
    return "Catálogo avançado disponível em 2000. Mostrando fornecedores.";
   }
   task.click();
  }
 }
 return null;
}

const QUICK_ACTIONS=[
 {id:"cash",label:"Finanças",detail:"Caixa e contas",area:"finance",page:"balance",icon:"R$"},
 {id:"stock",label:"Estoque",detail:"Repor produtos",area:"stock",page:"suppliers",icon:"▥"},
 {id:"staff",label:"Serviços",detail:"Equipe e internet",area:"services",page:"staff",icon:"⚙"},
 {id:"computers",label:"Computadores",detail:"Operação e reparos",area:"computers",page:"operations",icon:"▣"},
 {id:"shop",label:"Compras",detail:"Equipar o salão",shop:true,icon:"+"}
];
export function QuickDeck(){
 return <>{QUICK_ACTIONS.map(action=><button type="button" key={action.id}
  data-ui-shortcut={action.id} className="react-quick-action"
  onClick={()=>action.shop?document.getElementById("open-shop")?.click():navigateToArea(action.area,action.page)}>
  <span aria-hidden="true" className="react-quick-symbol">{action.icon}</span>
  <span className="react-quick-copy"><strong>{action.label}</strong><small>{action.detail}</small></span>
 </button>)}</>;
}

const ADMIN_SHORTCUTS=[
 {label:"Repor estoque",hint:"Bebidas e alimentos",area:"stock",page:"suppliers",icon:"▥"},
 {label:"Mercadorias",hint:"Catálogo e vendas",area:"stock",page:"catalog",icon:"▤"},
 {label:"Preços",hint:"Hora e pacotes",area:"prices",page:"hourly",icon:"R$"},
 {label:"Equipe",hint:"Funcionários e limpeza",area:"services",page:"staff",icon:"⚙"},
 {label:"Internet",hint:"Planos e contrato",area:"services",page:"network",icon:"◎"},
 {label:"Receita por PC",hint:"Resultado das estações",area:"computers",page:"ledger",icon:"▣"}
];
export function AdminShortcuts(){
 const [message,setMessage]=useState("");
 return <section className="react-admin-shortcuts" aria-label="Acesso rápido à administração">
  <div className="react-admin-shortcuts-heading">
   <div><span className="react-admin-kicker">ACESSO RÁPIDO</span><h3>O que você precisa resolver?</h3></div>
   <span className="react-admin-helper">Escolha uma tarefa para abrir o painel correspondente</span>
  </div>
  <div className="react-admin-shortcuts-grid">
   {ADMIN_SHORTCUTS.map(item=><button type="button" key={item.area+"-"+item.page}
    className="react-admin-shortcut" data-ui-area={item.area} data-ui-page={item.page}
    onClick={()=>setMessage(navigateToArea(item.area,item.page)??"")}>
    <span className="react-admin-shortcut-icon" aria-hidden="true">{item.icon}</span>
    <span><strong>{item.label}</strong><small>{item.hint}</small></span>
    <span className="react-admin-arrow" aria-hidden="true">›</span>
   </button>)}
  </div>
  <p className="react-admin-shortcut-status" role="status" aria-live="polite">{message}</p>
 </section>;
}

/* Search is view-only: the original shop catalog keeps ownership of items and actions. */
export function ShopSearch(){
 const [query,setQuery]=useState("");
 const [counts,setCounts]=useState({visible:0,total:0});
 useEffect(()=>{
  const host=document.getElementById("shop-catalog");
  const nav=document.getElementById("react-shop-categories");
  if(!host||!nav)return;
  const apply=()=>{
   const cards=Array.from(host.querySelectorAll(":scope > article.shop-card"));
   let visible=0;
   for(const card of cards){
    const title=card.querySelector("h3")?.textContent??"";
    const category=card.querySelector("small")?.textContent??"";
    const description=card.querySelector("p")?.textContent??"";
    const matches=catalogSearchMatch(query,[title,category,description]);
    card.hidden=!matches;
    if(matches)visible++;
   }
   setCounts(previous=>previous.total===cards.length&&previous.visible===visible?
    previous:{visible,total:cards.length});
  };
  const reset=()=>setQuery("");
  host.addEventListener("lhs:shop-catalog-updated",apply);
  nav.addEventListener("lhs:shop-category-selected",reset);
  apply();
  return ()=>{
   host.removeEventListener("lhs:shop-catalog-updated",apply);
   nav.removeEventListener("lhs:shop-category-selected",reset);
  };
 },[query]);
 return <div className="react-shop-search">
  <label htmlFor="react-shop-query">Pesquisar produtos e serviços</label>
  <div className="react-shop-search-row">
   <input id="react-shop-query" type="search" autoComplete="off"
    placeholder="Computador, console, impressora..." value={query}
    onChange={event=>setQuery(event.target.value)}/>
   {query&&<button type="button" onClick={()=>setQuery("")} aria-label="Limpar busca">Limpar</button>}
  </div>
  <span className="react-shop-search-count" role="status" aria-live="polite">
   {query?counts.visible+" de "+counts.total+" cartões encontrados":
    counts.total+" opções nesta categoria"}
  </span>
  {query&&counts.total>0&&counts.visible===0&&
   <p className="react-shop-no-match">Nenhum cartão corresponde à busca. Tente outro termo ou escolha outra categoria.</p>}
 </div>;
}
