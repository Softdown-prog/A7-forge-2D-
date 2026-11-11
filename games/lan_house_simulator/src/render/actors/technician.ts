import type {CharacterAppearance} from "./types.js";
import {ell,shape,segment} from "./rigPrimitives.js";
export const appearance:CharacterAppearance={
 style:{shirt:"#41876E",dark:"#245D57",highlight:"#92BE96",pants:"#344D60",hair:"#4B342D",skin:"#DFAC85",trim:"#E6C67D"},
 drawHat(detail){
 const {ctx,headShift,lean,sideways}=detail;
    const shell="#E8BF47";
    const shade="#B17E32",rim="#FFF1A4";
    ctx.save();ctx.translate(lean,headShift);
    // Casco arredondado, sombreado e assentado sobre a cabeça; sem flutuar.
    ctx.beginPath();
    ctx.moveTo(-12,-76);ctx.bezierCurveTo(-14,-87,-8,-91,0,-91);
    ctx.bezierCurveTo(10,-91,15,-86,12,-76);
    ctx.closePath();ctx.fillStyle=shell;ctx.strokeStyle="#5B503B";
    ctx.lineWidth=1.7;ctx.fill();ctx.stroke();
    shape(ctx,[[6,-88],[11,-84],[13,-77],[5,-76]],shade,"#896A3F");
    ctx.save();ctx.globalAlpha=.7;
    ell(ctx,-5,-86,4.3,1.7,rim);ctx.restore();
    // Aba segue a orientação; perfil destaca a pequena projeção frontal.
    const brim=sideways?[[0,-77],[17,-77],[16,-72],[-2,-73]]:
      [[-16,-77],[16,-77],[17,-73],[-17,-73]];
    shape(ctx,brim as [number,number][],shell,"#6B5A38");
    segment(ctx,-11,-74,11,-74,1.1,rim);
    ctx.restore();
 }
};
