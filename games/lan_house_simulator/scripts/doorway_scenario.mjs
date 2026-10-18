// Positions captured from an unmodified historical campaign, seed 51, minute 372.
// The incoming visitor seals the shared doorstep; 11 departures cannot reach it.
import {createGame,entrance} from '../dist/js/sim/engine.js';
import {navigableRoute} from '../dist/js/sim/navigation.js';
import {counterQueueSlot} from '../dist/js/sim/checkoutQueue.js';
export function doorwayScenario(){
 const s=createGame(51,'historical');s.totalMinutes=372;s.pricePerHour=40;s.reputation=10;s.nextCustomerId=18;
 const positions=[
  [1,7.50375,4.917],[3,7.194620427800945,4.156700529387534],
  [7,6.756438638255641,4.239851221601716],[8,6.72811898155418,4.9329758698853645],
  [10,7.426887146226061,5.787735924528227],[11,7.5,4.48],
  [12,7.074391920481741,5.239851011226408],[13,6.37,4.48],
  [14,6.21094252654355,4.882765493722798],[15,5.874374592212216,4.3827849686363205],
  [16,7.0729382570990955,4.580083874609167]
 ];
 s.customers=positions.map(([id,x,y])=>{
  const route=navigableRoute(s,{x,y},entrance(s));
  return {id,x,y,stage:'leaving',target:route[0],route:route.slice(1),costume:'regular',pcIndex:null,usedMinutes:0,waitingMinutes:0,offlineWait:0,happy:true};
 });
 const entry=entrance(s),path=navigableRoute(s,entry,counterQueueSlot(0,s));
 s.customers.push({id:17,...entry,stage:'arriving',queueIndex:0,target:path[0],route:path.slice(1),costume:'mouse-mascot',pcIndex:null,usedMinutes:0,waitingMinutes:0,offlineWait:0,happy:true,wallet:12});
 return s;
}
