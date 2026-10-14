export type HardwareKind="cpu"|"ram"|"storage"|"motherboard"|"psu";
export interface PcComponents {cpu:string;ram:string;storage:string;motherboard:string;psu:string}
export interface HardwarePart {
 id:string;kind:HardwareKind;name:string;year:number;cost:number;stage:number;
 mhz?:number;cores?:number;bits?:number;watts?:number;socket?:string;
 ramType?:string;ramMb?:number;maxRamMb?:number;
 capacityGb?:number;driveType?:"HD"|"SSD"|"NVMe";bus?:string;buses?:readonly string[];
 uefi?:boolean;tpm2?:boolean;dx12?:boolean;
}
// Fictional product names, prices and power figures for the simulation.
export const CPU_CATALOG:readonly HardwarePart[]=[
 {id:"cpu98",kind:"cpu",name:"Bairro 350",year:1998,cost:120,stage:0,mhz:350,cores:1,bits:32,watts:30,socket:"Slot 1"},
 {id:"cpu00",kind:"cpu",name:"Bairro 800",year:2000,cost:180,stage:1,mhz:800,cores:1,bits:32,watts:35,socket:"Slot 1"},
 {id:"cpu03",kind:"cpu",name:"Turbo 2.4",year:2003,cost:270,stage:2,mhz:2400,cores:1,bits:32,watts:65,socket:"478"},
 {id:"cpu05",kind:"cpu",name:"Turbo 3.0",year:2005,cost:350,stage:3,mhz:3000,cores:1,bits:32,watts:80,socket:"478"},
 {id:"cpu08",kind:"cpu",name:"Duo 2.4",year:2008,cost:440,stage:4,mhz:2400,cores:2,bits:64,watts:65,socket:"775"},
 {id:"cpu12",kind:"cpu",name:"Quad 3.2",year:2012,cost:650,stage:5,mhz:3200,cores:4,bits:64,watts:77,socket:"1155"},
 {id:"cpu17",kind:"cpu",name:"Hexa 3.6",year:2017,cost:900,stage:6,mhz:3600,cores:6,bits:64,watts:95,socket:"AM4"},
 {id:"cpu20",kind:"cpu",name:"Octa 4.0",year:2020,cost:1150,stage:6.5,mhz:4000,cores:8,bits:64,watts:105,socket:"AM4"},
 {id:"cpu24",kind:"cpu",name:"Octa 4.2",year:2024,cost:1450,stage:7,mhz:4200,cores:8,bits:64,watts:125,socket:"AM5"}
];
export const RAM_CATALOG:readonly HardwarePart[]=[
 {id:"ram64",kind:"ram",name:"SDRAM 64 MB",year:1998,cost:45,stage:0,ramType:"SDRAM",ramMb:64,watts:5},
 {id:"ram128",kind:"ram",name:"SDRAM 128 MB",year:2000,cost:75,stage:1,ramType:"SDRAM",ramMb:128,watts:5},
 {id:"ram256",kind:"ram",name:"SDRAM 256 MB",year:2001,cost:100,stage:1.5,ramType:"SDRAM",ramMb:256,watts:6},
 {id:"ram512s",kind:"ram",name:"SDRAM 512 MB",year:2003,cost:140,stage:2,ramType:"SDRAM",ramMb:512,watts:7},
 {id:"ram512d",kind:"ram",name:"DDR 512 MB",year:2003,cost:130,stage:2,ramType:"DDR",ramMb:512,watts:7},
 {id:"ram1d",kind:"ram",name:"DDR 1 GB",year:2005,cost:180,stage:3,ramType:"DDR",ramMb:1024,watts:8},
 {id:"ram2d",kind:"ram",name:"DDR 2 GB",year:2007,cost:240,stage:3.5,ramType:"DDR",ramMb:2048,watts:9},
 {id:"ram2d2",kind:"ram",name:"DDR2 2 GB",year:2008,cost:220,stage:4,ramType:"DDR2",ramMb:2048,watts:8},
 {id:"ram4d2",kind:"ram",name:"DDR2 4 GB",year:2009,cost:300,stage:4.5,ramType:"DDR2",ramMb:4096,watts:9},
 {id:"ram8d2",kind:"ram",name:"DDR2 8 GB",year:2011,cost:400,stage:5,ramType:"DDR2",ramMb:8192,watts:10},
 {id:"ram8d3",kind:"ram",name:"DDR3 8 GB",year:2012,cost:290,stage:5,ramType:"DDR3",ramMb:8192,watts:8},
 {id:"ram16d3",kind:"ram",name:"DDR3 16 GB",year:2013,cost:420,stage:5.5,ramType:"DDR3",ramMb:16384,watts:10},
 {id:"ram32d3",kind:"ram",name:"DDR3 32 GB",year:2015,cost:620,stage:6,ramType:"DDR3",ramMb:32768,watts:12},
 {id:"ram16d4",kind:"ram",name:"DDR4 16 GB",year:2017,cost:380,stage:6,ramType:"DDR4",ramMb:16384,watts:8},
 {id:"ram32d4",kind:"ram",name:"DDR4 32 GB",year:2019,cost:580,stage:6.5,ramType:"DDR4",ramMb:32768,watts:10},
 {id:"ram64d4",kind:"ram",name:"DDR4 64 GB",year:2021,cost:850,stage:7,ramType:"DDR4",ramMb:65536,watts:12},
 {id:"ram32d5",kind:"ram",name:"DDR5 32 GB",year:2024,cost:640,stage:7,ramType:"DDR5",ramMb:32768,watts:10},
 {id:"ram64d5",kind:"ram",name:"DDR5 64 GB",year:2024,cost:980,stage:7.5,ramType:"DDR5",ramMb:65536,watts:12}
];
export const STORAGE_CATALOG:readonly HardwarePart[]=[
 {id:"hd4",kind:"storage",name:"HD IDE 4 GB",year:1998,cost:65,stage:0,capacityGb:4,driveType:"HD",bus:"IDE",watts:8},
 {id:"hd10",kind:"storage",name:"HD IDE 10 GB",year:2000,cost:90,stage:1,capacityGb:10,driveType:"HD",bus:"IDE",watts:8},
 {id:"hd20",kind:"storage",name:"HD IDE 20 GB",year:2001,cost:120,stage:1.5,capacityGb:20,driveType:"HD",bus:"IDE",watts:9},
 {id:"hd40",kind:"storage",name:"HD IDE 40 GB",year:2003,cost:160,stage:2,capacityGb:40,driveType:"HD",bus:"IDE",watts:9},
 {id:"hd80",kind:"storage",name:"HD SATA 80 GB",year:2003,cost:190,stage:2.5,capacityGb:80,driveType:"HD",bus:"SATA",watts:9},
 {id:"hd160",kind:"storage",name:"HD SATA 160 GB",year:2005,cost:240,stage:3,capacityGb:160,driveType:"HD",bus:"SATA",watts:10},
 {id:"hd320",kind:"storage",name:"HD SATA 320 GB",year:2008,cost:290,stage:4,capacityGb:320,driveType:"HD",bus:"SATA",watts:10},
 {id:"hd1000",kind:"storage",name:"HD SATA 1 TB",year:2012,cost:380,stage:4.5,capacityGb:1000,driveType:"HD",bus:"SATA",watts:11},
 {id:"ssd512",kind:"storage",name:"SSD SATA 512 GB",year:2012,cost:560,stage:5,capacityGb:512,driveType:"SSD",bus:"SATA",watts:5},
 {id:"ssd1000",kind:"storage",name:"SSD SATA 1 TB",year:2017,cost:690,stage:6,capacityGb:1000,driveType:"SSD",bus:"SATA",watts:5},
 {id:"nvme2000",kind:"storage",name:"NVMe 2 TB",year:2024,cost:890,stage:7,capacityGb:2000,driveType:"NVMe",bus:"NVMe",watts:6},
 {id:"nvme4000",kind:"storage",name:"NVMe 4 TB",year:2024,cost:1380,stage:7.5,capacityGb:4000,driveType:"NVMe",bus:"NVMe",watts:8}
];
export const BOARD_CATALOG:readonly HardwarePart[]=[
 {id:"board98",kind:"motherboard",name:"Bairro BX · Slot 1",year:1998,cost:95,stage:0,socket:"Slot 1",ramType:"SDRAM",maxRamMb:512,buses:["IDE"],watts:25},
 {id:"board03",kind:"motherboard",name:"Turbo 478",year:2003,cost:180,stage:2,socket:"478",ramType:"DDR",maxRamMb:2048,buses:["IDE","SATA"],watts:30},
 {id:"board08",kind:"motherboard",name:"Duo 775",year:2008,cost:280,stage:4,socket:"775",ramType:"DDR2",maxRamMb:8192,buses:["IDE","SATA"],watts:30},
 {id:"board12",kind:"motherboard",name:"Quad 1155",year:2012,cost:380,stage:5,socket:"1155",ramType:"DDR3",maxRamMb:32768,buses:["SATA"],watts:30,uefi:true},
 {id:"board17",kind:"motherboard",name:"Estúdio AM4",year:2017,cost:540,stage:6,socket:"AM4",ramType:"DDR4",maxRamMb:65536,buses:["SATA","NVMe"],watts:35,uefi:true,tpm2:true,dx12:true},
 {id:"board24",kind:"motherboard",name:"Arena AM5",year:2024,cost:760,stage:7,socket:"AM5",ramType:"DDR5",maxRamMb:131072,buses:["SATA","NVMe"],watts:35,uefi:true,tpm2:true,dx12:true}
];
export const PSU_CATALOG:readonly HardwarePart[]=[
 {id:"psu350",kind:"psu",name:"Fonte 350 W",year:1998,cost:85,stage:0,watts:350},
 {id:"psu400",kind:"psu",name:"Fonte 400 W",year:2003,cost:110,stage:2,watts:400},
 {id:"psu450",kind:"psu",name:"Fonte 450 W",year:2005,cost:145,stage:3,watts:450},
 {id:"psu500",kind:"psu",name:"Fonte 500 W",year:2008,cost:190,stage:4,watts:500},
 {id:"psu650",kind:"psu",name:"Fonte 650 W",year:2012,cost:270,stage:5,watts:650},
 {id:"psu850",kind:"psu",name:"Fonte 850 W",year:2017,cost:380,stage:6,watts:850},
 {id:"psu1000",kind:"psu",name:"Fonte 1.000 W",year:2024,cost:490,stage:7,watts:1000}
];
export const HARDWARE_CATALOG=[...CPU_CATALOG,...RAM_CATALOG,...STORAGE_CATALOG,...BOARD_CATALOG,...PSU_CATALOG];
const lookup=new Map(HARDWARE_CATALOG.map(p=>[p.id,p]));
export function hardwarePart(id:string):HardwarePart|undefined{return lookup.get(id);}
export const HARDWARE_LABELS:Record<HardwareKind,string>={cpu:"Processador",ram:"Memória RAM",storage:"Armazenamento",motherboard:"Placa-mãe",psu:"Fonte"};
export const PLATFORM_KITS=[
 {id:"platform98",name:"Base 1998",year:1998,cost:0,components:{cpu:"cpu98",ram:"ram64",storage:"hd4",motherboard:"board98",psu:"psu350"}},
 {id:"platform00",name:"Bairro 2000",year:2000,cost:240,components:{cpu:"cpu00",ram:"ram128",storage:"hd10",motherboard:"board98",psu:"psu350"}},
 {id:"platform03",name:"Turbo 2003",year:2003,cost:480,components:{cpu:"cpu03",ram:"ram512d",storage:"hd40",motherboard:"board03",psu:"psu400"}},
 {id:"platform05",name:"Turbo 2005",year:2005,cost:1020,components:{cpu:"cpu05",ram:"ram1d",storage:"hd160",motherboard:"board03",psu:"psu450"}},
 {id:"platform08",name:"Duo 2008",year:2008,cost:1420,components:{cpu:"cpu08",ram:"ram2d2",storage:"hd320",motherboard:"board08",psu:"psu500"}},
 {id:"platform12",name:"Quad 2012",year:2012,cost:2150,components:{cpu:"cpu12",ram:"ram8d3",storage:"ssd512",motherboard:"board12",psu:"psu650"}},
 {id:"platform17",name:"Estúdio 2017",year:2017,cost:2890,components:{cpu:"cpu17",ram:"ram16d4",storage:"ssd1000",motherboard:"board17",psu:"psu850"}},
 {id:"platform24",name:"Arena 2024",year:2024,cost:4230,components:{cpu:"cpu24",ram:"ram32d5",storage:"nvme2000",motherboard:"board24",psu:"psu1000"}}
] as const;
export function formatMemory(mb:number):string{return mb<1024?mb+" MB":mb/1024+" GB";}
export function describePart(p:HardwarePart):string{
 if(p.kind==="cpu")return (p.mhz!<1000?p.mhz+" MHz":(p.mhz!/1000).toLocaleString("pt-BR")+" GHz")+" · "+p.cores+" núcleo"+(p.cores===1?"":"s")+" · "+p.bits+" bits · socket "+p.socket;
 if(p.kind==="ram")return p.ramType+" · "+formatMemory(p.ramMb!);
 if(p.kind==="storage")return p.driveType+" · "+(p.capacityGb!>=1000?p.capacityGb!/1000+" TB":p.capacityGb+" GB")+" · "+p.bus;
 if(p.kind==="motherboard")return "Socket "+p.socket+" · "+p.ramType+" até "+formatMemory(p.maxRamMb!)+" · "+p.buses!.join(" / ")+(p.tpm2?" · TPM 2.0":"");
 return p.watts+" W de capacidade";
}
