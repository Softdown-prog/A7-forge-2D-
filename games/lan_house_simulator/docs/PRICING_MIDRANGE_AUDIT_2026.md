# Auditoria de preços intermediários e computadores modernos

Data: 14/10/2026 · Jogo: Lan House Simulator · código: `tests/pricing-campaign.test.mjs`

## Método

Foram executados **11 cenários de 180 dias**, sempre com semente determinística **1933**, caixa inicial **R$ 16.000** e nenhuma receita artificial durante as campanhas. O cenário de 1998 usa três PCs; o de 2009 utiliza cinco PCs com duas ampliações de estações, conexão melhorada e licenças adquiridas. Para 2009, foram comparados estabelecimentos com e sem upgrades de três PCs e duas placas PixelForce 260. **A conexão é igual nos dois grupos de 2009**, permitindo comparar as máquinas.

Durante a campanha, o motor real executou sessões, contas mensais, vendas, reposição de estoque, chamados de reparo, faxina e desgaste. O teste verificou o fechamento do caixa a cada 30 dias, `caixa final = capital inicial + receitas - despesas`, além de limites de lotação e reputação.

A medida **resultado líquido** abaixo já inclui as despesas de implantação, hardware e operação, mas não subtrai novamente o capital inicial: `caixa final - R$ 16.000`. A medida **resultado operacional** subtrai despesas da campanha, exceto as despesas de implantação. Todos os números são valores de jogo, não preços ou lucro reais.

## 1998: três PCs básicos, 180 dias

| Tarifa | Atendidos | Reputação final | Resultado líquido |
| --- | ---: | ---: | ---: |
| R$ 12/h | 3.786 | 80,51 | R$ 33.069 |
| R$ 18/h | 3.392 | 80,03 | R$ 46.782 |
| R$ 20/h | 2.711 | 66,55 | R$ 40.560 |
| R$ 22/h | 2.033 | 70,55 | R$ 33.519 |
| R$ 24/h | 991 | 37,86 | R$ 14.626 |

Nesta execução, **R$ 18/h** teve a maior margem líquida entre as cinco tarifas testadas. Isso não constitui um preço universal: sementes, filas, qualidade e decisões do jogador mudam o resultado.

## 2009: cinco PCs, com e sem hardware melhorado, 180 dias

| Tarifa | PCs | Atendidos | Reputação | Investimento inicial | Resultado líquido |
| --- | --- | ---: | ---: | ---: | ---: |
| R$ 18/h | Básicos | 4.734 | 93,05 | R$ 3.590 | R$ 62.488 |
| R$ 18/h | Atualizados | 4.727 | 95,46 | R$ 6.610 | R$ 61.940 |
| R$ 22/h | Básicos | 2.476 | 91,96 | R$ 3.590 | R$ 36.650 |
| R$ 22/h | Atualizados | 2.578 | 96,90 | R$ 6.610 | R$ 37.194 |
| R$ 24/h | Básicos | 1.177 | 53,03 | R$ 3.590 | R$ 13.483 |
| R$ 24/h | Atualizados | 1.673 | 96,03 | R$ 6.610 | R$ 21.559 |

O pacote de melhorias custa **R$ 3.020** adicionais na implantação. Em R$ 18/h, ainda não se paga em seis meses (diferença líquida de **−R$ 548**). Com R$ 22/h, a diferença líquida fica em **+R$ 544**. A R$ 24/h, em **+R$ 8.076**. Isso evidencia uma utilidade econômica dos upgrades: qualidade ajuda a sustentar tarifa mais alta, mas não garante retorno quando os preços já são competitivos.

## Interface integrada à identidade visual

A aba **Preços** do sistema *Terminal de Bairro* apresenta uma estimativa relativa de procura, obtida diretamente de `demandFactor` para o preço selecionado e uma referência constante de R$ 12/h. Reputação, clima e conexão são mantidos constantes na comparação. A aba também mostra o sinal da avaliação de um cliente em PC básico sem esperar ou enfrentar falhas, conforme `customerSatisfactionDelta`.

O indicador **não** prevê dinheiro, número de visitantes ou o melhor preço — somente compara fatores da fórmula. Quando a estimativa arredondada fica abaixo de 1%, o painel diz **menos de 1%**, não zero. Os controles existentes atualizam a informação no navegador. Cores, tipografia e padrões visuais anteriores foram preservados.

## Pendências

- Ampliar múltiplas sementes para avaliar variabilidade e horizontes maiores.
- Repetir campanhas com hardware de 2011–2013 e decisões do jogador diferentes.
- Inspecionar o novo painel num telefone físico antes de aprovar a experiência visual móvel.
- Manter inspeção visual e econômica independentes, sem declarar todo o BACKLOG encerrado.
