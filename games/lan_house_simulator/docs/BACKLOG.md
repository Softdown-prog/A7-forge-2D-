# Backlog — visão sem perda de escopo

## Fase A — estrutura e recorte jogável
- [x] Pasta isolada, documentação de produto, contratos e painel inicial.
- [x] TypeScript + Canvas 2D fixo com cenário dimétrico, balcão, dono e clientes.
- [x] Protótipo de fluxo de clientes, PCs, finanças, incidentes e save.
- [x] Pool de 3 workers de CI com validações e piloto de arte.
- [ ] Teste visual real em browsers móveis e desktop e ajuste de escala.
- [ ] Aprovação visual dos sprites substituindo placeholders.

## Fase B — Forge e personagens
- [ ] Design original de dono/balcão, mesa/monitor/cadeira, refrigerante, doce e prateleiras de balas/paçocas/biscoitos/salgadinhos; sprites 2D separados com âncora.
- [ ] Animações direcionais de caminhada; sentar/usar PC (telas piscando), levantar e sair; identidade travada.
- [ ] Fantasias originais: palhaço, vampiro, monstro costurado, coelho e mascotes genéricos; sem cópia de IPs.
- [ ] Controle de oclusão e profundidade entre balcão, dono, mesa, cadeira e cliente.

## Fase C — economia tycoon
- [ ] Mais linhas de estoque/fornecedores: refrigerantes, doces, balas, paçocas, biscoitos e salgadinhos, preços e qualidade por fornecedor.
- [ ] Cliente VIP, conforto, humor, fila, avaliações e reputação com efeitos consistentes.
- [ ] Melhorias no computador, rede, energia; desgaste/consumo por cliente e relatórios financeiros.
- [ ] Aumento de preço reduz procura; promoções aumentam circulação, desgaste e custos, sem fabricar receita.
- [ ] Multa por jogos comerciais sem licença e opção de regularizar; balanço cuidadoso do evento.

## Fase D — expansão e polimento
- [ ] Nova sala anexada, montagem física das mesas/PCs com colisão/ocupação e rotas internas.
- [ ] Aluguel, link, energia, manutenção, eventual equipe; cobrança por mês do jogo.
- [ ] Chuva fora da cena como sinal econômico e instabilidade de internet; variedade de eventos.
- [ ] Importar efeitos gravados pelo criador: moedas, líquido, vendas, alertas.
- [ ] Menu completo, opções, som, acessibilidade, suporte touch, save versionado, publicação estática.

## Regra de pronto

A tarefa só recebe status concluído se código + testes + visualização em tamanho de jogo estiverem consistentes. CI verde não significa arte aprovada. Não substituir dois objetos aprovados para refazer o terceiro. 

## Próxima validação visual (restrita)
- [x] Definir plataforma 2:1 suspensa, telhado omitido, frente recortada e soleira sem exterior.
- [x] Documentar progressão de conexão discada -> rádio -> fibra, com rótulos dos níveis existentes.
- [ ] Conferir captura real do runtime em navegador no tamanho 1x, sem confundir com a maquete de validação.
- [ ] Revisar profundidade/oclusão do balcão, telas CRT e ponto de chegada dos visitantes, antes de novos assets.
- [ ] Depois: evolução de PCs Windows 98 -> 2000 -> XP -> Vista -> 7 -> 8/8.1 -> 10 -> 11, implementada por upgrade isolado e com custo real.

## Etapa de circulação (12/10/2026)
- [x] Corrigir sintaxe TypeScript do piso suspenso que falhou no CI.
- [x] Trajeto interno por corredor com waypoints determinísticos entre entrada, balcão, estação, venda e saída.
- [x] Separar transições de sentar/usar/levantar e manter reserva do computador durante a animação.
- [x] Adicionar testes de waypoints, ocupação e liberação da estação.
- [ ] Validar fluxo visual no navegador via artifact do GitHub Actions antes de trocar placeholders por sprites definitivos.

