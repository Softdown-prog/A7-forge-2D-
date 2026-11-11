import type {PosterDesign} from "./types.js";
import {paintCrtScene} from "./crtScene.js";
/** Individually owned procedural artwork for the terminal poster. */
export const terminalPoster:PosterDesign={
 palette:["#244c40","#bdd48d","#fff0c9"],
 title:["LAN HOUSE"],
 caption:"PRIMEIRAS CONEXÕES",
 paint(c){paintCrtScene(c,"terminal");}
};
