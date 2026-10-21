# LHS — Ideias e implementações futuras

**Caderno de ideias grandes do Lan House Simulator (LHS)**  
**Início:** 21/10/2026  
**Objetivo:** registrar conceitos narrativos, novas mecânicas e conexões entre acontecimentos, para amadurecê-los em conversas futuras **antes de iniciar a programação**.

Este documento **não é uma lista de funcionalidades aprovadas para implementação imediata**. Serve para que boas ideias não se percam e para que continuem evoluindo sem transformar cada conversa em uma tarefa de código. Quando uma ideia estiver suficientemente definida, será detalhada, priorizada e então implementada no jogo real.

## Como usar este caderno

- Registrar cada ideia grande em uma seção própria, com **versão, estado, essência, o que foi conversado e dúvidas abertas**.
- Preservar a intenção original do conceito. Não transformar sugestões provisórias em decisões definitivas.
- Acrescentar novas discussões e registrar alterações de rumo; não apagar o raciocínio anterior sem necessidade.
- Separar três momentos: **imaginar → amadurecer → aprovar para implementar**.
- Evitar sequências mecânicas de cartas ou desbloqueios por calendário. Favorecer detalhes de época, histórias humanas, referências sutis (*easter eggs*) e consequências que nasçam do que acontece na partida.
- Antes de implementar qualquer item, verificar se ele já existe no jogo ou no backlog e como se integra à economia, personagens, calendário e saves.

---

# Ideia 001 — Primo Eric, a febre multiplayer e o nascimento do corujão

**Versão da ideia:** 0.2 — plano de UI, mecânicas, consequências e próximos passos acrescentado em 21/10/2026; preserva integralmente o conceito narrativo 0.1.  
**Situação:** EM DESENVOLVIMENTO / NÃO APROVADA PARA CODIFICAR  
**Período narrativo pretendido:** 2000 a aproximadamente 2002  
**Áreas afetadas no futuro:** história do Tony, correio/e-mails, jogos licenciáveis, comportamento dos clientes, ocupação dos PCs, campeonatos, expediente noturno e economia.

## A essência que não podemos perder

A intenção **não** é chegar ao ano 2000 e aparecer um botão pronto chamado “Corujão”.

A ideia é **contar a história do nascimento dessa oportunidade**: uma novidade chega pelo contato de Tony com seu primo Eric, desperta curiosidade, passa a atrair grupos de jogadores, cria dificuldades reais no funcionamento diurno da lan house e, só depois de experimentar esse problema, Tony considera realizar **campeonatos noturnos**. O corujão nasce como uma solução encontrada dentro da história e da administração, não como um prêmio entregue de repente.

O jogo precisa ter pequenas surpresas, acontecimentos aos poucos, referências da época e personagens que voltem de maneira natural. **Não queremos uma fila robótica de missões, e-mails ou eventos obrigatórios.** A narrativa deve se encaixar no ritmo e nas decisões de cada partida.

## Personagens da ideia

### Tony
- Protagonista e proprietário da lan house no Brasil.
- Está aprendendo a administrar um negócio real, com recursos limitados.
- Não entende imediatamente as novas tendências tecnológicas que Eric descreve.
- Precisa observar clientes, demanda, custos e ocupação antes de transformar uma novidade em serviço lucrativo.
- A descoberta de que os campeonatos diurnos atrapalham a operação pode levar à ideia de separar as partidas competitivas em horários noturnos.

### Eric
- **Primo de Tony, mora na França.**
- Acompanha novidades de jogos e tecnologia que começam a chamar atenção na Europa.
- Mantém contato com Tony por **e-mails**, sabendo que ele abriu uma lan house.
- Escreve como um primo de verdade: mensagens pessoais, empolgação, dicas, perguntas, humor e curiosidades — não anúncios comerciais disfarçados.
- Pode reaparecer em momentos espaçados entre 2000 e 2002 e também em anos seguintes. Não precisa escrever todo mês nem em datas rígidas.
- Nem toda dica de Eric precisa ser imediatamente útil ou dar lucro; ele percebe tendências, enquanto Tony precisa descobrir se elas funcionam no seu negócio.
- Futuramente, Eric pode comentar outras novidades internacionais, incluindo consoles e lançamentos de jogos, respeitando a cronologia da época. A frequência, os assuntos e o papel dele ainda serão definidos.

## Evolução narrativa imaginada — janelas, não roteiro fechado

### 1. Janeiro ou fevereiro de 2000 — primeiro contato sobre multiplayer

