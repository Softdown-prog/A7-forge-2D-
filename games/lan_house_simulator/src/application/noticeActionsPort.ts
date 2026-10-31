/** Mail command facade. Read the current save on every invocation. */
import type {GameState,Result} from "../sim/types.js";
import {chooseDecision} from "../sim/decisions.js";
import {readNotice,hireContentProgrammer,reviewNotices} from "../sim/notices.js";
import {startLinuxResearch} from "../sim/linuxQuest.js";
export interface NoticeActionsPort{
 review():void;choose(decisionId:string,choiceId:string):Result;
 markRead(id:string):boolean;hireProgrammer():Result;startLinux():Result;
}
export function createNoticeActionsPort(getState:()=>GameState):NoticeActionsPort{
 return {
  review(){reviewNotices(getState());},
  choose(id,choice){return chooseDecision(getState(),id,choice);},
  markRead(id){return readNotice(getState(),id);},
  hireProgrammer(){return hireContentProgrammer(getState());},
  startLinux(){return startLinuxResearch(getState());}
 };
}
