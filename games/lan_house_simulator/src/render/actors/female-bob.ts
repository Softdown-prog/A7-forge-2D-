import type {CharacterAppearance} from "./types.js";
import {hairSheen} from "./rigPrimitives.js";
import {femaleHairBehind,femaleTorso,femaleHairFront,femaleHairBack} from "./femaleRig.js";
export const appearance:CharacterAppearance={
 style:{shirt:"#4F9189",dark:"#285A62",highlight:"#9AD3C1",
    pants:"#4B536A",hair:"#9E6745",skin:"#EDB596",trim:"#F5D7A1"},
 drawBackHair(detail){
 const {ctx,style,headShift,lean,sideways}=detail;
femaleHairBehind(ctx,style,"female-bob",headShift,lean,sideways);
 },
 drawBody(detail){
 const {ctx,style,headShift,back,sideways,quarter}=detail;
femaleTorso(ctx,style,headShift,sideways,back,"female-bob",quarter);
 },
 drawHair(detail){
 const {ctx,style,headShift,lean,back,sideways,quarter}=detail;
if(!back){femaleHairFront(ctx,style,"female-bob",headShift,lean,sideways||quarter);hairSheen(ctx,style.hair,lean,headShift,-79.5,8.6,4.4);}
 },
 drawBackHead(detail){
 const {ctx,style,headShift,lean}=detail;
femaleHairBack(ctx,style,"female-bob",headShift,lean);hairSheen(ctx,style.hair,lean,headShift,-81,8.4,5.4);
 }
};
