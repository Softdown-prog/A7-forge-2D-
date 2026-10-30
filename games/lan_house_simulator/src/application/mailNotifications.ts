/** Trigger efêmero e idempotente para avisar sobre cartas realmente novas. */
export interface MailIdentity {id:string;read:boolean;}
export function mailBaseline(messages:readonly MailIdentity[]|undefined):Set<string>{
 return new Set((messages??[]).map(n=>n.id));
}
export function consumeNewMail(known:Set<string>,messages:readonly MailIdentity[]|undefined):number{
 let count=0;
 for(const mail of messages??[]){
  if(known.has(mail.id))continue;
  known.add(mail.id);
  if(!mail.read)count++;
 }
 return count;
}
