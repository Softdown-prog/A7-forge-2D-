/** Presentation cache for service-access diagnostics. Keeps the engine query injected
 * and never owns a game session, save, browser timer or pathfinding rule.
 */
export interface ServiceAccessInspectionCache<I> {
 inspect(force?:boolean):readonly I[];
 snapshot():readonly I[];
}
export function createServiceAccessInspectionCache<I>(
 compute:()=>readonly I[],
 now:()=>number
):ServiceAccessInspectionCache<I> {
 let cached:readonly I[]=[];
 let updatedAt=-10000;
 return {
  inspect(force=false){
   const current=now();
   // Preserve the 1600ms threshold, including strict greater-than comparison.
   if(force||current-updatedAt>1600){
    const next=compute();
    cached=next;
    updatedAt=current;
   }
   return cached;
  },
  snapshot:()=>cached
 };
}
