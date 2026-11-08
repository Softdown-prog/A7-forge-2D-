# Refatoração gráfica do salão — Canvas 2D procedural

Revisão geral da apresentação do Lan House Simulator, mantendo o contrato do
jogo: câmera 2:1 fixa, sem telhado nem exterior, simulação determinística que o
desenho apenas lê. Nenhuma posição, rota, âncora, footprint, colisão, preço,
RNG ou formato de save foi alterado. Toda a arte continua procedural, sem
imagens, fontes externas, WebGL ou dependências novas.

![Antes e depois no zoom 160% em tela DPR 2](../../../docs/quality/lhs_graphics_before_after.png)

Capturas reais do Canvas em Chromium (as janelas diferem porque o “antes” foi
tirado às 17:30 simuladas, quando o código antigo ainda pintava vidro azul fixo).

## 1. Resolução nativa do dispositivo (HiDPI)

Antes, o Canvas tinha um bitmap fixo de 1000×610 esticado por CSS. Em telas
retina, no zoom do visor (até 3×) e em tela cheia, posters, textos e
personagens apareciam borrados.

- `src/render/sceneSurface.ts` define as **unidades lógicas** (`SCENE_WIDTH`,
  `SCENE_HEIGHT`) e calcula a escala do backing store a partir da largura CSS ×
  `devicePixelRatio`, quantizada em décimos (1000×610 unidades sempre caem em
  pixels inteiros), nunca abaixo de 1×, limitada a 3× em ponteiros finos, 2× em
  toque e a 6 Mpx por superfície.
- `createGameScene` ajusta o bitmap do salão e da prévia do menu antes de cada
  pintura. O contexto recebe `setTransform(escala)`; **nenhum pintor conhece a
  escala**: todos continuam desenhando em 1000×610.
- Picking (`scenePicking.ts`, `layoutEditor.ts`) e os rótulos noturnos usam as
  unidades lógicas, não `canvas.width`. Raios de toque continuam medidos em
  pixels CSS.
- `src/render/rasterCache.ts` unifica os três caches de bitmap (PCs, balcão,
  máquinas/prateleira). O raster é chaveado pela arte, pela escala e pela fase
  subpixel da âncora **em pixels do dispositivo**, por isso o blit reproduz a
  rasterização ao vivo em qualquer escala. O fundo estático usa a mesma regra.
- `actorSprites.ts` passa a escala ao Worker; `actorSpriteWorker.ts` rasteriza
  os quadros com `zoom = escala` e devolve a escala junto com o bitmap. O
  orçamento de 16 MiB cresce com escala² (máximo 4×). Contextos com transformação
  que não seja uma escala uniforme caem no artista vetorial.

## 2. Fundo cacheado: piso, paredes, janelas

- Piso com variação determinística de ±3% por ladrilho (`cellNoise`), aresta
  iluminada no canto superior, manchas raras de uso, oclusão ambiente nas bases
  das paredes e gradiente de profundidade (fundo iluminado, borda frontal mais
  escura). Faces da laje com gradiente vertical.
- Paredes com gradiente (luz das luminárias no alto), sombra do canto interno,
  filete claro no topo, rodapé em duas faixas e cones de luz abaixo de cada
  luminária (`drawLampHalo`).
- Janelas: moldura, recesso e peitoril em duas faces ficam no fundo; o **vidro
  é dinâmico** (`windowPanes`), com montantes e reflexo repintados por frame.
- Vinheta radial e leve brilho diagonal no fundo abstrato; tapete com borda
  costurada; capacho de fibra junto à soleira.
- Divisórias internas recebem gradiente e rodapé.

## 3. Luz por hora do dia (`src/render/lighting.ts`)

`daylightAt(totalMinutes)` deriva do relógio da simulação (10:00–22:00):

| Fase | Horário | Efeito |
| --- | --- | --- |
| `day` | 10:00–16:30 | vidro azul-céu, feixes suaves sob as janelas |
| `golden` | 16:30–18:20 | vidro âmbar, lavagem quente translúcida |
| `dusk` | 18:20–19:40 | transição contínua (smoothstep) |
| `night` | 19:40–22:00 | vidro escuro refletindo as lâmpadas, tinta azulada translúcida, poças de luz mais fortes |

