/** Read-only summary of the existing mail window and unread count. */
import type {GameState} from "../sim/types.js";
import {unreadNotices} from "../sim/notices.js";

export interface NoticeWindowStatus {
 readonly unread:number;
 readonly badgeHidden:boolean;
 readonly badgeText:string;
 readonly windowHidden:boolean;
 readonly expanded:string;
}
export interface NoticeWindowStatusPort {
 snapshot(open:boolean):NoticeWindowStatus;
}
export function createNoticeWindowStatusPort(getState:()=>GameState):NoticeWindowStatusPort{
 return {snapshot(open){
  const unread=unreadNotices(getState());
  return {
   unread,
   badgeHidden:unread===0,
   badgeText:String(unread),
   windowHidden:!open,
   expanded:String(open)
  };
 }};
}
