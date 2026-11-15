/** PS2 Canvas illustration: arena-dos-guardioes (original commands). */
import {circle,polygon,stroke} from "./primitives.js";

export function paintArenaDosGuardioes(c:CanvasRenderingContext2D):void{
 circle(c,315,152,83,"#e4b7ff");
 polygon(c,[[0,269],[72,228],[133,270],[214,203],[282,265],[359,208],[420,252],[420,454],[0,454]],"#34274b");
 for(let i=0;i<8;i++){
  const x=i*57;
  c.fillStyle=i%2?"#68d8d380":"#f9c78c88";c.fillRect(x,255+(i%3)*16,12,144);
 }
 polygon(c,[[0,388],[420,388],[420,463],[0,463]],"#262646");
 for(let i=0;i<8;i++)stroke(c,[[i*65,387],[210+(i*65-210)*2,464]],"#7ef0e980",3);
 // Two original armored guardians facing across the fighting ring.
 polygon(c,[[113,326],[148,274],[178,309],[194,383],[165,423],[92,411]],"#73e0d6");
 circle(c,145,262,25,"#d1f7f5");
 polygon(c,[[116,261],[130,231],[161,235],[175,263]],"#245c80");
 polygon(c,[[251,311],[287,264],[319,301],[341,405],[262,423],[232,378]],"#e58cbd");
 circle(c,287,252,25,"#ffe5c3");
 polygon(c,[[256,252],[279,218],[307,237],[322,260]],"#8a4593");
 stroke(c,[[181,330],[256,292]],"#ffdf99",12);
 stroke(c,[[191,324],[244,293]],"#ffffff",3);
}
