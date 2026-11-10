import type {CharacterAppearance} from "./types.js";
import type {ActorStyle} from "../actorArt.js";
const casual: readonly ActorStyle[] = [
  {shirt:"#358C94",dark:"#225D73",highlight:"#7FC5BA",pants:"#374A69",hair:"#4A342D",skin:"#EFB68F",trim:"#F2D08D"},
  {shirt:"#BE6B57",dark:"#8B4455",highlight:"#E49C7A",pants:"#3D5368",hair:"#6B493A",skin:"#BD8467",trim:"#E8CF8C"},
  {shirt:"#6C82B7",dark:"#444E85",highlight:"#AEC4EA",pants:"#3A3F63",hair:"#252B3B",skin:"#CFA080",trim:"#D9E89D"},
  {shirt:"#A97C95",dark:"#6F526F",highlight:"#D8AFC4",pants:"#556077",hair:"#53372E",skin:"#F0BF9D",trim:"#8BD2C8"}
];
export const appearance:CharacterAppearance={
 style(id){const value=casual[(Math.abs(Math.trunc(id))||0)%casual.length]!;return {...value};}
};
