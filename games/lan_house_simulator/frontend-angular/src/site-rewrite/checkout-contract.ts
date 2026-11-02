/**
 * Angular checkout CONTRACT only. Intentionally not wired into a live component,
 * account client, browser navigation or production API.
 * Tests MUST inject a synthetic backend; no real checkout can be started here.
 */
export type DonationPackageId='donate-5'|'donate-10';
export interface VerifiedCheckoutAccount {
 readonly emailVerified:boolean;
}
export interface ApprovedQuote {
 readonly packageId:DonationPackageId;
 readonly priceCents:number;
 readonly cookies:number;
 readonly mode:'sandbox';
}
export interface SandboxCheckoutReceipt extends ApprovedQuote {
 readonly orderId:string;
 readonly checkoutUrl:string;
 readonly paymentStatus:'not-confirmed';
}
/** No real requests are made unless a future explicitly-reviewed adapter is supplied. */
export interface SandboxCheckoutAdapter {
 readConfig():Promise<unknown>;
 createOrder(
  body:Readonly<{packageId:DonationPackageId;acceptedTerms:true}>,
  idempotencyKey:string
 ):Promise<unknown>;
}
const knownPackages:ReadonlySet<string>=new Set(['donate-5','donate-10']);
const sandboxHosts:ReadonlySet<string>=new Set([
 'sandbox.mercadopago.com.br','sandbox.mercadopago.com'
]);
function record(value:unknown):Record<string,unknown>{
 if(value===null||typeof value!=='object'||Array.isArray(value))
  throw Error('Resposta do serviço inválida.');
 return value as Record<string,unknown>;
}
function positiveInt(value:unknown):value is number{
 return typeof value==='number'&&Number.isSafeInteger(value)&&value>0&&value<=1000000;
}
export function approvedPackageId(id:string):DonationPackageId{
 if(!knownPackages.has(id))throw Error('Pacote de apoio desconhecido.');
 return id as DonationPackageId;
}
/** Backend catalogue is authoritative. Never accept price/cookies from browser forms. */
export function validateSandboxQuote(raw:unknown,packageId:DonationPackageId):ApprovedQuote{
 const response=record(raw);
 if(response['paymentsEnabled']!==true||response['paymentsMode']!=='sandbox')
  throw Error('Checkout de teste indisponível.');
 const packages=record(response['packages']);
 const price=record(packages[packageId]);
 if(!positiveInt(price['priceCents'])||!positiveInt(price['cookies']))
  throw Error('Pacote inválido recebido do serviço.');
 return {packageId,priceCents:price['priceCents'],cookies:price['cookies'],mode:'sandbox'};
}
/** Inspect an issued sandbox URL; never open it or treat it as a confirmed payment. */
export function validateSandboxOrder(raw:unknown):Readonly<{orderId:string;checkoutUrl:string}>{
 const order=record(raw);
 const id=order['id'];
 if(typeof id!=='string'||!/^[a-f0-9]{64}$/.test(id))
  throw Error('Identificador do pedido inválido.');
 if(typeof order['url']!=='string')throw Error('Checkout inválido.');
 let url:URL;
 try{url=new URL(order['url']);}catch{throw Error('Checkout inválido.');}
 if(url.protocol!=='https:'||url.username||url.password||url.port||url.hash||
  !sandboxHosts.has(url.hostname))
  throw Error('Destino de checkout não permitido para testes.');
 return {orderId:id,checkoutUrl:url.href};
}
export function validateIdempotencyKey(value:string):string{
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value))
  throw Error('Chave de repetição inválida.');
 return value;
}
/**
 * Model the full prospective handshake using INJECTED test-only responses.
 * Do NOT use with a real adapter until payment UX, permissions and guards are reviewed.
 * A retry must reuse the same caller-owned idempotency key.
 */
export async function simulateSandboxCheckout(options:Readonly<{
 readonly account:VerifiedCheckoutAccount|null;
 readonly packageId:string;
 readonly acceptedTerms:boolean;
 readonly idempotencyKey:string;
 readonly adapter:SandboxCheckoutAdapter;
}>):Promise<SandboxCheckoutReceipt>{
 if(options.account?.emailVerified!==true)
  throw Error('Confirme seu email antes de apoiar o projeto.');
 if(options.acceptedTerms!==true)
  throw Error('Confirme os termos do apoio.');
 const packageId=approvedPackageId(options.packageId);
 const key=validateIdempotencyKey(options.idempotencyKey);
 const quote=validateSandboxQuote(await options.adapter.readConfig(),packageId);
 // Explicitly omit all client-side monetary values. Server creates the price.
 const order=validateSandboxOrder(await options.adapter.createOrder(
  {packageId,acceptedTerms:true},key));
 return {...quote,...order,paymentStatus:'not-confirmed'};
}
