/** Domain-facing frame operations and transient feedback, without browser or Canvas. */
import { stepGame } from "../sim/engine.js";
import { GAME_LAST_MINUTE } from "../sim/mailCalendar.js";
import type { GameState } from "../sim/types.js";
import { dispatchFrameEvents } from "./frameEventDispatch.js";
import { createFrameFeedbackPort,type FeedbackAudio,type PopupQueues } from "./frameFeedbackPort.js";
import { consumeNewMail,mailBaseline } from "./mailNotifications.js";
export interface RuntimeAudio extends FeedbackAudio {mail():void}
export function createGameFramePort(getState:()=>GameState,audio:RuntimeAudio){
 const popupQueues:PopupQueues={payments:[],sales:[],speech:[]};
 const feedback=createFrameFeedbackPort(getState,audio,popupQueues);
 let knownMailIds=mailBaseline(getState().notices),previousServed=getState().served,previousPurchases=getState().purchases;
 function beginPlay(){getState().keyboardEffects?.splice(0);knownMailIds=mailBaseline(getState().notices);}
 return {
  popupQueues,beginPlay,
  reset(){beginPlay();previousServed=getState().served;previousPurchases=getState().purchases;popupQueues.payments.length=0;popupQueues.sales.length=0;popupQueues.speech.length=0;},
  snapshot(){const s=getState();return {beforeCampaignEnd:s.totalMinutes<GAME_LAST_MINUTE,leftoverMinutes:s.leftoverMinutes};},
  advance:(minutes:number)=>stepGame(getState(),minutes),
  dispatch(playing:boolean,hidden:boolean){dispatchFrameEvents({playing,
   countNewMail:()=>consumeNewMail(knownMailIds,getState().notices),isDocumentHidden:()=>hidden,notifyMail:()=>audio.mail(),feedback,
   updateServed:()=>{if(getState().served>previousServed)previousServed=getState().served;},
   updatePurchases:()=>{if(getState().purchases>previousPurchases)previousPurchases=getState().purchases;}
  });}
 };
}
export type GameFramePort=ReturnType<typeof createGameFramePort>;
