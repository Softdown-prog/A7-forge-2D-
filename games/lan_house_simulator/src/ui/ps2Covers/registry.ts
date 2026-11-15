/** Exact PS2 game ID -> painter map. */
import {paintCidadeEmFuga} from "./cidade-em-fuga.js";
import {paintArenaDosGuardioes} from "./arena-dos-guardioes.js";
import {paintFutsalDeBairro} from "./futsal-de-bairro.js";
import {paintCosmos2006} from "./cosmos-2006.js";
import {paintBatidaDeRua} from "./batida-de-rua.js";
import {paintPistasDaMontanha} from "./pistas-da-montanha.js";
import {paintTemploDaAurora} from "./templo-da-aurora.js";
import {paintRobosDaFronteira} from "./robos-da-fronteira.js";
import {paintMisterioDoFarol} from "./misterio-do-farol.js";
import {paintLendasDoVulcao} from "./lendas-do-vulcao.js";
import {paintVoleiNaPraia} from "./volei-na-praia.js";
import {paintCorridaNoGelo} from "./corrida-no-gelo.js";
import {paintCidadeDosInventores} from "./cidade-dos-inventores.js";
import {paintGuardioesDoOceano} from "./guardioes-do-oceano.js";
import {paintBatidasDoFuturo} from "./batidas-do-futuro.js";

export const PS2_COVER_DRAWINGS:Readonly<Record<string,(ctx:CanvasRenderingContext2D)=>void>>=Object.freeze({
 "cidade-em-fuga":paintCidadeEmFuga,
 "arena-dos-guardioes":paintArenaDosGuardioes,
 "futsal-de-bairro":paintFutsalDeBairro,
 "cosmos-2006":paintCosmos2006,
 "batida-de-rua":paintBatidaDeRua,
 "pistas-da-montanha":paintPistasDaMontanha,
 "templo-da-aurora":paintTemploDaAurora,
 "robos-da-fronteira":paintRobosDaFronteira,
 "misterio-do-farol":paintMisterioDoFarol,
 "lendas-do-vulcao":paintLendasDoVulcao,
 "volei-na-praia":paintVoleiNaPraia,
 "corrida-no-gelo":paintCorridaNoGelo,
 "cidade-dos-inventores":paintCidadeDosInventores,
 "guardioes-do-oceano":paintGuardioesDoOceano,
 "batidas-do-futuro":paintBatidasDoFuturo,
});
