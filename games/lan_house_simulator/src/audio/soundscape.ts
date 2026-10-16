/**
 * Gerenciador único dos efeitos do Lan House Simulator.
 * Reaproveita as gravações aprovadas CH Audio Lab (UI e caixa), via Web Audio.
 * Teclado: três gravações autorais tratadas alternadas, com fallback procedural.
 * Uma única frase por início de sessão, sem loop ou sons por frame.
 */
import { playCandyDispense } from "./vendingSfx.js";
import {createPrinterBuffer} from "./printerSfx.js";

export const AUDIO_LEVELS=Object.freeze({
  mouse:0.105,
  income:0.24,
  smallSale:0.15,
  keyboard:0.040, // fundo discreto; continua abaixo de mouse (0.105) e caixa (0.24).
  vending:0.45,
  soda:0.085, // Mais audível (+8,5 dB), mas ainda abaixo de mouse e caixa.
  printer:0.058 // Impressora discreta, entre teclado e refrigerante.
});
export const KEYBOARD_DURATION=3.5;

/** Ritmo de digitação calmo, não perfeitamente mecânico (tempos em segundos). */
export function keyboardPattern():Array<{at:number;strength:number}>{
 return Array.from({length:22},(_,i)=>({
   at:0.055+i*0.156+([0,0.017,-0.018,0.010,0.026][i%5]??0),
   strength:0.60+((i*7)%9)/20
 }));
}
/** Os três trechos aprovados são independentes, para uma sequência A/B/C sem repetição imediata. */
export const KEYBOARD_TAKES=["keyboard_te1","keyboard_t2","keyboard_t3"] as const;
export type KeyboardTake=(typeof KEYBOARD_TAKES)[number];
export function keyboardTakeAt(index:number):KeyboardTake {
 const length=KEYBOARD_TAKES.length;
 return KEYBOARD_TAKES[((Math.trunc(index)%length)+length)%length]!;
}
export const SODA_CHANCE=0.28;
export const SODA_COOLDOWN_SECONDS=12;
/** O caixa dura até 0,85 segundo; começar o líquido depois reduz mascaramento. */
export const SODA_AFTER_SALE_DELAY_SECONDS=0.90;
export function shouldPlaySodaSound(roll:number,elapsed:number):boolean {
 return roll<SODA_CHANCE && elapsed>=SODA_COOLDOWN_SECONDS;
}
export const PRINTER_CHANCE=0.35;
export const PRINTER_COOLDOWN_SECONDS=14;
export const PRINTER_AFTER_PAYMENT_DELAY_SECONDS=0.90;
export function shouldPlayPrinterSound(roll:number,elapsed:number):boolean{
 return roll<PRINTER_CHANCE&&elapsed>=PRINTER_COOLDOWN_SECONDS;
}
type SodaTake="vending_soda_01"|"vending_soda_02";
type ApprovedSample="mouse"|"income"|KeyboardTake|SodaTake;
const SAMPLES:Record<ApprovedSample,string>={
 mouse:"./assets/audio/mouse_click_002.ogg",
 income:"./assets/audio/money_income_01.ogg",
 keyboard_te1:"./assets/audio/keyboard_te1.ogg",
 keyboard_t2:"./assets/audio/keyboard_t2.ogg",
 keyboard_t3:"./assets/audio/keyboard_t3.ogg",
 vending_soda_01:"./assets/audio/vending_soda_01.ogg",
 vending_soda_02:"./assets/audio/vending_soda_02.ogg"
};

export class Soundscape {
 private context:AudioContext|null=null;
 private master:GainNode|null=null;
 private effects:GainNode|null=null;
 private keyboardBus:GainNode|null=null;
 private approved=new Map<ApprovedSample,AudioBuffer>();
 private requested=false;
 private keyboardNodes=new Set<AudioBufferSourceNode>();
 private keyboardNoise:AudioBuffer|null=null;
 private nextKeyboard=0;
 private nextKeyboardTake=0;
 private lastIncome=-100;
 private lastSoda=-100;
 private lastPrinter=-100;
 private printerBuffer:AudioBuffer|null=null;
 private sodaTake=0;
 private readonly sodaRandom:()=>number;
 private readonly printerRandom:()=>number;

