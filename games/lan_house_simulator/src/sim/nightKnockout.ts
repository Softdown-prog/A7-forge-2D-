/** Chaveamento real para 2 ou 3 clientes pagantes do corujão.
 * Somente confrontos entre visitantes presentes e usando PCs produzem pontos.
 * Não adiciona partidas fora do salão, NPCs artificiais ou cobranças.
 */
import type {GameState} from "./types.js";
import type {NightTournamentState,NightTournamentScore} from "./nightTournament.js";
import {addLog} from "./simulationState.js";

export type KnockoutMatch={
 stage:"qualifier"|"final";
 playerIds:[number,number];
 points:[number,number];
 rounds:number;
 winnerId?:number;
};
export type NightKnockoutBracket={
 seedIds:number[];
 matches:KnockoutMatch[];
 winnerId?:number;
};
const target=(stage:KnockoutMatch["stage"]):number=>stage==="qualifier"?8:12;
export function knockoutCurrentMatch(t:NightTournamentState):KnockoutMatch|undefined{
 return t.bracket?.matches.find(m=>m.winnerId===undefined);
}
export function beginNightKnockout(s:GameState):void{
 const n=s.nightMeetup,t=n?.tournament;
 if(!n||!t||t.mode!=="knockout"||t.bracket||t.scores.length!==n.seats||
    n.phase!=="playing")return;
 const ids=t.scores.map(x=>x.id);
 const pair:[number,number]=[ids[0]!,ids[1]!];
 t.bracket={seedIds:[...ids],matches:[{stage:n.seats===3?"qualifier":"final",
  playerIds:pair,points:[0,0],rounds:0}]};
 addLog(s,n.seats===3
  ?"Eliminatória Setor Zero: jogadores "+pair.join(" x ")+" disputam uma vaga na final; jogador "+ids[2]+" aguarda."
  :"Final Setor Zero: jogadores "+pair.join(" x ")+" em seus computadores.");
}
export function scoreKnockoutMinute(s:GameState):void{
 const n=s.nightMeetup,t=n?.tournament;
 if(!n||!t||t.mode!=="knockout"||t.settled||n.phase!=="playing"||
    n.elapsed>=540||n.elapsed%12!==0)return;
 const match=knockoutCurrentMatch(t);
 if(!match)return;
 const customers=match.playerIds.map(id=>s.customers.find(c=>c.id===id));
 if(customers.some(c=>!c||c.stage!=="using"||c.pcIndex===null||
     !n.pcIndexes.includes(c.pcIndex)))return;
 const scores=match.playerIds.map(id=>t.scores.find(row=>row.id===id));
 if(scores.some(x=>!x))return;
 // A rodada só existe quando ambos estão nos respectivos PCs.
 for(let i=0;i<2;i++){
  const c=customers[i]!,row=scores[i]!;
  const earned=1+(((Math.imul(row.id,37)+Math.imul(n.elapsed,11)+c.pcIndex!*17)>>>0)%4);
  row.rounds++;row.points+=earned;
  match.points[i]+=earned;
 }
 match.rounds++;
 if(match.rounds<target(match.stage))return;
 // Empate decidido por menor ID, sem sorteio que mudaria ao recarregar save.
 const winner=match.points[0]===match.points[1]
  ?Math.min(...match.playerIds)
  :match.playerIds[match.points[0]>match.points[1]?0:1];
 match.winnerId=winner;
 if(match.stage==="qualifier"){
  const bye=t.scores.find(row=>!match.playerIds.includes(row.id));
  if(!bye)return;
  const final:[number,number]=[winner,bye.id];
  t.bracket!.matches.push({stage:"final",playerIds:final,points:[0,0],rounds:0});
  addLog(s,"Setor Zero: jogador "+winner+" venceu a classificatória ("+
   match.points.join("–")+") e enfrentará o jogador "+bye.id+" na final.");
 }else{
  t.bracket!.winnerId=winner;
  addLog(s,"Setor Zero: final encerrada ("+match.points.join("–")+
   "). Campeão jogador "+winner+". Prêmio será entregue às 7h.");
 }
}
const unique=(ids:number[])=>new Set(ids).size===ids.length;
const validScore=(r:NightTournamentScore)=>!!r&&Number.isInteger(r.id)&&r.id>0&&
 Number.isInteger(r.points)&&r.points>=0&&r.points<=5000&&
 Number.isInteger(r.rounds)&&r.rounds>=0&&r.rounds<=50;
export function validKnockoutBracket(
 t:NightTournamentState,seatCount:number,started:boolean,elapsed:number
):boolean{
 if(t.mode!=="knockout")return t.mode===undefined||t.mode==="league"?
  t.bracket===undefined:false;
 if(!t.scores.every(validScore))return false;
 const bracket=t.bracket;
 if(!started)return bracket===undefined;
 if(!bracket||!Array.isArray(bracket.matches)||bracket.matches.length<1||
    bracket.matches.length>(seatCount===3?2:1))return false;
 const ids=t.scores.map(row=>row.id);
 if(ids.length!==seatCount||!unique(ids)||!Array.isArray(bracket.seedIds)||
    bracket.seedIds.length!==seatCount||!unique(bracket.seedIds)||
    bracket.seedIds.some(id=>!ids.includes(id)))return false;
 const seeds=bracket.seedIds;
 const matches=bracket.matches,first=matches[0]!;
 if(first.stage!==(seatCount===3?"qualifier":"final"))return false;
 if(first.playerIds[0]!==seeds[0]||first.playerIds[1]!==seeds[1])return false;
 for(let i=0;i<matches.length;i++){
  const m=matches[i]!;
  if(!m||!Array.isArray(m.playerIds)||m.playerIds.length!==2||
     !m.playerIds.every((id:number)=>Number.isInteger(id)&&ids.includes(id))||
     !unique(m.playerIds)||!Array.isArray(m.points)||m.points.length!==2||
     !m.points.every((p:number)=>Number.isInteger(p)&&p>=0&&p<=48)||
     !Number.isInteger(m.rounds)||m.rounds<0||m.rounds>target(m.stage)||
     m.points.some(p=>p<m.rounds||p>4*m.rounds)||
     (m.winnerId!==undefined&&
      (m.rounds!==target(m.stage)||m.winnerId!==
       (m.points[0]===m.points[1]?Math.min(...m.playerIds):
       m.playerIds[m.points[0]>m.points[1]?0:1]))))return false;
  if(i>0&&matches[i-1]?.winnerId===undefined)return false;
 }
 if(seatCount===3&&matches.length===2){
  const final=matches[1]!,bye=seeds[2]!;
  if(final.stage!=="final"||final.playerIds[0]!==first.winnerId||
      final.playerIds[1]!==bye)return false;
 }
 const final=matches[matches.length-1]!;
 if(bracket.winnerId!==undefined){
  if(final.stage!=="final"||final.winnerId!==bracket.winnerId)return false;
 }else if(final.stage==="final"&&final.winnerId!==undefined)return false;
 // Agregado é obrigatoriamente a soma das partidas físicas.
 for(const row of t.scores){
  const points=matches.reduce((sum,m)=>sum+
    (m.playerIds[0]===row.id?m.points[0]:m.playerIds[1]===row.id?m.points[1]:0),0);
  const rounds=matches.reduce((sum,m)=>sum+(m.playerIds.includes(row.id)?m.rounds:0),0);
  if(row.points!==points||row.rounds!==rounds)return false;
 }
 if(t.settled===true&&elapsed>=540&&t.winnerId!==undefined&&
    t.winnerId!==bracket.winnerId)return false;
 return true;
}
