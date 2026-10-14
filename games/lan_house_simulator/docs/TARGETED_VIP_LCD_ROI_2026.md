# GPUs direcionadas a VIPs e retorno dos kits LCD — auditoria de 2013

Data: 14/10/2026 · Lan House Simulator ·
teste: `tests/targeted-vip-lcd-roi.test.mjs`

## Decisão em estudo

Modernizar **uma ou duas estações**, colocadas à frente ou ao fundo da
lan house, pode oferecer aos VIPs um computador melhor e compensar a
compra mais cedo que reformar todas as estações? Como os kits LCD
`Horizonte LED 22`, lançados em 2012 no calendário fictício do jogo,
se comparam às GPUs de 2013?

Os resultados são do **motor existente**, sem demanda artificial,
cashback, crédito de revenda ou multiplicadores externos.

## Experimento e regras

**28 campanhas completas de 360 dias**, combinando duas sementes
(`23`, `137`), dois salões (cinco e sete computadores) e sete
estratégias. Todas começam no primeiro dia de **2013** e terminam no
primeiro dia de **2014**, com tarifa fixa de **R$ 22/h** e caixa inicial
de **R$ 65.000**. Contabilizam 12 fechamentos mensais.

Antes da decisão de modernização, todos os computadores recebem, por
APIs normais, hardware nível 3, licença Windows 98 e GPU PixelForce 260
(geração 2009). Também são contratados catálogo licenciado, filtro de
conteúdo, fornecedor, internet nível 3, novas posições e expansão. Essas
compras **integrais** são contabilizadas igualmente em todas as
estratégias do mesmo porte.

Durante cada campanha são feitas **24 panfletagens pagas**, reposição
por estoque real, limpeza e manutenção de PCs livres conforme desgaste.
O relógio avança minuto a minuto, processando cliente, sessão,
fila, preferência VIP, compras de bebidas e alimentos, variações
climáticas, falhas da rede e consumo energético. Aos 180 dias o
teste exporta/importa o save e confere GPUs, LCDs, caixa, receita,
despesas e o relógio. Todos os meses verificam conservação de caixa.

**Resultado líquido = caixa final − capital inicial R$ 65.000.**
Para cada estratégia é apresentado também o *diferencial contra manter
a infraestrutura atual*, já descontando o valor do upgrade.
Valores são **médias de duas sementes**, não garantias para o jogador.

## Estratégias e custos adicionais

| Estratégia | PCs alterados | Cinco PCs | Sete PCs |
|---|---|---:|---:|
| Manter | Nenhum | R$ 0 | R$ 0 |
| Uma GPU 2013 no fundo | PC 4 | R$ 2.250 | R$ 2.250 |
| Duas GPUs 2013 no fundo | PCs 4 e 5 | R$ 4.500 | R$ 4.500 |
| Duas GPUs 2013 na frente | PCs 1 e 2 | R$ 4.500 | R$ 4.500 |
| Dois kits LCD 2012 no fundo | PCs 4 e 5 | R$ 2.560 | R$ 2.560 |
| LCD em toda a loja | Todos | R$ 6.400 | R$ 8.960 |
| GPU 2013 e LCD 2012 no fundo | PCs 4 e 5 | R$ 7.060 | R$ 7.060 |

Os LCDs custam R$ 1.280 por estação e exigem CPU nível 3,
já paga no controle. As novas GPUs custam R$ 2.250 cada e
**substituem as GPUs 2009 sem abatimento**.

## Resultado líquido médio em 360 dias

| Estratégia | Cinco PCs | Diferença vs. manter | Sete PCs | Diferença vs. manter |
|---|---:|---:|---:|---:|
| **Manter** | **R$ 87.693** | — | **R$ 79.020** | — |
| Uma GPU no fundo | R$ 85.607 | −R$ 2.086 | R$ 76.880,50 | −R$ 2.139,50 |
| Duas GPUs no fundo | R$ 83.339 | −R$ 4.354 | R$ 74.576 | −R$ 4.444 |
| Duas GPUs na frente | R$ 82.863,50 | −R$ 4.829,50 | R$ 74.192,50 | −R$ 4.827,50 |
| Dois LCDs no fundo | R$ 85.798,50 | −R$ 1.894,50 | R$ 77.037,50 | −R$ 1.982,50 |
| LCD em todos os PCs | R$ 81.776,50 | −R$ 5.916,50 | R$ 70.739,50 | −R$ 8.280,50 |
| GPU e LCD no fundo | R$ 80.973,50 | −R$ 6.719,50 | R$ 72.210,50 | −R$ 6.809,50 |

