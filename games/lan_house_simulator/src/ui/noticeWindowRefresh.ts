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
 return {refresh(open,force){
  // Badge and aria-expanded always refresh, even if the inbox is closed.
  renderNoticeWindowStatus(options.status.snapshot(open),options.doc);
  const host=options.host();
  if(!host||!open||!options.changed(force))return false;
  renderNoticeInbox(host,options.inbox.snapshot(),options.doc,options.iconMarkup);
  return true;
 }};
}
