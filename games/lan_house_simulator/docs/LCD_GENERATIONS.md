# Da era CRT aos LCDs — 14/10/2026

A campanha preserva as gerações CRT de 1998, 2000 e 2003 e acrescenta cinco kits de estação. Modelos e datas são parte da progressão fictícia do jogo; o calendário continua com 360 dias de 720 minutos abertos por ano.

| Ano | Kit | Visual | Custo integral | Bônus sobre CRT |
| --- | --- | --- | ---: | ---: |
| 2005 | Bairro LCD 17 | LCD 4:3 prateado, pedestal largo, gabinete de transição | R$ 580 | 2 p.p. |
| 2008 | Panorama 19 | Widescreen preto, base retangular, leitor de DVD | R$ 880 | 3 p.p. |
| 2012 | Horizonte LED 22 | Tela LED fina, base circular, gabinete ventilado | R$ 1.280 | 4,5 p.p. |
| 2017 | Estúdio IPS 24 | Bordas reduzidas, pedestal metálico, conjunto grafite | R$ 1.780 | 6 p.p. |
| 2024 | Arena 27 | Tela ampla, pé em V, dois ventiladores e luzes discretas | R$ 2.480 | 8 p.p. |

## Instalação e economia

Em **Administrar → Computadores → Da era CRT aos LCDs**, escolher a estação e o kit. O catálogo mostra os cinco desenhos de produção, ano, preço, requisito, estado instalado e ganho incremental de satisfação. Gerações futuras permanecem bloqueadas até o ano correspondente.

A estação precisa completar hardware nível 3 e estar livre de clientes/reservas e de reparo em andamento. A compra debita caixa e despesas somente após todas as verificações, custa o valor integral e não credita revenda. É possível saltar gerações já disponíveis; repetir uma compra ou regredir é rejeitado. O restante do salão mantém seus modelos. PCs comprados para novos lugares começam como CRT e podem ser renovados depois.

Os kits ficam em `pcLcdModels`, separados dos níveis de hardware e das GPUs. A instalação preserva a placa, Windows/licença, desgaste, posição, teclado/mãos e assento. Não repara uma máquina quebrada. Além do bônus modesto, reduz a parcela de consumo ocioso por estação em 0,00012–0,00028 unidades de custo por minuto, antes da tarifa anual. O cálculo original de CPU, GPU e carga em uso permanece; tarifa horária e procura não mudam automaticamente. Esses valores iniciais não demonstram amortização em campanhas longas.

## Renderização e persistência

Cada kit tem geometria de monitor, pedestal, carcaça, tela, materiais de gabinete e periféricos próprios. O primeiro painel é 4:3; os seguintes são widescreen. O desenho distingue disponível, ocupado, sem rede e manutenção, com atividade discreta a 1,7 Hz.

O identificador do kit faz parte da chave do cache de sprites de produção, mantendo o limite de 64 entradas por contexto e o desenho direto para opacidade parcial. Ilustrações do catálogo são geradas uma única vez por modelo pelo mesmo renderer e reutilizadas nas atualizações da interface. Nenhum bitmap é salvo na partida.

Partidas sem o novo campo continuam mostrando CRTs. Saves novos exportam/importam os kits e rejeitam IDs/estrutura inválidos. A inserção de um PC original antes dos anexos desloca corretamente o modelo da estação já existente; novos anexos recebem CRT.

## Verificação

```sh
npm test
npm run audit
node scripts/capture_lcd_generations.mjs out/lcd
node scripts/capture_computer_art.mjs out/lcd/crt
```

188 testes ativos passaram; o teste anual extenso permanece opcional. Nove regressões novas exercitam os oito degraus pelos anos, compras atômicas, preservação de upgrades/desgaste, bloqueios, energia, saves e reindexação de anexos. Cada kit também foi usado em um dia de simulação, verificando atendimento real e conservação de caixa.

A revisão em Chromium compara cache/desenho direto em **240 combinações** de cinco LCDs, três zooms, quatro estados, dois tempos e duas opacidades, com câmera e posições fracionárias. Observou no máximo 171 canais com diferença acima de arredondamento entre 960.000 canais, delta máximo 31 e média inferior a 0,003 por canal. Diferenças isoladas de antialias são limitadas; a opacidade parcial exige igualdade exata. Os cinco modelos produzem imagens distintas e não alteram o estado ao desenhar.

Compras reais por controles/SVG e retomada após recarregar passaram em larguras 1440, 414 e 360, sem overflow. Em 2005, somente o primeiro kit fica disponível. As imagens de comparação são ilustrações Canvas feitas pelas funções de produção, e não substituem a revisão em telefone físico ou uma auditoria longa de retorno do investimento.
