/** Read-only state for the one-time basic game licenses. */
import type {GameState} from "../sim/types.js";
import {basicGamesLicenseCost} from "../sim/economy.js";

export interface BasicGamesLicenseStatus{
 readonly fee:number;
 readonly statusLabel:string;
 readonly buttonHidden:boolean;
 readonly buttonDisabled:boolean;
 readonly buttonLabel:string;
}
export interface BasicGamesLicenseStatusPort{snapshot():BasicGamesLicenseStatus}
export function createBasicGamesLicenseStatusPort(getState:()=>GameState):BasicGamesLicenseStatusPort{
 return {snapshot(){
  const game=getState(),fee=basicGamesLicenseCost(game);
  const price=fee.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
  return {
   fee,
   statusLabel:game.licensedGames?
    "Jogos regularizados · licença permanente, sem renovação anual.":
    "Catálogo sem regularização — risco de multa. Taxa única: "+price+".",
   buttonHidden:game.licensedGames,
   buttonDisabled:game.cash<fee,
   buttonLabel:"Regularizar jogos · "+price
  };
 }};
}
