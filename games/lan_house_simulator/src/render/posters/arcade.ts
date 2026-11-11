import type {PosterDesign} from "./types.js";
import {paintCrtScene} from "./crtScene.js";
/** Individually owned procedural artwork for the arcade poster. */
export const arcadePoster:PosterDesign={
 palette:["#433e68","#df967b","#fff0c7"],
 title:["JOGOS"],
 caption:"MAIS UMA FASE",
 paint(c){paintCrtScene(c,"arcade");}
};