## Validação retro/CRT (12/10/2026)
- [x] Estudo procedural 2D de mesa, gabinete, teclado, cadeira e monitor CRT, sem logos ou imagens externas.
- [x] Corrigir posições dos PCs de expansões para não extrapolarem o piso.
- [x] Preparar screenshots reais do Canvas desktop e mobile via worker de cena e artifact de revisão.
- [ ] Aprovar a composição visual por PNG antes de substituir placeholders por PNGs finais do A7 Forge.

## Acabamento visual V1 (12/10/2026)
- [x] Trocar atores-retângulo por formas orgânicas vetoriais com contorno, cabelo, roupa, pernas e braços articulados.
- [x] Diferenciar proprietário, clientes regulares e cinco arquétipos originais de fantasia sem copiar personagens registrados.
- [x] Identidade visual determinada pelo ID da pessoa, sem aleatoriedade por frame.
- [x] Caminhada com balanço contrário de braços/pernas, pose sentada, mãos voltadas ao teclado e levantar sem troca de rosto.
- [x] Frisos, cartazes originais, luminárias discretas e tapete sobre piso isométrico sem telhado.
- [ ] Avaliar arte no PNG real (desktop/mobile) do CI antes de promover sprites finais.

## Revisão por captura real V2
- [x] Conferir screenshots reais desktop/mobile do commit 14caace (três workers verdes).
- [x] Mover letreiro para área livre do fundo, sem ocultar os pôsteres.
- [x] Decorar parede lateral sem criar exterior ou telhado.
- [x] Melhorar o contraste e a forma das cadeiras, mantendo mesas/âncoras.
- [x] Gerar close-up de personagens a partir do mesmo Canvas de runtime.
- [ ] Avaliar novos PNGs do CI V2 antes de dar arte como aprovada.

## Polimento visual do equipamento — 12/10/2026
- [x] Dar desenho de desktop genérico aos monitores CRT (barras, ícones e vidro) sem marcas registradas.
- [x] Acrescentar leitor de disco ao gabinete bege e digitação discreta às poses sentadas.
- [x] Substituir círculos nas máquinas por vitrines com produtos, fileiras, moedeiro e gaveta.
- [x] Adicionar montante, travessa e peitoril às janelas sem cenário externo.
- [x] Criar close-up dedicado para os equipamentos a partir do Canvas de runtime.
- [ ] Conferir screenshot V3 gerado pelo worker de cena e aprovar visualmente antes de promover arte final.

## Direção, assento e coerência espacial (12/10/2026)
- [x] Orientação canônica norte/sul/leste/oeste derivada de cada trecho de movimento no espaço do jogo, retida durante espera e em saves novos.
- [x] Corpo de costas com nuca/cabelo sem olhos frontais, e perfil com olho único/nariz; marcha ligada ao deslocamento.
- [x] Usuário sentado e digitando orientado obrigatoriamente para o CRT (norte), sem olhar para câmera.
- [x] Aproximar as três mesas iniciais da parede posterior e ampliar área do corredor; duas expansões reposicionadas.
- [x] Testes para quatro direções, manutenção de orientação e posicionamento mesa/cadeira.
- [ ] Validar quatro direções em PNG/filmagem do navegador, com overlay de pernas/mãos e oclusão; arte ainda procedural provisória.

## Prancha de orientação 4 vistas
- [x] Novo artifact `lhs_four_directions_and_pc_pose.png` gerado em Chromium pelas funções reais de desenho de ator e CRT.
- [x] Grade 4 direções x 3 poses, dois instantes distintos de passo e vista sentada diante da estação.
- [ ] Inspecionar visualmente perfil, nuca, braço e pernas para detectar inversões ou pose artificial.
- [ ] Validar em movimento no runtime completo antes de declarar a caminhada aprovada.

## Correção após olhar a prancha real (12/10/2026)
- [x] Remover gola, botões e detalhes de peito na vista de costas.
- [x] Ajustar joelhos e mãos na transição de sentado, encurtando silhueta e aproximando braços do teclado.
- [x] A prancha passa a mostrar o uso de PC sempre voltado ao monitor, independentemente da coluna da direção da caminhada.
- [ ] Conferir visual gerado no próximo CI; oclusão real das mãos sobre teclado ainda pode exigir sprite dedicado.

