/** Pending Windows installs run on the actual wall clock, never game minutes.
 * A paid job survives reload/import; completion only changes the selected PC.
 */
import {WINDOWS_ERAS,installedWindows,type WindowsEdition} from "./eraCatalog.js";
import type {GameState} from "./types.js";

export interface WindowsInstallJob{
 readonly pc:number;
 readonly edition:WindowsEdition;
 readonly startedAtMs:number;
 readonly finishedAtMs:number;
}
export function windowsInstallDurationMs(edition:WindowsEdition):number{
 const index=WINDOWS_ERAS.findIndex(row=>row.id===edition);
 return index<0?0:(index+1)*10*60_000;
}
export function windowsInstallFor(s:Pick<GameState,"windowsInstallJobs">,pc:number):WindowsInstallJob|null{
 return s.windowsInstallJobs?.find(job=>job.pc===pc)??null;
}
export interface WindowsInstallProgress{
 readonly name:string;
 readonly percent:number;
 readonly remainingSeconds:number;
 readonly totalSeconds:number;
}
export function windowsInstallProgress(s:Pick<GameState,"windowsInstallJobs">,pc:number,now=Date.now()):WindowsInstallProgress|null{
 const job=windowsInstallFor(s,pc);if(!job)return null;
 const duration=windowsInstallDurationMs(job.edition);
 const remaining=Math.max(0,job.finishedAtMs-now);
 return {name:WINDOWS_ERAS.find(row=>row.id===job.edition)!.name,
  percent:Math.max(0,Math.min(100,Math.floor((1-remaining/duration)*100))),
  remainingSeconds:Math.ceil(remaining/1000),totalSeconds:duration/1000};
}
function stationCount(s:Partial<GameState>):number{
 return Math.max(3,Math.min(3+(s.expansionLevel??0)*2,
  s.installedPcs??(3+(s.expansionLevel??0)*2)))+(s.annexPcs?.length??0);
}
export function validWindowsInstallJobs(s:Partial<GameState>):boolean{
 const jobs=s.windowsInstallJobs;
 if(jobs===undefined)return true;
 if(!Array.isArray(jobs)||jobs.length>200||jobs.length>stationCount(s))return false;
 const seen=new Set<number>();
 for(const job of jobs){
  if(!job||typeof job!=="object"||!Number.isInteger(job.pc)||job.pc<0||
    job.pc>=stationCount(s)||seen.has(job.pc)||
    !WINDOWS_ERAS.some(row=>row.id===job.edition)||
    !Number.isSafeInteger(job.startedAtMs)||job.startedAtMs<0||job.startedAtMs>1e14||
    !Number.isSafeInteger(job.finishedAtMs)||
    job.finishedAtMs!==job.startedAtMs+windowsInstallDurationMs(job.edition)||
    s.pcPoweredOff?.[job.pc]!==true)return false;
  seen.add(job.pc);
 }
 return true;
}
/** Returns newly finished jobs once; OS and license remain old until this point. */
export function finishWindowsInstallations(s:GameState,now=Date.now()):WindowsInstallJob[]{
 const jobs=s.windowsInstallJobs;if(!jobs?.length)return [];
 const completed=jobs.filter(job=>job.finishedAtMs<=now);
 if(!completed.length)return [];
 const count=stationCount(s);
 const windows=Array.from({length:count},(_,i)=>installedWindows(s,i));
 const licenses=Array.from({length:count},(_,i)=>s.pcWindowsLicenses?.[i]===true);
 const modes=Array.from({length:count},(_,i)=>s.pcOperatingSystems?.[i]==="linux"?"linux" as const:"windows" as const);
 for(const job of completed){
  windows[job.pc]=job.edition;licenses[job.pc]=true;modes[job.pc]="windows";
 }
 s.pcWindows=windows;s.pcWindowsLicenses=licenses;s.pcOperatingSystems=modes;
 s.windowsInstallJobs=jobs.filter(job=>job.finishedAtMs>now);
 return completed;
}
