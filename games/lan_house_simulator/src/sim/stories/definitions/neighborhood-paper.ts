import type {StoryDefinition} from "../types.js";
import {choice,story} from "../builders.js";

/** Independent story catalogue entry: neighborhood-paper. */
export const definition:StoryDefinition=story("O jornal do bairro quer uma entrevista",
  "Um jornalista ouviu falar da lan house e oferece uma matéria sobre o negócio.","opportunity",[
  choice("paper-invest","Preparar evento para a reportagem",110,"Boa apresentação aumenta a visibilidade","good",{reputation:2,visitors:1.13,visitorDays:12}),
  choice("paper-talk","Conceder entrevista simples",0,"Divulgação espontânea e discreta","mixed",{reputation:1,visitors:1.05,visitorDays:6}),
  choice("paper-refuse","Recusar a entrevista",0,"O jornal buscará outras pautas","bad",{})
 ],"A matéria destacou a organização do salão e trouxe novos curiosos.",
 "A reportagem citou a lan house, mas a repercussão foi moderada.",
 "O jornal publicou outras histórias e uma oportunidade de divulgação se perdeu.");
