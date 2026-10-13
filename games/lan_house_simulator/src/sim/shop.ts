import type {GameState,Result} from "./types.js";
export type FurnitureKind="poster"|"plant"|"table";
export const SHOP_CATALOG=[
 {id:"expand",label:"Ampliar salão",category:"Expansão",description:"Libera espaço para mais dois PCs."},
 {id:"computer",label:"Computador com mesa",category:"Computadores",description:"Instala um computador completo."},
 {id:"poster",label:"Pôster",category:"Decoração",description:"Pôster geométrico de parede."},
 {id:"plant",label:"Planta",category:"Decoração",description:"Vaso com folhagens."},
 {id:"table",label:"Mesinha",category:"Móveis",description:"Mesa lateral decorativa."}
] as const;
export function shopPrice(s:GameState,id:string):number{
 return id==="expand"?650+s.expansionLevel*450:id==="computer"?320:id==="poster"?45:id==="plant"?85:id==="table"?140:0;
}
export function buyComputer(s:GameState):Result{
 const count=s.installedPcs??(3+s.expansionLevel*2),capacity=3+s.expansionLevel*2;
 if(count>=capacity)return {ok:false,message:"Amplie o salão antes de instalar outro PC."};
 const cost=shopPrice(s,"computer");
 if(s.cash<cost)return {ok:false,message:"Caixa insuficiente para o PC."};
 s.cash-=cost;s.expenses+=cost;s.installedPcs=count+1;
 (s.pcWear??=[])[count]=0;(s.pcTiers??=[])[count]=1;
 return {ok:true,message:"Novo PC instalado: -R$ "+cost+"."};
}
export function buyFurniture(s:GameState,kind:FurnitureKind):Result{
 const limits={poster:2,plant:2,table:1};
 if(!Object.prototype.hasOwnProperty.call(limits,kind))return {ok:false,message:"Móvel inválido."};
 const count=s.furniture?.[kind]??0;
 if(count>=limits[kind])return {ok:false,message:"Limite desse móvel atingido."};
 const cost=shopPrice(s,kind);
 if(s.cash<cost)return {ok:false,message:"Caixa insuficiente."};
 s.cash-=cost;s.expenses+=cost;
 (s.furniture??={poster:0,plant:0,table:0})[kind]=count+1;
 return {ok:true,message:"Móvel instalado: -R$ "+cost+"."};
}
