import type {GameState,Result} from '../sim/types.js';
import {PRODUCTS,SUPPLIERS,availableProducts,merchandiseStock,merchandisePrice,averageProductCost,
 orderMerchandise,setMerchandisePrice,quoteOrder,productSpec,productQuality,type ProductId,type SupplierId} from '../sim/merchandise.js';
import {yearFromMinutes} from '../sim/historicalEconomy.js';
const money=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
/** Stable DOM: live updates never replace controls, steal focus or move scroll. */
export function installMerchandisePanel(getState:()=>GameState,commit:(r:Result)=>void){
 const catalog=document.getElementById('merchandise-catalog')!;
 catalog.innerHTML=`<p>Escolha uma mercadoria. O estoque é compartilhado com os clientes no salão.</p>
 <div class="merchandise-fields"><label>Categoria<select id="merchandise-category"><option value="soda">Bebidas</option><option value="candy">Balas, chicletes e doces</option><option value="snacks">Biscoitos e salgadinhos</option></select></label>
 <label>Mercadoria<select id="merchandise-product"></select></label></div>
 <p id="merchandise-detail"></p><p id="merchandise-margin"></p><p id="merchandise-sales"></p>
 <form id="merchandise-price-form" class="merchandise-fields"><label>Preço de venda por unidade<input id="merchandise-price" type="number" inputmode="decimal" min="0.25" max="100" step="0.01" required></label><button class="slice" type="submit">Aplicar preço</button></form>
 <hr><h4>Comprar mercadoria</h4><div class="merchandise-fields"><label>Fornecedor<select id="merchandise-supplier"></select></label><label>Lotes<input id="merchandise-packs" type="number" inputmode="numeric" min="1" max="50" step="1" value="1"></label></div>
 <p id="merchandise-quote"></p><button id="merchandise-order" type="button" class="slice">Fazer pedido</button><p id="merchandise-feedback" role="status" aria-live="polite"></p>`;
 const $=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
 const category=$<HTMLSelectElement>('merchandise-category'),product=$<HTMLSelectElement>('merchandise-product'),supplier=$<HTMLSelectElement>('merchandise-supplier'),packs=$<HTMLInputElement>('merchandise-packs'),price=$<HTMLInputElement>('merchandise-price');
 for(const sp of SUPPLIERS){const o=document.createElement('option');o.value=sp.id;o.textContent=sp.name;supplier.append(o);}
 const comparisons=$('merchandise-suppliers');
 comparisons.innerHTML='<h4>Condições comerciais</h4><p>Compare o mesmo produto na aba Mercadorias. O contrato parceiro custa R$ 180 uma única vez e já contratado em saves antigos continua valendo.</p>';
 for(const sp of SUPPLIERS){const article=document.createElement('article');article.className='merchandise-supplier-card';const h=document.createElement('h4');h.textContent=sp.name;const p=document.createElement('p');p.textContent=sp.description;article.append(h,p);comparisons.append(article);}
 let optionKey='';
 function text(id:string,value:string){const node=$(id);if(node.textContent!==value)node.textContent=value;}
 function render(){
  const s=getState(),key=category.value+yearFromMinutes(s.totalMinutes);
  if(key!==optionKey){
   const previous=product.value;product.replaceChildren();
   for(const p of availableProducts(s).filter(p=>p.category===category.value)){const o=document.createElement('option');o.value=p.id;o.textContent=p.name;product.append(o);}
   if(Array.from(product.options).some(o=>o.value===previous))product.value=previous;
   optionKey=key;
  }
  const id=product.value as ProductId,p=productSpec(id)!;if(!p)return;
  const value=merchandisePrice(s,id),cost=averageProductCost(s,id),a=s.merchandise?.products[id];
  const future=PRODUCTS.filter(p=>p.category===category.value&&p.year>yearFromMinutes(s.totalMinutes));
  text('merchandise-detail',`${merchandiseStock(s,id)} un. disponíveis · lote de ${p.pack} un. · qualidade ${Math.round(productQuality(s,id)*100)}%.`+(future.length?' Próxima novidade: '+future[0]!.name+' em '+future[0]!.year+'.':''));
  text('merchandise-margin',`Custo médio/un.: ${money(cost)} · venda: ${money(value)} · margem bruta/un.: ${money(value-cost)} (${((value-cost)/value*100).toFixed(1)}%). Estoque legado/inicial usa custo de referência estimado; não gera despesa nova.`);
  text('merchandise-sales',`Desde a atualização: ${a?.sold??0} un. vendidas · receita ${money(a?.revenue??0)} · custo das unidades vendidas ${money(a?.costOfSales??0)} · margem bruta ${money((a?.revenue??0)-(a?.costOfSales??0))}. Aluguel, energia e adesão não estão nesta margem.`);
  if(document.activeElement!==price)price.value=value.toFixed(s.economyVersion===2?2:0);
  price.min=s.economyVersion===2?'0.25':'1';price.max=s.economyVersion===2?'100':'40';price.step=s.economyVersion===2?'0.01':'1';
  const sp=SUPPLIERS.find(p=>p.id===supplier.value)!,count=Number(packs.value),quote=quoteOrder(s,id,sp.id,Number.isInteger(count)?count:0);
  packs.min=String(sp.minPacks);
  const eligible=count>=sp.minPacks&&count<=50&&Number.isInteger(count);
  const compare=SUPPLIERS.map(sp=>sp.name+': '+money(quoteOrder(s,id,sp.id)/p.pack)+'/un.').join(' · ');
  text('merchandise-quote',`${compare} Pedido: ${eligible?count*p.pack:0} un. por ${money(quote)}. ${sp.description} Caixa: ${money(s.cash)}. Pagamento integral agora; entrega não cobra novamente.`);
  $<HTMLButtonElement>('merchandise-order').disabled=!eligible||s.cash<quote||(sp.id==='partner'&&s.supplierTier!==2);
  const orders=s.merchandise?.orders??[];
  const orderText=orders.length?orders.map(o=>`#${o.id} ${productSpec(o.product)!.name} · ${o.quantity} un. · pago ${money(o.cost)} · faltam ${Math.max(0,o.dueMinute-s.totalMinutes)} min de jogo (dia ${Math.floor(o.dueMinute/720)+1}).`).join('\n'):'Nenhum pedido pendente. Entregas avançam com o relógio da partida e persistem no save.';
  text('merchandise-orders',orderText);
 }
 const done=(r:Result)=>{text('merchandise-feedback',r.message);commit(r);render();};
 category.addEventListener('change',render);product.addEventListener('change',render);
 supplier.addEventListener('change',()=>{packs.value=String(SUPPLIERS.find(s=>s.id===supplier.value)!.minPacks);render();});
 packs.addEventListener('input',render);
 $('merchandise-price-form').addEventListener('submit',e=>{e.preventDefault();done(setMerchandisePrice(getState(),product.value as ProductId,Number(price.value)));});
 $('merchandise-order').addEventListener('click',()=>done(orderMerchandise(getState(),product.value as ProductId,supplier.value as SupplierId,Number(packs.value))));
 return {render};
}
