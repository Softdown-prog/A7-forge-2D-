/** Snapshot of fields that affect the visible inbox. The UI never reads GameState. */
import type {GameState} from "../sim/types.js";
import {linuxDay} from "../sim/linuxQuest.js";
export interface NoticeInboxRevisionPort {
 snapshot():readonly unknown[];
}
export function createNoticeInboxRevisionPort(getState:()=>GameState):NoticeInboxRevisionPort {
 return {snapshot(){
  const s=getState();
  return [s.cash,s.notices,s.contentFilterInstalled,s.pcWindowsLicenses,s.licensedGames,
   s.electricalDeadlineDay,s.electricalInspectionFineApplied,s.linuxResearchStartedDay,s.linuxMailSeenIds,
   s.pcOperatingSystems,linuxDay(s)];
 }};
}
