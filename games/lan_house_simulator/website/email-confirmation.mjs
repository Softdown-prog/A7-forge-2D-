export function captureConfirmationCode(location,history){
 const values=new URLSearchParams(location.hash.slice(1)).getAll('codigo');
 // Remove the personal code from the address bar before any asynchronous work.
 if(location.hash||location.search)history.replaceState(null,'',location.pathname);
 const code=values.length===1?values[0]:null;
 return code&&/^[A-Za-z0-9_-]{16,1024}$/.test(code)?code:null;
}

export async function confirmVerificationCode(code,config,{request=fetch}={}){
 if(!code||!/^[A-Za-z0-9_-]{16,1024}$/.test(code))throw Object.assign(Error('Este link é inválido. Peça uma nova confirmação em Minha conta.'),{retryable:false});
 if(!config.enabled||!config.firebaseApiKey)throw Error('A confirmação está temporariamente indisponível. Tente novamente.');
 let response;
 try{response=await request('https://identitytoolkit.googleapis.com/v1/accounts:update?key='+encodeURIComponent(config.firebaseApiKey),{method:'POST',referrerPolicy:'origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({oobCode:code}),signal:AbortSignal.timeout(20_000)});}
 catch{throw Error('Não foi possível conectar. Confira sua conexão e tente novamente.');}
 if(!response.ok){
  const data=await response.json().catch(()=>({}));
  const reason=data.error?.message;
  if(['EXPIRED_OOB_CODE','INVALID_OOB_CODE'].includes(reason))throw Object.assign(Error('Este link expirou ou já foi utilizado. Tente entrar na conta ou peça um novo email de confirmação.'),{retryable:false});
  if(reason==='USER_DISABLED')throw Object.assign(Error('Esta conta está indisponível. Entre em contato pelo site.'),{retryable:false});
  throw Error('Não foi possível confirmar agora. Aguarde um momento e tente novamente.');
 }
 return {confirmed:true};
}

const root=globalThis.document?.querySelector('#email-confirmation');
if(root){
 let code=captureConfirmationCode(window.location,window.history),busy=false;
 const title=document.getElementById('confirmation-title'),status=document.getElementById('confirmation-status'),button=document.getElementById('confirm-email-button'),badge=document.getElementById('confirmation-badge');
 if(!code){title.textContent='Vamos encontrar seu acesso.';status.textContent='Abra o link recebido no email. Se ele expirou, entre em Minha conta para pedir uma nova confirmação.';button.hidden=true;}
 else{button.disabled=false;status.textContent='Clique abaixo para confirmar seu email e concluir a criação da sua conta.';}
 // An explicit click prevents email link scanners from redeeming the code.
 button.addEventListener('click',()=>void(async()=>{
  if(!code||busy)return;busy=true;button.disabled=true;root.setAttribute('aria-busy','true');status.textContent='Confirmando seu email…';
  try{
   const response=await fetch('/account-config.json',{cache:'no-store',signal:AbortSignal.timeout(15_000)});if(!response.ok)throw Error('Não foi possível carregar a confirmação. Tente novamente.');
   await confirmVerificationCode(code,await response.json());code=null;
   badge.textContent='EMAIL CONFIRMADO';title.textContent='Tudo pronto. Seu salão espera.';
   status.textContent='Seu email foi confirmado. Entre em Minha conta para acessar o painel. Se o painel já estiver aberto em outra aba, use “Já confirmei meu email”.';
  }catch(error){status.textContent=error.message||'Não foi possível confirmar agora. Tente novamente.';if(error.retryable===false)code=null;}
  finally{busy=false;button.disabled=false;button.hidden=!code;root.removeAttribute('aria-busy');}
 })());
}
