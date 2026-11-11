import type {ActorContext,ActorPose,ActorStyle} from "../actorArt.js";
export interface ActorDetail{
 ctx:ActorContext;style:ActorStyle;headShift:number;lean:number;back:boolean;sideways:boolean;
 quarter:boolean;pose:ActorPose;time:number;cyber:boolean;
}
export interface CharacterAppearance{
 style:ActorStyle|((id:number)=>ActorStyle);
 drawBackHair?: (detail:ActorDetail)=>void;
 drawBack?: (detail:ActorDetail)=>void;
 drawBody?: (detail:ActorDetail)=>void;
 drawOutfit?: (detail:ActorDetail)=>void;
 drawAfterArms?: (detail:ActorDetail)=>void;
 drawHair?: (detail:ActorDetail)=>void;
 drawHairAccent?: (detail:ActorDetail)=>void;
 drawBackHead?: (detail:ActorDetail)=>void;
 drawBackFace?: (detail:ActorDetail)=>void;
 drawQuarterNose?: (detail:ActorDetail)=>void;
 drawQuarterMarks?: (detail:ActorDetail)=>void;
 drawSideNose?: (detail:ActorDetail)=>void;
 drawSideMarks?: (detail:ActorDetail)=>void;
 drawFrontNose?: (detail:ActorDetail)=>void;
 drawFrontMarks?: (detail:ActorDetail)=>void;
 drawHat?: (detail:ActorDetail)=>void;
 drawFaceAccessory?: (detail:ActorDetail)=>void;
}
