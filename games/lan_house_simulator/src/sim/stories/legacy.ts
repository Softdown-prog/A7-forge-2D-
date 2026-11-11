import type {LegacyChainId,StoryDefinition} from "./types.js";

/** As quatro propostas antigas também recebem desdobramentos sem alterar seu efeito inicial. */
export const LEGACY_STORIES:Record<LegacyChainId,Pick<StoryDefinition,"title"|"category"|"developments">>={
 "supplier-offer":{title:"Proposta do distribuidor",category:"opportunity",
  developments:{good:"O lote chegou, e o fornecedor pergunta se pode contar com novos pedidos.",
   mixed:"O distribuidor ofereceu o lote a outro comerciante. Surgiu uma nova chance de negociação.",
   bad:"A negociação terminou sem acordo e o lote foi revendido."}},
 "school-booking":{title:"Reserva da escola do bairro",category:"opportunity",
  developments:{good:"Os alunos compareceram e os professores elogiaram a organização do local.",
   mixed:"A escola encontrou outra sala e pergunta sobre uma futura parceria.",
   bad:"A escola escolheu outro estabelecimento para a atividade."}},
 "gaming-tournament":{title:"Campeonato no bairro",category:"opportunity",
  developments:{good:"O torneio atraiu o bairro e os competidores sugerem outra edição.",
   mixed:"O encontro menor reuniu amigos, mas parte do público pediu um evento organizado.",
   bad:"O campeonato aconteceu em outro local, mas o grupo cogita uma nova chance."}},
 "equipment-fault":{title:"Manutenção preventiva",category:"problem",
  developments:{good:"A revisão completa conteve o aquecimento; o técnico recomenda acompanhamento.",
   mixed:"A limpeza reduziu o aquecimento, mas algumas peças ainda esquentam em sessões longas.",
   bad:"O adiamento agravou o desgaste, e clientes reclamaram das interrupções."}}
};
