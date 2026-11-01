/** Personal action codes stay in memory and are sent only to the trusted provider. */
import {validateAccountConfig} from './account-client';

export class ConfirmationError extends Error {
 constructor(message:string,readonly retryable:boolean){super(message);}
}
const validCode=(code:unknown):code is string=>typeof code==='string'&&
 code.length>=16&&code.length<=1024&&/^[A-Za-z0-9_-]+$/.test(code);

export function captureConfirmationCode(
 location:Pick<Location,'pathname'|'search'|'hash'>,
 history:Pick<History,'replaceState'>
):string|null {
 // Strip codes, caller-supplied keys and redirects before the first async work.
 const search=location.search,hash=location.hash;
 if(search||hash)history.replaceState(null,'',location.pathname);
 const fragment=new URLSearchParams(hash.slice(1));
 const query=new URLSearchParams(search);
 const branded=fragment.getAll('codigo'),firebase=query.getAll('oobCode');
 let code:string|null=null;
 if(branded.length===1&&firebase.length===0)code=branded[0]!;
 else if(branded.length===0&&firebase.length===1&&
  query.getAll('mode').length===1&&query.get('mode')==='verifyEmail')code=firebase[0]!;
 return validCode(code)?code:null;
}

export async function confirmEmailCode(code:string,rawConfig:unknown,
 request:typeof fetch=(input,init)=>fetch(input,init),signal?:AbortSignal
):Promise<void> {
 if(!validCode(code))throw new ConfirmationError('Este link é inválido. Peça uma nova confirmação em Minha conta.',false);
 let config;
 try{config=validateAccountConfig(rawConfig);}
 catch{throw new ConfirmationError('A configuração de confirmação está indisponível. Tente novamente mais tarde.',true);}
 if(!config.enabled)throw new ConfirmationError('A confirmação está temporariamente indisponível. Tente novamente mais tarde.',true);
 let response:Response;
 try{
  response=await request('https://identitytoolkit.googleapis.com/v1/accounts:update?key='+
   encodeURIComponent(config.firebaseApiKey),{
    method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',
    referrerPolicy:'origin',body:JSON.stringify({oobCode:code}),
    signal:signal?AbortSignal.any([signal,AbortSignal.timeout(20000)]):AbortSignal.timeout(20000)
   });
 }catch{throw new ConfirmationError('Não foi possível conectar. Confira sua conexão e tente novamente.',true);}
 if(!response.ok){
  const data:unknown=await response.json().catch(()=>null);
  const error=data&&typeof data==='object'&&'error' in data?data.error:null;
  const reason=error&&typeof error==='object'&&'message' in error?error.message:null;
  if(reason==='EXPIRED_OOB_CODE'||reason==='INVALID_OOB_CODE')
   throw new ConfirmationError('Este link expirou ou já foi utilizado. Entre na conta ou peça um novo email de confirmação.',false);
  if(reason==='USER_DISABLED')
   throw new ConfirmationError('Esta conta está indisponível. Entre em contato pelo site.',false);
  throw new ConfirmationError('Não foi possível confirmar agora. Aguarde um momento e tente novamente.',true);
 }
}
