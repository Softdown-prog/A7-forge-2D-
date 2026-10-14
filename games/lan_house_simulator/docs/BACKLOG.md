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
- [x] Auditar R$ 18, 20, 22 e 24/h em 1998 e em 2009 com cinco PCs básicos e atualizados; 11 campanhas de 180 dias e resultados em `docs/PRICING_MIDRANGE_AUDIT_2026.md`. Isto não encerra o balanceamento multi-semente.
- [ ] Conferir visualmente VIP em uma estação premium e revisar legibilidade na tela de aparelho móvel físico.

## Precificação transparente — painel Terminal de Bairro (14/10/2026)
- [x] Exibir na aba Preços a procura relativa real da curva do motor em comparação com R$ 12/h, sob as mesmas condições de reputação, clima e conexão.
- [x] Informar a avaliação aproximada da sessão em PC básico sem espera/falha e destacar a resistência a sobrepreços acima de R$ 18/h.
- [x] Evitar prometer receitas ou visitantes; indicador puro, sem mutação de saves, RNG, ocupação ou contabilidade.
- [x] Validar os botões de subir/descer preço e a atualização dos indicadores no navegador Chromium de desktop e dispositivos móveis emulados.
- [x] Executar onze campanhas controladas de 180 dias em 1998 e 2009, comparando preços intermediários, reputação, margem, VIPs, ocupação, investimentos e upgrades.
- [x] Auditar 2011 e 2013 com três sementes e três preços, comparando PCs básicos e GPUs modernas durante 120 dias; medir também retorno após 360 dias em 2013 com R$ 24/h. Resultados em `docs/MODERN_HARDWARE_AUDIT_2026.md`. A tarifa ideal não está definida para toda campanha.
- [ ] Aprovar visualmente o painel em aparelho móvel físico; capturas e testes de emulação não substituem essa revisão.

## Fluidez e custo de apresentação — 14/10/2026
- [x] Medir RAF, tempo de desenho, movimento, DOM e CPU limitada; registrar método/resultados em `docs/RUNTIME_PERFORMANCE.md`.
- [x] Apresentar movimento/poses intermediárias de clientes, técnico e faxineiro, preservando relógio de quatro minutos/segundo, RNG, economia, saves e navegação.
- [x] Atualizar listas administrativas, cartas e catálogo quando visíveis; memoizar o diário e atualizar abas imediatamente ao abri-las.
- [x] Guardar fundo estático em cache invalidado por câmera, tamanho, expansão e pôsteres; comparar seis cenários com o desenho original no Chromium e no CI.
- [x] Cobrir apresentação, soleira, assentos, reset, remoção, paredes, funcionários e determinismo com sete testes; executar os 160 testes da versão conjunta.
- [ ] Medir em aparelho móvel físico e salões máximos antes de prometer 60 FPS em todos os casos.

## Volume dos personagens no Canvas 2D — 14/10/2026
- [x] Arredondar tronco, ombros e quadril; engrossar braços, pernas e mãos com iluminação de superfície.
- [x] Substituir a compressão horizontal dos perfis por silhueta própria e sobreposição do braço próximo.
- [x] Arredondar nuca e sombrear cabeça/queixo, preservando rostos, figurinos, altura e âncoras de chão/assento.
- [x] Integrar ao desenho real de clientes e dono; ajustar área de clique do dono e manter simulação/saves intactos.
- [x] Inspecionar 336 combinações de figurino, direção, pose e transição no Chromium; adicionar pranchas e verificação ao worker de cena.
- [ ] Aprovação artística com o criador e inspeção em aparelho móvel físico.

## Pacotes de horas e consumo combinado — 14/10/2026
- [x] Auditar nove cenários de tarifa/estoque/operação com sessões e vendas reais; confirmar pacotes de 30/45/60/90 e esgotamento do estoque sem reposição.
- [x] Corrigir saída após uma única compra: permitir uma bebida e um alimento quando necessidades, orçamento restante, estoque e rota permitem.
- [x] Aliviar a necessidade correspondente somente após venda confirmada; impedir repetição por grupo e preservar os marcadores no save.
- [x] Manter preço, pacote contratado, pagamentos, som, estoque e lixo associados a transações reais.
- [x] Executar 173 testes, incluindo cinco regressões novas de consumo, limite financeiro, substituição de alimentos, save e pacotes.
- [ ] Ampliar campanhas multissemente e rever margens de longo prazo após o consumo combinado; detalhes em `docs/CUSTOMER_SPENDING_AUDIT.md`.

