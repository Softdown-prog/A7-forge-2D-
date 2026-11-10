import type {StoryDefinition} from "../types.js";
import {choice,story} from "../builders.js";

/** Independent story catalogue entry: missing-stock. */
export const definition:StoryDefinition=story("Diferença no estoque de mercadorias",
  "A contagem de refrigerantes, doces e salgadinhos não bate com as entradas. Pode ser erro de controle ou perda.","problem",[
  choice("stock-control","Implantar conferência e controle",95,"Reorganiza registros e inventário","good",{reputation:1}),
  choice("stock-count","Fazer contagem manual",20,"Descobre parte da diferença","mixed",{stock:{soda:-2}}),
  choice("stock-ignore","Aceitar a diferença sem investigar",0,"Produtos continuam desaparecendo","bad",{stock:{soda:-5,snacks:-3},reputation:-1})
 ],"O novo controle encontrou a origem dos erros, evitando novas perdas.",
 "A contagem melhorou as anotações, mas as entregas seguintes ainda tiveram diferenças.",
 "Novas unidades desapareceram; faltou produto para vender no horário de maior movimento.");
