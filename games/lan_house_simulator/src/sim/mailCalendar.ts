import type {GameState} from "./types.js";
import {DAY_MINUTES} from "./types.js";

/** O calendário do LHS tem 12 meses de 30 dias por ano. */
export const GAME_FIRST_YEAR=1998;
export const GAME_LAST_YEAR=2030;
export const DAYS_PER_YEAR=360;
export const GAME_YEARS=GAME_LAST_YEAR-GAME_FIRST_YEAR+1;
export const GAME_END_DAY=GAME_YEARS*DAYS_PER_YEAR;
export const GAME_END_MINUTES=GAME_END_DAY*DAY_MINUTES;
export const GAME_LAST_MINUTE=GAME_END_MINUTES-1;

/** Cartas sem ano de lançamento obrigatório. Futuras cartas datadas são tratadas em outro caminho. */
export const SPORADIC_MAIL_IDS=[
 "safety","windows","games",
 "supplier-offer","school-booking","gaming-tournament",
 "equipment-fault","electrical-inspection"
] as const;
export type SporadicMailId=typeof SPORADIC_MAIL_IDS[number];
export const isSporadicMailId=(id:string):id is SporadicMailId=>
 (SPORADIC_MAIL_IDS as readonly string[]).includes(id);
export const mailDay=(s:Pick<GameState,"totalMinutes">):number=>
 Math.max(1,Math.floor(s.totalMinutes/DAY_MINUTES)+1);

/** FNV-style hash determinístico; não usa nem modifica o RNG de clientes. */
function hash(seed:number,text:string):number{
 let value=(seed^0x811c9dc5)>>>0;
 for(let i=0;i<text.length;i++){
  value=Math.imul(value^text.charCodeAt(i),16777619)>>>0;
 }
 return value>>>0;
}
/** Partidas novas iniciam o plano em 1998. Saves antigos são migrados ao ano corrente,
 * sem despejar retroativamente todas as cartas pendentes num único dia. */
export function ensureMailCalendar(s:GameState):void{
 if(s.mailScheduleSeed===undefined)s.mailScheduleSeed=(s.rng>>>0);
 if(s.mailStartDay===undefined)s.mailStartDay=Math.min(GAME_END_DAY,mailDay(s));
 if(!s.mailSeenIds){
  const seen=new Set<string>();
  for(const notice of s.notices??[])if(isSporadicMailId(notice.id))seen.add(notice.id);
  if(s.electricalInspectionSeen)seen.add("electrical-inspection");
  if(s.contentFilterInstalled)seen.add("safety");
  if(s.windowsNoticeFine)seen.add("windows");
  if(s.copyrightNoticeFine)seen.add("games");
  s.mailSeenIds=[...seen];
 }
}
/** Plano de campanha: oito janelas de anos diferentes. O evento e o dia são sorteados
 * para cada save. A distância mínima prevista entre cartas é aproximadamente um ano. */
export function sporadicMailSchedule(s:GameState):Partial<Record<SporadicMailId,number>>{
 ensureMailCalendar(s);
 const seed=s.mailScheduleSeed!;
 const start=Math.max(1,Math.min(GAME_END_DAY,s.mailStartDay!));
 const remaining=GAME_END_DAY-start+1;
 const window=Math.max(DAYS_PER_YEAR,Math.floor(remaining/SPORADIC_MAIL_IDS.length));
 const shuffled=[...SPORADIC_MAIL_IDS].sort((a,b)=>
  hash(seed,"order:"+a)-hash(seed,"order:"+b));
 const result:Partial<Record<SporadicMailId,number>>={};
 shuffled.forEach((id,i)=>{
  const jitter=0.22+hash(seed,"offset:"+id)/0x1_0000_0000*.56;
  const date=start+i*window+Math.floor(window*jitter);
  // Não encaixar oito mensagens artificialmente num único ano quando um save antigo
  // começou perto do encerramento. Prefira deixar eventos para outra campanha.
  if(date<=GAME_END_DAY-30)result[id]=date;
 });
 return result;
}
/** Janela pequena para tolerar uma importação ou dia pulado; nenhuma entrega atrasada em lote. */
export function sporadicMailDue(s:GameState,id:SporadicMailId):boolean{
 const today=mailDay(s);
 const due=sporadicMailSchedule(s)[id];
 return due!==undefined&&!s.mailSeenIds!.includes(id)&&
  today>=due&&today<due+45&&today<=GAME_END_DAY;
}
export function recordMailDelivery(s:GameState,id:SporadicMailId):void{
 ensureMailCalendar(s);
 if(!s.mailSeenIds!.includes(id))s.mailSeenIds!.push(id);
}
/** Contrato separado para eventos históricos que serão vinculados a um ano exato.
 * Não faz sorteio de ano e não permite que um evento de 2005 apareça em 2004 ou 2006. */
export function fixedYearMailDue(s:GameState,year:number,dayOfYear:number):boolean{
 if(!Number.isInteger(year)||year<GAME_FIRST_YEAR||year>GAME_LAST_YEAR||
    !Number.isInteger(dayOfYear)||dayOfYear<1||dayOfYear>DAYS_PER_YEAR)return false;
 return mailDay(s)===(year-GAME_FIRST_YEAR)*DAYS_PER_YEAR+dayOfYear;
}