## Overlay do teclado integrado à cena (12/10/2026)
- [x] Novo overlay de braços/mãos ligado aos ombros e às coordenadas reais do teclado; é renderizado **depois** do corpo.
- [x] Preserva as fases sentar, usar e levantar com fade proporcional ao progresso da transição.
- [x] Mantém a identidade da roupa e pele por ID; não interfere no estado da economia.
- [ ] Revisar mãos no PNG real, especialmente sobreposição e silhueta do encosto.

## Fidelidade da prancha com o runtime (12/10/2026)
- [x] A prancha importa o MESMO `drawSeatedKeyboardOverlay` de `retroComputer.ts` usado no salão.
- [x] Renderiza mãos sobre teclado depois da mesa e do corpo, com a mesma paleta por identidade.
- [x] Dois instantes de caminhada em fases opostas do ciclo (0,20 e 0,60 s) para evidenciar os passos.
- [ ] Conferir a nova imagem gerada; o overlay é provisório até aprovação visual e teste de vídeo no runtime.

## Storyboard de ciclo completo da cena (vídeo de revisão)
- [x] CI captura oito estados da cena completa: aproximando, cadeira, sentando, sentado, digitando, levantando, de pé e saindo.
- [x] Geração usa `SceneRenderer` real no Chromium, com um visitante e estação determinísticos; mantém posição dos objetos.
- [ ] Avaliar `lhs_full_scene_lifecycle.png` e corrigir possíveis colisões/oclusões de mesa-cadeira-braços.
- [ ] Validar sequência dinâmica automatizada do motor; snapshots são estados controlados de apresentação, não gameplay simulado.

## Ajuste de assento após storyboard real (12/10/2026)
- [x] Identificado o afundamento do quadril nas oito capturas: deslocamento de cabeça 18px incompatível com a altura do assento de 25px.
- [x] Corrigida a transição: tronco desce só 3px e coxas dobram na altura da cadeira; pernas mantêm contato com o chão.
- [x] Mantido o overlay externo das mãos com âncoras no teclado e quatro direções da caminhada.
- [ ] Conferir a nova prancha CI e corrigir eventual cruzamento da cadeira com as pernas.

## Acabamento restrito: PCs e máquinas (12/10/2026)
- [x] Alinhados os três computadores iniciais na mesma linha, paralelos à parede posterior, com espaço consistente entre bancadas.
- [x] Máquinas REFRI/DOCES lado a lado contra a parede do fundo, com vitrines voltadas para o corredor (Y+), altura e leitura coerentes.
- [x] Frente das máquinas reconstruída em um único plano: 3 fileiras de produtos, reflexo discreto, botoeira, gaveta e rodapé.
- [x] Fila de compra posicionada junto às máquinas; lógica de preços e estoque preservada.
- [ ] Inspecionar captura real após CI para verificar sobreposição com terceiro PC e caixilhos.

## Contrato de layout único para PCs e máquinas (12/10/2026)
- [x] Posições, largura e profundidade das vitrines agora em `sim/layout.ts`, compartilhado entre a cena e a fila de compra.
- [x] Fila de atendimento calculada a partir da posição física das máquinas, sem coordenada avulsa.
- [x] Testes automáticos impedem máquinas sobrepostas, vitrine inacessível e bancada cruzando a profundidade das máquinas.
- [ ] Conferir a captura do novo CI antes de aprovar o visual.

## Pôsteres temáticos na parede (12/10/2026)
- [x] Cinco cartazes na parede esquerda: RollerCoaster Tycoon, Counter-Strike, Pangya, Gunbound e City Horizon.
- [x] Designs vetoriais próprios com nomes escritos e símbolos abstratos, sem reproduzir capas ou logotipos alheios.
- [x] City Horizon recebe cartaz diferenciado com silhueta urbana e friso dourado.
- [x] Montagem sob perspectiva isométrica de parede, sem cobrir as janelas do fundo.
- [ ] Revisar legibilidade no PNG real do runtime antes da aprovação visual.

