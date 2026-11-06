/** Single, save-persisted historical mail per PS2 catalogue release year.
 * The catalogue itself is the source of truth; no duplicate unlock table.
 * Avoids post-reload duplicates and retroactive letter floods in old saves.
 */
import type {GameState} from "./types.js";
import {isHistorical,yearFromMinutes} from "./historicalEconomy.js";
import {fixedYearMailWindowDue} from "./mailCalendar.js";
import {PS2_GAME_CATALOG,ps2ReleasedGames} from "./ps2.js";

export const PS2_RELEASE_MAIL_YEARS=[2006,2007,2008,2009,2010] as const;
export type Ps2ReleaseMailYear=typeof PS2_RELEASE_MAIL_YEARS[number];
export type Ps2ReleaseNoticeId=`ps2-games-${Ps2ReleaseMailYear}`;
export interface Ps2ReleaseAnnouncement{
 readonly id:Ps2ReleaseNoticeId;
 readonly year:Ps2ReleaseMailYear;
 readonly title:string;
 readonly body:string;
}
export const ps2ReleaseMailId=(year:Ps2ReleaseMailYear):Ps2ReleaseNoticeId=>`ps2-games-${year}`;

/** A notice enters the inbox only during the first 30 in-game days of its year.
 * Migrated campaigns starting in 2009 do not receive letters for 2006-2008. */
export function duePs2ReleaseAnnouncement(s:GameState):Ps2ReleaseAnnouncement|null{
 if(!isHistorical(s))return null;
 const year=yearFromMinutes(s.totalMinutes);
 if(!PS2_RELEASE_MAIL_YEARS.some(y=>y===year))return null;
 const releaseYear=year as Ps2ReleaseMailYear;
 if(!fixedYearMailWindowDue(s,releaseYear,1,30)||
    s.ps2ReleaseMailSeenYears?.includes(releaseYear))return null;
 const id=ps2ReleaseMailId(releaseYear);
 if(s.notices?.some(n=>n.id===id))return null;
 const launched=PS2_GAME_CATALOG.filter(g=>g.releaseYear===releaseYear);
 const highlights=launched.slice(-2).map(g=>g.title);
 if(highlights.length!==2)return null;
 const total=ps2ReleasedGames(releaseYear).length;
 const next=PS2_RELEASE_MAIL_YEARS.find(y=>y>releaseYear);
 return {
  id,year:releaseYear,
  title:releaseYear===2006?"Estreia do PS2: novos jogos na loja":"PS2: lançamentos de "+releaseYear,
  body:`O catálogo de PlayStation 2 ganhou novos jogos em ${releaseYear}: ${highlights.join(" e ")}. `+
   `Agora são ${total} títulos disponíveis. As mídias podem ser compradas na loja para equipar as bancadas PS2. `+
   (next?`Mais dois jogos chegarão em ${next}.`:"O calendário de lançamentos do PS2 está completo por enquanto.")
 };
}
export function recordPs2ReleaseMail(s:GameState,year:Ps2ReleaseMailYear):void{
 const seen=s.ps2ReleaseMailSeenYears??(s.ps2ReleaseMailSeenYears=[]);
 if(!seen.includes(year))seen.push(year);
}
/** Validate external saves, but do not require the field in legacy saves. */
export function validPs2ReleaseMailHistory(s:Partial<GameState>):boolean{
 const seen=s.ps2ReleaseMailSeenYears;
 if(seen===undefined)return true;
 if(!Array.isArray(seen)||seen.length>PS2_RELEASE_MAIL_YEARS.length||
    new Set(seen).size!==seen.length||!Number.isFinite(s.totalMinutes))return false;
 const year=yearFromMinutes(s.totalMinutes!);
 return isHistorical(s as GameState)&&
  seen.every(y=>PS2_RELEASE_MAIL_YEARS.some(value=>value===y)&&y<=year);
}
