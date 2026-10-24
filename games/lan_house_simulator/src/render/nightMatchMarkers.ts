/** Insígnias de confronto sobre PCs ocupados de verdade.
 * Dados derivados do bracket e dos clientes: nunca são persistidos no save.
 */
import type {GameState} from "../sim/types.js";
import {knockoutCurrentMatch} from "../sim/nightKnockout.js";
import {pcPosition} from "../sim/engine.js";
import {iso,type Projection} from "./isometric.js";

export type NightMatchMarkerKind="duel"|"waiting"|"eliminated"|"champion";
export type NightMatchMarker={
 playerId:number;pcIndex:number;kind:NightMatchMarkerKind;label:string;
};
export function nightMatchMarkers(s:GameState):NightMatchMarker[]{
 const night=s.nightMeetup,t=night?.tournament;
 if(!night||night.phase!=="playing"||t?.mode!=="knockout"||!t.bracket)return [];
 const duel=knockoutCurrentMatch(t);
 const bracket=t.bracket;
 const markers:NightMatchMarker[]=[];
 for(const playerId of bracket.seedIds){
  if(!night.paidIds.includes(playerId))continue;
  const customer=s.customers.find(c=>c.id===playerId);
  if(!customer||customer.stage!=="using"||customer.pcIndex===null||
     !night.pcIndexes.includes(customer.pcIndex))continue;
  const position=duel?.playerIds.indexOf(playerId)??-1;
  let kind:NightMatchMarkerKind;
  let label:string;
  if(duel&&position!==-1){
   kind="duel";
   label="J"+playerId+" · "+duel.points[position]+" pts";
  }else if(bracket.winnerId===playerId){
   kind="champion";label="J"+playerId+" · venceu";
  }else if(bracket.matches.some(m=>m.winnerId!==undefined&&
     m.playerIds.includes(playerId))){
   kind="eliminated";label="J"+playerId+" · eliminado";
  }else{
   kind="waiting";label="J"+playerId+" · aguarda";
  }
  markers.push({playerId,pcIndex:customer.pcIndex,kind,label});
 }
 return markers;
}
/** Anotação sobre a cena real, após os personagens. Sem novo hitbox/colisão. */
export function drawNightMatchMarkers(
 ctx:CanvasRenderingContext2D,s:GameState,camera:Projection
):void{
 const markers=nightMatchMarkers(s);
 if(!markers.length)return;
 const z=Math.max(.70,camera.zoom);
 ctx.save();
 ctx.textAlign="center";ctx.textBaseline="middle";
 ctx.font="600 "+Math.max(10,Math.round(12*z))+"px system-ui, sans-serif";
 for(const marker of markers){
  const pc=pcPosition(marker.pcIndex,s);
  const anchor=iso({x:pc.x+.35,y:pc.y+.34},camera,113);
  const maxWidth=Math.max(65,ctx.canvas.width-10);
  const width=Math.min(maxWidth,Math.max(62,ctx.measureText(marker.label).width+16*z));
  const height=Math.max(19,23*z);
  const x=Math.max(width/2+4,Math.min(ctx.canvas.width-width/2-4,anchor.x));
  const y=Math.max(height/2+4,Math.min(ctx.canvas.height-height/2-4,anchor.y));
  const palette=marker.kind==="duel"
   ?["rgba(17,51,69,.95)","#7fdef5","#f4ffff"]
   :marker.kind==="champion"
    ?["rgba(80,54,14,.95)","#f5d37e","#fff2bf"]
    :marker.kind==="waiting"
     ?["rgba(55,53,67,.90)","#bdb4d5","#f5efff"]
     :["rgba(62,49,50,.90)","#b99b9e","#f5e2e4"];
  ctx.fillStyle=palette[0];ctx.fillRect(x-width/2,y-height/2,width,height);
  ctx.strokeStyle=palette[1];ctx.lineWidth=Math.max(1,1.25*z);
  ctx.strokeRect(x-width/2,y-height/2,width,height);
  ctx.fillStyle=palette[2];ctx.fillText(marker.label,x,y,Math.max(5,width-8));
 }
 ctx.restore();
}
