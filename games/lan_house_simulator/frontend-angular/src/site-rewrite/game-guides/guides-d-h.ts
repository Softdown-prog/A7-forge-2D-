import type {GameGuide} from './guide-types';

export const guidesDH:readonly GameGuide[]=[
 {
  number:13,
  id:'013',
  slug:'missao-linux-1999-e-revistas-informatica-livre',
  path:'/sobre-o-jogo/guias/013-missao-linux-1999-e-revistas-informatica-livre/',
  groupCode:'D',
  groupTitle:'Linux e estações livres',
  title:'A chegada do Linux em 1999 e a coleção Informática Livre',
  summary:'Acompanhe a carta do fórum da cidade em março de 1999, a assinatura das 6 revistas entregues pelo carteiro e os 30 dias finais de estudo do Tony.',
  unlockBadge:'A partir de 01/03/1999 (Dia 421)',
  uiPath:'Correio → Fórum da cidade · Vocês têm Linux?',
  whatIs:[
   'No dia 1º de março de 1999 (Dia 421 da campanha histórica), Tony recebe no Correio a carta Fórum da cidade · Vocês têm Linux?. Estudantes e programadores do bairro perguntam se a lan house pretende montar computadores com sistema aberto e indicam a assinatura da coleção impressa Informática Livre na Banca da Praça Central.',
   'Ao assinar a revista, Tony passa a receber 6 edições mensais entregues em mãos pelo carteiro no balcão da lan house, estudando desde os conceitos de software livre e terminal até a montagem de um laboratório Linux.'
  ],
  whyItMatters:[
   'Concluir a coleção das 6 revistas e os 30 dias finais de prática do Tony é a única forma de desbloquear na loja as duas estações especiais de Linux: a Bancada Linux 99 e a Estação Programador 99.',
   'Essas máquinas atendem um público fiel do fórum da cidade, nunca exigem licença paga de sistema operacional e continuam funcionando normalmente mesmo quando a internet da lan house cai.'
  ],
  whenAvailable:[
   'A carta de convite chega em 01/03/1999 (Dia 421) no modo de economia histórica.',
   'Se você não assinar imediatamente em março de 1999, a carta permanece guardada no Correio e você pode iniciar a assinatura meses ou anos depois sem perder o conteúdo.'
  ],
  howToUse:[
   'A partir de março de 1999, clique no botão Correio na barra superior e localize a carta Fórum da cidade · Vocês têm Linux?.',
   'Clique no botão Assinar Informática Livre · R$ 8 + 6 edições de R$ 12 para pagar a taxa de adesão de R$ 8,00.',
   'No final de cada mês (a cada 30 dias do jogo), mantenha pelo menos R$ 12,00 em caixa e o caminho livre entre a porta de entrada e o balcão.',
   'Observe o carteiro (de camisa amarela e bolsa a tiracolo) entrar no salão, caminhar até o balcão e entregar o exemplar ao Tony durante 5 minutos do jogo, descontando os R$ 12,00 no ato da entrega.',
   'Após receber a 6ª edição, aguarde os 30 dias finais de estudo prático do Tony até chegar a carta Fórum Linux · Tony concluiu seus estudos! (no mínimo em 01/10/1999, Dia 631).'
  ],
  whatHappensNext:[
   'Cada edição entregue pelo carteiro gera uma nova mensagem no Correio resumindo o tema estudado naquele mês (como estrutura do computador, comandos de terminal, permissões de usuários e compilação).',
   'Passados 30 dias da entrega da 6ª revista, as duas estações Linux aparecem liberadas para compra em Compras → Computadores e serviços.'
  ],
  costsAndLimits:[
   'Taxa de inscrição na assinatura: R$ 8,00 (paga uma única vez no Correio).',
   'Custo de cada edição mensal: R$ 12,00 cobrados somente quando o carteiro conclui os 5 minutos de entrega no balcão (6 edições × R$ 12,00 = R$ 72,00; custo total da coleção = R$ 80,00).',
   'Intervalo mínimo entre uma revista e a seguinte: 30 dias do jogo após a entrega anterior.',
   'Período final de estudo após a 6ª edição: 30 dias do jogo (liberação mais rápida possível: 01/10/1999, Dia 631).'
  ],
  table:{
   caption:'Cronograma das 6 edições da coleção Informática Livre (assinando em março de 1999)',
   headers:['Edição','Mês de referência (Dia mín.)','Título da edição','Valor na entrega'],
   rows:[
    ['Edição 1/6','Março de 1999 (Dia 450)','O que é Linux? (software livre e distribuições)','R$ 12,00'],
    ['Edição 2/6','Abril de 1999 (Dia 480)','Por dentro do computador (CPU, memória e disco)','R$ 12,00'],
    ['Edição 3/6','Maio de 1999 (Dia 510)','Terminal e comandos (arquivos, diretórios e shell)','R$ 12,00'],
    ['Edição 4/6','Junho de 1999 (Dia 540)','Permissões e usuários (contas e segurança)','R$ 12,00'],
    ['Edição 5/6','Julho de 1999 (Dia 570)','Editores e programação (código e bibliotecas)','R$ 12,00'],
    ['Edição 6/6','Agosto de 1999 (Dia 600)','Montando um laboratório Linux (bancadas e rede)','R$ 12,00']
   ]
  },
  commonProblems:[
   {
    problem:'Chegou o fim do mês, mas o carteiro não entrou para entregar a revista.',
    solution:'O carteiro só entra no salão se você tiver pelo menos R$ 12,00 disponíveis no caixa e se houver rota livre entre a porta de entrada e a frente do balcão. Assim que o caixa atingir R$ 12,00, ele fará a entrega sem multa, mas a próxima edição ficará para 30 dias depois dessa entrega.'
   },
   {
    problem:'Já recebi a 6ª revista em agosto, mas as máquinas Linux ainda não apareceram na loja.',
    solution:'Depois de receber a 6ª edição, Tony precisa de mais 30 dias completos de estudo prático no laboratório (todo o mês de setembro). No dia 1º de outubro de 1999 (ou 30 dias após a 6ª entrega), chega a carta confirmando o desbloqueio.'
   }
  ],
  playerTips:[
   'Assine a Informática Livre assim que a carta chegar em março de 1999: como o calendário exige no mínimo 30 dias entre cada exemplar, começar cedo garante as estações Linux logo em outubro de 1999.',
   'A entrega do carteiro é física e não depende da internet estar online: mesmo durante uma queda de conexão, ele entra normalmente no salão.'
  ],
  relatedIds:['014','022','034','035']
 },
 {
  number:14,
  id:'014',
  slug:'estacoes-linux-operacao-e-dual-boot',
  path:'/sobre-o-jogo/guias/014-estacoes-linux-operacao-e-dual-boot/',
  groupCode:'D',
  groupTitle:'Linux e estações livres',
  title:'Estações Linux: Bancada 99, Estação Programador e alternância de sistema',
  summary:'Compare as duas máquinas Linux de 1999, atenda estudantes imunes a quedas de internet e veja como alternar o boot caso instale Windows nelas.',
  unlockBadge:'Outubro de 1999 (após concluir as 6 revistas + 30 dias)',
  uiPath:'Compras → Computadores e serviços → Bancada Linux 99 / Estação Programador 99',
  whatIs:[
   'Após Tony concluir os estudos da revista Informática Livre, duas estações físicas completas com sistema Linux pré-instalado ficam disponíveis na loja: a Bancada Linux 99 (R$ 440,00) e a Estação Programador 99 (R$ 610,00).',
   'Importante: no simulador, o Linux não é instalado formatando os seus PCs Windows antigos; você compra uma estação Linux nova pronta na loja, que ocupa uma vaga física da área principal do salão.'
  ],
  whyItMatters:[
   'Ter pelo menos uma estação Linux ativa atrai um público exclusivo: cerca de 12,5% dos visitantes regulares passam a ser estudantes e programadores do fórum da cidade, que procuram especificamente um computador Linux.',
   'Além disso, quem está usando uma máquina em modo Linux trabalha localmente no terminal e nos editores de código, sendo 100% imune às quedas de internet — eles nunca abandonam a sessão se o sinal cair!'
  ],
  whenAvailable:[
   'A partir do Dia 631 (01/10/1999), assim que você tiver recebido as 6 edições de Informática Livre e cumprido os 30 dias finais de estudo do Tony.'
  ],
  howToUse:[
   'Certifique-se de ter uma vaga livre na área principal do salão (se você ainda estiver com o limite inicial de 3 vagas ocupadas pelos 3 primeiros PCs, compre antes Ampliar área principal em Compras → Construção).',
   'Abra Compras → categoria Computadores e serviços e escolha entre Comprar estação Linux · R$ 440 (Bancada Linux 99) ou Comprar estação Linux · R$ 610 (Estação Programador 99).',
   'A nova estação é instalada ligada na área principal e já começa a atender tanto os entusiastas de Linux quanto clientes comuns de navegação/estudo.',
   'Opcional (Dual-Boot): se anos depois você instalar uma licença paga de Windows nessa máquina, poderá alternar o sistema de inicialização (com o PC desligado) em Administrar → Windows / Licenças → Windows por PC usando os botões Reiniciar em Linux e Iniciar Windows licenciado.'
  ],
  whatHappensNext:[
   'Enquanto a estação estiver iniciada em Linux, ela fica totalmente isenta de fiscalização do Windows e adiciona seu bônus próprio de satisfação (+1,5 p.p. na Bancada Linux 99 ou +5,0 p.p. na Estação Programador 99).',
   'Como qualquer outro computador, ela pode receber upgrades de peças, kits de plataforma, placas de vídeo e monitores LCD ao longo das décadas.'
  ],
  costsAndLimits:[
   'Bancada Linux 99: R$ 440,00 · Bônus de satisfação de +1,5 p.p. · Ocupa 1 vaga da área principal.',
   'Estação Programador 99: R$ 610,00 · Bônus de satisfação de +5,0 p.p. · Ocupa 1 vaga da área principal.',
   'Limitações do modo Linux: estações iniciadas em Linux NÃO rodam jogos de Windows (não contam para jogos clássicos de 1998–2000, não recebem turmas de Setor Zero em rede e não executam jogos avançados com GPU).'
  ],
  table:{
   caption:'Comparativo entre Computadores Windows e Estações Linux',
   headers:['Característica','PC em modo Windows','Estação em modo Linux'],
   rows:[
    ['Custo de aquisição da máquina','R$ 320,00 (PC comum)','R$ 440,00 (Bancada 99) ou R$ 610,00 (Programador 99)'],
    ['Licença de sistema operacional','Exige licença paga (R$ 120 a R$ 620) contra multas','Isenta (software livre pré-instalado)'],
    ['Comportamento se a internet cair','Cliente abandona a sessão após 15 min sem rede','Sessão continua normalmente sem perda de reputação'],
    ['Compatibilidade com jogos de PC','Roda jogos clássicos, Setor Zero LAN e jogos GPU','Não roda jogos de Windows (foco em estudo e programação)'],
    ['Público atendido','Clientes gerais, gamers de GPU e turmas LAN','Estudantes do fórum Linux (12,5% do fluxo) e clientes comuns']
   ]
  },
  commonProblems:[
   {
    problem:'Concluí a missão do Linux, tenho dinheiro, mas o botão das estações Linux na loja diz que a área principal está cheia.',
    solution:'As máquinas Linux ocupam vagas da área principal (máximo de 3 sem expansão, 5 na 1ª expansão e 7 na 2ª expansão). Vá em Compras → Construção e clique em Ampliar área principal para abrir mais 2 vagas.'
   },
   {
    problem:'Comprei uma licença do Windows para minha estação Linux e os clientes do fórum pararam de usá-la.',
    solution:'Ao concluir a instalação do Windows, a máquina passa a dar boot em Windows. Desligue a estação e clique em Reiniciar em Linux dentro de Administrar → Windows / Licenças → Windows por PC para voltar ao sistema aberto.'
   }
  ],
  playerTips:[
   'Manter 1 ou 2 estações em modo Linux e o restante do salão em modo Windows é a combinação ideal: você atende os estudantes do fórum (que nunca reclamam de queda de internet) sem faltar máquinas Windows para os gamers.',
   'Se puder escolher entre os dois modelos, a Estação Programador 99 (R$ 610,00) entrega mais que o triplo de bônus de satisfação (+5,0 p.p. contra +1,5 p.p.), ajudando a atrair clientes VIP.'
  ],
  relatedIds:['005','011','013','019']
 },
 {
  number:15,
  id:'015',
  slug:'placas-de-video-catalogo-e-compatibilidade',
  path:'/sobre-o-jogo/guias/015-placas-de-video-catalogo-e-compatibilidade/',
  groupCode:'E',
  groupTitle:'Placas de vídeo (GPUs) e jogos 3D',
  title:'Placas de vídeo (GPUs): gerações de 2005 a 2030 e instalação',
  summary:'Explore as 13 placas PixelForce de 2005 a 2030, seus consumos em watts, exigências de fonte e ganhos diretos na satisfação e no teto de preço.',
  unlockBadge:'Gerações de 2005 a 2030',
  uiPath:'Administrar → Placas de vídeo',
  whatIs:[
   'A partir de 2005, os computadores da sua lan house podem deixar o vídeo integrado para trás e receber placas de vídeo dedicadas da linha PixelForce. O catálogo completo conta com 13 gerações lançadas entre 2005 e 2030, indo da PixelForce 6600 (R$ 440,00) até a PixelForce 7080 (R$ 9.250,00).',
   'Cada placa de vídeo é comprada e instalada individualmente por computador na aba Administrar → Placas de vídeo.'
  ],
  whyItMatters:[
   'Instalar uma GPU traz três ganhos imediatos: eleva fortemente a satisfação dos clientes que usam aquela máquina (de +3,5 até +26 pontos percentuais), compõe 7% da modernidade tecnológica da estação para sustentar o teto do preço por hora e libera o computador para rodar os jogos avançados 3D de 2005 em diante.',
   'Sem pelo menos uma placa de vídeo compatível instalada, sua lan house não consegue licenciar nem rodar os três grandes títulos competitivos de GPU.'
  ],
  whenAvailable:[
   'A aba Placas de vídeo pode ser visitada desde 1998, e o primeiro modelo (PixelForce 6600) é desbloqueado em 01/01/2005.',
   'Novas placas chegam em 2007, 2009, 2011, 2013, 2015, 2017, 2019, 2021, 2023, 2025, 2028 e 2030.'
  ],
  howToUse:[
   'Desligue o computador que receberá a placa de vídeo (em Administrar → Computadores → Operação e reparos).',
   'Abra Administrar → aba Placas de vídeo.',
   'Na faixa superior de seleção, clique no botão do computador desejado (por exemplo, PC 1 · desligado · sem GPU).',
   'Verifique no cartão da placa desejada se a fonte atual do PC suporta a carga em watts (caso contrário, o botão mostrará Requer fonte de XXX W).',
   'Clique em Comprar · R$ ... para instalar a placa instantaneamente e depois religue o computador.'
  ],
  whatHappensNext:[
   'A placa passa a integrar a ficha técnica do computador imediatamente, mudando o visual e o tema luminoso da estação e liberando o PC para instalar jogos de GPU compatíveis.',
   'Enquanto o computador estiver ligado, a placa de vídeo adiciona um consumo proporcional de energia elétrica na conta acumulada do mês.'
  ],
  costsAndLimits:[
   'Qualquer PC pode receber uma placa de vídeo (independentemente do modelo da placa-mãe), desde que esteja desligado, livre, fora de manutenção e tenha fonte de alimentação compatível.',
   'A troca de GPU cobra sempre o valor integral da placa nova, sem abatimento ou revenda da placa antiga.',
   'Não é permitido instalar uma placa de vídeo de ano igual ou anterior à placa que já está instalada naquela máquina.'
  ],
  table:{
   caption:'Catálogo completo das 13 Placas de Vídeo PixelForce (2005–2030)',
   headers:['Modelo PixelForce','Ano','Preço','Bônus de satisfação','Carga da GPU (Watts)','Jogos GPU que desbloqueia'],
   rows:[
    ['PixelForce 6600','2005','R$ 440','+3,5 p.p.','40 W','Neon Rush Online (2005)'],
    ['PixelForce 8800','2007','R$ 790','+6,0 p.p.','75 W','Neon Rush Online'],
    ['PixelForce 260','2009','R$ 1.150','+8,5 p.p.','100 W','Circuito Competitivo (2009)'],
    ['PixelForce 560','2011','R$ 1.590','+11,0 p.p.','125 W','Neon Rush + Circuito Competitivo'],
    ['PixelForce 770','2013','R$ 2.250','+14,0 p.p.','150 W','Arena do Futuro (2013) + anteriores'],
    ['PixelForce 960','2015','R$ 2.700','+15,5 p.p.','165 W','Todos os 3 jogos GPU'],
    ['PixelForce 1070','2017','R$ 3.300','+17,0 p.p.','180 W','Todos os 3 jogos GPU'],
    ['PixelForce 2070','2019','R$ 4.050','+18,5 p.p.','200 W','Todos os 3 jogos GPU'],
    ['PixelForce 3070','2021','R$ 4.800','+20,0 p.p.','220 W','Todos os 3 jogos GPU'],
    ['PixelForce 4070','2023','R$ 5.650','+21,5 p.p.','245 W','Todos os 3 jogos GPU'],
    ['PixelForce 5070','2025','R$ 6.600','+23,0 p.p.','270 W','Todos os 3 jogos GPU'],
    ['PixelForce 6080','2028','R$ 7.850','+24,5 p.p.','300 W','Todos os 3 jogos GPU'],
    ['PixelForce 7080','2030','R$ 9.250','+26,0 p.p.','330 W','Todos os 3 jogos GPU (topo da campanha)']
   ]
  },
  commonProblems:[
   {
    problem:'Desliguei o PC 1, mas quando abri a aba Placas de vídeo o botão continuava pedindo para desligar a máquina.',
    solution:'Verifique na faixa superior da aba Placas de vídeo qual computador está selecionado: às vezes você desligou o PC 1, mas o seletor da aba está apontando para o PC 2 ou PC 3 (que ainda está ligado).'
   },
   {
    problem:'O botão da PixelForce 3070 ou superior está bloqueado pedindo uma fonte mais forte.',
    solution:'Placas de 220 W a 330 W somadas ao consumo do processador exigem fontes de 450 W a 650 W. Vá em Administrar → Computadores → Peças e configuração → Fonte e atualize a fonte antes de comprar a GPU.'
   }
  ],
  playerTips:[
   'As três gerações-chave para destravar jogos são 2005 (PixelForce 6600), 2009 (PixelForce 260) e 2013 (PixelForce 770). Se quiser economizar, priorize atualizar as GPUs nesses três anos estratégicos.',
   'Você não precisa equipar todos os 22 PCs com a placa de vídeo mais cara do ano: manter uma ala gamer de 4 a 8 PCs com GPUs de ponta já atende muito bem os clientes gamers e VIPs.'
  ],
  relatedIds:['007','008','016','032']
 },
 {
  number:16,
  id:'016',
  slug:'jogos-com-gpu-downloads-e-adicional-por-hora',
  path:'/sobre-o-jogo/guias/016-jogos-com-gpu-downloads-e-adicional-por-hora/',
  groupCode:'E',
  groupTitle:'Placas de vídeo (GPUs) e jogos 3D',
  title:'Jogos avançados com GPU: licenças, downloads por PC e bônus horário',
  summary:'Aprenda a licenciar e baixar Neon Rush Online, Circuito Competitivo e Arena do Futuro em cada estação compatível para receber adicionais por hora.',
  unlockBadge:'2005, 2009 e 2013',
  uiPath:'Administrar → Windows / Licenças → Jogos com GPU',
  whatIs:[
   'A partir de 2005 na campanha histórica, 25% dos visitantes que entram na sua lan house são gamers em busca de três títulos 3D competitivos: Neon Rush Online (2005), Circuito Competitivo (2009) e Arena do Futuro (2013).',
   'Cada título exige uma licença única para o estabelecimento e precisa estar instalado individualmente nos computadores que possuam a placa de vídeo mínima e a versão mínima de Windows licenciado.'
  ],
  whyItMatters:[
   'Quando um cliente gamer encontra um computador livre com o jogo que ele veio procurar, ele paga um adicional por hora em cima da sua tarifa base (+R$ 0,75/h no Neon Rush Online, +R$ 1,25/h no Circuito Competitivo e +R$ 1,75/h no Arena do Futuro, respeitando o teto anual da época).',
   'Além disso, cada título pronto para rodar em pelo menos 1 PC livre aumenta em até +2,5% a chegada geral de clientes na porta (somando até +7,5% com os três jogos).'
  ],
  whenAvailable:[
   'Neon Rush Online abre em 2005 (R$ 580,00), Circuito Competitivo em 2009 (R$ 950,00) e Arena do Futuro em 2013 (R$ 1.550,00), na aba Administrar → Windows / Licenças → Jogos com GPU.',
   'Para liberar a compra da licença de qualquer um deles, você precisa ter a Regularização básica de jogos ativa e pelo menos 1 PC Windows compatível.'
  ],
  howToUse:[
   'Prepare pelo menos 1 computador com a placa de vídeo mínima e o Windows licenciado mínimo exigido pelo jogo.',
   'Abra Administrar → Windows / Licenças → sub-aba Jogos com GPU e clique no botão de licenciamento do título (por exemplo, Licenciar Neon Rush Online · R$ 580). Os PCs que já eram compatíveis no ato da compra recebem o título imediatamente.',
   'Quando você comprar novos PCs ou instalar GPUs em outras máquinas depois, mantenha esses PCs LIGADOS e livres, volte na sub-aba Jogos com GPU e clique em Instalar no PC N ou Instalar nos PCs disponíveis.',
   'Acompanhe a barra de download (em minutos do jogo) no bloco Downloads em andamento ou acima da máquina no salão.',
   'Confira no cartão de cada jogo o bloco Procura observada e Cobertura da licença por adicionais recebidos para ver quantas sessões daquele título já foram jogadas.'
  ],
  whatHappensNext:[
   'Enquanto um computador está baixando um jogo com GPU, ele fica temporariamente reservado para o download e não recebe clientes até concluir os 100%.',
   'Assim que o download termina, a máquina volta a ficar disponível imediatamente para os clientes gamers.'
  ],
  costsAndLimits:[
   'Instalar ou remover um jogo já licenciado em cada PC é gratuito, mas exige que o PC esteja LIGADO, sem cliente, fora de manutenção e com internet ativa.',
   'Velocidade e limite de banda simultânea no download: Internet Discada (Nível 1) avança 1 PC por minuto; Internet Via Rádio (Nível 2) avança 2 PCs por minuto e corta o tempo pela metade; Fibra Óptica (Nível 3) avança 3 PCs por minuto e reduz o tempo a um terço.',
   'Regra do teto horário: o valor total cobrado na sessão GPU é a soma da tarifa base mais o bônus do jogo, limitada sempre ao teto anual da época. Se a sua tarifa base já estiver encostada no teto máximo permitido naquele ano, o adicional efetivo será R$ 0,00.'
  ],
  table:{
   caption:'Requisitos, preços, adicionais e tempos de download dos 3 Jogos com GPU',
   headers:['Jogo com GPU','Ano e Licença','GPU e Windows mínimos','Adicional por hora','Tempo de download (Discada / Rádio / Fibra)'],
   rows:[
    ['Neon Rush Online','2005 · R$ 580','PixelForce 6600 + Windows XP licenciado','+R$ 0,75 / hora','18 min / 9 min / 6 min do jogo'],
    ['Circuito Competitivo','2009 · R$ 950','PixelForce 260 + Windows 7 licenciado','+R$ 1,25 / hora','28 min / 14 min / 10 min do jogo'],
    ['Arena do Futuro','2013 · R$ 1.550','PixelForce 770 + Windows 7 licenciado','+R$ 1,75 / hora','40 min / 20 min / 14 min do jogo']
   ]
  },
  commonProblems:[
   {
    problem:'Cliquei para baixar o jogo num PC novo, mas o download aparece pausado.',
    solution:'Ao contrário da instalação de peças e Windows (que exigem PC desligado), o download de jogos com GPU exige o PC LIGADO e internet online. Se você desligar o PC ou a internet cair, o download pausa sem perder o progresso já baixado e retoma assim que o PC religar.'
   },
   {
    problem:'Os clientes estão jogando Neon Rush Online, mas a cobertura da licença por adicionais recebidos continua em R$ 0,00.',
    solution:'Isso acontece quando a sua tarifa horária base em Administrar → Preços já está configurada exatamente no limite máximo anual permitido pelo modo histórico. Deixe uma folga de R$ 0,75 a R$ 1,75 abaixo do teto anual se quiser cobrar o adicional específico dos gamers de GPU.'
   }
  ],
  playerTips:[
   'Se um cliente gamer de GPU entrar na sua lan house e não encontrar nenhum PC livre com o jogo que ele queria, ele ainda aceita usar um PC comum pagando a tarifa normal, mas sai insatisfeito (-12 p.p. na avaliação) reclamando que não conseguiu jogar o que queria.',
   'Use o botão Instalar nos PCs disponíveis sempre que terminar uma rodada de upgrades de placas de vídeo para não esquecer nenhuma máquina gamer sem os jogos.'
  ],
  relatedIds:['011','015','017','019']
 },
 {
  number:17,
  id:'017',
  slug:'regularizacao-basica-e-jogos-classicos-de-pc',
  path:'/sobre-o-jogo/guias/017-regularizacao-basica-e-jogos-classicos-de-pc/',
  groupCode:'F',
  groupTitle:'Jogos para computador e partidas em rede',
  title:'Regularização básica de jogos e catálogo clássico (1998–1999)',
  summary:'Entenda como funciona o contrato básico de jogos, evite multas de direitos autorais e impulsione a chegada de clientes com os 10 clássicos iniciais.',
  unlockBadge:'1998 e 1999',
  uiPath:'Administrar → Serviços → Internet e contrato / Windows / Licenças → Jogos clássicos',
  whatIs:[
   'O licenciamento de jogos para computador funciona em duas etapas: primeiro você adquire a Regularização básica do catálogo (o contrato geral que legaliza o uso comercial de jogos na lan house) e, em seguida, pode comprar as licenças individuais dos Jogos clássicos de 1998 e 1999.',
   'Ao todo são 5 títulos clássicos lançados em 1998 (Corrida Turbo 98, Castelo das Chaves, Órbita 98, Blocos & Cores e Ringue Digital) e 5 títulos lançados em 1999 (Asfalto Noturno, Reinos de Papel, Cyber Arena 99, Ilha dos Segredos e Circuitos Malucos), além de Setor Zero no ano 2000.'
  ],
  whyItMatters:[
   'Sem a Regularização básica de jogos, você fica impedido de comprar qualquer jogo individual e corre o risco de receber uma multa pesada de R$ 540,00 (mais perda de 5 pontos de reputação) caso ignore a carta Direitos autorais dos jogos por 7 dias.',
   'Já cada jogo clássico licenciado aumenta diretamente o fluxo de clientes que entram pela porta (+1,5% no ano de lançamento por título), funcionando para todo o salão sem precisar baixar computador por computador.'
  ],
  whenAvailable:[
   'A Regularização básica (R$ 450,00 em 1998) e os 5 primeiros jogos clássicos estão disponíveis desde o Dia 1 (1998).',
   'Os 5 jogos clássicos seguintes abrem em 01/01/1999.'
  ],
  howToUse:[
   'Para adquirir a Regularização básica: abra Administrar → Serviços → sub-aba Internet e contrato e clique em Regularizar jogos (ou clique diretamente no botão de regularização dentro da carta de aviso no Correio).',
   'Certifique-se de ter pelo menos 1 computador ligado e disponível com licença paga do Windows ativa (os jogos clássicos exigem pelo menos 1 PC Windows licenciado no salão).',
   'Abra Administrar → Windows / Licenças → sub-aba Jogos clássicos.',
   'Clique nos botões de compra dos títulos desejados de 1998 (entre R$ 55,00 e R$ 90,00 cada) e de 1999 (entre R$ 85,00 e R$ 120,00 cada).'
  ],
  whatHappensNext:[
   'Diferente dos jogos com GPU de 2005+, os jogos clássicos de 1998–2000 NÃO exigem download por computador: assim que você compra a licença na aba Jogos clássicos, o título fica ativo para todo o estabelecimento.',
   'A popularidade de cada jogo começa em 100% no seu ano de lançamento, recua 15% ao ano conforme envelhece e se estabiliza para sempre no piso de nostalgia de 25% — suas licenças nunca expiram!'
  ],
  costsAndLimits:[
   'Custo da Regularização básica de jogos: R$ 450,00 em 1998 (no modo histórico, se você deixar para comprar em anos seguintes, o valor é reajustado pela inflação acumulada do IPCA).',
   'Prazo após receber a carta Direitos autorais dos jogos no Correio: 7 dias corridos. Se vencer sem regularizar: multa de R$ 540,00 e -5 pontos de reputação.',
   'Bônus de chegada de clientes por jogo clássico: +1,5% no ano de lançamento (caindo gradualmente até +0,375% no piso de nostalgia de 25%), com teto máximo combinado de +16,5% quando somado a Setor Zero.'
  ],
  table:{
   caption:'Catálogo dos 10 Jogos Clássicos de PC de 1998 e 1999',
   headers:['Título do jogo','Ano','Preço da licença','Gênero','Requisito no salão'],
   rows:[
    ['Blocos & Cores','1998','R$ 55','Quebra-cabeça','Regularização básica + 1 PC com Windows licenciado'],
    ['Corrida Turbo 98','1998','R$ 65','Corrida','Regularização básica + 1 PC com Windows licenciado'],
    ['Castelo das Chaves','1998','R$ 70','Aventura','Regularização básica + 1 PC com Windows licenciado'],
    ['Órbita 98','1998','R$ 80','Estratégia','Regularização básica + 1 PC com Windows licenciado'],
    ['Ringue Digital','1998','R$ 90','Ação','Regularização básica + 1 PC com Windows licenciado'],
    ['Circuitos Malucos','1999','R$ 85','Quebra-cabeça','Ano 1999+ · Regularização básica + 1 PC com Windows licenciado'],
    ['Ilha dos Segredos','1999','R$ 95','Aventura','Ano 1999+ · Regularização básica + 1 PC com Windows licenciado'],
    ['Reinos de Papel','1999','R$ 100','Estratégia','Ano 1999+ · Regularização básica + 1 PC com Windows licenciado'],
    ['Asfalto Noturno','1999','R$ 105','Corrida','Ano 1999+ · Regularização básica + 1 PC com Windows licenciado'],
    ['Cyber Arena 99','1999','R$ 120','Ação','Ano 1999+ · Regularização básica + 1 PC com Windows licenciado']
   ]
  },
  commonProblems:[
   {
    problem:'Comprei a Regularização básica de R$ 450, mas os botões dos jogos clássicos continuam desabilitados.',
    solution:'Para comprar e ativar qualquer jogo clássico, você precisa ter pelo menos 1 computador com licença paga do Windows instalada (o Windows 98 preinstalado gratuito do Dia 1 não conta como licenciado).'
   },
   {
    problem:'Deixei para comprar a Regularização básica só em 2003 e ela está custando mais de R$ 450.',
    solution:'Na economia histórica, o contrato básico de jogos acompanha o índice de inflação acumulado (IPCA). Comprar a regularização ainda em 1998 garante o menor preço nominal (R$ 450,00).'
   }
  ],
  playerTips:[
   'Em 1998, comece comprando os títulos mais acessíveis após regularizar o contrato — como Blocos & Cores (R$ 55) e Corrida Turbo 98 (R$ 65) — pois todos os 5 jogos do mesmo ano dão o mesmo bônus de +1,5% no fluxo de visitas!',
   'Se receber a carta Direitos autorais dos jogos e ainda faltar um pouco de dinheiro para os R$ 450,00, você tem 7 dias inteiros de expediente para juntar o valor antes que a fiscalização aplique a multa.'
  ],
  relatedIds:['011','016','018','035']
 },
 {
  number:18,
  id:'018',
  slug:'setor-zero-e-partidas-multiplayer-em-rede',
  path:'/sobre-o-jogo/guias/018-setor-zero-e-partidas-multiplayer-em-rede/',
  groupCode:'F',
  groupTitle:'Jogos para computador e partidas em rede',
  title:'Setor Zero (2000): e-mails do primo Eric e turmas em rede local',
  summary:'Veja como liberar o clássico de ação em rede Setor Zero no ano 2000, receber grupos semanais de amigos e habilitar o Corujão de sexta-feira.',
  unlockBadge:'Meados de 2000 (após o 2º e-mail de Eric)',
  uiPath:'Correio · Administrar → Windows / Licenças → Jogos clássicos',
  whatIs:[
   'No ano 2000, o primo de Tony que mora na França — Eric — envia duas cartas contando sobre a febre dos jogos competitivos em rede local (LAN) nas lan houses europeias. A segunda carta, entregue no meio do ano 2000, revela na aba Jogos clássicos o 11º título clássico do catálogo: Setor Zero (Ação em rede, R$ 145,00).',
   'Setor Zero é o primeiro jogo multiplayer em rede do simulador: ele inaugura as visitas semanais de turmas de amigos durante a tarde e é o pré-requisito para realizar o famoso Corujão de sexta-feira a partir de 2001.'
  ],
  whyItMatters:[
   'Assim que Setor Zero está licenciado, uma vez por semana chega uma turma de 2 ou 3 amigos que entram juntos na fila, reservam computadores separados e jogam uma partida sincronizada em rede.',
   'Como Setor Zero roda em rede local (LAN) dentro do próprio salão, as partidas sincronizadas dessas turmas NÃO são interrompidas mesmo se a internet da lan house cair!'
  ],
  whenAvailable:[
   'Eric envia o primeiro e-mail no início do ano 2000 (entre janeiro e fevereiro) e o segundo e-mail no meio de 2000 (entre junho e julho), destravando a seção 2000 · Setor Zero na aba Jogos clássicos.',
   'Se uma partida for carregada já em 2001 ou anos posteriores, Setor Zero já aparece visível automaticamente no catálogo.'
  ],
  howToUse:[
   'No meio do ano 2000, confira no Correio a chegada da carta Eric (França) — lembra daquele jogo em rede?.',
   'Garanta que sua lan house tenha a Regularização básica de jogos ativa e pelo menos 2 computadores operacionais com licença paga do Windows instalada (máquinas em modo Linux não contam).',
   'Abra Administrar → Windows / Licenças → sub-aba Jogos clássicos, role até o bloco do ano 2000 e clique em Licenciar Setor Zero · R$ 145.',
   'Mantenha sempre ao menos 2 ou 3 PCs Windows licenciados ligados e desocupados no início da tarde (entre 12:50 e 14:40) para receber a turma semanal.'
  ],
  whatHappensNext:[
   'Uma vez a cada 7 dias, no começo da tarde, entram 2 ou 3 amigos juntos. Cada um passa pelo balcão, paga sua sessão individualmente (30 ou 45 minutos) e senta no seu respectivo PC.',
   'O primeiro amigo que senta aguarda os colegas na tela de preparação; assim que todos estão sentados, a rodada em rede começa sincronizada e eles trocam falas de equipe durante a disputa!'
  ],
  costsAndLimits:[
   'Preço da licença de Setor Zero: R$ 145,00 (pagamento único para toda a lan house).',
   'Requisitos obrigatórios: Regularização básica de jogos + pelo menos 2 PCs prontos para sessão com Windows licenciado.',
   'Frequência das turmas diurnas: 1 visita por semana (a cada 7 dias, entre 12:50 e 14:40), desde que haja pelo menos 2 PCs Windows licenciados livres no momento da chegada.',
   'Bônus no fluxo geral de clientes: adiciona até +1,5% na chegada de visitantes (exigindo 2 PCs Windows licenciados ativos para somar o bônus).'
  ],
  commonProblems:[
   {
    problem:'Já estou em março de 2000 e não vejo Setor Zero na aba Jogos clássicos.',
    solution:'O título só aparece no catálogo após o segundo e-mail do primo Eric, que chega entre junho e julho do ano 2000 (entre os dias 156 e 200 do ano 2000).'
   },
   {
    problem:'Vejo Setor Zero na lista, mas o botão de compra pede 2 computadores com Windows licenciado.',
    solution:'Como é um jogo exclusivamente multiplayer em rede local, não é possível jogar sozinho em 1 máquina. Licencie o Windows em pelo menos 2 PCs e mantenha ambos ligados para liberar a compra.'
   }
  ],
  playerTips:[
   'Licenciar Setor Zero ainda no segundo semestre de 2000 deixa tudo pronto para que, logo em janeiro de 2001, você já possa agendar o primeiro Corujão de sexta-feira em Administrar → Finanças → Primeira sexta.',
   'Se você tiver 3 ou mais PCs Windows licenciados livres no horário da visita semanal, a turma entra com 3 amigos em vez de 2, aumentando em 50% o faturamento daquela rodada.'
  ],
  relatedIds:['011','017','035','036']
 },
 {
  number:19,
  id:'019',
  slug:'planos-de-internet-quedas-de-conexao-e-velocidade',
  path:'/sobre-o-jogo/guias/019-planos-de-internet-quedas-de-conexao-e-velocidade/',
  groupCode:'G',
  groupTitle:'Internet e conectividade',
  title:'Planos de internet: Discada, Via rádio, Fibra óptica e quedas de rede',
  summary:'Compare os três níveis de internet do jogo, reduza o risco e a duração de quedas de sinal e acelere os downloads de jogos com GPU.',
  unlockBadge:'Discada em 1998 · Via rádio e Fibra óptica para upgrade',
  uiPath:'Administrar → Serviços → Internet e contrato',
  whatIs:[
   'A conexão de internet da lan house possui 3 níveis de evolução em Administrar → Serviços → Internet e contrato: Nível 1 (Discada, ativa desde o início), Nível 2 (Via rádio) e Nível 3 (Fibra óptica).',
   'O nível da sua internet governa três mecânicas vitais do salão: a frequência com que o sinal cai durante o expediente, a duração de cada queda de conexão e a velocidade (e quantidade de máquinas simultâneas) nos downloads de jogos com GPU.'
  ],
  whyItMatters:[
   'Enquanto a internet está fora do ar (Offline), a chegada de novos clientes comuns na porta despenca para apenas 12% do normal.',
   'Mais grave ainda: clientes que já estão sentados em sessões comuns de Windows suportam no máximo 15 minutos do jogo sem internet. No 16º minuto offline, eles abandonam a sessão irritados e derrubam sua reputação em 1,1 ponto cada um!'
  ],
  whenAvailable:[
   'Você começa no Dia 1 com o Nível 1 (Discada) e pode contratar o upgrade para o Nível 2 (Via rádio) e, em seguida, para o Nível 3 (Fibra óptica) diretamente na aba Serviços → Internet e contrato.'
  ],
  howToUse:[
   'Abra Administrar → aba Serviços → sub-aba Internet e contrato.',
   'Verifique o estado atual da rede (Online ou Offline) e o plano contratado.',
   'Clique no botão de melhoria de internet para passar do Nível 1 (Discada) para o Nível 2 (Via rádio), e posteriormente do Nível 2 para o Nível 3 (Fibra óptica).',
   'Observe o aumento correspondente na conta fixa mensal de internet em Administrar → Finanças → Caixa e contas.'
  ],
  whatHappensNext:[
   'A melhoria do plano entra em vigor na mesma hora: se a rede estava instável, a probabilidade de novas quedas diminui drasticamente e, quando uma oscilação ocorrer na Fibra óptica, ela poderá durar menos de 15 minutos, evitando que os clientes abandonem os PCs!',
   'Na aba Jogos com GPU, sua banda compartilhada também sobe imediatamente de 1 para 2 (Via rádio) ou 3 (Fibra óptica) downloads simultâneos.'
  ],
  costsAndLimits:[
   'Custo de instalação (taxa única no ato do upgrade, corrigida pelo IPCA no modo histórico): Nível 1 → Nível 2 (Via rádio) custa R$ 260,00 em base 1998; Nível 2 → Nível 3 (Fibra óptica) custa R$ 370,00 em base 1998.',
   'Mensalidade de internet (cobrada a cada 30 dias, corrigida pelo IPCA): Nível 1 custa R$ 110/mês · Nível 2 custa R$ 195/mês · Nível 3 custa R$ 280/mês (valores em base 1998).',
   'Quedas de sinal por nível: Discada tem maior chance de queda e fica de 20 a 39 minutos fora do ar (sempre causa abandono de clientes comuns após 15 min); Via rádio reduz a chance e fica de 16 a 30 minutos fora do ar; Fibra óptica tem raríssimas quedas e fica de 12 a 21 minutos fora do ar.',
   'Quem NÃO sofre com quedas de internet: bancadas de PlayStation 1 e PlayStation 2, estações em modo Linux, turmas jogando Setor Zero em rede local (LAN) e atendimentos avulsos de impressão ou cópia de disco.'
  ],
  table:{
   caption:'Comparativo técnico dos 3 Planos de Internet',
   headers:['Plano de internet','Taxa de instalação (base 1998)','Mensalidade (base 1998)','Duração de quedas','Downloads GPU simultâneos'],
   rows:[
    ['Nível 1 · Discada','Incluída no Dia 1','R$ 110 / mês','20 a 39 min do jogo','1 PC por vez (velocidade 1x)'],
    ['Nível 2 · Via rádio','R$ 260,00 × IPCA','R$ 195 / mês × IPCA','16 a 30 min do jogo','Até 2 PCs por vez (velocidade 2x)'],
    ['Nível 3 · Fibra óptica','R$ 370,00 × IPCA','R$ 280 / mês × IPCA','12 a 21 min do jogo','Até 3 PCs por vez (velocidade 3x)']
   ]
  },
  commonProblems:[
   {
    problem:'Perdi vários pontos de reputação de repente em poucos segundos.',
    solution:'Isso acontece quando a internet cai com o salão cheio de clientes em PCs Windows comuns e a queda ultrapassa 15 minutos: todos levantam juntos (-1,1 de reputação cada). Evoluir para Via rádio e Fibra óptica é a melhor defesa.'
   },
   {
    problem:'Não existe botão para chamar um técnico de internet quando a rede fica Offline?',
    solution:'As oscilações de sinal vêm da operadora externa do bairro e voltam sozinhas após o tempo da falha (de 12 a 39 minutos do jogo conforme seu plano). Não é preciso pagar reparo avulso.'
   }
  ],
  playerTips:[
   'Faça o upgrade para Via rádio e Fibra óptica assim que a receita mensal permitir: como a taxa de instalação acompanha o IPCA ao longo das décadas, contratar nos primeiros anos sai bem mais barato nominalmente.',
   'Diversificar seu salão com 1 ou 2 estações Linux (1999+) e bancadas de PlayStation 1 (2002+) garante clientes satisfeitos faturando normalmente mesmo quando a internet cair.'
  ],
  relatedIds:['003','014','016','020']
 },
 {
  number:20,
  id:'020',
  slug:'playstation-1-bancadas-precos-e-catalogo-de-cds',
  path:'/sobre-o-jogo/guias/020-playstation-1-bancadas-precos-e-catalogo-de-cds/',
  groupCode:'H',
  groupTitle:'Consoles: PlayStation 1 e PlayStation 2',
  title:'PlayStation 1 (2002): bancadas com TV de tubo, tarifas e 13 CDs',
  summary:'Instale até 4 bancadas de PlayStation 1 a partir de 2002, ajuste o preço por hora dos consoles e conheça os 13 CDs que atraem fãs para o salão.',
  unlockBadge:'A partir de 2002 (jogos de 2002 a 2005)',
  uiPath:'Compras → Videogames e CDs · Administrar → Videogames',
  whatIs:[
   'No dia 1º de janeiro de 2002 (Dia 1441 da campanha), o PlayStation 1 chega à sua lan house! Você pode comprar até 4 bancadas completas de PS1 (com TV de tubo de 20 polegadas, console cinza e dois controles) e colecionar 13 CDs de jogos lançados entre 2002 e 2005.',
   'As bancadas de videogame funcionam como estações independentes dos computadores: têm sua própria tarifa por hora, nunca quebram por desgaste, não exigem licença de Windows e funcionam mesmo com a internet fora do ar.'
  ],
  whyItMatters:[
   'Com pelo menos 1 bancada de PS1 e 1 CD comprado, cerca de 28% dos visitantes que chegam à lan house passam a vir especificamente atrás do console, escolhendo um jogo favorito do catálogo.',
   'Se o seu salão estiver com todos os PCs em manutenção ou sem internet, as bancadas de PlayStation 1 continuam mantendo a porta aberta e o caixa girando.'
  ],
  whenAvailable:[
   'Liberado em 01/01/2002. Na campanha histórica padrão (com desbloqueio por revistas ativo), os jogos de cada trimestre de 2002 a 2005 são revelados conforme você recebe as edições correspondentes da revista Top Games no Correio.'
  ],
  howToUse:[
   'A partir de 2002, abra Compras → categoria Videogames e CDs e clique em Bancada PlayStation 1 · R$ 680.',
   'Posicione a bancada em um local livre do salão garantindo passagem desobstruída entre o balcão e a cadeira do console.',
   'Para adquirir os jogos (CDs), aguarde a chegada da revista Top Games correspondente no Correio e compre os títulos em Compras → Videogames e CDs ou em Administrar → Videogames → sub-aba Jogos PS1 / PS2.',
   'Para ajustar a tarifa cobrada nas sessões de PS1 (entre R$ 1,00/h e R$ 30,00/h), abra Administrar → Videogames → sub-aba Preço por hora.'
  ],
  whatHappensNext:[
   'Assim que você tem ao menos 1 bancada instalada e 1 jogo de PS1 comprado, os fãs de console entram na fila do balcão, pagam a tarifa de PS1 para o Tony e sentam diante da TV de tubo.',
   'Clientes que pedem exatamente um CD que você já comprou saem com avaliação mais alta (+4 p.p.); se o CD favorito deles ainda não estiver na sua coleção, eles jogam outro disco disponível, mas com leve redução de entusiasmo.'
  ],
  costsAndLimits:[
   'Preço de cada Bancada PlayStation 1: R$ 680,00 · Limite máximo no salão: 4 bancadas.',
   'Faixa de preço por hora do PS1: de R$ 1,00/h a R$ 30,00/h (tarifa inicial padrão de R$ 2,00/h no modo histórico).',
   'Consumo de energia: cada bancada de PS1 consome uma fração leve de energia enquanto instalada e um pequeno adicional enquanto está em sessão.',
   'Bônus de atração e satisfação da coleção: cada CD comprado aumenta o bônus da coleção de PS1 (até +9 pontos percentuais com o catálogo completo).'
  ],
  table:{
   caption:'Catálogo completo dos 13 CDs de PlayStation 1 (2002–2005)',
   headers:['Título do CD de PS1','Ano e Trimestre','Preço','Gênero','Revista Top Games que revela'],
   rows:[
    ['Copa de Bairro 99','2002 · 1º Trim.','R$ 85','Esporte','Edição #1 (Jan/2002)'],
    ['Duelo de Ferro','2002 · 1º Trim.','R$ 95','Luta','Edição #1 (Jan/2002)'],
    ['Turbo Oval','2002 · 1º Trim.','R$ 90','Corrida','Edição #1 (Jan/2002)'],
    ['Noite no Distrito 7','2002 · 2º Trim.','R$ 110','Aventura','Edição #2 (Abr/2002)'],
    ['Manobra Radical','2002 · 3º Trim.','R$ 100','Esporte','Edição #3 (Jul/2002)'],
    ['Crônicas de Éter','2002 · 4º Trim.','R$ 125','RPG','Edição #4 (Out/2002)'],
    ['Vingança em Dupla','2003 · 1º Trim.','R$ 105','Ação','Edição #5 (Jan/2003)'],
    ['Rali da Serra','2003 · 2º Trim.','R$ 115','Corrida','Edição #6 (Abr/2003)'],
    ['Guardião da Cripta','2003 · 4º Trim.','R$ 120','Aventura','Edição #7 (Out/2003)'],
    ['Estádio Lotado 2004','2004 · 1º Trim.','R$ 130','Esporte','Edição #8 (Jan/2004)'],
    ['Lâmina Astral','2004 · 3º Trim.','R$ 135','RPG','Edição #9 (Jul/2004)'],
    ['Fuga na Marginal','2005 · 1º Trim.','R$ 140','Corrida','Edição #10 (Jan/2005)'],
    ['Torneio Supremo','2005 · 3º Trim.','R$ 145','Luta','Edição #11 (Jul/2005)']
   ]
  },
  commonProblems:[
   {
    problem:'Comprei a Bancada PlayStation 1, mas nenhum cliente senta para jogar nela.',
    solution:'A bancada sozinha vem sem discos! Você precisa comprar pelo menos 1 CD de PS1 (como Copa de Bairro 99 por R$ 85,00) após receber a revista Top Games #1 em janeiro de 2002.'
   },
   {
    problem:'Entrei em 2003, mas os jogos de 2003 ainda aparecem bloqueados pedindo a revista Top Games.',
    solution:'Na campanha histórica, os jogos de console só podem ser comprados depois que o carteiro entrega a edição da revista Top Games daquele trimestre (ou se você comprar a edição atrasada em Administrar → Videogames → Jogos PS1 / PS2).'
   }
  ],
  playerTips:[
   'Logo em janeiro de 2002, reserve R$ 14,00 no caixa para pagar o carteiro pela Top Games #1 e compre pelo menos Copa de Bairro 99 (R$ 85) junto com sua primeira bancada.',
   'Consulte a sub-aba Administrar → Videogames → Bancadas para ver quantas sessões, minutos em uso e receita cada bancada de PS1 já rendeu.'
  ],
  relatedIds:['019','021','022','034']
 },
 {
  number:21,
  id:'021',
  slug:'playstation-2-bancadas-e-catalogo-de-dvds',
  path:'/sobre-o-jogo/guias/021-playstation-2-bancadas-e-catalogo-de-dvds/',
  groupCode:'H',
  groupTitle:'Consoles: PlayStation 1 e PlayStation 2',
  title:'PlayStation 2 (2006): bancadas de nova geração e 15 DVDs',
  summary:'Amplie a área de consoles em 2006 com até 4 bancadas de PlayStation 2, tarifa horária dedicada e 15 jogos em DVD lançados até 2010.',
  unlockBadge:'A partir de 2006 (jogos de 2006 a 2010)',
  uiPath:'Compras → Videogames e CDs · Administrar → Videogames',
  whatIs:[
   'Em 01/01/2006 (Dia 2881), chega ao catálogo a geração 128 bits com a Bancada PlayStation 2 (R$ 1.240,00 cada, limite de até 4 bancadas no salão), equipada com console slim preto, leitor de DVD, dois controles e televisão de tela plana.',
   'Importante: as bancadas de PlayStation 2 NÃO substituem nem ocupam o limite das bancadas de PlayStation 1! Você pode manter até 4 bancadas de PS1 e mais 4 bancadas de PS2 operando lado a lado (8 estações de videogame no total).'
  ],
  whyItMatters:[
   'O PlayStation 2 permite cobrar uma tarifa horária própria mais alta que a do PS1 (de R$ 1,00/h até R$ 35,00/h) e traz um catálogo de 15 grandes sucessos em DVD lançados entre 2006 e 2010.',
   'Quando você tem PS1 e PS2 ativos ao mesmo tempo, até 34% dos visitantes do salão procuram os consoles, dividindo a preferência entre os clássicos de PS1 e os novos DVDs de PS2.'
  ],
  whenAvailable:[
   'Liberado em 01/01/2006 em Compras → Videogames e CDs e Administrar → Videogames.',
   'Os 15 jogos em DVD são revelados progressivamente entre 2006 e 2010 pelas edições #12 a #28 da revista Top Games.'
  ],
  howToUse:[
   'A partir de 2006, abra Compras → Videogames e CDs e clique em Bancada PlayStation 2 · R$ 1.240.',
   'Posicione a bancada no salão (ou em uma das ampliações laterais/fundos) deixando o caminho livre até o balcão.',
   'Receba as edições da revista Top Games a partir de 2006 (R$ 14,00 por revista entregue pelo carteiro) para destravar os DVDs na aba Administrar → Videogames → Jogos PS1 / PS2.',
   'Ajuste o preço por hora exclusivo do PlayStation 2 em Administrar → Videogames → sub-aba Preço por hora.'
  ],
  whatHappensNext:[
   'Com pelo menos 1 bancada de PS2 e 1 DVD comprado, os clientes fãs da nova geração entram na fila do balcão, pagam a tarifa de PS2 e jogam suas sessões sem depender de internet e sem gerar desgaste mecânico.',
   'Assim como no PS1, cada DVD adicionado à coleção eleva a satisfação das sessões de PS2 (até +11 pontos percentuais com a coleção completa) e melhora a avaliação quando o cliente encontra exatamente o título que pediu.'
  ],
  costsAndLimits:[
   'Preço de cada Bancada PlayStation 2: R$ 1.240,00 · Limite máximo no salão: 4 bancadas (além das 4 de PS1).',
   'Faixa de preço por hora do PS2: de R$ 1,00/h a R$ 35,00/h (tarifa inicial padrão de R$ 3,50/h no modo histórico em 2006).',
   'Catálogo de mídia: 15 jogos em DVD (entre R$ 145,00 e R$ 195,00 cada).'
  ],
  table:{
   caption:'Catálogo completo dos 15 DVDs de PlayStation 2 (2006–2010)',
   headers:['Título do DVD de PS2','Ano e Trimestre','Preço','Gênero','Revista Top Games que revela'],
   rows:[
    ['Clássico de Domingo 2006','2006 · 1º Trim.','R$ 145','Esporte','Edição #12 (Jan/2006)'],
    ['Avenida Turbo','2006 · 1º Trim.','R$ 155','Corrida','Edição #12 (Jan/2006)'],
    ['Punhos da Madrugada','2006 · 1º Trim.','R$ 150','Luta','Edição #12 (Jan/2006)'],
    ['Bairro Sob Pressão','2006 · 2º Trim.','R$ 165','Ação','Edição #13 (Abr/2006)'],
    ['Colossos da Neblina','2006 · 3º Trim.','R$ 175','Aventura','Edição #14 (Jul/2006)'],
    ['Acordes de Garagem','2006 · 4º Trim.','R$ 160','Musical','Edição #15 (Out/2006)'],
    ['Fúria do Olimpo','2007 · 1º Trim.','R$ 170','Ação','Edição #16 (Jan/2007)'],
    ['Reis do Drift','2007 · 2º Trim.','R$ 160','Corrida','Edição #17 (Abr/2007)'],
    ['Agente Silencioso','2007 · 4º Trim.','R$ 165','Aventura','Edição #18 (Out/2007)'],
    ['Lendas do Gramado 2008','2008 · 1º Trim.','R$ 175','Esporte','Edição #19 (Jan/2008)'],
    ['Horizonte de Cinzas','2008 · 2º Trim.','R$ 180','RPG','Edição #20 (Abr/2008)'],
    ['Esquadrão Delta','2008 · 4º Trim.','R$ 170','Ação','Edição #21 (Out/2008)'],
    ['Circuito Noturno GT','2009 · 1º Trim.','R$ 185','Corrida','Edição #22 (Jan/2009)'],
    ['Sombras de Kibo','2009 · 3º Trim.','R$ 190','Aventura','Edição #24 (Jul/2009)'],
    ['Arena Final 2010','2010 · 1º Trim.','R$ 195','Luta','Edição #26 (Jan/2010)']
   ]
  },
  commonProblems:[
   {
    problem:'O botão de comprar um DVD de PS2 diz que preciso primeiro instalar uma bancada de PlayStation 2.',
    solution:'O jogo exige que você tenha pelo menos 1 Bancada PlayStation 2 instalada no salão antes de comprar qualquer DVD de PS2 (assim como exige 1 bancada de PS1 para comprar CDs de PS1).'
   }
  ],
  playerTips:[
   'Em janeiro de 2006, a Edição #12 da Top Games libera três grandes sucessos de estreia de uma só vez (Clássico de Domingo 2006, Avenida Turbo e Punhos da Madrugada): compre a bancada e pelo menos um desses DVDs logo no início do ano.',
   'Não venda nem remova suas bancadas de PlayStation 1 quando o PS2 chegar: os dois consoles têm filas de fãs complementares e geram receita estável até 2030.'
  ],
  relatedIds:['020','022','028','033']
 }
];
