import type {CharacterAppearance} from "./types.js";
import {ell,shape} from "./rigPrimitives.js";
export const appearance:CharacterAppearance={
 style:{shirt:"#604A78",dark:"#352C51",highlight:"#B88DAF",pants:"#282E4D",hair:"#252535",skin:"#E9B9B7",trim:"#B64E64"},
 drawBack(detail){
 const {ctx,headShift}=detail;
    shape(ctx,[[-14,-56+headShift],[13,-56+headShift],[24,-6],[-24,-5]],"#433451","#2C2840");
    shape(ctx,[[-12,-51+headShift],[11,-50+headShift],[17,-18],[-16,-15]],"#7E4A68","#4F3556");
 },
 drawOutfit(detail){
 const {ctx,headShift}=detail;
    shape(ctx,[[-8,-50+headShift],[1,-44+headShift],[9,-50+headShift],
      [3,-51+headShift],[0,-46+headShift],[-3,-51+headShift]],"#DDC8CC");
    ell(ctx,0,-41+headShift,3,3,"#BA5971");
 },
 drawHair(detail){
 const {ctx,headShift}=detail;
    shape(ctx,[[-13,-76+headShift],[-10,-82+headShift],[0,-79+headShift],
      [5,-83+headShift],[12,-75+headShift],[7,-73+headShift],
      [0,-76+headShift],[-8,-72+headShift]],"#292839","#222838");
 },
 drawQuarterMarks(detail){
 const {ctx,headShift}=detail;
shape(ctx,[[6,-59+headShift],[8,-55+headShift],[9,-59+headShift]],"#FFF1E8","#AC7077");
 },
 drawSideMarks(detail){
 const {ctx,headShift,lean}=detail;
shape(ctx,[[6.4+lean,-58.3+headShift],[7.2+lean,-55.6+headShift],[8+lean,-58.4+headShift]],"#FFF1E8","#AC7077");
 },
 drawFrontMarks(detail){
 const {ctx,headShift}=detail;
shape(ctx,[[-1,-58+headShift],[1,-55.5+headShift],[2,-59+headShift]],"#FFF1E8","#AC7077");
 }
};