## Ilustrações dos pôsteres de parede — 14/10/2026
- [x] Criar sete composições vetoriais originais com cenas, títulos, molduras e acabamento, incluindo os cinco temas de jogos anteriores.
- [x] Projetar a arte completa no plano da parede, com tipografia e sombra coerentes com a câmera isométrica.
- [x] Dar ilustrações aos pôsteres comprados e legados, preservando preços, slots, limites e composição durante a realocação.
- [x] Manter o cache do cenário e comparar seis casos com o desenho direto; delta de pixels zero.
- [x] Executar 173 testes e auditoria; gerar pranchas e validar compra, mudança de posição e expansão no Chromium/CI.
- [ ] Aprovação artística do criador e inspeção dos textos em telefone físico; detalhes em `docs/POSTER_ART.md`.

## Refinamento dos computadores e estações — 14/10/2026
- [x] Refinar CRT, gabinete, teclado, mouse, cabos, mesa e cadeira no Canvas, harmonizados com a identidade do salão.
- [x] Conservar níveis reais de hardware/GPU e representar rede, uso e manutenção conforme o estado do jogo.
- [x] Preservar âncoras de mesa, assento, teclado e mãos; manter reservas, rotas e saves intactos.
- [x] Reaproveitar sprites de equipamentos com limite de memória e atualização por estado, sem congelar personagens ou overlay das mãos.
- [x] Validar 144 combinações de zoom/hardware/estado/animação/opacidade e adicionar a inspeção ao worker de cena.
- [x] Executar 179 testes e auditoria; gerar comparação, pose sentada e capturas desktop/mobile emulado; detalhes em `docs/COMPUTER_ART.md`.
- [ ] Aprovação artística do criador e inspeção de toque/legibilidade em aparelho móvel físico.

## Retorno do hardware moderno em campanhas de longo prazo — 14/10/2026
- [x] Executar 36 campanhas de 120 dias em 2011 e 2013, com três sementes, R$ 18/22/24 por hora, cinco PCs e os mesmos contratos/rede em cada par.
- [x] Adquirir por APIs do jogo o hardware nível 3 e placas PixelForce 560/770 nos PCs 4 e 5; medir desgaste, serviços, estoque, energia, ocupação, receita, atendimentos, VIPs e reputação sem fabricar valores.
- [x] Confirmar que VIPs realmente priorizam PCs modernos na traseira; validar escolha determinística e importação de save.
- [x] Detectar que o investimento em GPUs recentes **não se paga em 120 dias** nas seis comparações médias de preço/ano testadas; preservar custos e procura enquanto os dados ainda são parciais.
- [x] Executar mais seis campanhas de 360 dias em 2013, R$ 24/h, e proteger por regressão o ganho real de atendimentos e resultado líquido nas três sementes.
- [x] Registrar diferença de horizonte: em 360 dias, resultado líquido médio **R$ 41.829 com** PCs modernos e **R$ 22.793 sem**, inclusive investimento inicial.
- [x] Auditar upgrade gradual de GPUs 2009→2011→2013 contra manter a placa antiga ou trocar diretamente em 2013, em 12 campanhas contínuas de 900 dias, com duas sementes e tarifas R$ 22/24; registrar em `docs/GPU_GENERATION_UPGRADES_2026.md`.
- [ ] Auditar separadamente inflação de custos, reajuste dinâmico de tarifas e alterações na virada de ano; não presumir que o cenário com preço fixo encerra esses itens.
- [ ] Validar salões físicos cheios, rotas com divisórias, rede lenta e experiência móvel real antes de declarar balanceamento definitivo.

## Renovação gradual de placas e partidas longas — 14/10/2026
- [x] Comparar com o motor real três estratégias de GPUs de 2009 em PCs 4 e 5: conservar até meados de 2013; comprar GPUs 2013 diretamente; ou trocar em 2011 e novamente em 2013.
- [x] Simular 900 dias contínuos por campanha, tarifas R$ 22 e R$ 24/h e sementes 23/137, usando as APIs normais de compras, desgaste, atendimento, estoque, mensalidades e limpeza.
- [x] Confirmar que a troca integral custa R$ 4.500 para duas GPUs 2013 e R$ 7.680 para a sequência 2011+2013; saves mantêm a placa atual e contabilização.
- [x] Registrar que, com GPUs 2009 já instaladas, os upgrades incrementais aumentam pouco a satisfação e não recuperam o investimento nas campanhas testadas; **não modificar custos, procura ou reputação artificialmente**.
- [x] Atualizar a aba Placas de vídeo com o valor integral, o bônus incremental de satisfação e a informação de que não há crédito pela placa substituída.
- [x] Corrigir crescimento não limitado dos efeitos visuais transitórios em execução headless/segundo plano e omitir essas filas de saves e exportações; preservar economia, GPUs e saves antigos.
- [x] Testar arquivo acima de 2 MB de efeitos temporários e importação compatível, bem como regressão do fluxo de compra de GPUs.
- [ ] Testar renovação em salões com sete ou mais PCs, campanhas com financiamento/valor de revenda (não existentes) e preços dinâmicos antes de definir política final de amortização.
- [ ] Fazer revisão visual humana do aviso de renovação em aparelhos móveis físicos.

