/** Stable internal contract for each individually registered poster. */
export type PosterKind="coaster"|"tactical"|"golf"|"artillery"|"city"|"terminal"|"arcade";
export interface PosterDesign {
 readonly palette:readonly [string,string,string];
 readonly title:readonly string[];
 readonly caption:string;
 paint(ctx:CanvasRenderingContext2D,paper:string):void;
}
