import type {StoryDefinition} from "../types.js";
import {choice,story} from "../builders.js";

/** Independent story catalogue entry: roof-leak. */
export const definition:StoryDefinition=story("Goteira perto dos computadores",
  "Depois de uma chuva, surgiram manchas e pingos perto das estações. O teto precisa de atenção antes de afetar os equipamentos.","problem",[
  choice("roof-professional","Contratar reparo do telhado",260,"Elimina a infiltração", "good",{reputation:1}),
  choice("roof-temporary","Instalar proteção provisória",85,"Contém a água, mas exige acompanhamento","mixed",{wear:2}),
  choice("roof-ignore","Deixar para depois",0,"A água pode atingir as máquinas","bad",{wear:12,reputation:-2})
 ],"O reparo resistiu à chuva seguinte. Os clientes perceberam o cuidado com o salão.",
 "A lona segurou parte da água, porém outra chuva revelou uma pequena abertura.",
 "A infiltração alcançou a área dos PCs; um computador começou a apresentar falhas.");
