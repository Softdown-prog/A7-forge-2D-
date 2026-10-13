/** Lan House Simulator / CH Audio Lab: receita autoral de lata vendida.
 * Não usa arquivos de terceiros nem depende da duração do frame do jogo. */
function impact(ctx:AudioContext,at:number,hz:number,duration:number,volume:number,destination:AudioNode=ctx.destination):void{
  const osc=ctx.createOscillator(),gain=ctx.createGain();
  osc.type="triangle";osc.frequency.setValueAtTime(hz,at);
  osc.frequency.exponentialRampToValueAtTime(Math.max(80,hz*0.56),at+duration);
  gain.gain.setValueAtTime(0.0001,at);
  gain.gain.exponentialRampToValueAtTime(volume,at+0.003);
  gain.gain.exponentialRampToValueAtTime(0.0001,at+duration);
  osc.connect(gain).connect(destination);osc.start(at);osc.stop(at+duration+0.01);
}
function scrape(ctx:AudioContext,at:number,duration:number,volume:number,destination:AudioNode=ctx.destination):void{
  const sampleRate=ctx.sampleRate,length=Math.max(8,Math.floor(duration*sampleRate));
  const buffer=ctx.createBuffer(1,length,sampleRate),data=buffer.getChannelData(0);
  let seed=18351;
  for(let i=0;i<length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=((seed/4294967296)*2-1)*Math.exp(-5*i/length);}
  const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
  source.buffer=buffer;filter.type="bandpass";filter.frequency.value=1100;filter.Q.value=0.8;
  gain.gain.value=volume;source.connect(filter).connect(gain).connect(destination);source.start(at);
}
/** Servo curto, lata descendo, batendo na bandeja e rolando com quique em desaceleração. */
export function playVendingCan(ctx:AudioContext):void{
  const t=ctx.currentTime+0.02;
  // Mecanismo mecânico de liberação.
  impact(ctx,t,225,0.13,0.045);
  scrape(ctx,t+0.11,0.16,0.055);
  // A lata cai no metal, dá dois quiques e rola até parar.
  impact(ctx,t+0.34,710,0.17,0.16);
  impact(ctx,t+0.44,960,0.085,0.080);
  scrape(ctx,t+0.46,0.43,0.072);
  impact(ctx,t+0.61,830,0.065,0.060);
  impact(ctx,t+0.76,660,0.054,0.035);
  impact(ctx,t+0.87,550,0.048,0.021);
}
export function playCandyDispense(ctx:AudioContext,destination:AudioNode=ctx.destination):void{
  const t=ctx.currentTime+0.02;
  impact(ctx,t,275,0.09,0.045,destination);
  scrape(ctx,t+0.13,0.10,0.030,destination);
  impact(ctx,t+0.26,340,0.085,0.070,destination);
}
