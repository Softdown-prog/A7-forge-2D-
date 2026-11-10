import type {CharacterAppearance} from "./types.js";
import {hairSheen} from "./rigPrimitives.js";
import {femaleHairBehind,femaleTorso,femaleHairFront,femaleHairBack} from "./femaleRig.js";
export const appearance:CharacterAppearance={
 style:{shirt:"#B87998",dark:"#744968",highlight:"#E7B9CF",
    pants:"#394A69",hair:"#382A3B",skin:"#DB9D80",trim:"#F0D7B7"},
 drawBackHair(detail){
 const {ctx,style,headShift,lean,sideways}=detail;
femaleHairBehind(ctx,style,"female",headShift,lean,sideways);
 },
 drawBody(detail){
 const {ctx,style,headShift,back,sideways,quarter}=detail;
femaleTorso(ctx,style,headShift,sideways,back,"female",quarter);
 },
 drawHair(detail){
 const {ctx,style,headShift,lean,back,sideways,quarter}=detail;
if(!back){femaleHairFront(ctx,style,"female",headShift,lean,sideways||quarter);hairSheen(ctx,style.hair,lean,headShift,-79.5,8.6,4.4);}
 },
 drawBackHead(detail){
 const {ctx,style,headShift,lean}=detail;
femaleHairBack(ctx,style,"female",headShift,lean);hairSheen(ctx,style.hair,lean,headShift,-81,8.4,5.4);
 }
};
