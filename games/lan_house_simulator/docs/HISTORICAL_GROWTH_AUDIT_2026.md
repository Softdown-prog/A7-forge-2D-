# Crescimento histórico: três, cinco ou sete computadores

Lan House Simulator · 14 de outubro de 2026

## Pergunta do backlog

Um negócio iniciado em **1998 com apenas R$ 850** ganha mais dinheiro
ao ampliar de três para cinco ou sete PCs, ou ao preservar três
computadores e reinvestir só na operação?

O objetivo é **medir** o resultado, não pressupor que investir em
equipamento sempre significa lucro maior. A economia da partida é o
modo histórico com IPCA, sem conversão para o modo clássico.

## Regras e método

O ensaio reproduz seis campanhas determinísticas: sementes **23 e 137**,
três estratégias por semente, **390 dias contínuos**, atravessando o
ano de 1998 e o primeiro mês de 1999.

Cada campanha começa com o **caixa original de R$ 850**, três computadores
de 1998 e tarifa **fixa R$ 2,50/h** para garantir comparação pareada.
O sistema paga licenciamento de jogos, filtro de conteúdo, licenças
Windows por computador, contratos com o fornecedor, reposição do
estoque, técnicos, faxineiros, energia, internet, aluguel e manutenção
usando exclusivamente as APIs do jogo.

A primeira expansão é autorizada após 120 dias; a segunda, somente
após 240 dias. Compras só ocorrem quando o caixa comporta o gasto
e mantém uma **reserva planejada de R$ 550** para as novas aquisições.
A reserva de caixa é uma *regra da estratégia experimental*, não
um requisito que o jogo impõe aos jogadores.

Os custos extras de expansão e instalação são:
- **Cinco PCs:** R$ 650 de ampliação + 2 × R$ 320 = **R$ 1.290**.
- **Sete PCs:** R$ 650 + R$ 1.100 de ampliações + 4 × R$ 320 =
  **R$ 3.030**.

Essas somas **não** incluem licenças de Windows, reparos, custos de
energia e outros gastos decorrentes, que aparecem separadamente
nas despesas efetivas das campanhas. Não há créditos de revenda,
financiamento nem injeção de capital.

## Resultado após 390 dias

Média das duas sementes, em reais nominais do jogo:

| Estratégia | PCs instalados | Clientes atendidos | Resultado líquido | Diferença para três PCs |
|---|---:|---:|---:|---:|
| Manter salão | 3 | 7.561,5 | **+R$ 9.137,36** | — |
| Primeira expansão | 5 | 9.375,5 | **+R$ 8.576,56** | **−R$ 560,80** |
| Segunda expansão | 7 | 9.665,5 | **+R$ 5.622,78** | **−R$ 3.514,57** |

Todos os planos terminaram os 390 dias com saldo final positivo e
conseguiram comprar as novas estações previstas.

**Mais computadores atenderam mais visitantes**, mas o lucro
incremental não cobriu as compras e os gastos operacionais associados
neste período. Ao passar de cinco para sete PCs o aumento médio de
clientes foi bem menor que ao sair de três para cinco, um sinal
compatível com procura limitada.

Os menores saldos de caixa observados foram **R$ 80,00** (semente 23)
e **R$ 71,62** (semente 137). Ambos ocorreram na fase inicial,
antes das ampliações, e demonstram o risco de liquidez da abertura.

## Duas viradas de ano

Uma campanha separada com **três PCs**, na semente 23, percorreu
**750 dias**, cobrindo 1998, 1999 e o primeiro mês de 2000.
Registrou **14.508 clientes**, receita acumulada R$ 59.566,20,
despesa acumulada R$ 40.562,45 e ganho líquido **R$ 19.003,75**,
com caixa final **R$ 19.853,75**.

A auditoria conferiu o IPCA na virada anual, os valores máximos
permitidos, a tarifa fixa histórica, a contabilidade e a
compatibilidade de saves nos dias 180, 365 e 720.

