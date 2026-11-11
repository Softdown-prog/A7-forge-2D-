import type {ActorContext,ActorStyle} from "../../actorArt.js";
import {ell,edgeFor,segment,shape} from "./geometry.js";

/** Torso silhouettes and four regular-customer shirt variants. */
export function torso(ctx:ActorContext,style:ActorStyle,shift:number,profile:boolean,quarter=false):void{
 ctx.save();ctx.translate(0,shift);
 if(profile){
  // Truly turned shoulders/ribcage: narrow depth, no front-facing shirt placket.
  shape(ctx,[[-5,-53],[-10,-50],[-12,-43],[-10,-30],[-6,-24],
    [6,-23],[12,-28],[12,-40],[7,-52]],style.shirt);
  shape(ctx,[[3,-51],[9,-47],[11,-33],[7,-24],[3,-25],[5,-39]],
    style.dark,style.dark);
  ctx.save();ctx.globalAlpha=.48;
  shape(ctx,[[-6,-50],[-9,-43],[-8,-34],[-5,-27],[-3,-30],[-5,-40]],
    style.highlight,style.shirt);
  ctx.restore();
  ell(ctx,-1,-25,7,1.7,"rgba(23,32,43,.16)");
  ctx.restore();return;
 }
 if(quarter){
  // Narrow three-quarter shoulders, with a readable far shoulder and side panel.
  shape(ctx,[[-8,-53],[-14,-51],[-16,-42],[-13,-29],[-9,-24],
    [10,-23],[15,-30],[14,-46],[7,-53]],style.shirt);
  shape(ctx,[[3,-51],[10,-50],[14,-42],[13,-30],[9,-24],[4,-26],[7,-40]],style.dark,style.dark);
  ctx.save();ctx.globalAlpha=.48;
  shape(ctx,[[-9,-51],[-14,-43],[-12,-32],[-7,-25],[-4,-29],[-9,-41]],style.highlight,style.shirt);
  ctx.restore();ctx.restore();return;
 }
 // Curved shoulders, ribcage, belly and hips; front and back keep original art.
 ctx.beginPath();
 if(profile){
  ctx.moveTo(-8,-52);ctx.bezierCurveTo(-15,-50,-16,-42,-14,-33);
  ctx.bezierCurveTo(-14,-26,-10,-23,-5,-23);ctx.lineTo(10,-23);
  ctx.bezierCurveTo(17,-27,18,-33,16,-39);
  ctx.bezierCurveTo(15,-47,11,-52,5,-53);
 }else{
  ctx.moveTo(-8,-53);ctx.bezierCurveTo(-17,-52,-21,-46,-19,-40);
  ctx.bezierCurveTo(-17,-35,-18,-28,-13,-24);
  ctx.bezierCurveTo(-7,-20,9,-21,14,-24);
  ctx.bezierCurveTo(19,-29,17,-36,19,-42);
  ctx.bezierCurveTo(20,-49,13,-52,6,-53);
 }
 ctx.closePath();ctx.fillStyle=style.shirt;ctx.fill();
 ctx.strokeStyle=edgeFor(style.shirt);ctx.lineWidth=1.8;ctx.stroke();
 // Form light: bright upper-left chest falling to a shaded lower right, over the same silhouette.
 const form=ctx.createLinearGradient(-18,-53,16,-22);
 form.addColorStop(0,"rgba(255,244,214,.22)");form.addColorStop(.5,"rgba(255,244,214,0)");form.addColorStop(1,"rgba(14,22,40,.22)");
 ctx.fillStyle=form;ctx.fill();
 // Large curved planes keep their reading when the room camera zooms out.
 // These patches stay inside the contour, avoiding a per-actor Canvas clip.
 ctx.beginPath();ctx.moveTo(profile?8:9,-51);
 ctx.bezierCurveTo(15,-50,18,-46,17,-41);
 ctx.bezierCurveTo(15,-34,17,-29,10,-24);ctx.lineTo(7,-24);
 ctx.bezierCurveTo(profile?9:8,-31,profile?3:6,-43,profile?8:9,-51);ctx.closePath();
 ctx.fillStyle=style.dark;ctx.fill();
 ctx.beginPath();ctx.moveTo(-10,-51);ctx.bezierCurveTo(-18,-47,-15,-37,-12,-28);
 ctx.bezierCurveTo(-8,-25,-6,-29,-7,-34);
 ctx.bezierCurveTo(-10,-42,-5,-49,-3,-51);ctx.closePath();
 ctx.globalAlpha=.52;ctx.fillStyle=style.highlight;ctx.fill();ctx.globalAlpha=1;
 ell(ctx,-1,-25,11,2,"rgba(23,32,43,.16)");
 ell(ctx,-3,-47,11,2,"rgba(255,241,208,.17)");
 // Two soft folds where the fabric gathers at the belt.
 ctx.save();ctx.strokeStyle="rgba(18,28,48,.16)";ctx.lineWidth=1.1;ctx.lineCap="round";
 ctx.beginPath();ctx.moveTo(-7,-33);ctx.quadraticCurveTo(-5,-29,-6,-25);
 ctx.moveTo(3,-34);ctx.quadraticCurveTo(5,-30,4,-25);ctx.stroke();ctx.restore();
 ctx.restore();
}

export function casualChestExtras(ctx:ActorContext,style:ActorStyle,variant:number,shift:number,back:boolean,sideways:boolean,quarter:boolean):void{
  const reach=sideways?9:quarter?11:14;
  if(variant===1&&!back&&!sideways){
    // Chest pocket with a pen clip.
    const x=quarter?-9:-12;
    shape(ctx,[[x,-44+shift],[x+8,-44.4+shift],[x+7.6,-37.2+shift],[x+.4,-36.8+shift]],style.dark,edgeFor(style.dark));
    segment(ctx,x+.8,-43+shift,x+7,-43.3+shift,.8,style.highlight);
    segment(ctx,x+5.6,-46+shift,x+5.8,-41+shift,1.1,style.trim);
  }else if(variant===2){
    // Two stripes across the chest; they stop short of the contour so no clip is needed.
    ctx.save();ctx.globalAlpha=.8;
    segment(ctx,-reach,-43+shift,reach,-42.4+shift,2.2,style.trim);
    segment(ctx,-reach,-38.4+shift,reach,-37.8+shift,1.4,style.trim);
    ctx.restore();
  }else if(variant===3&&!back&&!sideways){
    // Hoodie drawstrings with small tips.
    for(const x of quarter?[-1,4]:[-4.5,3.2]){
      segment(ctx,x,-48+shift,x+(x<0?-.4:.4),-38.5+shift,1.1,style.highlight);
      ell(ctx,x+(x<0?-.4:.4),-37.6+shift,1.1,1.5,style.trim);
    }
  }else if(variant===3&&back){
    // Hood seam across the shoulders.
    ctx.save();ctx.globalAlpha=.6;ctx.strokeStyle=style.dark;ctx.lineWidth=1.3;ctx.lineCap="round";
    ctx.beginPath();ctx.moveTo(-10,-50+shift);ctx.quadraticCurveTo(0,-43+shift,10,-50+shift);ctx.stroke();ctx.restore();
  }
}
