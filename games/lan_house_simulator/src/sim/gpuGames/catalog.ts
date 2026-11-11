/** Advanced video-game products: licensed for the establishment, enabled per PC. */
/** Títulos fictícios, independentes do catálogo básico R$ 450.
 * A licença é do estabelecimento; a execução e o adicional são por PC.
 * Custos e adicionais são hipóteses de design, não preços históricos.
 */
export const GPU_GAME_CATALOG=[
 {id:"neon-rush",name:"Neon Rush Online",year:2005,cost:580,minGpu:"gpu05",minWindows:"winxp",hourlyBonus:.75},
 {id:"circuito-competitivo",name:"Circuito Competitivo",year:2009,cost:950,minGpu:"gpu09",minWindows:"win7",hourlyBonus:1.25},
 {id:"arena-do-futuro",name:"Arena do Futuro",year:2013,cost:1550,minGpu:"gpu13",minWindows:"win7",hourlyBonus:1.75}
] as const;
export type GpuGameId=(typeof GPU_GAME_CATALOG)[number]["id"];
export type GpuGameSpec=(typeof GPU_GAME_CATALOG)[number];

export function gpuGameSpec(id:string):GpuGameSpec|undefined{
 return GPU_GAME_CATALOG.find(game=>game.id===id);
}