Eric manda um e-mail da França dizendo que conhece um jogo de confronto entre equipes em que **cada pessoa joga em seu próprio computador, mas todas participam da mesma partida**.

- A inspiração histórica é a popularização de *Counter-Strike*, que já existia como mod de *Half-Life* desde 1999.
- Tony inicialmente estranha a explicação: como várias pessoas jogam juntas se cada uma tem um PC separado?
- A mensagem serve sobretudo para **apresentar Eric e plantar a curiosidade**. Não precisa exigir compra, não deve conceder dinheiro ou liberar automaticamente um recurso.
- O texto precisa soar familiar e espontâneo, sem explicação excessivamente técnica.
- O mês é uma **janela proposta**, não uma data travada.

### 2. Ao longo de 2000 — a novidade ganha força

Eric pode retomar a conversa ao perceber a evolução e a repercussão do jogo na Europa. Junho/julho foram sugeridos como possíveis momentos para uma nova mensagem ou marco; isso ainda precisa de ajuste histórico e narrativo.

- Como referência para pesquisa posterior: o *Counter-Strike* surgiu em 1999; versões beta continuaram em 2000, e a versão 1.0 saiu em novembro de 2000.
- **Não pressupor** que um lançamento ocorre em junho/julho apenas porque é verão no hemisfério norte. Datas da história e da versão fictícia devem ser escolhidas de forma coerente.
- Podemos mencionar *Counter-Strike* como **referência histórica nos e-mails**. Para a atividade jogável e a licença vendida dentro do LHS, pretendemos criar **nome, arte, marca e conteúdo originais**.
- O título fictício **ainda não foi escolhido nem aprovado**. “Operação Tática 2000” apareceu apenas como uma sugestão anterior.
- Tony pode pesquisar, decidir licenciar o jogo, disponibilizá-lo nos PCs compatíveis e observar se há procura real. Detalhes de custo, requisitos e interface ainda estão abertos.

### 3. Fim de 2000 / passagem para 2001 — sucesso com consequências

A demanda por partidas multiplayer começa a alterar a rotina da lan house, **se Tony disponibilizou o jogo e se os clientes de fato querem jogá-lo**.

- Grupos de amigos querem jogar simultaneamente, cada um no seu computador.
- Campeonatos realizados de dia podem reservar muitas máquinas de uma vez.
- Isso impede ou dificulta o atendimento de clientes normais (internet, sessões individuais, serviços e outras atividades).
- Para atender campeonatos enormes, Tony poderia precisar de computadores demais, que nem sempre ficarão ocupados no expediente cotidiano.
- Essa tensão de capacidade é o **motivo econômico e narrativo** para Tony considerar uma solução, não uma punição arbitrária.
- A dificuldade precisa aparecer com clientes, estações e reservas reais, não com bônus/multas fictícios.

### 4. 2001 — o nascimento da ideia de campeonato noturno

Observando as dificuldades, Tony cogita organizar partidas **fora do horário comercial normal**, quando os PCs não disputariam espaço com a clientela diurna.

- Primeiro surge a ideia de estender o expediente ou reservar uma noite especial.
- A palavra “corujão” pode surgir naturalmente por meio dos clientes ou de Tony, em vez de ser o título de um recurso desbloqueado de imediato.
- O jogador poderá, conforme desenho futuro, experimentar uma primeira sessão noturna e avaliar se vale a pena repetir.
- A crise de energia de 2001 já presente no planejamento histórico do LHS pode tornar a decisão mais interessante: trabalhar à noite também custa eletricidade.
- O jogador **não deve ser obrigado** a realizar corujões para continuar progredindo.

### 5. Aproximadamente 2002 — o corujão como tradição possível

Dependendo do desempenho e das escolhas, o encontro noturno pode virar um serviço recorrente, reconhecido pelos clientes da lan house.

- Pacotes noturnos, vagas limitadas, reservas, grupos, campeonatos e consumo de mercadorias são ideias a estudar.
- A chegada do PlayStation 1 em 2002 pode abrir possibilidades de pacotes mistos no futuro, **sem assumir ainda** que haverá corujão de console.
- Eric pode voltar a aparecer com referências a novidades europeias, inclusive o Xbox, respeitando o lançamento europeu de 2002.
- A história não precisa se encerrar em 2002: esse é apenas o horizonte inicial do arco.

## Experiência que queremos dar ao jogador

O jogador **acompanha uma ideia nascer e entende por que ela faz sentido**. Um e-mail desperta uma curiosidade; uma licença abre possibilidades; clientes criam demanda; administrar os PCs revela um problema; Tony experimenta uma solução; essa solução pode se transformar numa tradição.

