import type {GameState,Point,Result} from "./types.js";
import {availablePlacementSlots,furnitureSlots,shopPrice} from "./shop.js";
import {annualHourlyCeiling,isHistorical,yearFromMinutes,priceIndex} from "./historicalEconomy.js";
import {roomBounds} from "./room.js";

/** Marco de design: mistura das antigas locadoras de console com lan houses. */
export const PS1_UNLOCK_YEAR=2002;
export const PS1_MAX_STATIONS=3;
export const PS1_REPAIR_COST=45;
export const PS1_WEAR_LIMIT=100;
export const PS1_CD_CATALOG=[
 {id:"turbo-circuito",title:"Turbo Circuito",genre:"Corrida",basePrice:44},
 {id:"gol-de-rua",title:"Gol de Rua",genre:"Futebol",basePrice:39},
 {id:"ilha-dos-cristais",title:"Ilha dos Cristais",genre:"Aventura",basePrice:49},
 {id:"luta-neon",title:"Luta Neon",genre:"Luta",basePrice:54},
 {id:"cosmo-blocos",title:"Cosmo Blocos",genre:"Quebra-cabeça",basePrice:29}
] as const;
export type Ps1DiscId=typeof PS1_CD_CATALOG[number]["id"];
export type Ps1Station={slotId:string;wear:number;discId?:Ps1DiscId;secondSeat?:boolean};
export const PS1_SECOND_SEAT_BASE_COST=120;
/** Extra original: cadeira e gamepad, sem comprar outro console ou CD. */
export function ps1SecondSeatPrice(s:GameState):number{
 return coin(PS1_SECOND_SEAT_BASE_COST*
  priceIndex(yearFromMinutes(s.totalMinutes))/priceIndex(PS1_UNLOCK_YEAR));
}
/** O jogador compra CDs físicos, não licenças. Cada cópia atende uma bancada por vez. */
export function ps1DiscCopies(s:Pick<GameState,"ps1Discs">,id:Ps1DiscId):number{
 return s.ps1Discs?.[id]??0;
}
export function ps1DiscPrice(s:GameState,id:Ps1DiscId):number{
 const title=PS1_CD_CATALOG.find(x=>x.id===id);
 if(!title)return 0;
 const factor=priceIndex(yearFromMinutes(s.totalMinutes))/priceIndex(PS1_UNLOCK_YEAR);
 return Math.round(title.basePrice*factor*100)/100;
}
export function ps1ActiveCopies(s:GameState,id:Ps1DiscId,excludeIndex=-1):number{
 return (s.ps1Stations??[]).filter((st,i)=>i!==excludeIndex&&st.discId===id).length;
}
export function ps1PlayableDisc(s:GameState,index:number):Ps1DiscId|null{
 const id=s.ps1Stations?.[index]?.discId;
 return id&&ps1DiscCopies(s,id)>0&&ps1ActiveCopies(s,id)<=ps1DiscCopies(s,id)?id:null;
}
/** Compra definitiva: ao adquirir o primeiro CD, ativa automaticamente uma cadeira vazia. */
export function buyPs1Disc(s:GameState,id:Ps1DiscId):Result{
 const title=PS1_CD_CATALOG.find(t=>t.id===id);
 if(!title)return {ok:false,message:"CD de PlayStation desconhecido."};
 if(!in2002(s)||!(s.ps1Stations?.length))
  return {ok:false,message:"Instale primeiro uma bancada de PlayStation em 2002."};
 if(ps1DiscCopies(s,id)>=PS1_MAX_STATIONS)
  return {ok:false,message:"Já existem cópias suficientes deste CD para todas as bancadas."};
 const price=ps1DiscPrice(s,id);
 if(s.cash<price)return {ok:false,message:"Caixa insuficiente para comprar o CD "+title.title+"."};
 s.cash=coin(s.cash-price);s.expenses=coin(s.expenses+price);
 const inventory=s.ps1Discs??(s.ps1Discs={});
 inventory[id]=ps1DiscCopies(s,id)+1;
 const empty=s.ps1Stations.findIndex(st=>!st.discId);
 if(empty>=0)s.ps1Stations[empty]!.discId=id;
 return {ok:true,message:"CD original "+title.title+" comprado: -R$ "+price.toFixed(2)+
  (empty>=0?" · colocado automaticamente na bancada "+(empty+1)+".":".")};
}
export function setPs1StationDisc(s:GameState,index:number,id:Ps1DiscId|null):Result{
 const station=s.ps1Stations?.[index];
 if(!station)return {ok:false,message:"Bancada de PlayStation inexistente."};
 if(s.customers.some(c=>c.ps1StationIndex===index&&
  ["to_pc","sitting","using","standing"].includes(c.stage)))
  return {ok:false,message:"Aguarde o cliente terminar para trocar o CD."};
 if(id!==null){
  const title=PS1_CD_CATALOG.find(t=>t.id===id);
  if(!title)return {ok:false,message:"CD desconhecido."};
  if(ps1ActiveCopies(s,id,index)>=ps1DiscCopies(s,id))
   return {ok:false,message:"Todas as cópias de "+title.title+" já estão em outras bancadas."};
 }
 if(id===null)delete station.discId;else station.discId=id;
 return {ok:true,message:id===null?"Bancada "+(index+1)+" sem CD. Serviço pausado.":
  "CD "+PS1_CD_CATALOG.find(t=>t.id===id)!.title+" inserido na bancada "+(index+1)+"."};
}

