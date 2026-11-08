import type {GameGuide} from './guide-types';

export const guidesMO:readonly GameGuide[]=[
 {
  number:31,
  id:'031',
  slug:'perfis-de-clientes-escolhas-e-paciencia-na-fila',
  path:'/sobre-o-jogo/guias/031-perfis-de-clientes-escolhas-e-paciencia-na-fila/',
  groupCode:'M',
  groupTitle:'Clientes, VIPs e dinâmica do salão',
  title:'Perfis de clientes, escolha de máquinas e paciência na fila',
  summary:'Conheça os quatro perfis de público, como decidem entre PCs e consoles, quanto tempo esperam na fila do balcão e por que alguns desistem.',
  unlockBadge:'Disponível desde 1998 (Dia 1)',
  uiPath:'Salão principal · Administrar → Finanças → Opiniões dos clientes',
  whatIs:[
   'Cada morador que entra na sua lan house possui uma carteira própria de dinheiro, níveis iniciais de sede, fome e energia, um objetivo de visita (sessão de PC, console PS1/PS2, laboratório Linux, turma em rede ou serviço rápido de impressão/cópia) e um dos 4 perfis comportamentais: Econômico, Conforto, Gamer ou Rápido.',
   'O perfil do cliente determina qual computador livre ele escolhe quando é atendido no balcão, qual duração de pacote ele prefere contratar e como ele avalia a sessão ao se levantar.'
  ],
  whyItMatters:[
   'Entender como os clientes pensam explica por que algumas máquinas do seu salão são muito mais disputadas do que outras e por que certos visitantes vão embora da fila após 8 minutos enquanto outros esperam até 25 minutos.',
   'Quando você equilibra máquinas potentes, limpeza em dia, decoração agradável e preços justos, todos os quatro perfis saem elogiando o salão.'
  ],
  whenAvailable:[
   'Os quatro perfis de clientes frequentam a lan house desde o Dia 1 de 1998.'
  ],
  howToUse:[
   'Observe os balões de fala e o deslocamento dos clientes no salão: quem vem para impressão ou cópia avulsa resolve tudo no balcão em 3 minutos; quem vem para sessão aguarda uma estação compatível.',
   'Abra Administrar → Computadores → Receita por PC para notar como os clientes de perfil Conforto, Gamer e VIP concentram o uso nas estações mais modernas.',
   'Consulte Administrar → Finanças → Opiniões dos clientes para ler as frases deixadas por cada perfil e ajustar o que for necessário.'
  ],
  whatHappensNext:[
   'No atendimento do balcão, clientes de perfil Conforto, Gamer e VIP escolhem ativamente o computador livre com o maior bônus total de satisfação (melhor combinação de peças, GPU e monitor LCD). Já os clientes Econômicos e Rápidos aceitam a primeira estação disponível.',
   'Ao final da sessão, se a experiência superar as expectativas do perfil, sua reputação sobe; se faltar o jogo desejado, houver sujeira ou o preço estiver pesado, eles registram uma crítica.'
  ],
  costsAndLimits:[
   'Tempo máximo de espera na fila do balcão: Perfil Rápido aguarda até 8 minutos do jogo · Cliente VIP aguarda até 19 minutos · Perfis Econômico, Conforto e Gamer aguardam até 25 minutos.',
   'Se não houver estação livre dentro desse tempo (ou se o dinheiro na carteira do visitante não cobrir nem o pacote mínimo de 30 minutos), ele tenta fazer uma compra rápida de lanche ou vai embora (-0,4 de reputação).',
   'Limite físico simultâneo no salão: até 14 clientes dentro da lan house e até 6 clientes na fila do balcão.'
  ],
  table:{
   caption:'Os 4 Perfis Comportamentais de Clientes no Salão',
   headers:['Perfil do cliente','Paciência na fila','Como escolhe o PC livre','O que mais valoriza na avaliação'],
   rows:[
    ['Econômico','Até 25 min','Pega o primeiro PC livre compatível','Tarifa por hora acessível (+4 p.p. se preço baixo; penaliza preço alto)'],
    ['Conforto','Até 25 min','Escolhe o PC livre com maior bônus de hardware/LCD','Ambiente limpo, móveis de decoração e monitores modernos'],
    ['Gamer','Até 25 min','Prioriza PC com o jogo GPU desejado ou melhor hardware','Jogos licenciados, placas de vídeo PixelForce e PCs de nível 2 ou 3'],
    ['Rápido','Apenas 8 min','Pega o primeiro PC livre imediatamente','Fila curta no balcão e sessões rápidas de 30 ou 45 minutos']
   ]
  },
  commonProblems:[
   {
    problem:'Alguns clientes desistem da fila muito rápido, mesmo quando uma cadeira ia vagar logo depois.',
    solution:'Esses são os visitantes de perfil Rápido, que têm apenas 8 minutos do jogo de paciência na fila. Ter pelo menos 1 computador livre de reserva nos horários de movimento evita perder esse público.'
   }
  ],
  playerTips:[
   'Manter 1 ou 2 computadores superatualizados (com a melhor GPU e monitor LCD da época) já basta para encantar os clientes de perfil Conforto e Gamer, pois eles procuram ativamente a melhor máquina livre do salão!',
   'Itens de decoração comprados na loja somam até +9 pontos percentuais de satisfação ambiental para todos os perfis em todas as sessões.'
  ],
  relatedIds:['003','030','032','033']
 },
 {
  number:32,
  id:'032',
  slug:'clientes-vip-requisitos-e-bonus-de-receita',
  path:'/sobre-o-jogo/guias/032-clientes-vip-requisitos-e-bonus-de-receita/',
  groupCode:'M',
  groupTitle:'Clientes, VIPs e dinâmica do salão',
  title:"Clientes VIP: reputação, atendimento e avaliações",
  summary:"Entenda quando os clientes VIP podem chegar, como a reputação altera a frequência deles e como avaliam o atendimento.",
  unlockBadge:"VIPs elegíveis a partir de 55 pontos de reputação",
  uiPath:'Administrar → Computadores → Receita por PC (coluna VIP)',
  whatIs:[
   "Clientes VIP são um tipo de visitante especial do salão. Eles usam o mesmo fluxo de atendimento e são identificados no registro de sessões quando recebem atendimento.",
   "A aparição depende da reputação e de uma seleção determinística por visitante e dia do jogo. Não exige uma compra de equipamento específico ou uma tarifa exclusiva.",
  ],
  whyItMatters:[
   "VIPs ajudam a perceber a qualidade do atendimento: esperas demoradas, preço elevado sem hardware compatível e interrupções de internet afetam a avaliação que deixam.",
   "A administração pode registrar atendimentos VIP por computador, permitindo observar esse público separadamente sem inventar receitas extras.",
  ],
  whenAvailable:[
   "Com reputação inferior a 55, novos visitantes não são marcados como VIP. A partir de 55, eles podem aparecer conforme o cálculo de chegada do jogo.",
   "Na faixa de reputação entre 55 e 69, o critério de chegada usa 7%; de 70 a 84 usa 12%; a partir de 85 usa 19%. A seleção é determinística e esses percentuais não são garantia de chegada em cada visita.",
  ],
  howToUse:[
   "Mantenha a reputação acima de 55 oferecendo bom atendimento, preços compatíveis, internet estável e máquinas em condições de uso.",
   "Para receber VIPs mais frequentemente, tente alcançar 70 ou 85 de reputação. Não é necessário adquirir um PC de nível 2 apenas para liberar esse tipo de cliente.",
   "Atenda o visitante normalmente pelo balcão e deixe que ele escolha um equipamento disponível conforme as decisões de cliente do jogo.",
   "Consulte os indicadores de atendimento e receita por PC para identificar as sessões marcadas como VIP.",
  ],
  whatHappensNext:[
   "O cliente VIP paga a tarifa normal da sessão efetivamente contratada, com eventuais adicionais de jogo GPU aplicados pelas mesmas regras de preço de outras sessões.",
   "A opinião do VIP pode contribuir positivamente ou negativamente para a reputação conforme o hardware, a espera, a conexão e a tarifa cobrada.",
  ],
  costsAndLimits:[
   "Limiar de elegibilidade de novos VIPs: reputação 55, não 78.",
   "Critério de chegada: 7% com reputação de 55 a 69, 12% de 70 a 84, e 19% de 85 a 100; calculado deterministicamente por visitante e dia.",
   "Não há multiplicador universal de 25% no preço da sessão VIP nem bônus automático de 35% na carteira do cliente; o motor cobra a sessão contratada.",
   "O perfil VIP pode aguardar até 19 minutos na fila, exceto quando o visitante também tem perfil de sessão rápida, cujo limite é de 8 minutos.",
   "A avaliação especial de VIP considera qualidade do equipamento, preço, minutos de espera e tempo de falta de internet.",
  ],
  commonProblems:[
   {problem:"Minha reputação chegou a 55, mas ainda não encontrei um cliente VIP.",solution:"A elegibilidade não significa que o próximo visitante será VIP. O cálculo seleciona apenas parte dos visitantes; continue atendendo e acompanhe os registros."},
   {problem:"Minha reputação está alta, mas um VIP avaliou mal a sessão.",solution:"Verifique espera longa, queda de internet ou tarifa muito elevada em relação ao equipamento oferecido."},
   {problem:"O valor cobrado do VIP não veio com 25% a mais.",solution:"Está correto: o motor não aplica um bônus fixo de cobrança a VIPs. Eles pagam a sessão normalmente, com as regras de preço cabíveis."},
   {problem:"A frequência de VIPs diminuiu depois de uma série de problemas.",solution:"Se a reputação caiu de faixa, a proporção de visitantes elegíveis é menor. Priorize bom atendimento para recuperar a reputação."},
  ],
  playerTips:[
   "Não aumente o preço pensando que todo VIP paga mais: a cobrança continua seguindo a tarifa normal e os limites da época.",
   "Investir em boas máquinas e reduzir filas ajuda a manter a reputação, mesmo sem ser uma condição para o VIP aparecer.",
   "Acompanhe as avaliações após as sessões em vez de depender somente do contador de VIPs.",
  ],
  relatedIds:['006','010','030','031']
 },
 {
  number:33,
  id:'033',
  slug:'ampliacoes-do-salao-paredes-portas-e-decoracao',
  path:'/sobre-o-jogo/guias/033-ampliacoes-do-salao-paredes-portas-e-decoracao/',
  groupCode:'N',
  groupTitle:'Construção, layout e passagens',
  title:'Construção e decoração: ampliando o salão, divisórias, portas e móveis',
  summary:'Compare as expansões da sala principal e dos anexos, decore o ambiente para elevar o conforto e crie salas internas com divisórias e portas.',
  unlockBadge:'Disponível desde 1998 (Dia 1)',
  uiPath:'Compras → Construção / Decoração',
  whatIs:[
   'Na janela Compras, as categorias Construção e Decoração permitem transformar o pequeno imóvel inicial de 8×6 metros em um grande complexo personalizado.',
   'Você pode ampliar o terreno em quatro frentes (área principal mais anexos à esquerda, à direita e aos fundos), erguer paredes divisórias com portas internas para separar ambientes e instalar 6 tipos de móveis e itens de conforto.'
  ],
  whyItMatters:[
   'As expansões abrem espaço físico e novas vagas de computador (até 22 PCs no total), enquanto os itens de Decoração somam um bônus permanente de satisfação ambiental (até +9 pontos percentuais) que melhora o humor de todos os clientes em todas as sessões.',
   'Já as divisórias e portas permitem criar salas reservadas para os anexos, consoles ou laboratório Linux com a identidade visual que você preferir.'
  ],
  whenAvailable:[
   'Todas as opções de Construção e Decoração estão disponíveis desde o Dia 1 (1998) na janela Compras.'
  ],
  howToUse:[
   'Para expandir a sala principal (liberando +2 vagas de PC por etapa, até 7 PCs): abra Compras → Construção e compre Ampliar área principal (R$ 650,00 no Nível 1; R$ 1.100,00 no Nível 2).',
   'Para abrir anexos sem aumentar o aluguel mensal (liberando +1 vaga de PC de ampliação por etapa, até 5 por direção): compre Ampliar à esquerda, Ampliar à direita ou Ampliar os fundos (de R$ 500,00 no Nível 1 até R$ 1.900,00 no Nível 5 de cada lado).',
   'Para erguer paredes ou instalar portas internas: em Compras → Construção, compre um pacote de divisórias (Divisória creme, Divisória verde ou Divisória tijolo, que dão +4 segmentos por compra) ou uma Porta interna (+1 porta por compra) e clique nas linhas da grade do salão.',
   'Para melhorar o conforto do ambiente: abra Compras → Decoração, compre os itens desejados e clique no piso do salão para posicioná-los.'
  ],
  whatHappensNext:[
   'Móveis de decoração posicionados no salão somam imediatamente seu bônus de conforto ambiental (limitado ao teto de +9,0 p.p. / +0,09 no total).',
   'Se você erguer uma parede divisória fechando um cômodo, é obrigatório colocar uma Porta interna naquela parede para que clientes, faxineiro e técnico consigam atravessar!'
  ],
  costsAndLimits:[
   'Pacotes de divisórias (+4 segmentos por compra): Divisória creme (R$ 90) · Divisória verde (R$ 100) · Divisória tijolo (R$ 125).',
   'Porta interna (+1 unidade por compra): R$ 85,00 (só pode ser instalada sobre uma parede divisória já construída; ao demolir uma parede com porta, ambos os créditos voltam para o seu estoque de construção!).',
   'Teto máximo do bônus de conforto de decoração: +9,0 pontos percentuais.'
  ],
  table:{
   caption:'Catálogo de Itens de Decoração e Conforto Ambiental (Compras → Decoração)',
   headers:['Item de decoração','Preço unitário','Limite máximo no salão','Bônus de satisfação por unidade'],
   rows:[
    ['Pôster retrô','R$ 75','Até 6 unidades','+0,6 p.p. cada'],
    ['Planta','R$ 95','Até 8 unidades','+0,8 p.p. cada'],
    ['Luminária neon','R$ 160','Até 6 unidades','+1,1 p.p. cada'],
    ['Estante de revistas','R$ 210','Até 4 unidades','+1,2 p.p. cada'],
    ['Sofá de espera','R$ 290','Até 4 unidades','+1,6 p.p. cada'],
    ['Climatizador','R$ 540','Até 3 unidades','+2,5 p.p. cada']
   ]
  },
  commonProblems:[
   {
    problem:'Construí uma sala com divisórias para os PCs do anexo e o jogo bloqueou o último segmento de parede.',
    solution:'O motor de rotas nunca permite fechar um cômodo sem saída se houver computadores, consoles, máquinas de venda ou lixeiras lá dentro. Construa a parede deixando um vão ou instale uma Porta interna (R$ 85) em um dos segmentos já erguidos antes de fechar o último trecho!'
   }
  ],
  playerTips:[
   'Três Climatizadores (3 × 2,5 = +7,5 p.p.) somados a um Sofá de espera (+1,6 p.p.) já atingem o teto máximo de +9,0 pontos percentuais de conforto ambiental no salão!',
   'Se quiser remover uma parede divisória para mudar o layout, use o botão Remover divisórias no topo da janela Compras: o segmento é removido gratuitamente e volta como crédito disponível para você usar em outro lugar.'
  ],
  relatedIds:['005','030','034','038']
 },
 {
  number:34,
  id:'034',
  slug:'organizar-salao-e-diagnostico-de-passagens',
  path:'/sobre-o-jogo/guias/034-organizar-salao-e-diagnostico-de-passagens/',
  groupCode:'N',
  groupTitle:'Construção, layout e passagens',
  title:'Editor Organizar salão e diagnóstico de Passagens',
  summary:'Reposicione móveis e máquinas sem custo, entenda o bloqueio preventivo de caminhos e consulte o mapa de acessibilidade em Passagens.',
  unlockBadge:'Disponível desde 1998 (Dia 1)',
  uiPath:'Compras → Organizar salão · Administrar → Serviços → Passagens',
  whatIs:[
   'Em Lan House Simulator, todos os personagens (clientes, turmas de amigos, carteiro, faxineiro e técnico) caminham de verdade por uma grade física de navegação no piso do salão, desviando de mesas, paredes e objetos.',
   'Para que você possa remodelar o espaço a qualquer momento sem gastar nada, o jogo oferece o editor visual Organizar salão (no topo da janela Compras) e o painel de diagnóstico Administrar → Serviços → Passagens.'
  ],
  whyItMatters:[
   'Se o caminho entre a porta de entrada, o balcão, os computadores, os videogames, as máquinas de lanche ou as lixeiras ficar obstruído, os clientes e funcionários não conseguirão chegar ao destino.',
   'Por segurança, o editor Organizar salão testa todas as rotas em tempo real enquanto você move o mouse e impede que um objeto seja solto em uma posição que tranque alguma estação ou serviço.'
  ],
  whenAvailable:[
   'O botão Organizar salão (em Compras) e a sub-aba Passagens (em Administrar → Serviços) estão disponíveis desde o Dia 1 (1998).'
  ],
  howToUse:[
   'Para mover objetos já instalados no salão: abra a janela Compras e clique no botão Organizar salão no topo (o relógio do expediente pausa automaticamente enquanto o editor está ativo).',
   'Clique sobre qualquer objeto reposicionável no salão (plantas, sofás, climatizadores, estantes, luminárias, pôsteres, máquinas de venda, lixeiras, bancadas de PS1/PS2 ou PCs de ampliação) e escolha a nova posição válida.',
   'Para remover paredes já erguidas, clique no botão Remover divisórias no topo de Compras e clique sobre a parede no salão.',
   'Para conferir se todos os pontos vitais da lan house estão acessíveis, abra Administrar → Serviços → sub-aba Passagens e veja o relatório de rotas.'
  ],
  whatHappensNext:[
   'Ao clicar em uma posição válida no piso, o objeto é transferido instantaneamente sem nenhum custo financeiro.',
   'Se a posição escolhida bloquear uma cadeira, sobrepor outro móvel ou cortar a rota até as lixeiras/balcão, o cursor fica vermelho e mostra na tela o motivo exato do impedimento.'
  ],
  costsAndLimits:[
   'Custo para mover móveis, máquinas de lanche, lixeiras, consoles e PCs de ampliação: R$ 0,00 (totalmente gratuito).',
   'Elementos que têm posição estrutural fixa na planta original: a porta de entrada da rua, o balcão do Tony e as 7 vagas numeradas da área principal (PC 1 a PC 7). Já todos os 15 PCs de ampliação, todos os consoles, máquinas de venda, lixeiras e decorações podem ser movidos livremente!',
   'Não é permitido mover um PC ou console no exato momento em que um cliente está sentado nele ou caminhando para usá-lo.'
  ],
  commonProblems:[
   {
    problem:'Quero mover uma bancada de videogame ou um PC de anexo, mas o jogo avisa que o equipamento está em uso.',
    solution:'Aguarde o cliente terminar a sessão (ou faça a mudança entre 21:30 e 22:00, quando todos os clientes já levantaram das cadeiras).'
   },
   {
    problem:'O cursor fica vermelho quando tento colocar um sofá perto do corredor.',
    solution:'Todo equipamento exige uma célula de piso livre exatamente no ponto de interação (na frente da cadeira do PC/console, na frente do balcão e na frente das máquinas de venda e lixeiras) conectada por caminho contínuo até a porta da rua.'
   }
  ],
  playerTips:[
   'Como abrir o modo Organizar salão pausa o relógio da partida automaticamente, você pode remodelar toda a sua lan house com tranquilidade sem perder um único minuto de expediente!',
   'Sempre que ampliar o salão para a esquerda, direita ou fundos, aproveite para reposicionar as lixeiras e os climatizadores de forma equilibrada e cheque a sub-aba Passagens.'
  ],
  relatedIds:['002','005','025','033']
 },
 {
  number:35,
  id:'035',
  slug:'correio-avisos-fiscais-e-historias-do-bairro',
  path:'/sobre-o-jogo/guias/035-correio-avisos-fiscais-e-historias-do-bairro/',
  groupCode:'O',
  groupTitle:'Correio, eventos, salvamento e conta',
  title:'Correio, avisos de fiscalização e histórias interativas do bairro',
  summary:'Acompanhe os prazos de vistoria no Correio, leia as correspondências históricas de 1998 a 2030 e tome decisões nas 12 histórias do bairro.',
  unlockBadge:'Disponível desde 1998 (Dia 1)',
  uiPath:'Barra superior → Correio',
  whatIs:[
   'O painel Correio (acessado na barra superior, com contador de mensagens não lidas) é a caixa de entrada onde o bairro, os órgãos de fiscalização, a família do Tony e a imprensa de tecnologia conversam com você ao longo dos 33 anos de campanha.',
   'Por lá chegam quatro categorias de mensagens: Avisos operacionais e fiscais (Windows, direitos autorais e Bombeiros), Desbloqueios de campanha (fórum Linux de 1999, e-mails do primo Eric em 2000 e as 28 revistas Top Games), Cartas históricas de época (1998 a 2030) e 12 Histórias interativas do bairro em 3 etapas.'
  ],
  whyItMatters:[
   'Ficar atento ao Correio evita ser pego de surpresa por prazos de 7 ou 8 dias das vistorias de Windows, jogos e instalação elétrica.',
   'Além disso, as 12 histórias interativas dos moradores do bairro trazem decisões reais: suas escolhas podem render recompensas em dinheiro, aumentos de reputação e até bônus temporários no fluxo de clientes da lan house!'
  ],
  whenAvailable:[
   'Disponível desde o Dia 1 (1998) no botão Correio da barra superior.'
  ],
  howToUse:[
   'Sempre que o botão Correio no topo da tela exibir um número de novas mensagens, clique nele para abrir a caixa de entrada.',
   'Priorize primeiro os avisos com botões de ação ou prazo (como Licenças de Windows pendentes, Direitos autorais dos jogos, Bombeiros: instalação elétrica irregular e Fórum da cidade · Vocês têm Linux?).',
   'Quando receber o início de uma história de morador (como Dona Helena, Seu Arnaldo, Professora Sônia, Bia ou Padre Miguel), escolha uma das opções de resposta para conduzir a narrativa pelas 3 etapas.'
  ],
  whatHappensNext:[
   'Nas 12 histórias do bairro, após a sua escolha na Etapa 1, o desfecho avança após alguns dias para a Etapa 2 e depois para a conclusão na Etapa 3, aplicando as consequências no caixa, na reputação ou no movimento de visitantes.',
   'Todas as cartas lidas e edições de revistas recebidas permanecem salvas no histórico do Correio para consulta.'
  ],
  costsAndLimits:[
   'Avisos fiscais com prazo: Fiscalização de Windows (7 dias de prazo; multa de R$ 210 + R$ 60/PC sem licença e -3 rep) · Direitos autorais de jogos (7 dias de prazo; multa de R$ 540 e -5 rep) · Vistoria elétrica dos Bombeiros (8 dias de prazo, prorrogável +8 dias; multa e -3 rep se vencer).',
   'Histórias interativas do bairro: até 12 arcos narrativos de 3 etapas distribuídos ao longo da campanha (com intervalo mínimo entre histórias e apenas 1 história com decisão pendente por vez).'
  ],
  table:{
   caption:'Principais categorias de mensagens recebidas no Correio',
   headers:['Tipo de correspondência','Exemplos reais no jogo','O que você pode fazer na mensagem'],
   rows:[
    ['Vistorias e Fiscalizações','Licenças de Windows pendentes · Direitos autorais · Bombeiros','Regularizar dentro do prazo de 7 ou 8 dias para evitar multas e perda de reputação'],
    ['Desbloqueios de Mecânicas','Fórum Linux (1999) · Primo Eric (2000) · Revistas Top Games (2002–2010)','Assinar Informática Livre, conhecer Setor Zero e liberar CDs/DVDs de PS1 e PS2'],
    ['12 Histórias do Bairro','Dona Helena · Seu Arnaldo · Bia (vestibular) · Jornal do bairro · etc.','Tomar decisões em 3 capítulos que afetam caixa, reputação e fluxo de visitas'],
    ['Cartas de Época (1998–2030)','Relatos da mãe do Tony, chegada do ADSL, febre das redes sociais e fibra','Acompanhar a evolução cultural e tecnológica do Brasil ano a ano']
   ]
  },
  commonProblems:[
   {
    problem:'Recebi uma multa de Windows ou direitos autorais sem perceber.',
    solution:'Os avisos prévios chegam no Correio dando 7 dias inteiros de prazo antes da multa. Crie o hábito de checar o botão Correio sempre que o contador indicar mensagem nova.'
   }
  ],
  playerTips:[
   'Nas 12 histórias do bairro, apoiar a comunidade (como ajudar estudantes, o jornal local ou moradores em dificuldade) costuma custar poucos reais no primeiro capítulo, mas recompensa você no terceiro capítulo com ótima reputação e dias de movimento extra na porta!',
   'Se uma escolha de história pedir um pequeno valor em dinheiro e você estiver na véspera do Dia 31, pode aguardar o fechamento mensal passar antes de clicar na opção, pois os convites de história não aplicam multa.'
  ],
  relatedIds:['008','011','013','017']
 },
 {
  number:36,
  id:'036',
  slug:'corujao-de-sexta-feira-formatos-e-galeria-de-trofeus',
  path:'/sobre-o-jogo/guias/036-corujao-de-sexta-feira-formatos-e-galeria-de-trofeus/',
  groupCode:'O',
  groupTitle:'Correio, eventos, salvamento e conta',
  title:'Corujão da primeira sexta-feira: formatos, madrugada e galeria de troféus',
  summary:'Agende viradas noturnas das 22:00 às 10:00 a partir de 2001, escolha entre Sessão livre, Pontos ou Eliminatórias e colecione troféus digitais.',
  unlockBadge:'A partir de 2001 (com Setor Zero licenciado e 2+ PCs)',
  uiPath:'Administrar → Finanças → Primeira sexta',
  whatIs:[
   'A partir do ano 2001, toda primeira sexta-feira de cada mês (dias 2, 32, 62, 92... do calendário de 30 dias) permite realizar o lendário Corujão da Lan House: uma virada noturna especial das 22:00 de sexta até as 10:00 da manhã de sábado jogando Setor Zero em rede local!',
   'Na sub-aba Administrar → Finanças → Primeira sexta, você escolhe entre 3 formatos de evento para a madrugada: Sessão livre, Campeonato por pontos ou Eliminatórias (que grava eternamente o campeão na 🏆 Galeria digital de troféus).'
  ],
  whyItMatters:[
   'Durante o Corujão, os 2 ou 3 participantes convidados entram às 23:00 e pagam 7 horas inteiras de sessão cada um (420 minutos × sua tarifa horária atual), além de fazerem pausa às 02:30 da madrugada para comprar refrigerante ou salgadinho!',
   'Como a madrugada roda em um relógio noturno próprio (das 22:00 de sexta às 10:00 de sábado), você ganha um turno inteiro extra de faturamento antes de o sábado começar.'
  ],
  whenAvailable:[
   'Disponível a partir de 2001 quando sua lan house possui o jogo Setor Zero licenciado e pelo menos 2 computadores operacionais com licença paga do Windows.'
  ],
  howToUse:[
   'Abra Administrar → Finanças → sub-aba Primeira sexta.',
   'Escolha o formato desejado para a virada: Sessão livre, Campeonato por pontos ou Eliminatórias.',
   'Nos dias que antecedem a primeira sexta-feira do mês (ou na própria sexta-feira antes das 22:00), clique no botão Agendar para sexta.',
   'Quando o relógio atingir 22:00 da primeira sexta-feira, acompanhe a saída dos clientes diurnos, a chegada da turma do Corujão às 23:00, o placar ao vivo durante a madrugada e a entrega da premiação às 07:00 da manhã.',
   'Clique em 🏆 Galeria digital na mesma sub-aba para ver o pódio histórico de campeões e a coleção de troféus conquistados nas Eliminatórias.'
  ],
  whatHappensNext:[
   'Às 23:00 os convidados entram, pagam 7 horas cada um no balcão e sentam nos computadores Windows licenciados livres. Às 02:30 da madrugada, um por vez levanta rapidamente para comprar lanche nas máquinas/prateleira.',
   'Às 07:00 da manhã a disputa termina, o prêmio do torneio é entregue ao vencedor e às 10:00 o relógio abre normalmente o expediente de sábado!'
  ],
  costsAndLimits:[
   'Requisitos para agendar e iniciar: Ano 2001 em diante + Setor Zero licenciado + pelo menos 2 PCs operacionais com Windows licenciado.',
   'Receita de sessão na entrada (23:00): cada participante (2 ou 3 jogadores) paga 7 × preço da sua hora.',
   'Premiação paga pelo caixa às 07:00 (nos modos Campeonato por pontos e Eliminatórias): limitada a no máximo 20% da receita de sessões da noite (com teto de R$ 40,00). No modo Sessão livre, não há pagamento de prêmio em dinheiro!',
   'Estorno de segurança: se por algum bloqueio de rota ou falta de máquina os convidados não conseguirem sentar nos PCs até as 01:45 da madrugada, o evento é cancelado e os valores pagos na noite são estornados.'
  ],
  table:{
   caption:'Comparativo dos 3 Formatos do Corujão de Sexta-Feira',
   headers:['Formato do Corujão','Como funciona na madrugada','Prêmio pago às 07:00','Gera troféu na Galeria?'],
   rows:[
    ['Sessão livre','Partidas amistosas de Setor Zero a noite toda','R$ 0,00 (100% da receita fica no caixa)','Não'],
    ['Campeonato por pontos','Soma de 1 a 4 pontos por participante a cada 12 min','Até 20% da receita da noite (máx. R$ 40)','Não'],
    ['Eliminatórias','Chave classificatória (com 3 jogadores) + Grande Final de 12 rodadas','Até 20% da receita da noite (máx. R$ 40)','Sim! Grava troféu permanente na 🏆 Galeria digital']
   ]
  },
  commonProblems:[
   {
    problem:'Agendei o Corujão, mas às 22:00 de sexta o jogo pulou direto para sábado sem abrir a madrugada.',
    solution:'Para o Corujão iniciar às 22:00, pelo menos 2 computadores com Windows licenciado precisam estar ligados, livres de manutenção e acessíveis no momento do fechamento. Se você desligou os PCs às 21:45 ou se eles quebraram, a virada noturna não pode começar.'
   }
  ],
  playerTips:[
   'Garanta que pelo menos 3 computadores com Windows licenciado estejam ligados e revisados na primeira sexta-feira do mês: com 3 máquinas prontas, entram 3 jogadores pagando 7 horas cada (21 horas de sessão faturadas numa única noite!).',
   'Escolha o formato Eliminatórias sempre que quiser eternizar um novo troféu com o nome do campeão, vice-campeão, placar e data na sua 🏆 Galeria digital (que comporta até 64 troféus históricos).'
  ],
  relatedIds:['002','011','018','029']
 },
 {
  number:37,
  id:'037',
  slug:'salvamento-automatico-backup-e-arquivos-json',
  path:'/sobre-o-jogo/guias/037-salvamento-automatico-backup-e-arquivos-json/',
  groupCode:'O',
  groupTitle:'Correio, eventos, salvamento e conta',
  title:'Salvamento automático, recuperação de backup e transferência por arquivo JSON',
  summary:'Veja como o jogo protege seu progresso no navegador, como exportar ou carregar sua campanha em arquivo JSON e como gerenciar Dados locais.',
  unlockBadge:'Disponível desde 1998 (Dia 1)',
  uiPath:'Menu ESC → Salvar em arquivo / Carregar arquivo · Página /dados/',
  whatIs:[
   'Lan House Simulator salva sua partida automaticamente no próprio navegador sem exigir internet nem criação de conta. Além do salvamento principal contínuo, o jogo mantém uma cópia de segurança diária automática (backup local) para proteger sua campanha contra fechamentos bruscos.',
   'Para levar sua partida para outro computador ou celular — ou guardar uma cópia eterna no seu aparelho —, o Menu ESC oferece os botões Salvar em arquivo (que baixa um arquivo .json) e Carregar arquivo.'
  ],
  whyItMatters:[
   'Como os dados locais ficam vinculados ao navegador e ao endereço do site onde você está jogando, limpar os dados de navegação do navegador pode apagar o progresso local se você não tiver baixado uma cópia em arquivo JSON ou enviado para a nuvem.',
   'Conhecer também a página institucional /dados/ permite gerenciar ou apagar com segurança a partida local ou a preferência de som sempre que você desejar.'
  ],
  whenAvailable:[
   'O salvamento automático e os botões Salvar em arquivo / Carregar arquivo estão disponíveis desde o primeiro segundo de jogo.'
  ],
  howToUse:[
   'Para jogar tranquilo no mesmo aparelho: não é preciso clicar em nada, pois o jogo grava seu progresso automaticamente a cada 8 segundos, ao trocar de aba, ao minimizar no celular e ao fechar a janela.',
   'Para baixar uma cópia de segurança em arquivo: clique em Menu ESC na barra superior e clique em Salvar em arquivo. O navegador baixará um arquivo chamado lan-house-simulator-dia-N.json.',
   'Para retomar essa partida em outro aparelho ou navegador: abra o Menu ESC, clique em Carregar arquivo e selecione o arquivo .json exportado.',
   'Para inspecionar ou apagar seletivamente os dados guardados neste navegador: acesse a página Dados locais (/dados/) pelo rodapé do site e use os botões Apagar minha partida ou Redefinir preferência de som (com confirmação explícita).'
  ],
  whatHappensNext:[
   'Sempre que o dia vira no salão, o sistema rotaciona automaticamente o seu save válido do dia anterior para o slot de backup local. Se um dia o save principal sofrer qualquer falha de leitura, o jogo restaura o backup automaticamente e avisa você na tela!',
   'Ao importar um arquivo JSON pelo botão Carregar arquivo, o jogo valida a integridade completa do arquivo (limite de 2 MB, valores financeiros, móveis e rotas) antes de substituir a partida atual.'
  ],
  costsAndLimits:[
   'Frequência do salvamento automático local: a cada 8 segundos e em eventos de saída/minimização da página.',
   'Tamanho máximo aceito para importação de arquivo JSON: 2 MB.',
   'Atenção ao reiniciar ou importar: iniciar uma Nova partida, clicar em Reiniciar partida ou importar um arquivo JSON substitui tanto o save principal quanto o backup local pela nova campanha.'
  ],
  commonProblems:[
   {
    problem:'Troquei de navegador (ou abri uma janela anônima) e minha lan house não apareceu em Continuar partida.',
    solution:'O armazenamento local de cada navegador é isolado (e janelas anônimas apagam os dados ao fechar). No navegador original, abra o Menu ESC → Salvar em arquivo e depois use Carregar arquivo no navegador novo (ou use o salvamento na nuvem em 🍪 Minha Conta).'
   }
  ],
  playerTips:[
   'Baixe um arquivo JSON em Menu ESC → Salvar em arquivo ao final de cada ano importante da sua campanha (como 2000, 2005, 2012 e 2024): assim você cria pontos históricos para revisitar quando quiser!',
   'Na página /dados/, apertar ESC ou clicar em Cancelar na janela de confirmação nunca apaga seus dados — a exclusão só ocorre se você confirmar explicitamente.'
  ],
  relatedIds:['001','002','004','038']
 },
 {
  number:38,
  id:'038',
  slug:'minha-conta-salvamento-na-nuvem-cookies-e-donate',
  path:'/sobre-o-jogo/guias/038-minha-conta-salvamento-na-nuvem-cookies-e-donate/',
  groupCode:'O',
  groupTitle:'Correio, eventos, salvamento e conta',
  title:'Minha Conta, salvamento na nuvem, Loja Cookies e apoio em Donate',
  summary:'Use a conta opcional para guardar saves na nuvem, conheça os 9 itens puramente visuais da Loja Cookies e saiba como funciona o apoio opcional.',
  unlockBadge:'Conta opcional disponível a qualquer momento',
  uiPath:'Barra superior → 🍪 Minha Conta · Páginas /conta/ e /donate/',
  whatIs:[
   'Lan House Simulator é 100% gratuito do início de 1998 ao fim de 2030 e não exige cadastro para jogar. Para quem deseja recursos extras de conveniência e personalização visual, o botão 🍪 Minha Conta (dentro do jogo) e a página /conta/ (no site) oferecem uma conta opcional autenticada por e-mail.',
   'Com a conta conectada e o e-mail confirmado, você pode sincronizar sua partida na Nuvem (com save principal e backup anterior) e utilizar Cookies — a moeda virtual opcional obtida ao apoiar o projeto em /donate/ — para resgatar até 9 itens puramente cosméticos na Loja Cookies.'
  ],
  whyItMatters:[
   'O salvamento na nuvem permite enviar sua campanha para o servidor e restaurá-la facilmente em outro computador ou celular, sem depender apenas de arquivos locais.',
   'Já os 9 itens da Loja Cookies mudam o estilo visual do salão, das cadeiras, dos periféricos e do próprio Tony sem alterar absolutamente nada na economia, na satisfação dos clientes ou na dificuldade do jogo (zero pay-to-win).'
  ],
  whenAvailable:[
   'Você pode criar ou acessar sua conta opcional a qualquer momento pelo botão 🍪 Minha Conta no topo do jogo ou em /conta/.',
   'Na Loja Cookies, qualquer item pode ser resgatado em qualquer época, e o efeito visual dele aparece no salão assim que o calendário da partida atinge o Ano de uso histórico daquele item.'
  ],
  howToUse:[
   'No jogo, clique em 🍪 Minha Conta na barra superior (o relógio da partida pausa automaticamente enquanto essa janela está aberta).',
   'Na aba Resumo, entre com seu e-mail e senha (ou crie uma conta e confirme o link enviado ao seu e-mail).',
   'Para usar a nuvem dentro do jogo: abra a aba Nuvem, clique primeiro em Consultar nuvem e depois use Salvar na nuvem, Restaurar partida ou Restaurar backup (você também pode baixar e enviar saves pela aba Salvamentos na página /conta/).',
   'Para resgatar e equipar personalizações visuais: abra a aba Loja Cookies para resgatar itens com seu saldo de Cookies e depois marque ou desmarque a caixa Equipado na aba Meus itens.'
  ],
  whatHappensNext:[
   'Quando um item cosmético está marcado como Equipado e a partida já chegou ao ano histórico dele, o visual aparece imediatamente no salão (e pode ser ligado ou desligado quando você quiser na aba Meus itens).',
   'Na nuvem, toda gravação exige consultar a revisão atual antes de enviar para evitar sobrescrever acidentalmente um progresso salvo em outro aparelho, mantendo sempre o save anterior guardado como backup na nuvem.'
  ],
  costsAndLimits:[
   'A conta e o salvamento na nuvem são gratuitos; apoiar em /donate/ é totalmente opcional e sem assinatura recorrente.',
   'Pacotes de apoio opcional em /donate/ (quando o serviço de pagamentos está habilitado no ambiente): Apoio de R$ 5,00 (credita 50 Cookies) e Apoio de R$ 10,00 (credita 100 Cookies), liberados somente após confirmação autenticada do servidor.',
   'Regra de Ano de uso dos cosméticos: itens de 1998 aparecem desde o Dia 1; itens de anos posteriores (2000, 2008, 2010 e 2012) ficam guardados na sua conta exibindo Aguardando ano de uso até a campanha chegar ao ano correspondente.'
  ],
  table:{
   caption:'Catálogo completo dos 9 Cosméticos da Loja Cookies (100% visuais, sem efeito econômico)',
   headers:['Cosmético na Loja Cookies','Custo em Cookies','Ano de uso no salão','O que muda visualmente no jogo'],
   rows:[
    ['Pôsteres Exclusivos','12 Cookies','Desde 1998','Três ilustrações retrô-futuristas especiais nas posições de pôsteres'],
    ['Piso Arcade Xadrez','25 Cookies','Desde 1998','Piso modular em grafite e marfim com juntas ciano no salão'],
    ['Teclado Rainbow RGB','25 Cookies','A partir de 2012','Teclas com iluminação colorida e efeito de onda nas estações'],
    ['Placa Neon ABERTO','30 Cookies','Desde 1998','Letreiro luminoso sobre a entrada (acende no expediente e apaga à noite)'],
    ['Relógio Pixel LED','30 Cookies','A partir de 2000','Relógio digital de parede exibindo a hora do jogo com LEDs pulsantes'],
    ['Fone Gamer RGB Neon','40 Cookies','A partir de 2012','Headset iluminado usado pelos clientes durante as sessões de PC'],
    ['Aquário Iluminado RGB','45 Cookies','A partir de 2008','Aquário mural com peixes animados e bolhas sem ocupar espaço de passagem'],
    ['Cadeira Gamer Neon','50 Cookies','A partir de 2012','Cadeiras giratórias estilo gamer com estofamento e contorno RGB'],
    ['Tony Cyber','60 Cookies','A partir de 2010','Uniforme cyberpunk para o Tony com colete tecnológico e visor iluminado']
   ]
  },
  commonProblems:[
   {
    problem:'Cliquei em Salvar na nuvem e o jogo pediu para clicar em Consultar nuvem primeiro.',
    solution:'Por segurança contra perda de progresso entre dois aparelhos diferentes, o jogo exige clicar em Consultar nuvem primeiro para verificar a revisão mais recente guardada no servidor antes de enviar um novo save.'
   },
   {
    problem:'Resgatei a Cadeira Gamer Neon ou o Tony Cyber na Loja Cookies, marquei como Equipado, mas ainda não apareceu no salão.',
    solution:'Confira o ano atual da sua partida: itens modernos têm um ano histórico de estreia (por exemplo, 2010 para Tony Cyber e 2012 para Cadeira Gamer, Fone e Teclado RGB). Assim que sua campanha chegar àquele ano, eles aparecem automaticamente!'
   }
  ],
  playerTips:[
   'Mesmo usando o salvamento na nuvem em 🍪 Minha Conta, vale a pena baixar periodicamente uma cópia local em Menu ESC → Salvar em arquivo para ter dupla proteção.',
   'Os quatro itens liberados já na fase inicial — Pôsteres Exclusivos (1998), Piso Arcade Xadrez (1998), Placa Neon ABERTO (1998) e Relógio Pixel LED (2000) — já deixam o salão com visual único logo nos primeiros anos da campanha!'
  ],
  relatedIds:['001','004','033','037']
 }
];