## Funcionalidade incremental — reparo emergencial de internet (12/10/2026)
- [x] Serviço pago no painel de Administração, disponível apenas com internet fora do ar.
- [x] Cobrança real R$ 75/100/125 conforme nível, contabilizada em despesas; caixa insuficiente não muda estado.
- [x] Técnico encerra o incidente atual, sem conceder upgrade e sem alterar a lógica de falhas futuras.
- [x] Testes para internet online, falta de caixa, custo progressivo, reparo único e recuperação.
- [ ] Verificar painel em captura real e jogo sob queda natural após CI.

## Fornecedores: contrato de atacado (12/10/2026)
- [x] Contrato de parceiro por R$ 180 com taxa real lançada em despesas, máximo uma vez.
- [x] Desconto de 20% somente nos novos lotes de bebidas, doces e salgados; preços de venda e quantidades mantidos.
- [x] Botão e custos atualizados no painel de estoque; saves anteriores sem `supplierTier` continuam no fornecedor básico.
- [x] Testes para falta de caixa, desconto, dupla contratação, quantidades e save legado.
- [ ] Inspecionar interface do novo painel no navegador antes de aprovação visual.

## Satisfação e reputação (12/10/2026)
- [x] Concluir sessão avalia preço/hora, tempo de espera e minutos sem conexão.
- [x] Avaliações alteram reputação sem receita artificial; limites evitam oscilação descontrolada.
- [x] Feedback positivo/negativo no histórico e testes para situações favoráveis/desfavoráveis.
- [ ] Testar balanceamento em uma temporada extensa de simulação.

## Feedback visual de pagamento no balcão
- [x] Cada pagamento real gera evento transitório com valor e posição do cliente no balcão.
- [x] Texto verde +R$ sobe, contorno para leitura e desaparece suavemente após 1,35s, com limite de partículas.
- [x] O evento não acrescenta receita: é emitido somente depois de a simulação registrar o pagamento.
- [x] Gancho `coin.wav` continua conectado; pasta de áudio contém somente README, sem WAV aprovado.
- [x] Teste impede efeito duplicado por pagamento.
- [ ] Integrar o arquivo de som aprovado quando disponível; não substituir por terceiros sem validação.

## Sons de vending com mercadoria real
- [x] Criada receita sonora original procedural para lata: mecanismo, queda, batida, quique e rolamento.
- [x] Compra de doce/salgado tem efeito mais curto e diferente.
- [x] Eventos de áudio somente depois de venda confirmada, inclusive com estoque esgotado não há som.
- [x] Preservado efeito aprovado do caixa `money_income_01.ogg`; desbloqueio de áudio respeita interação do navegador.
- [ ] Revisar timbre audível em dispositivo real antes de considerar master final do CH Audio Lab.

## Decisões V1: necessidades pessoais
- [x] Fome, sede e energia variam determinísticamente por cliente e por minuto, não por frame.
- [x] Após terminar sessão de 45 minutos, cliente decide comprar refrigerante/lanche conforme necessidades, estoque e orçamento pessoal.
- [x] Durante uso do computador, necessidades não interrompem a reserva ou a animação; compatibilidade com clientes antigos sem campos novos.
- [x] Testes sobre evolução das necessidades, prioridades, estoque, orçamento e preservação da sessão.
- [ ] Etapa seguinte: decidir duração de PC, descanso e perfil VIP; balancear frequência de compras em simulação longa.
- [ ] Som da lata permanece desativado até aprovação do usuário.

## Contratos de tempo por cliente
- [x] Duração decidida antes do pagamento conforme necessidades e perfil determinístico: 30, 45, 60 ou 90 minutos.
- [x] Receita proporcional ao tempo contratado; popup e log mostram o valor verdadeiro.
- [x] Assento permanece reservado até o contrato terminar; saves sem campo de sessão mantêm 45 minutos.
- [x] Testes de duração, cobrança e liberação; sem mudar arte nem áudio não aprovado.
- [ ] Balancear distribuição de durações e frequência de demanda em simulações longas.

