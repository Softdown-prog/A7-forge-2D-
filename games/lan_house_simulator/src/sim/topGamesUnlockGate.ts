/** Magazine-discovery gate. Keep this module independent of PS1/PS2 catalogues:
 * importing the full magazine catalogue from the consoles would create a cycle.
 * Existing exported saves have no mode marker and retain their old gameplay.
 */
import type {GameState} from "./types.js";
export type TopGamesUnlockMode="magazines";
export type TopGamesPlatform="ps1"|"ps2";
export function topGamesKnowsGame(
 s:Pick<GameState,"topGamesReceivedIssues">,platform:TopGamesPlatform,gameId:string
):boolean{
 return (s.topGamesReceivedIssues??[]).includes("top-games-"+platform+"-"+gameId);
}
export function topGamesCanBuy(
 s:Pick<GameState,"topGamesUnlockMode"|"topGamesReceivedIssues">,
 platform:TopGamesPlatform,gameId:string,alreadyOwned:number
):boolean{
 // Old campaigns without the marker have no retroactive magazine debt.
 return s.topGamesUnlockMode!=="magazines"||alreadyOwned>0||
  topGamesKnowsGame(s,platform,gameId);
}
export function validTopGamesUnlockMode(s:Partial<GameState>):boolean{
 return s.topGamesUnlockMode===undefined||
  (s.topGamesUnlockMode==="magazines"&&s.economyVersion===2);
}
