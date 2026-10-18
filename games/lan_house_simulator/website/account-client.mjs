export class AccountError extends Error {
 constructor(message,status=0,code=''){super(message);this.status=status;this.code=code;}
}
const messages={
 EMAIL_EXISTS:'Já existe uma conta com este email. Entre ou recupere sua senha.',
 INVALID_LOGIN_CREDENTIALS:'Não foi possível entrar. Confira seu email e sua senha.',
 EMAIL_NOT_FOUND:'Não foi possível entrar. Confira seu email e sua senha.',
 INVALID_PASSWORD:'Não foi possível entrar. Confira seu email e sua senha.',
 INVALID_EMAIL:'Informe um email válido.',
 WEAK_PASSWORD:'Escolha uma senha mais forte, com pelo menos 8 caracteres.',
 TOO_MANY_ATTEMPTS_TRY_LATER:'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
 USER_DISABLED:'Esta conta está indisponível. Entre em contato com o suporte.',
 OPERATION_NOT_ALLOWED:'O acesso por email está temporariamente indisponível.'
};
const SESSION_KEY='lhs.account.session.v1',SESSION_MAX_AGE=8*60*60*1000;
export function createAccountClient(config,{request=fetch,storage,now=Date.now}={}){
 const url=new URL(config.apiUrl);
 if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.pathname!=='/')throw Error('Configuração de API inválida.');
 if(!config.firebaseApiKey)throw Error('Configuração de autenticação ausente.');
 let session=null,epoch=0,refreshing=null;
 if(storage===undefined){try{storage=globalThis.sessionStorage;}catch{storage=null;}}
 function clearStored(){try{storage?.removeItem(SESSION_KEY);}catch{}}
 function persist(){try{if(session)storage?.setItem(SESSION_KEY,JSON.stringify({apiUrl:url.origin,firebaseApiKey:config.firebaseApiKey,...session}));else clearStored();}catch{}}
 try{
  const raw=storage?.getItem(SESSION_KEY);
  if(raw){
   if(raw.length>24_000)throw Error();const saved=JSON.parse(raw);
   if(saved.apiUrl!==url.origin||saved.firebaseApiKey!==config.firebaseApiKey||!Number.isFinite(saved.createdAt)||now()-saved.createdAt<0||now()-saved.createdAt>=SESSION_MAX_AGE)throw Error();
   if(!['idToken','refreshToken'].every(key=>typeof saved[key]==='string'&&saved[key].length>0&&saved[key].length<10_000)||typeof saved.email!=='string'||saved.email.length>320)throw Error();
   session={idToken:saved.idToken,refreshToken:saved.refreshToken,email:saved.email,createdAt:saved.createdAt};
  }
 }catch{clearStored();}
 async function json(url,options){
  let response;try{response=await request(url,{...options,signal:AbortSignal.timeout(30_000)});}catch{throw new AccountError('Sem conexão com o serviço. Seu arquivo e progresso local foram preservados.');}
  const data=await response.json().catch(()=>({}));
  if(!response.ok){const code=String(data.error?.message||'').split(' : ')[0];throw new AccountError(messages[code]|| (typeof data.error==='string'?data.error:'Não foi possível concluir. Tente novamente.'),response.status,code);}
  return data;
 }
 const identity=(method,data)=>json(`https://identitytoolkit.googleapis.com/v1/accounts:${method}?key=${encodeURIComponent(config.firebaseApiKey)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
 function signOut(){epoch++;session=null;refreshing=null;clearStored();}
 async function signIn(email,password){
  signOut();const current=epoch;
  const data=await identity('signInWithPassword',{email,password,returnSecureToken:true});
  if(current!==epoch)throw new AccountError('A sessão foi encerrada. Entre novamente.');
  session={idToken:data.idToken,refreshToken:data.refreshToken,email:data.email||email,createdAt:now()};persist();
  return profile();
 }
 async function signUp(email,password){
  if(password.length<8)throw new AccountError('Use pelo menos 8 caracteres na senha.');
  signOut();const current=epoch;
  const data=await identity('signUp',{email,password,returnSecureToken:true});
  if(current!==epoch)throw new AccountError('A sessão foi encerrada. Entre novamente.');
  session={idToken:data.idToken,refreshToken:data.refreshToken,email:data.email||email,createdAt:now()};persist();
  // Keep the session if email delivery fails, so the player can resend safely.
  await sendVerification();return {email:session.email,emailVerified:false};
 }
 async function refresh(){
  if(!session)throw new AccountError('Entre na sua conta.',401);
  if(now()-session.createdAt>=SESSION_MAX_AGE){signOut();throw new AccountError('Sua sessão expirou. Entre novamente.',401);}
  if(refreshing)return refreshing;
  const current=epoch,token=session.refreshToken;
  const pending=(async()=>{
   try{
    const data=await json(`https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(config.firebaseApiKey)}`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'refresh_token',refresh_token:token})});
    if(current!==epoch||!session)throw new AccountError('Sessão encerrada.',401);
    session={...session,idToken:data.id_token,refreshToken:data.refresh_token};persist();
   }catch(error){if(current===epoch&&error.status===400){signOut();throw new AccountError('Sua sessão expirou. Entre novamente.',401);}throw error;}
  })();refreshing=pending;
  try{await pending;}finally{if(refreshing===pending)refreshing=null;}
 }
 async function restore(){
  if(!session)return null;
  await refresh();
  try{return await profile();}catch(error){if(error.status===400||error.status===401){signOut();throw new AccountError('Sua sessão expirou. Entre novamente.',401);}throw error;}
 }
 async function profile(){
  if(!session)throw new AccountError('Entre na sua conta.',401);
  const result=await identity('lookup',{idToken:session.idToken});const user=result.users?.[0];
  if(!user)throw new AccountError('Sessão inválida. Entre novamente.',401);
  return {email:user.email,emailVerified:user.emailVerified===true};
 }
 async function api(path,body,retried=false,extraHeaders={}){
  if(!session)throw new AccountError('Entre na sua conta.',401);
  if(now()-session.createdAt>=SESSION_MAX_AGE){signOut();throw new AccountError('Sua sessão expirou. Entre novamente.',401);}
  if(!/^\/v1\//.test(path))throw Error('Caminho inválido.');
  const current=epoch;
  try{
   const data=await json(url.origin+path,{method:body?'POST':'GET',headers:{...extraHeaders,Authorization:`Bearer ${session.idToken}`,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
   if(current!==epoch)throw new AccountError('Sessão encerrada.',401);return data;
  }catch(error){if(error.status===401&&!retried&&current===epoch){await refresh();return api(path,body,true,extraHeaders);}throw error;}
 }
 async function sendVerification(){
  if(!session)throw new AccountError('Entre na conta.',401);
  const current=epoch;
  const provider=config.verificationEmailProvider==='auto'?(await json(url.origin+'/v1/config',{method:'GET'})).verificationEmailProvider:'firebase';
  if(current!==epoch||!session)throw new AccountError('Sessão encerrada.',401);
  if(provider==='resend')await api('/v1/auth/verification-email',{});
  else await identity('sendOobCode',{requestType:'VERIFY_EMAIL',idToken:session.idToken});
 }
 async function resetPassword(email){try{await identity('sendOobCode',{requestType:'PASSWORD_RESET',email});}catch(error){if(error.code!=='EMAIL_NOT_FOUND')throw error;}}
 return {signIn,signUp,signOut,profile,refresh,restore,api,sendVerification,hasSession:()=>session!==null,resetPassword};
}