## Ciclo de venda e feedback visual V1
- [x] Cliente dirige-se à frente da máquina específica de refrigerante ou doces sem trocar a câmera.
- [x] Venda confirmada envia valor e posição para efeito verde +R$ sobre o ponto da compra, uma vez por venda.
- [x] Estoque e caixa continuam na mesma transação, com testes de compra e consumo.
- [x] Som de lata rejeitado continua mudo; efeitos aprovados não foram alterados.
- [ ] Inspecionar vídeo contínuo do cliente efetivamente comprando em navegador.

## Feedback visível dos clientes
- [x] Balões temporários de reclamação para fila longa, internet indisponível, preço/espera e produto esgotado.
- [x] Elogios curtos em balões de outra cor, sem modificar a economia ou a câmera.
- [x] Eventos transitórios limitados e drenados pela UI; teste de reclamação e conservação do caixa.
- [ ] Aprovação visual no runtime em navegador; ajustar posição se encobrir máquinas.

## Manutenção individual dos PCs
- [x] Cada computador acumula desgaste real somente durante o uso e fica indisponível para novos clientes quando alcança 100%.
- [x] Sessão em andamento não é interrompida pela manutenção.
- [x] Painel administrativo apresenta desgaste, PCs parados, custo por estação e botão de reparo.
- [x] Cobrança no caixa e despesas sem duplicação, compatibilidade com saves anteriores, testes de reserva e reparo.
- [ ] Revisão visual do painel de manutenção em desktop e celular.

## Rearranjo do salão — 13/10/2026
- [x] Deslocar a prateleira de salgadinhos da parede dos PCs para a parede lateral esquerda.
- [x] Alinhar três computadores iniciais mais próximos do fundo, mantendo os assentos e as rotas derivados das posições oficiais.
- [x] Não mover máquinas de refrigerante e doces.
- [ ] Conferir PNG real do novo layout antes de considerar a arte aprovada.

## Painel de administração — indicadores
- [x] Quatro indicadores no topo do painel: caixa, saldo acumulado, contas mensais e clientes atendidos.
- [x] Discriminação de aluguel, internet, energia e manutenção usando os mesmos valores da economia.
- [x] Estilo responsivo para desktop/celular e reparos integrados visualmente ao painel.
- [ ] Inspeção visual do painel aberto em desktop e mobile após CI.

## Ampliação lateral direita — outubro de 2026
- [x] Adicionar uma faixa lógica de piso à largura do salão, com paredes e entrada seguindo a mesma largura.
- [x] Levar refrigerante e doces 0,58 tile para a direita, sem mudar suas funções e rotas automáticas.
- [x] Encostar a fileira inicial de PCs mais perto da parede traseira, ajustando cadeiras e destinos a partir do mesmo contrato.
- [ ] Aprovar captura visual do runtime (piso, parede, porta e afastamentos).
\n## Expositor de salgadinhos procedural\n- [x] Substituir antigo bloco marrom por estante vazada de metal, com quatro níveis e pacotes coloridos organizados.\n- [x] Adicionar pequena bandeja/prato ao proprietário no salão, sem trocar o ator nem as máquinas.\n- [ ] Revisar PNG do jogo compilado e ajustar oclusão conforme resultado visual.\n
## Evolução de computadores — efeito na satisfação
- [x] Upgrade de hardware passou a proporcionar bônus moderado de satisfação de 0,08 por nível adicional, limitado a 0,16 e à reputação máxima do jogo.
- [x] Bônus aplicado somente ao fim da sessão no PC correspondente; não cria cobranças, não modifica câmera ou layout, e saves antigos ficam no nível básico.
- [x] Teste de upgrade, compatibilidade, limite e benefício numérico.

## Diferenciação visual de hardware no salão
- [x] Computador básico mantém CRT e gabinete bege.
- [x] Níveis 2 e 3 usam variações sutis de material e identificação junto ao gabinete (sem alterar footprint, cadeira ou câmera).
- [x] Estado visual deriva do nível persistido no mesmo PC; saves antigos continuam como nível 1.
- [ ] Aprovação visual em screenshot do jogo compilado.

