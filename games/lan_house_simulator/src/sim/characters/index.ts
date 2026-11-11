import {costumeKind as regular} from "./regular.js";
import {costumeKind as female} from "./female.js";
import {costumeKind as bob} from "./female-bob.js";
import {costumeKind as ponytail} from "./female-ponytail.js";
import {costumeKind as clown} from "./clown.js";
import {costumeKind as vampire} from "./vampire.js";
import {costumeKind as monster} from "./stitched-monster.js";
import {costumeKind as rabbit} from "./rabbit.js";
import {costumeKind as mouse} from "./mouse-mascot.js";
import type {Costume} from "../types.js";
/** Preserve random slots and RNG replay after extraction. */
export const COSTUMES:Costume[]=[
 regular,regular,female,bob,ponytail,regular,clown,vampire,monster,rabbit,mouse
];