**Monitores acendem ao anoitecer.** A sala escurece como descrito acima e, na mesma curva `night`, a tela de cada monitor ligado vai ficando mais clara e ganha um halo em volta (`monitorEmission` e `drawMonitorEmission`). A luz usa a cor da atividade real da estação (terminal, jogo, vídeo, navegador) e é mais forte numa sessão ocupada do que numa área de trabalho ociosa; monitor desligado ou em manutenção não emite. O retângulo do vidro vem do mesmo mapeamento de plano que desenha cada monitor (`monitorScreenQuad`: CRT e as cinco gerações de LCD, e nenhuma luz quando o vidro está de costas para a câmera). É pintada na ordem de profundidade, logo depois do sprite do PC e antes de quem está sentado, então o cliente continua tapando a tela. De dia não acrescenta nada; o ambiente escuro não foi alterado.

![Monitores às 16:40, 17:50, 18:40 e 20:00](../../../docs/quality/lhs_monitor_night_series.png)

`drawSceneLighting` é pintado **depois dos objetos ordenados por profundidade e
antes** de marcadores, placa e HUD interno. Cada monitor ligado projeta um brilho
aditivo (`screenGlow`) sobre a mesa, com cor da atividade real da tela
(terminal, jogo, vídeo, LCD) e mais intenso à noite. Clima continua apenas no
HUD e na economia, conforme o contrato de visualização; o módulo não lê
`weather`, `Date.now` nem RNG.

## 4. Acabamentos

- Sombra de contato dos atores em gradiente radial (mesma elipse, mesmo
  ancoramento; sprites e vetor continuam idênticos).
- Pop-ups de pagamento com *pop-in* curto; balões de fala com cauda apontando
  para o cliente. Durações e filas inalteradas.
- Placa “LAN HOUSE” e contador de estações/clientes com cantos arredondados,
  sombra e bisel; textos e posições preservados.

## 5. Ciclo 2: personagens

![Personagens antes e depois (zoom 4×, três vistas)](../../../docs/quality/lhs_characters_before_after.png)

Cada coluna é uma vista de tela (frente parado, frente-esquerda andando, costas-direita andando); à esquerda o ciclo 1, à direita o ciclo 2. Todos os 13 tipos (casuais, três femininos, dono, fantasias, animais, funcionários e carteiro) usam o mesmo rig e mantêm âncoras, poses, hitbox e paletas.

- **Contornos seletivos** (`edgeFor`): a linha de cada forma é uma versão escura da cor que ela envolve, em vez de um azul-marinho único. Fantasias claras (coelho, rato) deixam de ter aro escuro pesado; sobreposições translúcidas mantêm o traço padrão. Memoizado, sem custo por quadro.
- **Rosto com volume e vida:** pele em degradê radial com luz no alto à esquerda; olhos com esclera, íris por tipo, pupila, brilho fixo e linha de pálpebra (animais mantêm a conta preta brilhante); bochechas discretas nos personagens de rosto natural.
- **Cabelo:** reflexo claro na coroa, sempre dentro da silhueta, em casuais, dono, femininos e nas vistas de costas. A sombra da nuca segue a cor do cabelo e é mais leve em cabelo claro (some a meia-lua cinza do coelho e o anel azul das costas).
- **Forma:** luz de forma no tronco (peito claro, parte inferior direita sombreada), duas dobras de tecido na cintura, fivela, sombra de núcleo no lado oposto à luz em braços e pernas, punhos sombreados e reflexo no bico dos sapatos.
- **Sem custo novo no cache:** nenhum quadro depende do tempo de parede ou de aleatoriedade, então o Worker continua reaproveitando os mesmos quadros por pose, direção e fase (32 por ciclo). Piscar foi deliberadamente deixado de fora pelo mesmo motivo.

Verificação: `tests/actor-art-polish.test.mjs` (contornos, 13 tipos × 10 poses × 9 vistas sem erro e com coordenadas finitas, determinismo das chamadas, sem imagens ou aleatoriedade, olhos de pessoas vs. animais, paleta/identidade/hitbox inalterados) e `scripts/verify_actor_sprites.mjs`: erro médio máximo contra o artista vetorial caiu de 11,1 para 9,9 (limite 14) e nenhum pixel opaco faltou.

### Ciclo 3: rostos de perfil, nuca e clientes distintos

![Personagens do ciclo 3, antes e depois (zoom 3×, quatro vistas)](../../../docs/quality/lhs_characters_cycle3_before_after.png)

À esquerda o ciclo 2, à direita o ciclo 3: cada personagem em frente, perfil andando, costas andando e perfil parado.

