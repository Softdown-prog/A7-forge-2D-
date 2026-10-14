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
  const seen=new Set<SporadicMailId>();
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

/** Eventos históricos podem chegar durante uma janela curta do ano correto,
 * sem disparar cartas retroativas em outros anos. */
export function fixedYearMailWindowDue(s:GameState,year:number,firstDay:number,lastDay:number):boolean{
 if(!Number.isInteger(year)||year<GAME_FIRST_YEAR||year>GAME_LAST_YEAR||
    !Number.isInteger(firstDay)||!Number.isInteger(lastDay)||
    firstDay<1||lastDay>DAYS_PER_YEAR||firstDay>lastDay)return false;
 const today=mailDay(s),base=(year-GAME_FIRST_YEAR)*DAYS_PER_YEAR;
 return today>=base+firstDay&&today<=base+lastDay;
}

/** Extra stories occupy the largest remaining gaps between the eight original letters.
 * All first letters stay at least one year apart; short legacy campaigns omit excess stories. */
export function additionalMailSchedule(s:GameState,ids:readonly string[]):Partial<Record<string,number>>{
 const original=sporadicMailSchedule(s);
 const occupied=[s.mailStartDay!,...Object.values(original) as number[],GAME_END_DAY-30].sort((a,b)=>a-b);
 const result:Partial<Record<string,number>>={};
 const ordered=[...ids].sort((a,b)=>hash(s.mailScheduleSeed!,"story:"+a)-hash(s.mailScheduleSeed!,"story:"+b)||a.localeCompare(b));
 for(const id of ordered){
  let best=-1,width=0;
  for(let i=1;i<occupied.length;i++){
   const gap=occupied[i]!-occupied[i-1]!;
   if(gap>=DAYS_PER_YEAR*2&&gap>width){best=i;width=gap;}
  }
  if(best<0)break;
  const left=occupied[best-1]!,right=occupied[best]!;
  const jitter=.35+hash(s.mailScheduleSeed!,"story-day:"+id)/0x1_0000_0000*.3;
  const date=Math.max(left+DAYS_PER_YEAR,Math.min(right-DAYS_PER_YEAR,left+Math.floor(width*jitter)));
  result[id]=date;occupied.splice(best,0,date);
 }
 return result;
}
