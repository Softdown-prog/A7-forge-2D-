# Computadores e estações — 14/10/2026

O desenho de produção em `src/render/retroComputer.ts` passa a usar CRTs com carcaça traseira afunilada, bordas arredondadas, ventilação, base e vidro com profundidade. Os gabinetes têm leitores, botão/LED e grelhas; as três paletas seguem o nível real do hardware. Uma marca colorida acompanha a GPU realmente instalada.

O conjunto inclui mesa com tampo fino, quatro pés, gaveteiro e faixa de borda; teclado com teclas e barra de espaço; mouse, mousepad e cabos. A cadeira ganha estofamento com espessura, encosto curvo, apoios e cinco rodízios. A etiqueta física da mesa usa o índice real do PC.

## Encaixe e estados

O tampo permanece a 34 unidades de altura, o assento a 25; as posições do teclado, da cadeira e das mãos são conservadas. O overlay dos braços acompanha o volume dos personagens já integrado. Geometria de circulação, posição das estações, reservas, preços e saves não mudam.

As telas/LEDs distinguem estação disponível, em uso, sem rede e em manutenção. O sinal de manutenção consulta `pcBroken`, incluindo o técnico em serviço, em vez de inventar uma falha visual. Atividade em sessão conserva uma animação discreta de 1,7 Hz. As cenas de estudo exibem todos os níveis; o jogador continua comprando hardware nos anos e preços já definidos pelo motor.

## Cache e custo

Um cache por contexto Canvas guarda até 64 sprites recentes de estações. A chave inclui índice, zoom, fase subpixel da posição, hardware, GPU, ocupação, rede/manutenção e atividade da tela. Mudar esses dados invalida a imagem correspondente; o desenho usa a câmera real e uma translação inteira para manter a posição no grid de pixels. Os sprites não ficam no save. Fora do navegador ou numa prévia semitransparente, o desenho direto continua disponível.

Isso permite detalhar os equipamentos sem repetir todas as formas e teclas em cada frame. O cenário continua com seu cache independente de piso e paredes; os clientes e braços continuam animados separadamente.

## Verificações

```sh
npm test
npm run audit
node scripts/capture_computer_art.mjs out/computers
node scripts/verify_rendering.mjs out/computers
node scripts/capture_scene.mjs out/computers/scene
node scripts/profile_runtime.mjs out/computers/performance current
```

179 testes e a auditoria passaram. `capture_computer_art.mjs` usa as funções de produção e pode receber um `retroComputer.js` compilado anterior para comparar antes/depois. A prancha inclui três níveis, cliente sentado e estados de rede/manutenção. A inspeção do cache cobre **144 combinações** de três zooms, três níveis, quatro estados, duas fases de animação e duas opacidades, incluindo posições fracionárias; verifica que o desenho não altera o estado.

A comparação das estações permite somente diferenças isoladas de antialias nas bordas: observou delta máximo de canal 18, no máximo 82 canais diferentes acima do arredondamento e média inferior a 0,003 por canal na superfície de 600 × 400. Recortes, sprites desatualizados ou mudanças amplas de cor excedem os limites da verificação. As prévias com opacidade 0,4 mantêm delta zero porque usam o desenho direto. A comparação do cache de fundo continua independente.

O worker de cena executa a prancha/verificação e as capturas do jogo em desktop/mobile emulado. A aprovação artística e a conferência em telefone físico permanecem como revisão humana.

## Medição local

Mesma fixture de circulação, 12 segundos por caso, comparando apenas o módulo de computadores anterior e o refinado no mesmo ambiente. Os números são um perfil local, não a capacidade de um telefone físico.

| Medida | Anterior | Refinado |
| --- | ---: | ---: |
| FPS desktop | 59,3 | 59,9 |
| Desenho médio desktop | 2,36 ms | 1,54 ms |
| FPS com CPU limitada em 4× | 19,9 | 23,9 |
| Desenho médio com CPU limitada | 10,57 ms | 8,76 ms |
| Intervalo de frame P95 com CPU limitada | 83,3 ms | 66,6 ms |

O caso limitado apresentou aproximadamente 20% mais frames com a arte detalhada e o cache, embora permaneça abaixo de 60 FPS. Carga da máquina, navegador, número de atores e tamanho do salão influenciam o resultado; comparações de sessões antigas feitas em outro ambiente não são equivalentes.
