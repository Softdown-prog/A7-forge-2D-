/** Small colour helpers shared by the procedural painters. Pure functions. */
const clamp255=(v:number)=>Math.max(0,Math.min(255,Math.round(v)));
export function parseHex(hex:string):[number,number,number]{
 const raw=hex.replace("#","");
 const full=raw.length===3?raw.split("").map(c=>c+c).join(""):raw;
 const value=Number.parseInt(full.slice(0,6),16);
 if(!Number.isFinite(value))return [0,0,0];
 return [(value>>16)&255,(value>>8)&255,value&255];
}
export function toHex(r:number,g:number,b:number):string{
 return "#"+[r,g,b].map(c=>clamp255(c).toString(16).padStart(2,"0")).join("");
}
/** Blend `hex` toward a grey level (0 black … 255 white) by `ratio` (0..1). */
export function mixHex(hex:string,to:number,ratio:number):string{
 const [r,g,b]=parseHex(hex),t=Math.max(0,Math.min(1,ratio));
 return toHex(r*(1-t)+to*t,g*(1-t)+to*t,b*(1-t)+to*t);
}
/** Blend two colours in sRGB; `t` 0 gives `a`, 1 gives `b`. */
export function lerpHex(a:string,b:string,t:number):string{
 const [r1,g1,b1]=parseHex(a),[r2,g2,b2]=parseHex(b),k=Math.max(0,Math.min(1,t));
 return toHex(r1+(r2-r1)*k,g1+(g2-g1)*k,b1+(b2-b1)*k);
}
/** `rgba()` string for a hex colour with the given alpha. */
export function withAlpha(hex:string,alpha:number):string{
 const [r,g,b]=parseHex(hex);
 return "rgba("+r+","+g+","+b+","+Math.max(0,Math.min(1,alpha)).toFixed(3)+")";
}
/** Multiply lightness: factor 1 keeps the colour, <1 darkens, >1 brightens toward white. */
export function shadeHex(hex:string,factor:number):string{
 if(factor>=1)return mixHex(hex,255,Math.min(1,factor-1));
 return mixHex(hex,0,Math.min(1,1-factor));
}
/** Deterministic 0..1 hash for a grid cell; identical on every frame and machine. */
export function cellNoise(x:number,y:number,salt=0):number{
 let h=Math.imul((x|0)+374761393,668265263)^Math.imul((y|0)+1274126177,2246822519)^Math.imul(salt+97,3266489917);
 h=Math.imul(h^(h>>>15),2246822519);h=Math.imul(h^(h>>>13),3266489917);
 return ((h^(h>>>16))>>>0)/4294967296;
}
