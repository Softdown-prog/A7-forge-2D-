/** Standalone authenticated sandbox adapter, intentionally NOT imported by Donate UI.
 * All calls stay on the configured HTTPS API origin. No provider redirect occurs.
 */
import {AccountError,SiteAccountClient} from './account-client';
import type {SandboxCheckoutAdapter} from './checkout-contract';
export function createAuthenticatedSandboxAdapter(
 client:SiteAccountClient,
 request:typeof fetch=(input,init)=>fetch(input,init)
):SandboxCheckoutAdapter{
 if(!client.config.enabled)throw new AccountError('Conta indisponível.');
 const url=new URL('/v1/config',client.config.apiUrl);
 return {
  async readConfig():Promise<unknown>{
   let response:Response;
   try{
    response=await request(url,{
     method:'GET',cache:'no-store',credentials:'omit',referrerPolicy:'origin',
     signal:AbortSignal.timeout(15000)
    });
   }catch{throw new AccountError('Não foi possível consultar o ambiente de teste.');}
   if(!response.ok)throw new AccountError('Ambiente de teste indisponível.',response.status);
   return await response.json() as unknown;
  },
  createOrder:(body,idempotencyKey)=>client.postSandboxOrder(body,idempotencyKey)
 };
}

export {SiteAccountClient};
