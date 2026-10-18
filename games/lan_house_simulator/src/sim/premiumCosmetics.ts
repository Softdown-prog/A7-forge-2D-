/**
 * Cookies: protótipos de cosméticos. Nenhum direito é concedido pelo save.
 * A única origem de entitlements é GET /v1/account autenticado.
 * A configuração online continua desativada até auditoria comercial.
 */
export const COOKIE_COSMETICS=[
 {id:"headset-rgb-neon",name:"Fone Gamer RGB Neon",cookies:40,unlockYear:2012,
  description:"Fone luminoso usado em ~48% das sessões de PC, sem alterar satisfação."},
 {id:"chair-gamer-neon",name:"Cadeira Gamer Neon",cookies:50,unlockYear:2012,
  description:"Carcaça gamer isométrica com estofamento, luz RGB e cadeira giratória."},
 {id:"keyboard-rainbow-rgb",name:"Teclado Rainbow RGB",cookies:25,unlockYear:2012,
  description:"Teclas com iluminação individual e efeito de onda, sem modificar digitação."},
 {id:"neon-open-sign",name:"Placa Neon ABERTO",cookies:30,unlockYear:1998,
  description:"Placa sobre a entrada; acende durante o expediente e apaga no fechamento."},
 {id:"arcade-checker-floor",name:"Piso Arcade Xadrez",cookies:25,unlockYear:1998,
  description:"Piso modular grafite e marfim com acabamento acetinado e juntas ciano; mantém navegação."},
 {id:"exclusive-arcade-posters",name:"Pôsteres Exclusivos",cookies:12,unlockYear:1998,
  description:"Três ilustrações originais retrô-futuristas nas posições de pôsteres existentes."}
] as const;
export type CookieCosmeticId=typeof COOKIE_COSMETICS[number]["id"];
const knownIds=new Set<string>(COOKIE_COSMETICS.map(item=>item.id));
const granted=new Set<CookieCosmeticId>();
const equipped=new Set<CookieCosmeticId>();
export function setVerifiedCosmetics(ids:readonly string[]):void{
 granted.clear();equipped.clear();
 for(const item of ids){
  if(knownIds.has(item)){
   const id=item as CookieCosmeticId;
   granted.add(id);equipped.add(id);
  }
 }
}
export function hasVerifiedCosmetic(id:CookieCosmeticId):boolean{
 return granted.has(id)&&equipped.has(id);
}
export function toggleVerifiedCosmetic(id:CookieCosmeticId,active:boolean):boolean{
 if(!granted.has(id))return false;
 if(active)equipped.add(id);else equipped.delete(id);
 return true;
}
export function cosmeticsOwned():readonly CookieCosmeticId[]{return [...granted];}
export function cosmeticAvailable(id:CookieCosmeticId,year:number):boolean{
 return hasVerifiedCosmetic(id)&&year>=COOKIE_COSMETICS.find(item=>item.id===id)!.unlockYear;
}
/** Determinístico por visita: sem RNG consumido por frame ou save adulterável.
 * A ID do visitante é única, logo a escolha muda de cliente para cliente. */
export function headsetOnSession(customerId:number,pcIndex:number):boolean{
 if(!Number.isSafeInteger(customerId)||customerId<0||!Number.isInteger(pcIndex)||pcIndex<0)return false;
 const hash=Math.imul((customerId+1)^0x9e3779b9,0x85ebca6b)^
  Math.imul(pcIndex+17,0xc2b2ae35);
 return ((hash>>>0)%100)<48;
}
