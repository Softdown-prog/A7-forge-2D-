import type {Customer,GameState} from "./types.js";
import {DAY_MINUTES} from "./types.js";
/** Perfil determinístico, independente do RNG de movimento e dos frames do renderer. */
export function isVip(customer:Pick<Customer,"vip">):boolean{return customer.vip===true;}
export function vipArrivalEligible(s:Pick<GameState,"reputation"|"totalMinutes">,visitorId:number):boolean{
 const rep=Math.max(0,Math.min(100,s.reputation));
 if(rep<55)return false;
 const day=Math.floor(Math.max(0,s.totalMinutes)/DAY_MINUTES);
 const chance=rep>=85?19:rep>=70?12:7;
 const seed=(Math.imul(visitorId,1103515245)+Math.imul(day+1,12345))>>>0;
 return (seed%100)<chance;
}
/** Clientes exigentes valorizam bom hardware/rede, mas penalizam esperas longas. */
export function vipReputationAdjustment(c:Pick<Customer,"vip"|"waitingMinutes"|"offlineWait">,hardwareBonus:number,hourlyPrice=12):number{
 if(!isVip(c))return 0;
 const premiumThreshold=16+Math.max(0,Math.min(.30,hardwareBonus))*28;
 const unjustifiedPremium=Math.max(0,hourlyPrice-premiumThreshold);
 return Math.max(-.25,Math.min(.12,.045+Math.min(.075,hardwareBonus*.40)-Math.max(0,c.waitingMinutes-6)*.008-c.offlineWait*.009-unjustifiedPremium*.012));
}

/** Reputação alta exige consistência: sessões boas deixam de gerar ganhos
 * automáticos ao se aproximar do teto sustentável. Preços premium sem
 * equipamento equivalente reduzem o teto, sem produzir punição instantânea
 * por simplesmente abrir o painel de preços. Avaliações ruins mantêm impacto
 * integral; não alteramos a taxa de chegada nem o pagamento da sessão. */
export function serviceReputationImpact(reputation:number,hourlyPrice:number,hardwareBonus:number,rawImpact:number):number{
 if(!Number.isFinite(rawImpact))return 0;
 if(rawImpact<=0)return Math.max(-.9,rawImpact);
 const fairPremiumThreshold=16+Math.max(0,Math.min(.30,hardwareBonus))*28;
 const cap=98-Math.min(12,Math.max(0,hourlyPrice-fairPremiumThreshold)*.50);
 const positiveScale=Math.max(0,Math.min(1,(cap-reputation)/18));
 return rawImpact*positiveScale;
}