## Divulgação local — panfletagem paga (13/10/2026)
- [x] Campanha diária no painel Finanças: custo real R$ 120 no caixa e despesas, compra única por dia de jogo.
- [x] +40% na chance de chegada durante o dia da contratação; fila, capacidade, satisfação e cobrança continuam com a simulação original.
- [x] Expiração automática no fechamento (22h), sem timers reais; dia de compra opcional em saves antigos, com validação de importação.
- [x] Indicador de campanha no HUD, duração restante e botão bloqueado quando não há caixa ou a campanha está ativa.
- [ ] Avaliar efeito sobre a demanda em sessões longas e conferir o painel de Finanças no PNG real de desktop/mobile do CI.

## Fila física e colisões entre visitantes — 13/10/2026
- [x] Atendimento sequencial do caixa por ordem de chegada e intervalo entre clientes, sem cobranças antecipadas.
- [x] Até dez lugares físicos: o corredor comporta a fila sem empilhar os personagens.
- [x] Passos subdivididos com bloqueio de espaço entre atores; saída lateral do balcão quando não há divisórias.
- [x] "?" dos clientes em vermelho com contorno escuro; retirar os nomes brancos das máquinas.
- [x] Preservar síntese sonora procedural HTML5 e os dois efeitos já aprovados, sem incluir gravações externas.
- [x] Conferir circulação sob lotação e salas separadas por paredes no runtime: cenário de estresse de 14 clientes, três portas e quatro PCs nos anexos; vídeo contínuo em Chromium (14/10/2026).

## Fechamento incremental — perfil VIP (13/10/2026)
- [x] Cliente VIP aparece deterministicamente conforme reputação, sem interferir na aleatoriedade da simulação.
- [x] Identificação visual discreta "★ VIP" no próprio Canvas do salão.
- [x] VIP mais exigente quanto à fila, espera e instabilidade, com bônus moderado para hardware melhor.
- [x] Perfil opcional persistido no save, sem invalidar clientes das partidas anteriores.
- [x] Testes de taxa de aparecimento, reação à experiência e persistência.
- [ ] Balancear frequência, humor, atendimento e economia dos VIPs em uma campanha longa com capturas reais.

## Auditoria econômica de campanha — 13/10/2026
- [x] Executar campanha automatizada de 45 dias completos, minuto a minuto, sem dinheiro ou receita artificial.
- [x] Verificar conservação contábil do caixa, receita e despesas a cada dia, energia acumulada e limites de desgaste, reputação e lotação.
- [x] Identificar e corrigir duplicidade de multa aleatória de jogos após a autuação formal por direitos autorais.
- [x] Registrar indicadores de caixa, atendimentos, perdas e reputação nos dias 15, 30 e 45.
- [x] Testar múltiplas sementes, campanhas com upgrades reais, expansão e decisões pagas: 9 campanhas de 45 dias comparadas e relatadas em `docs/ECONOMY_CAMPAIGN_AUDIT_2009.md`.
- [ ] Inspecionar capturas reais de uma campanha avançada antes de declarar o acabamento final.

## Balanceamento e escoamento do caixa — 13/10/2026
- [x] Comparar 3/5/7 PCs em 2009, com capital inicial de teste declarado e compras feitas pelas APIs reais.
- [x] Diagnosticar gargalo de circulação na fase `arriving` (7+ clientes presos em deslocamento para a fila).
- [x] Permitir desvio lateral com checagem de colisões também aos visitantes chegando, sem atravessar divisórias.
- [x] Reexecutar as mesmas 9 campanhas e comprovar mais atendimentos, maior ocupação e evolução do resultado operacional.
- [x] Adicionar limites de regressão para fila, ocupação e quantidade de atendimentos; registrar números antes/depois no relatório.
- [x] Validar trajetos com várias salas/divisórias e circulação em alta lotação por vídeo real: `scripts/capture_circulation.mjs`, incluído no worker de cena (14/10/2026).
- [x] Avaliar retorno de investimento do salão grande: auditoria 3/5/7 PCs mostrou custo elevado, retorno inicial limitado e capacidade ociosa; não alterar demanda artificialmente sem resolver circulação.
- [x] Comparar reputação VIP e preços durante dois anos completos de operação (1998–1999) e corrigir as curvas de procura/avaliação: ver `docs/VIP_PRICING_BALANCE_2026.md`. Ainda não declarar toda a economia balanceada.

