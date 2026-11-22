/** DOM-only standalone compatibility shell; production /game runs Angular.
 * Historical react-* anchor IDs / react-entry.js URL remain until legacy
 * regression consumers are retired. No React dependency, JSX or game state.
 */
import {catalogSearchMatch} from "../react/catalogSearch.mjs";
function mount(id,html){
 const host=document.getElementById(id);
 if(!host)throw new Error("Legacy UI root ausente: "+id);
 host.innerHTML=html;return host;
}
mount("react-menu-actions",`
 <button id="menu-new" type="button" class="primary" data-icon="play">Abrir minha lan house<span class="button-arrow" aria-hidden="true">→</span></button>
 <button id="menu-continue" type="button" data-icon="continue">Continuar partida</button>
 <button id="menu-account" type="button" data-icon="users" aria-controls="player-account">Minha Conta · 🍪</button>
 <button id="menu-options" type="button" data-icon="settings" aria-expanded="false" aria-controls="menu-settings">Opções</button>`);
const CHAPTERS=[
 {id:"abrir",label:"01 · Comece pequeno",title:"Sua primeira lan house",body:"Três computadores, um balcão e muita vontade de crescer. Ajuste os preços e conquiste os primeiros clientes.",note:"1998 · O começo de tudo"},
 {id:"crescer",label:"02 · Faça crescer",title:"Cada decisão muda o salão",body:"Organize as mesas, amplie o espaço e cuide de cada estação. A evolução acontece diante dos seus olhos.",note:"Gestão · Layout · Expansão"},
 {id:"historia",label:"03 · Viva a época",title:"A internet tem uma história",body:"Do correio às novas tecnologias, descubra eventos e mudanças ao longo de uma campanha que atravessa décadas.",note:"Evolução · Oportunidades · Memórias"}
];
const tour=mount("react-menu-tour",`
<div class="react-chapters">
 <div class="react-chapters-heading"><span>UM SALÃO. MUITAS HISTÓRIAS.</span><span class="react-chapters-rule" aria-hidden="true"></span></div>
 <div class="react-chapters-tabs" role="tablist" aria-label="Conheça o jogo">${CHAPTERS.map(c=>`
 <button type="button" role="tab" id="react-tab-${c.id}" class="react-chapter-tab" aria-controls="react-chapter-content" data-chapter="${c.id}">${c.label}</button>`).join("")}</div>
 <div class="react-chapter-detail" id="react-chapter-content" role="tabpanel"></div>
</div>`);
function showChapter(id){
 const c=CHAPTERS.find(item=>item.id===id)??CHAPTERS[0];
 for(const tab of tour.querySelectorAll("[data-chapter]")){
  const active=tab.dataset.chapter===c.id;
  tab.classList.toggle("active",active);tab.setAttribute("aria-selected",String(active));
 }
 const panel=tour.querySelector("#react-chapter-content");
 panel.setAttribute("aria-labelledby","react-tab-"+c.id);
 panel.innerHTML=`<span class="react-chapter-marker" aria-hidden="true">✦</span>
  <div><strong>${c.title}</strong><p>${c.body}</p><span class="react-chapter-note">${c.note}</span></div>`;
}
tour.addEventListener("click",event=>{
 const tab=event.target instanceof Element?event.target.closest("[data-chapter]"):null;
 if(tab&&tour.contains(tab))showChapter(tab.dataset.chapter);
});
showChapter(CHAPTERS[0].id);
mount("react-topbar-actions",`
 <button id="open-account" class="slice" type="button" aria-controls="player-account">🍪 Minha Conta</button>
 <button id="open-menu" class="slice" type="button" data-icon="pause">Menu<span class="keyboard-hint">ESC</span></button>
 <button id="open-shop" class="slice" type="button" data-icon="cart" aria-controls="shop" aria-expanded="false">Compras</button>
 <button id="open-notices" class="slice notices-trigger" type="button" data-icon="mail" aria-controls="notices" aria-expanded="false" aria-label="Mensagens da lan house">
 <span class="notice-label">Correio</span><span class="notices-count" id="notices-count" hidden>0</span></button>
 <button id="open-admin" class="slice primary" type="button" data-icon="settings" aria-controls="admin" aria-expanded="false">Administrar</button>`);
