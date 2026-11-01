/** Validated read-only view of orders created by the server, never the browser URL. */
export interface DonateOrder {
 readonly id:string;
 readonly priceCents:number;
 readonly cookies:number;
 readonly mode:'sandbox'|'production';
 readonly statusLabel:string;
}
const labels:Readonly<Record<string,string>>={
 created:'Pedido iniciado',
 pending:'Pagamento pendente',
 in_process:'Em processamento',
 in_mediation:'Em análise',
 approved:'Pagamento aprovado pelo provedor',
 authorized:'Pagamento autorizado',
 rejected:'Pagamento recusado',
 cancelled:'Cancelado',
 refunded:'Reembolsado',
 charged_back:'Contestação registrada'
};
export function readDonateOrders(raw:unknown):DonateOrder[]{
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Histórico inválido');
 const orders=(raw as Record<string,unknown>)['orders'];
 if(!Array.isArray(orders)||orders.length>10)throw Error('Histórico inválido');
 return orders.map((entry:unknown):DonateOrder=>{
  if(!entry||typeof entry!=='object'||Array.isArray(entry))throw Error('Pedido inválido');
  const row=entry as Record<string,unknown>;
  const {id,priceCents,cookies,status,mode}=row;
  if(typeof id!=='string'||!/^[a-f0-9]{64}$/.test(id)||
   typeof priceCents!=='number'||!Number.isSafeInteger(priceCents)||
   priceCents<=0||priceCents>1000000||
   typeof cookies!=='number'||!Number.isSafeInteger(cookies)||
   cookies<=0||cookies>1000000||
   typeof status!=='string'||status.length>80||
   (mode!=='sandbox'&&mode!=='production'))throw Error('Pedido inválido');
  return {id,priceCents,cookies,mode,statusLabel:labels[status]??'Status não reconhecido'};
 });
}
