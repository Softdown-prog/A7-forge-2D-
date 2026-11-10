import type {StoryDefinition} from "../types.js";
import {choice,story} from "../builders.js";

/** Independent story catalogue entry: community-drive. */
export const definition:StoryDefinition=story("Associação pede computadores para uma ação social",
  "Uma associação do bairro quer utilizar algumas horas de computador para ajudar moradores.","opportunity",[
  choice("community-donate","Ceder horas gratuitas",65,"Apoio comunitário fortalece os laços do bairro","good",{reputation:3,visitors:1.07,visitorDays:10}),
  choice("community-discount","Oferecer desconto para o grupo",25,"Ajuda parcial, mantendo parte do atendimento","mixed",{reputation:1}),
  choice("community-decline","Não participar desta vez",0,"A ação procura outro local","bad",{})
 ],"A associação enviou um agradecimento e moradores passaram a recomendar a lan house.",
 "A atividade aconteceu em escala menor; alguns participantes pediram novos horários.",
 "A iniciativa foi realizada em outro lugar. Parte do bairro sentiu falta da participação da lan house.");