function navigateToArea(area,page){
 const admin=document.getElementById("admin");
 if(!admin)return "Painel administrativo indisponível.";
 if(admin.hidden)document.getElementById("open-admin")?.click();
 const tab=admin.querySelector('[data-admin-tab="'+area+'"]');
 if(!(tab instanceof HTMLButtonElement))return "Seção indisponível.";
 tab.click();
 if(page){
  const task=admin.querySelector('#section-'+area+' .management-pages [data-panel-choice="'+page+'"]');
  if(task instanceof HTMLButtonElement){
   if(task.disabled){
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
const quick=mount("react-quick-deck",QUICK_ACTIONS.map(a=>`
 <button type="button" data-ui-shortcut="${a.id}" class="react-quick-action">
 <span aria-hidden="true" class="react-quick-symbol">${a.icon}</span>
 <span class="react-quick-copy"><strong>${a.label}</strong><small>${a.detail}</small></span></button>`).join(""));
quick.addEventListener("click",event=>{
 const button=event.target instanceof Element?event.target.closest("[data-ui-shortcut]"):null;
 if(!button||!quick.contains(button))return;
 const action=QUICK_ACTIONS.find(a=>a.id===button.dataset.uiShortcut);
 if(!action)return;
 if(action.shop)document.getElementById("open-shop")?.click();
 else navigateToArea(action.area,action.page);
});
const SHOP_CATEGORIES=[
 {id:"equipment",label:"Computadores e serviços",icon:"▣",hint:"Equipar o salão"},
 {id:"consoles",label:"Videogames e CDs",icon:"◇",hint:"Diversão por época"},
 {id:"building",label:"Construção",icon:"▦",hint:"Expandir o espaço"},
 {id:"decoration",label:"Decoração",icon:"✦",hint:"Dar personalidade"}
];
const nav=mount("react-shop-categories",SHOP_CATEGORIES.map(c=>`
 <button type="button" class="react-shop-category" data-shop-category="${c.id}" title="${c.hint}" aria-pressed="false">
 <span class="react-shop-icon" aria-hidden="true">${c.icon}</span><span class="react-shop-label">${c.label}</span></button>`).join(""));
nav.addEventListener("lhs:shop-category-selected",event=>{
 for(const button of nav.querySelectorAll("[data-shop-category]"))
  button.setAttribute("aria-pressed",String(button.dataset.shopCategory===event.detail));
});
nav.dispatchEvent(new CustomEvent("lhs:shop-category-selected",{detail:"equipment"}));
const search=mount("react-shop-search",`
 <div class="react-shop-search">
 <label for="react-shop-query">Pesquisar produtos e serviços</label>
 <div class="react-shop-search-row"><input id="react-shop-query" type="search" autocomplete="off" placeholder="Computador, console, impressora...">
 <button type="button" data-clear-query aria-label="Limpar busca" hidden>Limpar</button></div>
 <span class="react-shop-search-count" role="status" aria-live="polite"></span>
 <p class="react-shop-no-match" hidden>Nenhum cartão corresponde à busca. Tente outro termo ou escolha outra categoria.</p></div>`);
const query=search.querySelector("#react-shop-query");
const count=search.querySelector(".react-shop-search-count");
const clear=search.querySelector("[data-clear-query]");
const noMatch=search.querySelector(".react-shop-no-match");
const catalog=document.getElementById("shop-catalog");
function filterCatalog(){
 if(!catalog)return;
 const cards=Array.from(catalog.querySelectorAll(":scope > article.shop-card"));
 const wanted=query.value;
 let visible=0;
 for(const card of cards){
  const title=card.querySelector("h3")?.textContent??"";
  const category=card.querySelector("small")?.textContent??"";
  const description=card.querySelector("p")?.textContent??"";
  const matches=catalogSearchMatch(wanted,[title,category,description]);
  card.hidden=!matches;
  if(matches)visible++;
 }
 count.textContent=wanted?visible+" de "+cards.length+" cartões encontrados":cards.length+" opções nesta categoria";
 clear.hidden=!wanted;
 noMatch.hidden=!(wanted&&cards.length>0&&visible===0);
}
query.addEventListener("input",filterCatalog);
clear.addEventListener("click",()=>{query.value="";filterCatalog();query.focus();});
catalog?.addEventListener("lhs:shop-catalog-updated",filterCatalog);
nav.addEventListener("lhs:shop-category-selected",()=>{query.value="";filterCatalog();});
filterCatalog();
const ADMIN_SHORTCUTS=[
 {label:"Repor estoque",hint:"Bebidas e alimentos",area:"stock",page:"suppliers",icon:"▥"},
 {label:"Mercadorias",hint:"Catálogo e vendas",area:"stock",page:"catalog",icon:"▤"},
 {label:"Preços",hint:"Hora e pacotes",area:"prices",page:"hourly",icon:"R$"},
 {label:"Equipe",hint:"Funcionários e limpeza",area:"services",page:"staff",icon:"⚙"},
 {label:"Internet",hint:"Planos e contrato",area:"services",page:"network",icon:"◎"},
 {label:"Receita por PC",hint:"Resultado das estações",area:"computers",page:"ledger",icon:"▣"}
];
const shortcuts=mount("react-admin-shortcuts",`
 <section class="react-admin-shortcuts" aria-label="Acesso rápido à administração">
 <div class="react-admin-shortcuts-heading"><div><span class="react-admin-kicker">ACESSO RÁPIDO</span>
 <h3>O que você precisa resolver?</h3></div><span class="react-admin-helper">Escolha uma tarefa para abrir o painel correspondente</span></div>
 <div class="react-admin-shortcuts-grid">${ADMIN_SHORTCUTS.map(a=>`
 <button type="button" class="react-admin-shortcut" data-ui-area="${a.area}" data-ui-page="${a.page}">
 <span class="react-admin-shortcut-icon" aria-hidden="true">${a.icon}</span>
 <span><strong>${a.label}</strong><small>${a.hint}</small></span>
 <span class="react-admin-arrow" aria-hidden="true">›</span></button>`).join("")}</div>
 <p class="react-admin-shortcut-status" role="status" aria-live="polite"></p></section>`);
shortcuts.addEventListener("click",event=>{
 const button=event.target instanceof Element?event.target.closest("[data-ui-area][data-ui-page]"):null;
 if(!button||!shortcuts.contains(button))return;
 shortcuts.querySelector('[role="status"]').textContent=navigateToArea(button.dataset.uiArea,button.dataset.uiPage)??"";
});
// "react" is a historical fixture tag; no React library is executed.
document.documentElement.dataset.uiFramework="react";
import("./main.js").catch(error=>{
 console.error("Falha ao iniciar o motor da lan house:",error);
 const el=document.getElementById("save-message");
 if(el)el.textContent="Não foi possível iniciar o jogo. Atualize a página para tentar novamente.";
});
