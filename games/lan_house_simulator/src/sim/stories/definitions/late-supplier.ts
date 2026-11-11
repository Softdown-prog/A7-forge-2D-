import type {StoryDefinition} from "../types.js";
import {choice,story} from "../builders.js";

/** Independent story catalogue entry: late-supplier. */
export const definition:StoryDefinition=story("Entrega atrasada do fornecedor",
  "O distribuidor não entregou as bebidas e os salgadinhos combinados. O balcão pode ficar desabastecido.","problem",[
  choice("supplier-backup","Comprar lote de emergência",140,"Mercadorias repostas de imediato","good",{stock:{soda:10,snacks:8}}),
  choice("supplier-negotiate","Cobrar prazo e compensação",15,"Entrega pode chegar incompleta","mixed",{stock:{soda:3}}),
  choice("supplier-wait","Esperar sem tomar providências",0,"Prateleiras podem ficar vazias","bad",{stock:{soda:-5,snacks:-4},reputation:-2})
 ],"O fornecedor alternativo cumpriu o combinado e o balcão passou pelo movimento sem falta.",
 "O fornecedor entregou apenas uma parte do pedido e prometeu completar a remessa.",
 "O atraso continuou e alguns clientes saíram sem encontrar os produtos que queriam.");
