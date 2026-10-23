/** Popularidade por idade do título, sem RNG e sem novos campos nos saves.
 * A vida útil comercial diminui com o tempo, mas o catálogo preserva
 * 25% do apelo por nostalgia; licenças adquiridas nunca expiram.
 * Escala de game design (não representa dados históricos de vendas).
 */
export const GAME_POPULARITY_NOSTALGIA_FLOOR=0.25;
export const GAME_POPULARITY_ANNUAL_DECAY=0.15;
export function gamePopularityWeight(releaseYear:number,currentYear:number):number{
 const age=Math.max(0,Math.floor(currentYear)-Math.floor(releaseYear));
 return Math.max(GAME_POPULARITY_NOSTALGIA_FLOOR,1-age*GAME_POPULARITY_ANNUAL_DECAY);
}
/** Mostra ao jogador quantos pontos de procura o título oferece hoje. */
export function gamePopularityPercent(releaseYear:number,currentYear:number):number{
 return Math.round(gamePopularityWeight(releaseYear,currentYear)*100);
}
