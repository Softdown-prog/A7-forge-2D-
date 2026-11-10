import type {StoryDefinition} from "../types.js";
import {choice,story} from "../builders.js";

/** Independent story catalogue entry: school-uniform-policy. */
export const definition:StoryDefinition=story("2004: alunos de uniforme durante as aulas",
  "A escola do bairro procurou Tony: estudantes estão frequentando a lan house de uniforme durante o horário de aula. A direção pede colaboração para orientar os jovens. É um acordo local, não uma proibição nacional. Como sua lan house vai lidar com a situação?","problem",[
  choice("uniform-post-rule","Estabelecer regra e avisar famílias",65,
   "Explica os horários, orienta os estudantes e registra um acordo com a escola","good",
   {reputation:2,visitors:.98,visitorDays:6}),
  choice("uniform-talk","Conversar com os alunos",0,
   "Orientação sem cartazes nem procedimento fixo; pode precisar de reforço","mixed",{reputation:1}),
  choice("uniform-ignore","Não interferir na frequência",0,
   "A escola pode apresentar uma nova reclamação e famílias podem evitar o local","bad",
   {reputation:-3,visitors:.93,visitorDays:10})
 ],"A escola agradeceu a colaboração. Os alunos receberam orientações sobre os horários de aula.",
 "Alguns estudantes passaram a respeitar os horários, mas a direção ainda recebeu relatos de faltas.",
 "A escola voltou a procurar Tony: responsáveis reclamaram que estudantes seguem faltando às aulas.");