Os acontecimentos devem ser:
- **Espaçados e imprevisíveis dentro de janelas coerentes**, não uma sequência diária de mensagens.
- **Ligados ao estado da partida**, quando apropriado: máquinas, licenças, ocupação, caixa, clientes e decisões.
- **Humanos:** Eric é um personagem, não um tutorial. Tony aprende junto com o jogador.
- **Opcionais:** recusar, adiar ou tentar mais tarde pode mudar o desenrolar sem punir artificialmente.
- **Observáveis no salão:** quando a mecânica existir, clientes entram, pagam, jogam, consomem e saem de verdade. Não queremos receita automática por clicar em um botão.
- **Repletos de pequenos detalhes de época**, sem transformar cada referência em uma missão.

## Ideias de mecânicas relacionadas (ainda NÃO decididas)

### Jogadores multiplayer e grupos
Precisamos discutir como formar grupos de amigos, a exigência de PCs livres ao mesmo tempo, reservas conjuntas, compatibilidade e licenciamento, espera, desistência, consumo e conflitos com os clientes diurnos. Devemos reutilizar a movimentação, o atendimento, a economia e as decisões dos personagens existentes, criando comportamentos especializados quando necessário, sem sobrecarregar o motor principal.

### Campeonatos de dia
Devem ocupar computadores reais durante um período e ter custos de oportunidade. Um torneio não pode apenas gastar dinheiro e converter isso instantaneamente em reputação. O tamanho, a duração, o pagamento, os participantes e os resultados estão em aberto.

### Corujão — expediente noturno
Um exemplo conversado foi funcionar de **22h às 6h**, mas **os horários ainda não estão aprovados**. A experiência ideal seria ver o salão funcionando de madrugada, com jogadores, luzes, consumo, eventuais incidentes e fechamento real.

A arquitetura do relógio exige investigação antes disso: atualmente o LHS simula o expediente das 10h às 22h com **720 minutos por dia**. O calendário, os fechamentos mensais, os eventos por data e os saves dependem dessa estrutura. Não podemos simplesmente prolongar o dia e deslocar todos os eventos. É preciso projetar uma transição compatível com partidas antigas e com o calendário de 1998–2030.

### Economia e consequências
Quando implementado, qualquer lucro deverá vir de cobrança real, PCs efetivamente ocupados e venda de mercadorias; custos deverão refletir energia, desgaste, manutenção, estoque e oportunidades perdidas durante o dia. Uma noite ruim pode dar prejuízo. Nenhum evento narrativo deve inventar receita sem serviço prestado.

### Correio, ritmo e continuidade
As cartas de Eric não devem competir de maneira caótica com os eventos históricos e esporádicos já existentes. Elas precisam ter intervalos naturais, registros de recebimento e ramificações compatíveis com saves. Uma carta histórica pode aparecer independentemente da situação financeira; a continuação comercial depende das ações e condições reais da lan house.

## Versão 0.2 — projeto de mecânicas e jornada de implementação futura (21/10/2026)

> **Estado: estudo, não especificação fechada e NÃO IMPLEMENTAR AINDA.** Esta seção transforma a ideia narrativa da versão 0.1 em um mapa de experiência do jogador e um plano para futuras conversas. Os nomes de botões, períodos, pré-requisitos, efeitos e fluxos abaixo são **propostas a revisar**, não requisitos aprovados. A implementação só começa depois de o arco, as regras e a migração do relógio serem discutidos e autorizados.

### Princípio de design: chegar aos poucos

Não despejar, ao virar o ano 2000, uma aba inteira de multiplayer, campeonato e corujão. A interface e as possibilidades precisam **crescer conforme Tony aprende**:

1. **Uma pessoa apresenta uma curiosidade** — Eric escreve da França; o jogador lê ou ignora sem ser obrigado a comprar algo.
2. **Nasce uma decisão comercial** — quando o título fictício estiver disponível, Tony pode pesquisar/licenciar, adiar ou descartar o investimento.
3. **O jogo revela um público novo** — se houver licença, estações e procura real, grupos começam a aparecer, sem substituir toda a clientela normal.
4. **Surge um problema de administração** — encontros e campeonatos diurnos competem com clientes cotidianos pelos mesmos PCs.
5. **Tony percebe uma alternativa** — horário estendido, campeonato experimental à noite e, mais tarde, o *corujão* propriamente dito.
6. **A ideia vira negócio opcional** — somente depois de experiência concreta, sucesso ou fracasso, novos controles comerciais podem ficar disponíveis.

