import type {StoryDefinition} from "../types.js";
import {choice,story} from "../builders.js";

/** Independent story catalogue entry: neighbor-noise. */
export const definition:StoryDefinition=story("Reclamação de barulho dos vizinhos",
  "Moradores reclamam das comemorações e gritos dos clientes nas partidas. A relação com a vizinhança ficou delicada.","problem",[
  choice("noise-insulate","Instalar isolamento acústico",220,"Obra reduz o barulho e protege a convivência","good",{reputation:2,visitors:1.03,visitorDays:8}),
  choice("noise-rules","Estabelecer regras e avisos",45,"Clientes recebem orientação, mas exigem acompanhamento","mixed",{reputation:1}),
  choice("noise-ignore","Ignorar a reclamação",0,"Moradores podem registrar nova queixa","bad",{reputation:-3,visitors:.92,visitorDays:8})
 ],"Os vizinhos notaram o salão mais silencioso e agradeceram a mudança.",
 "Alguns jogadores respeitaram os avisos, mas houve novas discussões em horários movimentados.",
 "Uma segunda reclamação foi protocolada. Os vizinhos desaconselham o estabelecimento e a procura caiu.");
