import type {GameState} from "../types.js";
import {linuxMachineSpec} from "../linuxMachines.js";
import {DISC_COPIER_COST} from "../discCopy.js";
import {PRINTER_COST} from "../printService.js";
import {ANNEX_PC_COST} from "../stations.js";
import {WALL_COST} from "../walls.js";
import {expansionPrice} from "../room.js";

export function shopPrice(s:GameState,id:string):number{
 if(linuxMachineSpec(id))return linuxMachineSpec(id)!.cost;
 if(id==="disc-copier")return DISC_COPIER_COST;
 if(id==="printer")return PRINTER_COST;
 if(id==="ps1")return 560;
 if(id==="wall")return WALL_COST;
 if(id==="door")return 80;
 if(id==="computer-annex")return ANNEX_PC_COST;
 if(id==="extend-west")return expansionPrice(s,"west");
 if(id==="extend-east")return expansionPrice(s,"east");
 if(id==="extend-north")return expansionPrice(s,"north");
 return id==="expand"?650+s.expansionLevel*450:id==="computer"?320:id==="poster"?45:id==="plant"?85:id==="table"?140:0;
}
