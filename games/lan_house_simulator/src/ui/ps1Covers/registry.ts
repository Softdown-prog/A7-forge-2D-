/** PS1 Canvas art mapped by exact catalogue ID. */
import {paintTurboCircuito} from "./turbo-circuito.js";
import {paintGolDeRua} from "./gol-de-rua.js";
import {paintIlhaDosCristais} from "./ilha-dos-cristais.js";
import {paintLutaNeon} from "./luta-neon.js";
import {paintCosmoBlocos} from "./cosmo-blocos.js";
import {paintRallyDoDeserto} from "./rally-do-deserto.js";
import {paintSombrasDoCastelo} from "./sombras-do-castelo.js";
import {paintDefensoresDoEspaco} from "./defensores-do-espaco.js";
import {paintSelvaPerdida} from "./selva-perdida.js";
import {paintDragoesDeAco} from "./dragoes-de-aco.js";
import {paintRitmoDaCidade} from "./ritmo-da-cidade.js";
import {paintAgentesDaNoite} from "./agentes-da-noite.js";
import {paintOceanoProfundo} from "./oceano-profundo.js";

export const PS1_COVER_DRAWINGS:Readonly<Record<string,(ctx:CanvasRenderingContext2D)=>void>>=Object.freeze({
 "turbo-circuito":paintTurboCircuito,
 "gol-de-rua":paintGolDeRua,
 "ilha-dos-cristais":paintIlhaDosCristais,
 "luta-neon":paintLutaNeon,
 "cosmo-blocos":paintCosmoBlocos,
 "rally-do-deserto":paintRallyDoDeserto,
 "sombras-do-castelo":paintSombrasDoCastelo,
 "defensores-do-espaco":paintDefensoresDoEspaco,
 "selva-perdida":paintSelvaPerdida,
 "dragoes-de-aco":paintDragoesDeAco,
 "ritmo-da-cidade":paintRitmoDaCidade,
 "agentes-da-noite":paintAgentesDaNoite,
 "oceano-profundo":paintOceanoProfundo,
});
