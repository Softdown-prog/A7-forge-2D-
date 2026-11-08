export interface GameGuideTable{
 readonly caption:string;
 readonly headers:readonly string[];
 readonly rows:readonly (readonly string[])[];
}

export interface GameGuideProblem{
 readonly problem:string;
 readonly solution:string;
}

export interface GameGuideCatalogItem{
 readonly number:number;
 readonly id:string;
 readonly slug:string;
 readonly path:string;
 readonly groupCode:string;
 readonly groupTitle:string;
 readonly title:string;
 readonly summary:string;
 readonly unlockBadge:string;
 readonly uiPath:string;
}

export interface GameGuide extends GameGuideCatalogItem{
 readonly whatIs:readonly string[];
 readonly whyItMatters:readonly string[];
 readonly whenAvailable:readonly string[];
 readonly howToUse:readonly string[];
 readonly whatHappensNext:readonly string[];
 readonly costsAndLimits:readonly string[];
 readonly table?:GameGuideTable;
 readonly commonProblems:readonly GameGuideProblem[];
 readonly playerTips:readonly string[];
 readonly relatedIds:readonly string[];
}

export interface GameGuideGroup{
 readonly code:string;
 readonly title:string;
 readonly description:string;
 readonly guides:readonly GameGuideCatalogItem[];
}
