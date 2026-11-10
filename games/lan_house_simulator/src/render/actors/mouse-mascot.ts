import type {CharacterAppearance} from "./types.js";
import {ell} from "./rigPrimitives.js";
export const appearance:CharacterAppearance={
 style:{shirt:"#949FB5",dark:"#5D6F88",highlight:"#CFD7DE",pants:"#556079",hair:"#8C97A8",skin:"#D1B8B0",trim:"#E9BC92"},
 drawHair(detail){
 const {ctx,headShift}=detail;
    ell(ctx,-12,-79+headShift,8,9,"#8E98A8","#56677A");
    ell(ctx,12,-79+headShift,8,9,"#8E98A8","#56677A");
    ell(ctx,-12,-79+headShift,4.7,5.2,"#D2AEB2");
    ell(ctx,12,-79+headShift,4.7,5.2,"#D2AEB2");
 },
 drawQuarterNose(detail){
 const {ctx,headShift,lean}=detail;
ell(ctx,8+lean,-63.2+headShift,2.8,2.5,"#B47B83");
 },
 drawSideNose(detail){
 const {ctx,headShift,lean}=detail;
ell(ctx,12.6+lean,-63.4+headShift,1.9,1.7,"#B47B83","#7E5560");
 },
 drawFrontNose(detail){
 const {ctx,headShift,lean}=detail;
ell(ctx,lean+.5,-63.3+headShift,3.0,2.7,"#B47B83");
 }
};