const in2002=(s:GameState):boolean=>isHistorical(s)&&yearFromMinutes(s.totalMinutes)>=PS1_UNLOCK_YEAR;
const coin=(v:number):number=>Math.round(v*100)/100;
/** Bancadas usam os pontos largos do salão, não as casas miúdas da decoração. */
export function ps1PlacementSlots(s:GameState){
 const free=new Set(availablePlacementSlots(s,"table").map(p=>p.id));
 return furnitureSlots(s).filter(p=>p.surface==="floor"&&
  p.id.startsWith("floor-")&&!p.id.startsWith("floor-grid-")&&free.has(p.id));
}
/** Nome amigável para a escolha da bancada. Mantém o ID original do
 * encaixe no <select> (saves e pathfinding permanecem iguais).
 * Norte = fundos do salão; sul = porta/entrada; oeste = esquerda.
 * Evite expor X/Y do motor isométrico para o jogador. */
export function ps1PlacementLabel(slot:{id:string;x:number;y:number}):string{
 const base:Record<string,string>={
  "floor-1":"Entrada (sul) · lado esquerdo",
  "floor-2":"Entrada (sul) · centro-esquerda",
  "floor-3":"Entrada (sul) · centro-direita",
  "floor-4":"Entrada (sul) · lado direito"
 };
 if(base[slot.id])return base[slot.id];
 const wing=slot.id.match(/^floor-(west|east)-(\d+)$/);
 if(wing){
  const side=wing[1]==="west"?"Ala esquerda (oeste)":"Ala direita (leste)";
  return side+" · espaço "+wing[2];
 }
 const funds=slot.id.match(/^floor-north-(\d+)-([ab])$/);
 if(funds)return "Fundos (norte) · "+(funds[2]==="a"?"lado esquerdo":"lado direito")+
  " · setor "+funds[1];
 const entrance=slot.id.match(/^floor-south-(\d+)-([ab])$/);
 if(entrance)return "Entrada (sul) · "+(entrance[2]==="a"?"lado esquerdo":"lado direito")+
  " · setor "+entrance[1];
 // Encaixes futuros: descrever orientação sem mostrar dados técnicos.
 const side=slot.x<2?"lado esquerdo":slot.x>5?"lado direito":"centro";
 const depth=slot.y<2?"fundos (norte)":slot.y>4?"entrada (sul)":"meio do salão";
 return depth+" · "+side;
}

export function ps1StationPoint(s:GameState,index:number):Point|null{
 const id=s.ps1Stations?.[index]?.slotId;
 const slot=id&&furnitureSlots(s).find(p=>p.id===id&&p.surface==="floor");
 return slot?{x:slot.x,y:slot.y}:null;
}
export type Ps1SeatNumber=0|1;
export function ps1Seat(s:GameState,index:number,number:Ps1SeatNumber=0):Point|null{
 const p=ps1StationPoint(s,index),duo=s.ps1Stations?.[index]?.secondSeat===true;
 if(!p||(number===1&&!duo))return null;
 return {x:p.x+(duo?(number===0?.27:.85):.43),y:p.y+.77};
}
/** A cadeira esquerda e a direita têm entradas distintas. */
export function ps1SeatApproach(s:GameState,index:number,number:Ps1SeatNumber=0):Point|null{
 const p=ps1StationPoint(s,index),seat=ps1Seat(s,index,number);
 if(!p||!seat)return null;
 const bounds=roomBounds(s);
 if(s.ps1Stations?.[index]?.secondSeat){
  const x=number===0?p.x-.35:p.x+1.36;
  return x>bounds.minX+.22&&x<bounds.maxX-.22?{x,y:seat.y}:null;
 }
 const right=p.x+1.36;
 return {x:right<bounds.maxX-.22?right:p.x-.35,y:seat.y};
}
const ps1SeatOccupied=(s:GameState,index:number,number:Ps1SeatNumber):boolean=>
 s.customers.some(c=>c.ps1StationIndex===index&&
  ["to_pc","sitting","using","standing"].includes(c.stage)&&
  (c.ps1SeatIndex??0)===number);