## Fechamento do diagnóstico financeiro — 13/10/2026
- [x] Rejeitar ajuste de aumento artificial da procura após regressão na ocupação do salão grande; preservar balanceamento anterior.
- [x] Registrar minutos-PC usados e minutos-PC disponíveis por minuto de simulação, inclusive quando o jogador compra computadores no meio do mês.
- [x] Apresentar ocupação do mês corrente e do último mês na aba Finanças, sem estatísticas inventadas.
- [x] Fechar entradas, saídas e resultado mensal após o pagamento das contas; incluir multas e investimentos na explicação.
- [x] Mostrar recomendação cautelosa de expansão com base em ocupação medida e amostra mínima de três dias.
- [x] Manter dados novos opcionais em saves antigos e validar entradas inválidas.
- [ ] Avaliar políticas alternativas de retorno para sete PCs em sessões de vários anos, sem comprometer fila, satisfação nem velocidade de chegada.
- [ ] Revisar leitura dos novos indicadores no tamanho real do navegador antes da aprovação visual final.

## Circulação em salas divididas — 13/10/2026
- [x] Permitir desvio local entre clientes mesmo com paredes internas presentes, sem desligar a prevenção de colisões.
- [x] Validar cada subpasso (reto ou lateral) contra segmentos sólidos e limites da sala; atravessar apenas portas ou áreas livres.
- [x] Cobrir por testes: paredes horizontais/verticais, porta aberta, parede adjacente ainda fechada, NPC contornando outro longe da divisória e waypoint obsoleto tentando atravessar parede.
- [x] Confirmar regressão zero nos testes existentes de sala norte, porta, compra de PC no anexo, fila e campanhas econômicas.
- [x] Validar visualmente deslocamentos sob alta lotação com múltiplas divisórias/portas em capturas reais do jogo: inspeção desktop/mobile emulado e gravação contínua da aplicação real; detalhes em `docs/CIRCULATION_STRESS_VALIDATION.md`.

## Fechamento de circulação sob lotação — 14/10/2026
- [x] Bloquear travessia nas emendas/quinas, chegada sobre a parede e ajuste final de posição menor que 0,005 tile.
- [x] Compartilhar a checagem de segmentos sólidos com as rotas dos funcionários.
- [x] Preservar saída lateral do caixa quando suas duas pernas estão livres, mesmo com divisórias em outras salas.
- [x] Replanejar o caminho quando o desvio local deixa de avançar, contornando corpos e respeitando paredes/portas sem teletransportar visitantes.
- [x] Impedir novos clientes de nascerem sobre outro corpo na soleira compartilhada por entrada e saída.
- [x] Comparar a mesma fixture por seis horas em três sementes: antes, quatro pagamentos e nenhum uso de PC; depois, 15–17 atendimentos, quatro anexos usados e 20–25 saídas.
- [x] Executar 135 testes, auditoria estática e captura da aplicação real em Chromium sem erros de página ou overflow horizontal.
- [x] Gerar vídeo de gameplay via `requestAnimationFrame` da aplicação; gravação silenciosa, sem animar PNGs nem reposicionar atores durante a filmagem.
- [ ] Aprovação artística dos sprites e revisão de legibilidade em aparelho móvel físico continuam pendentes.

