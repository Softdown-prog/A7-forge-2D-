import type {ActorContext,ActorKind,ActorStyle} from "../actorArt.js";
import {ell,shape,segment} from "./rigPrimitives.js";
export const FEMALE_COSTUMES=["female","female-bob","female-ponytail"] as const;
type FemaleCostume=typeof FEMALE_COSTUMES[number];
export function isFemaleCostume(kind:ActorKind):kind is FemaleCostume{
 return kind==="female"||kind==="female-bob"||kind==="female-ponytail";
}
/** Three bespoke upper-body silhouettes: cardigan, tailored jacket and hoodie. */
export function femaleTorso(ctx:ActorContext,style:ActorStyle,shift:number,
 profile:boolean,back:boolean,kind:FemaleCostume,quarter=false):void{
 ctx.save();ctx.translate(0,shift);
 if(profile){
  // Three distinct garments seen from their narrow side, without two front lapels.
  const coat=kind==="female-bob"?style.dark:style.shirt;
  shape(ctx,[[-5,-54],[-11,-50],[-11,-37],[-8,-24],[7,-23],
    [12,-29],[11,-47],[5,-54]],coat);
  if(kind==="female"){
   shape(ctx,[[3,-51],[9,-48],[10,-31],[7,-24],[4,-25]],style.dark,style.dark);
   segment(ctx,-6,-27,7,-27,2.1,style.trim);
  }else if(kind==="female-bob"){
   shape(ctx,[[-3,-52],[5,-51],[7,-30],[1,-27],[-6,-29]],style.highlight,style.dark);
   segment(ctx,4,-48,6,-31,1.5,style.trim);
  }else{
   shape(ctx,[[-6,-53],[1,-57],[7,-53],[7,-45],[0,-42],[-7,-46]],style.dark,style.dark);
   shape(ctx,[[3,-37],[9,-37],[8,-28],[2,-27]],style.dark,style.dark);
   segment(ctx,-7,-25,8,-25,2.4,style.trim);
  }
  ctx.restore();return;
 }
 if(quarter){
  // Bespoke silhouettes stay identifiable in the diagonal camera views.
  shape(ctx,[[-7,-54],[-13,-51],[-15,-40],[-12,-27],[-8,-24],
    [10,-23],[14,-31],[13,-47],[6,-54]],kind==="female-bob"?style.dark:style.shirt);
  if(kind==="female"){
   shape(ctx,[[4,-52],[11,-48],[13,-31],[9,-24],[4,-27]],style.dark,style.dark);
   if(!back)shape(ctx,[[-5,-51],[-1,-44],[-3,-28],[-8,-29]],style.highlight,style.dark);
   segment(ctx,-7,-25,9,-25,1.7,style.trim);
  }else if(kind==="female-bob"){
   shape(ctx,[[-6,-51],[4,-52],[6,-30],[0,-26],[-8,-28]],style.highlight,style.dark);
   segment(ctx,5,-47,8,-29,1.7,style.trim);
  }else{
   shape(ctx,[[-7,-52],[-1,-56],[6,-52],[7,-46],[0,-42],[-7,-46]],style.dark,style.dark);
   shape(ctx,[[3,-37],[10,-36],[9,-27],[2,-27]],style.dark,style.dark);
   segment(ctx,-7,-25,9,-25,2.2,style.trim);
  }
  ctx.restore();return;
 }
 if(kind==="female"){
  // Long-haired character: soft blouse with layered cardigan and folded hem.
  shape(ctx,profile?[[-8,-52],[-13,-48],[-15,-37],[-10,-24],[11,-23],[15,-30],[14,-46],[7,-53]]:
   [[-9,-53],[-17,-50],[-18,-37],[-14,-24],[15,-24],[18,-39],[15,-50],[7,-53]],style.shirt);
  shape(ctx,[[8,-50],[14,-45],[12,-30],[8,-24],[3,-24],[7,-41]],style.dark,style.dark);
  if(!back){
   shape(ctx,[[-5,-52],[2,-45],[-1,-29],[-6,-26],[-8,-32]],style.highlight,style.dark);
   shape(ctx,[[7,-52],[2,-45],[1,-29],[5,-27],[9,-39]],style.dark,style.dark);
   segment(ctx,-13,-24,13,-24,2.6,style.trim);
   ell(ctx,0,-36,1.2,1.5,style.trim);
  }
 }else if(kind==="female-bob"){
  // Cropped teal jacket, contrasting inner shirt, seams and angular lapels.
  shape(ctx,profile?[[-9,-53],[-16,-46],[-14,-25],[12,-24],[17,-41],[9,-54]]:
   [[-10,-53],[-19,-46],[-16,-23],[16,-23],[18,-47],[10,-53]],style.dark);
  shape(ctx,[[-11,-49],[-5,-52],[4,-51],[10,-48],[9,-27],[-9,-27]],style.highlight,style.dark);
  if(!back){
   shape(ctx,[[-12,-52],[-2,-47],[-6,-39],[-3,-27],[-13,-27]],style.shirt,style.dark);
   shape(ctx,[[10,-52],[2,-47],[6,-39],[3,-27],[13,-27]],style.shirt,style.dark);
   segment(ctx,0,-47,0,-27,1.6,style.trim);
   ell(ctx,5,-32,1.7,1.7,style.trim);
  }else{
   segment(ctx,-11,-29,11,-29,2,style.shirt);
   segment(ctx,-9,-45,9,-45,1.1,style.highlight);
  }
 }else{
  // Orange sports hoodie, attached hood, drawstrings and kangaroo pocket.
  shape(ctx,profile?[[-8,-54],[-16,-48],[-16,-29],[-11,-23],[11,-23],[16,-30],[14,-48],[8,-55]]:
   [[-9,-54],[-20,-47],[-17,-28],[-12,-23],[12,-23],[18,-29],[19,-47],[8,-54]],style.shirt);
  shape(ctx,[[-8,-52],[0,-56],[8,-52],[7,-46],[0,-43],[-7,-46]],style.dark,style.dark);
  shape(ctx,[[8,-48],[15,-45],[14,-29],[8,-25],[5,-27],[9,-40]],style.dark,style.dark);
  if(!back){
   segment(ctx,-4,-46,-3,-35,1.3,style.trim);
   segment(ctx,4,-46,5,-35,1.3,style.trim);
   shape(ctx,[[-8,-35],[8,-35],[10,-27],[-10,-27]],style.dark,style.dark);
   segment(ctx,-7,-34,7,-34,1.2,style.highlight);
  }else{
   shape(ctx,[[-10,-51],[0,-55],[10,-51],[9,-43],[0,-40],[-9,-43]],style.dark,style.trim);
  }
  segment(ctx,-11,-24,11,-24,3,style.trim);
 }
 ctx.restore();
}
/** Individual rear-hair shapes, drawn behind neck and clothing. */
export function femaleHairBehind(ctx:ActorContext,style:ActorStyle,kind:FemaleCostume,
 shift:number,lean:number,sideways:boolean):void{
 ctx.save();ctx.translate(lean,shift);
 if(kind==="female"){
  shape(ctx,[[-12,-78],[-16,-70],[-18,-47],[-14,-39],
    [-6,-43],[6,-43],[13,-40],[18,-47],[16,-70],[10,-79]],style.hair,"#292839");
  segment(ctx,-13,-71,-14,-47,1.7,"#765468");
 }else if(kind==="female-bob"){
  shape(ctx,[[-12,-77],[-16,-70],[-18,-60],[-13,-55],[-6,-58],
    [6,-58],[14,-55],[18,-61],[15,-73],[9,-80]],style.hair,"#654534");
  ell(ctx,-12,-62,5.2,7,style.hair);
  ell(ctx,12,-62,5.2,7,style.hair);
 }else{
  // Raised ponytail, tied high and swinging gently with movement direction.
  const tailX=sideways?-15:-19;
  shape(ctx,[[9,-83],[17,-79],[23,-72],[24,-60],
    [20,-44],[13,-49],[15,-66],[7,-74]],style.hair,"#1C2535");
  ell(ctx,17,-77,4,4,"#D8B67F");
  segment(ctx,tailX+32,-62,tailX+36,-48,2,"#35465F");
 }
 ctx.restore();
}
/** Individual fringe shapes, not the generic short hairstyle tinted differently. */
export function femaleHairFront(ctx:ActorContext,style:ActorStyle,kind:FemaleCostume,
 shift:number,lean:number,sideways:boolean):void{
 ctx.save();ctx.translate(lean,shift);
 if(kind==="female"){
  ell(ctx,0,-79,14.4,7,style.hair);
  shape(ctx,[[-13,-79],[9,-83],[13,-76],[7,-72],[-7,-70],[-13,-72]],style.hair,style.hair);
  const sides=sideways?[-1]:[-1,1];
  for(const side of sides){
   shape(ctx,[[side*9,-76],[side*15,-71],[side*14,-56],
     [side*11,-49],[side*8,-58],[side*9,-68]],style.hair,style.hair);
  }
 }else if(kind==="female-bob"){
  // Rounded bob cap, blunt-cut side locks and swept bangs.
  ell(ctx,0,-79,14.8,8,style.hair);
  for(const side of (sideways?[-1]:[-1,1])){
   shape(ctx,[[side*8,-79],[side*15,-76],[side*16,-62],
     [side*17,-57],[side*9,-58],[side*10,-71]],style.hair,"#654534");
  }
  shape(ctx,[[-13,-80],[12,-82],[12,-74],[6,-72],[-4,-75],[-11,-71]],
   style.hair,style.hair);
  segment(ctx,-9,-79,5,-79,1.8,"#D99E65");
 }else{
  // Swept short fringe at the front, with a raised tie at the rear.
  ell(ctx,0,-79,13.8,6.9,style.hair);
  shape(ctx,[[-13,-78],[0,-84],[11,-79],[12,-74],[5,-70],
    [-3,-74],[-11,-71]],style.hair,style.hair);
  ell(ctx,11,-82,4.2,3.8,style.hair);
  segment(ctx,-8,-79,-2,-81,1.5,"#647188");
 }
 ctx.restore();
}
/** Back view must show whole hairstyle instead of the generic cropped skull. */
export function femaleHairBack(ctx:ActorContext,style:ActorStyle,kind:FemaleCostume,
 shift:number,lean:number):void{
 ctx.save();ctx.translate(lean,shift);
 if(kind==="female"){
  shape(ctx,[[-13,-75],[-15,-86],[-7,-90],[5,-90],[15,-83],[16,-68],
    [18,-43],[12,-40],[5,-44],[-5,-44],[-12,-40],[-18,-43],[-17,-67]],
    style.hair,"#27293A");
  segment(ctx,-8,-82,-11,-52,1.7,"#765468");
  segment(ctx,8,-84,11,-53,1.2,"#765468");
 }else if(kind==="female-bob"){
  shape(ctx,[[-14,-75],[-10,-87],[0,-90],[11,-86],[16,-73],
    [17,-58],[11,-55],[0,-59],[-10,-55],[-17,-59]],style.hair,"#654534");
  segment(ctx,-9,-81,-13,-63,1.6,"#D39D71");
  segment(ctx,8,-82,13,-63,1.4,"#D39D71");
 }else{
  ell(ctx,0,-76,14,14,style.hair,"#1C2535");
  shape(ctx,[[-12,-81],[-5,-89],[8,-89],[13,-82],[12,-72],
    [4,-68],[-9,-72]],style.hair,style.hair);
  // Ponytail hangs behind the shoulders (not a different-tinted short bob).
  shape(ctx,[[8,-79],[17,-78],[21,-63],[20,-47],[16,-38],
    [11,-44],[12,-66]],style.hair,"#1C2535");
  ell(ctx,13,-79,4,3.5,"#D8B67F");
  segment(ctx,18,-63,18,-48,2,"#56617A");
 }
 ctx.restore();
}

/** Profile walk: both legs advance along the facing axis, not away from the camera.
 * The raised trailing foot and the darker far leg give the stride depth. */
/** Nose bump that grows out of the face contour (open path: only the outer edge is inked). */
