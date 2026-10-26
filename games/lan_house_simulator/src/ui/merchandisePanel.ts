import type {MerchandiseCategory,MerchandisePort} from "../application/merchandisePort.js";
const money=(n:number)=>n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
/** Pure UI: only read-models and commands cross the application boundary.
 * Stable DOM: live updates never replace controls, steal focus or move scroll. */
export function installMerchandisePanel(port:MerchandisePort,commit:(result:{ok:boolean;message:string})=>void){
 const catalog=document.getElementById("merchandise-catalog")!;
 catalog.innerHTML=`<p>Escolha uma mercadoria. O estoque é compartilhado com os clientes no salão.</p>
 <div class="merchandise-fields"><label>Categoria<select id="merchandise-category"><option value="soda">Bebidas</option><option value="candy">Balas, chicletes e doces</option><option value="snacks">Biscoitos e salgadinhos</option></select></label>
 <label>Mercadoria<select id="merchandise-product"></select></label></div>
 <p id="merchandise-detail"></p><p id="merchandise-margin"></p><p id="merchandise-sales"></p>
 <form id="merchandise-price-form" class="merchandise-fields"><label>Preço de venda por unidade<input id="merchandise-price" type="number" inputmode="decimal" min="0.25" max="100" step="0.01" required></label><button class="slice" type="submit">Aplicar preço</button></form>
 <hr><h4>Comprar mercadoria</h4><div class="merchandise-fields"><label>Fornecedor<select id="merchandise-supplier"></select></label><label>Lotes<input id="merchandise-packs" type="number" inputmode="numeric" min="1" max="50" step="1" value="1"></label></div>
 <p id="merchandise-quote"></p><button id="merchandise-order" type="button" class="slice">Fazer pedido</button><p id="merchandise-feedback" role="status" aria-live="polite"></p>`;
 const $=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
 const category=$<HTMLSelectElement>("merchandise-category"),product=$<HTMLSelectElement>("merchandise-product"),
  supplier=$<HTMLSelectElement>("merchandise-supplier"),packs=$<HTMLInputElement>("merchandise-packs"),
  price=$<HTMLInputElement>("merchandise-price");
 for(const sp of port.suppliers){const o=document.createElement("option");o.value=sp.id;o.textContent=sp.name;supplier.append(o);}
 const comparisons=$("merchandise-suppliers");
 comparisons.innerHTML='<h4>Condições comerciais</h4><p>Compare o mesmo produto na aba Mercadorias. O contrato parceiro custa R$ 180 uma única vez e já contratado em saves antigos continua valendo.</p>';
 for(const sp of port.suppliers){const article=document.createElement("article");article.className="merchandise-supplier-card";
  const h=document.createElement("h4");h.textContent=sp.name;const p=document.createElement("p");p.textContent=sp.description;
  article.append(h,p);comparisons.append(article);}
 let optionKey="";
 function text(id:string,value:string){const node=$(id);if(node.textContent!==value)node.textContent=value;}
 function render(){
  const overview=port.overview(category.value as MerchandiseCategory),key=category.value+overview.year;
  if(key!==optionKey){
   const previous=product.value;product.replaceChildren();
   for(const item of overview.products){const o=document.createElement("option");o.value=item.id;o.textContent=item.name;product.append(o);}
   if(Array.from(product.options).some(o=>o.value===previous))product.value=previous;
   optionKey=key;
  }
  const id=product.value,selectedSupplier=port.suppliers.find(sp=>sp.id===supplier.value);
  if(!id||!selectedSupplier)return;
  const count=Number(packs.value),detail=port.details(id,selectedSupplier.id,count);
  if(!detail)return;
  text("merchandise-detail",`${detail.stock} un. disponíveis · lote de ${detail.pack} un. · qualidade ${detail.qualityPercent}%.`+
   (overview.next?" Próxima novidade: "+overview.next.name+" em "+overview.next.year+".":""));
  text("merchandise-margin",`Custo médio/un.: ${money(detail.averageCost)} · venda: ${money(detail.price)} · margem bruta/un.: ${money(detail.price-detail.averageCost)} (${((detail.price-detail.averageCost)/detail.price*100).toFixed(1)}%). Estoque legado/inicial usa custo de referência estimado; não gera despesa nova.`);
  text("merchandise-sales",`Desde a atualização: ${detail.sold} un. vendidas · receita ${money(detail.revenue)} · custo das unidades vendidas ${money(detail.costOfSales)} · margem bruta ${money(detail.revenue-detail.costOfSales)}. Aluguel, energia e adesão não estão nesta margem.`);
  if(document.activeElement!==price)price.value=detail.price.toFixed(detail.priceDecimals);
  price.min=detail.priceMin;price.max=detail.priceMax;price.step=detail.priceStep;
  packs.min=String(selectedSupplier.minPacks);
  const compare=detail.quotes.map(quote=>quote.name+": "+money(quote.costPerUnit)+"/un.").join(" · ");
  text("merchandise-quote",`${compare} Pedido: ${detail.orderQuantity} un. por ${money(detail.orderCost)}. ${selectedSupplier.description} Caixa: ${money(detail.cash)}. Pagamento integral agora; entrega não cobra novamente.`);
  $<HTMLButtonElement>("merchandise-order").disabled=!detail.canOrder;
  const orderText=detail.orders.length?detail.orders.map(o=>`#${o.id} ${o.productName} · ${o.quantity} un. · pago ${money(o.cost)} · faltam ${o.minutesRemaining} min de jogo (dia ${o.dueDay}).`).join("\n"):
   "Nenhum pedido pendente. Entregas avançam com o relógio da partida e persistem no save.";
  text("merchandise-orders",orderText);
 }
 const done=(result:{ok:boolean;message:string})=>{text("merchandise-feedback",result.message);commit(result);render();};
 category.addEventListener("change",render);product.addEventListener("change",render);
 supplier.addEventListener("change",()=>{packs.value=String(port.suppliers.find(sp=>sp.id===supplier.value)!.minPacks);render();});
 packs.addEventListener("input",render);
 $("merchandise-price-form").addEventListener("submit",event=>{event.preventDefault();done(port.setPrice(product.value,Number(price.value)));});
 $("merchandise-order").addEventListener("click",()=>done(port.order(product.value,supplier.value,Number(packs.value))));
 return {render};
}
