import type {GameState} from "./types.js";
import {ensureMailCalendar,fixedYearMailWindowDue,mailDay,DAYS_PER_YEAR} from "./mailCalendar.js";

/** Primeira etapa da história de Eric (2000). Este módulo é somente narrativo:
 * não concede licença, não altera RNG de visitantes ou movimenta dinheiro.
 * A continuação da história terá estado próprio quando suas regras forem definidas.
 */
export const ERIC_FIRST_MAIL_ID="eric-first-mail" as const;
export const ERIC_FIRST_MAIL_TITLE="Eric (França) — Tony, olha essa novidade!";
export const ERIC_FIRST_MAIL_BODY=[
 "Fala, primo! Como estão as coisas aí? Fiquei sabendo que você abriu a lan house. Quero conhecer quando aparecer por aí!",
 "Preciso te contar uma coisa que vi aqui na França. Tem um jogo em que a turma se divide em dois times e todo mundo participa da mesma partida pela rede. Cada pessoa fica no seu computador, mas estão todos jogando juntos. Eu achei meio maluco até ver acontecer!",
 "Lembrei logo de você. Imagina a nossa turma reunida para jogar uma partida dessas! Não estou dizendo para você sair comprando nada, viu? Só achei que ia gostar da história.",
 "Me conta depois como estão indo as coisas. Um abraço do seu primo, Eric."
].join("\n\n");

/** Dias 8–51 de 2000 (janeiro/fevereiro do calendário fictício).
 * A semente já pertence ao correio; não consumir o RNG do jogo.
 */
export function ericFirstMailDayOfYear(s:GameState):number{
 ensureMailCalendar(s);
 return 8+((Math.imul((s.mailScheduleSeed!^0xe71c2000)>>>0,1597334677)>>>0)%44);
}
export function ericFirstMailDue(s:GameState):boolean{
 if(!fixedYearMailWindowDue(s,2000,1,60))return false;
 const first=(2000-1998)*DAYS_PER_YEAR+ericFirstMailDayOfYear(s);
 // Uma partida salva dentro da janela pode receber a carta sem enxurrada
 // retroativa; fora do ano/da janela, não há entrega tardia.
 return mailDay(s)>=first;
}
