/** Updates existing GPU download nodes: never rebuilds the scrollable catalog. */
import type {GpuDownloadMetersPort} from "../application/gpuDownloadMetersPort.js";
export function refreshGpuDownloadMeters(panel:HTMLElement|null,active:boolean,port:GpuDownloadMetersPort):void{
 if(!panel||!active)return;
 const bandwidth=panel.querySelector<HTMLElement>("[data-gpu-bandwidth]");
 if(bandwidth)bandwidth.textContent=port.bandwidth();
 for(const label of Array.from(panel.querySelectorAll<HTMLElement>("[data-gpu-download-status]"))){
  const pc=Number(label.dataset.gpuGamePc),status=port.progress(pc,label.dataset.gpuDownloadStatus??"");
  if(status)label.textContent=status.label;
 }
 for(const meter of Array.from(panel.querySelectorAll<HTMLProgressElement>("[data-gpu-download-progress]"))){
  const pc=Number(meter.dataset.gpuGamePc),status=port.progress(pc,meter.dataset.gpuDownloadProgress??"");
  if(status)meter.value=status.minutesElapsed;
 }
}
