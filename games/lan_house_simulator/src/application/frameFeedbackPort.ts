/** Consume transient gameplay events without depending on DOM or Canvas.
 * A live GameState getter supports importing saves without stale references.
 */
import type {GameState} from "../sim/types.js";
export type PaymentPopup={amount:number;x:number;y:number;age:number};
export type SalePopup={amount:number;x:number;y:number;age:number};
export type SpeechPopup={text:string;x:number;y:number;kind:"complaint"|"praise";age:number};
export interface PopupQueues{payments:PaymentPopup[];sales:SalePopup[];speech:SpeechPopup[];}
export interface FeedbackAudio{
 income(kind:"payment"|"sale"):void;soda():void;candy():void;
 printer():void;keyboard():void;
}
export function createFrameFeedbackPort(getState:()=>GameState,audio:FeedbackAudio,queues:PopupQueues){
 return {
  payments(playing:boolean):void{
   for(const e of (playing?(getState().paymentEffects?.splice(0)??[]):[])){
    queues.payments.push({...e,age:0});
    if(queues.payments.length>12)queues.payments.shift();
    audio.income("payment");
   }
  },
  sales(playing:boolean):void{
   for(const e of (playing?(getState().saleEffects?.splice(0)??[]):[])){
    if(Number.isFinite(e.amount)&&Number.isFinite(e.x)&&Number.isFinite(e.y)){
     queues.sales.push({amount:e.amount!,x:e.x!,y:e.y!,age:0});
     if(queues.sales.length>12)queues.sales.shift();
    }
    audio.income("sale");
    if(e.item==="soda")audio.soda();
    else audio.candy();
   }
  },
  prints(playing:boolean):void{
   for(const e of (playing?(getState().printEffects?.splice(0)??[]):[])){
    if(Number.isInteger(e.customerId))audio.printer();
   }
  },
  keyboards(playing:boolean):void{
   for(const e of (playing?(getState().keyboardEffects?.splice(0)??[]):[])){
    if(Number.isInteger(e.customerId)&&Number.isInteger(e.pcIndex))audio.keyboard();
   }
  },
  speech(playing:boolean):void{
   for(const e of (playing?(getState().speechEffects?.splice(0)??[]):[])){
    queues.speech.push({...e,age:0});
    if(queues.speech.length>8)queues.speech.shift();
   }
  }
 };
}
