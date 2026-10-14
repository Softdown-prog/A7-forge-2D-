import type {GameState,StationAccount} from "./types.js";

/** A contabilidade segue a estação, independente das peças instaladas. */
export function emptyStationAccount():StationAccount{
 return {sessions:0,vipSessions:0,sessionRevenue:0,vipRevenue:0,
  occupiedMinutes:0,energyShare:0};
}
function ensureAccounts(s:GameState,count:number):StationAccount[]{
 const records=s.stationLedger??(s.stationLedger=[]);
 while(records.length<count)records.push(emptyStationAccount());
 return records;
}
export function recordPaidSession(s:GameState,index:number,count:number,amount:number,vip:boolean):void{
 if(!Number.isInteger(index)||index<0||index>=count||!Number.isFinite(amount)||amount<0)return;
 const r=ensureAccounts(s,count)[index]!;
 r.sessions++;r.sessionRevenue+=amount;
 if(vip){r.vipSessions++;r.vipRevenue+=amount;}
}
/** Rateio contábil da energia real do motor, não medição de watts das peças. */
export function recordStationMinute(s:GameState,count:number,energy:number):void{
 if(!Number.isInteger(count)||count<=0||!Number.isFinite(energy)||energy<0)return;
 const rows=ensureAccounts(s,count),share=energy/count;
 for(let i=0;i<count;i++)rows[i]!.energyShare+=share;
 for(const c of s.customers)
  if(c.stage==="using"&&c.pcIndex!==null&&Number.isInteger(c.pcIndex)&&
     c.pcIndex>=0&&c.pcIndex<count)rows[c.pcIndex]!.occupiedMinutes++;
}
export function stationAccountingSummary(s:GameState,index:number):StationAccount{
 return s.stationLedger?.[index]??emptyStationAccount();
}
export function validStationLedger(input:unknown):boolean{
 if(input===undefined)return true;
 if(!Array.isArray(input)||input.length>200)return false;
 return input.every((value:unknown)=>{
  if(!value||typeof value!=="object"||Array.isArray(value))return false;
  const r=value as Partial<StationAccount>;
  const integers=[r.sessions,r.vipSessions,r.occupiedMinutes];
  const money=[r.sessionRevenue,r.vipRevenue,r.energyShare];
  return integers.every(n=>Number.isSafeInteger(n)&&n!>=0&&n!<=1e12)&&
   money.every(n=>typeof n==="number"&&Number.isFinite(n)&&n>=0&&n<=1e12)&&
   r.vipSessions!<=r.sessions!&&r.vipRevenue!<=r.sessionRevenue!;
 });
}
