/** PS2 Canvas illustration: cidade-em-fuga (original commands). */
import {circle,polygon,stroke} from "./primitives.js";

export function paintCidadeEmFuga(c:CanvasRenderingContext2D):void{
 circle(c,318,148,82,"#ffad85");
 // Skyscrapers, headlights and a high-speed getaway on wet asphalt.
 for(let i=0;i<11;i++){
  const x=i*43,top=150+(i*29)%112;
  c.fillStyle=i%2?"#102b48":"#194365";c.fillRect(x,top,42,295-top);
  for(let j=0;j<4;j++){c.fillStyle="#ffdf9f8a";c.fillRect(x+8,top+13+j*30,10,9);}
 }
 polygon(c,[[163,291],[264,291],[434,462],[-25,462]],"#1b2d48");
 stroke(c,[[160,292],[-20,458]],"#63c6da",8);
 stroke(c,[[264,292],[429,457]],"#68d7dc",8);
 for(let i=0;i<6;i++)stroke(c,[[208,310+i*24],[217,314+i*27]],"#fbe5ba",3+i);
 polygon(c,[[92,361],[133,329],[288,329],[335,363],[353,411],[66,411]],"#ed685e");
 polygon(c,[[143,339],[173,300],[257,300],[294,339]],"#a9e7e5");
 polygon(c,[[84,370],[147,370],[145,393],[78,393]],"#ffecb1");
 polygon(c,[[280,370],[339,370],[346,393],[275,393]],"#ffecb1");
 for(const x of [109,316])circle(c,x,410,25,"#112239");
}
