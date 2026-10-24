/** Corujão da sexta no salão ORIGINAL do LHS.
 * O tempo da campanha para em sexta 21h59 enquanto um relógio civil próprio
 * vai de sexta 22h a sábado 10h. Só então nextDay() roda UMA vez.
 * Os amigos são Customer reais e percorrem a porta, a fila, o caixa e PCs
 * instalados. A economia recebe apenas pagamentos/consumos efetivos.
 */
import type {Customer,GameState,Result} from "./types.js";
import {DAY_MINUTES} from "./types.js";
import {weekdayIndex,campaignDate,currentCampaignDay} from "./campaignWeek.js";
import {NIGHT_FIRST_ARRIVAL_OFFSET,NIGHT_MORNING_EXIT_OFFSET,NIGHT_MAX_EXIT_OFFSET} from "./futureNightClock.js";
import {multiplayerEligiblePcs,ERIC_MULTIPLAYER_GAME_ID} from "./eraGames.js";
import {energyCostPerMinute} from "./economy.js";
import {initialNeeds,tickNeeds,consumePurchase} from "./needs.js";
import {sellMerchandise,merchandisePrice,merchandiseStock} from "./merchandise.js";
import {entrance,pcPosition,pcWear,addLog} from "./simulationState.js";
import {computerSeat} from "./route.js";
import {counterQueueCustomers,counterQueueSlot} from "./checkoutQueue.js";
import {navigableRoute} from "./navigation.js";
import {setTravel,moveRoute,EXIT_REACH_DISTANCE} from "./customerMotion.js";
import {entranceAvailable,isReserved,sendHome,leaveCounterForPc,refreshCounterQueue,queueVisualEvent} from "./customerFlow.js";
import {purchaseApproach} from "./layout.js";
import {recordComputerUtilization} from "./financialReview.js";
import {recordStationMinute} from "./stationAccounting.js";
import {pcCount} from "./simulationState.js";
import {stationReadyForSessions} from "./stationPower.js";
import {registerTournamentPlayer,scoreTournamentMinute,settleNightTournament,completedTournamentResult,validTournamentState,validTournamentResult} from "./nightTournament.js";
import {beginNightKnockout,validNightKnockoutTrophies} from "./nightKnockout.js";


export function confirmFridayMeetup(s:GameState):Result{
 const draft=s.fridayMeetupDraft;
 if(!draft||draft.status!=="draft")return {ok:false,message:"Prepare primeiro um rascunho de sexta."};
 if(s.nightMeetup)return {ok:false,message:"O encontro noturno já está acontecendo."};
 const today=currentCampaignDay(s);
 if(today>draft.fridayDay)return {ok:false,message:"Essa sexta já passou: descarte e prepare uma nova data."};
 if(!s.licensedEraGames?.includes(ERIC_MULTIPLAYER_GAME_ID))
  return {ok:false,message:"Setor Zero não está licenciado."};
 const available=multiplayerEligiblePcs(s).filter(pc=>!isReserved(s,pc)&&
  !!navigableRoute(s,entrance(s),computerSeat(pcPosition(pc,s))));
 if(available.length<draft.seats)return {ok:false,message:"Não há PCs livres e acessíveis suficientes."};
 if((s.multiplayerRoundsPlayed??0)<1)return {ok:false,message:"Primeiro é preciso realizar uma partida multiplayer diurna."};
 draft.status="confirmed";
 return {ok:true,message:"Encontro confirmado para sexta "+campaignDate(draft.fridayDay)+
  ". Amigos virão às 23h, jogarão até 7h e o sábado reabre às 10h. Sem cobrança antecipada."};
}
export function nightScheduledForClosing(s:GameState):boolean{
 const day=currentCampaignDay(s),draft=s.fridayMeetupDraft;
 return !s.nightMeetup&&!!draft&&draft.status==="confirmed"&&
  draft.fridayDay===day&&weekdayIndex(day)===4&&s.totalMinutes%DAY_MINUTES===DAY_MINUTES-1;
}
/** Quando o próximo minuto normal seria 10h de sábado, abrir a noite primeiro. */
export function beginNightMeetup(s:GameState):void{
 const draft=s.fridayMeetupDraft;
 if(!draft||!nightScheduledForClosing(s))return;
 const pcs=multiplayerEligiblePcs(s).filter(pc=>!isReserved(s,pc)&&
  !!navigableRoute(s,entrance(s),computerSeat(pcPosition(pc,s))));
 if(pcs.length<draft.seats){
  s.fridayMeetupDraft=undefined;
  addLog(s,"Corujão cancelado: não havia computadores disponíveis às 22h.");
  return;
 }
 // Clientes avulsos devem terminar a saída pela porta; nenhum outro público entra.
 for(const c of s.customers)if(c.stage!=="leaving")sendHome(s,c);
 s.multiplayerVisit=undefined;
 s.nightMeetup={fridayDay:draft.fridayDay,seats:draft.seats,elapsed:0,
  phase:"arriving",pcIndexes:pcs.slice(0,draft.seats),memberIds:[],paidIds:[],
  revenue:0,retailRevenue:0,
  tournament:draft.format==="tournament"?{scores:[],mode:"league"}:
    draft.format==="knockout"?{scores:[],mode:"knockout"}:undefined};
 s.fridayMeetupDraft=undefined;
 addLog(s,"Sexta 22h: portas fechadas ao público para o encontro de Setor Zero.");
}
const nightPeople=(s:GameState):Customer[]=>(s.nightMeetup?.memberIds??[])
 .map(id=>s.customers.find(c=>c.id===id)).filter((c):c is Customer=>!!c);

