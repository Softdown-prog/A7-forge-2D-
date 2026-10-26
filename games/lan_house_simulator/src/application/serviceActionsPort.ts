/** Contrato de aplicação para serviços, equipe e compras administrativas.
 * O estado não é armazenado pela porta: toda ação usa a partida corrente.
 */
import type {GameState,Item,Result} from "../sim/types.js";
import {stockItem,contractSupplier,licenseGames,upgradeInternet,repairInternet} from "../sim/economy.js";
import {launchPromotion} from "../sim/promotion.js";
import {requestCleaning} from "../sim/services.js";
import {employeeHired,hireEmployee,dismissEmployee,type EmployeeRole} from "../sim/staff.js";

export interface ServiceActionsPort {
 restock(item:string):Result;
 contractSupplier():Result;
 promote():Result;
 upgradeInternet():Result;
 repairInternet():Result;
 licenseGames():Result;
 toggleEmployee(role:string):Result;
 cleanNow():Result;
}
const invalidItem:Result={ok:false,message:"Mercadoria inválida."};
const invalidRole:Result={ok:false,message:"Função de funcionário inválida."};
const isItem=(item:string):item is Item=>item==="soda"||item==="candy"||item==="snacks";
const isRole=(role:string):role is EmployeeRole=>role==="cleaner"||role==="technician";

export function createServiceActionsPort(getState:()=>GameState):ServiceActionsPort{
 return {
  restock(item){return isItem(item)?stockItem(getState(),item):invalidItem;},
  contractSupplier(){return contractSupplier(getState());},
  promote(){return launchPromotion(getState());},
  upgradeInternet(){return upgradeInternet(getState());},
  repairInternet(){return repairInternet(getState());},
  licenseGames(){return licenseGames(getState());},
  toggleEmployee(role){
   if(!isRole(role))return invalidRole;
   const state=getState();
   return employeeHired(state,role)?dismissEmployee(state,role):hireEmployee(state,role);
  },
  cleanNow(){return requestCleaning(getState());}
 };
}
