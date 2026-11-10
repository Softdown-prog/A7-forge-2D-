import type {Item} from "../types.js";

export const STORY_IDS=[
 "roof-leak","neighbor-noise","damaged-keyboard","malware-incident",
 "missing-stock","unexpected-power-bill","late-supplier","lost-document",
 "local-network","neighborhood-paper","privacy-exposure","community-drive",
 "school-uniform-policy","gpu-games-2005"
] as const;
export type StoryId=typeof STORY_IDS[number];
export const LEGACY_CHAIN_IDS=["supplier-offer","school-booking","gaming-tournament","equipment-fault"] as const;
export const CHAIN_IDS=[...STORY_IDS,...LEGACY_CHAIN_IDS] as const;
export type StoryChainId=typeof CHAIN_IDS[number];
export type LegacyChainId=typeof LEGACY_CHAIN_IDS[number];
export type StoryNoticeId=StoryId|`${StoryChainId}:followup`|`${StoryChainId}:report`;
export type StoryOutcome="good"|"mixed"|"bad";
export interface StoryImpact {
 reputation?:number;
 wear?:number;
 stock?:Partial<Record<Item,number>>;
 offlineMinutes?:number;
 visitors?:number;
 visitorDays?:number;
 energyBill?:number;
}
export interface StoryChoice {
 id:string; label:string; cost:number; description:string;
 outcome:StoryOutcome; impact?:StoryImpact;
}
export interface StoryDefinition {
 title:string; body:string; category:"problem"|"opportunity";
 choices:[StoryChoice,StoryChoice,StoryChoice];
 developments:Record<StoryOutcome,string>;
}
export interface StoryRecord {
 id:StoryChainId;
 choice:string;
 choiceLabel?:string;
 outcome:StoryOutcome;
 stage:"pending"|"awaiting"|"ending"|"done";
 dueDay:number;
 followupChoice?:string;
 followupLabel?:string;
 finalOutcome?:StoryOutcome;
}
export interface StoryVisitorEffect {
 id:string; factor:number; untilDay:number;
}
