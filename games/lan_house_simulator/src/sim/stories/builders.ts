import type {StoryImpact,StoryChoice,StoryDefinition} from "./types.js";

export const choice=(id:string,label:string,cost:number,description:string,outcome:StoryOutcome,impact?:StoryImpact):StoryChoice=>
 ({id,label,cost,description,outcome,impact});
export const story=(title:string,body:string,category:StoryDefinition["category"],
 choices:StoryDefinition["choices"],good:string,mixed:string,bad:string):StoryDefinition=>
 ({title,body,category,choices,developments:{good,mixed,bad}});