A primeira mensagem pode ocorrer na janela de janeiro/fevereiro de 2000; outras mensagens são espaçadas em janelas de meses e por condições de jogo. O corujão **não é desbloqueio garantido no ano 2000**; 2001–2002 são horizonte narrativo sugerido, com variação conforme a partida. Não criar notificações diárias para forçar progressão.

### Mapa proposto de UI e botões por fase

| Momento | Local existente / futura área | O que o jogador vê | Ações sugeridas, ainda provisórias |
| --- | --- | --- | --- |
| Descoberta | **Correio** | E-mail de Eric, remetente identificável e assunto pessoal | **Ler**, **Marcar como lida**; *Responder ao Eric* é uma ideia opcional a estudar. Ler não compra nem instala nada. |
| Pesquisa | **Administração → Licenças → Jogos clássicos** (ou página curta específica) | Card de um novo título multiplayer original com preço, requisitos, PCs compatíveis e interesse estimado | **Pesquisar o jogo**, **Licenciar**, **Agora não**. Não duplicar a licença básica existente. |
| Primeiros clientes | **Salão** + eventualmente **Finanças → Ocupação** | Jogadores interessados, fila, grupos reais, PCs ocupados e motivos de desistência | Inicialmente nenhuma administração extra obrigatória; observar sinais/indicadores de demanda. |
| Primeiro campeonato | Página dedicada e compacta dentro de **Administração** — localização exata por escolher | Capacidade simultânea, duração, conflito com sessões normais, expectativa de custos e vagas | **Planejar campeonato**, **Confirmar**, **Cancelar antes de começar**, **Adiar**. |
| Ideia noturna | **Correio** ou conversa/evento motivado pelo uso real dos PCs | Tony percebe que eventos diurnos atrapalham o expediente; sugestão de testar a madrugada | **Estudar expediente noturno**, **Fazer uma noite experimental**, **Deixar para depois**. |
| Corujão em operação | Futuro painel de **Eventos / Corujão** dentro da Administração, em página curta | Data, horário, vagas, computadores reservados, preço, reservas, caixa previsto e alertas | **Abrir inscrições**, **Ajustar preço**, **Encerrar inscrições**, **Cancelar antes do início**, **Iniciar turno** se houver requisitos. |
| Depois de um evento | **Finanças → Resultado do evento**, acesso pelo histórico | Receita cobrada, vendas, energia, desgaste, lucro ou prejuízo, desistências e comentários | **Ver relatório**, **Planejar outro** ou **Não repetir**. |

**Regras de interface:** não acrescentar outra aba inchada nem um menu de cinquenta controles; usar páginas curtas, como o gerenciamento atual. Mostrar botões **somente quando fizerem sentido**; quando bloqueados, explicar o motivo (ano, licença, PCs disponíveis, horário, dinheiro, passagem, internet). Não esconder decisões antigas ou criar links de âncora que atrapalhem a rolagem no celular. Labels, posições, cores e fluxos finais continuam em aberto.

### Fluxo do jogador: da oferta à primeira partida multiplayer

**1. Receber a notícia.** Eric apresenta a novidade. O e-mail inicial pode ser narrativo, sem janela de compra. Um registro persistente permite que o jogador releia depois; não existe obrigação de responder na hora.

**2. Conhecer o produto.** Um título original inspirado em FPS tático entre equipes aparece no catálogo quando apropriado, com regras reais de licenciamento e compatibilidade com a tecnologia de 2000. *Counter-Strike* pode ser referência histórica do diálogo, não marca/arte do produto jogável do LHS. **Nome fictício ainda indefinido**.

**3. Investir ou não.** O painel deve deixar visível **custo**, **máquinas aptas**, **demanda potencial ainda incerta** e **efeitos de não oferecer o jogo**. Não prometer faturamento automático nem impor licença se Tony não quiser. Verificar como se integra às licenças básicas/Windows/jogos individuais já existentes, sem pagar pela mesma coisa duas vezes.

**4. Instalar/disponibilizar.** Precisamos decidir se uma licença vale para o estabelecimento ou requer instalações/assentos por PC, quais máquinas do período podem rodar, se há tempo de preparação, exigência de rede local e limites. Preferência: compatibilidade e instalação coerentes, sem burocracia inútil.

**5. Medir aceitação.** Só depois de oferecer o jogo aparecem visitantes com intenção multiplayer. A demanda deve refletir o catálogo e a reputação; nem toda turma consegue uma sessão. Isso fornece dados para Tony decidir se vale organizar campeonatos.

