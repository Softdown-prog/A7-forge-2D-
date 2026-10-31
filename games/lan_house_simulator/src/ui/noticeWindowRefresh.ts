/** DOM-only composition of the mailbox badge and the lazily rendered inbox.
 * All state, dirty checks and current DOM targets are read through injected ports.
 */
import type {NoticeWindowStatusPort} from "../application/noticeWindowStatusPort.js";
import type {NoticeInboxPort} from "../application/noticeInboxPort.js";
import {renderNoticeWindowStatus} from "./noticeWindowStatusPanel.js";
import {renderNoticeInbox} from "./noticeInboxPanel.js";
export interface NoticeWindowRefreshOptions {
 readonly status:NoticeWindowStatusPort;
 readonly inbox:NoticeInboxPort;
 readonly host:()=>HTMLElement|null;
 readonly changed:(force:boolean)=>boolean;
 readonly doc:Document;
 readonly iconMarkup:(name:"mail"|"warning")=>string;
}
export function createNoticeWindowRefresh(options:NoticeWindowRefreshOptions):{
 refresh(open:boolean,force:boolean):boolean
}{
 let lastStatus="";
 return {refresh(open,force){
  // Badge and aria-expanded always refresh, even if the inbox is closed.
  const status=options.status.snapshot(open);
  renderNoticeWindowStatus(status,options.doc);
  const sendEvent=(name:string,detail:unknown):void=>{
   if(typeof options.doc.dispatchEvent==="function"&&typeof CustomEvent==="function")
    options.doc.dispatchEvent(new CustomEvent(name,{detail}));
  };
  // Publish read-only data only after a genuine change.
  const statusKey=JSON.stringify(status);
  if(lastStatus!==statusKey){
   lastStatus=statusKey;
   sendEvent("lhs:notice-status-updated",status);
  }
  const host=options.host();
  if(!host||!open||!options.changed(force))return false;
  const snapshot=options.inbox.snapshot();
  sendEvent("lhs:notice-inbox-updated",snapshot);
  // Angular-owned mail list is rendered by Angular. The existing delegated
  // TypeScript notice controller still handles the button click actions.
  if(host.dataset?.angularOwned!=="true")
   renderNoticeInbox(host,snapshot,options.doc,options.iconMarkup);
  return true;
 }};
}