## Leitura de tarifas e virada de ano — 14/10/2026
- [x] Comparar R$ −2/atual/+2 na aba Preços a partir da curva de demanda e da sessão de 45 min reais, sem alterar procura, RNG ou caixa.
- [x] Mostrar reajuste da energia na próxima virada preservando PCs, ocupação de referência e custos existentes; documentar teto após 25 anos.
- [x] Proteger limites de preço, cobrança no minuto da virada, controle manual e importação/exportação de saves com testes de regressão.
- [ ] Executar campanhas longas de reajuste dinâmico e cenários alternativos de inflação, cinco versus sete ou mais PCs, antes de ajustar o balanceamento definitivo.
- [ ] Conferir a legibilidade dos indicadores em telefone físico e inspeção humana.

## Auditoria de tarifas na virada de 2011 para 2012 — 14/10/2026
- [x] Executar 16 campanhas contínuas de 120 dias, duas sementes, cinco e sete PCs, mantendo R$ 18/22 fixos ou alternando entre eles na virada; usar somente APIs reais do motor.
- [x] Medir caixa, vendas combinadas de bebidas/alimentos, atendimento, ocupação, custos, reputação, despesas e validação de save; registrar em `docs/DYNAMIC_PRICING_YEAR_BRIDGE_2026.md`.
- [x] Observar resultado líquido médio maior com R$ 18 fixos nas configurações testadas: R$ 43.814,50 com cinco PCs e R$ 42.860,50 com sete; não tratar esses preços como equilíbrio universal.
- [x] Eliminar um falso negativo intermitente do worker de cena recalculando as coordenadas de clique depois da captura que pode rolar a viewport; preservar inspeção com mouse real no Chromium.
- [ ] Validar 360+ dias, rede/lotação elevadas e decisões mensais de tarifa; estudar inflação de custos além da eletricidade antes de alterar preços de equilíbrio.

## Auditoria anual de tarifas mensais e promoções pagas — 14/10/2026
- [x] Executar 16 campanhas completas de 360 dias, duas sementes, salões de cinco ou sete PCs e preços fixos R$ 8/12/18 versus reajuste mensal por ocupação passada, sem alterar o motor de jogo.
- [x] Incluir 24 campanhas publicitárias pagas por partida, gastos reais, reparo, reposição, 12 cobranças mensais, contagem de lotação e retomada de save no dia 180; os 180 testes do primeiro run passaram.
- [x] Confirmar R$ 18/h como líder **apenas nesse conjunto** de cenários: resultado líquido médio R$ 144.533,50 com cinco PCs e R$ 150.872,00 com sete PCs.
- [x] Identificar erro de política no controlador ingênuo por ocupação: reduziu preço de R$ 12 para R$ 8 a partir do terceiro mês, com queda do resultado líquido; não promover para gameplay.
- [x] Separar teste anual pesado de `npm test` para não atrasar toda compilação: `npm run audit:annual` ou `workflow_dispatch` manual.
- [ ] Validar mais sementes e condições de procura, e estimar amortização/desgaste de GPUs e salões com divisórias antes de retocar preços do jogo; revisar arte e indicadores em telefone físico.

## Cinco gerações de kits LCD — 14/10/2026
- [x] Preservar três CRTs e desenhar LCD 4:3, widescreen, LED, IPS e Arena com monitores, pedestais, gabinetes e periféricos próprios.
- [x] Liberar por ano (2005/2008/2012/2017/2024), comprar por estação após hardware 3, preservar GPU/licenças/desgaste e informar preço integral e benefício incremental.
- [x] Integrar bônus modesto e economia de energia, save antigo/novo, anexos/reindexação e cache de sprites; catálogo reutiliza ilustrações de produção.
- [x] Passar 188 testes ativos, auditoria estática e 240 comparações Canvas; comprar e recarregar em 1440/414/360 e conferir bloqueios de 2005.
- [x] Registrar catálogo, custos e limites em `docs/LCD_GENERATIONS.md`; adicionar verificação ao worker de cena.
- [ ] Auditar retorno dos kits em campanhas longas e conferir os novos modelos em telefone físico antes de revisar o balanceamento inicial.