function spawnNightFriend(s:GameState):void{
 const n=s.nightMeetup!;
 if(n.memberIds.length>=n.seats||s.customers.length>=14)return;
 const entry=entrance(s);if(!entranceAvailable(s,entry))return;
 const slot=counterQueueCustomers(s).length;
 const id=s.nextCustomerId,pc=n.pcIndexes[n.memberIds.length]!;
 const charge=nightSessionCharge(s);
 const c:Customer={id,x:entry.x,y:entry.y,stage:"arriving",facing:"north",
  target:counterQueueSlot(slot,s),queueIndex:slot,costume:id%2?"regular":"female",
  preference:"gaming",nightMeetupDay:n.fridayDay,multiplayerAssignedPc:pc,
  pcIndex:null,usedMinutes:0,sessionMinutes:420,waitingMinutes:0,offlineWait:0,
  happy:true,budgetAware:true,wallet:Math.round((charge+Math.max(15,charge*.30))*100)/100,
  needs:initialNeeds(id)};
 if(!setTravel(s,c,c.target))return;
 s.nextCustomerId++;s.customers.push(c);n.memberIds.push(id);
}
export function nightSessionCharge(s:GameState):number{
 // Sete horas de acesso com a tarifa publicada, com arredondamento em centavos.
 return Math.round(Math.max(0,s.pricePerHour)*7*100)/100;
}
function serveNightFriend(s:GameState,c:Customer):void{
 const n=s.nightMeetup!,first=counterQueueCustomers(s)[0];
 if(!first||first.id!==c.id)return;
 const pc=c.multiplayerAssignedPc,fee=nightSessionCharge(s);
 if(pc===undefined||!stationReadyForSessions(s,pc)||!navigableRoute(s,{x:c.x,y:c.y},computerSeat(pcPosition(pc,s)))||
    (c.wallet??0)<fee){
  // Sem cobrar se não há PC acessível nem orçamento do participante.
  sendHome(s,c);return;
 }
 if(!leaveCounterForPc(s,c,computerSeat(pcPosition(pc,s))))return;
 c.pcIndex=pc;c.queueIndex=undefined;c.stage="to_pc";c.sessionMinutes=420;
 c.wallet=Math.round(((c.wallet??0)-fee)*100)/100;
 s.cash=Math.round((s.cash+fee)*100)/100;
 s.revenue=Math.round((s.revenue+fee)*100)/100;
 s.served++;
 n.revenue=Math.round((n.revenue+fee)*100)/100;
 n.paidIds.push(c.id);
 registerTournamentPlayer(s,c.id);
 s.paymentEffects=queueVisualEvent(s.paymentEffects,{amount:fee,x:c.x,y:c.y});
 addLog(s,"Corujão: amigo "+n.paidIds.length+"/"+n.seats+
  " pagou R$ "+fee.toFixed(2)+" e foi para o PC "+(pc+1)+".");
}
function nightRetail(s:GameState,c:Customer):void{
 const n=s.nightMeetup!,item=(n.memberIds.indexOf(c.id)%2===0?"soda":"snacks") as "soda"|"snacks";
 if(merchandiseStock(s,item)<=0){c.stage="to_pc";setTravel(s,c,computerSeat(pcPosition(c.pcIndex!,s)));return;}
 const cost=merchandisePrice(s,item);
 if((c.wallet??0)>=cost){
  const result=sellMerchandise(s,item);
  if(result.ok){
   c.wallet=Math.round(((c.wallet??0)-cost)*100)/100;
   consumePurchase(c,item);
   n.retailRevenue=Math.round((n.retailRevenue+cost)*100)/100;
   s.saleEffects=queueVisualEvent(s.saleEffects,{item,amount:cost,x:c.x,y:c.y});
   addLog(s,"Corujão: venda real de "+item+" para participante da madrugada.");
  }
 }
 if(!setTravel(s,c,computerSeat(pcPosition(c.pcIndex!,s)))){sendHome(s,c);return;}
 c.stage="to_pc";
}
/** Executado 1 vez por minuto pelo stepGame real, inclusive após recarregar save. */
export function advanceNightMeetup(s:GameState):boolean{
 const n=s.nightMeetup;if(!n)return false;
 if(n.elapsed>=NIGHT_MAX_EXIT_OFFSET)return true;
 n.elapsed++;
 // A despesa noturna é acumulada separadamente, sem duplicar o minuto diurno.
 if(n.elapsed>=NIGHT_FIRST_ARRIVAL_OFFSET&&n.elapsed<NIGHT_MORNING_EXIT_OFFSET){
  const cost=energyCostPerMinute(s,nightPeople(s).filter(c=>c.stage==="using").length);
  s.energyAccrued=(s.energyAccrued??0)+cost;
  recordComputerUtilization(s);recordStationMinute(s,pcCount(s),cost);
 }
 // Primeiro as saídas da sexta; somente depois permitir os convidados.
 const exit=entrance(s);
 for(const c of [...s.customers].filter(c=>c.nightMeetupDay===undefined)){
  if(c.stage!=="leaving")sendHome(s,c);
  moveRoute(s,c);
  if(Math.hypot(c.x-exit.x,c.y-exit.y)<=EXIT_REACH_DISTANCE)
   s.customers.splice(s.customers.indexOf(c),1);
 }
 if(n.phase==="arriving"&&n.elapsed>=NIGHT_FIRST_ARRIVAL_OFFSET&&
    n.elapsed<=NIGHT_FIRST_ARRIVAL_OFFSET+70&&n.memberIds.length<n.seats&&
    (n.elapsed-NIGHT_FIRST_ARRIVAL_OFFSET)%4===0)spawnNightFriend(s);
 refreshCounterQueue(s);
 const people=nightPeople(s);
 for(const c of people){
  tickNeeds(c);
  switch(c.stage){
   case "arriving":
    if(moveRoute(s,c))c.stage="waiting";
    break;
   case "waiting":if(n.phase==="arriving")serveNightFriend(s,c);break;
   case "to_pc":
    if(moveRoute(s,c)){c.stage="sitting";c.poseMinutes=0;}
    break;
   case "sitting":
    c.poseMinutes=(c.poseMinutes??0)+1;
    if(n.phase==="playing"&&(c.poseMinutes??0)>=3){c.stage="using";c.poseMinutes=0;}
    break;
   case "using":
    c.usedMinutes++;
    if(c.pcIndex!==null)(s.pcWear??=[])[c.pcIndex]=
      Math.min(100,pcWear(s,c.pcIndex)+0.045/(s.pcTiers?.[c.pcIndex]??1));
    // Intervalo real para compras: um convidado de cada vez caminha à loja.
    if(n.elapsed>=270&&n.elapsed<270+n.seats*12&&
      (n.elapsed-270)%12===0&&n.memberIds.indexOf(c.id)===(n.elapsed-270)/12){
     const item=n.memberIds.indexOf(c.id)%2===0?"soda":"snacks";
     if(merchandiseStock(s,item)>0&&setTravel(s,c,purchaseApproach(item,s))){
      c.stage="shopping";
     }
    }
    break;
   case "shopping":
    if(moveRoute(s,c))nightRetail(s,c);
    break;
   case "standing":
    c.poseMinutes=(c.poseMinutes??0)+1;
    if(c.poseMinutes>=3)sendHome(s,c);
    break;
   case "leaving":
    moveRoute(s,c);
    if(Math.hypot(c.x-exit.x,c.y-exit.y)<=EXIT_REACH_DISTANCE)
     s.customers.splice(s.customers.indexOf(c),1);
    break;
  }
 }
 scoreTournamentMinute(s);
 if(n.phase==="arriving"&&n.paidIds.length===n.seats&&people.length===n.seats&&
    people.every(c=>c.stage==="sitting"&&(c.poseMinutes??0)>=3)){
  n.phase="playing";n.startedAt=n.elapsed;
  for(const c of people){c.stage="using";c.poseMinutes=0;}
  beginNightKnockout(s);
  addLog(s,"Corujão: os "+n.seats+" amigos começaram juntos a partida de Setor Zero.");
 }
 if(n.phase==="arriving"&&n.elapsed>=225){
  // Cancelamento sem dinheiro inventado; os pagamentos efetuados ficam registrados.
  n.phase="leaving";
  for(const c of people)sendHome(s,c);
  addLog(s,"Corujão: a turma não conseguiu reunir todos os jogadores; devolução das horas não utilizadas será calculada.");
  // O estorno devido é proporcional à sessão não iniciada.
  for(const c of people.filter(c=>n.paidIds.includes(c.id))){
   const paid=nightSessionCharge(s);
   s.cash=Math.round((s.cash-paid)*100)/100;
   s.revenue=Math.round((s.revenue-paid)*100)/100;
   n.revenue=Math.round((n.revenue-paid)*100)/100;
   c.wallet=Math.round(((c.wallet??0)+paid)*100)/100;
  }
  s.served=Math.max(0,s.served-n.paidIds.length);
  n.paidIds=[]; // impede qualquer estorno repetido depois de recarregar
  if(n.tournament)n.tournament.scores=[]; // inscrições estornadas não valem pontos.
 }
 if(n.elapsed===NIGHT_MORNING_EXIT_OFFSET){
  settleNightTournament(s); // pagamento único antes da saída física
  n.phase="leaving";
  for(const c of people)if(c.stage!=="leaving")sendHome(s,c);
  addLog(s,"Sábado 07h: terminou a noite de jogos; amigos saindo pela porta.");
 }
 if(n.elapsed>=600&&n.phase==="leaving"){
  // Fallback de saída no horário previsto de reabertura, sem clientes fantasmas.
  for(const c of nightPeople(s))if(c.stage!=="leaving")sendHome(s,c);
 }
 if(n.elapsed===NIGHT_MAX_EXIT_OFFSET){
  s.lastNightMeetup={fridayDay:n.fridayDay,seats:n.seats,paid:n.paidIds.length,
   playedMinutes:n.startedAt===undefined?0:Math.max(0,NIGHT_MORNING_EXIT_OFFSET-n.startedAt),
   revenue:n.revenue,retailRevenue:n.retailRevenue,
   tournament:n.tournament?completedTournamentResult(n.tournament):undefined};
  for(const c of nightPeople(s))s.customers.splice(s.customers.indexOf(c),1);
  s.nightMeetup=undefined;
  addLog(s,"Sábado 10h: reabertura após o corujão, resultado R$ "+
   (n.revenue+n.retailRevenue).toFixed(2)+".");
  return true; // engine deve chamar nextDay uma única vez.
 }
 return false;
}
export function validNightMeetup(s:Partial<GameState>):boolean{
 const n=s.nightMeetup;
 const last=s.lastNightMeetup;
 if(last!==undefined&&(!last||!Number.isInteger(last.fridayDay)||last.fridayDay<1||
   ![2,3].includes(last.seats)||!Number.isInteger(last.paid)||last.paid<0||last.paid>last.seats||
   !Number.isInteger(last.playedMinutes)||last.playedMinutes<0||last.playedMinutes>480||
   ![last.revenue,last.retailRevenue].every(v=>Number.isFinite(v)&&v>=0)||
   !validTournamentResult(last.tournament,last.seats)))return false;
 if(!validNightKnockoutTrophies(s))return false;
 if(n===undefined)return !(s.customers??[]).some(c=>c.nightMeetupDay!==undefined);
 if(!n||!Number.isInteger(n.fridayDay)||n.fridayDay<1||weekdayIndex(n.fridayDay)!==4||
   Math.floor((s.totalMinutes??0)/DAY_MINUTES)+1!==n.fridayDay||
   (s.totalMinutes??0)%DAY_MINUTES!==DAY_MINUTES-1||
   (n.seats!==2&&n.seats!==3)||!Number.isInteger(n.elapsed)||n.elapsed<0||n.elapsed>=720||
   !["arriving","playing","leaving","closed"].includes(n.phase)||
   !Array.isArray(n.pcIndexes)||n.pcIndexes.length!==n.seats||
   new Set(n.pcIndexes).size!==n.pcIndexes.length||
   n.pcIndexes.some(pc=>!Number.isInteger(pc)||pc<0||pc>=pcCount(s as GameState))||
   !Array.isArray(n.memberIds)||n.memberIds.length>n.seats||
   !Array.isArray(n.paidIds)||n.paidIds.length>n.memberIds.length||
   new Set(n.memberIds).size!==n.memberIds.length||
   new Set(n.paidIds).size!==n.paidIds.length||
   n.paidIds.some(id=>!n.memberIds.includes(id))||
   ![n.revenue,n.retailRevenue].every(v=>Number.isFinite(v)&&v>=0)||
   !validTournamentState(n.tournament,n.memberIds,n.paidIds,n.seats,n.elapsed,
     n.startedAt!==undefined)||
   (n.startedAt!==undefined&&(!Number.isInteger(n.startedAt)||n.startedAt<60||
     n.startedAt>n.elapsed)))return false;
 return n.memberIds.every(id=>Number.isInteger(id)&&id>0&&id<(s.nextCustomerId??0))&&
  (s.customers??[]).every(c=>c.nightMeetupDay===undefined||
   (c.nightMeetupDay===n.fridayDay&&n.memberIds.includes(c.id)));
}
