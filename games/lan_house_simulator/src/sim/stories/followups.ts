import type {StoryId,StoryChainId,StoryImpact} from "./types.js";

/** Seis ações contextuais por história: consolidar, observar, completar, manter, recuperar, ignorar. */
export const FOLLOWUP_LABELS:Record<StoryId,readonly string[]>={
 "roof-leak":["Inspecionar o telhado inteiro","Manter a manutenção","Substituir a lona por reparo","Manter proteção provisória","Reparar a área molhada","Deixar a infiltração avançar"],
 "neighbor-noise":["Conversar com vizinhos","Manter isolamento","Reforçar regras de silêncio","Manter só os avisos","Pedir desculpas e corrigir","Ignorar a segunda reclamação"],
 "damaged-keyboard":["Revisar periféricos","Manter teclado novo","Substituir teclas falhando","Manter reparo provisório","Trocar teclado e testar PC","Manter teclado danificado"],
 "malware-incident":["Revisar outras estações","Manter proteção atual","Verificar sistema restaurado","Usar sem revisão","Isolar PC e chamar suporte","Ignorar novos travamentos"],
 "missing-stock":["Treinar recebimento","Manter conferência","Criar registro de entradas","Seguir contagem manual","Auditar mercadorias","Ignorar nova divergência"],
 "unexpected-power-bill":["Monitorar consumo","Manter auditoria","Concluir contestação","Aceitar resposta parcial","Revisar cobrança e instalação","Seguir pagando sem verificar"],
 "late-supplier":["Firmar fornecedor alternativo","Manter fornecimento reserva","Contratar outro distribuidor","Esperar restante da entrega","Comprar estoque emergencial","Aceitar prateleiras vazias"],
 "lost-document":["Criar rotina de proteção","Manter atendimento","Acompanhar cliente afetado","Não acompanhar reclamação","Revisar PC e compensar","Desconsiderar novas críticas"],
 "local-network":["Testar cabos e portas","Manter rede revisada","Refazer conexões instáveis","Manter ajustes provisórios","Reorganizar a rede com técnico","Continuar com quedas"],
 "neighborhood-paper":["Manter contato com jornal","Deixar matéria repercutir","Divulgar matéria no bairro","Manter divulgação discreta","Retomar contato com redação","Não participar da publicação"],
 "privacy-exposure":["Auditar todos os perfis","Manter limpeza de dados","Revisar demais máquinas","Limpar só após reclamação","Contratar limpeza completa","Ignorar outra exposição de dados"],
 "community-drive":["Organizar nova ação","Manter parceria","Reservar horários adicionais","Limitar colaboração","Procurar a associação","Não participar da iniciativa"],
 "school-uniform-policy":["Reunir escola e responsáveis","Manter avisos de horários","Formalizar orientação por escrito","Continuar conversas informais","Adotar regra com apoio da escola","Ignorar nova reclamação"],
 "gpu-games-2005":["Divulgar requisitos de hardware","Manter plano de comunicação","Testar interesse por títulos novos","Acompanhar as preferências","Retomar conversa com jogadores","Continuar com o catálogo atual"]
};
export const FOLLOWUP_KEYS=["consolidate","observe","complete","maintain","recover","persist"];
export const PERSISTENT_ESCALATIONS:Partial<Record<StoryChainId,StoryImpact>>={
 "roof-leak":{wear:18},"damaged-keyboard":{wear:16},"malware-incident":{wear:15,offlineMinutes:45},
 "missing-stock":{stock:{soda:-5,snacks:-3}},"late-supplier":{stock:{soda:-5,snacks:-5}},
 "local-network":{offlineMinutes:70},"unexpected-power-bill":{energyBill:90},
 "equipment-fault":{wear:18},"privacy-exposure":{visitors:.76,visitorDays:22},
 "neighbor-noise":{visitors:.74,visitorDays:18},"lost-document":{visitors:.80,visitorDays:18},
 "school-uniform-policy":{visitors:.78,visitorDays:16}
};