## Retorno de hardware e GPUs em um salão completo — 14/10/2026
- [x] Comparar 16 campanhas reais de 360 dias em 2013: sementes 23/137, salões de cinco/sete PCs com PixelForce 260 pré-adquirida, e quatro caminhos (manter, upgrade de hardware nível 3, GPU 2013, ambos), a R$ 18/h.
- [x] Pagar integralmente as peças por API, fornecedores, licenças, internet, 24 promoções, estoques, técnicos, energia e 12 contas; comparar resultado líquido incremental contra manter os equipamentos originais e retomar save no dia 180.
- [x] Medir ganho líquido com somente CPU nível 3: **+R$ 6.760 (cinco PCs)** e **+R$ 4.685 (sete PCs)**, já descontando R$ 3.600 / R$ 5.040 investidos.
- [x] Verificar que trocar todas as GPUs 2009 por GPUs 2013 **não amortizou em 360 dias**: −R$ 9.277 (cinco PCs) e −R$ 15.853,50 (sete PCs) versus conservar.
- [x] Registrar matriz completa, ocupação e limites em `docs/ANNUAL_HARDWARE_PAYBACK_2026.md`; disponibilizar `npm run audit:hardware` / workflow manual, sem encarecer cada `npm test`.
- [ ] Estudar upgrade direcionado aos PCs de maior uso/VIPs, preços R$ 22/24, divisão física de salas e horizontes mais longos antes de balancear economia ou arte de hardware.

## Estratégias direcionadas para VIP e LCD — 14/10/2026
- [x] Executar 28 campanhas de 360 dias com duas sementes, cinco/sete PCs, tarifa R$ 22/h e sete estratégias: preservar GPU 2009, uma ou duas GPUs 2013 atrás, duas na frente, dois kits LCD 2012 atrás, LCD no salão completo ou GPU+LCD em dois PCs.
- [x] Usar CPUs nível 3 e GPUs 2009 integralmente pagas como controle; comprar upgrades com API real, salvar/importar no dia 180, pagar 24 promoções, estoque, equipe de serviço e 12 fechamentos mensais.
- [x] Observar que **nenhum cenário moderno supera o controle em resultado líquido médio** dessas sementes e período; uma GPU no fundo perde R$ 2.086/R$ 2.139,50 com 5/7 PCs, e dois LCDs no fundo perdem R$ 1.894,50/R$ 1.982,50.
- [x] Medir preferência VIP por estação: nos salões de cinco PCs, amostras de uso VIP nas posições 4/5 sobem de 39,5 para 364 quando se instalam duas GPUs modernas atrás, sem garantir amortização.
- [x] Documentar custos, ocupação e limitações em `docs/TARGETED_VIP_LCD_ROI_2026.md`; `npm run audit:targeted` e workflow manual. Preservar preços e lógica do jogo.
- [ ] Investigar pagamento por VIP/serviço premium, exposição de retorno por estação e campanhas com preços R$ 18/24 antes de implementar incentivos novos ou alterar a economia.

## Receita por estação preparada para configurações completas — 14/10/2026
- [x] Verificar o repositório principal: havia hardware genérico por nível, GPU e LCD, mas ainda não estavam publicados na main CPU, placa-mãe, RAM, fonte, HD e SSD individuais solicitados ao Codex; não duplicar esse trabalho.
- [x] Contabilizar sessões pagas, VIPs, minutos ocupados, receita por estação e a energia global rateada; mostrar na aba Computadores sem mudar os preços.
- [x] Proteger saves legados, compra de PC antes de anexos e separação de receita real versus saldo parcial; vendas de estoque e custos fixos não são indevidamente atribuídos aos PCs.
- [ ] Reavaliar catálogos completos e compatibilidade CPU/placa-mãe/RAM/fonte/HD/SSD/GPU quando o Codex publicar os commits, antes de um estudo de ROI por configuração.
- [ ] Evoluir para consumo por peça somente com modelo de potência real e custos verificados, sem tratar rateio como aferição elétrica.

