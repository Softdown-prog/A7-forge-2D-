/** Read-only Top Games shop contract; writes go through ShopActionsPort.
 * The magazine catalogue belongs exclusively to the simulation domain.
 */
import type {GameState} from "../sim/types.js";
import {yearFromMinutes,isHistorical} from "../sim/historicalEconomy.js";
import {TOP_GAMES_FIRST_YEAR,TOP_GAMES_TITLE,TOP_GAMES_ISSUES,
 topGamesSubscribed,topGamesIssuePrice,nextTopGamesIssue,nextTopGamesDeliveryDay} from "../sim/topGamesMagazines.js";

export interface TopGamesShopSnapshot{
 readonly title:string;
 readonly available:boolean;
 readonly active:boolean;
 readonly received:number;
 readonly total:number;
 readonly editionPrice:number;
 readonly nextIssueNumber:number|null;
 readonly nextDueDay:number|null;
 readonly actionId:"top-games-subscribe"|"top-games-cancel";
 readonly actionDisabled:boolean;
 readonly buttonText:string;
 readonly status:string;
}
export interface TopGamesShopPort{
 snapshot():TopGamesShopSnapshot;
}
const currency=(n:number):string=>n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
export function createTopGamesShopPort(getState:()=>GameState):TopGamesShopPort{
 return {snapshot(){
  const s=getState(),year=yearFromMinutes(s.totalMinutes),available=isHistorical(s)&&year>=TOP_GAMES_FIRST_YEAR;
  const active=topGamesSubscribed(s),received=s.topGamesReceivedIssues?.length??0;
  const next=nextTopGamesIssue(s),due=nextTopGamesDeliveryDay(s);
  const editionPrice=topGamesIssuePrice(s);
  const actionId=active?"top-games-cancel":"top-games-subscribe";
  const actionDisabled=!available||(active===false&&received===TOP_GAMES_ISSUES.length);
  const buttonText=!available?"Disponível em 2002":active?"Pausar assinatura":
   received===TOP_GAMES_ISSUES.length?"Coleção completa":
   s.topGamesSubscriptionDay===undefined?"Assinar Top Games":"Retomar assinatura";
  const status=!available?"Revistas de videogame disponíveis a partir de 2002.":
   received===TOP_GAMES_ISSUES.length?"Todas as "+received+" edições recebidas.":
   active?"Assinatura ativa · próxima edição "+(received+1)+"/"+TOP_GAMES_ISSUES.length+".":
   s.topGamesSubscriptionDay===undefined?"Assine sem taxa inicial. O pagamento será por exemplar entregue.":
   "Assinatura pausada · exemplares recebidos preservados.";
  return {title:TOP_GAMES_TITLE,available,active,received,total:TOP_GAMES_ISSUES.length,
   editionPrice,nextIssueNumber:next?received+1:null,nextDueDay:due,
   actionId,actionDisabled,buttonText,status:status+
    (available&&received<TOP_GAMES_ISSUES.length?" Entrega física pelo carteiro será integrada na próxima etapa.":"")+
    (available?" Cada revista apresenta um jogo; a mídia é comprada separadamente.":"")+
    (available?" Valor por edição: "+currency(editionPrice)+".":"")};
 }};
}
