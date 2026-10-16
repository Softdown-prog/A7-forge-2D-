/**
 * LHS printer 1998: Web Audio rendition of the approved, softened V2 recipe.
 * One 2.95s buffer per AudioContext: motor, moving head, rollers, paper.
 * No downloads, external samples, background loop or per-frame allocation.
 */
export const PRINTER_DURATION_SECONDS=2.95;
type Factory=Pick<AudioContext,"sampleRate"|"createBuffer">;
function gate(t:number,start:number,duration:number,fadeIn:number,fadeOut:number):number{
 const u=t-start;
 if(u<=0||u>=duration)return 0;
 return Math.sin(Math.PI/2*Math.max(0,Math.min(1,u/fadeIn,(duration-u)/fadeOut)))**2;
}
export function createPrinterBuffer(ctx:Factory):AudioBuffer{
 const rate=ctx.sampleRate,n=Math.round(rate*PRINTER_DURATION_SECONDS);
 const buffer=ctx.createBuffer(1,n,rate),out=buffer.getChannelData(0);
 const passes=[[.29,.42,1],[.89,.43,-1],[1.49,.41,1],[2.07,.29,-1]];
 const feeds=[.757,1.352,1.957];
 const ticks=[[.035,.115],[.70,.058],[1.31,.058],[1.89,.058],[2.35,.047],
  [.782,.048],[.855,.04],[1.377,.048],[1.45,.04],[1.982,.048],
  [2.055,.04],[2.51,.052],[2.69,.06]];
 const alpha=(hz:number)=>1-Math.exp(-2*Math.PI*hz/rate);
 let seed=19981016,low=0,mid=0,high=0,filtered=0,peak=0;
 for(let i=0;i<n;i++){
  const t=i/rate;
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  const white=2*seed/4294967296-1;
  low+=alpha(210)*(white-low);
  mid+=alpha(2100)*(white-mid);
  high+=alpha(4800)*(white-high);
  const scratch=(mid-low)*1.9,fine=(high-mid)*1.3;
  let s=0;
  const motor=gate(t,.09,2.62,.15,.23);
  if(motor){
   const phase=2*Math.PI*(87*t+3.8*t*t+.35*Math.sin(2*Math.PI*1.5*t));
   s+=motor*(.0125*(Math.sin(phase)+.18*Math.sin(phase*2)+.055*Math.sin(phase*3))
      +.006*scratch*(.75+.25*Math.sin(2*Math.PI*26*t)**2));
  }
  for(const [at,duration,direction] of passes){
   const e=gate(t,at,duration,.035,.060);
   if(!e)continue;
   const u=t-at,v=u/duration;
   const phase=2*Math.PI*(142*u+direction*(8.5*u*v-8.5*u)
      +3.5*Math.sin(2*Math.PI*3.2*u)/(2*Math.PI*3.2));
   const body=.62*Math.sin(phase)+.20*Math.sin(phase*2.01)+.065*Math.sin(phase*3.05);
   const steps=.42+.58*Math.max(0,Math.sin(2*Math.PI*67*u))**2;
   s+=e*(.041*body+.020*scratch*steps+.012*fine*steps);
   for(let k=0;k<3;k++){
    const tap=gate(t,at+.115+.073*k,.034,.009,.015);
    s+=.0085*fine*(.45+.55*Math.sin(2*Math.PI*104*u)**2)*tap;
   }
  }
  for(const at of feeds){
   const e=gate(t,at,.142,.022,.053);
   if(e)s+=.029*scratch*(.55+.45*Math.sin(2*Math.PI*29*(t-at))**2)*e;
  }
  const paper=gate(t,2.43,.36,.040,.082);
  if(paper){
   const u=t-2.43;
   s+=paper*(.036*scratch+.019*fine+.013*Math.sin(2*Math.PI*(92*u+13*u*u)));
  }
  for(const [at,amp] of ticks){
   const u=t-at;if(u<0||u>=.066)continue;
   s+=amp*(.58*Math.sin(2*Math.PI*540*u)+.25*Math.sin(2*Math.PI*1190*u))*
     Math.exp(-62*u)*gate(t,at,.066,.003,.035);
  }
  filtered+=alpha(4200)*(s-filtered);
  const fade=Math.max(0,Math.min(1,t/.02,(PRINTER_DURATION_SECONDS-t)/.065));
  out[i]=Math.tanh(filtered*2)/2*fade;
  peak=Math.max(peak,Math.abs(out[i]));
 }
 if(peak>0){const k=.422/peak;for(let i=0;i<n;i++)out[i]*=k;}
 return buffer;
}