### Clientes, amigos e campeonatos: comportamento real a desenhar

**Grupos de amigos são pessoas, não um número decorativo.** Cada participante precisa entrar, aguardar, pagar, encontrar estação, jogar e sair segundo as regras existentes. As decisões serão especializadas, mas **navegação, caixa, estoques e relógio continuam compartilhados** com os clientes comuns. Evitar inserir decisões de equipe diretamente no `engine.ts` principal.

Situações a modelar antes de codificar:
- Reservas simultâneas: o grupo aceita jogar com menos gente? Espera até haver máquinas para todos? Precisa de PCs próximos ou somente ligados à mesma rede?
- Atendimento na fila: cobrança individual versus pacote pago pelo organizador; nunca cobrar em duplicidade, cobrar por vaga vazia ou ocupar PC inexistente.
- Grupos que desistem: se faltam máquinas, dinheiro, jogo instalado, energia ou tempo, explicar o motivo e liberar reservas; ninguém deve ficar preso no corredor.
- Encontros diurnos: os mesmos computadores deixam de estar disponíveis para o público normal; espera e perda de clientela surgem **da competição real pela capacidade**, não de um modificador arbitrário de reputação.
- Duração e ocupação: sessões prolongadas versus limite de funcionamento e hora de fechamento; não aceitar sessões que o expediente não consiga cumprir.
- Competições: definir depois regras de entrada, mínima de participantes, formação de equipes, campeão/placar simbólico, prêmio, público e efeito de satisfação; não é necessário simular um FPS completo.
- Demanda de longo prazo: jogadores podem voltar, indicar amigos, perder interesse ou mudar hábitos; efeitos precisam ser mensuráveis, limitados e compreensíveis.

### Economia, comércio e relatórios

**Fonte da receita:** tempo efetivamente vendido e pago nos PCs, possíveis inscrições/pacotes legítimos e mercadorias realmente compradas; nenhum `+R$ X` automático por clicar em “Campeonato”. Registrar custos reais de licença/preparação, energia, desgaste, manutenção, possível premiação e cancelamentos.

Propostas para discussão:
- **Licenciamento:** investimento inicial com retorno incerto e concorrência com a compra de computadores ou estoque. Preço e modelo de licença **não definidos**.
- **Torneio diurno:** o jogador compara receitas de partidas coletivas contra receita esperada de sessões normais; evitar lucro fictício ou ocupação duplicada.
- **Corujão experimental:** pacote por participante ou por estação, faixa de horário planejada (22h–6h foi *exemplo*, não decisão), capacidade finita e reservas.
- **Comércio de madrugada:** bebidas e alimentos podem gerar vendas reais; estoque pode acabar, afetando satisfação. Não inventar necessidades artificiais ou consumo sem retirada do produto.
- **Despesas:** energia efetivamente acumulada à noite, PCs ligados/ocupados, desgaste e reparos. A crise energética de 2001 deve alterar o custo de maneira consistente com o modelo histórico existente.
- **Cancelamento e desistência:** prever regras claras sobre reembolso, taxa/depósito e aviso ao cliente; impedir venda de vagas impossíveis e dupla devolução.
- **Relatório:** vagas ofertadas x preenchidas, tempo-PC vendido, faturamento de sessões, vendas adicionais, custos, resultado líquido, clientes atendidos/recusados e causas de problema. O jogador precisa ver *por que* o evento deu certo ou errado.

### Decisões e consequências — investir, adiar ou recusar

**Esta é uma regra central pedida para a versão 0.2:** o jogador pode **não investir**, mas escolhas diferentes devem criar histórias e oportunidades diferentes no futuro. A consequência deve nascer do mercado e das necessidades dos clientes, não de uma penalidade gratuita por desobedecer ao roteiro.

