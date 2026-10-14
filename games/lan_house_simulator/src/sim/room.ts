import type {GameState,Result} from "./types.js";
export type ExtensionDirection="west"|"east"|"north";
export interface RoomBounds {minX:number;maxX:number;minY:number;maxY:number}
export const MAX_EXTENSION_LEVEL=5;
export function roomBounds(s:Pick<GameState,"expansionLevel"|"roomExtensions">):RoomBounds{
 const e=s.roomExtensions??{west:0,east:0,south:0};
 return {minX:e.west?-2*e.west:0,maxX:8+2*s.expansionLevel+2*e.east,minY:e.north?-2*e.north:0,maxY:6+2*e.south};
}
export function expansionPrice(s:GameState,direction:ExtensionDirection):number{
 const count=s.roomExtensions?.[direction]??0;
 return 500+count*350;
}
/** Extensão de piso; não cria PCs, não desloca ativos existentes ou a porta sul. */
export function expandDirection(s:GameState,direction:ExtensionDirection):Result{
 if(direction!=="west"&&direction!=="east"&&direction!=="north")
  return {ok:false,message:"Direção de ampliação inválida."};
 const extensions=s.roomExtensions??{west:0,east:0,south:0,north:0};
 const level=extensions[direction]??0;
 if(!Number.isInteger(level)||level<0||level>=MAX_EXTENSION_LEVEL)
  return {ok:false,message:"Limite de expansão dessa direção atingido."};
 const price=expansionPrice(s,direction);
 if(s.cash<price)return {ok:false,message:"Caixa insuficiente para ampliar o terreno: R$ "+price+"."};
 s.cash-=price;s.expenses+=price;
 s.roomExtensions={...extensions,[direction]:level+1};
 // Wall art follows the wall that moved outward; the free coordinate stays put.
 if(s.objectPlacements){const b=roomBounds(s);s.objectPlacements=s.objectPlacements.map(p=>
  !p.id.startsWith("built-poster:")?p:p.rotation===0?{...p,y:b.minY}:p.rotation===3?{...p,x:b.minX+.012}:p);}
 const label={west:"oeste (esquerda)",east:"leste (direita)",north:"norte (fundos do balcão)"}[direction];
 return {ok:true,message:"Salão expandido para "+label+": duas faixas novas. -R$ "+price+"."};
}
export function validRoomExtensions(s:GameState):boolean{
 if(s.roomExtensions===undefined)return true;
 const e=s.roomExtensions;
 return !!e&&["west","east"].every(dir=>{
  const n=e[dir as "west"|"east"];
  return Number.isInteger(n)&&n>=0&&n<=MAX_EXTENSION_LEVEL;
 })&&Number.isInteger(e.south)&&e.south>=0&&e.south<=2&&
   (e.north===undefined||(Number.isInteger(e.north)&&e.north>=0&&e.north<=MAX_EXTENSION_LEVEL));
}
