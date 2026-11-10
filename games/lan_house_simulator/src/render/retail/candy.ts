import {polygon} from "../isometric.js";
import {line,rounded} from "./primitives.js";

export const CANDY_COLORS=["#d7af74","#ac8291","#81a98b","#719aaf"] as const;
export function drawCandy(c:CanvasRenderingContext2D,x:number,y:number,color:string,index:number):void{
 if(index%3===0){
  polygon(c,[{x,y:y+6},{x:x+3,y:y+10},{x,y:y+15}],color);
  polygon(c,[{x:x+14,y:y+6},{x:x+11,y:y+10},{x:x+14,y:y+15}],color);
  rounded(c,x+2,y+5,10,12,3,color,"#527060");
 }else rounded(c,x+1,y+3,12,17,2,color,"#527060");
 rounded(c,x+3,y+8,8,7,1,"#eee5c4");
 c.fillStyle=index%2?"#735148":"#997441";c.fillRect(x+5,y+10,4,3);
 line(c,[{x:x+2,y:y+4},{x:x+11,y:y+4}],"#f1dca6",1);
}
