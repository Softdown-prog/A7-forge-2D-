/** customerMotion.ts: módulo do runtime LHS; lógica executada por minuto do jogo. */
import type {Customer,GameState,Point} from "./types.js";
import {CUSTOMER_COLLISION_RADIUS} from "./checkoutQueue.js";
import {directionFromDelta} from "./direction.js";
import {navigableRoute,canTraverseLocalStep} from "./navigation.js";
import {roomBounds} from "./room.js";
import {crowdRoute,crowdSideStep} from "./crowdNavigation.js";
import {ps1Seat,ps1SeatApproach} from "./ps1.js";

export function canCustomerOccupy(s:GameState,c:Customer,at:Point):boolean {
  return s.customers.every(other=>{
    if(other===c || other.id===c.id)return true;
    const current=Math.hypot(c.x-other.x,c.y-other.y);
    const next=Math.hypot(at.x-other.x,at.y-other.y);
    // Saves antigos podem conter sobreposição: permitir apenas passos que afastem.
    return next>=CUSTOMER_COLLISION_RADIUS ||
      (current<CUSTOMER_COLLISION_RADIUS&&next>current+0.0001);
  });
}
export function move(s:GameState,c:Customer,speed=0.38):boolean {
  const origin={x:c.x,y:c.y};
  const dx=c.target.x-c.x,dy=c.target.y-c.y;
  const distance=Math.hypot(dx,dy);
  if(distance<=0.005){
    if(!canTraverseLocalStep(s,c,c.target)||!canCustomerOccupy(s,c,c.target))return false;
    c.x=c.target.x;c.y=c.target.y;return true;
  }
  c.facing=directionFromDelta(dx,dy,c.facing);
  // Subpassos impedem troca de lado atravessando o corpo do outro.
  const count=Math.ceil(Math.min(speed,distance)/0.10);
  const length=Math.min(speed,distance)/count;
  for(let i=0;i<count;i++){
    const vx=c.target.x-c.x,vy=c.target.y-c.y,remaining=Math.hypot(vx,vy);
    if(remaining<=0.005)break;
    const nx=vx/remaining,ny=vy/remaining,step=Math.min(length,remaining);
    const desired={x:c.x+nx*step,y:c.y+ny*step};
    if(canTraverseLocalStep(s,{x:c.x,y:c.y},desired)&&canTraverseLocalStep(s,origin,desired)&&canCustomerOccupy(s,c,desired)){
      c.x=desired.x;c.y=desired.y;continue;
    }
    // Desvio local seguro inclusive em salas divididas: testar cada movimento
    // contra as divisórias antes de tentar contornar outros visitantes.
    {
      const bounds=roomBounds(s);
      for(const sign of [c.id%2===0?1:-1,c.id%2===0?-1:1]){
        const alternative={x:c.x+nx*step*0.65-ny*0.17*sign,
          y:c.y+ny*step*0.65+nx*0.17*sign};
        if(alternative.x<=bounds.minX+0.12||alternative.x>=bounds.maxX-0.12||
          alternative.y<=bounds.minY+0.12||alternative.y>=bounds.maxY-0.12)continue;
        if(canTraverseLocalStep(s,{x:c.x,y:c.y},alternative)&&canTraverseLocalStep(s,origin,alternative)&&canCustomerOccupy(s,c,alternative)){
          c.x=alternative.x;c.y=alternative.y;break;
        }
      }
    }
    return false; // Caso contrário, aguardar o outro passar.
  }
  if(Math.hypot(c.target.x-c.x,c.target.y-c.y)<=0.005){
    if(!canTraverseLocalStep(s,c,c.target)||!canCustomerOccupy(s,c,c.target))return false;
    c.x=c.target.x;c.y=c.target.y;return true;
  }
  return false;
}
export function setTravel(s:GameState,c:Customer,destination:Point):boolean{
 const points=navigableRoute(s,{x:c.x,y:c.y},destination);
 if(!points?.length)return false;
 c.target=points[0]!;c.route=points.slice(1);
 return true;
}
export const EXIT_REACH_DISTANCE=.32;
export function moveRoute(s:GameState,c: Customer): boolean {
  // A temporary crowd detour can outlive the obstacle that caused it. Keep
  // departures from following a long stale loop after the aisle opens again.
  if(c.stage==="leaving"&&(c.route?.length??0)>3&&s.totalMinutes>=(c.nextCrowdRetryMinute??0)){
    c.nextCrowdRetryMinute=s.totalMinutes+4;
    const destination=c.route!.at(-1)!,path=crowdRoute(s,c,destination)??crowdRoute(s,c,destination,.25);
    const length=(points:Point[])=>points.reduce((sum,p,i)=>sum+Math.hypot(p.x-(i?points[i-1]!.x:c.x),p.y-(i?points[i-1]!.y:c.y)),0);
    if(path?.length&&length(path)+.5<length([c.target,...c.route!])){
      c.target=path[0]!;c.route=path.slice(1);
    }
  }
  const before=Math.hypot(c.x-c.target.x,c.y-c.target.y);
  if (!move(s,c)) {
    const after=Math.hypot(c.x-c.target.x,c.y-c.target.y);
    // Um desvio local pode ficar oscilando diante de uma fila compacta.
    // Replanejar até o destino final permite contornar também o waypoint ocupado.
    if(after>=before-.005)c.stalledMinutes=Math.min(120,(c.stalledMinutes??0)+1);
    else c.stalledMinutes=0;
    if(after>=before-.005&&s.totalMinutes>=(c.nextCrowdRetryMinute??0)){
      c.nextCrowdRetryMinute=s.totalMinutes+4;
      // Uma sessão de console sempre termina pela lateral da cadeira.
      // Replanejar diretamente até o assento poderia mandar o visitante
      // atravessar novamente a bancada/TV após encontrar outra pessoa.
      const seat=c.ps1StationIndex!==undefined&&c.stage==="to_pc"
        ?ps1Seat(s,c.ps1StationIndex,c.ps1SeatIndex??0):null;
      const side=c.ps1StationIndex!==undefined&&c.stage==="to_pc"
        ?ps1SeatApproach(s,c.ps1StationIndex,c.ps1SeatIndex??0):null;
      if(seat&&side&&!canTraverseLocalStep(s,side,seat))return false;
      const destination=seat&&side?side:(c.route?.at(-1)??c.target);
      // Narrow gaps between visitors may not contain a half-tile grid point.
      // Malha mais precisa depois de vários minutos sem avanço.
      const path=(c.stalledMinutes??0)>=5
        ?crowdRoute(s,c,destination,.25)??crowdRoute(s,c,destination)
        :crowdRoute(s,c,destination)??crowdRoute(s,c,destination,.25);
      if(path?.length){
        c.target=path[0]!;
        c.route=[...path.slice(1),...(seat&&side&&canTraverseLocalStep(s,side,seat)?[seat]:[])];
      }else if((c.stalledMinutes??0)>=8&&
        (c.stage==="arriving"||c.stage==="shopping"||c.stage==="leaving")&&
        !c.doorwayYielding&&
        s.customers.some(other=>other.id!==c.id&&Math.hypot(other.x-c.x,other.y-c.y)<1.2)){
        // Ceder passagem sem perder o destino reservado, o lugar da fila ou
        // o caminho do PS1: um desvio lateral apenas quando há corpo por perto.
        const original=c.target,tail=c.route??[];
        const relief=crowdSideStep(s,c,original);
        if(relief?.length){
          c.target=relief[0]!;
          c.route=[...relief.slice(1),original,...tail];
          c.stalledMinutes=0;
        }
      }
    }
    return false;
  }
  c.stalledMinutes=0;
  const next = c.route?.shift();
  if (next) { c.target = next; return false; }
  return true;
}
