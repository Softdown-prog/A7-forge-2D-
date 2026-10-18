/** Consentimento de tecnologias opcionais: 30 dias após a escolha.
 * O armazenamento essencial de partidas não depende de consentimento opcional.
 * Outros módulos só podem iniciar rastreadores opcionais quando permitido. */
export type PrivacyChoice="accepted"|"rejected";
export const PRIVACY_KEY="lhs.privacy-choice.v1";
export const PRIVACY_DURATION_MS=30*24*60*60*1000;
type Stored={choice:PrivacyChoice;at:number;version:1};
export function readPrivacyChoice(storage:Pick<Storage,"getItem">,now=Date.now()):PrivacyChoice|null{
 try{
  const raw=storage.getItem(PRIVACY_KEY);if(!raw)return null;
  const data=JSON.parse(raw) as Partial<Stored>;
  if(data.version!==1||(data.choice!=="accepted"&&data.choice!=="rejected")||
    typeof data.at!=="number"||!Number.isFinite(data.at)||
    data.at>now||now-data.at>=PRIVACY_DURATION_MS)return null;
  return data.choice;
 }catch{return null;}
}
export function savePrivacyChoice(storage:Pick<Storage,"setItem">,choice:PrivacyChoice,now=Date.now()):void{
 try{storage.setItem(PRIVACY_KEY,JSON.stringify({version:1,choice,at:now} satisfies Stored));}catch{}
}
export function optionalPrivacyAllowed():boolean{
 return typeof localStorage!=="undefined"&&readPrivacyChoice(localStorage)==="accepted";
}
export function mountPrivacyBanner():void{
 const banner=document.getElementById("privacy-banner");
 const settings=document.getElementById("privacy-settings");
 const accept=document.getElementById("privacy-accept");
 const reject=document.getElementById("privacy-reject");
 if(!banner||!settings||!accept||!reject)return;
 const show=()=>{banner.hidden=false;settings.hidden=true;};
 const hide=()=>{banner.hidden=true;settings.hidden=false;};
 const decide=(choice:PrivacyChoice)=>{
  savePrivacyChoice(localStorage,choice);hide();
  document.dispatchEvent(new CustomEvent("lhs:privacy-choice",{detail:{choice}}));
 };
 accept.addEventListener("click",()=>decide("accepted"));
 reject.addEventListener("click",()=>decide("rejected"));
 settings.addEventListener("click",show);
 if(readPrivacyChoice(localStorage))hide();else show();
}
if(typeof document!=="undefined"){
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mountPrivacyBanner,{once:true});
 else mountPrivacyBanner();
}
