/**
 * Cadeias autorais de acontecimentos do LHS: decisão -> efeito real -> retorno -> conclusão.
 * Cada história é única por partida. Nenhuma chamada ao RNG da simulação.
 */
import type {GameState,Result,Item} from "./types.js";
import type {GameNotice} from "./notices.js";
import {DAY_MINUTES} from "./types.js";
import {isHistorical,priceIndex,yearFromMinutes} from "./historicalEconomy.js";

export const STORY_IDS=[
 "roof-leak","neighbor-noise","damaged-keyboard","malware-incident",
 "missing-stock","unexpected-power-bill","late-supplier","lost-document",
 "local-network","neighborhood-paper","privacy-exposure","community-drive",
 "school-uniform-policy","gpu-games-2005"
] as const;
export type StoryId=typeof STORY_IDS[number];
export const LEGACY_CHAIN_IDS=["supplier-offer","school-booking","gaming-tournament","equipment-fault"] as const;
export const CHAIN_IDS=[...STORY_IDS,...LEGACY_CHAIN_IDS] as const;
export type StoryChainId=typeof CHAIN_IDS[number];
export type LegacyChainId=typeof LEGACY_CHAIN_IDS[number];
export type StoryNoticeId=StoryId|`${StoryChainId}:followup`|`${StoryChainId}:report`;
export type StoryOutcome="good"|"mixed"|"bad";
export interface StoryImpact {
 reputation?:number;
 wear?:number;
 stock?:Partial<Record<Item,number>>;
 offlineMinutes?:number;
 visitors?:number;
 visitorDays?:number;
 energyBill?:number;
}
export interface StoryChoice {
 id:string; label:string; cost:number; description:string;
 outcome:StoryOutcome; impact?:StoryImpact;
}
export interface StoryDefinition {
 title:string; body:string; category:"problem"|"opportunity";
 choices:[StoryChoice,StoryChoice,StoryChoice];
 developments:Record<StoryOutcome,string>;
}
export interface StoryRecord {
 id:StoryChainId;
 choice:string;
 choiceLabel?:string;
 outcome:StoryOutcome;
 stage:"pending"|"awaiting"|"ending"|"done";
 dueDay:number;
 followupChoice?:string;
 followupLabel?:string;
 finalOutcome?:StoryOutcome;
}
export interface StoryVisitorEffect {
 id:string; factor:number; untilDay:number;
}
const choice=(id:string,label:string,cost:number,description:string,outcome:StoryOutcome,impact?:StoryImpact):StoryChoice=>
 ({id,label,cost,description,outcome,impact});
const story=(title:string,body:string,category:StoryDefinition["category"],
 choices:StoryDefinition["choices"],good:string,mixed:string,bad:string):StoryDefinition=>
 ({title,body,category,choices,developments:{good,mixed,bad}});

