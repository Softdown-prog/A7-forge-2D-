/** Top Games: original monthly videogame magazine collection.
 * Domain only: the existing physical postman will perform handoffs in a separate
 * integration step. No free unlock or automatic debit on simulation ticks.
 * The PS1/PS2 catalogues are the sole source of game IDs and release years.
 */
import type {GameState,Result} from "./types.js";
import {DAY_MINUTES} from "./types.js";
import {isHistorical,priceIndex,yearFromMinutes} from "./historicalEconomy.js";
import {PS1_CD_CATALOG} from "./ps1.js";
import {PS2_GAME_CATALOG} from "./ps2.js";

export const TOP_GAMES_FIRST_YEAR=2002;
export const TOP_GAMES_MONTHLY_BASE_PRICE=12;
/** Original PS1/PS2 artwork and game titles; never copyrighted brand magazine art. */
export const TOP_GAMES_TITLE="Top Games";
export type TopGamesPlatform="ps1"|"ps2";
export interface TopGamesIssue{
 readonly id:string;
 readonly gameId:string;
 readonly gameTitle:string;
 readonly platform:TopGamesPlatform;
 readonly releaseYear:number;
 readonly releaseMonth:number;
 /** Calendar day (1-based, 360 days per year) when the edition is published. */
 readonly publicationDay:number;
}

/** Keep the five initial games and yearly expansions in their canonical order.
 * Each new title receives a distinct edition in a different month of that year.
 */
const catalogue:ReadonlyArray<{
 readonly gameId:string;readonly gameTitle:string;
 readonly platform:TopGamesPlatform;readonly releaseYear:number
}>=[
 ...PS1_CD_CATALOG.map(g=>({gameId:g.id,gameTitle:g.title,platform:"ps1" as const,releaseYear:g.releaseYear})),
 ...PS2_GAME_CATALOG.map(g=>({gameId:g.id,gameTitle:g.title,platform:"ps2" as const,releaseYear:g.releaseYear}))
];
const months=new Map<number,number>();
export const TOP_GAMES_ISSUES:ReadonlyArray<TopGamesIssue>=catalogue.map(g=>{
 const month=(months.get(g.releaseYear)??0)+1;
 months.set(g.releaseYear,month);
 if(month>12)throw Error("Top Games: mais de 12 jogos no mesmo ano");
 return {
  id:"top-games-"+g.platform+"-"+g.gameId,
  gameId:g.gameId,gameTitle:g.gameTitle,platform:g.platform,
  releaseYear:g.releaseYear,releaseMonth:month,
  publicationDay:(g.releaseYear-1998)*360+(month-1)*30+15
 };
});
const ids=new Set(TOP_GAMES_ISSUES.map(issue=>issue.id));
const today=(s:Pick<GameState,"totalMinutes">):number=>Math.floor(s.totalMinutes/DAY_MINUTES)+1;
const cents=(n:number):number=>Math.round(n*100)/100;

export function topGamesIssuePrice(s:Pick<GameState,"totalMinutes">):number{
 return cents(TOP_GAMES_MONTHLY_BASE_PRICE*
  priceIndex(yearFromMinutes(s.totalMinutes))/priceIndex(TOP_GAMES_FIRST_YEAR));
}
export function topGamesSubscribed(s:GameState):boolean{
 return isHistorical(s)&&s.topGamesSubscriptionDay!==undefined&&s.topGamesSubscriptionActive===true;
}
/** Old editions can be caught up one per month, not in an instant bulk delivery.
 * The first issue must have been published and must have been subscribed to.
 */
