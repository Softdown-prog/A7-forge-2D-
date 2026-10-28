/** Read-only projection of historical financial and attendance summaries. */
import type {GameState} from "../sim/types.js";
import {gameYear} from "../sim/era.js";
import {priceIndex} from "../sim/historicalEconomy.js";
import {monthlyBills,energyMonthlyEstimate} from "../sim/economy.js";
export interface FinancialAdminOverview{
 readonly bills:string;readonly served:string;readonly breakdown:string;
 readonly activity:string;readonly expansion:string;
}
export interface FinancialAdminOverviewPort{snapshot():FinancialAdminOverview}
export function createFinancialAdminOverviewPort(getState:()=>GameState):FinancialAdminOverviewPort{
 const money=(n:number):string=>"R$ "+n.toLocaleString("pt-BR");
 return {snapshot(){
  const s=getState(),index=s.economyVersion===2?priceIndex(gameYear(s)):1;
  const rent=Math.round((270+s.expansionLevel*170)*index);
  const internet=Math.round((110+(s.internetTier-1)*85)*index);
  const energy=s.energyAccrued!==undefined?Math.round(s.energyAccrued):energyMonthlyEstimate(s);
  const maintenance=Math.round((75+s.expansionLevel*35)*index);
  const wages=s.employeePayrollAccrued??0;
  const printer=s.printer?.walkIns??0,discs=s.discCopier?.walkIns??0;
  const attended=s.served+printer+discs,ps1=s.ps1Sessions??0;
  return {
   bills:money(monthlyBills(s)),served:String(attended),
   breakdown:"Contas: aluguel "+money(rent)+" · internet "+money(internet)+
    " · energia acumulada "+money(energy)+" · manutenção "+money(maintenance)+
    " · salários acumulados "+money(wages)+" · projeção energia/mês "+money(energyMonthlyEstimate(s))+
    ". Diárias cobradas apenas nos dias com atendimento efetivo.",
   activity:"Entradas R$ "+s.revenue+" · Saídas R$ "+s.expenses+
    " · Atendimentos "+attended+" (PCs "+(s.served-ps1)+
    ((s.ps1Stations?.length??0)+ps1>0?" · PlayStation "+ps1:"")+
    " · Impressões avulsas "+printer+" · Cópias avulsas "+discs+")",
   expansion:"Ampliação "+s.expansionLevel+"/2"
  };
 }};
}