- **Perfil de verdade:** o nariz deixou de ser um triângulo solto e passou a ser uma curva que nasce do contorno do rosto (traço aberto, narina e brilho no dorso). A boca fica dentro do queixo em vez de sobressair como uma barra escura. A orelha foi para trás do olho, com a concha desenhada. O palhaço ganha o nariz vermelho de perfil, rato e coelho um focinho rosado, o vampiro uma presa e o monstro pontos de costura na testa.
- **Nuca com cabelo:** de costas, a cabeça traz redemoinho na coroa e fios em volta, com tom ajustado ao cabelo (mais suave em cabelo claro), e as duas orelhas aparecem nas laterais. Cabelos longos, coelho, rato e palhaço mantêm a nuca anterior.
- **Quatro clientes distintos:** os clientes regulares dividem quatro paletas por `id % 4`. Cada paleta agora tem seu próprio cabelo e detalhe de roupa: 0 franja base, 1 cabelo espetado e bolso com caneta, 2 franja lateral e listras no peito, 3 cabelo cacheado e cordões de capuz (com costura de capuz nas costas). A variação usa o mesmo índice das paletas, portanto os quadros do cache de sprites continuam válidos para todo `id` que cai na mesma paleta, e as demais fantasias não variam por `id`.
- **Mãos:** polegar recolhido e dois vincos de dedos sobre a palma, em todas as poses.
- **Correção pós-merge (vista diagonal):** ao andar, o cliente aparece de três quartos. O olho distante tinha só 0,85 unidade de largura e, com esclera, íris e pupila, virava uma bolinha escura ao lado do olho próximo, que mostrava a íris azul. Agora o olho distante tem 1,2 de largura (mais estreito que o próximo, por causa do ângulo, mas com esclera e íris visíveis). Coelho e rato continuam com olho de conta preta por desenho. Teste: em `front-left` e `front-right` as duas íris têm largura mínima de 1 unidade e proporção parecida.
- **Sem custo novo:** nada depende do relógio de parede nem de aleatoriedade; âncoras, poses, hitbox e paletas ficam iguais. Os testes novos cobrem a repetição a cada quatro `id`, a ausência de variação nas outras fantasias, as orelhas de costas e o nariz curvo. `verify_actor_sprites`: erro médio máximo de 9,9 contra o artista vetorial (limite 14) e nenhum pixel opaco faltando.

### Balcão do Tony: computador, impressora, copiadora e balcão

![Balcão do Tony, antes e depois, nas quatro orientações, parado e em uso](../../../docs/quality/lhs_counter_equipment_before_after.png)

![Balcão na cena real, antes e depois (tela de densidade 2)](../../../docs/quality/lhs_counter_scene_before_after.png)

Só arte procedural; o espaço do balcão (1,75 × 0,72), a posição de cada equipamento, a hitbox, a rota do Tony e os preços não mudaram.

- **Balcão:** portas da frente com relevo (luz em cima, sombra embaixo), placa de latão chanfrada com o "CAIXA" gravado, puxadores de latão, rodapé escuro e sombra do tampo sobre as portas, recortada no contorno do painel. As laterais e a traseira ganharam gradiente, moldura e a mesma sombra. O tampo tem brilho de verniz e desgaste na borda onde o cliente apoia as mãos.
- **Computador do caixa:** pad de couro sob o teclado, teclado com fileiras e barra de espaço, mouse com fio, base e sombra de contato. O CRT tem moldura, vidro com linhas de varredura e reflexo diagonal, LED de energia, ventilação lateral e traseira com o selo e a porta de cabo. A tela mostra uma barra de título e linhas de terminal.
- **Registradora e acessórios:** visor com brilho, rolo de papel, bloco de pedidos com caneta, sino de balcão de latão, porta-canetas com três canetas e um cartão de preços (menor que o da primeira versão, para não cobrir o monitor).
- **Impressora:** carcaça em duas tonalidades sobre uma base escura, tampa do scanner com vidro e reflexo, puxador, bandeja de papel traseira com folhas, bandeja de saída com folhas impressas, painel com visor verde e botões, ventilação e sombra de contato. Em uso, a folha sai pela fenda, o LED pisca em âmbar e uma linha de luz percorre o vidro do scanner.
- **Copiadora de discos:** torre com base, visor com barra de progresso, quatro gavetas com botão de ejetar e LED, grelha de entrada de ar, ventilação lateral, ventoinha na traseira e, no topo, um pino com pilha de discos. Em uso, a gaveta sai com um disco desenhado no plano (brilho de arco-íris, aro e furo central). O disco anterior era uma elipse com anel e miolo escuro, que parecia um olho.
- **Cache:** impressora e copiadora passaram a usar o mesmo cache de raster do balcão (corpo estático em bitmap; LED, folha, barra, gaveta e disco ao vivo). A comparação cache contra desenho direto, em 128 combinações (escala 1 e 2, quatro zooms, quatro rotações, parado e em uso, duas posições), não tem nenhum pixel com diferença forte (acima de 48); impressora e copiadora ficam praticamente idênticas (até 16 pixels). As diferenças pequenas ficam na sombra em gradiente sob o tampo, onde o navegador dispersa o gradiente conforme a posição em pixels. O cache da torre e o da impressora reservam 160 unidades para cada lado, porque a medição mostrou que a torre chega a 140 unidades em rotação de 90°.
- **Verificação:** `tests/counter-equipment-art.test.mjs` (coordenadas finitas em todas as rotações, zooms e estados, determinismo, o quadro "em uso" pinta formas a mais sobre o mesmo corpo, impressora e copiadora cabem no próprio raster, sem imagens, aleatoriedade, relógio de parede, modos de mistura ou desfoque) e `scripts/verify_counter_equipment.mjs`.
- **Fora desta rodada:** as ilustrações da loja (`drawPrinterShop` e `drawDiscCopier`) continuam como estavam.

