import type {CharacterAppearance} from "./types.js";
import {shape,segment} from "./rigPrimitives.js";
export const appearance:CharacterAppearance={
 style:{shirt:"#7A8D54",dark:"#46583D",highlight:"#B1C078",pants:"#4B5574",hair:"#353F3B",skin:"#9EC28D",trim:"#D6AD6A"},
 drawOutfit(detail){
 const {ctx,headShift}=detail;
    segment(ctx,-9,-44+headShift,8,-43+headShift,1.5,"#DBB882");
    for(const offset of [-5,2,7]) segment(ctx,offset,-46+headShift,offset+2,-41+headShift,1,"#43584A");
 },
 drawHair(detail){
 const {ctx,headShift}=detail;
    shape(ctx,[[-12,-74+headShift],[-11,-82+headShift],[10,-82+headShift],
      [12,-74+headShift],[6,-75+headShift],[-6,-73+headShift]],"#445549");
    segment(ctx,-10,-79+headShift,10,-78+headShift,1,"#B1BD98");
 },
 drawQuarterMarks(detail){
 const {ctx,headShift}=detail;
segment(ctx,-9,-68+headShift,-5,-65+headShift,.9,"#6B8071");
 },
 drawSideMarks(detail){
 const {ctx,headShift,lean}=detail;
for(const x of [-1,1.4,3.8])segment(ctx,x+lean,-70.5+headShift,x+1.4+lean,-68.4+headShift,.9,"#6B8071");
 },
 drawFrontMarks(detail){
 const {ctx,headShift}=detail;
for(const x of [-8,-6,-4])segment(ctx,x,-68+headShift,x+2,-66+headShift,.9,"#6B8071");
 }
};