| Escolha do Tony | Efeito próximo sugerido | Possível consequência posterior |
| --- | --- | --- |
| **Investir cedo** no título multiplayer | Gasta recursos, passa a atender os interessados se houver PCs adequados | Pode formar comunidade de jogadores e receber primeiro convites para campeonatos; também corre risco de baixa demanda, lotação e custo antes de amadurecer o negócio. |
| **Pesquisar e adiar** | Mantém caixa e atende os clientes atuais; não oferece ainda o título | Pode perder parte do público pioneiro ou receber nova dica de Eric; entrar mais tarde custa tempo e talvez uma oportunidade comercial, **sem bloquear o sistema para sempre**. |
| **Recusar a licença** | Não paga licença nem recebe a procura específica do jogo | Alguns grupos procuram outra lan house; Tony deixa de capturar receitas e convites associados a essa modalidade. Não retirar dinheiro/reputação de forma instantânea ou inventar clientes fantasmas para puni-lo. |
| **Licenciar mas não organizar campeonato** | Oferece sessões normais do jogo sem reservar grandes blocos de PCs | Mantém flexibilidade do expediente; pode demorar mais para desenvolver um público competitivo e talvez perder um campeonato local para concorrentes. |
| **Organizar campeonato de dia** | Venda de vagas e ocupação efetiva; risco de prejudicar clientes regulares | Cria, se o problema realmente ocorrer, o contexto para Tony cogitar horários noturnos; se o salão comportar tudo, a ideia pode surgir por outros caminhos. |
| **Recusar um campeonato específico** | Evita custo, tumulto e conflito com a operação | Um grupo pode desistir de esperar ou procurar outra casa; novos convites precisam de condições e intervalos, sem penalidade permanente automática. |
| **Testar um corujão** | Enfrenta custos, logística, reservas e imprevisibilidade de adesão | Pode construir reputação nesse nicho e receber pedidos por outra noite, ou ter prejuízo e repensar formato/preço. |
| **Não fazer corujão** | Preserva horário convencional e rotina financeira | Perde **a chance de captar** a procura noturna, e concorrentes podem aproveitar a demanda. O resto do jogo continua completo, com alternativas viáveis de crescimento. |

**Evitar armadilhas de design:** não usar “recusou = reputação -10” sem causa observável; não fabricar concorrente onipresente que roube clientes todos os dias; não transformar toda mensagem em escolha com punição. A concorrência pode ser contada em e-mails, conversa de clientes ou relatório de *oportunidade perdida*, mas um sistema completo de estabelecimentos rivais ainda **não foi aprovado**. Se houver efeitos persistentes, precisam ter limites, duração e possibilidade razoável de recuperação.

**Reentrada na história:** anotar se Tony recusou, pesquisou ou investiu. Meses depois pode surgir uma segunda oportunidade coerente: outro convite, interesse renovado ou recomendação de Eric. O jogador não recupera automaticamente todo o público do início, mas também não perde conteúdo permanentemente por uma decisão sem aviso.

### Um dia de campeonato e um corujão: sequência futura no salão

**Campeonato diurno (rascunho):**
1. Jogador escolhe data e confere quantos PCs podem ser comprometidos sem atravessar o fechamento.
2. Painel mostra duração, lugares compatíveis e impacto estimado na disponibilidade normal.
3. Inscritos aparecem fisicamente; o sistema reserva somente estações disponíveis e confirma pagamentos segundo regras ainda a definir.
4. Partidas acontecem por sessões observáveis: telas animadas, grupos ocupando máquinas, comentários eventuais, compras com estoque real.
5. Terminando, clientes liberam máquinas e deixam o salão; um relatório mostra receitas, custos e atendimento perdido.

**Corujão (rascunho):**
1. Só aparece como possibilidade quando a história e a experiência do Tony justificarem; não nasce como botão automático no aniversário de 2000.
2. O jogador propõe uma noite, vê custos previstos, vagas e horário; pode escolher não anunciar.
3. Durante as inscrições, a procura aparece gradualmente. Não há lotação garantida por comprar um anúncio ou apertar “Iniciar”.
4. No horário real da simulação, entram jogadores de verdade; grupos usam computadores, compram mercadorias e reagem a falhas ou preços.
5. Ao amanhecer, ocorre a saída organizada e liberação dos PCs, sem teleportar clientes nem perder personagens na virada da data.
6. Tony recebe um relatório do evento. Se a experiência foi boa, fica mais plausível alguém sugerir uma próxima noite; se foi ruim, ele pode corrigir o plano ou abandonar.

A iluminação noturna e o ambiente sonoro podem reforçar a madrugada, mas são uma etapa artística à parte. Ainda precisamos decidir se o salão fica aberto exclusivamente aos inscritos ou aceita clientes comuns, e como funcionam funcionários, intervalo do proprietário e segurança da operação.

### Arquitetura técnica que exigirá estudo ANTES da implementação

**Bloqueio conhecido:** hoje `DAY_MINUTES = 720` e `OPEN_HOUR = 10` representam 10h–22h. Dia do calendário, limite de 2030, contas, geração de visitantes, sessões e salvamento dependem disso. **Não aumentar `DAY_MINUTES` diretamente para 1440 nem mudar o módulo `engine.ts` para “fazer caber” 6h da manhã.**