## 6. Desempenho

Medido em Chromium headless **sem aceleração por GPU** (pior caso: toda a composição é por software), cena de teste com dono, um cliente sentado e um andando às 17:30 simuladas, ms por quadro de `SceneRenderer.draw`:

| Versão | 1× | 1,1× (tela 1440 px, DPR 1) | 2× (retina) |
| --- | ---: | ---: | ---: |
| Antes do refator (só existe em 1×; em outras escalas o código antigo não usava cache) | 2,2 | n/a | n/a |
| Primeira versão desta refatoração | 6,2 | 6,0 | 15 |
| Atual | 3,8 | 4,9 | 9,5 |

A primeira versão custava muito por dois motivos, medidos por decomposição (desligando cada peça):

- **Modos de mistura sobre o quadro inteiro** (`lighter`, `multiply`, `soft-light`) a cada frame: cerca de 2,3 ms em 1× e 7 ms em 2×. Trocar de modo de mistura força o navegador a esvaziar o lote de desenho. A luz localizada (feixes e poças) agora é renderizada numa camada em cache, por hora quantizada em 24 passos, e composta com mistura normal; as lavagens de cor são `source-over`. Limitar a lavagem ao retângulo do salão foi tentado e descartado: tingia o fundo dentro do retângulo e deixava uma caixa visível à noite, sem ganho mensurável.
- **`shadowBlur` na placa e no contador** repintados todo quadro, contra uma convenção já registrada no projeto (aquário RGB: "sem shadowBlur, custo baixo no Android"). Trocado por sombras em camadas translúcidas.

O custo em 1× continua cerca de 1,6 ms acima do original (janelas dinâmicas, brilho dos monitores, capacho, gradientes) e cresce com a área em pixels. Em navegadores com canvas acelerado por GPU a diferença tende a ser bem menor, mas isso **não foi medido em aparelho físico**. Os limites de escala (3×, 2× em toque, 6 Mpx), o cache do fundo e dos móveis e o teto de 30 desenhos/s em toque seguem valendo. `tests/scene-lighting.test.mjs` impede a volta de modos de mistura e `shadowBlur` nesse caminho.

### Auditoria de desempenho em celular emulado (novembro de 2026)

Medição do jogo real em Chromium headless (sem GPU) com **perfil de toque, CPU 4 vezes mais lenta**, cenário de capacidade com 14 clientes (o limite de produção). É emulação: **não substitui aparelho físico**, e a máquina varia entre lotes, então só se comparam códigos medidos no mesmo lote, intercalados.

**O que a medição mostrou**

- Todas as mudanças em `src/` desde `c8930cf` (antes da refatoração) são desta série de PRs, então a diferença é atribuível a ela. O desenho médio por quadro subiu de 6,3 ms para 10 a 12 ms no benchmark de 7 s de `benchmark_capacity.mjs`; o salto grande foi o primeiro PR (6,3 para 10,4 ms) e os seguintes somaram pouco cada.
- Esse benchmark exagera, porque mede os primeiros 7 s, durante o aquecimento do cache de sprites (o Worker rasteriza quadros mais detalhados, então os primeiros sprites chegam depois de uns 4 s em vez de 1 s, e nesse intervalo os atores caem no desenhista vetorial). **Em regime estável** (16 s de aquecimento) o jogo desenha os mesmos 30 quadros por segundo nos dois códigos, e a diferença é de folga de CPU: **40,6% ociosa antes, 27,9% depois dos seis PRs**.
- Em regime estável os clientes acertam o cache de sprites em 97% das chamadas. **O único ator desenhado em vetor a cada quadro era o Tony** (1,3 a 1,45 ms por quadro no cenário emulado, cerca de 30% do desenho). O custo restante do desenho aparece como trabalho nativo de rasterização do navegador ("(program)"), porque as operações de Canvas 2D são gravadas e rasterizadas depois; por isso cronometrar métodos em JavaScript subestima o custo de gradientes e traços, e o medidor confiável é a folga de CPU ou a cadência de quadros.
- Contagem de operações por quadro (regime estável): traços 113 para 186, preenchimentos 54 para 96, `save` 31 para 67. Os gradientes radiais por quadro eram 9 (e já caíram para 3).

