import type {NoticeActionsPort} from "../application/noticeActionsPort.js";
export type NoticeDestination="windows"|"games";
export interface NoticeCallbacks{
 onResult(result:ReturnType<NoticeActionsPort["choose"]>):void;
 onRead():void;
 navigate(destination:NoticeDestination):void;
}
/** Mail DOM events only. Business logic is exclusively in application/sim. */
export function installNoticeControls(root:HTMLElement|null,port:NoticeActionsPort,cb:NoticeCallbacks):void{
 root?.addEventListener("click",event=>{
  const button=event.target instanceof Element?event.target.closest("button"):null;
  if(!(button instanceof HTMLButtonElement)||button.disabled)return;
  const d=button.dataset;
  if(d.decision&&d.choice)cb.onResult(port.choose(d.decision,d.choice));
  else if(d.noticeRead){port.markRead(d.noticeRead);cb.onRead();}
  else if(d.noticeAction==="programmer")cb.onResult(port.hireProgrammer());
  else if(d.noticeAction==="windows"||d.noticeAction==="games")cb.navigate(d.noticeAction);
 });
}
