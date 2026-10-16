/** Movimentos procedurais determinísticos das mãos e ferramentas.
 * Tempo visual em segundos; sem RNG, sem gravar estados novos no save. */
export type WorkerAction="sweeping"|"repairing";
export interface HandPoint{x:number;y:number}
export interface WorkerMotion{
 nearHand:HandPoint;
 farHand:HandPoint;
 toolTip:HandPoint;
 pulse:number;
}
export function workerMotion(action:WorkerAction,time:number):WorkerMotion{
 const phase=Number.isFinite(time)?time:0;
 if(action==="sweeping"){
  // Movimento largo da vassoura e contraposição das duas mãos no cabo.
  const pulse=Math.sin(phase*8.2),rise=Math.cos(phase*8.2);
  return {pulse,
   nearHand:{x:14+pulse*3,y:-39+rise*1.3},
   farHand:{x:20+pulse*6,y:-24+rise*.8},
   toolTip:{x:30+pulse*12,y:-4+Math.max(0,rise)*.6}};
 }
 // Alcance curto da chave de fenda e mão esquerda firmando o gabinete.
 const pulse=Math.sin(phase*11),rise=Math.cos(phase*11);
 return {pulse,
  nearHand:{x:20+pulse*2.5,y:-29+rise*2.5},
  farHand:{x:12+rise*1.3,y:-36+Math.abs(pulse)*.9},
  toolTip:{x:26+pulse*1.9,y:-9+rise*1.5}};
}
