/** Updates existing mail indicator elements without installing listeners. */
import type {NoticeWindowStatus} from "../application/noticeWindowStatusPort.js";

export function renderNoticeWindowStatus(
 view:NoticeWindowStatus,
 doc:Pick<Document,"getElementById">
):void {
 const mailbox=doc.getElementById("notices");
 if(mailbox)mailbox.hidden=view.windowHidden;
 const badge=doc.getElementById("notices-count");
 if(badge){
  badge.hidden=view.badgeHidden;
  badge.textContent=view.badgeText;
 }
 doc.getElementById("open-notices")?.setAttribute("aria-expanded",view.expanded);
}
