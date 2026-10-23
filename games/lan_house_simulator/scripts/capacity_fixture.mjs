/** Synthetic headroom fixture. NOT a playable population or occupancy claim.
 * Uses real paid expansion APIs, but injects actors only for QA measurements.
 */
import {createGame,isValidSave} from '../dist/js/sim/engine.js';
import {expandDirection,roomBounds} from '../dist/js/sim/room.js';

export const CAPACITY_COUNTS=Object.freeze([14,30,50,100]);
const COSTUMES=['regular','female','female-bob','female-ponytail','clown','vampire','rabbit','mouse-mascot'];

export function capacityFixture(count,seed=72421){
 if(!CAPACITY_COUNTS.includes(count))throw Error('Unsupported synthetic capacity '+count);
 const s=createGame(seed);
 s.cash=100000;s.reputation=95;s.licensedGames=true;
 for(const direction of ['west','west','east','east','north','north']){
  const result=expandDirection(s,direction);
  if(!result.ok)throw Error('Cannot expand synthetic fixture: '+result.message);
 }
 const b=roomBounds(s),points=[];
 // Keep clear of the original shop and furniture. 0.85 world units between actors.
 for(let y=b.minY+0.55;y<b.maxY-0.55;y+=0.85){
  for(let x=b.minX+0.55;x<b.maxX-0.55;x+=0.85){
   if(x>-.35&&x<8.35&&y>-.35)continue;
   points.push({x:+x.toFixed(3),y:+y.toFixed(3)});
  }
 }
 if(points.length<count)throw Error('Synthetic stage too small: '+points.length);
 // Real renderer and engine consume the same Customer fields and GameState.
 // No fabricated sales, extra hardware, passive revenue or modified game limits.
 s.customers=points.slice(0,count).map((at,i)=>({
  id:i+1,x:at.x,y:at.y,stage:'to_pc',target:{x:at.x+(i%2?.24:-.24),y:at.y},
  route:[],costume:COSTUMES[i%COSTUMES.length],facing:i%2?'east':'west',
  pcIndex:null,usedMinutes:0,sessionMinutes:120,waitingMinutes:0,offlineWait:0,
  happy:true,needs:{hunger:30,thirst:30,energy:80},wallet:30
 }));
 s.nextCustomerId=count+1;
 if(!isValidSave(s))throw Error('Invalid synthetic fixture '+count);
 return s;
}