O teto nominal permaneceu **R$ 3/h em 1998 e 1999** neste modelo
porque o IPCA de 1998 foi menor que o primeiro incremento permitido
de **R$ 0,25**; isso é resultado da regra de arredondamento por
quartos de real. Custos fixos, entretanto, subiram com o índice.

## Como reproduzir

```sh
cd games/lan_house_simulator
npm install
npm run audit:growth
```

A auditoria produz `LHS_GROWTH_CAMPAIGN` para cada política,
`LHS_GROWTH_SUMMARY` para as médias e
`LHS_GROWTH_TWO_YEARS` para a campanha de 750 dias.
O workflow **Lan House historical growth audit** pode ser
executado manualmente. A suíte cotidiana `npm test` roda um teste
curto de 30 dias e não executa as campanhas extensas.

Resultado completo: [GitHub Actions 38579209062](
https://github.com/Softdown-prog/A7-forge-2D-/actions/runs/38579209062).
Os **três testes** (incluindo seis campanhas e a de 750 dias)
passaram sem falhas.

## Comparação por tarifa — 26/11/2026

O comando `npm run audit:growth` também compara tarifas fixas de R$ 2,00,
R$ 2,50 e R$ 3,00 por hora. São 18 campanhas de 390 dias, mantendo o
caixa inicial, as duas sementes e as regras de expansão do estudo original.
Cada diferença compara a expansão com três PCs na mesma tarifa e semente.
A média arredonda para centavos depois da comparação. A tabela usa o
motor com a correção da rota de saída.

| Tarifa por hora | Resultado médio com 3 PCs | Diferença com 5 PCs | Diferença com 7 PCs |
| --- | ---: | ---: | ---: |
| R$ 2,00 | R$ 7.268,68 | −R$ 584,30 | −R$ 2.870,88 |
| R$ 2,50 | R$ 10.141,19 | +R$ 363,26 | −R$ 1.656,34 |
| R$ 3,00 | R$ 12.954,12 | +R$ 1.185,68 | −R$ 409,42 |

Os planos chegaram a cinco e sete PCs nas duas sementes e em todas as
tarifas. A primeira expansão cobriu o investimento e os custos adicionais
a R$ 2,50/h e R$ 3,00/h no período medido. A segunda expansão aumentou o volume de
atendimento e encerrou abaixo da base de três PCs nas três tarifas.

Os logs adicionais `LHS_GROWTH_TARIFF_CAMPAIGN` e
`LHS_GROWTH_TARIFF_SUMMARY` registram os cenários de R$ 2,00 e R$ 3,00.
Os resultados de R$ 2,50 continuam nas linhas `LHS_GROWTH_CAMPAIGN` e
`LHS_GROWTH_SUMMARY`.

## Segunda expansão comparada até o dia 750 — 27/11/2026

Oito campanhas partiram de R$ 850, com tarifa fixa de R$ 3/h e sementes
23 e 137. Dentro de cada semente, as partidas chegaram ao dia 240 com
cinco PCs e a mesma contabilidade. A partir do dia 241, cada par compara
manter cinco PCs com ampliar o salão e comprar mais dois. Cada tamanho
foi testado com e sem panfletagem semanal paga pelo caixa. Foram 22
panfletagens até o dia 390 e 73 até o dia 750 em cada salão do cenário
com divulgação.

As diferenças são médias das duas sementes, calculadas do dia 241 até
cada data, sempre comparando sete PCs com cinco na mesma frequência de
panfletagem. A ocupação usa minutos de sessão divididos pelos minutos
de capacidade instalada.

| Panfletagem | Dia | Ocupação com 5 PCs | Ocupação com 7 PCs | Clientes a mais | Receita a mais | Diferença líquida |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Sem | 390 | 37,60% | 31,79% | 887,0 | R$ 2.162,80 | −R$ 1.595,10 |
| Sem | 750 | 37,66% | 31,38% | 2.771,5 | R$ 6.702,31 | −R$ 1.294,68 |
| Semanal | 390 | 38,25% | 31,64% | 763,5 | R$ 1.827,15 | −R$ 1.850,19 |
| Semanal | 750 | 38,23% | 31,79% | 2.762,0 | R$ 6.606,38 | −R$ 1.320,38 |

Até o dia 750, sem panfletagem, sete PCs adicionaram R$ 2.944,00 de
aluguel, R$ 599,00 de manutenção fixa e R$ 1.132,50 de energia. As
diferenças vieram dos comprovantes mensais pagos. Internet e salários
tiveram a mesma cobrança nos dois tamanhos. Os demais gastos ficaram
R$ 1.581,49 acima e incluem licenças, reposição e reparos. Depois desses
custos, sobraram R$ 445,32 de ganho operacional adicional para recuperar
os R$ 1.740,00 pagos pela obra e pelos dois PCs.

A panfletagem semanal custou R$ 1.782,72 por salão até o dia 750 e reduziu
o resultado de ambos os tamanhos em relação às partidas sem campanha.
A expansão para sete PCs ficou atrás da opção de manter cinco nas duas
sementes, com e sem panfletagem. O aluguel foi a maior despesa adicional
nas duas políticas. A auditoria cobre máquinas iniciais e divulgação
semanal. Estratégias com outros equipamentos e períodos de divulgação
exigem novas comparações.

`npm run audit:growth` registra os pares e os comprovantes agregados em
`LHS_SECOND_EXPANSION`. Cada linha inclui a receita, o investimento, as
contas pagas, os demais gastos, os clientes e os minutos de sessão.

## Fechamentos do calendário até 2030

`npm run audit:timeline` exercita dezembro de cada ano, de 1998 a 2030,
em 33 amostras independentes com a configuração inicial de três PCs.
O motor roda o mês inteiro de cada amostra. A auditoria confere o caixa,
o limite da tarifa, o fechamento mensal nas 32 viradas e a importação do
save. Em 2030, verifica que tempo, saldo e RNG permanecem no último
minuto da campanha após novas tentativas de avanço.

A auditoria inicial da campanha contínua revelou uma fila persistente.
No cenário com reposição de
mercadorias, semente 23, três PCs originais e reajuste anual da tarifa de
referência de R$ 2,50 pelo índice do jogo, limitado pelo teto dos PCs, o
salão chegou ao limite de 14 clientes no fim de 2001. Entre os dias 1.380
e 1.470, o total permaneceu em 25.939 atendimentos, enquanto as contas
continuaram sendo cobradas.

O primeiro bloqueio reproduzível aparece no dia 656. Dois visitantes em
saída tentam alcançar o mesmo ponto do corredor. O atalho reservava o
intervalo da recuperação mesmo quando mantinha a rota atual. Com a
[correção da recuperação](adr/0006-stalled-exit-route-recovery.md),
os 14 clientes do save bloqueado de 2001 alcançaram a porta em 49
minutos de jogo. Ao avançar mais um dia, a partida registrou 26 novos
atendimentos. Uma nova execução com a mesma estratégia terminou 2001
com 30.867 atendimentos acumulados e 2002 com 38.640.

Essa partida corrigida avançou de 1998 até o minuto 8.553.599, o último
de 2030, com 262.093 atendimentos acumulados e R$ 392.793,61 em caixa.
O cenário usou os três PCs originais, reposição de mercadorias, reparos
e licenças pagos pelo caixa e reajuste anual da tarifa de referência
limitado pela qualidade do equipamento. Os saves foram exportados e
reimportados nas viradas. Após o encerramento, novas chamadas do motor
preservaram o estado final.

## Limitações e próximo passo

Esta não é uma previsão universal de retorno financeiro. A análise
tem somente duas sementes, tarifas mantidas fixas dentro de cada cenário,
nenhuma campanha publicitária paga, equipamento básico de 1998
e nenhuma atualização gradual de CPU, RAM, fonte, armazenamento,
placa-mãe, GPU ou Windows. A reserva de caixa é uma política
dos testes, não um comportamento obrigatório dos jogadores.

Antes de oferecer dicas automáticas ao jogador, testar preços ajustados
mensalmente, outras frequências de anúncios, modernização de peças e a
influência de divisórias. A comparação de cinco e sete PCs até o dia 750
cobre tarifa fixa e panfletagem semanal.
