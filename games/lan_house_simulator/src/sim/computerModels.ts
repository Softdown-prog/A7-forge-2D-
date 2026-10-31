import type {GameState,Result} from "./types.js";
import {stationUpgradeIssue} from "./stationPower.js";
import {gameYear} from "./eraCatalog.js";
import {linuxMachineFor,linuxMachineSpec} from "./linuxMachines.js";

/** Fictional station kits: release years belong to the game's progression. */
export const LCD_CATALOG=[
 {id:"lcd05",name:"Bairro LCD 17",year:2005,cost:580,bonus:.02,powerSaving:.00012,description:"LCD 4:3 prateado, base larga e gabinete de transição."},
 {id:"lcd08",name:"Panorama 19",year:2008,cost:880,bonus:.03,powerSaving:.00016,description:"Tela widescreen, moldura preta e gabinete com DVD."},
 {id:"lcd12",name:"Horizonte LED 22",year:2012,cost:1280,bonus:.045,powerSaving:.00024,description:"Painel LED fino, base circular e gabinete compacto."},
 {id:"lcd17",name:"Estúdio IPS 24",year:2017,cost:1780,bonus:.06,powerSaving:.00028,description:"Bordas reduzidas, pedestal metálico e conjunto grafite."},
 {id:"lcd24",name:"Arena 27",year:2024,cost:2480,bonus:.08,powerSaving:.00022,description:"Tela ampla, pé em V, gabinete ventilado e luzes discretas."}
] as const;
export type LcdId=(typeof LCD_CATALOG)[number]["id"];
export function installedLcd(s:Partial<GameState>,index:number):LcdId|null{
 const id=s.pcLcdModels?.[index];
 return LCD_CATALOG.some(model=>model.id===id)?id as LcdId:null;
}
export function lcdSpec(id:LcdId|null){return LCD_CATALOG.find(model=>model.id===id)??null;}
export function stationModelName(s:GameState,index:number):string{
 const model=linuxMachineFor(s,index);
 return model?linuxMachineSpec(model)!.name:
  lcdSpec(installedLcd(s,index))?.name??"CRT · geração "+(s.pcTiers?.[index]??1);
}
export function validLcdModels(value:unknown):boolean{
 return value===undefined||(Array.isArray(value)&&value.length<=200&&
   value.every(id=>id===null||LCD_CATALOG.some(model=>model.id===id)));
}
export function stationOccupied(s:GameState,index:number):boolean{
 return s.customers.some(c=>c.pcIndex===index&&["to_pc","sitting","using","standing"].includes(c.stage));
}
export function buyLcdKit(s:GameState,index:number,id:LcdId):Result{
 const count=Math.max(3,Math.min(3+s.expansionLevel*2,s.installedPcs??(3+s.expansionLevel*2)))+(s.annexPcs?.length??0);
 if(!Number.isInteger(index)||index<0||index>=count)return {ok:false,message:"PC inexistente."};
 const issue=stationUpgradeIssue(s,index);if(issue)return {ok:false,message:issue};
 const model=lcdSpec(id);
 if(!model)return {ok:false,message:"Modelo LCD desconhecido."};
 if(gameYear(s)<model.year)return {ok:false,message:model.name+" chega em "+model.year+"."};
 if((s.pcTiers?.[index]??1)<3)return {ok:false,message:"Atualize o hardware para o nível 3 antes de instalar um kit LCD."};
 const old=lcdSpec(installedLcd(s,index));
 if(old&&old.year>=model.year)return {ok:false,message:"Esta estação já possui um kit igual ou mais recente."};
 if(stationOccupied(s,index))return {ok:false,message:"Aguarde o cliente liberar esta estação."};
 if(s.repairJobs?.some(job=>job.pc===index))return {ok:false,message:"Aguarde o técnico concluir o reparo."};
 if(s.cash<model.cost)return {ok:false,message:"Caixa insuficiente: R$ "+model.cost+"."};
 s.pcLcdModels=Array.from({length:count},(_,i)=>installedLcd(s,i));
 s.pcLcdModels[index]=model.id;s.cash-=model.cost;s.expenses+=model.cost;
 return {ok:true,message:"PC "+(index+1)+": kit "+model.name+" instalado por R$ "+model.cost+"."};
}
