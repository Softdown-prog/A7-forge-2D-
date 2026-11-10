import type {CharacterAppearance} from "./types.js";
import {shape,segment} from "./rigPrimitives.js";
export const appearance:CharacterAppearance={
 style:{shirt:"#F4C949",dark:"#A87C22",highlight:"#FFEB91",
    pants:"#294F88",hair:"#31313A",skin:"#DAA17C",trim:"#FFE69C"},
 drawBack(detail){
 const {ctx,headShift}=detail;
    // Cross-body satchel behind the torso, actual side volume.
    shape(ctx,[[11,-43+headShift],[23,-41+headShift],[25,-15],[12,-15]],"#805A40","#41352F");
    shape(ctx,[[12,-30+headShift],[25,-29+headShift],[25,-25+headShift],[11,-26+headShift]],"#BC9363");
  }
 },
 drawOutfit(detail){
 const {ctx,headShift,back,pose}=detail;
    // Leather strap and side-bag remain attached while walking and handing off.
    segment(ctx,back?10:-11,-48+headShift,back?-9:17,-22+headShift,3.0,"#5E4430");
    segment(ctx,back?10:-11,-48+headShift,back?-9:17,-22+headShift,1.0,"#D3AA76");
    shape(ctx,[[11,-26+headShift],[25,-25+headShift],[24,-15+headShift],[12,-15+headShift]],"#956B47","#4A372C");
    segment(ctx,13,-24+headShift,22,-24+headShift,1.6,"#D5B078");
    if(pose==="delivering"){
      // The printed magazine stays in the postman's extended hand.
      shape(ctx,[[21,-46+headShift],[35,-49+headShift],[36,-32+headShift],[23,-30+headShift]],"#E8E9D9","#42645B");
      shape(ctx,[[23,-44+headShift],[34,-46+headShift],[34,-41+headShift],[23,-39+headShift]],"#3A7964","#42645B");
      segment(ctx,25,-36+headShift,32,-38+headShift,1.3,"#BACBB8");
    }
 },
 drawHat(detail){
 const {ctx,headShift,lean,sideways}=detail;
    // Blue cap with peak; generic Brazilian uniform, without any third-party logo.
    ctx.save();ctx.translate(lean,headShift);
    shape(ctx,[[-12,-77],[-11,-84],[-5,-89],[7,-89],[12,-83],[12,-77]],"#31598B","#192F50");
    shape(ctx,sideways?[[0,-77],[18,-77],[16,-74],[-2,-74]]:
      [[-14,-77],[15,-77],[17,-74],[-16,-74]],"#224A7C","#192F50");
    segment(ctx,-7,-83,6,-83,1.2,"#90B3D7");
    ctx.restore();
 }
};
