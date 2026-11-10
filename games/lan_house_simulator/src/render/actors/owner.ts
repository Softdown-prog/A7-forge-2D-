import type {CharacterAppearance} from "./types.js";
import {ell,shape,segment} from "./rigPrimitives.js";
export const appearance:CharacterAppearance={
 style:{shirt:"#428f79",dark:"#234f48",highlight:"#93c4a0",pants:"#344c54",hair:"#49342c",skin:"#E4AE86",trim:"#e5c18a"},
 drawOutfit(detail){
 const {ctx,style,headShift,back,time,cyber}=detail;
  if(!back&&!cyber){
    // Tailored service apron: curved bib, seam, folded pocket and terminal badge.
    segment(ctx,-6,-50+headShift,-7,-44+headShift,2.0,style.trim);
    segment(ctx,6,-50+headShift,7,-44+headShift,2.0,style.trim);
    ctx.beginPath();ctx.moveTo(-7,-46+headShift);ctx.quadraticCurveTo(0,-43+headShift,7,-46+headShift);
    ctx.lineTo(11,-22+headShift);ctx.quadraticCurveTo(0,-18+headShift,-11,-22+headShift);ctx.closePath();
    ctx.fillStyle="#244d47";ctx.fill();ctx.strokeStyle="#193d39";ctx.lineWidth=1.4;ctx.stroke();
    shape(ctx,[[3,-45+headShift],[7,-46+headShift],[11,-22+headShift],[6,-22+headShift]],"#1e423e","#1e423e");
    segment(ctx,-8,-43+headShift,-9,-24+headShift,.8,"#7caa91");
    shape(ctx,[[-6,-31+headShift],[6,-31+headShift],[5,-25+headShift],[-5,-25+headShift]],"#477665","#345d51");
    segment(ctx,-5,-30+headShift,5,-30+headShift,.8,"#99b798");
    ctx.fillStyle="#e8c88c";ctx.beginPath();ctx.roundRect(-3,-42+headShift,7,5,1);ctx.fill();
    ctx.fillStyle="#34584a";ctx.fillRect(-1,-41+headShift,3,2);ctx.fillRect(0,-38.5+headShift,1,1);
    segment(ctx,8,-33+headShift,9,-28+headShift,1.3,"#dbc999");
  } else if(!back && cyber){
    // Couraça dupla, cintura e circuitos desenhados na mesma silhueta do Tony.
    shape(ctx,[[-12,-48+headShift],[11,-48+headShift],[12,-24+headShift],[-12,-24+headShift]],"#192e49","#71889c");
    shape(ctx,[[-10,-45+headShift],[-1,-40+headShift],[-2,-29+headShift],[-9,-27+headShift]],"#395675","#244159");
    shape(ctx,[[10,-45+headShift],[1,-40+headShift],[2,-29+headShift],[9,-27+headShift]],"#304964","#244159");
    segment(ctx,-10,-43+headShift,-8,-29+headShift,1.8,"#65f2e2");
    segment(ctx,10,-43+headShift,8,-29+headShift,1.8,"#f4a2df");
    ctx.fillStyle=Math.sin(time*2)>.2?"#a4fff3":"#63bdbd";
    ctx.beginPath();ctx.roundRect(-4,-42+headShift,8,8,1.3);ctx.fill();
    shape(ctx,[[-3,-39+headShift],[0,-43+headShift],[3,-39+headShift],[0,-35+headShift]],"#1b3b52","#8bc6d2");
    segment(ctx,-12,-24+headShift,11,-24+headShift,3,"#1a263b");
    for(const x of [-7,0,7])ell(ctx,x,-28+headShift,1.15,1.15,"#ebd3ef");
}
 },
 drawAfterArms(detail){
 const {ctx,headShift,back,cyber}=detail;
if(cyber){
    // Ombreiras facetadas nas quatro orientações.
    for(const side of [-1,1]){
      shape(ctx,[[side*11,-49+headShift],[side*19,-46+headShift],
        [side*19,-40+headShift],[side*12,-39+headShift]],"#344a65","#162638");
      segment(ctx,side*13,-46+headShift,side*18,-43+headShift,1.4,
        side===1?"#ee96d5":"#70f0e3");
    }
    if(back){
      shape(ctx,[[-10,-46+headShift],[0,-42+headShift],[10,-46+headShift],
        [9,-29+headShift],[-9,-29+headShift]],"#19334e","#597c91");
      segment(ctx,-8,-37+headShift,8,-37+headShift,2,"#69e8e0");
      segment(ctx,-4,-32+headShift,4,-32+headShift,1.5,"#e99dda");
    }
}
 },
 drawHairAccent(detail){
 const {ctx,style,headShift}=detail;
      segment(ctx,-11,-73+headShift,-8,-63+headShift,2,style.hair);
      segment(ctx,-7,-80+headShift,3,-78+headShift,1.2,"#84694b");
 },
 drawBackFace(detail){
 const {ctx,style,headShift}=detail;
      segment(ctx,-9,-48+headShift,8,-29+headShift,1.8,style.trim);
      segment(ctx,9,-48+headShift,-8,-29+headShift,1.8,style.trim);
      segment(ctx,-11,-27+headShift,11,-27+headShift,2.0,"#315f50");
 },
 drawFaceAccessory(detail){
 const {ctx,style,headShift,lean,back,sideways,time,cyber}=detail;
  if(!back&&!cyber){
    // Thin warm frames distinguish the manager without changing head/foot anchors.
    ctx.strokeStyle="#524c3b";ctx.lineWidth=1.0;
    for(const x of (sideways?[4]:[-4.3,5.2])){ctx.beginPath();ctx.roundRect(x-3.4+lean,-70+headShift,6.8,6.0,1.6);ctx.stroke();}
    segment(ctx,sideways?7.5+lean:-.8+lean,-67.5+headShift,sideways?11+lean:1.9+lean,-67.4+headShift,.8,"#524c3b");
    ctx.save();ctx.globalAlpha=.17;
    ell(ctx,sideways?7+lean:1+lean,-58.6+headShift,sideways?3.2:5.4,2.0,style.hair);
    ctx.restore();
  }
  if(cyber){
    // Visor semiespelhado e headset translúcido não exigem sprites extras.
    if(!back){
      shape(ctx,sideways?
        [[2+lean,-73+headShift],[13+lean,-73+headShift],[14+lean,-66+headShift],[3+lean,-65+headShift]]:
        [[-13+lean,-73+headShift],[12+lean,-73+headShift],[13+lean,-66+headShift],[-12+lean,-66+headShift]],
        "#1d4964","#67b1c9");
      segment(ctx,sideways?5+lean:-9+lean,-69+headShift,
        sideways?12+lean:9+lean,-69+headShift,1.6,
        Math.sin(time*2.2)>.25?"#a2fff0":"#5cc7c9");
      segment(ctx,sideways?5+lean:-7+lean,-67+headShift,
        sideways?11+lean:8+lean,-67+headShift,1,"#afcde1");
      ell(ctx,sideways?11+lean:12+lean,-68+headShift,2.5,3.2,"#eea6dd");
    }else{
      segment(ctx,-10,-74+headShift,10,-74+headShift,2,"#6ee6de");
      ell(ctx,0,-77+headShift,2.5,1.6,"#f5b1e6");
    }
    if(!back){
      segment(ctx,sideways?11+lean:13+lean,-67+headShift,
        sideways?14+lean:16+lean,-61+headShift,1.3,"#87ede5");
      ell(ctx,sideways?14+lean:16+lean,-61+headShift,2,2,"#edaadd");
    }
  }
 }
};
