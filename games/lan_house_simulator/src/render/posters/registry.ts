/** Poster art registry. Add one painter per poster, never import another poster from an individual design. */
import type {PosterDesign,PosterKind} from "./types.js";
import {coasterPoster} from "./coaster.js";
import {tacticalPoster} from "./tactical.js";
import {golfPoster} from "./golf.js";
import {artilleryPoster} from "./artillery.js";
import {cityPoster} from "./city.js";
import {terminalPoster} from "./terminal.js";
import {arcadePoster} from "./arcade.js";

export type PosterRegistration=readonly [PosterKind,PosterDesign];

/** Reject duplicate IDs rather than silently replacing another module's artwork. */
export function createPosterRegistry(entries:readonly PosterRegistration[]):ReadonlyMap<PosterKind,PosterDesign>{
 const registered=new Map<PosterKind,PosterDesign>();
 for(const [kind,design] of entries){
  if(registered.has(kind))throw new Error("Duplicate poster artwork: "+kind);
  registered.set(kind,design);
 }
 return registered;
}

/** One line per independent design, retaining the existing public ordering and identifiers. */
const POSTER_ENTRIES:readonly PosterRegistration[]=[
 ["coaster",coasterPoster],
 ["tactical",tacticalPoster],
 ["golf",golfPoster],
 ["artillery",artilleryPoster],
 ["city",cityPoster],
 ["terminal",terminalPoster],
 ["arcade",arcadePoster]
];
export const POSTER_KINDS:readonly PosterKind[]=POSTER_ENTRIES.map(([kind])=>kind);
const POSTERS=createPosterRegistry(POSTER_ENTRIES);
export function posterFor(kind:PosterKind):PosterDesign{
 const poster=POSTERS.get(kind);
 if(!poster)throw new Error("Unknown poster artwork: "+kind);
 return poster;
}
