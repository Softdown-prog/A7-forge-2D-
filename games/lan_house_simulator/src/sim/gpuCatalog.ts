/** Fictional GPU generations and balanced simulation prices, bonuses and wattage.
 * Dependency-free: shared by buying, PSU compatibility, game tier ordering and UI.
 * The five original catalogue entries are unchanged.
 */
export const GPU_CATALOG=[
 {id:"gpu05",name:"PixelForce 6600",year:2005,cost:440,power:0.18,bonus:0.035,theme:"emerald",watts:40},
 {id:"gpu07",name:"PixelForce 8800",year:2007,cost:790,power:0.34,bonus:0.06,theme:"amber",watts:75},
 {id:"gpu09",name:"PixelForce 260",year:2009,cost:1150,power:0.49,bonus:0.085,theme:"cyan",watts:100},
 {id:"gpu11",name:"PixelForce 560",year:2011,cost:1590,power:0.62,bonus:0.11,theme:"violet",watts:125},
 {id:"gpu13",name:"PixelForce 770",year:2013,cost:2250,power:0.78,bonus:0.14,theme:"crimson",watts:150},
 {id:"gpu15",name:"PixelForce 960",year:2015,cost:2700,power:0.86,bonus:0.155,theme:"silver",watts:165},
 {id:"gpu17",name:"PixelForce 1070",year:2017,cost:3300,power:0.97,bonus:0.17,theme:"blue",watts:180},
 {id:"gpu19",name:"PixelForce 2070",year:2019,cost:4050,power:1.08,bonus:0.185,theme:"teal",watts:200},
 {id:"gpu21",name:"PixelForce 3070",year:2021,cost:4800,power:1.2,bonus:0.2,theme:"indigo",watts:220},
 {id:"gpu23",name:"PixelForce 4070",year:2023,cost:5650,power:1.32,bonus:0.215,theme:"copper",watts:245},
 {id:"gpu25",name:"PixelForce 5070",year:2025,cost:6600,power:1.43,bonus:0.23,theme:"rose",watts:270},
 {id:"gpu28",name:"PixelForce 6080",year:2028,cost:7850,power:1.55,bonus:0.245,theme:"ice",watts:300},
 {id:"gpu30",name:"PixelForce 7080",year:2030,cost:9250,power:1.68,bonus:0.26,theme:"gold",watts:330},
] as const;
export type GpuId=(typeof GPU_CATALOG)[number]["id"];
const catalogIds:ReadonlySet<string>=new Set(GPU_CATALOG.map(x=>x.id));
/** Reject forged GPU identifiers in imported saves instead of treating them as empty slots. */
export function validGpuIds(value:unknown):boolean{
 return value===undefined||(Array.isArray(value)&&value.length<=200&&
  value.every(id=>id===null||(typeof id==="string"&&catalogIds.has(id))));
}