## Alocação de computadores por qualidade — 14/10/2026
- [x] Corrigir preferência cega por índice para **clientes VIP**: oferecer estação melhor quando o ganho de hardware superar o desvio necessário.
- [x] Preservar rigorosamente a seleção anterior do primeiro PC livre para **clientes comuns**, e também para VIPs quando não existe ganho de qualidade.
- [x] Avaliar somente estações acessíveis pelo sistema real de rotas, livres, sem falha e fora de manutenção; não cobrar nem alterar RNG durante a escolha.
- [x] Integrar a decisão ao atendimento real no balcão; hardware/GPU já adquiridos passam a influenciar qual PC o VIP utiliza, sem alterar chance de chegada, preço ou sessão.
- [x] Cobrir a política com testes de upgrade, GPU, VIP, empate de qualidade, reserva, desgaste, reparo, pagamento único, determinismo e importação de save.
- [x] Reexecutar nove campanhas de 45 dias (3, 5 e 7 PCs; três sementes). **Atendimentos e margem permaneceram idênticos à referência da main anterior**: 940,67 / 1.326,67 / 1.372,67 atendimentos médios e R$ 9.062,33 / R$ 13.422 / R$ 14.178,33 de margem operacional por cenário.
- [ ] Medir o impacto dessa preferência em campanhas reais com upgrades instalados em índices altos e clientes VIP ao longo de vários anos; resultados idênticos na fixture atual não provam retorno extra do investimento.
- [ ] Validar em vídeo o uso do PC melhorado com o público VIP, sem substituir personagens ou artes já aprovadas.

## Identidade visual própria — Terminal de bairro (14/10/2026)
- [x] Criar paleta, tipografia, marca CRT, favicon, bordas, estados de interação e família de 41 ícones SVG locais.
- [x] Integrar menu inicial com o salão real dentro de um monitor CRT autoral; separar a prévia da simulação e do save do jogador.
- [x] Reformular HUD, calendário, clima, diário do salão, dicas e ferramentas de construção com indicadores verdadeiros.
- [x] Unificar sete abas administrativas, cartões de manutenção, preços, estoque, licenças, GPUs, finanças e divulgação.
- [x] Integrar catálogo ilustrado por ícones próprios e cartas com aparência de correspondência de bairro.
- [x] Harmonizar piso, paredes, base da sala e letreiro com a paleta da interface, preservando câmera, âncoras e os personagens existentes.
- [x] Incluir contraste legível, opções de movimento reduzido, foco nas janelas, Escape, navegação por setas nas abas e retorno ao salão sem pausar ao fechar um painel.
- [x] Validar clique em filhos SVG de ações dinâmicas: estoque, técnico, compra/posicionamento e leitura de cartas; conferir exportação/importação da partida.
- [x] Inspecionar 11 telas em desktop e dois tamanhos móveis emulados (1440, 414 e 360 px), com filmagem contínua da interface integrada.
- [x] Preservar as melhorias recentes de personagens e alocação VIP; executar 146 testes da versão conjunta, além da auditoria e das verificações do navegador.
- [ ] Avaliar a identidade com o criador e conferir toque/legibilidade em aparelho móvel físico; esta integração não promove sprites finais de personagens.

## Auditoria de reputação VIP e política de preços — 14/10/2026
- [x] Reputação positiva desacelera acima de 80 pontos, com teto de serviço sustentável de 98 para preço justo; avaliações negativas não são amortecidas.
- [x] Cliente VIP avalia se o preço/hora é compatível com a qualidade do PC, além de fila, rede e desgaste; nenhum bônus de receita ou visita é fabricado.
- [x] Preservar curva de demanda existente até R$ 18/h e introduzir resistência progressiva para preços maiores (sem criar preços negativos nem demanda artificial).
- [x] Penalizar avaliações por tarifas muito acima do razoável, independentemente da redução de visitantes; hardware ainda fornece o benefício previsto.
- [x] Simular 720 dias por cenário, sem alterar receita à mão, com licenças, filtros, reposição, manutenção e faxina comprados pelas APIs do jogo.
- [x] Validar, em cada fechamento mensal, caixa = capital inicial + receitas − despesas; registrar trimestralmente reputação, atendimentos, perdas e caixa.
- [x] Comparar R$ 12/h e R$ 26/h com mesma semente, registrando números finais e observações em `docs/VIP_PRICING_BALANCE_2026.md`.
- [ ] Ampliar auditoria de preços intermediários (R$ 18, 20, 22, 24/h), custo-benefício do hardware e períodos históricos posteriores a 2000; um único confronto de extremos não encerra todo o balanceamento.
- [ ] Conferir visualmente VIP em uma estação premium e revisar legibilidade na tela de aparelho móvel físico.