 constructor(private enabled=true,random:()=>number=Math.random,printerRandom:()=>number=Math.random){
  this.sodaRandom=random;this.printerRandom=printerRandom;
 }

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
     const master=ctx.createGain(),effects=ctx.createGain(),keyboardBus=ctx.createGain();
     master.gain.value=this.enabled?0.82:0;
     effects.gain.value=AUDIO_LEVELS.vending;
     keyboardBus.gain.value=AUDIO_LEVELS.keyboard;
     effects.connect(master);keyboardBus.connect(master);master.connect(ctx.destination);
     this.context=ctx;this.master=master;this.effects=effects;this.keyboardBus=keyboardBus;
     this.printerBuffer=null;this.lastPrinter=-100;
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
 private playSample(kind:ApprovedSample,gainValue:number,shorten?:number,delaySeconds=0):boolean{
   const ctx=this.context,master=this.master,buffer=this.approved.get(kind);
   if(!ctx||!master||!buffer)return false;
   const now=ctx.currentTime+0.006+Math.max(0,delaySeconds);
   const node=ctx.createBufferSource(),gain=ctx.createGain();
   node.buffer=buffer;
   const seconds=Math.min(buffer.duration,shorten??buffer.duration);
   gain.gain.setValueAtTime(gainValue,now);
   gain.gain.setValueAtTime(gainValue,now+Math.max(0,seconds-0.024));
   gain.gain.exponentialRampToValueAtTime(0.0001,now+seconds);
   node.connect(gain).connect(master);node.start(now);node.stop(now+seconds+0.005);
   return true;
 }
 /** Abafa discretamente a digitação quando há clique ou pagamento: mix de Tycoon. */
 private duckKeyboard(factor:number,duration:number):void{
   const ctx=this.context,bus=this.keyboardBus;
   if(!ctx||!bus)return;
   const at=ctx.currentTime,gain=bus.gain;
   gain.cancelScheduledValues(at);
   gain.setValueAtTime(gain.value,at);
   gain.linearRampToValueAtTime(AUDIO_LEVELS.keyboard*factor,at+0.018);
   gain.setValueAtTime(AUDIO_LEVELS.keyboard*factor,at+duration);
   gain.linearRampToValueAtTime(AUDIO_LEVELS.keyboard,at+duration+0.15);
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
   this.duckKeyboard(0.75,0.09);
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
   this.duckKeyboard(0.44,0.33);
   const volume=kind==="payment"?AUDIO_LEVELS.income:AUDIO_LEVELS.smallSale;
   if(!this.playSample("income",volume,0.85)){
     const t=ctx.currentTime+0.01;
     this.tone(t,740,0.12,volume*0.21);
     this.tone(t+0.083,980,0.17,volume*0.17);
   }
 }
 /** Chance pequena por venda confirmada, com intervalo mínimo para não dominar a mixagem. */
 soda():boolean{
   const ctx=this.context,master=this.master;
   if(!this.enabled||!ctx||!master||ctx.state!=="running")return false;
   if(!shouldPlaySodaSound(this.sodaRandom(),ctx.currentTime-this.lastSoda))return false;
   const kind:SodaTake=this.sodaTake%2===0?"vending_soda_01":"vending_soda_02";
   const alternative:SodaTake=kind==="vending_soda_01"?"vending_soda_02":"vending_soda_01";
   const selected=this.approved.has(kind)?kind:alternative;
   if(!this.approved.has(selected))return false;
   if(!this.playSample(selected,AUDIO_LEVELS.soda,2.0,SODA_AFTER_SALE_DELAY_SECONDS))return false;
   this.lastSoda=ctx.currentTime;
   this.sodaTake++;
   return true;
 }
 /** Impressora: 35% por serviço pago, nunca por frame ou por página. */
 printer():boolean{
  const ctx=this.context,master=this.master;
  if(!this.enabled||!ctx||!master||ctx.state!=="running")return false;
  if(!shouldPlayPrinterSound(this.printerRandom(),ctx.currentTime-this.lastPrinter))return false;
  try{
   if(!this.printerBuffer)this.printerBuffer=createPrinterBuffer(ctx);
   const buffer=this.printerBuffer,at=ctx.currentTime+0.006+PRINTER_AFTER_PAYMENT_DELAY_SECONDS;
   const source=ctx.createBufferSource(),gain=ctx.createGain();
   source.buffer=buffer;
   gain.gain.setValueAtTime(0.0001,at);
   gain.gain.linearRampToValueAtTime(AUDIO_LEVELS.printer,at+0.030);
   gain.gain.setValueAtTime(AUDIO_LEVELS.printer,at+Math.max(.031,buffer.duration-.100));
   gain.gain.linearRampToValueAtTime(0.0001,at+buffer.duration);
   source.connect(gain).connect(master);
   source.start(at);source.stop(at+buffer.duration+0.005);
   this.lastPrinter=ctx.currentTime;
   return true;
  }catch{return false;}
 }
 /** Sons de produtos autorizados: nunca tocar o efeito de lata reprovado. */
 candy():void{
   const ctx=this.context;
   if(!this.enabled||!ctx||ctx.state!=="running"||!this.effects)return;
   playCandyDispense(ctx,this.effects);
 }
 /** Toca um trecho real diferente a cada sessão; fallback procedural quando indisponível. */
 keyboard():void{
   const ctx=this.context,bus=this.keyboardBus;
   if(!this.enabled||!ctx||!bus||ctx.state!=="running")return;
   if(ctx.currentTime<this.nextKeyboard)return;
   this.nextKeyboard=ctx.currentTime+KEYBOARD_DURATION;
   // Preferir A/B/C ordenado; se um arquivo falhar, usar o próximo carregado.
   for(let attempt=0;attempt<KEYBOARD_TAKES.length;attempt++){
     const kind=keyboardTakeAt(this.nextKeyboardTake++);
     const buffer=this.approved.get(kind);
     if(!buffer)continue;
     const at=ctx.currentTime+0.035;
     const seconds=Math.min(KEYBOARD_DURATION-0.10,buffer.duration);
     if(seconds<=0.05)continue;
     const source=ctx.createBufferSource(),volume=ctx.createGain();
     source.buffer=buffer;
     volume.gain.setValueAtTime(0.0001,at);
     volume.gain.linearRampToValueAtTime(1,at+0.020);
     volume.gain.setValueAtTime(1,at+Math.max(0.021,seconds-0.100));
     volume.gain.linearRampToValueAtTime(0.0001,at+seconds);
     source.connect(volume).connect(bus);
     this.keyboardNodes.add(source);
     source.onended=()=>{this.keyboardNodes.delete(source);};
     source.start(at);source.stop(at+seconds+0.005);
     return;
   }
   // Modo offline/sem OGG: não ficar mudo; sem gerar som sintético sobre o real.
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
     gain.gain.setValueAtTime(tap.strength,at);
     gain.gain.exponentialRampToValueAtTime(0.0001,at+0.048);
     source.connect(filter).connect(gain).connect(bus);
     this.keyboardNodes.add(source);
     source.onended=()=>{this.keyboardNodes.delete(source);};
     source.start(at);source.stop(at+0.050);
   }
 }
 stopKeyboard():void{
   for(const source of this.keyboardNodes){try{source.stop();}catch{/* Fonte já encerrada. */}}
   this.keyboardNodes.clear();
   if(this.context)this.nextKeyboard=this.context.currentTime;
   if(this.context&&this.keyboardBus){
     this.keyboardBus.gain.cancelScheduledValues(this.context.currentTime);
     this.keyboardBus.gain.setValueAtTime(AUDIO_LEVELS.keyboard,this.context.currentTime);
   }
 }
}
