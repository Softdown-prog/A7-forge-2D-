// Only a provider-confirmed order changes the wallet; return URL parameters never do.
export const orderLabels={created:'Aguardando pagamento',pending:'Aguardando confirmação',in_process:'Em análise',approved:'Pagamento confirmado',rejected:'Pagamento recusado',cancelled:'Pagamento cancelado',refunded:'Pagamento reembolsado',charged_back:'Pagamento contestado'};
export function checkoutUrl(value){
 const url=new URL(value);
 if(url.protocol!=='https:'||url.username||url.password||!['www.mercadopago.com.br','www.mercadopago.com','sandbox.mercadopago.com.br','sandbox.mercadopago.com'].includes(url.hostname))throw Error('Não foi possível abrir o pagamento. Tente novamente.');
 return url.href;
}
export function createDonateController(client,{document:doc=document,request=fetch,uuid=()=>crypto.randomUUID(),navigate=url=>globalThis.location.assign(url)}={}){
 const $=id=>doc.getElementById(id),buttons=[...doc.querySelectorAll('[data-donate-package]')];
 let connected=false,available=false,busy=false,restoring=false,connectionVersion=0,keys=new Map(),prepared=new Map();
 const status=$('donate-status'),orderState=$('donate-order-state');
 function paint(){buttons.forEach(button=>{button.disabled=busy||restoring||!available;button.textContent=restoring?'Conectando sua conta…':(connected?'Doar R$ ':'Entrar para doar R$ ')+(button.dataset.donatePackage==='donate-5'?'5':'10');});}
 function setRestoring(value){restoring=value;paint();}
 async function initialize(apiUrl){
  try{const response=await request(new URL('/v1/config',apiUrl),{cache:'no-store',signal:AbortSignal.timeout(30_000)});if(!response.ok)throw Error();const config=await response.json();available=config.paymentsEnabled===true&&config.paymentsMode==='production';
   status.textContent=available?(connected?'Conta conectada. Confirme os termos de Donate e escolha R$ 5 ou R$ 10.':'Pagamento único: entre na sua conta e confirme seu email para receber Cookies. Escolha R$ 5 ou R$ 10.'):'As doações ainda não foram liberadas. Os valores exibidos são dos dois pagamentos únicos previstos; nenhum pagamento será iniciado.';
  }catch{status.textContent='Não foi possível consultar as doações. Tente recarregar a página.';}paint();
 }
 function hideLink(packageId){const link=$('donate-link-'+packageId);link.hidden=true;link.href='/donate/';}
 function setConnected(value){connectionVersion++;connected=value;if(!value){keys.clear();prepared.clear();for(const button of buttons)hideLink(button.dataset.donatePackage);$('donate-checkout').hidden=true;$('donate-checkout').href='/donate/';orderState.textContent='';$('donate-history').replaceChildren();$('donate-terms').checked=false;}else if(available)status.textContent='Conta conectada. Confirme os termos de Donate e escolha R$ 5 ou R$ 10.';paint();}
 async function history(){
  const {orders}=await client.api('/v1/orders');const list=$('donate-history');list.replaceChildren();
  if(!orders.length)return;
  const heading=doc.createElement('h3');heading.textContent='Seus apoios recentes';list.append(heading);
  for(const order of orders){const p=doc.createElement('p');p.textContent=`R$ ${(order.priceCents/100).toLocaleString('pt-BR',{minimumFractionDigits:2})} · ${order.cookies} Cookies · ${orderLabels[order.status]||'Aguardando confirmação'}`;
   const button=doc.createElement('button');button.className='account-link';button.type='button';button.textContent='Conferir';button.addEventListener('click',()=>void check(order.id));p.append(' ',button);list.append(p);}
 }
 async function check(orderId){if(busy||!connected)return;busy=true;paint();orderState.textContent='Conferindo pagamento…';
  try{const target=orderId||[...prepared.values()].at(-1);if(target){const order=await client.api('/v1/orders/'+encodeURIComponent(target));orderState.textContent=orderLabels[order.status]||'Aguardando confirmação';if(['approved','refunded','charged_back','cancelled'].includes(order.status)){for(const [pack,id] of prepared)if(id===target){prepared.delete(pack);keys.delete(pack);hideLink(pack);}$('donate-checkout').hidden=true;}}else orderState.textContent='Saldo e apoios atualizados. Se o pagamento estiver pendente, confira novamente mais tarde.';
   const account=await client.api('/v1/account');$('cookies-balance').textContent=Number(account.cookiesBalance).toLocaleString('pt-BR');await history();
  }catch(error){orderState.textContent=error.message||'Não foi possível conferir. Tente novamente.';}finally{busy=false;paint();}
 }
 for(const button of buttons)button.addEventListener('click',async()=>{
  if(busy||restoring||!available)return;
  if(!connected){doc.getElementById('account-app').scrollIntoView({behavior:'smooth',block:'start'});$('account-email').focus({preventScroll:true});status.textContent='Entre ou crie sua conta abaixo. Confirme seu email para receber os Cookies.';return;}
  if(!$('donate-terms').checked){$('donate-terms').scrollIntoView({behavior:'smooth',block:'center'});$('donate-terms').focus({preventScroll:true});status.textContent='Sua conta está conectada. Confirme os termos de Donate abaixo e escolha o valor para abrir o pagamento.';return;}
  busy=true;paint();status.textContent='Preparando seu apoio…';
  const packageId=button.dataset.donatePackage,owner=connectionVersion;if(!keys.has(packageId))keys.set(packageId,uuid());
  try{const order=await client.api('/v1/orders',{packageId,acceptedTerms:true},false,{'Idempotency-Key':keys.get(packageId)});if(!connected||owner!==connectionVersion)return;const url=checkoutUrl(order.url);prepared.set(packageId,order.id);const panelLink=$('donate-checkout');panelLink.href=url;panelLink.hidden=false;const cardLink=$('donate-link-'+packageId);cardLink.href=url;cardLink.hidden=false;orderState.textContent='Pagamento único preparado. Se a página não abrir, use o link do card escolhido.';status.textContent='Abrindo o pagamento seguro. Seus Cookies serão adicionados após a confirmação.';navigate(url);
  }catch(error){status.textContent=error.message||'Não foi possível iniciar o pagamento. Tente novamente.';if(error.status===410)keys.delete(packageId);}finally{busy=false;paint();}
 });
 $('donate-refresh').addEventListener('click',()=>void check(new URL(doc.location.href).searchParams.get('order')||undefined));
 return {initialize,setConnected,setRestoring,history};
}