export function nextTopGamesIssue(s:GameState):TopGamesIssue|null{
 if(!topGamesSubscribed(s))return null;
 const received=s.topGamesReceivedIssues??[];
 return TOP_GAMES_ISSUES.find(issue=>!received.includes(issue.id))??null;
}
export function nextTopGamesDeliveryDay(s:GameState):number|null{
 const issue=nextTopGamesIssue(s);
 if(!issue)return null;
 const start=s.topGamesSubscriptionDay!;
 const last=s.topGamesLastDeliveryDay;
 return Math.max(issue.publicationDay,start,last===undefined?start:last+30);
}
export function dueTopGamesIssue(s:GameState):TopGamesIssue|null{
 const issue=nextTopGamesIssue(s),due=nextTopGamesDeliveryDay(s);
 return issue&&due!==null&&today(s)>=due?issue:null;
}
/** The player explicitly opts in. No charge until a real magazine is handed over. */
export function subscribeTopGames(s:GameState):Result{
 if(!isHistorical(s)||yearFromMinutes(s.totalMinutes)<TOP_GAMES_FIRST_YEAR)
  return {ok:false,message:"Top Games estará disponível a partir de 2002."};
 if(topGamesSubscribed(s))return {ok:false,message:"A assinatura Top Games já está ativa."};
 if(s.topGamesSubscriptionDay===undefined){
  s.topGamesSubscriptionDay=today(s);
  s.topGamesReceivedIssues=[];
 }
 s.topGamesSubscriptionActive=true;
 return {ok:true,message:"Assinatura Top Games ativada. Uma edição por jogo, no máximo uma a cada 30 dias, com cobrança apenas na entrega."};
}
export function cancelTopGames(s:GameState):Result{
 if(!topGamesSubscribed(s))return {ok:false,message:"Não há assinatura Top Games ativa."};
 s.topGamesSubscriptionActive=false;
 return {ok:true,message:"Assinatura Top Games pausada. Revistas recebidas continuam no acervo."};
}
/** Called only after the shared postman's actual handoff, never by shop rendering.
 * Failed delivery or insufficient cash must never unlock a game or charge money.
 */
export function receiveTopGamesIssue(s:GameState,id:string):Result{
 const issue=dueTopGamesIssue(s);
 if(!issue||issue.id!==id)return {ok:false,message:"Esta edição Top Games ainda não pode ser entregue."};
 const price=topGamesIssuePrice(s);
 if(s.cash<price)return {ok:false,message:"Caixa insuficiente para receber a edição Top Games."};
 s.cash=cents(s.cash-price);
 s.expenses=cents(s.expenses+price);
 (s.topGamesReceivedIssues??=[]).push(issue.id);
 s.topGamesLastDeliveryDay=today(s);
 return {ok:true,message:"Top Games entregue: Tony conheceu "+issue.gameTitle+
  " ("+issue.platform.toUpperCase()+"). Valor: R$ "+price.toFixed(2)+"."};
}
export function topGamesKnowsGame(s:GameState,platform:TopGamesPlatform,gameId:string):boolean{
 return (s.topGamesReceivedIssues??[]).includes("top-games-"+platform+"-"+gameId);
}
/** Optional schema for older saves. When enabled, all received issues must form
 * a valid chronological prefix and must belong to already-published editions.
 */
export function validTopGamesState(s:Partial<GameState>):boolean{
 const start=s.topGamesSubscriptionDay,active=s.topGamesSubscriptionActive;
 const received=s.topGamesReceivedIssues,last=s.topGamesLastDeliveryDay;
 if(start===undefined)return active===undefined&&received===undefined&&last===undefined;
 if(s.economyVersion!==2||!Number.isInteger(start)||!Number.isFinite(s.totalMinutes)||
    start<(TOP_GAMES_FIRST_YEAR-1998)*360+1||start>today(s as GameState)||
    typeof active!=="boolean"||!Array.isArray(received)||
    received.length>TOP_GAMES_ISSUES.length||new Set(received).size!==received.length)return false;
 if(!received.every((id,i)=>typeof id==="string"&&ids.has(id)&&
    TOP_GAMES_ISSUES[i]?.id===id&&
    TOP_GAMES_ISSUES[i]!.publicationDay<=today(s as GameState)))return false;
 if(received.length===0)return last===undefined;
 if(last===undefined||!Number.isInteger(last))return false;
 return last>=start&&last<=today(s as GameState)&&
  last>=TOP_GAMES_ISSUES[received.length-1]!.publicationDay;
}
