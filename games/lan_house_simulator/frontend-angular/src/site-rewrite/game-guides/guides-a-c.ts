import type {GameGuide} from './guide-types';

export const guidesAC:readonly GameGuide[]=[
 {
  number:1,
  id:'001',
  slug:'primeiros-passos-na-lan-house',
  path:'/sobre-o-jogo/guias/001-primeiros-passos-na-lan-house/',
  groupCode:'A',
  groupTitle:'Primeiros passos e rotina do salão',
  title:'Primeiros passos: abrindo sua lan house em 1998',
  summary:'Entenda o caixa inicial de R$ 850, os três primeiros computadores CRT, o papel do Tony atrás do balcão e o que priorizar no primeiro mês.',
  unlockBadge:'Disponível desde 1998 (Dia 1)',
  uiPath:'Menu principal → Abrir minha lan house →',
  whatIs:[
   'O início da campanha em Lan House Simulator coloca você no comando de um pequeno salão de bairro no dia 01/01/1998, às 10:00 da manhã. Você assume a gestão ao lado de Tony, o proprietário que permanece atrás do balcão recebendo os moradores, cobrando as sessões, entregando impressões, gravando mídias e atendendo o carteiro.',
   'A partida começa com R$ 850,00 em caixa, reputação inicial de 75 pontos, internet discada ativa, duas lixeiras vazias, estoque inicial de lanches (12 bebidas, 15 doces e 10 salgadinhos) e três computadores CRT de primeira geração alinhados na parede do fundo.'
  ],
  whyItMatters:[
   'As decisões dos primeiros 30 dias definem se o salão terá fôlego financeiro quando chegar o primeiro fechamento mensal no Dia 31 (que soma cerca de R$ 540,00 entre aluguel, internet, manutenção e energia elétrica).',
   'Gastar todo o caixa de R$ 850,00 logo no primeiro dia comprando decoração ou equipamentos caros pode deixar você sem reserva para pagar as contas do mês ou responder a uma vistoria de licenças no Correio.'
  ],
  whenAvailable:[
   'Disponível imediatamente ao acessar o jogo em /game/ e clicar no botão principal Abrir minha lan house → (que inicia a campanha no modo de economia histórica, percorrendo de 1998 até o fim de 2030).',
   'Se você já tiver uma partida salva neste navegador, o botão Continuar partida retoma exatamente do ponto em que você parou.'
  ],
  howToUse:[
   'Na tela inicial do jogo, clique em Abrir minha lan house → para começar no Dia 1 (01/01/1998) com R$ 850,00.',
   'Observe os três computadores iniciais: todos já vêm ligados, com processador Bairro 350 (350 MHz), 64 MB de RAM SDRAM, HD IDE de 4 GB, placa-mãe Bairro BX · Slot 1, fonte de 350 W e Windows 98 preinstalado (porém ainda sem licença paga adquirida).',
   'Clique no botão Administrar no topo da tela — ou clique diretamente no Tony atrás do balcão — e abra a aba Preços para conferir a tarifa inicial de R$ 2,50 por hora.',
   'Acompanhe a entrada dos primeiros clientes pela porta da direita: eles entram na fila do balcão, pagam a sessão adiantado para o Tony e seguem até o computador livre.',
   'Fique atento ao botão Correio na barra superior sempre que o contador indicar novas cartas, pois avisos de fiscalização e novidades do bairro chegam por lá.'
  ],
  whatHappensNext:[
   'Com os três PCs ligados e abastecidos, o salão começa a gerar receita desde a primeira manhã. Cada cliente atendido no balcão soma dinheiro imediatamente ao caixa e ocupa um computador pelo pacote contratado.',
   'Ao longo das primeiras semanas, os computadores acumulam um pequeno percentual de desgaste a cada minuto de uso, os clientes consomem refrigerantes, doces e salgadinhos após as sessões e as lixeiras começam a encher.'
  ],
  costsAndLimits:[
   'Caixa inicial da campanha: R$ 850,00.',
   'Capacidade inicial da área principal: 3 computadores (PC 1, PC 2 e PC 3).',
   'Estoque inicial gratuito: 12 bebidas na geladeira, 15 doces na máquina e 10 salgadinhos na prateleira.',
   'Contas fixas do primeiro mês (cobradas na virada para o Dia 31): R$ 270,00 de aluguel, R$ 110,00 de internet discada, R$ 75,00 de manutenção predial e cerca de R$ 85,00 de energia acumulada (total aproximado de R$ 540,00).',
   'Duração total da campanha histórica: 33 anos (de 01/01/1998 a 30/12/2030, com 12 meses de 30 dias por ano).'
  ],
  table:{
   caption:'Condições iniciais da campanha em 01/01/1998',
   headers:['Item inicial','Situação no Dia 1','Observação importante'],
   rows:[
    ['Caixa disponível','R$ 850,00','Mantenha reserva para as contas do Dia 31 (~R$ 540,00)'],
    ['Computadores instalados','3 PCs CRT (Nível 1)','Bairro 350 MHz, 64 MB SDRAM, HD 4 GB, Fonte 350 W'],
    ['Sistema operacional','Windows 98 preinstalado','Funciona no Dia 1, mas exige licença paga (R$ 120/PC) para jogos e fiscalização'],
    ['Tarifa horária inicial','R$ 2,50 / hora','Pode ser ajustada até o teto de R$ 3,00/h em 1998'],
    ['Estoque de varejo','12 bebidas, 15 doces, 10 salgados','Vendido automaticamente quando os clientes sentem sede ou fome'],
    ['Reputação do salão','75 pontos (escala de 10 a 100)','Sobe com bom atendimento e cai com filas longas ou sujeira']
   ]
  },
  commonProblems:[
   {
    problem:'Gastei quase todo o dinheiro no primeiro dia e fiquei no negativo ao virar o mês.',
    solution:'As contas mensais são debitadas de uma só vez a cada 30 dias (nos dias 31, 61, 91 e assim por diante). Antes de comprar novos móveis ou licenças caras, consulte Administrar → Finanças → Caixa e contas para ver o valor exato da próxima cobrança mensal.'
   },
   {
    problem:'Tentei comprar um jogo clássico de 1998, mas o botão continua bloqueado.',
    solution:'Os jogos de PC exigem duas etapas: primeiro comprar a Regularização básica de jogos (R$ 450,00 em Administrar → Serviços → Internet e contrato) e ter pelo menos 1 computador com licença paga do Windows 98 instalada.'
   },
   {
    problem:'Usei o botão Reiniciar dentro de Administrar → Finanças e os preços ficaram diferentes.',
    solution:'O botão Reiniciar partida na aba Finanças cria uma campanha no modo clássico legado (tarifa inicial de R$ 12/h). Se quiser voltar à economia histórica corrigida pelo IPCA, clique em Ativar economia histórica neste save clássico na aba Administrar → Preços ou inicie a partida pelo Menu ESC → Abrir minha lan house.'
   }
  ],
  playerTips:[
   'No primeiro dia, você pode ajustar a tarifa em Administrar → Preços de R$ 2,50/h para R$ 2,75/h ou R$ 3,00/h sem assustar a clientela do bairro, aumentando sua margem desde cedo.',
   'Priorize licenciar o Windows 98 em pelo menos um computador (R$ 120,00) quando tiver folga no caixa, lembrando que a instalação leva 10 minutos reais com o PC desligado.',
   'Não contrate faxineiro nem técnico fixo na primeira semana: com apenas 3 PCs, é mais barato chamar o serviço avulso apenas quando as lixeiras passarem de 60% ou quando um PC estiver com desgaste alto.'
  ],
  relatedIds:['002','003','004','029']
 },
 {
  number:2,
  id:'002',
  slug:'expediente-horario-e-ritmo-do-dia',
  path:'/sobre-o-jogo/guias/002-expediente-horario-e-ritmo-do-dia/',
  groupCode:'A',
  groupTitle:'Primeiros passos e rotina do salão',
  title:'Expediente, relógio do salão e fechamento diário',
  summary:'Veja como funciona a jornada das 10:00 às 22:00, o horário limite de entrada, o encerramento gradual das sessões, o clima e a pausa do jogo.',
  unlockBadge:'Disponível desde 1998 (Dia 1)',
  uiPath:'Barra superior · Relógio do salão e Menu ESC',
  whatIs:[
   'Cada dia de trabalho na lan house começa às 10:00 da manhã e termina às 22:00 da noite, totalizando 12 horas de expediente (720 minutos no relógio do jogo). O calendário usa meses padronizados de 30 dias e anos de 360 dias.',
   'O relógio avança em ritmo constante de 4 minutos do jogo para cada 1 segundo real. Isso significa que 1 hora dentro do salão dura 15 segundos reais, e um dia inteiro de expediente dura exatamente 3 minutos reais.'
  ],
  whyItMatters:[
   'Compreender as fases do fim da noite evita que você estranhe quando os clientes param de entrar após as 20:30 ou quando o balcão recusa novas sessões a partir das 21:00.',
   'Além disso, saber quais janelas pausam — e quais não pausam — o relógio impede que você perca o horário de fechamento enquanto navega pelos relatórios.'
  ],
  whenAvailable:[
   'O ciclo diário das 10:00 às 22:00 funciona desde o Dia 1 de 1998 em todas as partidas.',
   'A única exceção ocorre quando você agenda o Corujão na primeira sexta-feira do mês (a partir de 2001): nesse dia, às 22:00 de sexta começa o turno especial da madrugada que vai até sábado às 10:00.'
  ],
  howToUse:[
   'Acompanhe a data, o dia da semana, o horário atual e o clima (Tempo firme ou Chuva) na barra de status superior.',
   'Para pausar completamente a passagem do tempo no salão, clique no botão Menu ESC no topo da tela (ou pressione a tecla ESC quando nenhum painel estiver aberto).',
   'O tempo também pausa automaticamente enquanto você estiver com a janela 🍪 Minha Conta aberta ou enquanto estiver posicionando objetos e divisórias no modo Organizar salão.',
   'Lembre-se de que abrir os painéis Administrar, Compras ou Correio NÃO pausa o relógio do expediente: os minutos continuam avançando em segundo plano enquanto você consulta preços ou lê cartas.'
  ],
  whatHappensNext:[
   'Ao atingir 20:30, a porta de entrada fecha para novos visitantes. Às 21:00 começa o fechamento gradual: a fila do balcão e as compras nas máquinas de lanche são encerradas, e clientes sem sessão ativa começam a sair aos poucos.',
   'Às 21:30 todas as sessões em andamento nos PCs e videogames são finalizadas. Às 22:00 o expediente encerra, o clima do dia seguinte é sorteado (27% de chance de chuva) e o relógio salta para as 10:00 da manhã seguinte.'
  ],
  costsAndLimits:[
   'Velocidade fixa do relógio: 4 minutos do jogo por segundo real (não existem botões de aceleração 2x ou 4x).',
   '10:00 às 20:30: janela de chegada de novos clientes na porta.',
   '21:00: horário limite para o Tony iniciar qualquer sessão no balcão (pois toda sessão exige no mínimo 30 minutos antes das 21:30).',
   '21:30: encerramento obrigatório de todas as máquinas para saída dos últimos clientes.',
   'Efeito de dias de chuva (27% dos dias): reduz em 20% o fluxo natural de chegada de visitantes na porta.'
  ],
  table:{
   caption:'Etapas diárias do expediente no salão',
   headers:['Horário no jogo','Etapa do expediente','Comportamento do salão'],
   rows:[
    ['10:00','Abertura do dia','Salão abre as portas; no Dia 31, 61, 91... desconta as contas mensais'],
    ['10:00 – 20:30','Admissão normal','Visitantes entram pela porta conforme reputação, preço, clima e jogos'],
    ['20:30','Última entrada','Novos visitantes deixam de entrar na lan house'],
    ['21:00','Preparação de fechamento','Balcão não inicia novas sessões; fila e compras de lanches encerram'],
    ['21:30','Fim das sessões','Clientes ainda sentados encerram o uso e caminham até a saída'],
    ['22:00','Virada do dia','Inicia o Corujão (se agendado na 1ª sexta) ou avança para 10:00 do dia seguinte']
   ]
  },
  commonProblems:[
   {
    problem:'Deixei o painel Administrar aberto enquanto lia as abas e o dia acabou sozinho.',
    solution:'Os painéis Administrar, Compras e Correio mantêm a simulação rodando para que downloads de jogos, técnicos e sessões continuem avançando. Se precisar parar o tempo para planejar com calma, abra o Menu ESC.'
   },
   {
    problem:'Um cliente chegou ao balcão pouco depois das 21:00 e foi embora sem usar o PC.',
    solution:'O pacote mínimo de sessão dura 30 minutos e todas as máquinas desligam o atendimento às 21:30. Por isso, quem alcança o balcão após as 21:00 não tem tempo hábil para iniciar uma sessão.'
   }
  ],
  playerTips:[
   'Aproveite o horário entre 21:30 e 22:00 — quando os últimos clientes já se levantaram das cadeiras — para desligar um computador que precise de upgrade de peças ou instalação de Windows.',
   'Nos dias de chuva, o movimento na porta é 20% menor: é um ótimo momento para realizar manutenção preventiva nos computadores sem formar fila no balcão.'
  ],
  relatedIds:['001','003','010','036']
 },
 {
  number:3,
  id:'003',
  slug:'atendimento-no-balcao-e-fluxo-de-caixa',
  path:'/sobre-o-jogo/guias/003-atendimento-no-balcao-e-fluxo-de-caixa/',
  groupCode:'A',
  groupTitle:'Primeiros passos e rotina do salão',
  title:'Atendimento no balcão e como o dinheiro entra no caixa',
  summary:'Acompanhe o caminho do cliente desde a porta até a cadeira, o pagamento antecipado no balcão e as receitas extras de lanches e serviços.',
  unlockBadge:'Disponível desde 1998 (Dia 1)',
  uiPath:'Balcão de atendimento · Administrar → Finanças',
  whatIs:[
   'Todo o faturamento de sessões, impressões e gravações de discos passa pelo balcão de atendimento comandado por Tony, no canto superior esquerdo do salão. Os clientes entram pela porta, formam uma fila de até 6 pessoas e são atendidos um por vez.',
   'Cada atendimento no balcão dura 3 minutos do jogo. O pagamento da sessão é sempre antecipado: o dinheiro entra no seu caixa no exato momento em que o Tony conclui o atendimento no balcão, antes mesmo de o cliente sentar no computador ou no videogame.'
  ],
  whyItMatters:[
   'Como o pagamento ocorre na frente do balcão, manter pelo menos uma estação livre e compatível com o pedido do cliente faz a fila girar rápido e o caixa subir imediatamente.',
   'Se todos os computadores estiverem ocupados ou desligados, o primeiro cliente da fila fica aguardando vaga e trava quem está atrás; se o tempo de espera ultrapassar o limite de paciência dele, ele desiste e derruba sua reputação.'
  ],
  whenAvailable:[
   'O atendimento de sessões e a venda automática de lanches funcionam desde o Dia 1 (01/01/1998).',
   'Os pedidos extras no balcão passam a ocorrer assim que você compra a Impressora de balcão (R$ 320,00) ou a Copiadora de CD e DVD (R$ 900,00) na loja.'
  ],
  howToUse:[
   'Mantenha computadores ligados, em bom estado (abaixo de 100% de desgaste) e com caminho livre entre o balcão e as cadeiras.',
   'Observe o cliente chegar ao primeiro lugar da fila: Tony leva 3 minutos do jogo para atendê-lo e escolher um pacote entre 30, 45, 60, 90, 120, 180 ou 240 minutos, de acordo com o dinheiro na carteira do visitante e o horário restante do dia.',
   'Se você tiver impressora ou copiadora instalada e funcionando, o próprio cliente de sessão pode aproveitar o atendimento no balcão para pagar páginas impressas ou cópias de mídia junto com a sessão.',
   'Após usar o computador (3 minutos sentando + tempo contratado + 3 minutos levantando), clientes com sede ou fome caminham até a máquina de refrigerante, a máquina de doces ou a prateleira de salgadinhos, onde o valor do produto entra no caixa no ato da retirada.'
  ],
  whatHappensNext:[
   'Depois de pagar no balcão, a receita é registrada tanto no caixa geral quanto na contabilidade individual daquela estação (visível em Administrar → Computadores → Receita por PC).',
   'Quando o cliente termina a sessão (e faz sua compra opcional de lanche), ele deixa sua opinião sobre a experiência — avaliando preço, velocidade da máquina, limpeza e conforto — e caminha até a porta de saída.'
  ],
  costsAndLimits:[
   'Capacidade máxima simultânea dentro do salão: 14 clientes.',
   'Limite máximo da fila do balcão: 6 clientes aguardando atendimento.',
   'Tempo de atendimento do Tony por cliente no balcão: 3 minutos do jogo.',
   'Pacotes de sessão possíveis: 30 min, 45 min, 1h (60 min), 1h30 (90 min), 2h (120 min), 3h (180 min) e 4h (240 min).',
   'Paciência máxima na fila: 8 minutos para clientes de perfil rápido, 19 minutos para clientes VIP e 25 minutos para clientes comuns.',
   'Penalidade por desistência na fila: -0,4 ponto de reputação e registro em Clientes perdidos.'
  ],
  commonProblems:[
   {
    problem:'Os clientes entram na fila do balcão, esperam alguns minutos e vão embora sem pagar.',
    solution:'Verifique se os seus computadores não estão todos desligados, quebrados (100% de desgaste) ou com passagem bloqueada, ou se a sua tarifa horária está alta demais para a carteira dos visitantes (o pacote mínimo de 30 minutos custa metade do valor da sua hora).'
   },
   {
    problem:'A internet caiu no meio da sessão: eu perco o dinheiro que o cliente já pagou?',
    solution:'Não há estorno do valor já pago no balcão. Porém, se a internet ficar fora do ar por mais de 15 minutos seguidos durante uma sessão comum em PC Windows, o cliente abandona a máquina irritado e sua lan house perde 1,1 ponto de reputação.'
   }
  ],
  playerTips:[
   'Mantenha sempre bebidas, doces e salgadinhos em estoque: um cliente que acabou de gastar na sessão frequentemente deixa um valor extra nas máquinas de venda antes de ir embora.',
   'Quando todos os seus PCs ficam ocupados ao mesmo tempo, a taxa de entrada de novos visitantes na porta cai para 38% do normal para evitar superlotação. Esse é o sinal de que está na hora de instalar mais computadores.'
  ],
  relatedIds:['001','002','028','031']
 },
 {
  number:4,
  id:'004',
  slug:'paineis-de-gestao-compras-e-atalhos',
  path:'/sobre-o-jogo/guias/004-paineis-de-gestao-compras-e-atalhos/',
  groupCode:'A',
  groupTitle:'Primeiros passos e rotina do salão',
  title:'Como navegar pelos painéis Administrar, Compras e Correio',
  summary:'Localize rapidamente todas as abas de gestão, categorias da loja, atalhos de acesso rápido e controles de visualização do salão.',
  unlockBadge:'Disponível desde 1998 (Dia 1)',
  uiPath:'Barra superior → Compras, Correio, Administrar e Minha Conta',
  whatIs:[
   'A interface de Lan House Simulator é dividida entre a visão isométrica interativa do salão e quatro janelas principais na barra superior: 🍪 Minha Conta, Menu ESC, Compras, Correio e Administrar.',
   'Logo abaixo dos indicadores de caixa, reputação e horário, o jogo também oferece uma barra de Acesso rápido (Finanças, Estoque, Serviços, Computadores e Compras) que leva você direto para a sub-aba mais usada de cada área.'
  ],
  whyItMatters:[
   'Conhecer onde fica cada controle evita perder tempo procurando onde comprar um computador novo (que fica em Compras) ou onde trocar o processador e instalar o Windows de um PC já existente (que fica em Administrar).',
   'Você também pode interagir diretamente com o cenário clicando sobre o Tony atrás do balcão para abrir o painel Administrar imediatamente.'
  ],
  whenAvailable:[
   'Todas as janelas principais e os controles de câmera estão disponíveis desde o Dia 1 de 1998.',
   'Algumas sub-abas específicas exibem um cadeado ou aviso até o ano histórico de lançamento — como a sub-aba Mercadorias dentro de Estoque, que desbloqueia no ano 2000.'
  ],
  howToUse:[
   'Para comprar novas máquinas, videogames, reformas ou móveis, clique em Compras na barra superior e escolha uma das 4 categorias: Computadores e serviços, Videogames e CDs, Construção ou Decoração (ou use o campo Pesquisar produtos e serviços).',
   'Para gerenciar o que já está no salão, clique em Administrar (ou clique no Tony atrás do balcão) e navegue pelas 8 abas principais: Preços, Computadores, Placas de vídeo, Windows / Licenças, Estoque, Serviços, Videogames e Finanças.',
   'Dentro de cada aba de Administrar, use os botões de sub-aba logo acima do conteúdo para alternar entre tarefas (por exemplo, dentro de Computadores você alterna entre Operação e reparos, Peças e configuração, Windows, Monitores e Receita por PC).',
   'Para ler avisos de fiscalização, assinar as revistas de Linux, acompanhar as histórias do bairro ou ver as capas da Top Games, clique em Correio.',
   'Use os botões de câmera no canto do salão (−, +, Ver tudo e Tela cheia) para ajustar o zoom ou centralizar toda a lan house na tela.'
  ],
  whatHappensNext:[
   'Qualquer alteração feita em Administrar ou Compras reflete imediatamente no salão: preços atualizados já valem para o próximo cliente da fila, e móveis comprados entram no modo de posicionamento visual.',
   'Se você abrir Compras enquanto Administrar estiver aberto (ou vice-versa), o jogo alterna suavemente entre os painéis para não sobrepor janelas.'
  ],
  costsAndLimits:[
   'Consultar qualquer aba de Administrar, Compras ou Correio é gratuito.',
   'Abrir Administrar, Compras ou Correio pausa apenas a animação pesada de fundo para economizar bateria e processador, mas o relógio do expediente continua correndo.',
   'Para pausar o relógio do expediente, use o botão Menu ESC ou abra Organizar salão dentro de Compras.'
  ],
  table:{
   caption:'Mapa completo das 8 abas do painel Administrar e suas sub-abas',
   headers:['Aba principal em Administrar','Sub-abas disponíveis','O que você resolve aqui'],
   rows:[
    ['Preços','Hora e pacotes · Análise da tarifa · Produtos · Impressões · Cópias CD / DVD','Ajusta tarifas por hora, preços de lanches, página impressa e gravação de discos'],
    ['Computadores','Operação e reparos · Peças e configuração · Windows · Monitores · Receita por PC','Liga/desliga PCs, chama técnico, troca peças/kits, instala LCDs e vê lucro por máquina'],
    ['Placas de vídeo','Seletor de PC + Catálogo de GPUs','Compra e instala placas PixelForce (2005–2030) na estação escolhida'],
    ['Windows / Licenças','Windows por PC · Jogos clássicos · Jogos com GPU','Compra licenças de Windows, jogos clássicos (1998–2000) e baixa jogos GPU (2005+)'],
    ['Estoque','Mercadorias (2000+) · Fornecedores · Entregas','Faz pedidos de reposição, escolhe marcas do ano 2000+ e acompanha entregas'],
    ['Serviços','Equipe e limpeza · Internet e contrato · Passagens','Contrata faxineiro/técnico, melhora a internet, regulariza jogos e checa rotas'],
    ['Videogames','Bancadas · Preço por hora · Jogos PS1 / PS2','Acompanha bancadas de PS1/PS2, define tarifa de console e compra CDs/DVDs'],
    ['Finanças','Caixa e contas · Ocupação e resultado · Primeira sexta · Divulgação · Opiniões dos clientes · Reiniciar partida','Confere contas do mês, agenda o Corujão, faz propaganda e lê avaliações']
   ]
  },
  commonProblems:[
   {
    problem:'Estou procurando onde comprar o quarto computador dentro de Administrar → Computadores e não encontro.',
    solution:'A aba Administrar → Computadores cuida apenas dos PCs que já estão instalados no salão. Para comprar um PC novo, abra a janela Compras → categoria Computadores e serviços.'
   },
   {
    problem:'A sub-aba Mercadorias dentro de Administrar → Estoque aparece com um cadeado (🔒 Mercadorias · 2000).',
    solution:'Nos anos de 1998 e 1999 você repõe o estoque diretamente pela sub-aba Fornecedores e ajusta os valores em Preços → Produtos. O catálogo detalhado de 12 mercadorias abre automaticamente na virada para o ano 2000.'
   }
  ],
  playerTips:[
   'Use os cinco botões da barra de Acesso rápido abaixo do cabeçalho (Finanças, Estoque, Serviços, Computadores e Compras) para pular direto para as telas mais urgentes com um único clique.',
   'Se estiver jogando no celular, toque em Tela cheia e mantenha o aparelho na horizontal para enxergar o salão e os painéis com mais conforto.'
  ],
  relatedIds:['001','002','005','034']
 },
 {
  number:5,
  id:'005',
  slug:'compra-de-computadores-e-vagas-do-salao',
  path:'/sobre-o-jogo/guias/005-compra-de-computadores-e-vagas-do-salao/',
  groupCode:'B',
  groupTitle:'Computadores, peças e monitores',
  title:'Compra de computadores: área principal e ampliações',
  summary:'Saiba como expandir sua lan house de 3 para até 22 computadores entre o salão principal e os anexos à esquerda, à direita e aos fundos.',
  unlockBadge:'Disponível desde 1998 (Dia 1)',
  uiPath:'Compras → Computadores e serviços → Instalar PC',
  whatIs:[
   'Sua lan house começa com 3 computadores e pode crescer até o limite máximo de 22 estações de PC (além de até 4 bancadas de PlayStation 1 e 4 de PlayStation 2). As vagas de computador são divididas em dois grupos: a área principal (até 7 PCs) e as ampliações laterais e dos fundos (até 15 PCs).',
   'Cada computador comum novo custa R$ 320,00 e já vem equipado com a configuração inicial de 1998 (monitor CRT geração 1, Bairro 350 MHz, 64 MB SDRAM, HD de 4 GB, fonte de 350 W e Windows 98 preinstalado sem licença paga).'
  ],
  whyItMatters:[
   'Mais computadores ligados permitem atender mais clientes simultaneamente, aumentam o faturamento diário e evitam que a taxa de chegada na porta sofra o redutor de lotação (que corta as visitas para 38% quando todas as máquinas estão ocupadas).',
   'Porém, cada expansão da área principal aumenta o aluguel e a manutenção mensal, enquanto as ampliações para a esquerda, direita e fundos cobram apenas a obra à vista sem elevar o aluguel fixo.'
  ],
  whenAvailable:[
   'As expansões de salão e a compra de computadores comuns estão disponíveis desde o Dia 1 (1998).',
   'As duas estações especiais com Linux pré-instalado (Bancada Linux 99 por R$ 440,00 e Estação Programador 99 por R$ 610,00) ficam disponíveis a partir de outubro de 1999 após concluir a coleção de revistas Informática Livre, e ocupam vagas da área principal.'
  ],
  howToUse:[
   'Para instalar até o 7º PC na área principal: primeiro abra Compras → Construção e compre Ampliar área principal (R$ 650,00 na 1ª expansão para liberar os PCs 4 e 5; R$ 1.100,00 na 2ª expansão para liberar os PCs 6 e 7).',
   'Em seguida, vá em Compras → Computadores e serviços e clique em Instalar PC · R$ 320 no cartão Instalar PC na área principal. O computador é posicionado automaticamente na próxima vaga livre do salão.',
   'Para instalar até 15 PCs extras nos anexos: vá em Compras → Construção e compre uma etapa de Ampliar à esquerda, Ampliar à direita ou Ampliar os fundos (cada direção tem 5 níveis, liberando 1 vaga de anexo por nível).',
   'Com a vaga de anexo aberta, volte em Compras → Computadores e serviços, clique em Escolher vaga · R$ 320 no cartão Instalar PC na ampliação e clique sobre o marcador verde da vaga desejada no mapa do salão.'
  ],
  whatHappensNext:[
   'Assim que o computador é instalado, ele recebe seu número sequencial (PC 4, PC 5, etc.), já entra ligado e passa a receber clientes da fila do balcão imediatamente.',
   'Como todo PC comum novo chega com peças de 1998 e Windows 98 sem licença paga, lembre-se de atualizá-lo e licenciá-lo depois em Administrar → Computadores se você já estiver em anos mais avançados.'
  ],
  costsAndLimits:[
   'Preço de cada PC comum novo (principal ou ampliação): R$ 320,00.',
   'Expansão 1 da área principal: R$ 650,00 (aumenta a capacidade principal de 3 para 5 PCs).',
   'Expansão 2 da área principal: R$ 1.100,00 (aumenta a capacidade principal de 5 para 7 PCs).',
   'Ampliações de anexo (esquerda, direita ou fundos, até 5 níveis em cada direção): Nível 1 custa R$ 500,00; Nível 2 custa R$ 850,00; Nível 3 custa R$ 1.200,00; Nível 4 custa R$ 1.550,00; Nível 5 custa R$ 1.900,00 (cada etapa libera 1 vaga de PC de ampliação).',
   'Capacidade máxima total da lan house: 22 PCs (7 na área principal + 5 no anexo esquerdo + 5 no anexo direito + 5 no anexo dos fundos).'
  ],
  table:{
   caption:'Resumo de vagas de computadores e custos de expansão',
   headers:['Tipo de expansão','Vagas liberadas','Custo da obra','Impacto no aluguel mensal'],
   rows:[
    ['Salão inicial (1998)','3 vagas (PC 1 a PC 3)','Incluído no início','Aluguel base de R$ 270 (corrigido pelo IPCA)'],
    ['Ampliar área principal (Nível 1)','+2 vagas principais (até 5 PCs)','R$ 650,00','Aumenta aluguel base em +R$ 170 e manutenção em +R$ 35'],
    ['Ampliar área principal (Nível 2)','+2 vagas principais (até 7 PCs)','R$ 1.100,00','Aumenta aluguel base em +R$ 170 e manutenção em +R$ 35'],
    ['Ampliar à esquerda (Níveis 1 a 5)','+1 vaga de anexo por nível (até 5)','R$ 500 / 850 / 1.200 / 1.550 / 1.900','Não aumenta o aluguel mensal fixo'],
    ['Ampliar à direita (Níveis 1 a 5)','+1 vaga de anexo por nível (até 5)','R$ 500 / 850 / 1.200 / 1.550 / 1.900','Não aumenta o aluguel mensal fixo'],
    ['Ampliar os fundos (Níveis 1 a 5)','+1 vaga de anexo por nível (até 5)','R$ 500 / 850 / 1.200 / 1.550 / 1.900','Não aumenta o aluguel mensal fixo']
   ]
  },
  commonProblems:[
   {
    problem:'Tenho dinheiro e vaga aberta na área principal, mas o jogo avisa que o espaço da nova estação está ocupado.',
    solution:'As vagas da área principal têm posições fixas no piso. Se você colocou uma planta, sofá, console ou parede divisória sobre aquela coordenada, use Compras → Organizar salão para mover o objeto antes de instalar o PC.'
   },
   {
    problem:'Comprei um PC novo em 2010 e o teto do meu preço por hora caiu.',
    solution:'O teto da tarifa horária considera a idade tecnológica média de todos os seus PCs. Como um PC recém-comprado vem com peças básicas de 1998, desligue a nova máquina assim que instalá-la e atualize o kit de plataforma e o Windows dela.'
   }
  ],
  playerTips:[
   'Se você quer adicionar apenas 1 computador novo sem aumentar a conta fixa de aluguel do mês, faça o Nível 1 de uma ampliação lateral (R$ 500,00) + PC na ampliação (R$ 320,00).',
   'Deixe ao menos 1 ou 2 vagas da área principal reservadas se você pretende comprar a Bancada Linux 99 ou a Estação Programador 99 em outubro de 1999, pois as máquinas Linux só são instaladas na área principal.'
  ],
  relatedIds:['006','014','033','034']
 },
 {
  number:6,
  id:'006',
  slug:'kits-de-plataforma-e-geracoes-de-hardware',
  path:'/sobre-o-jogo/guias/006-kits-de-plataforma-e-geracoes-de-hardware/',
  groupCode:'B',
  groupTitle:'Computadores, peças e monitores',
  title:'Kits de plataforma: evoluindo os PCs de 1998 a 2024',
  summary:'Conheça os 8 pacotes completos de atualização de hardware, seus preços, anos de lançamento e como preservam peças superiores já instaladas.',
  unlockBadge:'Gerações de 1998 a 2024',
  uiPath:'Administrar → Computadores → Peças e configuração → Kits de plataforma',
  whatIs:[
   'Os Kits de plataforma são pacotes fechados de atualização que trocam de uma só vez o processador, a memória RAM, o armazenamento, a placa-mãe e a fonte de alimentação de um computador selecionado, garantindo compatibilidade imediata entre todas as peças.',
   'Ao todo existem 8 gerações de kits entre 1998 e 2024: Base 1998, Bairro 2000, Turbo 2003, Turbo 2005, Duo 2008, Quad 2012, Estúdio 2017 e Arena 2024.'
  ],
  whyItMatters:[
   'Atualizar a plataforma aumenta o bônus de satisfação da máquina, reduz a velocidade com que o computador acumula desgaste (máquinas de nível 2 e 3 desgastam 2x e 3x mais devagar que as de nível 1) e mantém a idade tecnológica do seu salão atualizada para não perder teto de tarifa horária.',
   'A partir do kit Turbo 2003, o computador atinge o Nível 3 de hardware, requisito obrigatório para instalar monitores LCD e sistemas operacionais mais modernos a partir do Windows Vista.'
  ],
  whenAvailable:[
   'A aba Kits de plataforma está disponível desde 1998, e cada novo kit é liberado automaticamente no dia 1º de janeiro do seu respectivo ano histórico (2000, 2003, 2005, 2008, 2012, 2017 e 2024).',
   'Nos primeiros anos (enquanto o PC ainda está no nível 1 ou 2), você também encontra um botão de atalho direto na sub-aba Operação e reparos (Kit CRT 2000 · R$ 240 e Kit CRT 2003 · R$ 480).'
  ],
  howToUse:[
   'Abra o painel Administrar → aba Computadores → sub-aba Peças e configuração.',
   'No topo da área de configuração, clique no botão do computador que deseja atualizar (PC 01, PC 02, etc.).',
   'Se a estação estiver ligada e sem cliente, clique em Desligar estação selecionada (todo upgrade de hardware exige o computador desligado, livre e fora de manutenção).',
   'Mantenha selecionada a primeira categoria Kits de plataforma e clique no botão de compra do kit desejado (por exemplo, Turbo 2003 · R$ 480 ou Duo 2008 · R$ 1.420).',
   'Após a instalação instantânea do kit, clique em Ligar estação selecionada para que o computador volte a receber clientes.'
  ],
  whatHappensNext:[
   'O kit substitui as peças antigas pelas novas imediatamente, mantendo a licença do Windows, a placa de vídeo e o monitor que já estavam naquela máquina.',
   'Se você já havia comprado avulsamente uma peça superior compatível com o novo kit (como uma fonte mais forte ou mais memória RAM), o jogo preserva sua peça superior sem rebaixá-la.'
  ],
  costsAndLimits:[
   'O PC precisa obrigatoriamente estar desligado, sem cliente, sem reparo técnico ativo e sem instalação do Windows em andamento.',
   'Você pode pular gerações (por exemplo, ir direto de 2000 para 2008), pagando apenas o preço do novo kit.',
   'Exceção do Kit Turbo 2003: se o computador ainda estiver com o processador original de 1998 (sem ter passado pela geração 2000), o Kit Turbo 2003 inclui o custo da etapa anterior e sai por R$ 720,00 (em vez de R$ 480,00).',
   'Se o seu PC já tinha um pente de RAM de capacidade maior que o padrão do novo kit (em outro padrão de memória), o sistema seleciona automaticamente um pente equivalente da nova geração e soma apenas a diferença de preço.'
  ],
  table:{
   caption:'Catálogo completo dos 8 Kits de plataforma (1998–2024)',
   headers:['Kit de plataforma','Ano','Preço base','Processador e Placa-mãe','RAM, Disco e Fonte incluídos'],
   rows:[
    ['Base 1998','1998','Incluído','Bairro 350 (350 MHz) · Bairro BX Slot 1','SDRAM 64 MB · HD IDE 4 GB · Fonte 350 W'],
    ['Bairro 2000','2000','R$ 240','Bairro 800 (800 MHz) · Bairro BX Slot 1','SDRAM 128 MB · HD IDE 10 GB · Fonte 350 W'],
    ['Turbo 2003','2003','R$ 480 (ou R$ 720 direto de 1998)','Turbo 2.4 (2,4 GHz) · Turbo 478','DDR 512 MB · HD IDE 40 GB · Fonte 400 W'],
    ['Turbo 2005','2005','R$ 1.020','Turbo 3.0 (3,0 GHz) · Turbo 478','DDR 1 GB · HD SATA 160 GB · Fonte 450 W'],
    ['Duo 2008','2008','R$ 1.420','Duo 2.4 (2 núcleos, 64 bits) · Duo 775','DDR2 2 GB · HD SATA 320 GB · Fonte 500 W'],
    ['Quad 2012','2012','R$ 2.150','Quad 3.2 (4 núcleos, 64 bits) · Quad 1155 (UEFI)','DDR3 8 GB · SSD SATA 512 GB · Fonte 650 W'],
    ['Estúdio 2017','2017','R$ 2.890','Hexa 3.6 (6 núcleos) · Estúdio AM4 (UEFI, TPM 2.0, DX12)','DDR4 16 GB · SSD SATA 1 TB · Fonte 850 W'],
    ['Arena 2024','2024','R$ 4.230','Octa 4.2 (8 núcleos) · Arena AM5 (UEFI, TPM 2.0, DX12)','DDR5 32 GB · NVMe 2 TB · Fonte 1.000 W']
   ]
  },
  commonProblems:[
   {
    problem:'O botão de comprar o kit está desabilitado dizendo para desligar o PC primeiro.',
    solution:'Nenhuma peça pode ser trocada com a máquina ligada. Clique em Desligar estação selecionada ali mesmo na aba Peças e configuração, compre o kit e depois clique em Ligar estação selecionada.'
   },
   {
    problem:'Instalei uma placa de vídeo potente antes e agora o kit não deixa instalar por causa da fonte.',
    solution:'Se o seu PC já possui uma GPU que exige mais energia do que a fonte padrão daquele kit antigo, instale primeiro uma fonte mais potente na aba Fonte ou escolha um kit de geração mais recente.'
   }
  ],
  playerTips:[
   'Levar seus PCs para o kit Bairro 2000 (R$ 240) e depois Turbo 2003 (R$ 480) tem o mesmo custo total (R$ 720) de pular direto de 1998 para 2003, então vale muito a pena fazer o upgrade já no ano 2000 para reduzir o desgaste pela metade.',
   'O kit Estúdio 2017 (placa-mãe AM4) já traz UEFI, TPM 2.0 e DirectX 12, deixando a máquina pronta para receber o Windows 11 quando 2021 chegar.'
  ],
  relatedIds:['005','007','008','009']
 },
 {
  number:7,
  id:'007',
  slug:'pecas-individuais-processador-memoria-disco-e-placa-mae',
  path:'/sobre-o-jogo/guias/007-pecas-individuais-processador-memoria-disco-e-placa-mae/',
  groupCode:'B',
  groupTitle:'Computadores, peças e monitores',
  title:'Peças avulsas: processador, memória RAM, armazenamento e placa-mãe',
  summary:'Aprenda a combinar processadores, memórias SDRAM a DDR5, discos IDE, SATA e NVMe e placas-mãe respeitando encaixes e limites de cada época.',
  unlockBadge:'Disponível desde 1998 (novas peças até 2024)',
  uiPath:'Administrar → Computadores → Peças e configuração',
  whatIs:[
   'Além dos kits fechados, Lan House Simulator permite atualizar cada computador peça por peça através de 45 componentes avulsos (além das 7 fontes): 9 processadores, 18 módulos de memória RAM, 12 unidades de armazenamento (HD IDE, HD SATA, SSD SATA e NVMe) e 6 placas-mãe.',
   'O sistema valida a compatibilidade real entre os componentes: socket do processador com a placa-mãe, geração e capacidade máxima de memória RAM, tipo de conector do disco (IDE, SATA ou NVMe) e potência total exigida da fonte.'
  ],
  whyItMatters:[
   'Comprar peças avulsas permite esticar a vida útil de uma máquina gastando pouco — como dobrar a memória RAM em 2001 (SDRAM 256 MB por R$ 100) ou instalar o processador Octa 4.0 em 2020 (R$ 1.150) aproveitando a mesma placa-mãe Estúdio AM4 de 2017.',
   'O bônus de satisfação dos componentes internos (até +24 pontos percentuais) combina 45% do estágio do processador, 35% da memória RAM e 20% do armazenamento.'
  ],
  whenAvailable:[
   'Disponível desde o Dia 1 em Administrar → Computadores → Peças e configuração.',
   'Novas peças surgem no catálogo conforme os anos avançam: 1998, 2000, 2001, 2003, 2005, 2007, 2008, 2009, 2011, 2012, 2013, 2015, 2017, 2019, 2020, 2021 e 2024.'
  ],
  howToUse:[
   'Abra Administrar → Computadores → sub-aba Peças e configuração e selecione a máquina desejada (PC 01, PC 02...).',
   'Clique em Ver configuração instalada para abrir a ficha completa das peças atuais daquele PC e conferir o socket e os barramentos suportados.',
   'Clique em Desligar estação selecionada.',
   'Navegue pelas abas Processador, Memória RAM, Armazenamento e Placa-mãe para comprar o upgrade desejado.',
   'Quando quiser mudar de geração de socket (por exemplo, sair de Slot 1 para 478 ou 775), use um Kit de plataforma, pois trocar apenas a placa-mãe avulsa exige que o processador e a RAM já instalados sejam do mesmo socket e padrão da nova placa.'
  ],
  whatHappensNext:[
   'A peça comprada entra imediatamente em vigor naquela máquina, elevando o índice de satisfação e a modernidade tecnológica do PC.',
   'Não há reembolso ou revenda da peça antiga substituída: cada troca cobra o valor integral do componente novo e nunca permite instalar uma peça inferior à atual.'
  ],
  costsAndLimits:[
   'Processadores (9 modelos): Bairro 350 (1998, R$ 120, Slot 1) · Bairro 800 (2000, R$ 180, Slot 1) · Turbo 2.4 (2003, R$ 270, 478) · Turbo 3.0 (2005, R$ 350, 478) · Duo 2.4 (2008, R$ 440, 775, 64 bits) · Quad 3.2 (2012, R$ 650, 1155) · Hexa 3.6 (2017, R$ 900, AM4) · Octa 4.0 (2020, R$ 1.150, AM4) · Octa 4.2 (2024, R$ 1.450, AM5).',
   'Memória RAM (18 modelos): SDRAM (64 MB a 512 MB, R$ 45 a R$ 140) · DDR (512 MB a 2 GB, R$ 130 a R$ 240) · DDR2 (2 GB a 8 GB, R$ 220 a R$ 400) · DDR3 (8 GB a 32 GB, R$ 290 a R$ 620) · DDR4 (16 GB a 64 GB, R$ 380 a R$ 850) · DDR5 (32 GB R$ 640 e 64 GB R$ 980 em 2024).',
   'Armazenamento (12 modelos): HD IDE (4 GB a 40 GB, R$ 65 a R$ 160) · HD SATA (80 GB a 1 TB, R$ 190 a R$ 380) · SSD SATA (512 GB R$ 560 em 2012; 1 TB R$ 690 em 2017) · NVMe (2 TB R$ 890 e 4 TB R$ 1.380 em 2024).',
   'Regra de capacidade de disco: para trocar o armazenamento avulso, o novo disco precisa ter capacidade em GB igual ou maior E estágio tecnológico igual ou maior que o disco atual.'
  ],
  table:{
   caption:'Compatibilidade das 6 Placas-mãe com Processadores, Memória RAM e Discos',
   headers:['Placa-mãe (Ano e Preço)','Socket CPU','Padrão e limite de RAM','Conexões de disco','Recursos modernos'],
   rows:[
    ['Bairro BX · Slot 1 (1998 · R$ 95)','Slot 1','SDRAM até 512 MB','Apenas IDE','32 bits legado'],
    ['Turbo 478 (2003 · R$ 180)','Socket 478','DDR até 2 GB','IDE e SATA','Suporta HDs SATA iniciais'],
    ['Duo 775 (2008 · R$ 280)','Socket 775','DDR2 até 8 GB','IDE e SATA','Suporta CPUs de 64 bits'],
    ['Quad 1155 (2012 · R$ 380)','Socket 1155','DDR3 até 32 GB','Apenas SATA','UEFI integrado'],
    ['Estúdio AM4 (2017 · R$ 540)','Socket AM4','DDR4 até 64 GB','SATA e NVMe','UEFI · TPM 2.0 · DirectX 12'],
    ['Arena AM5 (2024 · R$ 760)','Socket AM5','DDR5 até 128 GB','SATA e NVMe','UEFI · TPM 2.0 · DirectX 12']
   ]
  },
  commonProblems:[
   {
    problem:'Comprei o HD SATA de 1 TB em 2012 e agora o botão do SSD SATA de 512 GB está bloqueado.',
    solution:'O sistema de upgrade avulso de armazenamento exige que a nova unidade tenha capacidade em gigabytes igual ou maior que a atual. De um HD de 1 TB (1.000 GB), o próximo passo compatível é o SSD SATA de 1 TB (2017) ou NVMe de 2 TB (2024).'
   },
   {
    problem:'Quero comprar uma placa-mãe mais nova na aba Placa-mãe, mas aparece erro de incompatibilidade com meu processador atual.',
    solution:'Como placa-mãe, processador e memória mudam de encaixe juntos a cada geração (Slot 1 → 478 → 775 → 1155 → AM4 → AM5), use a aba Kits de plataforma para trocar o conjunto inteiro de uma vez.'
   }
  ],
  playerTips:[
   'Em 2020 é lançado o processador Octa 4.0 (R$ 1.150, socket AM4): como não há kit novo em 2020, você pode instalá-lo avulsamente nas máquinas que já têm o kit Estúdio 2017!',
   'Do mesmo modo, nos anos intermediários (2001, 2007, 2009, 2011, 2013, 2015, 2019 e 2021), dobrar a memória RAM avulsa mantém a modernidade da estação alta sem precisar trocar o computador inteiro.'
  ],
  relatedIds:['006','008','011','015']
 },
 {
  number:8,
  id:'008',
  slug:'fontes-de-alimentacao-consumo-e-seguranca-eletrica',
  path:'/sobre-o-jogo/guias/008-fontes-de-alimentacao-consumo-e-seguranca-eletrica/',
  groupCode:'B',
  groupTitle:'Computadores, peças e monitores',
  title:'Fontes de alimentação, consumo de energia e vistoria elétrica',
  summary:'Calcule a potência de fonte exigida por máquina, entenda o custo de luz na conta mensal e saiba agir diante da vistoria dos Bombeiros.',
  unlockBadge:'Fontes de 1998 a 2024',
  uiPath:'Administrar → Computadores → Peças e configuração → Fonte',
  whatIs:[
   'Todo computador da lan house possui uma fonte de alimentação (medida em watts, de 350 W a 1.000 W) responsável por sustentar a soma de consumo do processador, memória RAM, disco, placa-mãe e placa de vídeo com uma margem de segurança obrigatória de 25%.',
   'Além das fontes individuais de cada máquina, o salão também está sujeito a uma vistoria única na campanha: a carta Bombeiros: instalação elétrica irregular no Correio, que exige adequar a fiação geral do estabelecimento.'
  ],
  whyItMatters:[
   'Se a fonte instalada num computador não tiver potência suficiente para a nova peça ou placa de vídeo que você quer comprar, o botão de compra ficará bloqueado informando a potência mínima exigida (por exemplo, Requer fonte de 450 W).',
   'Já a carta dos Bombeiros no Correio tem prazo de 8 dias: ignorá-la gera multa em dinheiro e perda de 3 pontos de reputação.'
  ],
  whenAvailable:[
   'A aba Fonte dentro de Administrar → Computadores → Peças e configuração está disponível desde 1998, com 7 modelos liberados entre 1998 e 2024.',
   'A carta de vistoria elétrica dos Bombeiros chega pelo Correio durante a progressão da campanha.'
  ],
  howToUse:[
   'Para conferir a folga elétrica de um PC, abra Administrar → Computadores → Peças e configuração, selecione a estação e clique em Ver configuração instalada.',
   'Se precisar de mais potência para instalar uma placa de vídeo ou processador mais forte, desligue a estação, abra a categoria Fonte e compre um modelo superior.',
   'Para economizar na conta de luz mensal, desligue computadores ociosos (máquinas desligadas têm consumo zero) ou instale monitores LCD a partir de 2005.',
   'Quando receber a carta Bombeiros: instalação elétrica irregular no Correio, escolha dentro de 8 dias entre Refazer instalação com eletricista (+2 de reputação), Adequação segura essencial (regulariza pelo menor custo) ou Solicitar prazo de 8 dias (prorroga uma única vez).'
  ],
  whatHappensNext:[
   'Trocar a fonte por um modelo de maior capacidade libera imediatamente a instalação de GPUs e processadores mais exigentes naquela máquina.',
   'Importante: instalar uma fonte de 850 W ou 1.000 W NÃO aumenta sua conta de luz mensal! O gasto de energia na conta do mês depende apenas do consumo real das peças instaladas, da placa de vídeo e do monitor enquanto o PC está ligado.'
  ],
  costsAndLimits:[
   'Fórmula da fonte exigida pelo jogo: soma os watts de (Processador + Placa-mãe + RAM + Armazenamento + Placa de vídeo), multiplica por 1,25 (+25% de margem de segurança) e arredonda para cima em múltiplos de 50 W.',
   'Catálogo de Fontes: Fonte 350 W (1998, R$ 85) · Fonte 400 W (2003, R$ 110) · Fonte 450 W (2005, R$ 145) · Fonte 500 W (2008, R$ 190) · Fonte 650 W (2012, R$ 270) · Fonte 850 W (2017, R$ 380) · Fonte 1.000 W (2024, R$ 490).',
   'Prazo da vistoria elétrica dos Bombeiros: 8 dias corridos (prorrogável por mais 8 dias uma única vez gratuitamente).'
  ],
  table:{
   caption:'Catálogo de Fontes de Alimentação (1998–2024)',
   headers:['Modelo de fonte','Ano','Preço','Potência máxima','Uso típico recomendado'],
   rows:[
    ['Fonte 350 W','1998','R$ 85','350 W','PCs de 1998–2000 e GPUs iniciais em máquinas simples'],
    ['Fonte 400 W','2003','R$ 110','400 W','Incluída no Kit Turbo 2003; suporta GPUs intermediárias'],
    ['Fonte 450 W','2005','R$ 145','450 W','Incluída no Kit Turbo 2005; ideal para PixelForce 2005–2013'],
    ['Fonte 500 W','2008','R$ 190','500 W','Incluída no Kit Duo 2008; suporta configurações de 64 bits'],
    ['Fonte 650 W','2012','R$ 270','650 W','Incluída no Kit Quad 2012; recomendada para GPUs até 2030 em PCs modernos'],
    ['Fonte 850 W','2017','R$ 380','850 W','Incluída no Kit Estúdio 2017; folga ampla para qualquer GPU'],
    ['Fonte 1.000 W','2024','R$ 490','1.000 W','Incluída no Kit Arena 2024; potência máxima do simulador']
   ]
  },
  commonProblems:[
   {
    problem:'Tentei comprar uma placa de vídeo PixelForce em Administrar → Placas de vídeo e o botão diz Requer fonte de 450 W.',
    solution:'A soma das peças atuais do PC mais a nova GPU (com os 25% de margem) ultrapassou os watts da fonte atual. Vá em Administrar → Computadores → Peças e configuração → Fonte, instale uma fonte compatível e volte à aba Placas de vídeo.'
   },
   {
    problem:'Deixei o prazo de 8 dias da carta dos Bombeiros vencer.',
    solution:'O vencimento aplica uma multa automática e tira 3 pontos de reputação, mas a instalação elétrica continua pendente. Abra o Correio e clique em uma das opções de adequação para encerrar a pendência.'
   }
  ],
  playerTips:[
   'Como todos os Kits de plataforma a partir de 2003 já incluem uma fonte dimensionada com folga (400 W a 1.000 W), atualizar o PC por kit quase sempre dispensa a compra de fonte avulsa.',
   'Se estiver com caixa curto quando a carta dos Bombeiros chegar, clique primeiro em Solicitar prazo de 8 dias (custo zero) para ganhar mais uma semana de faturamento antes de pagar o eletricista.'
  ],
  relatedIds:['006','007','015','035']
 },
 {
  number:9,
  id:'009',
  slug:'monitores-crt-lcd-led-ips-e-arena',
  path:'/sobre-o-jogo/guias/009-monitores-crt-lcd-led-ips-e-arena/',
  groupCode:'B',
  groupTitle:'Computadores, peças e monitores',
  title:'Monitores: da era CRT aos painéis LCD, LED, IPS e Arena',
  summary:'Descubra como substituir os monitores de tubo pelos 5 kits de tela plana a partir de 2005 para ganhar conforto e economizar energia.',
  unlockBadge:'CRT desde 1998 · Kits LCD de 2005 a 2024',
  uiPath:'Administrar → Computadores → Monitores',
  whatIs:[
   'Todo computador começa a campanha com um monitor de tubo clássico (CRT · geração 1, que evolui visualmente para geração 2 e geração 3 conforme o nível da máquina). A partir de 2005, você pode substituir os monitores de tubo por 5 gerações de kits visuais de tela plana e gabinete moderno.',
   'Os 5 kits disponíveis em Administrar → Computadores → Monitores (seção Da era CRT aos LCDs) são: Bairro LCD 17 (2005), Panorama 19 (2008), Horizonte LED 22 (2012), Estúdio IPS 24 (2017) e Arena 27 (2024).'
  ],
  whyItMatters:[
   'Os monitores LCD, LED, IPS e Arena oferecem três benefícios permanentes para a estação: aumentam o bônus de satisfação dos clientes (de +2 a +8 pontos percentuais), reduzem o consumo de energia por minuto daquela máquina e contam para o índice de modernidade tecnológica do PC.',
   'Além disso, clientes de perfil Conforto e clientes VIP dão preferência às estações com maior bônus total de satisfação.'
  ],
  whenAvailable:[
   'A sub-aba Monitores pode ser consultada desde o início, e o primeiro kit de tela plana (Bairro LCD 17) é desbloqueado em 2005.',
   'Requisito técnico obrigatório: o computador precisa estar no Nível 3 de hardware (processador Turbo 2.4 de 2003 ou superior) para receber qualquer kit LCD.'
  ],
  howToUse:[
   'Certifique-se de que o computador já possui hardware de Nível 3 (Kit Turbo 2003 ou superior) e está desligado, sem cliente e fora de manutenção.',
   'Abra Administrar → Computadores → sub-aba Monitores.',
   'Selecione a estação desejada ou localize o cartão do modelo de monitor liberado para o ano atual.',
   'Clique no botão de compra do kit desejado (por exemplo, Bairro LCD 17 · R$ 580 ou Horizonte LED 22 · R$ 1.280).',
   'Religue a estação para que ela volte a atender clientes já com o novo visual isométrico no salão.'
  ],
  whatHappensNext:[
   'O visual do computador no salão muda imediatamente do monitor de tubo bege para a tela fina e o gabinete da geração escolhida.',
   'As peças internas, a placa de vídeo, a licença do Windows e o percentual atual de desgaste da máquina são totalmente preservados.'
  ],
  costsAndLimits:[
   'Requisito obrigatório: Hardware Nível 3 na estação, PC desligado, desocupado e fora de reparo.',
   'Cada troca cobra o preço integral do novo kit de monitor, sem desconto de troca pelo monitor anterior.',
   'Você pode pular gerações (por exemplo, passar direto do CRT para o Horizonte LED 22 em 2012), mas não pode voltar para um modelo de ano igual ou anterior ao já instalado.'
  ],
  table:{
   caption:'Catálogo das 5 gerações de Monitores LCD, LED, IPS e Arena (2005–2024)',
   headers:['Kit de monitor','Ano','Preço','Bônus de satisfação','Características visuais e elétricas'],
   rows:[
    ['Bairro LCD 17','2005','R$ 580','+2,0 p.p.','Tela LCD 4:3 prateada, base larga e economia inicial de energia'],
    ['Panorama 19','2008','R$ 880','+3,0 p.p.','Tela widescreen 16:10 preta, gabinete com DVD e maior economia'],
    ['Horizonte LED 22','2012','R$ 1.280','+4,5 p.p.','Painel LED fino, base circular e forte redução de consumo ocioso'],
    ['Estúdio IPS 24','2017','R$ 1.780','+6,0 p.p.','Bordas finas, pedestal metálico, conjunto grafite e máxima eficiência'],
    ['Arena 27','2024','R$ 2.480','+8,0 p.p.','Tela ampla de 27", pé em V, gabinete ventilado e iluminação discreta']
   ]
  },
  commonProblems:[
   {
    problem:'Já passei de 2005, desliguei o PC, mas o botão do monitor LCD diz que exige hardware nível 3.',
    solution:'Monitores de tela plana não podem ser instalados em computadores que ainda usam peças de 1998 ou 2000 (níveis 1 e 2). Atualize primeiro o PC para o Kit Turbo 2003 (ou processador Turbo 2.4+) na sub-aba Peças e configuração.'
   }
  ],
  playerTips:[
   'Mesmo que o monitor represente 3% do peso da modernidade da estação para o teto de preço, o bônus de satisfação dele (até +8 p.p.) ajuda muito a manter avaliações positivas e atrair clientes VIP.',
   'Se o orçamento estiver apertado em 2005, priorize primeiro comprar uma placa de vídeo PixelForce 6600 (R$ 440) e o jogo Neon Rush Online antes de trocar todos os monitores de tubo.'
  ],
  relatedIds:['006','010','015','032']
 },
 {
  number:10,
  id:'010',
  slug:'operacao-desgaste-reparos-e-receita-por-pc',
  path:'/sobre-o-jogo/guias/010-operacao-desgaste-reparos-e-receita-por-pc/',
  groupCode:'B',
  groupTitle:'Computadores, peças e monitores',
  title:'Ligar e desligar estações, desgaste, manutenção e receita por PC',
  summary:'Domine o controle individual de energia das máquinas, o ritmo de desgaste, o chamado de técnicos e a leitura contábil de cada estação.',
  unlockBadge:'Disponível desde 1998 (Dia 1)',
  uiPath:'Administrar → Computadores → Operação e reparos / Receita por PC',
  whatIs:[
   'Cada computador da lan house possui seu próprio interruptor de energia (Ligar estação / Desligar estação), um medidor de desgaste que vai de 0% a 100% conforme o uso pelos clientes e um livro contábil individual chamado Receita por PC.',
   'Quando o desgaste de uma máquina atinge 100%, o cliente atual conclui a sessão normalmente, mas o computador entra em estado de MANUTENÇÃO (quebrado) e para de receber novos clientes até que um técnico realize o reparo.'
  ],
  whyItMatters:[
   'Desligar um computador é o passo obrigatório antes de trocar peças, instalar placas de vídeo, mudar o monitor ou instalar uma nova versão do Windows. Além disso, um PC desligado não consome energia elétrica.',
   'Já o controle do desgaste evita que máquinas quebrem no horário de pico: cada reparo dura 24 minutos do jogo com o técnico trabalhando fisicamente na frente do computador.'
  ],
  whenAvailable:[
   'As sub-abas Operação e reparos e Receita por PC dentro de Administrar → Computadores estão disponíveis desde o Dia 1 de 1998.'
  ],
  howToUse:[
   'Abra Administrar → Computadores → sub-aba Operação e reparos para ver o cartão de cada máquina com seu estado atual (Disponível, Em uso, Desligado ou Manutenção) e a porcentagem de desgaste.',
   'Para desligar ou religar um computador livre, clique em Desligar estação ou Ligar estação no cartão correspondente.',
   'Para consertar um computador com 1% ou mais de desgaste, clique em Chamar técnico avulso · R$ ... (ou Solicitar reparo · equipe contratada, caso você já tenha contratado um técnico fixo em Serviços). Não é necessário desligar o PC para chamar o técnico; basta a máquina estar sem cliente e sem instalação de Windows.',
   'Abra a sub-aba Receita por PC para consultar a tabela Receita e uso de cada estação, que mostra Sessões, VIP, Min. em uso, Receita, Energia* e Saldo parcial* de cada computador.'
  ],
  whatHappensNext:[
   'Ao solicitar o reparo, o técnico entra pela porta da lan house, caminha até o computador, trabalha por 24 minutos do jogo, zera o desgaste da máquina (0%) e vai embora pela porta.',
   'Se você tiver um técnico contratado na equipe fixa, ele é chamado automaticamente sempre que qualquer computador livre chega a 100% de desgaste (atendendo uma máquina por vez).'
  ],
  costsAndLimits:[
   'Acúmulo de desgaste por minuto de sessão ativa: +0,045% no Hardware Nível 1 (~2% a cada 45 min), +0,0225% no Nível 2 e +0,015% no Nível 3.',
   'Custo do técnico avulso no modo histórico: varia conforme o desgaste atual e o índice de inflação do ano — em 1998, custa de R$ 4,16 (com 1% de desgaste) até R$ 20,00 (com 100% de desgaste).',
   'Duração do reparo no local: 24 minutos do jogo (exige caminho desobstruído entre a porta de entrada e o computador).',
   'Como funciona a coluna Energia* em Receita por PC: é um rateio contábil igualitário da energia total gasta pelos PCs e PS1 naquele minuto dividida igualmente entre todos os PCs que estavam ligados naquele minuto.'
  ],
  table:{
   caption:'Entendendo as colunas da tabela Receita por PC',
   headers:['Coluna na tabela','O que registra','O que NÃO inclui'],
   rows:[
    ['Sessões / VIP','Total de sessões atendidas naquele PC e quantas foram de clientes VIP','Atendimentos avulsos de impressão ou cópia no balcão'],
    ['Min. em uso','Soma de minutos em que clientes estiveram sentados usando a estação','Tempo em que o PC ficou ligado ocioso aguardando cliente'],
    ['Receita','Soma dos pagamentos de sessão daquele PC (incluindo adicional de jogos GPU)','Vendas de refrigerante, doces, salgadinhos, impressões e cópias'],
    ['Energia*','Rateio igualitário da energia de equipamentos entre os PCs ligados a cada minuto','Medição individual por peça ou custos fixos de aluguel e internet'],
    ['Saldo parcial*','Receita de sessões do PC menos a parcela de Energia* rateada','Compras de hardware, licenças, salários ou reparos técnicos']
   ]
  },
  commonProblems:[
   {
    problem:'Chamei o técnico, mas o computador continua quebrado.',
    solution:'O técnico é um personagem físico que entra pela porta e caminha até o PC, levando 24 minutos do jogo para concluir o serviço. Se uma divisória sem porta ou móvel bloquear o caminho até a máquina, use Organizar salão ou a aba Passagens para liberar a rota.'
   },
   {
    problem:'Não consigo desligar um PC mesmo sem ninguém sentado nele.',
    solution:'Se um cliente acabou de pagar no balcão e está caminhando rumo àquela estação (ou se uma turma de amigos reservou a máquina para jogar em rede), o PC já consta como atribuído. Aguarde a sessão terminar para desligá-lo.'
   }
  ],
  playerTips:[
   'Chamar o técnico avulso apenas quando o desgaste passa de 75% ou 80% dilui a taxa base de visita e sai muito mais econômico do que pedir reparos com 10% ou 15% de desgaste.',
   'Assim que você passar de 5 ou 6 computadores, contratar o técnico fixo em Administrar → Serviços → Equipe e limpeza (R$ 7,50 por dia efetivamente trabalhado em 1998, cobrado apenas no fim do mês) vale muito a pena pela comodidade e economia.'
  ],
  relatedIds:['006','012','025','034']
 },
 {
  number:11,
  id:'011',
  slug:'licenciamento-do-windows-e-versoes-por-epoca',
  path:'/sobre-o-jogo/guias/011-licenciamento-do-windows-e-versoes-por-epoca/',
  groupCode:'C',
  groupTitle:'Windows e licenciamento de sistema',
  title:'Licenças do Windows, versões de 1998 a 2021 e fiscalização',
  summary:'Confira a diferença entre sistema preinstalado e licenciado, os requisitos do Windows 98 ao Windows 11 e como evitar multas de fiscalização.',
  unlockBadge:'Edições de 1998 a 2021',
  uiPath:'Administrar → Windows / Licenças → Windows por PC',
  whatIs:[
   'Em Lan House Simulator, todo computador comum começa com o Windows 98 preinstalado para que você possa abrir as portas no Dia 1, mas SEM licença paga adquirida. A licença do Windows é comprada individualmente para cada computador e acompanha a evolução histórica de 8 sistemas operacionais: Windows 98, Windows 2000, Windows XP, Windows Vista, Windows 7, Windows 8, Windows 10 e Windows 11.',
   'Licenciar e atualizar o Windows de cada máquina cumpre três papéis fundamentais: evita a multa de fiscalização de software, habilita aquele PC para rodar jogos licenciados (clássicos e de GPU) e representa 25% do peso da modernidade tecnológica da estação no cálculo do teto da tarifa horária.'
  ],
  whyItMatters:[
   'Um computador com Windows sem licença paga não conta como estação válida para liberar jogos clássicos de 1998–2000, não permite jogar Setor Zero em rede e não roda jogos avançados de placa de vídeo.',
   'Além disso, quando chega a carta Licenças de Windows pendentes no Correio, você tem 7 dias corridos para licenciar todos os PCs Windows. Se restar qualquer máquina Windows sem licença após 7 dias, você recebe uma multa de R$ 210,00 + R$ 60,00 por PC irregular e perde 3 pontos de reputação.'
  ],
  whenAvailable:[
   'O licenciamento do Windows 98 (R$ 120,00 por PC) está disponível desde o Dia 1 (1998).',
   'As versões seguintes são liberadas nos anos históricos de lançamento: 2000, 2001, 2007, 2009, 2012, 2015 e 2021.'
  ],
  howToUse:[
   'Primeiro desligue o computador que receberá a licença ou atualização (em Administrar → Computadores → Operação e reparos).',
   'Abra Administrar → Windows / Licenças → sub-aba Windows por PC (ou use Administrar → Computadores → sub-aba Windows).',
   'Confira na linha daquele computador os botões das versões disponíveis e veja se o hardware da máquina atende aos requisitos mínimos da edição desejada.',
   'Clique no botão da versão escolhida (por exemplo, Windows 98 · R$ 120 ou Windows XP · R$ 260) para pagar a licença e iniciar a instalação em tempo real.',
   'Quando a instalação atingir 100%, volte em Operação e reparos e clique em Ligar estação.'
  ],
  whatHappensNext:[
   'Uma vez concluída a instalação, aquele computador passa a exibir o selo de Windows licenciado permanente para aquela edição, mesmo que você troque peças, placa de vídeo ou monitor depois.',
   'Se anos mais tarde você decidir atualizar aquela máquina para uma edição mais nova do Windows (por exemplo, sair do Windows XP para o Windows 7 em 2009), basta pagar o valor da nova edição e aguardar a nova instalação.'
  ],
  costsAndLimits:[
   'A licença do Windows é individual por computador (diferente das licenças de jogos, que valem para a lan house inteira).',
   'Estações rodando Linux não precisam de licença de Windows e são totalmente isentas na fiscalização do Windows.',
   'Prazo após receber a carta Licenças de Windows pendentes: 7 dias do jogo.',
   'Multa por vencer o prazo com PCs Windows sem licença: R$ 210,00 + (R$ 60,00 × número de PCs sem licença) e -3 de reputação (pagar a multa não licencia as máquinas).'
  ],
  table:{
   caption:'Tabela completa das 8 versões do Windows, preços, tempos reais de instalação e requisitos',
   headers:['Versão do Windows','Ano','Preço por PC','Tempo de instalação (real)','Requisitos mínimos de hardware no PC'],
   rows:[
    ['Windows 98','1998','R$ 120','10 min reais','CPU 200 MHz (32 bits) · 32 MB RAM · 1 GB de disco (PC inicial atende)'],
    ['Windows 2000','2000','R$ 180','20 min reais','CPU 300 MHz (32 bits) · 64 MB RAM · 2 GB de disco (PC inicial atende)'],
    ['Windows XP','2001','R$ 260','30 min reais','CPU 300 MHz (32 bits) · 64 MB RAM · 2 GB de disco (PC inicial atende)'],
    ['Windows Vista','2007','R$ 350','40 min reais','CPU 1 GHz · 512 MB RAM · 20 GB de disco (requer CPU Turbo 2.4+ e HD 20 GB+)'],
    ['Windows 7','2009','R$ 420','50 min reais','CPU 1 GHz · 1 GB RAM · 20 GB de disco (exige upgrade para 1 GB de RAM)'],
    ['Windows 8','2012','R$ 460','60 min reais','CPU 1 GHz de 64 bits · 2 GB RAM · 20 GB de disco (requer CPU Duo 2.4 2008+)'],
    ['Windows 10','2015','R$ 520','70 min reais','CPU 1 GHz de 64 bits · 2 GB RAM · 32 GB de disco'],
    ['Windows 11','2021','R$ 620','80 min reais','CPU 1 GHz 2 núcleos 64 bits · 4 GB RAM · 64 GB disco · Placa-mãe com UEFI, TPM 2.0 e DX12 (AM4/AM5)']
   ]
  },
  commonProblems:[
   {
    problem:'O botão do Windows 8 ou Windows 10 está bloqueado mesmo eu tendo bastante memória RAM.',
    solution:'A partir do Windows 8, o sistema exige um processador de 64 bits (Duo 2.4 de 2008 ou superior). Processadores antigos de 32 bits (como Turbo 2.4 e Turbo 3.0) suportam no máximo até o Windows 7.'
   },
   {
    problem:'Não consigo instalar o Windows 11 num PC com Kit Quad 2012.',
    solution:'O Windows 11 exige placa-mãe com suporte completo a UEFI, TPM 2.0 e DirectX 12, presentes a partir da placa-mãe Estúdio AM4 (Kit Estúdio 2017) e Arena AM5 (Kit Arena 2024).'
   }
  ],
  playerTips:[
   'O sistema operacional tem peso de 25% na modernidade tecnológica do PC! Mesmo que você não troque todas as peças em 2001, atualizar os PCs para o Windows XP ajuda a sustentar o teto do seu preço por hora.',
   'Nunca desligue todos os seus computadores ao mesmo tempo para instalar o Windows: faça a instalação em 1 máquina por vez para que as demais continuem faturando no salão.'
  ],
  relatedIds:['006','007','012','017']
 },
 {
  number:12,
  id:'012',
  slug:'instalacao-do-windows-em-tempo-real',
  path:'/sobre-o-jogo/guias/012-instalacao-do-windows-em-tempo-real/',
  groupCode:'C',
  groupTitle:'Windows e licenciamento de sistema',
  title:'Instalação do Windows em tempo real: duração e regras práticas',
  summary:'Saiba como funciona a instalação de 10 a 80 minutos no relógio real, por que o progresso avança mesmo com o jogo fechado e como religar o PC.',
  unlockBadge:'Disponível desde 1998 (Dia 1)',
  uiPath:'Administrar → Windows / Licenças → Windows por PC',
  whatIs:[
   'Diferente dos reparos técnicos e dos downloads de jogos (que usam minutos do relógio do salão), a instalação de qualquer edição do Windows acontece em TEMPO REAL de relógio de parede: de 10 minutos reais para o Windows 98 até 80 minutos reais para o Windows 11.',
   'Enquanto a instalação está correndo, o computador exibe a porcentagem concluída e os minutos reais restantes, permanecendo desligado para atendimento e bloqueado para troca de peças.'
  ],
  whyItMatters:[
   'Como a contagem usa o horário real do seu aparelho (gravando o instante de início e o instante exato de término no save), o progresso da instalação continua avançando normalmente mesmo que você pause o jogo, saia para o menu ou feche a aba do navegador!',
   'Por outro lado, o novo Windows e a licença adquirida só entram em vigor quando o cronômetro chega a 100%: antes disso, a máquina ainda conserva o sistema anterior registrado e não pode receber clientes.'
  ],
  whenAvailable:[
   'Sempre que você comprar ou atualizar o Windows de qualquer computador em Administrar → Windows / Licenças → Windows por PC ou Administrar → Computadores → Windows.'
  ],
  howToUse:[
   'Vá em Administrar → Computadores → Operação e reparos e clique em Desligar estação no PC que deseja formatar/licenciar.',
   'Abra Administrar → Windows / Licenças → Windows por PC e clique no botão da versão do Windows desejada.',
   'Acompanhe a barra de progresso (por exemplo, Instalando Windows 98 · 45% · 6 min reais restantes) tanto na aba de licenças quanto no cartão da estação.',
   'Continue administrando o restante do salão — ou, se preferir, salve e feche o navegador: quando o tempo real terminar, o jogo concluirá a instalação automaticamente.',
   'Assim que aparecer o aviso de instalação concluída, volte em Operação e reparos e clique obrigatoriamente em Ligar estação para que o PC volte a atender clientes.'
  ],
  whatHappensNext:[
   'No segundo exato em que o tempo real se completa, o jogo registra a nova versão do Windows e a licença ativa naquela estação e adiciona um aviso no diário do salão pedindo para religar a máquina.',
   'O computador permanece desligado por segurança ao fim da instalação para que você decida se quer instalar mais algum componente antes de religá-lo.'
  ],
  costsAndLimits:[
   'Durações exatas em tempo real: Windows 98 (10 min) · Windows 2000 (20 min) · Windows XP (30 min) · Windows Vista (40 min) · Windows 7 (50 min) · Windows 8 (60 min) · Windows 10 (70 min) · Windows 11 (80 min).',
   'Durante a instalação, a máquina não pode ser ligada, não recebe clientes, não aceita reparo técnico e não permite trocar peças, GPU ou monitor.',
   'Se você receber a carta de fiscalização do Windows (prazo de 7 dias do jogo = 21 minutos reais de partida ativa), lembre-se de que uma instalação longa pode demorar mais em minutos reais do que os 7 dias do jogo se você deixar o expediente rodando sem pausar!'
  ],
  commonProblems:[
   {
    problem:'Recebi o aviso de 7 dias da fiscalização do Windows, mas o Windows que estou instalando leva 30 minutos reais e os 7 dias do jogo passam em 21 minutos reais!',
    solution:'Como o relógio da instalação do Windows corre no tempo real do mundo físico mesmo com a partida pausada, basta iniciar a instalação do Windows nos PCs pendentes e abrir o Menu ESC para pausar o relógio do salão até a instalação terminar!'
   },
   {
    problem:'A instalação do Windows chegou a 100%, mas nenhum cliente vai até aquele computador.',
    solution:'Ao terminar a instalação do Windows, o computador continua desligado. Vá em Administrar → Computadores → Operação e reparos e clique em Ligar estação.'
   }
  ],
  playerTips:[
   'Se você precisa instalar o Windows 7, 10 ou 11 (50 a 80 minutos reais) em várias máquinas antes de encerrar sua sessão de jogo do dia, inicie as instalações pouco antes de fechar o navegador: quando você voltar a jogar mais tarde, todas já estarão prontas!',
   'Antes de clicar para instalar uma nova versão do Windows, aproveite que o PC já está desligado para fazer eventuais trocas de peças, GPU ou monitor primeiro, pois essas trocas são instantâneas.'
  ],
  relatedIds:['002','010','011','014']
 }
];