export function ps1OpenSeat(s:GameState,index:number):Ps1SeatNumber|null{
 const st=s.ps1Stations?.[index];
 if(!st||ps1PlayableDisc(s,index)===null||st.wear>=PS1_WEAR_LIMIT)return null;
 if(!ps1SeatOccupied(s,index,0))return 0;
 return st.secondSeat&&!ps1SeatOccupied(s,index,1)?1:null;
}
export function ps1StationAvailable(s:GameState,index:number):boolean{
 return ps1OpenSeat(s,index)!==null;
}
/** Upgrade instalado entre atendimentos; guarda estado no save. */
export function buyPs1SecondSeat(s:GameState,index:number):Result{
 const st=s.ps1Stations?.[index];
 if(!in2002(s)||!st)return {ok:false,message:"Instale primeiro uma bancada de PlayStation em 2002."};
 if(st.secondSeat)return {ok:false,message:"Esta bancada já tem duas cadeiras."};
 if(s.customers.some(c=>c.ps1StationIndex===index&&
   ["to_pc","sitting","using","standing"].includes(c.stage)))
  return {ok:false,message:"Aguarde os jogadores saírem antes de instalar a cadeira."};
 const bounds=roomBounds(s),p=ps1StationPoint(s,index);
 if(!p||p.x-.35<=bounds.minX+.22||p.x+1.36>=bounds.maxX-.22)
  return {ok:false,message:"Esta bancada não tem corredor lateral para a segunda cadeira."};
 const cost=ps1SecondSeatPrice(s);
 if(s.cash<cost)return {ok:false,message:"Caixa insuficiente para cadeira e segundo controle."};
 s.cash=coin(s.cash-cost);s.expenses=coin(s.expenses+cost);st.secondSeat=true;
 return {ok:true,message:"Bancada "+(index+1)+": segunda cadeira e controle instalados por R$ "+
  cost.toFixed(2)+". Dois clientes podem jogar no mesmo console."};
}
export function ps1HourPrice(s:GameState):number{
 return s.ps1HourlyPrice??2.5;
}
export function ps1AllowedHourlyCeiling(s:GameState):number{
 return annualHourlyCeiling(yearFromMinutes(s.totalMinutes));
}
export function ps1SessionPrice(s:GameState,minutes:number):number{
 return coin(ps1HourPrice(s)*minutes/60);
}
export function buyPs1Station(s:GameState,slotId:string):Result{
 if(!in2002(s))return {ok:false,message:"Bancada de PlayStation disponível a partir de 2002."};
 if((s.ps1Stations?.length??0)>=PS1_MAX_STATIONS)
  return {ok:false,message:"Limite de três bancadas de PlayStation."};
 if(!ps1PlacementSlots(s).some(p=>p.id===slotId))
  return {ok:false,message:"Posição sem espaço livre para bancada, TV e cadeira."};
 const cost=shopPrice(s,"ps1");
 if(s.cash<cost)return {ok:false,message:"Caixa insuficiente para PlayStation, TV, bancada e cadeira."};
 s.cash=coin(s.cash-cost);s.expenses=coin(s.expenses+cost);
 (s.ps1Stations??=[]).push({slotId,wear:0});
 return {ok:true,message:"PlayStation 1 instalado! TV de tubo, bancada e cadeira: -R$ "+cost+"."};
}
export function setPs1HourlyPrice(s:GameState,price:number):Result{
 if(!in2002(s)||!(s.ps1Stations?.length))
  return {ok:false,message:"Compre uma bancada a partir de 2002 antes de configurar preços."};
 if(!Number.isFinite(price)||price<.5||price>ps1AllowedHourlyCeiling(s)||
   Math.abs(price*4-Math.round(price*4))>1e-8)
  return {ok:false,message:"Preço permitido entre R$ 0,50 e R$ "+
   ps1AllowedHourlyCeiling(s).toFixed(2)+", em intervalos de R$ 0,25."};
 s.ps1HourlyPrice=price;
 return {ok:true,message:"PlayStation: R$ "+price.toFixed(2)+" por hora."};
}
export function ps1AvailableStation(s:GameState):number{
 return s.ps1Stations?.findIndex((_,i)=>ps1StationAvailable(s,i))??-1;
}
export function ps1EnergyCostPerMinute(s:GameState):number{
 return (s.ps1Stations?.length??0)*.0008;
}
export function ps1SessionWear(s:GameState,index:number):void{
 const station=s.ps1Stations?.[index];
 if(station)station.wear=Math.min(PS1_WEAR_LIMIT,Math.round((station.wear+.035)*1000)/1000);
}
export function repairPs1Controls(s:GameState,index:number):Result{
 const station=s.ps1Stations?.[index];
 if(!station)return {ok:false,message:"Bancada inexistente."};
 if(s.customers.some(c=>c.ps1StationIndex===index&&["to_pc","sitting","using","standing"].includes(c.stage)))
  return {ok:false,message:"Aguarde o cliente sair para trocar os controles."};
 if(station.wear<10)return {ok:false,message:"Os controles ainda não precisam de manutenção."};
 if(s.cash<PS1_REPAIR_COST)return {ok:false,message:"Caixa insuficiente para a manutenção dos controles."};
 s.cash=coin(s.cash-PS1_REPAIR_COST);s.expenses=coin(s.expenses+PS1_REPAIR_COST);
 station.wear=0;
 return {ok:true,message:"Controles da bancada PS1 "+(index+1)+" revisados: -R$ "+PS1_REPAIR_COST+"."};
}
export function validPs1State(s:Partial<GameState>):boolean{
 const allowed=s.ps1Stations;
 if(allowed===undefined)return s.ps1HourlyPrice===undefined&&s.ps1Sessions===undefined&&s.ps1Revenue===undefined&&s.ps1Discs===undefined;
 if(!Array.isArray(allowed)||allowed.length>PS1_MAX_STATIONS||!isHistorical(s as GameState))return false;
 if(allowed.length&&yearFromMinutes(s.totalMinutes??0)<PS1_UNLOCK_YEAR)return false;
 const stock=s.ps1Discs;
 if(stock!==undefined){
  if(!stock||typeof stock!=="object"||Array.isArray(stock))return false;
  for(const [id,copies] of Object.entries(stock)){
   if(!PS1_CD_CATALOG.some(t=>t.id===id)||!Number.isInteger(copies)||
      (copies as number)<1||(copies as number)>PS1_MAX_STATIONS)return false;
  }
 }
 const inserted=new Map<Ps1DiscId,number>();
 const used=new Set<string>();
 const slots=new Set(furnitureSlots(s as GameState).filter(p=>p.surface==="floor"&&
  p.id.startsWith("floor-")&&!p.id.startsWith("floor-grid-")).map(p=>p.id));
 for(const st of allowed){
  if(!st||typeof st.slotId!=="string"||!slots.has(st.slotId)||used.has(st.slotId)||
     !Number.isFinite(st.wear)||st.wear<0||st.wear>PS1_WEAR_LIMIT||
     (st.secondSeat!==undefined&&typeof st.secondSeat!=="boolean"))return false;
  used.add(st.slotId);
  if(st.discId!==undefined){
   if(!PS1_CD_CATALOG.some(t=>t.id===st.discId))return false;
   inserted.set(st.discId,(inserted.get(st.discId)??0)+1);
  }
 }
 for(const [id,count] of inserted)if(count>ps1DiscCopies(s as GameState,id))return false;
 const occupied=new Set<string>();
 for(const c of s.customers??[]){
  if(c.ps1StationIndex===undefined||
   !["to_pc","sitting","using","standing"].includes(c.stage))continue;
  const st=allowed[c.ps1StationIndex],seat=c.ps1SeatIndex??0;
  if(!st||(seat===1&&!st.secondSeat)||(seat!==0&&seat!==1))return false;
  const key=c.ps1StationIndex+":"+seat;
  if(occupied.has(key))return false;
  occupied.add(key);
 }
 if((s.furniturePlacements??[]).some(p=>used.has(p.slotId)))return false;
 const cents=(n:number)=>Number.isFinite(n)&&Math.abs(n*100-Math.round(n*100))<1e-4;
 if(s.ps1HourlyPrice!==undefined&&(!cents(s.ps1HourlyPrice)||s.ps1HourlyPrice<.5||
     Math.abs(s.ps1HourlyPrice*4-Math.round(s.ps1HourlyPrice*4))>1e-8||
     s.ps1HourlyPrice>annualHourlyCeiling(yearFromMinutes(s.totalMinutes??0))))return false;
 if(s.ps1Sessions!==undefined&&(!Number.isInteger(s.ps1Sessions)||s.ps1Sessions<0||s.ps1Sessions>1e7))return false;
 if(s.ps1Revenue!==undefined&&(!cents(s.ps1Revenue)||s.ps1Revenue<0||s.ps1Revenue>1e9))return false;
 return true;
}
