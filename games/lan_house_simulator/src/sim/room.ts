import type {GameState,Result} from "./types.js";
import {hallwayRoute} from "./route.js";
export type ExtensionDirection="west"|"east"|"south";
export interface RoomBounds {minX:number;maxX:number;minY:0;maxY:number}
export const MAX_EXTENSION_LEVEL=2;
export function roomBounds(s:Pick<GameState,"expansionLevel"|"roomExtensions">):RoomBounds{
 const e=s.roomExtensions??{west:0,east:0,south:0};
 return {minX:-2*e.west,maxX:8+2*s.expansionLevel+2*e.east,minY:0,maxY:6+2*e.south};
}
export function expansionPrice(s:GameState,direction:ExtensionDirection):number{
 const count=s.roomExtensions?.[direction]??0;
 return (direction==="south"?550:500)+count*350;
}
/** Extensão de piso; não cria PCs, não desloca ativos existentes nem altera a parede norte. */
export function expandDirection(s:GameState,direction:ExtensionDirection):Result{
 if(direction!=="west"&&direction!=="east"&&direction!=="south")
  return {ok:false,message:"Direção de ampliação inválida."};
 const extensions=s.roomExtensions??{west:0,east:0,south:0};
 const level=extensions[direction];
 if(!Number.isInteger(level)||level<0||level>=MAX_EXTENSION_LEVEL)
  return {ok:false,message:"Limite de expansão dessa direção atingido."};
 const price=expansionPrice(s,direction);
 if(s.cash<price)return {ok:false,message:"Caixa insuficiente para ampliar o terreno: R$ "+price+"."};
 s.cash-=price;s.expenses+=price;
 s.roomExtensions={...extensions,[direction]:level+1};
 // Clientes já de saída precisam refazer o caminho para a nova porta.
 // Caso contrário continuariam caminhando para a porta antiga, dentro do piso ampliado.
 const destination={x:roomBounds(s).maxX-0.5,y:roomBounds(s).maxY-0.65};
 for(const customer of s.customers){
   if(customer.stage!=="leaving")continue;
   const route=hallwayRoute(customer,destination);
   customer.target=route[0]??destination;
   customer.route=route.slice(1);
 }
 const label={west:"oeste (esquerda)",east:"leste (direita)",south:"sul (frente)"}[direction];
 return {ok:true,message:"Salão expandido para "+label+": duas faixas novas. -R$ "+price+"."};
}
export function validRoomExtensions(s:GameState):boolean{
 if(s.roomExtensions===undefined)return true;
 const e=s.roomExtensions;
 return !!e&&["west","east","south"].every(dir=>{
  const n=e[dir as ExtensionDirection];
  return Number.isInteger(n)&&n>=0&&n<=MAX_EXTENSION_LEVEL;
 });
}
