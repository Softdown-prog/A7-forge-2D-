// Reproducible demand/ROI evidence from actual customers, not invented occupancy.
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createGame,stepGame,isValidSave} from '../dist/js/sim/engine.js';
import {DAY_MINUTES} from '../dist/js/sim/types.js';
import {buyPs1Station,buyPs1Disc,repairPs1Controls} from '../dist/js/sim/ps1.js';
import {buyPs2Station,buyPs2Game,buyPs2SecondSeat,ps2RepairPrice,repairPs2,ps2HourPrice,setPs2HourlyPrice,ps2EnergyCostPerMinute} from '../dist/js/sim/ps2.js';
const output=resolve(process.argv[2]??'out/ps2-integrated');await mkdir(output,{recursive:true});
const ok=r=>{if(!r.ok)throw Error(r.message);};
const reports=[];
for(const year of [2006,2010,2020,2030])for(const rate of (year===2006?[2.5,4,5]:[null])){
 const s=createGame(314,'historical');s.totalMinutes=(year-1998)*360*DAY_MINUTES;s.cash=100000;
 s.licensedGames=true;ok(buyPs1Station(s,'floor-1'));ok(buyPs1Disc(s,'turbo-circuito'));
 const before=s.expenses;ok(buyPs2Station(s,'floor-2'));ok(buyPs2Game(s,'cidade-em-fuga'));ok(buyPs2SecondSeat(s,0));
 if(rate!==null)ok(setPs2HourlyPrice(s,rate));
 const investment=s.expenses-before,energy=s.energyAccrued??0;let energyPs2=0,maxUsing=0,repairs=0;
 for(let i=0;i<7*DAY_MINUTES;i++){
  energyPs2+=ps2EnergyCostPerMinute(s);
  stepGame(s,1);maxUsing=Math.max(maxUsing,s.customers.filter(c=>c.ps2StationIndex===0&&c.stage==='using').length);
  if(s.ps2Stations[0].wear>=80){const price=ps2RepairPrice(s);if(repairPs2(s,0).ok)repairs+=price;}
  if(s.ps1Stations[0].wear>=80)repairPs1Controls(s,0);
 }
 if(!isValidSave(s))throw Error('Invalid campaign save '+year);
 const sessions=s.ps2Sessions??0,revenue=s.ps2Revenue??0,wearReserve=s.ps2Stations[0].wear/100*ps2RepairPrice(s);
 reports.push({year,days:7,hourly:ps2HourPrice(s),investment,ps2Sessions:sessions,ps2Revenue:revenue,
  ps1Sessions:s.ps1Sessions??0,pcSessions:s.served-(s.ps1Sessions??0)-sessions,maxSimultaneousPs2:maxUsing,
  energyPs2:Math.round(energyPs2*100)/100,allEnergyAccrued:Math.round(((s.energyAccrued??0)-energy)*100)/100,
  repairs,wear:s.ps2Stations[0].wear,maintenanceReserve:Math.round(wearReserve*100)/100,
  ps2ContributionBeforeSharedBills:Math.round((revenue-energyPs2-repairs-wearReserve)*100)/100,reputation:s.reputation,
  remainingCustomers:s.customers.length,waitingPaidPs2:s.customers.filter(c=>c.ps2StationIndex!==undefined&&c.stage==='to_pc').length});
 console.log(JSON.stringify(reports.at(-1)));
}
// Real boundary: buying before midnight fails, then works after the year advances.
const boundary=createGame(551,'historical');boundary.cash=10000;boundary.totalMinutes=8*360*DAY_MINUTES-20;
if(buyPs2Station(boundary,'floor-2').ok)throw Error('PS2 offered in 2005');stepGame(boundary,20);ok(buyPs2Station(boundary,'floor-2'));
await writeFile(resolve(output,'ps2-campaigns.json'),JSON.stringify({kind:'actual minute simulation; seven game days per case',boundary2005to2006:true,reports},null,2));
