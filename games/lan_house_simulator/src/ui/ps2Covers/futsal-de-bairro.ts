/** PS2 Canvas illustration: futsal-de-bairro (original commands). */
import {circle,polygon,stroke} from "./primitives.js";

export function paintFutsalDeBairro(c:CanvasRenderingContext2D):void{
 circle(c,320,138,80,"#ffe09a");
 for(let i=0;i<10;i++){
  const x=i*44,top=185+(i%3)*25;
  c.fillStyle=i%2?"#1a5056":"#1a414f";c.fillRect(x,top,44,190);
  for(let j=0;j<4;j++){c.fillStyle="#ffdf9190";c.fillRect(x+12,top+12+j*29,9,11);}
 }
 polygon(c,[[0,341],[420,309],[420,468],[0,468]],"#237957");
 for(let i=0;i<5;i++)stroke(c,[[0,364+i*22],[420,333+i*22]],"#bffac088",3);
 stroke(c,[[32,250],[170,233],[180,363],[32,384],[32,250]],"#edf4dc",7);
 for(let i=0;i<6;i++)stroke(c,[[32+i*25,248-i*3],[32+i*25,380-i*3]],"#e1f6db66",2);
 circle(c,280,356,76,"#f6f1df");
 polygon(c,[[282,311],[314,334],[300,372],[262,372],[245,335]],"#182e45");
 for(let i=0;i<5;i++){
  const a=i*2*Math.PI/5;
  stroke(c,[[282+Math.cos(a)*30,356+Math.sin(a)*30],[282+Math.cos(a)*63,356+Math.sin(a)*63]],"#17283b",8);
 }
 stroke(c,[[196,339],[146,304],[117,291]],"#ebedbc",5);
}
