import type {CharacterAppearance} from "./types.js";
import {hairSheen} from "./rigPrimitives.js";
import {femaleHairBehind,femaleTorso,femaleHairFront,femaleHairBack} from "./femaleRig.js";
export const appearance:CharacterAppearance={
 style:{shirt:"#D28A50",dark:"#915A45",highlight:"#F1BA79",
    pants:"#354866",hair:"#222C42",skin:"#BF866B",trim:"#E7C89A"},
 drawBackHair(detail){
 const {ctx,style,headShift,lean,sideways}=detail;
femaleHairBehind(ctx,style,"female-ponytail",headShift,lean,sideways);
 },
 drawBody(detail){
 const {ctx,style,headShift,back,sideways,quarter}=detail;
femaleTorso(ctx,style,headShift,sideways,back,"female-ponytail",quarter);
 },
 drawHair(detail){
 const {ctx,style,headShift,lean,back,sideways,quarter}=detail;
if(!back){femaleHairFront(ctx,style,"female-ponytail",headShift,lean,sideways||quarter);hairSheen(ctx,style.hair,lean,headShift,-79.5,8.6,4.4);}
 },
 drawBackHead(detail){
 const {ctx,style,headShift,lean}=detail;
femaleHairBack(ctx,style,"female-ponytail",headShift,lean);hairSheen(ctx,style.hair,lean,headShift,-81,8.4,5.4);
 }
};
