import type {CharacterAppearance} from "./types.js";
import {ell} from "./rigPrimitives.js";
export const appearance:CharacterAppearance={
 style:{shirt:"#E2A541",dark:"#C96D58",highlight:"#F4D58B",pants:"#637AB0",hair:"#D34F60",skin:"#E8B08D",trim:"#89C6A1"},
 drawOutfit(detail){
 const {ctx,headShift}=detail;
    ell(ctx,-8,-40+headShift,3.5,3.5,"#E65A61");
    ell(ctx,8,-31+headShift,3.3,3.3,"#76C4B4");
 },
 drawHair(detail){
 const {ctx,style,headShift}=detail;
    for(const x of [-10,0,10])ell(ctx,x,-79+headShift,6.5,5.5,style.hair,"#AC4354");
    ell(ctx,0,-79+headShift,3.5,5,"#F6CF80");
 },
 drawQuarterNose(detail){
 const {ctx,headShift,lean}=detail;
ell(ctx,8+lean,-63.2+headShift,3.4,3.1,"#D64C5B");
 },
 drawSideNose(detail){
 const {ctx,headShift,lean}=detail;
ell(ctx,13+lean,-63+headShift,3.3,3.2,"#D64C5B","#A8394A");
 },
 drawFrontNose(detail){
 const {ctx,headShift,lean}=detail;
ell(ctx,lean+.5,-63.8+headShift,4.2,3.1,"#D64C5B");
 }
};
