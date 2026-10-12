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
