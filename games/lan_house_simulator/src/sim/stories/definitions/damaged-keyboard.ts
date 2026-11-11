import type {StoryDefinition} from "../types.js";
import {choice,story} from "../builders.js";

/** Independent story catalogue entry: damaged-keyboard. */
export const definition:StoryDefinition=story("Teclado quebrado depois de uma partida",
  "Um cliente irritado bateu no teclado de uma estação e várias teclas pararam de responder.","problem",[
  choice("keyboard-replace","Substituir o teclado",75,"Estação volta a funcionar sem improvisos","good",{reputation:1}),
  choice("keyboard-repair","Consertar o teclado",25,"Reparo rápido com risco de novo defeito","mixed",{wear:4}),
  choice("keyboard-charge","Cobrar o cliente e adiar a troca",0,"Pode gerar discussão e indisponibilidade","bad",{wear:14,reputation:-2})
 ],"Um teclado novo resolveu as reclamações na estação.",
 "O reparo funcionou inicialmente, mas algumas teclas voltaram a falhar.",
 "A discussão com o cliente piorou; outros visitantes começaram a reclamar do equipamento.");
