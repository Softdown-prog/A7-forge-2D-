import {approvedPackageId,validateIdempotencyKey} from './checkout-contract';
import type {DonationPackageId} from './checkout-contract';
export interface ProductionQuote{packageId:DonationPackageId;priceCents:number;cookies:number}
export function productionCheckoutEnabled(raw:unknown):boolean{
 return !!raw&&typeof raw==='object'&&
  (raw as Record<string,unknown>)['productionCheckoutEnabled']===true;
}
export function productionQuote(raw:unknown,id:string):ProductionQuote{
 const packageId=approvedPackageId(id);
 if(!raw||typeof raw!=='object')throw Error('Catálogo indisponível.');
 const config=raw as Record<string,unknown>;
 if(config['paymentsEnabled']!==true||config['paymentsMode']!=='production')throw Error('Pagamento indisponível.');
 const packs=config['packages'];
 if(!packs||typeof packs!=='object')throw Error('Catálogo inválido.');
 const value=(packs as Record<string,unknown>)[packageId];
 if(!value||typeof value!=='object')throw Error('Pacote inválido.');
 const pack=value as Record<string,unknown>,priceCents=pack['priceCents'],cookies=pack['cookies'];
 if(typeof priceCents!=='number'||!Number.isSafeInteger(priceCents)||priceCents<=0||priceCents>1000000||
  typeof cookies!=='number'||!Number.isSafeInteger(cookies)||cookies<=0||cookies>1000000)throw Error('Valores inválidos.');
 return {packageId,priceCents,cookies};
}
export function productionOrder(raw:unknown):{id:string;url:string}{
 if(!raw||typeof raw!=='object')throw Error('Pedido inválido.');
 const value=raw as Record<string,unknown>;
 if(typeof value['id']!=='string'||!/^[a-f0-9]{64}$/.test(value['id'])||typeof value['url']!=='string')throw Error('Pedido inválido.');
 const url=new URL(value['url']);
 if(url.protocol!=='https:'||url.username||url.password||url.port||url.hash||
  !['www.mercadopago.com.br','www.mercadopago.com'].includes(url.hostname)||
  url.pathname!=='/checkout/v1/redirect'||url.searchParams.getAll('pref_id').length!==1||
  !url.searchParams.get('pref_id')?.trim()||[...url.searchParams.keys()].some(key=>key!=='pref_id'))throw Error('Checkout inválido.');
 return {id:value['id'],url:url.href};
}
export async function prepareProductionCheckout(options:{enabled:boolean;quote:ProductionQuote;key:string;
 readConfig:()=>Promise<unknown>;createOrder:(body:{packageId:DonationPackageId;acceptedTerms:true},key:string)=>Promise<unknown>;
 acceptedTerms:boolean}):Promise<{id:string;url:string}>{
 if(options.enabled!==true||options.acceptedTerms!==true)throw Error('Confirme a disponibilidade e os termos.');
 const key=validateIdempotencyKey(options.key);
 const fresh=productionQuote(await options.readConfig(),options.quote.packageId);
 if(fresh.priceCents!==options.quote.priceCents||fresh.cookies!==options.quote.cookies)throw Error('Os valores mudaram. Reabra a revisão.');
 return productionOrder(await options.createOrder({packageId:fresh.packageId,acceptedTerms:true},key));
}
