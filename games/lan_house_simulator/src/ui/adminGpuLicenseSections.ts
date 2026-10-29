/** GPU and licenses presentation; view ports read the live game but no simulation runs here. */
import type {GpuCatalogPort} from "../application/gpuCatalogPort.js";
import type {BasicGamesLicenseStatusPort} from "../application/basicGamesLicenseStatusPort.js";
import type {WindowsLicensePort} from "../application/windowsLicensePort.js";
import type {ClassicGamesCatalogPort} from "../application/classicGamesCatalogPort.js";
import type {GpuGamesCatalogPort} from "../application/gpuGamesCatalogPort.js";
import type {GpuDownloadMetersPort} from "../application/gpuDownloadMetersPort.js";
import {renderGpuCatalogPanel} from "./gpuCatalogPanel.js";
import {renderBasicGamesLicenseStatus} from "./basicGamesLicenseStatusPanel.js";
import {renderWindowsLicensePanel} from "./windowsLicensePanel.js";
import {renderClassicGamesCatalog} from "./classicGamesCatalogPanel.js";
import {renderGpuGamesCatalog} from "./gpuGamesCatalogPanel.js";
import {refreshGpuDownloadMeters} from "./gpuDownloadMeters.js";

type LicensePage="windows"|"classic"|"gpu";
export interface AdminGpuLicenseSectionsOptions {
 readonly adminOpen:boolean;
 readonly gpuTab:boolean;
 readonly licensesTab:boolean;
 readonly gpuPcChoice:HTMLElement|null;
 readonly gpuList:HTMLElement|null;
 readonly licensePanel:HTMLElement|null;
 readonly eraGamePanel:HTMLElement|null;
 readonly gpuGamePanel:HTMLElement|null;
 readonly gpuChanged:()=>boolean;
 readonly selectedGpuIndex:()=>number;
 readonly licensePageActive:(page:LicensePage)=>boolean;
 readonly windowsChanged:()=>boolean;
 readonly classicChanged:()=>boolean;
 readonly gpuGamesChanged:()=>boolean;
 readonly gpuCatalog:GpuCatalogPort;
 readonly basicGames:BasicGamesLicenseStatusPort;
 readonly windows:WindowsLicensePort;
 readonly classic:ClassicGamesCatalogPort;
 readonly gpuGames:GpuGamesCatalogPort;
 readonly downloads:GpuDownloadMetersPort;
 readonly setText:(id:string,value:string)=>void;
 readonly doc:Document;
 readonly sync:(current:Element,next:Element)=>void;
}
export function renderAdminGpuLicenseSections(options:AdminGpuLicenseSectionsOptions):void {
 if(options.gpuPcChoice&&options.gpuList&&options.adminOpen&&options.gpuTab&&options.gpuChanged())
  renderGpuCatalogPanel(options.gpuPcChoice,options.gpuList,
   options.gpuCatalog.snapshot(options.selectedGpuIndex()),options.setText,options.doc,options.sync);
 renderBasicGamesLicenseStatus(options.basicGames.snapshot(),options.setText,options.doc);
 if(options.licensePanel&&options.adminOpen&&options.licensesTab&&options.licensePageActive("windows")&&options.windowsChanged())
  renderWindowsLicensePanel(options.licensePanel,options.windows);
 if(options.eraGamePanel&&options.adminOpen&&options.licensesTab&&options.licensePageActive("classic")&&options.classicChanged())
  renderClassicGamesCatalog(options.eraGamePanel,options.classic.snapshot(),options.doc,options.sync);
 if(options.gpuGamePanel&&options.adminOpen&&options.licensesTab&&options.licensePageActive("gpu")&&options.gpuGamesChanged())
  renderGpuGamesCatalog(options.gpuGamePanel,options.gpuGames.snapshot(),options.doc,options.sync);
 refreshGpuDownloadMeters(options.gpuGamePanel,
  options.adminOpen&&options.licensesTab&&options.licensePageActive("gpu"),options.downloads);
}
