/** Public API compatibility: implementation grouped by catalog, station, download, licensing and visitor demand. */
export {GPU_GAME_CATALOG,gpuGameSpec} from "./gpuGames/catalog.js";
export type {GpuGameId,GpuGameSpec} from "./gpuGames/catalog.js";
export {gpuGameCompatible,gpuGameEligiblePcs,gpuGameInstalledOnPc,validGpuGameInstalls,hasPlayableGpuGame,gpuGamePlayableOnPc} from "./gpuGames/compatibility.js";
export {gpuGameInstallDuration,gpuGameInstallJob,gpuGameInstallPausedReason,validGpuGameInstallJobs,gpuGameDownloadSlots,tickGpuGameInstallations,cancelGpuGameInstallation,toggleGpuGameInstallation,installGpuGameOnAvailablePcs} from "./gpuGames/downloads.js";
export type {GpuGameInstallJob} from "./gpuGames/downloads.js";
export {validGpuGameLicenses,quoteGpuGame,licenseGpuGame} from "./gpuGames/licensing.js";
export type {GpuGameQuote} from "./gpuGames/licensing.js";
export {gpuGameAttraction,gpuGameVisitorMultiplier,preferredGpuGame,gpuGameHourlyRate,gpuGameSessionPrice,wantsGpuGame} from "./gpuGames/visitors.js";
