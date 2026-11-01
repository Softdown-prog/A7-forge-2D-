
/** UI-only types mirror the TypeScript ports; no simulation rules or saves. */
import {Component,ChangeDetectionStrategy,OnInit,OnDestroy,signal} from '@angular/core';
interface TimeView{
 readonly day:number;readonly date:string;readonly time:string;readonly weekday:string;
 readonly nightActive:boolean;readonly ended:boolean;readonly weather:string;
 readonly weatherIcon:string;readonly impact:string;readonly outlook:string;
}
interface NoticeButton{
 readonly kind:'button';readonly action:'read'|'programmer'|'windows'|'games'|'decision'|'linux-research';
 readonly text:string;readonly disabled:boolean;
 readonly noticeId?:string;readonly choiceId?:string;readonly title?:string;
}
interface NoticeAnnotation{readonly kind:'hint'|'deadline'|'resolved';readonly text:string;}
type NoticeItem=NoticeButton|NoticeAnnotation;
interface NoticeLetter{
 readonly title:string;readonly body:string;readonly day:number;
 readonly severity:'info'|'warning'|'urgent';readonly read:boolean;
 readonly items:readonly NoticeItem[];
}
interface InboxView{readonly letters:readonly NoticeLetter[];}
interface NoticeStatus{
 readonly unread:number;readonly badgeHidden:boolean;readonly badgeText:string;
 readonly windowHidden:boolean;readonly expanded:string;
}
const INITIAL:TimeView={day:1,date:'01/01/1998',time:'10:00',weekday:'',nightActive:false,
 ended:false,weather:'Tempo firme',weatherIcon:'sun',impact:'',outlook:''};
@Component({selector:'lhs-time-weather',standalone:true,templateUrl:'./templates/time-weather.html',
 changeDetection:ChangeDetectionStrategy.OnPush})
export class TimeWeatherComponent implements OnInit,OnDestroy{
 readonly view=signal<TimeView>(INITIAL);
 private readonly receive=(event:Event):void=>{
  const detail=(event as CustomEvent<TimeView>).detail;
  if(detail&&typeof detail.day==='number'&&typeof detail.date==='string')this.view.set(detail);
 };
 ngOnInit():void{document.addEventListener('lhs:time-weather-updated',this.receive);}
 ngOnDestroy():void{document.removeEventListener('lhs:time-weather-updated',this.receive);}
 get dayLabel():string{
  const t=this.view();return (t.ended?'Fim da campanha · ':'')+
   'Dia '+t.day+' · '+t.weekday+' · '+t.date+' · '+t.time;
 }
 get campaignDay():string{
  const t=this.view();return (t.ended?'Último dia':'Dia '+t.day)+' da campanha · '+t.weekday;
 }
 get outlook():string{
  return this.view().nightActive
   ?'Encontro noturno em andamento. O sábado normal reabre às 10h, após a saída da turma.'
   :this.view().outlook;
 }
}
@Component({selector:'lhs-notice-inbox',standalone:true,templateUrl:'./templates/notice-inbox.html',
 changeDetection:ChangeDetectionStrategy.OnPush})
export class NoticeInboxComponent implements OnInit,OnDestroy{
 readonly status=signal<NoticeStatus>({unread:0,badgeHidden:true,badgeText:'0',
  windowHidden:true,expanded:'false'});
 readonly letters=signal<readonly NoticeLetter[]>([]);
 private readonly receiveStatus=(event:Event):void=>{
  const detail=(event as CustomEvent<NoticeStatus>).detail;
  if(detail&&typeof detail.unread==='number')this.status.set(detail);
 };
 private readonly receiveLetters=(event:Event):void=>{
  const detail=(event as CustomEvent<InboxView>).detail;
  if(detail&&Array.isArray(detail.letters))this.letters.set(detail.letters);
 };
 ngOnInit():void{
  document.addEventListener('lhs:notice-status-updated',this.receiveStatus);
  document.addEventListener('lhs:notice-inbox-updated',this.receiveLetters);
 }
 ngOnDestroy():void{
  document.removeEventListener('lhs:notice-status-updated',this.receiveStatus);
  document.removeEventListener('lhs:notice-inbox-updated',this.receiveLetters);
 }
 // Native delegated noticeControls handles all button clicks.
}
