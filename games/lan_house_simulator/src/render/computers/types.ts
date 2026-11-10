import type {LcdId} from "../../sim/computerModels.js";
import type {LinuxMachineId} from "../../sim/linuxMachines.js";
import type {PcScreenActivity} from "../pcScreenActivities.js";

export type ComputerMode="ready"|"busy"|"offline"|"maintenance"|"powered-off";
export interface ComputerAppearance{tier:number;linuxModel:LinuxMachineId|null;occupied:boolean;mode:ComputerMode;pulse:number;gpu:string|null;lcd:LcdId|null;premiumChair:boolean;premiumKeyboard:boolean;keyboardPhase:number;activity:PcScreenActivity|null;activityFrame:number}
