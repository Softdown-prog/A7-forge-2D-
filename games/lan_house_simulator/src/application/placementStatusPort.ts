/** Presentation-only placement projection; never accesses the game or DOM. */
export interface PlacementStatusInput {
 readonly placingKind:"poster"|"plant"|"table"|null;
 readonly placingName:string|null;
 readonly relocating:boolean;
 readonly relocationFrom:string|null;
 readonly selectedFurnitureKind:"poster"|"plant"|"table"|null;
 readonly wallMode:"build"|"door"|"remove"|null;
 readonly hasPendingWall:boolean;
 readonly canBuildPendingWall:boolean;
 readonly installingAnnexPc:boolean;
 readonly notice:string;
 readonly wallCost:number;
 readonly annexPcCost:number;
}
export interface PlacementStatus {
 readonly toolbarVisible:boolean;
 readonly stagePlacing:boolean;
 readonly rotateHidden:boolean;
 readonly rotateDisabled:boolean;
 readonly confirmWallHidden:boolean;
 readonly confirmWallDisabled:boolean;
 readonly turnWallHidden:boolean;
 readonly turnWallDisabled:boolean;
 readonly hint:string;
}
export function placementStatusSnapshot(s:PlacementStatusInput):PlacementStatus{
 const active=Boolean(s.placingKind||s.relocating||s.wallMode||s.installingAnnexPc);
 const hint=s.installingAnnexPc?
  (s.notice||"Escolha um círculo verde numa área ampliada (esquerda, direita ou fundos). PC completo: R$ "+s.annexPcCost+". A cobrança só ocorre ao selecionar a vaga."):
  s.wallMode?
  (s.notice||(s.wallMode==="build"?"Selecione a borda, confira a prévia e confirme. Cada segmento custa R$ "+s.wallCost+".":"Toque numa divisória para "+(s.wallMode==="door"?"instalar uma porta: R$ 80.":"remover parede ou porta."))):
  s.relocating?
  (s.notice||(s.relocationFrom?"Escolha o destino verde ou toque em Girar para mudar a orientação.":"Toque no móvel em dourado e escolha a nova posição. Sem custos.")):
  s.placingKind?(s.notice||"Escolha uma posição verde para "+s.placingName+". Clique para comprar e instalar; cancelar não cobra nada."):"";
 return {
  toolbarVisible:active,stagePlacing:active,
  rotateHidden:!(s.placingKind&&s.placingKind!=="poster")&&(!s.relocating||!s.selectedFurnitureKind),
  rotateDisabled:s.placingKind?s.placingKind==="poster":!s.selectedFurnitureKind||s.selectedFurnitureKind==="poster",
  confirmWallHidden:!s.wallMode,
  confirmWallDisabled:!s.hasPendingWall||(s.wallMode==="build"&&!s.canBuildPendingWall),
  turnWallHidden:s.wallMode!=="build",
  turnWallDisabled:!s.hasPendingWall,
  hint
 };
}
