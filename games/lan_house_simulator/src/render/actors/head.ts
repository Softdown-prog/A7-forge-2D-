import type {ActorContext,ActorRender} from "../actorArt.js";
import type {ActorDetail,CharacterAppearance} from "./types.js";
import {shadeHex,parseHex} from "../color.js";
import {isFemaleCostume} from "./femaleRig.js";
import {ell,eye,shape,segment,edgeFor,hairSheen,blush,noseBump,casualHairExtras} from "./rigPrimitives.js";
import {drawNeonHeadset} from "./headset.js";

/** Shared head paint pass; individual appearances retain control of hair, marks and accessories. */
export function drawActorHead(ctx:ActorContext,a:ActorRender,detail:ActorDetail,
  seated:number,consoleSeat:boolean,variant:number,appearance:CharacterAppearance):void{
 const {style,headShift,lean,back,sideways,quarter,pose}=detail;
  // Neck and chin cast a contact shadow onto the collar.
  ell(ctx,0,-52+headShift,8,3,"rgba(23,32,43,.24)");
  segment(ctx,-1,-53+headShift,0,-57+headShift,7.5,style.skin);
  if(!back&&!sideways){
    ell(ctx,-12+lean,-65+headShift,3,4.4,style.skin,"#785C59");
    if(!quarter)ell(ctx,12+lean,-65+headShift,3,4.4,style.skin,"#785C59");
  }
  {
    const rx=sideways?12.0:quarter?12.4:13.0,cy=-67+headShift;
    ctx.beginPath();ctx.ellipse(lean,cy,rx,12.3,0,0,Math.PI*2);
    if(back)ctx.fillStyle=style.hair;
    else{
      // Light from the upper left: a lit forehead and a cooler jaw give the head volume.
      const g=ctx.createRadialGradient(lean-4,cy-5,1.5,lean,cy,15);
      g.addColorStop(0,shadeHex(style.skin,1.11));g.addColorStop(.55,style.skin);g.addColorStop(1,shadeHex(style.skin,.88));
      ctx.fillStyle=g;
    }
    ctx.fill();ctx.strokeStyle="#6F5962";ctx.lineWidth=1.35;ctx.stroke();
  }
  if(!back){
    ell(ctx,lean+7,-66+headShift,4.7,9,"rgba(103,55,52,0.23)");
    ell(ctx,lean-6,-69+headShift,4.2,7,"rgba(255,244,216,0.25)");
    ell(ctx,lean,-57.4+headShift,5.0,1.45,"rgba(98,55,57,0.10)");
  }

  // Penteado/silhueta específica. Formas grandes, sem texturas micro-pixel.
 if(isFemaleCostume(a.kind)||appearance.drawHair){appearance.drawHair?.(detail);}
 else{
    ell(ctx,lean,-79+headShift,12.4,6.4,style.hair);
    shape(ctx,[[-12,-75+headShift],[-7,-79+headShift],[0,-77+headShift],
      [4,-75+headShift],[9,-78+headShift],[12,-74+headShift],
      [10,-70+headShift],[5,-74+headShift],[-5,-72+headShift],[-12,-70+headShift]],
      style.hair,style.hair);
    ctx.save();ctx.globalAlpha=.18;
    segment(ctx,-8,-78+headShift,-2,-79+headShift,1.5,style.highlight);
    ctx.restore();
    hairSheen(ctx,style.hair,lean,headShift);
    if(variant)casualHairExtras(ctx,style.hair,variant,lean,headShift,false,!sideways&&!quarter);
 appearance.drawHairAccent?.(detail);
 }

  if(back){
    // Nuca e cabelo cobrem a face. Ao usar PC, vemos as costas e não olhos na câmera.
    ctx.save();ctx.translate(lean,headShift);
    ctx.beginPath();ctx.moveTo(-12,-72);
    ctx.bezierCurveTo(-14,-82,12,-84,13,-73);
    ctx.bezierCurveTo(14,-66,9,-58,6,-57);ctx.quadraticCurveTo(0,-55,-7,-57);
    ctx.bezierCurveTo(-11,-61,-13,-66,-12,-72);ctx.closePath();
    // The nape outline follows the hair colour instead of the clothing's dark blue,
    // and the shaded side is lighter on pale hair so it never reads as a grey patch.
    ctx.fillStyle=style.hair;ctx.fill();ctx.strokeStyle=edgeFor(style.hair);ctx.lineWidth=1.35;ctx.stroke();ctx.clip();
    const [hr,hg,hb]=parseHex(style.hair),hairLuma=(hr*.2126+hg*.7152+hb*.0722)/255;
    ell(ctx,9,-66,6,13,"rgba(17,24,36,"+(.25-.15*hairLuma).toFixed(3)+")");
    ell(ctx,-6,-74,3.8,7,"rgba(255,241,208,.14)");
    if(a.kind!=="rabbit"&&a.kind!=="mouse-mascot"&&!isFemaleCostume(a.kind)){
      // Crown whorl and a few strands: the back of the head reads as hair, not a dark block.
      ctx.save();ctx.strokeStyle=shadeHex(style.hair,hairLuma>.5?.78:.62);ctx.globalAlpha=.55;ctx.lineWidth=.95;ctx.lineCap="round";
      ctx.beginPath();ctx.arc(1,-77,2.3,Math.PI*.15,Math.PI*1.75);
      ctx.moveTo(-9,-69);ctx.quadraticCurveTo(-6,-74,-4,-79);
      ctx.moveTo(8,-70);ctx.quadraticCurveTo(6,-75,3,-80);
      ctx.moveTo(-1,-60);ctx.quadraticCurveTo(-2,-65,-4,-69);ctx.stroke();ctx.restore();
    }
    ctx.restore();
    if(!quarter&&a.kind!=="rabbit"&&a.kind!=="mouse-mascot"&&a.kind!=="clown"&&!isFemaleCostume(a.kind)){
      // Ears peek out at both sides of the head.
      for(const sx of [-1,1])ell(ctx,sx*12.2+lean,-64.8+headShift,2.3,3.8,style.skin,"#785C59");
    }
    if(quarter){
      // A visible side ear/cheek distinguishes the diagonal rear from straight back.
      ell(ctx,11+lean,-64+headShift,2.8,4.6,style.skin,"#785C59");
      segment(ctx,12+lean,-65+headShift,12+lean,-62+headShift,.9,"#A66A64");
    }
 if(isFemaleCostume(a.kind))appearance.drawBackHead?.(detail);
    else if(a.kind!=="rabbit"&&a.kind!=="mouse-mascot")hairSheen(ctx,style.hair,lean,headShift,-74.5,8.2,7);
    if(a.kind==="rabbit" || a.kind==="mouse-mascot"){
      ell(ctx,0,-61+headShift,5,3,style.highlight);
    }
    // Costura e dobra nas costas: sem rosto aparecendo na vista do monitor.
    ctx.save();ctx.globalAlpha=.68;
    if(!isFemaleCostume(a.kind))segment(ctx,0,-48+headShift,0,-30+headShift,1.5,style.highlight);
    segment(ctx,-6,-32+headShift,-3,-27+headShift,1.1,style.dark);
    ctx.restore();
 appearance.drawBackFace?.(detail);
  } else if(quarter){
    // One recessed eye and a projecting cheek/nose make the 3/4 facing legible.
    blush(ctx,a.kind,[[9.2+lean,-61.8+headShift]]);
    // The far eye is foreshortened, not shrunk to a dot: it keeps its sclera and iris at a narrower width.
    eye(ctx,.2+lean,-68.2+headShift,1.2,1.95,a.kind,.25);
    eye(ctx,7.3+lean,-67.5+headShift,1.65,2.1,a.kind,.35);
    segment(ctx,-2.5+lean,-72+headShift,1.5+lean,-72.3+headShift,1,style.hair);
    segment(ctx,5+lean,-71.9+headShift,10+lean,-71.4+headShift,1,style.hair);
 if(appearance.drawQuarterNose)appearance.drawQuarterNose(detail);
 else noseBump(ctx,10.2+lean,-64.3+headShift,3.8,style.skin);
    ctx.beginPath();ctx.moveTo(3.4+lean,-58.2+headShift);ctx.quadraticCurveTo(6+lean,-57+headShift,8+lean,-58.3+headShift);
    ctx.lineWidth=1.1;ctx.lineCap="round";ctx.strokeStyle="#784F51";ctx.stroke();
 appearance.drawQuarterMarks?.(detail);
  } else if(sideways){
    // Perfil de verdade: orelha atrás do olho, um olho, nariz que nasce do contorno e boca dentro do queixo.
    ell(ctx,-6.4+lean,-65.2+headShift,2.5,4.4,style.skin,"#785C59");
    ctx.save();ctx.strokeStyle="rgba(120,76,72,.5)";ctx.lineWidth=.7;ctx.lineCap="round";
    ctx.beginPath();ctx.arc(-6.2+lean,-65.2+headShift,1.1,Math.PI*.6,Math.PI*1.65);ctx.stroke();ctx.restore();
    blush(ctx,a.kind,[[5.6+lean,-61.8+headShift]]);
    eye(ctx,5.4+lean,-67.6+headShift,1.7,2.1,a.kind,.55);
    ctx.save();ctx.globalAlpha=.72;segment(ctx,3.2+lean,-71.6+headShift,8.6+lean,-72.4+headShift,1,style.hair);ctx.restore();
 if(appearance.drawSideNose)appearance.drawSideNose(detail);
 else noseBump(ctx,11+lean,-64.6+headShift,4.4,style.skin);
    ctx.beginPath();ctx.moveTo(5+lean,-58.6+headShift);ctx.quadraticCurveTo(6.8+lean,-57.5+headShift,8.3+lean,-58.7+headShift);
    ctx.lineWidth=1.05;ctx.lineCap="round";ctx.strokeStyle=a.kind==="vampire"?"#9A546A":"#784F51";ctx.stroke();
    ell(ctx,5.4+lean,-55.9+headShift,3.2,1.2,"rgba(98,55,57,.13)");
 appearance.drawSideMarks?.(detail);
  } else {
  // Expressão legível; olhos não mudam entre quadros.
  blush(ctx,a.kind,[[-8.2+lean,-61.8+headShift],[8.8+lean,-61.8+headShift]]);
  // Olhos com esclera, íris e brilho fixos, e sobrancelhas sutis (sem piscar aleatório).
  eye(ctx,-4.3+lean,-66.8+headShift,1.65,2.0,a.kind);
  eye(ctx,5.2+lean,-66.8+headShift,1.65,2.0,a.kind);
  ctx.save();ctx.globalAlpha=.72;
  segment(ctx,-7+lean,-71.1+headShift,-2+lean,-71.8+headShift,1,style.hair);
  segment(ctx,3+lean,-71.8+headShift,8+lean,-71.1+headShift,1,style.hair);
  ctx.restore();
 if(appearance.drawFrontNose)appearance.drawFrontNose(detail);
 else ell(ctx,lean+.4,-63.4+headShift,1.8,1.9,"#A66A64");
  ctx.beginPath();
  ctx.moveTo(-2+lean,-59+headShift);
  ctx.quadraticCurveTo(1+lean,-57.2+headShift,4+lean,-59+headShift);
  ctx.lineWidth=1.15;ctx.strokeStyle=a.kind==="vampire"?"#9A546A":"#784F51";ctx.stroke();
 appearance.drawFrontMarks?.(detail);
  }
 appearance.drawHat?.(detail);
  if(a.premiumHeadset && a.kind!=="owner" && pose==="sitting" && seated>.97 && !consoleSeat){
    drawNeonHeadset(ctx,lean,-67+headShift,back,sideways,a.time);
  }
 appearance.drawFaceAccessory?.(detail);
}