Nenhuma das seis modernizações superou a estratégia de manter as
máquinas existentes **na média** das duas sementes nesta tarifa,
ano e operação. Uma semente individual de sete PCs obteve
`+R$ 239` com uma GPU no fundo, enquanto a outra obteve
`−R$ 4.518`: a média foi negativa. Isso evidencia a variância,
mesmo num cenário reproduzível.

Em R$ 22/h, a ocupação do controle foi **19,18% com cinco PCs**
e **13,79% com sete**. A capacidade ociosa limita o retorno
de melhorias cuja vantagem depende de atrair e atender pessoas
em computadores específicos.

## A preferência VIP funciona — e é distinta da amortização

O teste coleta seis *amostras de usuários ativos por dia*, contadas
apenas quando um cliente VIP está realmente no estágio `using`.
Uma mesma pessoa pode aparecer em mais de uma amostra;
**não são visitas únicas nem vendas feitas por VIP**.

| Cinco PCs, estratégia | Amostras VIP em PCs 4 e 5 |
|---|---:|
| Manter as GPUs de 2009 | 39,5 |
| Uma GPU nova no PC 4 | 261 |
| Duas GPUs novas nos PCs 4 e 5 | **364** |
| Duas GPUs novas nos PCs 1 e 2 | 39,5 |
| Dois LCDs nos PCs 4 e 5 | **364** |

Em sete PCs, o controle teve 35,5 amostras VIP nas posições 4/5,
contra **337,5** com duas GPUs modernas no fundo e **337,5**
com dois LCDs. A seleção do VIP direciona a procura para as
máquinas melhores, mas isso não cria, por si só, uma tarifa
VIP adicional nem cobre o custo de compra.

Com duas GPUs, colocá-las no fundo foi **R$ 475,50 melhor** que
colocá-las na frente (cinco PCs) e **R$ 383,50 melhor**
(sete PCs). Ambas as posições foram piores que não atualizar.

## Relação com o estudo anterior

A [auditoria de hardware de 2013](ANNUAL_HARDWARE_PAYBACK_2026.md)
teve tarifa R$ 18/h. Encontrou ganho líquido com **CPU tier 3**
comparada ao nível 1 e prejuízo ao modernizar todas as GPUs.
Aqui, **todos já começam com CPU tier 3** e a tarifa é R$ 22/h.
Portanto, diferenças de ocupação, faturamento e modernização entre
os dois relatórios **não devem ser atribuídas apenas ao preço**
sem estudo pareado adicional.

A economia de energia e o bônus de satisfação dos LCDs são reais
nas fórmulas, mas não bastaram para recuperar a compra completa
do salão nesses 360 dias. Isto **não** condena as futuras gerações
LCD ou um horizonte superior a um ano.

## Limitações

- Somente **duas sementes, 2013, preço R$ 22/h, CPUs nível 3**,
  GPUs 2009 pagas, sete políticas fixas e 24 promoções.
- `vipOnTargetSamples` registra ocupação, não compra premium,
  receita por cliente VIP nem tempo acumulado de cada estação.
- Não há sistema de **tarifa especial VIP**, financiamento, revenda,
  valor residual ou incentivo publicitário dirigido. Não simular
  esses sistemas como se já existissem.
- PCs com LCD não tiveram upgrade de GPU em todos os cenários;
  a combinação foi testada apenas em PCs 4 e 5.
- Ausência de divisórias internas complexas, rede lenta e avaliações
  humanas em celulares físicos; as verificações Chromium são
  necessárias, não suficientes para aprovação artística.
- Mudanças nos custos ou na preferência VIP podem alterar estes
  resultados; não recomendar reajustar preços com base em duas
  sementes.

## Como executar

```sh
cd games/lan_house_simulator
npm install
npm run audit:targeted
```

O teste emite `TARGETED_HARDWARE_CAMPAIGN` por semente e
`TARGETED_HARDWARE_SUMMARY` com as médias por porte e estratégia.
O workflow manual **Lan House - targeted GPU and LCD ROI**
também executa a auditoria. A suíte cotidiana `npm test`
roda a proteção curta de compra, economia e save, mas não simula
as 28 campanhas a cada alteração.

A execução original:
[GitHub Actions 38555994070](https://github.com/Softdown-prog/A7-forge-2D-/actions/runs/38555994070).
O worker dedicado concluiu com **dois testes aprovados,
nenhum falhado** (o segundo testa os 28 cenários),
sem alterar a lógica de jogo.

**Próxima investigação:** uma tabela opcional de receita por
estação e visitante VIP (observabilidade, sem mudança de regra),
campanhas de R$ 18/24 e evolução do custo dos LCDs em 2017/2024,
antes de rever preços e priorização.
