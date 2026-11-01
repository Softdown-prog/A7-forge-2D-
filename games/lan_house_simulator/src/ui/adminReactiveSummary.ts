/**
 * Publish small read-only admin views to Angular islands.
 * Application ports remain the authority; identical snapshots are ignored
 * so the Canvas clock cannot trigger unnecessary UI renders.
 */
export type AngularAdminArea="finance"|"stock"|"computers";
export type AngularAdminSummary=Readonly<Record<string,string|number>>;
const previous=new WeakMap<object,Map<AngularAdminArea,string>>();

export function publishAngularAdminSummary(
 doc:Pick<Document,"getElementById"|"dispatchEvent">,
 area:AngularAdminArea,
 summary:AngularAdminSummary
):boolean {
 // The native area is named "computers", while its existing Angular host
 // is singular. The incorrect plural host silently suppressed every update.
 const host=area==="computers"?"angular-computer-workspace":"angular-"+area+"-workspace";
 if(!doc.getElementById(host)||
    typeof doc.dispatchEvent!=="function"||
    typeof CustomEvent!=="function")return false;
 const key=JSON.stringify(summary);
 let states=previous.get(doc);
 if(!states){states=new Map();previous.set(doc,states);}
 if(states.get(area)===key)return false;
 states.set(area,key);
 doc.dispatchEvent(new CustomEvent("lhs:admin-"+area+"-updated",{detail:summary}));
 return true;
}