## Configurações e peças geracionais por PC — 14/10/2026
- [x] Mostrar Windows/licença, CPU, RAM, armazenamento, placa-mãe, fonte, GPU e monitor de cada estação; início concreto com 350 MHz, 64 MB, HD 4 GB, Slot 1 e 350 W.
- [x] Adicionar 52 peças e oito kits entre 1998 e 2024, com compras individuais, migrações compatíveis de plataforma e bloqueio por ano, reserva, reparo, caixa e potência.
- [x] Preservar peças superiores compatíveis, GPU, Windows, monitor e desgaste; fonte representa capacidade e não gasto constante. Salões mistos continuam possíveis.
- [x] Adicionar Windows 7/8/10/11, requisitos visíveis, licença e instalação por PC; manter saves V1 e reindexação de anexos compatíveis.
- [x] Passar 207 testes ativos após integrar receita por estação da main, seis cenários Chromium desktop/mobile de compra/recarga e regressão dos cinco LCDs; documentar em `docs/HARDWARE_GENERATIONS.md`.
- [ ] Auditar amortização das peças nas campanhas longas e verificar ergonomia em telefone físico; estudar bibliotecas de jogos/requisitos por época antes de expandir a simulação.

## Economia histórica com preços máximos por ano — 14/10/2026
- [x] Usar salário mínimo nominal R$ 130 (1998) como referência histórica e IPCA anual do IBGE para índice monetário; teto nominal inicial R$ 3/h é parâmetro de balanceamento, NÃO preço histórico regulamentado.
- [x] Adicionar modelo econômico histórico para partidas novas: teto anual por IPCA e teto adicional pela idade de CPU, GPU, RAM, placa-mãe, HD/SSD, LCD e Windows; R$ 18/h com Windows 98 em 2010 deixa de ser possível nesse modelo.
- [x] Tornar contas fixas, energia e atacado indexados no modelo novo; reajustar defaults de mercadorias e cobrar sessão com centavos, sem inflação duplicada sobre catálogos de componentes geracionais.
- [x] Oferecer tabela para sessões 30/45/60/90/120/180/240 min, preservar valores proporcionais e impedir contratação além do expediente no modo histórico.
- [x] Preservar saves clássicos e oferecer migração explícita, sem alterar patrimônio já ganho; virada cobra custos do último ano no fechamento.
- [ ] Rodar campanhas históricas de longo prazo (1998–2024), revisar liquidez e demanda, custos de aquisição de hardware completo, modelagem do varejo e reajustes após 2025 antes de declarar o balanceamento final.

## Máquinas e prateleira de salgadinhos — 14/10/2026
- [x] Refinar gabinetes, portas, vidro, latas, doces, controles e bandejas de retirada com perspectiva e profundidade; redesenhar o expositor metálico com pacotes CROC e letreiro integrado.
- [x] Refletir vendas, estoque vazio e reposição nas vitrines; reutilizar sprites em cache sem modificar estado, RNG, rotas ou economia.
- [x] Verificar 147 casos Canvas, compras dos três produtos em dois dias simulados e encaixe desktop/mobile; registrar `docs/RETAIL_ART.md` e automatizar no worker de cena.

## Contrato de infraestrutura online e Cookies — 14/10/2026

- [x] Registrar a decisão de produto: **LHS — Lan House Simulator**, moeda premium **Cookies (biscoitos)**, jogo integralmente gratuito, sem assinatura obrigatória ou venda da campanha.
- [x] Contratar em documentação as fronteiras Cloudflare (frontend e jogo local), Cloud Run Node.js (API e pagamentos), Firebase Authentication (login), Firestore (contas, carteira, ledger e compras) e GCS (JSON de saves manuais).
- [ ] Implementar identidade opcional e guardar saves locais/importação existentes, sem perder partidas antigas.
- [ ] Criar carregamento de JSON por UID, salvamento em nuvem **somente por clique**, backup limitado, validação de versão e controle de sobrescritas concorrentes.
- [ ] Implementar carteira de Cookies no Firestore, permissões premium, compras atômicas, idempotência e conciliação de estorno.
- [ ] Integrar provedor de checkout em sandbox com webhook verificado; nunca confiar em retorno do navegador ou em saldo contido no save.
- [ ] Criar catálogo de itens premium opcionais sem bloquear jogabilidade gratuita e validar UI desktop/mobile, custos, segurança e LGPD antes de produzir.
- [ ] Publicar somente depois de aprovação explícita, seguindo o processo de CH-site/Cloudflare.

