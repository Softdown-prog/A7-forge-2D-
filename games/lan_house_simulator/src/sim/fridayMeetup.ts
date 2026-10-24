/** Planejamento do corujão: rascunho sem cobrança antecipada.
 * A confirmação e o runtime físico estão em nightMeetup.ts.
 * Uma simples intenção não bloqueia estações nem cria pessoas.
 */
import type {GameState,Result} from "./types.js";
import {gameYear} from "./era.js";
import {GAME_END_DAY} from "./mailCalendar.js";
import {ERIC_MULTIPLAYER_GAME_ID,multiplayerEligiblePcs} from "./eraGames.js";
import {entrance,pcPosition} from "./simulationState.js";
import {computerSeat} from "./route.js";
import {navigableRoute} from "./navigation.js";
import {isReserved} from "./customerFlow.js";
import {campaignDate,currentCampaignDay,nextFridayDay,weekdayIndex} from "./campaignWeek.js";

export function firstFridayEligibility(s:GameState){
 const friday=nextFridayDay(currentCampaignDay(s));
 const pcs=multiplayerEligiblePcs(s).filter(pc=>!isReserved(s,pc)&&
  !!navigableRoute(s,entrance(s),computerSeat(pcPosition(pc,s))));
 const reasons:string[]=[];
 if(gameYear(s)<2001)reasons.push("O primeiro encontro especial é uma possibilidade a partir de 2001.");
 if(!s.licensedEraGames?.includes(ERIC_MULTIPLAYER_GAME_ID))
  reasons.push("É preciso licenciar Setor Zero.");
 if((s.multiplayerRoundsPlayed??0)<1)
  reasons.push("Antes, a turma precisa jogar ao menos uma partida coletiva no expediente.");
 if(pcs.length<2)reasons.push("São necessários dois PCs compatíveis e acessíveis.");
 if(friday>GAME_END_DAY)reasons.push("A campanha termina antes da próxima sexta.");
 return {friday,date:campaignDate(friday),pcs,ready:reasons.length===0,reasons};
}
export function draftFridayMeetup(s:GameState,seats:2|3):Result{
 if(seats!==2&&seats!==3)return {ok:false,message:"Escolha duas ou três vagas."};
 const status=firstFridayEligibility(s);
 if(!status.ready)return {ok:false,message:status.reasons.join(" ")};
 if(status.pcs.length<seats)return {ok:false,message:"Há apenas "+status.pcs.length+" computadores aptos para a turma."};
 s.fridayMeetupDraft={fridayDay:status.friday,seats,status:"draft"};
 return {ok:true,message:"Rascunho da sexta "+status.date+" com "+seats+
  " vagas preparado. Nenhuma máquina foi reservada, nenhum cliente cobrado. O turno noturno ainda não pode ser confirmado."};
}
export function cancelFridayMeetupDraft(s:GameState):Result{
 if(!s.fridayMeetupDraft)return {ok:false,message:"Não há rascunho para cancelar."};
 if(s.nightMeetup)return {ok:false,message:"Não é possível cancelar o turno já iniciado."};
 s.fridayMeetupDraft=undefined;
 return {ok:true,message:"Rascunho da sexta cancelado sem custo e sem alterar o expediente."};
}
export function validFridayMeetupDraft(s:Partial<GameState>):boolean{
 const rounds=s.multiplayerRoundsPlayed;
 if(rounds!==undefined&&(!Number.isInteger(rounds)||rounds<0||rounds>1000000))return false;
 const draft=s.fridayMeetupDraft;
 if(draft===undefined)return true;
 return !!draft&&(draft.status==="draft"||draft.status==="confirmed")&&
  (draft.format===undefined||draft.format==="free"||draft.format==="tournament")&&
  !(s.nightMeetup&&draft.status==="confirmed")&&(draft.seats===2||draft.seats===3)&&
  Number.isInteger(draft.fridayDay)&&draft.fridayDay>=1&&
  draft.fridayDay<=GAME_END_DAY&&weekdayIndex(draft.fridayDay)===4;
}
