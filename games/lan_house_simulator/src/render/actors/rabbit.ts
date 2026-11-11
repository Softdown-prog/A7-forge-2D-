import type {CharacterAppearance} from "./types.js";
import {ell,shape,segment} from "./rigPrimitives.js";
export const appearance:CharacterAppearance={
 style:{shirt:"#E1C1C7",dark:"#BA959F",highlight:"#FFF2EE",pants:"#8C94B3",hair:"#F8ECE9",skin:"#F4E6DF",trim:"#E0A6AE"},
 drawBack(detail){
 const {ctx,style,headShift}=detail;
    ell(ctx,-10,-45+headShift,5,8,style.highlight);
 },
 drawHair(detail){
 const {ctx,headShift}=detail;
    shape(ctx,[[-9,-75+headShift],[-12,-98+headShift],[-6,-100+headShift],
      [-2,-78+headShift]],"#F1E7E7","#A998A9");
    shape(ctx,[[4,-77+headShift],[6,-102+headShift],[12,-102+headShift],
      [11,-76+headShift]],"#F1E7E7","#A998A9");
    segment(ctx,-8,-96+headShift,-5,-81+headShift,2,"#DFB4BD");
    segment(ctx,9,-98+headShift,8,-80+headShift,2,"#DFB4BD");
 },
 drawSideNose(detail){
 const {ctx,headShift,lean}=detail;
ell(ctx,12.6+lean,-63.4+headShift,1.9,1.7,"#D68C98","#7E5560");
 }
};
