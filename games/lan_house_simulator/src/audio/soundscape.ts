/**
 * Gerenciador único dos efeitos do Lan House Simulator.
 * Reaproveita as gravações aprovadas CH Audio Lab (UI e caixa), via Web Audio.
 * Teclado: receita procedural original; não toca em loop nem depende de frames.
 */
import { playCandyDispense } from "./vendingSfx.js";

export const AUDIO_LEVELS=Object.freeze({
  mouse:0.105,
  income:0.24,
  smallSale:0.15,
  keyboard:0.013,
  vending:0.45
});
export const KEYBOARD_DURATION=3.5;

/** Ritmo de digitação calmo, não perfeitamente mecânico (tempos em segundos). */
export function keyboardPattern():Array<{at:number;strength:number}>{
 return Array.from({length:22},(_,i)=>({
   at:0.055+i*0.156+([0,0.017,-0.018,0.010,0.026][i%5]??0),
   strength:0.60+((i*7)%9)/20
 }));
}
type ApprovedSample="mouse"|"income";
const SAMPLES:Record<ApprovedSample,string>={
 mouse:"./assets/audio/mouse_click_002.ogg",
 income:"./assets/audio/money_income_01.ogg"
};

export class Soundscape {
 private context:AudioContext|null=null;
 private master:GainNode|null=null;
 private effects:GainNode|null=null;
 private approved=new Map<ApprovedSample,AudioBuffer>();
 private requested=false;
 private keyboardNodes=new Set<AudioBufferSourceNode>();
 private keyboardNoise:AudioBuffer|null=null;
 private nextKeyboard=0;
 private lastIncome=-100;
 constructor(private enabled=true){}

