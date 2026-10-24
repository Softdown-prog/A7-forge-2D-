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

/** A segunda carta é pessoal e não vende nem instala títulos. */
export const ERIC_SECOND_MAIL_ID="eric-second-mail" as const;
export const ERIC_SECOND_MAIL_TITLE="Eric (França) — lembra daquele jogo em rede?";
export const ERIC_SECOND_MAIL_BODY=[
 "Tony! Como andam os computadores e o movimento aí? Faz tempo que a gente não conversa. Espero que esteja tudo bem com vocês.",
 "Lembra do jogo de equipes que eu comentei? A turma aqui continua se reunindo para jogar. Um protege o outro, cada um no seu computador, e depois ninguém para de discutir quem salvou a partida!",
 "Vi que estão aparecendo mais jogos desse tipo para redes de computadores. Se um dia você quiser experimentar aí na lan house, vale pesquisar com calma se as máquinas conseguem jogar juntas. Não precisa fazer isso agora, nem comprar nada só porque eu falei.",
 "Depois me conta as novidades daí. Um abraço, Eric."
].join("\n\n");

/** Junho/julho de 2000, dias 156–200 da campanha de 360 dias/ano.
 * Reutiliza a semente do correio, sem tocar no RNG dos clientes.
 */
export function ericSecondMailDayOfYear(s:GameState):number{
 ensureMailCalendar(s);
 return 156+((Math.imul((s.mailScheduleSeed!^0xe71c2001)>>>0,2246822519)>>>0)%45);
}
export function ericSecondMailDue(s:GameState):boolean{
 if(!fixedYearMailWindowDue(s,2000,151,210))return false;
 if(!s.ericFirstMailDelivered&&!s.notices?.some(n=>n.id===ERIC_FIRST_MAIL_ID))return false;
 return mailDay(s)>=(2000-1998)*DAYS_PER_YEAR+ericSecondMailDayOfYear(s);
}
