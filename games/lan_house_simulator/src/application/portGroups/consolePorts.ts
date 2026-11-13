/** PS1/PS2 UI command and snapshot ports. No DOM, Canvas or cached campaign state. */
import type {GameState} from "../../sim/types.js";
import {createPs1ActionsPort} from "../ps1ActionsPort.js";
import {createPs2Port} from "../ps2Port.js";
import {createPs1AdminPort} from "../ps1AdminPort.js";
import {createPs1ShopDiscPort} from "../ps1ShopDiscPort.js";
import {createPs1ShopPlacementPort} from "../ps1ShopPlacementPort.js";
import {createPs1ShopOfferPort} from "../ps1ShopOfferPort.js";

/** Every adapter receives the same live getter: save replacements are immediately visible. */
export function createConsolePorts(getState:()=>GameState){
 return {
  ps1Actions:createPs1ActionsPort(getState),
  ps2Port:createPs2Port(getState),
  ps1AdminPort:createPs1AdminPort(getState),
  ps1ShopDiscPort:createPs1ShopDiscPort(getState),
  ps1ShopPlacementPort:createPs1ShopPlacementPort(getState),
  ps1ShopOfferPort:createPs1ShopOfferPort(getState)
 };
}