**O que foi feito** (só desenho; simulação, save e RNG intocados)

1. **Tony em repouso vem do cache de sprites.** `actorSpriteEligible` (função pura, testada) libera o dono apenas na pose `idle`, sem fantasia cyber, sem reação e sem fone. Imprimindo, copiando e recebendo o carteiro continuam no desenhista contínuo, porque têm gestos rápidos. Para o ciclo de 32 quadros fechar exatamente, a respiração e o gesto leve de atendimento passaram a usar a mesma frequência (`OWNER_IDLE_RATE`, 1,4 rad/s; o gesto era 1,6 rad/s, com amplitude de 0,45 pixel).
2. **Janelas em cache de raster.** O vidro só muda a cada minuto simulado; `paintWindowPanes` é rasterizado uma vez por estado de luz e zoom (família `window-panes`).
3. **Brilho dos monitores com textura de gradiente em cache.** Cada par (cor, opacidade em passos de 1/64) é renderizado uma vez numa textura de 64 px e escalado na cena (`glowEllipse`).

**Resultado** (mesmo lote, intercalado, 3 rodadas, folga de CPU em regime estável): antes da refatoração 40,6%, depois dos seis PRs 27,9%, com estas três mudanças **38,7%**. A imagem da cena inteira (quatro horários, escalas 1 e 2) difere do código anterior em no máximo 4 de 255 por canal nas janelas e nos brilhos; com o Tony em sprite, 37 a 210 pixels (menos de 0,01%) chegam a 26 a 48 de diferença na borda suavizada, dentro da tolerância do `verify_actor_sprites` (agora com o Tony: 336 casos, erro médio máximo 9,9 de 14, nenhum pixel opaco faltando).

**O que não foi resolvido**

- **Aquecimento do cache de sprites** continua mais lento que antes (os primeiros sprites levam uns 4 s com CPU 4 vezes mais lenta). Caminhos possíveis: pré-aquecer os quadros mais comuns em tempo ocioso ao abrir o jogo e priorizar os atores visíveis na fila do Worker (hoje limitada a 64 pedidos).
- **Tony com a fantasia cyber** (e enquanto imprime ou copia) continua em vetor.
- **Trabalho nativo de rasterização** ainda é maior que antes (traços e preenchimentos por quadro); o próximo ganho grande exigiria simplificar o desenho vetorial dos atores que ainda não vêm do cache ou reduzir o detalhe por zoom.
- Nada disso foi medido em aparelho físico.

## 7. Verificação

```sh
npm test                                     # inclui scene-surface, scene-lighting e actor-art-polish
npm run typecheck
node scripts/verify_rendering.mjs out/perf   # fundo cacheado = pintura direta (0 px)
node scripts/verify_actor_sprites.mjs        # sprites = artista vetorial
node scripts/capture_scene.mjs out/validation
```

Comparações executadas nesta revisão em Chromium headless: fundo cacheado vs.
direto com zero pixels alterados em 1× e em 2,2×; caches de balcão, máquinas e
prateleira exatos em 2,2×; cache dos PCs com no máximo 24 pixels de diferença
(delta ≤ 8), igual ao comportamento anterior em 1×; 288 combinações de sprites
dentro do limite do script. As capturas são de arte procedural em revisão, não
de assets aprovados.

## 8. Limites conhecidos

- Em aparelhos com `devicePixelRatio` 3 e zoom alto do visor o bitmap pode ser
  reduzido pelos limites acima; a imagem continua mais nítida que 1×.
- Navegadores sem `OffscreenCanvas`/Worker usam o artista vetorial dos
  personagens em qualquer escala.
- A luz não reage a clima, eventos ou cosméticos; isso é decisão de contrato,
  não limitação técnica.
- Os scripts de captura e verificação (`capture_scene.mjs`, `verify_mobile_furniture.mjs`) convertem
  coordenadas pelas unidades lógicas 1000×610, não por `canvas.width`.