 /** Pré-decodifica arquivos autorais sem tentar reproduzir áudio antes do gesto. */
 preload():void{if(this.enabled)this.ensureContext();}
 /** Acionado por gesto de usuário: respeita o bloqueio de autoplay do navegador. */
 unlock():void{
   if(!this.enabled)return;
   const ctx=this.ensureContext();
   if(!ctx)return;
   if(ctx.state==="suspended")void ctx.resume().catch(()=>{});
 }
 setEnabled(enabled:boolean):void{
   this.enabled=enabled;
   if(this.master)this.master.gain.value=enabled?0.82:0;
   if(!enabled)this.stopKeyboard();
 }
 private ensureContext():AudioContext|null{
   if(this.context&&this.context.state!=="closed")return this.context;
   try{
     const ctx=new AudioContext();
     const master=ctx.createGain(),effects=ctx.createGain();
     master.gain.value=this.enabled?0.82:0;
     effects.gain.value=AUDIO_LEVELS.vending;
     effects.connect(master);master.connect(ctx.destination);
     this.context=ctx;this.master=master;this.effects=effects;
     this.requested=false;this.loadApprovedSamples(ctx);
     return ctx;
   }catch{return null;}
 }
 private loadApprovedSamples(ctx:AudioContext):void{
   if(this.requested)return;
   this.requested=true;
   for(const [kind,url] of Object.entries(SAMPLES) as Array<[ApprovedSample,string]>){
     void fetch(url).then(response=>{
       if(!response.ok)throw Error("SFX "+kind+": "+response.status);
       return response.arrayBuffer();
     }).then(bytes=>ctx.decodeAudioData(bytes))
       .then(buffer=>{if(this.context===ctx)this.approved.set(kind,buffer);})
       .catch(()=>{/* Mesmo offline há fallback procedural curto. */});
   }
 }
 private playSample(kind:ApprovedSample,gainValue:number,shorten?:number):boolean{
   const ctx=this.context,master=this.master,buffer=this.approved.get(kind);
   if(!ctx||!master||!buffer)return false;
   const now=ctx.currentTime+0.006;
   const node=ctx.createBufferSource(),gain=ctx.createGain();
   node.buffer=buffer;
   const seconds=Math.min(buffer.duration,shorten??buffer.duration);
   gain.gain.setValueAtTime(gainValue,now);
   gain.gain.setValueAtTime(gainValue,now+Math.max(0,seconds-0.024));
   gain.gain.exponentialRampToValueAtTime(0.0001,now+seconds);
   node.connect(gain).connect(master);node.start(now);node.stop(now+seconds+0.005);
   return true;
 }
 private tone(at:number,hz:number,length:number,volume:number):void{
   const ctx=this.context,master=this.master;
   if(!ctx||!master)return;
   const oscillator=ctx.createOscillator(),gain=ctx.createGain();
   oscillator.type="triangle";
   oscillator.frequency.setValueAtTime(hz,at);
   oscillator.frequency.exponentialRampToValueAtTime(hz*0.78,at+length);
   gain.gain.setValueAtTime(volume,at);
   gain.gain.exponentialRampToValueAtTime(0.0001,at+length);
   oscillator.connect(gain).connect(master);
   oscillator.start(at);oscillator.stop(at+length+0.006);
 }
 /** Um único clique por interação, com volume baixo. */
 click():void{
   if(!this.enabled)return;
   this.unlock();
   const ctx=this.context;if(!ctx)return;
   if(!this.playSample("mouse",AUDIO_LEVELS.mouse,0.20)){
     this.tone(ctx.currentTime+0.008,390,0.040,0.022);
     this.tone(ctx.currentTime+0.016,230,0.024,0.011);
   }
 }
 /** O som de dinheiro é distinto e mais presente do que o clique UI. */
 income(kind:"payment"|"sale"="payment"):void{
   if(!this.enabled)return;
   const ctx=this.context??this.ensureContext();
   if(!ctx||ctx.state!=="running")return;
   if(ctx.currentTime-this.lastIncome<0.11)return; // Evita somar picos na mesma atualização.
   this.lastIncome=ctx.currentTime;
   const volume=kind==="payment"?AUDIO_LEVELS.income:AUDIO_LEVELS.smallSale;
   if(!this.playSample("income",volume,0.85)){
     const t=ctx.currentTime+0.01;
     this.tone(t,740,0.12,volume*0.21);
     this.tone(t+0.083,980,0.17,volume*0.17);
   }
 }
 /** Sons de produtos autorizados: nunca tocar o efeito de lata reprovado. */
 candy():void{
   const ctx=this.context;
   if(!this.enabled||!ctx||ctx.state!=="running"||!this.effects)return;
   playCandyDispense(ctx,this.effects);
 }
 /** Ruído de teclas bem filtrado e baixo; dura 3,5 segundos após iniciar a sessão. */
 keyboard():void{
   const ctx=this.context,master=this.master;
   if(!this.enabled||!ctx||!master||ctx.state!=="running")return;
   if(ctx.currentTime<this.nextKeyboard)return;
   this.nextKeyboard=ctx.currentTime+KEYBOARD_DURATION;
   if(!this.keyboardNoise){
     const length=Math.floor(ctx.sampleRate*0.050);
     const buffer=ctx.createBuffer(1,length,ctx.sampleRate);
     const data=buffer.getChannelData(0);
     let seed=49021;
     for(let i=0;i<length;i++){
       seed=(Math.imul(seed,1664525)+1013904223)>>>0;
       data[i]=(seed/4294967296*2-1)*Math.exp(-10*i/length);
     }
     this.keyboardNoise=buffer;
   }
   const start=ctx.currentTime+0.035;
   for(const tap of keyboardPattern()){
     const at=start+tap.at;
     const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
     source.buffer=this.keyboardNoise;
     filter.type="lowpass";filter.frequency.value=1600+(tap.strength*400);
     gain.gain.setValueAtTime(AUDIO_LEVELS.keyboard*tap.strength,at);
     gain.gain.exponentialRampToValueAtTime(0.0001,at+0.048);
     source.connect(filter).connect(gain).connect(master);
     this.keyboardNodes.add(source);
     source.onended=()=>{this.keyboardNodes.delete(source);};
     source.start(at);source.stop(at+0.050);
   }
 }
 stopKeyboard():void{
   for(const source of this.keyboardNodes){try{source.stop();}catch{/* Fonte já encerrada. */}}
   this.keyboardNodes.clear();
   if(this.context)this.nextKeyboard=this.context.currentTime;
 }
}