Documento normativo: [ONLINE_COOKIES_CLOUD_CONTRACT.md](ONLINE_COOKIES_CLOUD_CONTRACT.md). Nenhum serviço foi provisionado com esta anotação.

## Site próprio do Lan House Simulator — 14/10/2026
- [x] Criar home, jogar, sobre o jogo, sobre nós, ajuda, contato, termos, privacidade, dados locais e 404 com a identidade Terminal de Bairro.
- [x] Reutilizar marca e ícones, incluir imagem real otimizada do salão, evolução por época, navegação móvel, hover, foco visível e movimento reduzido; carregar o jogo completo sob demanda.
- [x] Pesquisar fontes oficiais de LGPD, ANPD, CDC e provedores; refletir saves locais e recursos existentes, sem cadastro, pagamentos ou analytics fictícios.
- [x] Incluir exclusão seletiva com confirmação, validação de 337 referências locais e cinco testes de dados/configuração; automatizar build e verificação no worker de cena.
- [ ] Preencher responsável, contato privado, domínio e detalhes reais de hospedagem antes de lançar publicamente; revisar visual e interação em aparelhos físicos e políticas quando adicionar novos serviços.

## Diagnóstico real de rentabilidade histórica — 14/10/2026
- [x] Executar 16 campanhas de 120 dias em 1998, 2005, 2012 e 2024 com duas sementes, três PCs, kits reais CPU/RAM/placa-mãe/armazenamento/fonte/GPU/LCD/Windows e preços máximos permitidos; medir investimento, margem operacional, despesas, ocupação e save no dia 60.
- [x] Isolar causa do prejuízo de 1998: serviços clássicos de R$ 55 por faxina e ~R$ 73 por técnico eram excessivos para a hora histórica R$ 2,50–3,00; categorizar despesas por fontes no teste sem inventar clientes.
- [x] Reajustar serviços *somente no modo histórico* com referências de game design em 1998 (faxina R$ 12; reparo R$ 4 + R$ 0,16 por desgaste) e inflação anual pelo IPCA; preservar integralmente a economia clássica.
- [x] Reexecutar mesmo conjunto de campanhas: resultado médio de 1998 passa de −R$ 4.199,64 para **+R$ 2.141,47** com hora R$ 2,50; com teto R$ 3 passa de −R$ 3.180,23 para **+R$ 3.036,44**; sem alterar chegada de clientes ou receitas.
- [x] Simular também duas partidas reais desde R$ 850, pagando três Windows, jogos, programador, fornecedor, energia, estoque e manutenção; caixa final de **R$ 2.916,96/R$ 2.980,97** em quatro meses, sem aporte.
- [x] Corrigir alteração manual de varejo histórico para não aplicar preços clássicos aos outros produtos; introduzir `npm run audit:historical`, workflow manual e `docs/HISTORICAL_AUDIT_2026.md`.
- [ ] Auditar 360–720 dias, mudança de ano, expansão com 5/7 PCs, financiamento e compras de peças individuais; as plataformas 2012/2024 ainda não se pagam em apenas 120 dias.

## Teste de expansão paga em 1998–2000 — 14/10/2026
- [x] Rodar seis campanhas determinísticas de 390 dias iniciadas com **R$ 850**, duas sementes e planos de manter três computadores, chegar a cinco ou chegar a sete, comprando expansões e computadores apenas com o dinheiro do jogo.
- [x] Preservar serviços, licenças Windows, fornecedor, estoque, contas, saves e índices dos PCs, com conferência contábil a cada 30 dias, save aos 180/365 dias e virada de 1998 para 1999.
- [x] Medir incremento líquido médio contra três PCs: **−R$ 560,80 para cinco** e **−R$ 3.514,57 para sete** em 390 dias, apesar do aumento de visitantes; nenhuma dessas expansões venceu a base sob a tarifa fixa e as duas sementes usadas.
- [x] Validar também uma campanha de **750 dias** com três PCs, salvamento até 2000 e inflação em duas viradas de ano; final líquido **+R$ 19.003,75** na semente 23.
- [x] Automatizar a auditoria pesada fora do teste cotidiano com `npm run audit:growth` e workflow manual; relatar hipóteses, custos e limitações em `docs/HISTORICAL_GROWTH_AUDIT_2026.md`.
- [ ] Testar decisões mensais de preço, anúncios pagos, perfis de demanda maiores, divisão física do salão e atualização individual das peças antes de aplicar sugestão automática de expansão.