Planejamento de investigação futura, sem aprovar arquitetura definitiva:
- Mapear todas as dependências do relógio e do início/fim do dia, incluindo calendários, notas históricas, correio, energia, pagamentos, desgaste, necessidades, serviços e saves.
- Separar conceitualmente **dia da campanha**, **minuto de simulação**, **hora civil** e **turno comercial**. Escolher um modelo que mantenha ordenação consistente mesmo quando uma noite atravessar meia-noite.
- Definir políticas de chegada, fila, cobrança, duração da sessão, fechamento gradual e retomada após salvar no meio da madrugada.
- Evitar conflito com a operação normal do dia seguinte: verificar se existe descanso, reabertura e cobrança de outro turno. Ainda não decidir o modelo 24h.
- Reutilizar `customerDecisions.ts`, `customerLifecycle.ts`, `customerFlow.ts`, `customerMotion.ts`, `eraGames.ts`, `financialReview.ts` e o sistema de licenças já existente; adicionar módulos de domínio próprios para turnos/eventos/grupos quando a arquitetura for aprovada, sem copiar a engine de personagens.
- Eventos e e-mails históricos com IDs estáveis, agendamento sem avalanche e registros persistentes das decisões de Tony; preservar a independência do RNG de personagens.
- Fazer **plano explícito de migração** dos saves antigos; `totalMinutes` e datas das campanhas de 1998–2030 não podem reinterpretar silenciosamente o progresso já salvo.
- Não incluir UI dos corujões no fluxo principal nem fazer refatoração maciça sem validar primeiro o relógio e os cenários com testes.

### Próximos passos de DESENHO (não de programação), na ordem sugerida

- [ ] **A. Escrever Eric como personagem**: personalidade, relação familiar, país/cidade, voz e frequência de mensagens; revisar o primeiro e-mail com linguagem natural.
- [ ] **B. Fechar linha do tempo flexível de 2000–2002**: quais fatos são históricos e garantidos, quais e-mails são condicionais, intervalos mínimos entre mensagens e reentrada após recusa.
- [ ] **C. Definir o título multiplayer original**: nome, apresentação, ano, requisitos e contrato de licenciamento, articulado com os jogos e Windows que já existem.
- [ ] **D. Modelar demanda e grupos**: perfil dos jogadores, criação de grupos, reserva simultânea, fila, pagamento, desistências e capacidade real.
- [ ] **E. Desenhar o primeiro campeonato diurno**: inscrição, preço, reserva de PCs, ocupação, prêmio simbólico, cancelamento e dados que revelarão o conflito com atendimento normal.
- [ ] **F. Revisar a árvore de consequências**: investir x pesquisar x recusar x voltar atrás; oportunidades perdidas, pistas de concorrência, risco financeiro e evolução do diálogo com Eric.
- [ ] **G. Desenhar a descoberta do corujão**: quais evidências do jogo levam Tony à ideia, quem sugere a noite e como isso aparece naturalmente, sem e-mail tutorial obrigatório.
- [ ] **H. Especificar a operação noturna**: janela horária, reservas, preços, inscrições, chegadas, atendimento, consumo, saídas, incidentes e relatório.
- [ ] **I. Aprovar um mapa de telas e botões**: Correio, Licenças, página compacta de Eventos/Corujão e Finanças; textos de erro e comportamento mobile, sem novas abas gigantes.
- [ ] **J. Fazer estudo de relógio/calendário e migração de saves**: provar que a madrugada atravessa a data corretamente antes de planejar mudanças de código.
- [ ] **K. Preparar cenários de teste e balanceamento**: turma pequena/cheia, PCs quebrados, no-show, baixa procura, estoque vazio, queda de energia, crise de 2001, fila lotada, recusa permanente/adiamento, reentrada, partidas legadas e fechamento em 2030.
- [ ] **L. Pedir aprovação explícita da ideia completa**; somente depois transformar os pontos aceitos em tarefas de implementação incremental no backlog.

### Checklist para quando chegar a hora de PROGRAMAR (referência futura, não autorização atual)

**Fase técnica 1 — alicerces:** mapa e migração de calendário/relógio, eventos condicionais persistentes e teste de saves antigos. **Fase técnica 2 — mercado multiplayer:** licença do jogo fictício, PCs compatíveis e demanda mensurável. **Fase técnica 3 — grupos e campeonatos diurnos:** sessões e reservas reais, conflitos de capacidade e relatórios. **Fase técnica 4 — descoberta e experimento noturno:** mensagens condicionais, planejamento de turno, abertura e encerramento madrugada. **Fase técnica 5 — maturação do corujão:** pacotes, consequências persistentes, retorno de clientes, situações de 2001–2002, ajustes visuais e testes em desktop/celular. Cada fase deverá funcionar numa partida real antes da seguinte.

