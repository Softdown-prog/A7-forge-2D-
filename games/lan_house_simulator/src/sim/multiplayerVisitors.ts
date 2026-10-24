/** Visitas diurnas de amigos a partir de 2000. Compartilha todos os
 * contratos de caixa, navegação e computadores; não cria receita por evento.
 */
import type {Customer,GameState} from "./types.js";
import {DAY_MINUTES} from "./types.js";
import {gameYear} from "./era.js";
import {ERIC_MULTIPLAYER_GAME_ID,multiplayerEligiblePcs} from "./eraGames.js";
import {spawnMultiplayerFriend} from "./customerArrival.js";
import {entrance,pcPosition} from "./simulationState.js";
import {computerSeat} from "./route.js";
import {navigableRoute} from "./navigation.js";
import {isReserved,sendHome} from "./customerFlow.js";

const MAX_VISIT_AGE=85;
const groupMembers=(s:GameState)=>s.multiplayerVisit?.memberIds
 .map(id=>s.customers.find(c=>c.id===id)).filter((c):c is Customer=>!!c)??[];

function dismiss(s:GameState,message:string):void{
 const people=groupMembers(s);
 for(const c of people)if(c.pcIndex===null&&c.stage!=="leaving")sendHome(s,c);
 // Amigos já pagos mantêm o direito à sessão; só as vagas
 // ainda não contratadas são devolvidas.
 for(const c of people)if(c.pcIndex===null)c.multiplayerAssignedPc=undefined;
 s.multiplayerVisit=undefined;
 if(message){s.eventLog.unshift("Multiplayer: "+message);s.eventLog.splice(14);}
}

/** A turma só aparece se o título foi adquirido e há máquinas reais.
 * Dia e horário determinísticos por save; uma oportunidade a cada 7 dias.
 */
export function tickMultiplayerVisitors(s:GameState):void{
 const now=s.totalMinutes,day=Math.floor(now/DAY_MINUTES)+1,minute=now%DAY_MINUTES;
 const visit=s.multiplayerVisit;
 if(visit){
  if(now-visit.createdMinute>MAX_VISIT_AGE&&visit.memberIds.length<visit.size){
   dismiss(s,"a turma não conseguiu se reunir.");return;
  }
  if(visit.memberIds.length===visit.size){
   if(groupMembers(s).length===0)s.multiplayerVisit=undefined;
   return;
  }
  if(s.customers.length>=14)return;
  const c=spawnMultiplayerFriend(s,visit.id);
  if(c)visit.memberIds.push(c.id);
  return;
 }
 if(gameYear(s)<2000||!s.licensedEraGames?.includes(ERIC_MULTIPLAYER_GAME_ID))return;
 if(s.multiplayerLastVisitDay===day||day%7!==((s.mailScheduleSeed??0)%7))return;
 if(minute!==170+((s.mailScheduleSeed??0)%110))return;
 s.multiplayerLastVisitDay=day;
 // Ocupação física e caminhos precisam permitir ao menos dois amigos.
 const available=multiplayerEligiblePcs(s).filter(i=>!isReserved(s,i)&&
  !!navigableRoute(s,entrance(s),computerSeat(pcPosition(i,s))));
 if(available.length<2)return;
 const size:2|3=available.length>=3&&((day+(s.mailScheduleSeed??0))%2===0)?3:2;
 s.multiplayerVisit={id:s.nextCustomerId,size,memberIds:[],createdMinute:now};
 const first=spawnMultiplayerFriend(s,s.multiplayerVisit.id);
 if(first)s.multiplayerVisit.memberIds.push(first.id);
}

/** Executado no caixa: verifica todos presentes antes de prometer as
 * estações distintas. Cada cliente paga individualmente na rotina normal.
 * Retorna true enquanto a pessoa ainda não pode ser atendida.
 */
export function waitForMultiplayerFriends(s:GameState,c:Customer):boolean{
 const visit=s.multiplayerVisit;
 if(!visit||visit.id!==c.multiplayerVisitId)return false;
 const members=groupMembers(s);
 if(members.length!==visit.size){
  c.waitingMinutes++;
  return true;
 }
 if(members.some(member=>member.stage==="leaving")){
  dismiss(s,"um participante desistiu antes da partida.");return true;
 }
 if(members.every(member=>member.multiplayerAssignedPc!==undefined||member.pcIndex!==null))return false;
 const available=multiplayerEligiblePcs(s).filter(i=>!isReserved(s,i));
 const chosen:number[]=[];
 for(const member of members){
  const pc=available.find(index=>!chosen.includes(index)&&
   !!navigableRoute(s,{x:member.x,y:member.y},computerSeat(pcPosition(index,s))));
  if(pc===undefined){
   dismiss(s,"não havia computadores livres e acessíveis para o grupo.");return true;
  }
  chosen.push(pc);
 }
 for(let i=0;i<members.length;i++)members[i]!.multiplayerAssignedPc=chosen[i];
 return false;
}

/** Saves antigos não contêm os campos de multiplayer. */
export function validMultiplayerVisit(s:Partial<GameState>):boolean{
 const last=s.multiplayerLastVisitDay,visit=s.multiplayerVisit;
 if(last!==undefined&&(!Number.isInteger(last)||last<1||
   last>Math.floor((s.totalMinutes??0)/DAY_MINUTES)+1))return false;
 if(visit===undefined)return true;
 if(!visit||!Number.isInteger(visit.id)||visit.id<1||
  !Number.isInteger(visit.size)||![2,3].includes(visit.size)||
  !Number.isInteger(visit.createdMinute)||visit.createdMinute<0||
  visit.createdMinute>(s.totalMinutes??0)||!Array.isArray(visit.memberIds)||
  visit.memberIds.length>visit.size||new Set(visit.memberIds).size!==visit.memberIds.length)return false;
 return visit.memberIds.every(id=>Number.isInteger(id)&&id>=visit.id&&id<(s.nextCustomerId??0));
}
