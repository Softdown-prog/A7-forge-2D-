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