/** Gastos são preços fictícios de design; no modelo histórico partem de ~1/10 em 1998. */
export const STORIES:Record<StoryId,StoryDefinition>={
 "roof-leak":story("Goteira perto dos computadores",
  "Depois de uma chuva, surgiram manchas e pingos perto das estações. O teto precisa de atenção antes de afetar os equipamentos.","problem",[
  choice("roof-professional","Contratar reparo do telhado",260,"Elimina a infiltração", "good",{reputation:1}),
  choice("roof-temporary","Instalar proteção provisória",85,"Contém a água, mas exige acompanhamento","mixed",{wear:2}),
  choice("roof-ignore","Deixar para depois",0,"A água pode atingir as máquinas","bad",{wear:12,reputation:-2})
 ],"O reparo resistiu à chuva seguinte. Os clientes perceberam o cuidado com o salão.",
 "A lona segurou parte da água, porém outra chuva revelou uma pequena abertura.",
 "A infiltração alcançou a área dos PCs; um computador começou a apresentar falhas."),
 "neighbor-noise":story("Reclamação de barulho dos vizinhos",
  "Moradores reclamam das comemorações e gritos dos clientes nas partidas. A relação com a vizinhança ficou delicada.","problem",[
  choice("noise-insulate","Instalar isolamento acústico",220,"Obra reduz o barulho e protege a convivência","good",{reputation:2,visitors:1.03,visitorDays:8}),
  choice("noise-rules","Estabelecer regras e avisos",45,"Clientes recebem orientação, mas exigem acompanhamento","mixed",{reputation:1}),
  choice("noise-ignore","Ignorar a reclamação",0,"Moradores podem registrar nova queixa","bad",{reputation:-3,visitors:.92,visitorDays:8})
 ],"Os vizinhos notaram o salão mais silencioso e agradeceram a mudança.",
 "Alguns jogadores respeitaram os avisos, mas houve novas discussões em horários movimentados.",
 "Uma segunda reclamação foi protocolada. Os vizinhos desaconselham o estabelecimento e a procura caiu."),
 "damaged-keyboard":story("Teclado quebrado depois de uma partida",
  "Um cliente irritado bateu no teclado de uma estação e várias teclas pararam de responder.","problem",[
  choice("keyboard-replace","Substituir o teclado",75,"Estação volta a funcionar sem improvisos","good",{reputation:1}),
  choice("keyboard-repair","Consertar o teclado",25,"Reparo rápido com risco de novo defeito","mixed",{wear:4}),
  choice("keyboard-charge","Cobrar o cliente e adiar a troca",0,"Pode gerar discussão e indisponibilidade","bad",{wear:14,reputation:-2})
 ],"Um teclado novo resolveu as reclamações na estação.",
 "O reparo funcionou inicialmente, mas algumas teclas voltaram a falhar.",
 "A discussão com o cliente piorou; outros visitantes começaram a reclamar do equipamento."),
 "malware-incident":story("Software malicioso em uma estação",
  "Um computador começou a apresentar janelas e travamentos após um arquivo suspeito ser executado.","problem",[
  choice("virus-specialist","Chamar técnico especializado",150,"Isola a estação, verifica o sistema e remove a ameaça","good",{reputation:1}),
  choice("virus-restore","Restaurar a estação",55,"Sistema retorna, mas ainda precisa de revisão","mixed",{wear:4}),
  choice("virus-ignore","Continuar usando o computador",0,"Travamentos podem se espalhar pela rotina","bad",{wear:20,offlineMinutes:30,reputation:-2})
 ],"O técnico confirmou a limpeza e os clientes voltaram a usar a estação.",
 "A restauração resolveu a maioria dos sintomas, mas surgiram novos avisos.",
 "Os travamentos voltaram durante o atendimento e os clientes perderam tempo de sessão."),
 "missing-stock":story("Diferença no estoque de mercadorias",
  "A contagem de refrigerantes, doces e salgadinhos não bate com as entradas. Pode ser erro de controle ou perda.","problem",[
  choice("stock-control","Implantar conferência e controle",95,"Reorganiza registros e inventário","good",{reputation:1}),
  choice("stock-count","Fazer contagem manual",20,"Descobre parte da diferença","mixed",{stock:{soda:-2}}),
  choice("stock-ignore","Aceitar a diferença sem investigar",0,"Produtos continuam desaparecendo","bad",{stock:{soda:-5,snacks:-3},reputation:-1})
 ],"O novo controle encontrou a origem dos erros, evitando novas perdas.",
 "A contagem melhorou as anotações, mas as entregas seguintes ainda tiveram diferenças.",
 "Novas unidades desapareceram; faltou produto para vender no horário de maior movimento."),
 "unexpected-power-bill":story("Conta de luz acima do esperado",
  "A cobrança de energia veio muito acima do padrão. Pode haver leitura incorreta ou desperdício no salão.","problem",[
  choice("bill-electrician","Solicitar auditoria de consumo",135,"Profissional revisa medição e uso elétrico","good",{reputation:1}),
  choice("bill-contest","Contestar a fatura",35,"A concessionária fará reavaliação","mixed",{}),
  choice("bill-ignore","Pagar sem conferir a causa",90,"A origem do custo permanece desconhecida","bad",{reputation:-1})
 ],"A revisão encontrou desperdícios e reduziu a exposição a novas cobranças.",
 "A contestação teve resposta parcial; será preciso apresentar informações adicionais.",
 "A fatura seguinte trouxe outra diferença, comprometendo o orçamento do estabelecimento."),
 "late-supplier":story("Entrega atrasada do fornecedor",
  "O distribuidor não entregou as bebidas e os salgadinhos combinados. O balcão pode ficar desabastecido.","problem",[
  choice("supplier-backup","Comprar lote de emergência",140,"Mercadorias repostas de imediato","good",{stock:{soda:10,snacks:8}}),
  choice("supplier-negotiate","Cobrar prazo e compensação",15,"Entrega pode chegar incompleta","mixed",{stock:{soda:3}}),
  choice("supplier-wait","Esperar sem tomar providências",0,"Prateleiras podem ficar vazias","bad",{stock:{soda:-5,snacks:-4},reputation:-2})
 ],"O fornecedor alternativo cumpriu o combinado e o balcão passou pelo movimento sem falta.",
 "O fornecedor entregou apenas uma parte do pedido e prometeu completar a remessa.",
 "O atraso continuou e alguns clientes saíram sem encontrar os produtos que queriam."),
 "lost-document":story("Cliente perdeu um trabalho importante",
  "Uma máquina travou durante uma atividade e o cliente diz ter perdido horas de trabalho.","problem",[
  choice("document-refund","Devolver o valor e oferecer ajuda",45,"Acolhe a reclamação e revisa a máquina","good",{reputation:2}),
  choice("document-extra","Oferecer sessão gratuita",20,"Compensa parte do transtorno","mixed",{reputation:1}),
  choice("document-refuse","Recusar qualquer compensação",0,"Conflito pode se tornar público","bad",{reputation:-4,visitors:.94,visitorDays:7})
 ],"O cliente aceitou a ajuda e voltou depois para agradecer.",
 "O cliente aceitou o crédito, mas ainda está preocupado com o conteúdo perdido.",
 "O cliente contou o caso a conhecidos, gerando críticas ao atendimento da lan house."),
 "local-network":story("Rede local dos PCs instável",
  "Computadores deixaram de se comunicar direito; jogos e serviços em rede começaram a falhar.","problem",[
  choice("lan-technician","Contratar técnico de redes",145,"Reorganiza cabos e testa conectividade","good",{reputation:1}),
  choice("lan-restart","Reconfigurar a rede",50,"Melhora temporariamente a conectividade","mixed",{offlineMinutes:8}),
  choice("lan-ignore","Ignorar as falhas de rede",0,"Mais sessões podem ser interrompidas","bad",{offlineMinutes:55,reputation:-3,visitors:.93,visitorDays:6})
 ],"Os computadores voltaram a se comunicar de forma estável.",
 "Uma parte das máquinas funciona, mas as partidas em rede ainda sofrem quedas.",
 "A falha atingiu mais sessões, causando abandono e reclamações de clientes."),
 "neighborhood-paper":story("O jornal do bairro quer uma entrevista",
  "Um jornalista ouviu falar da lan house e oferece uma matéria sobre o negócio.","opportunity",[
  choice("paper-invest","Preparar evento para a reportagem",110,"Boa apresentação aumenta a visibilidade","good",{reputation:2,visitors:1.13,visitorDays:12}),
  choice("paper-talk","Conceder entrevista simples",0,"Divulgação espontânea e discreta","mixed",{reputation:1,visitors:1.05,visitorDays:6}),
  choice("paper-refuse","Recusar a entrevista",0,"O jornal buscará outras pautas","bad",{})
 ],"A matéria destacou a organização do salão e trouxe novos curiosos.",
 "A reportagem citou a lan house, mas a repercussão foi moderada.",
 "O jornal publicou outras histórias e uma oportunidade de divulgação se perdeu."),
 "privacy-exposure":story("Dados pessoais ficaram no computador",
  "Uma pessoa encontrou arquivos pessoais do cliente anterior. A configuração das estações precisa de revisão.","problem",[
  choice("privacy-specialist","Contratar revisão profissional",185,"Limpa perfis e configura proteção das estações","good",{reputation:2}),
  choice("privacy-clean","Fazer limpeza assistida dos perfis",65,"Reduz o problema, mas requer acompanhamento","mixed",{reputation:1}),
  choice("privacy-ignore","Minimizar a reclamação",0,"Clientes podem deixar de confiar no estabelecimento","bad",{reputation:-5,visitors:.87,visitorDays:12})
 ],"O cliente foi informado das medidas tomadas e a confiança começou a voltar.",
 "A limpeza removeu arquivos antigos, mas outra estação apresentou configuração parecida.",
 "Outro cliente encontrou arquivos esquecidos e a notícia afetou a reputação do salão."),
 "school-uniform-policy":story("2004: alunos de uniforme durante as aulas",
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
 "A escola voltou a procurar Tony: responsáveis reclamaram que estudantes seguem faltando às aulas."),
 "gpu-games-2005":story("2005: jogos avançados pedem placa de vídeo",
  "Alguns lançamentos já exigem placa de vídeo dedicada e um Windows compatível e licenciado. Tony percebeu que pode atrair um novo público, mas anunciar esses jogos não os instala: para licenciar um título avançado, a lan house precisa ter ao menos um computador com GPU e Windows adequados. Como se preparar?", "opportunity",[
  choice("gpu-plan", "Preparar divulgação para a nova geração", 90,
   "Planeja a comunicação sem comprar placas nem licenças automaticamente","good",
   {reputation:1,visitors:1.06,visitorDays:8}),
  choice("gpu-survey", "Pesquisar interesse dos clientes", 20,
   "Escuta os jogadores antes de investir em máquinas e contratos","mixed",
   {reputation:1,visitors:1.02,visitorDays:5}),
  choice("gpu-defer", "Adiar a entrada nos jogos avançados", 0,
   "Mantém o catálogo atual, sem cobrança nem punição por esperar","bad",{})
 ],"O plano de divulgação encontrou jogadores interessados. Para atendê-los, ainda será preciso instalar GPU e Windows compatíveis e comprar as licenças.",
 "A pesquisa mostrou curiosidade por jogos novos, mas os clientes querem saber quando haverá PCs preparados.",
 "Tony preferiu manter os jogos disponíveis. O novo segmento seguirá como uma possibilidade futura, sem obrigação de compra."),
 "community-drive":story("Associação pede computadores para uma ação social",
  "Uma associação do bairro quer utilizar algumas horas de computador para ajudar moradores.","opportunity",[
  choice("community-donate","Ceder horas gratuitas",65,"Apoio comunitário fortalece os laços do bairro","good",{reputation:3,visitors:1.07,visitorDays:10}),
  choice("community-discount","Oferecer desconto para o grupo",25,"Ajuda parcial, mantendo parte do atendimento","mixed",{reputation:1}),
  choice("community-decline","Não participar desta vez",0,"A ação procura outro local","bad",{})
 ],"A associação enviou um agradecimento e moradores passaram a recomendar a lan house.",
 "A atividade aconteceu em escala menor; alguns participantes pediram novos horários.",
 "A iniciativa foi realizada em outro lugar. Parte do bairro sentiu falta da participação da lan house.")
};
/** As quatro propostas antigas também recebem desdobramentos sem alterar seu efeito inicial. */
const LEGACY_STORIES:Record<LegacyChainId,Pick<StoryDefinition,"title"|"category"|"developments">>={
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
/** Seis ações contextuais por história: consolidar, observar, completar, manter, recuperar, ignorar. */
const FOLLOWUP_LABELS:Record<StoryId,readonly string[]>={
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
const FOLLOWUP_KEYS=["consolidate","observe","complete","maintain","recover","persist"];
const PERSISTENT_ESCALATIONS:Partial<Record<StoryChainId,StoryImpact>>={
 "roof-leak":{wear:18},"damaged-keyboard":{wear:16},"malware-incident":{wear:15,offlineMinutes:45},
 "missing-stock":{stock:{soda:-5,snacks:-3}},"late-supplier":{stock:{soda:-5,snacks:-5}},
 "local-network":{offlineMinutes:70},"unexpected-power-bill":{energyBill:90},
 "equipment-fault":{wear:18},"privacy-exposure":{visitors:.76,visitorDays:22},
 "neighbor-noise":{visitors:.74,visitorDays:18},"lost-document":{visitors:.80,visitorDays:18},
 "school-uniform-policy":{visitors:.78,visitorDays:16}
};
const chainDefinition=(id:StoryChainId)=>isStoryId(id)?STORIES[id]:LEGACY_STORIES[id];
export const isChainId=(id:string):id is StoryChainId=>(CHAIN_IDS as readonly string[]).includes(id);
export function registerLegacyStory(s:GameState,id:string,choiceId:string,choiceLabel?:string):void{
 if(!(LEGACY_CHAIN_IDS as readonly string[]).includes(id))return;
 const key=id as LegacyChainId;
 if((s.storyRecords??[]).some(r=>r.id===key))return;
 const outcomes:Record<LegacyChainId,Record<string,StoryOutcome>>={
  "supplier-offer":{"supplier-accept":"good","supplier-decline":"mixed"},
  "school-booking":{"school-accept":"good","school-decline":"mixed"},
  "gaming-tournament":{"tournament-host":"good","tournament-small":"mixed","tournament-decline":"bad"},
  "equipment-fault":{"fault-express":"good","fault-basic":"mixed","fault-delay":"bad"}
 };
 const outcome=outcomes[key][choiceId];
 if(!outcome)return;
 (s.storyRecords??=[]).push({id:key,choice:choiceId,choiceLabel,outcome,stage:"pending",dueDay:DAY(s)+2+((s.rng>>>6)%4)});
}
const DAY=(s:GameState)=>Math.floor(s.totalMinutes/DAY_MINUTES)+1;
export function isStoryId(id:string):id is StoryId{return Object.prototype.hasOwnProperty.call(STORIES,id);}
export function isStoryNoticeId(id:string):id is StoryNoticeId{
 return isStoryId(id)||((id.endsWith(":followup")||id.endsWith(":report"))&&isChainId(id.replace(/:(followup|report)$/,"")));
}
const actualCost=(s:GameState,base:number)=>isHistorical(s)?Math.round(base/10*priceIndex(yearFromMinutes(s.totalMinutes))*100)/100:base;
const money=(cost:number)=>"R$ "+cost.toFixed(2).replace(".",",");
function recordFor(s:GameState,id:StoryChainId):StoryRecord|undefined{
 return s.storyRecords?.find(record=>record.id===id);
}
/** Regra do saldo nunca aceita duas execuções de uma decisão já resolvida. */
function purchase(s:GameState,cost:number):boolean{
 if(cost<=0)return true; // Permite decidir gratuitamente mesmo com caixa negativo.
 if(s.cash<cost)return false;
 s.cash=Math.round((s.cash-cost)*100)/100;
 s.expenses=Math.round((s.expenses+cost)*100)/100;
 return true;
}
function applyImpact(s:GameState,id:string,impact:StoryImpact|undefined):void{
 if(!impact)return;
 if(impact.reputation)s.reputation=Math.max(10,Math.min(100,s.reputation+impact.reputation));
 if(impact.wear){
  const count=Math.max(3,Math.min(3+s.expansionLevel*2,s.installedPcs??3+s.expansionLevel*2))+(s.annexPcs?.length??0);
  s.pcWear=Array.from({length:count},(_,i)=>Math.max(0,Math.min(100,(s.pcWear?.[i]??0)+impact.wear!)));
 }
 if(impact.stock)for(const item of ["soda","candy","snacks"] as Item[]){
  const change=impact.stock[item]??0;
  s.inventory[item]=Math.max(0,s.inventory[item]+change);
 }
 if(impact.offlineMinutes)s.offlineUntil=Math.max(s.offlineUntil,s.totalMinutes+impact.offlineMinutes);
 if(impact.energyBill)s.energyAccrued=(s.energyAccrued??0)+actualCost(s,impact.energyBill);
 if(impact.visitors&&impact.visitorDays){
  // Efeito econômico concreto, expirável e serializável; não altera RNG.
  const effects=s.storyVisitorEffects??(s.storyVisitorEffects=[]);
  const untilDay=DAY(s)+impact.visitorDays;
  const existing=effects.findIndex(effect=>effect.id===id);
  if(existing>=0)effects.splice(existing,1);
  effects.push({id,factor:impact.visitors,untilDay});
  if(effects.length>32)effects.splice(0,effects.length-32);
 }
}
export function storyVisitorMultiplier(s:GameState):number {
 const day=DAY(s);
 const active=(s.storyVisitorEffects??[]).filter(e=>e.untilDay>=day);
 return Math.max(.55,Math.min(1.4,active.reduce((factor,e)=>factor*e.factor,1)));
}
export function storyOptions(s:GameState,id:string):Array<{id:string;label:string;cost:number;description:string}>{
 if(isStoryId(id))return STORIES[id].choices.map(o=>({...o,cost:actualCost(s,o.cost),
  label:o.cost?o.label+" · "+money(actualCost(s,o.cost)):o.label}));
 if(!id.endsWith(":followup"))return [];
 const storyId=id.slice(0,-":followup".length);
 if(!isChainId(storyId))return [];
 const r=recordFor(s,storyId);
 if(!r||r.stage!=="awaiting")return [];
 if(r.outcome==="bad"&&chainDefinition(storyId).category==="opportunity")return [
  {id:"story-reconnect",label:"Retomar contato · "+money(actualCost(s,40)),cost:actualCost(s,40),description:"Tenta recuperar a oportunidade de divulgação ou parceria"},
  {id:"story-let-go",label:"Encerrar o assunto",cost:0,description:"Sem punição por recusar uma parceria opcional"}
 ];
 // Duas ações reais no retorno; o estado criado pela escolha anterior muda as alternativas.
 const outcomes:Record<StoryOutcome,Array<[string,string,number,string]>>={
  good:[["consolidate","Consolidar a melhoria",65,"Novo investimento melhora a confiança e atrai clientes"],
        ["observe","Manter a solução atual",0,"Preserva os benefícios já conquistados"]],
  mixed:[["complete","Finalizar a correção",90,"Resolve a pendência e recupera confiança"],
         ["maintain","Continuar monitorando",0,"Risco residual de desgaste e perda de procura"]],
  bad:[["recover","Corrigir depois do agravamento",170,"Intervenção tardia reduz os danos"],
       ["persist","Continuar ignorando",0,"Prejuízo adicional e perda de confiança"]]
 };
 return outcomes[r.outcome].map(([choiceId,label,baseCost,description])=>
  ({id:"story-"+choiceId,
   label:(isStoryId(storyId)?FOLLOWUP_LABELS[storyId][FOLLOWUP_KEYS.indexOf(choiceId)]??label:label)+
     (baseCost?" · "+money(actualCost(s,baseCost)):""),
   cost:actualCost(s,baseCost),description}));
}
export function chooseStory(s:GameState,noticeId:string,choiceId:string):Result{
 const n=s.notices?.find(x=>x.id===noticeId);
 if(!n||n.resolved)return {ok:false,message:"Esta carta não está disponível ou já foi concluída."};
 if(isStoryId(noticeId)){
  if(recordFor(s,noticeId))return {ok:false,message:"Esta história já começou."};
  const c=STORIES[noticeId].choices.find(x=>x.id===choiceId);
  if(!c)return {ok:false,message:"Opção desconhecida."};
  const cost=actualCost(s,c.cost);
  if(!purchase(s,cost))return {ok:false,message:"Caixa insuficiente: "+money(cost)+"."};
  applyImpact(s,noticeId+":start",c.impact);
  (s.storyRecords??=[]).push({id:noticeId,choice:c.id,choiceLabel:c.label,outcome:c.outcome,
   stage:"pending",dueDay:DAY(s)+2+((s.rng>>>5)%4)});
  if(!(s.storySeenIds??=[]).includes(noticeId))s.storySeenIds.push(noticeId);
  n.resolved=c.id;n.read=true;
  s.eventLog.unshift("D"+DAY(s)+" · "+STORIES[noticeId].title+": "+c.label+". Uma resposta chegará depois.");
  s.eventLog.splice(14);
  return {ok:true,message:"Decisão registrada. "+c.description+". Haverá um desdobramento."};
 }
 if(!noticeId.endsWith(":followup"))return {ok:false,message:"Carta sem alternativas."};
 const base=noticeId.slice(0,-":followup".length);
 if(!isChainId(base))return {ok:false,message:"História desconhecida."};
 const record=recordFor(s,base);
 if(!record||record.stage!=="awaiting")return {ok:false,message:"Desdobramento indisponível."};
 const option=storyOptions(s,noticeId).find(o=>o.id===choiceId);
 if(!option)return {ok:false,message:"Opção desconhecida."};
 if(!purchase(s,option.cost))return {ok:false,message:"Caixa insuficiente: "+money(option.cost)+"."};
 const kind=choiceId.slice("story-".length);
 let impact:StoryImpact;
 let ending:string;
 if(kind==="reconnect"){impact={reputation:1,visitors:1.04,visitorDays:7};ending="A parceria foi retomada de forma modesta." ;}
 else if(kind==="let-go"){impact={};ending="A parceria não seguiu adiante, sem prejudicar a lan house." ;}
 else if(kind==="consolidate"){impact={reputation:2,visitors:1.08,visitorDays:12};ending="Investimento consolidado; o bairro percebe a melhoria.";}
 else if(kind==="observe"){impact={reputation:1};ending="Medida preservada sem novo gasto; os benefícios já obtidos permanecem.";}
 else if(kind==="complete"){impact={reputation:2,visitors:1.05,visitorDays:8};ending="Pendência finalmente resolvida; a confiança começou a se recuperar.";}
 else if(kind==="maintain"){impact={reputation:-1,wear:3,visitors:.97,visitorDays:9};ending="A solução parcial deixou custos e preocupação para o proprietário.";}
 else if(kind==="recover"){impact={reputation:1,visitors:1.02,visitorDays:7};ending="Correção tardia concluída, mas os danos anteriores não são desfeitos.";}
 else if(kind==="persist"){impact={reputation:-5,visitors:.82,visitorDays:18,...(PERSISTENT_ESCALATIONS[base]??{})};ending="O problema se agravou. Clientes comentam a situação e a procura cai por vários dias.";}
 else return {ok:false,message:"Opção desconhecida."};
 applyImpact(s,base+":followup",impact);
 record.stage="ending";record.followupChoice=choiceId;record.followupLabel=option.label;record.finalOutcome=kind==="persist"?"bad":kind==="maintain"?"mixed":kind==="let-go"?"mixed":"good";
 record.dueDay=DAY(s)+2+((s.rng>>>9)%3);
 n.resolved=choiceId;n.read=true;
 n.severity=record.finalOutcome==="bad"?"urgent":"info";
 s.eventLog.unshift("D"+DAY(s)+" · "+chainDefinition(base).title+": "+ending);
 s.eventLog.splice(14);
 return {ok:true,message:ending+" A conclusão será registrada na correspondência."};
}
function send(s:GameState,id:StoryNoticeId,title:string,body:string,severity:GameNotice["severity"]):void{
 const list=s.notices??(s.notices=[]);
 if(list.some(n=>n.id===id))return;
 list.unshift({id,title,body,day:DAY(s),read:false,severity});
 if(list.length>40)list.length=40;
 s.eventLog.unshift("D"+DAY(s)+" · Carta: "+title);
 s.eventLog.splice(14);
}
export function processStoryFollowups(s:GameState):void{
 const today=DAY(s);
 // A fila é independente do sorteio de novas propostas e não consome RNG.
 for(const record of s.storyRecords??[]){
  if(record.dueDay>today)continue;
  const def=chainDefinition(record.id);
  if(record.stage==="pending"){
   send(s,`${record.id}:followup`,"Desdobramento: "+def.title,def.developments[record.outcome]+
    " Sua decisão teve consequências. Como deseja responder agora?",record.outcome==="bad"?"urgent":"warning");
   record.stage="awaiting";
  }else if(record.stage==="ending"){
   const outcomes:Record<StoryOutcome,string>={
    good:"A situação foi acompanhada nos dias seguintes e está estabilizada. Seu investimento ou cuidado gerou resultado.",
    mixed:"O episódio terminou com pendências e gastos indiretos. A decisão teve reflexo na administração.",
    bad:"A ocorrência deixou consequências para os equipamentos e para a confiança do bairro. A queda de procura será temporária, mas real."
   };
   send(s,`${record.id}:report`,"Conclusão: "+def.title,
    "Sua primeira decisão: "+(record.choiceLabel??record.choice)+". Depois: "+(record.followupLabel??record.followupChoice??"sem resposta")+". "+outcomes[record.finalOutcome??"mixed"],
    record.finalOutcome==="bad"?"warning":"info");
   const n=s.notices?.find(x=>x.id===`${record.id}:report`);
   if(n)n.resolved="summary";
   record.stage="done";
  }
 }
}
export function storySeen(s:GameState,id:StoryId):boolean{
 return (s.storySeenIds??[]).includes(id)||(s.storyRecords??[]).some(r=>r.id===id);
}
