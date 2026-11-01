/** Account transport for the independent Angular site: no legacy website JS. */
export interface AccountConfig {
 enabled:boolean; apiUrl:string; firebaseApiKey:string;
 verificationEmailProvider?:'auto'|'firebase'|'resend';
}
export interface AccountProfile {email:string;emailVerified:boolean}
export interface MainSave {revision:string|null;save:unknown|null;updatedAt:string|null}
export interface AccountMetrics {cookiesBalance:number}
interface FirebaseTokens {idToken:string;refreshToken:string;email:string}
interface Session extends FirebaseTokens {createdAt:number}
interface RequestJson { [key:string]:unknown }
export class AccountError extends Error {
 constructor(message:string,readonly status=0,readonly code=''){super(message);}
}
const SESSION_KEY='lhs.account.session.v1';
const SESSION_MAX_AGE=8*60*60*1000;
const codes:Readonly<Record<string,string>>={
 EMAIL_EXISTS:'Já existe uma conta com este email. Entre ou recupere sua senha.',
 INVALID_LOGIN_CREDENTIALS:'Não foi possível entrar. Confira seu email e sua senha.',
 EMAIL_NOT_FOUND:'Não foi possível entrar. Confira seu email e sua senha.',
 INVALID_PASSWORD:'Não foi possível entrar. Confira seu email e sua senha.',
 INVALID_EMAIL:'Informe um email válido.',
 WEAK_PASSWORD:'Use uma senha mais forte, com pelo menos 8 caracteres.',
 TOO_MANY_ATTEMPTS_TRY_LATER:'Muitas tentativas. Aguarde e tente novamente.',
 USER_DISABLED:'Esta conta está indisponível. Entre em contato pelo site.',
 OPERATION_NOT_ALLOWED:'Acesso por email temporariamente indisponível.'
};
export function validateAccountConfig(raw:unknown):AccountConfig {
 if(!raw||typeof raw!=='object')throw new AccountError('Configuração de conta indisponível.');
 const data=raw as Partial<AccountConfig>;
 if(data.enabled!==true)return {enabled:false,apiUrl:'',firebaseApiKey:''};
 if(typeof data.apiUrl!=='string'||typeof data.firebaseApiKey!=='string'||
  !data.firebaseApiKey.trim())throw new AccountError('Configuração de conta inválida.');
 const url=new URL(data.apiUrl);
 if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||
  url.search||url.hash)throw new AccountError('Endereço da API inválido.');
 if(data.verificationEmailProvider!==undefined&&
  !['auto','resend','firebase'].includes(data.verificationEmailProvider))
  throw new AccountError('Provedor de confirmação inválido.');
 return {enabled:true,apiUrl:url.origin,firebaseApiKey:data.firebaseApiKey,
  verificationEmailProvider:data.verificationEmailProvider??'firebase'};
}
export class SiteAccountClient {
 private session:Session|null=null;
 private epoch=0;
 private refreshing:Promise<void>|null=null;
 private readonly apiOrigin:string;
 private readonly storage:Storage|null;
 constructor(readonly config:AccountConfig,private readonly transport:typeof fetch=(input,init)=>fetch(input,init),
  storage?:Storage|null,private readonly now:()=>number=Date.now){
  if(!config.enabled)throw new AccountError('Conta temporariamente indisponível.');
  this.apiOrigin=validateAccountConfig(config).apiUrl;
  if(storage!==undefined)this.storage=storage;
  else{let found:Storage|null=null;try{found=window.sessionStorage;}catch{}this.storage=found;}
  this.readSession();
 }
 get hasSession():boolean{return this.session!==null;}
 private forget():void{try{this.storage?.removeItem(SESSION_KEY);}catch{}}
 private persist():void{
  try{
   if(this.session)this.storage?.setItem(SESSION_KEY,JSON.stringify({
    apiUrl:this.apiOrigin,firebaseApiKey:this.config.firebaseApiKey,...this.session
   }));
   else this.forget();
  }catch{}
 }
 private readSession():void{
  try{
   const raw=this.storage?.getItem(SESSION_KEY);
   if(!raw)return;
   if(raw.length>24000)throw Error();
   const value=JSON.parse(raw) as Record<string,unknown>;
   if(value['apiUrl']!==this.apiOrigin||value['firebaseApiKey']!==this.config.firebaseApiKey ||
    typeof value['createdAt']!=='number'||!Number.isFinite(value['createdAt'])||
    this.now()-value['createdAt']<0||this.now()-value['createdAt']>=SESSION_MAX_AGE ||
    !['idToken','refreshToken'].every(key=>typeof value[key]==='string'&&
      (value[key] as string).length>0&&(value[key] as string).length<10000)||
    typeof value['email']!=='string'||value['email'].length>320)throw Error();
   this.session={idToken:value['idToken'] as string,refreshToken:value['refreshToken'] as string,
    email:value['email'] as string,createdAt:value['createdAt']};
  }catch{this.forget();}
 }
 signOut():void{this.epoch++;this.session=null;this.refreshing=null;this.forget();}
 private activeSession():Session {
  if(!this.session)throw new AccountError('Entre na sua conta.',401);
  if(this.now()-this.session.createdAt>=SESSION_MAX_AGE){
   this.signOut();throw new AccountError('Sua sessão expirou. Entre novamente.',401);
  }
  return this.session;
 }
 private async json(address:string,options:RequestInit={}):Promise<RequestJson>{
  let response:Response;
  try{
   response=await this.transport(address,{...options,
    signal:AbortSignal.timeout(30000),referrerPolicy:'origin'});
  }catch{throw new AccountError('Sem conexão com o serviço. Sua partida local foi preservada.');}
  const parsed:unknown=await response.json().catch(()=>({}));
  const data=parsed&&typeof parsed==='object'?parsed as RequestJson:{};
  if(!response.ok){
   const error=data['error'];
   const raw=typeof error==='string'?error:
    error&&typeof error==='object'?'message' in error?String(error.message):'':'';
   const code=raw.split(' : ')[0]??'';
   throw new AccountError(codes[code]??(typeof error==='string'?
    error:'Não foi possível concluir. Tente novamente.'),response.status,code);
  }
  return data;
 }
 private identity(method:string,data:RequestJson):Promise<RequestJson>{
  return this.json('https://identitytoolkit.googleapis.com/v1/accounts:'+method+
   '?key='+encodeURIComponent(this.config.firebaseApiKey),{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)
   });
 }
 async profile():Promise<AccountProfile>{
  const idToken=this.activeSession().idToken;
  const result=await this.identity('lookup',{idToken});
  const users=result['users'];
  const user=Array.isArray(users)?users[0] as Record<string,unknown>|undefined:undefined;
  if(!user||typeof user['email']!=='string')throw new AccountError('Sessão inválida.',401);
  return {email:user['email'],emailVerified:user['emailVerified']===true};
 }
 async signIn(email:string,password:string):Promise<AccountProfile>{
  this.signOut();const epoch=this.epoch;
  const result=await this.identity('signInWithPassword',{email,password,returnSecureToken:true});
  if(epoch!==this.epoch)throw new AccountError('Sessão encerrada.',401);
  this.acceptTokens(result,email);return this.profile();
 }
 private acceptTokens(result:RequestJson,email:string):void{
  if(typeof result['idToken']!=='string'||typeof result['refreshToken']!=='string'||
   !result['idToken']||!result['refreshToken'])throw new AccountError('Resposta inválida do serviço.');
  this.session={idToken:result['idToken'],refreshToken:result['refreshToken'],
   email:typeof result['email']==='string'?result['email']:email,createdAt:this.now()};
  this.persist();
 }
 async signUp(email:string,password:string):Promise<AccountProfile>{
  if(password.length<8)throw new AccountError('Use pelo menos 8 caracteres na senha.');
  this.signOut();const epoch=this.epoch;
  const result=await this.identity('signUp',{email,password,returnSecureToken:true});
  if(epoch!==this.epoch)throw new AccountError('Sessão encerrada.',401);
  this.acceptTokens(result,email);
  await this.sendVerification();return {email:this.activeSession().email,emailVerified:false};
 }
 async refresh():Promise<void>{
  const token=this.activeSession().refreshToken;
  if(this.refreshing)return this.refreshing;
  const epoch=this.epoch;
  const promise=(async()=>{
   try{
    const result=await this.json('https://securetoken.googleapis.com/v1/token?key='+
     encodeURIComponent(this.config.firebaseApiKey),{method:'POST',
     headers:{'Content-Type':'application/x-www-form-urlencoded'},
     body:new URLSearchParams({grant_type:'refresh_token',refresh_token:token})});
    if(epoch!==this.epoch||!this.session)throw new AccountError('Sessão encerrada.',401);
    if(typeof result['id_token']!=='string'||typeof result['refresh_token']!=='string')
     throw new AccountError('Resposta inválida do serviço.');
    this.session={...this.session,idToken:result['id_token'],
     refreshToken:result['refresh_token']};this.persist();
   }catch(error){
    if(epoch===this.epoch&&error instanceof AccountError&&error.status===400){
     this.signOut();throw new AccountError('Sua sessão expirou. Entre novamente.',401);
    }
    throw error;
   }
  })();
  this.refreshing=promise;
  try{await promise;}finally{if(this.refreshing===promise)this.refreshing=null;}
 }
 async restore():Promise<AccountProfile|null>{
  if(!this.session)return null;
  await this.refresh();
  try{return await this.profile();}
  catch(error){
   if(error instanceof AccountError&&[400,401].includes(error.status)){
    this.signOut();throw new AccountError('Sua sessão expirou. Entre novamente.',401);
   }
   throw error;
  }
 }
 async api(path:string,body?:RequestJson,retried=false):Promise<RequestJson>{
  if(!(path==='/v1/orders'&&body===undefined)&&
   !/^\/v1\/(?:account|saves\/main(?:\?backup=true)?|auth\/verification-email)$/.test(path))
   throw new AccountError('Rota não autorizada.');
  const session=this.activeSession(),epoch=this.epoch;
  try{
   const result=await this.json(this.apiOrigin+path,{
    method:body===undefined?'GET':'POST',
    headers:{Authorization:'Bearer '+session.idToken,
     ...(body===undefined?{}:{'Content-Type':'application/json'})},
    ...(body===undefined?{}:{body:JSON.stringify(body)})
   });
   if(epoch!==this.epoch)throw new AccountError('Sessão encerrada.',401);
   return result;
  }catch(error){
   if(error instanceof AccountError&&error.status===401&&!retried&&epoch===this.epoch){
    await this.refresh();return this.api(path,body,true);
   }
   throw error;
  }
 }
 async sendVerification():Promise<void>{
  const token=this.activeSession().idToken,epoch=this.epoch;
  let provider=this.config.verificationEmailProvider??'firebase';
  if(provider==='auto'){
   const config=await this.json(this.apiOrigin+'/v1/config');
   provider=config['verificationEmailProvider']==='resend'?'resend':'firebase';
  }
  if(epoch!==this.epoch)throw new AccountError('Sessão encerrada.',401);
  if(provider==='resend')await this.api('/v1/auth/verification-email',{});
  else await this.identity('sendOobCode',{requestType:'VERIFY_EMAIL',idToken:token});
 }
 async resetPassword(email:string):Promise<void>{
  try{await this.identity('sendOobCode',{requestType:'PASSWORD_RESET',email});}
  catch(error){
   if(!(error instanceof AccountError)||error.code!=='EMAIL_NOT_FOUND')throw error;
  }
 }
}