### Critérios de qualidade do arco (propostas)

- Um jogador que **não compre a licença** continua progredindo normalmente, mas pode ver indícios naturais de oportunidades que não capturou.
- Um jogador que invista **pode perder dinheiro** se não houver procura suficiente: sucesso não é garantido pela história.
- Não pode haver corujão sem jogadores reais, vagas possíveis, pagamento consistente e fechamento físico.
- Diálogos de Eric não repetem toda hora; o jogador pode reconhecê-lo como pessoa e não como botão de desbloqueio.
- O jogo deve permitir adiar um investimento sem prender todos os outros eventos atrás dele.
- Não deve haver monetização fictícia, renda de NPC invisível, cliente duplicado, teleporte na madrugada ou mudança de data que corrompa save.
- O corujão pode ser uma consequência de decisões bem construídas, mas **não é obrigação nem condição para vencer o LHS**.

## Pontos que ainda precisamos conversar

1. **Personalidade de Eric:** idade aproximada, relação com Tony, linguagem dos e-mails, ocupação na França e frequência dos contatos.
2. **Data e formato da descoberta:** quais mensagens de 2000 são históricas e quais dependem da partida; como evitar spoiler e excesso de e-mails.
3. **Título multiplayer fictício:** nome original, arte, estilo, licenciamento, requisitos das máquinas da época e como os clientes descobrem o jogo.
4. **Demanda dos jogadores:** quantos aparecem, como se formam grupos, se os PCs precisam ficar próximos e como os visitantes comuns reagem à ocupação.
5. **Campeonatos diurnos:** organização, vagas, duração, receita, custos, reputação, prêmios e efeitos reais sobre a operação.
6. **A descoberta de Tony:** quais acontecimentos podem fazê-lo pensar em sessões noturnas e como a ideia surge sem obrigar o jogador.
7. **Primeiro corujão:** reserva, preço, horário, quantidade de participantes, duração, reclamações, incidentes e relatório.
8. **Crise energética de 2001:** de que forma mexe com a viabilidade do evento e como evitar custos arbitrários.
9. **Relógio e saves:** como dar suporte à madrugada e à passagem de data sem quebrar calendário, faturas, fechamento, funcionários e partidas existentes.
10. **Easter eggs posteriores:** novos contatos de Eric, referências aos jogos/consoles da época e possíveis conexões com o PlayStation 1 de 2002.
11. **Ritmo e ramificações:** quanto pode variar de uma partida para outra, como adiar a ideia, como retomar o corujão mais tarde e como evitar histórias idênticas em todas as campanhas.
12. **Validação no gameplay real:** vídeo de uma noite inteira, testes de ocupação/rotas/saída, economia, save no meio do evento e experiência mobile.

## Limites desta primeira versão

- **Nenhum desses recursos está autorizado para implementação agora.** Estamos somente registrando e amadurecendo a visão.
- Não fixamos preços, probabilidades, cronograma definitivo, quantidade de eventos, telas nem novos campos de save.
- Não tratamos as sugestões de texto dos e-mails como diálogos finais aprovados.
- Não substituir a história humana por uma cadeia obrigatória de recompensas.
- Não esquecer a causa principal: **a ocupação dos computadores por campeonatos durante o dia conduz Tony à ideia de usar a madrugada**.

## Histórico de elaboração

- **21/10/2026 — Versão 0.1:** registrado o conceito original de Eric na França, a descoberta gradual de um jogo multiplayer inspirado em *Counter-Strike*, a demanda e os campeonatos que pressionam a capacidade diurna, e o surgimento do corujão como solução entre 2000 e aproximadamente 2002. Permanecem abertas as escolhas narrativas, regras técnicas e mecânicas reais de jogo.
- **21/10/2026 — Versão 0.2:** acrescido mapa gradual de UI e botões, comércio, grupos de jogadores, campeonatos, corujão, escolhas de investimento/recusa com oportunidades futuras, plano de arquitetura do relógio e uma sequência explícita de decisões a amadurecer antes de programar. **Ainda não aprovado para implementação.**

---

# Próximas ideias grandes

Este espaço fica reservado para os próximos conceitos que ainda precisem amadurecer antes de entrar no backlog de execução. Criar um novo tópico numerado para cada ideia, mantendo a versão e seu estado.
