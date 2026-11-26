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
A média arredonda para centavos depois da comparação.

| Tarifa por hora | Resultado médio com 3 PCs | Diferença com 5 PCs | Diferença com 7 PCs |
| --- | ---: | ---: | ---: |
| R$ 2,00 | R$ 7.134,89 | −R$ 651,79 | −R$ 3.573,07 |
| R$ 2,50 | R$ 10.200,94 | −R$ 69,41 | −R$ 2.457,02 |
| R$ 3,00 | R$ 12.917,46 | +R$ 1.247,50 | −R$ 898,15 |

Os planos chegaram a cinco e sete PCs nas duas sementes e em todas as
tarifas. A primeira expansão cobriu o investimento e os custos adicionais
a R$ 3,00/h no período medido. A segunda expansão aumentou o volume de
atendimento e encerrou abaixo da base de três PCs nas três tarifas.

Os logs adicionais `LHS_GROWTH_TARIFF_CAMPAIGN` e
`LHS_GROWTH_TARIFF_SUMMARY` registram os cenários de R$ 2,00 e R$ 3,00.
Os resultados de R$ 2,50 continuam nas linhas `LHS_GROWTH_CAMPAIGN` e
`LHS_GROWTH_SUMMARY`.

## Fechamentos do calendário até 2030

`npm run audit:timeline` exercita dezembro de cada ano, de 1998 a 2030,
em 33 amostras independentes com a configuração inicial de três PCs.
O motor roda o mês inteiro de cada amostra. A auditoria confere o caixa,
o limite da tarifa, o fechamento mensal nas 32 viradas e a importação do
save. Em 2030, verifica que tempo, saldo e RNG permanecem no último
minuto da campanha após novas tentativas de avanço.

A campanha contínua segue pendente. No cenário com reposição de
mercadorias, semente 23, três PCs originais e reajuste anual da tarifa de
referência de R$ 2,50 pelo índice do jogo, limitado pelo teto dos PCs, o
salão chegou ao limite de 14 clientes no fim de 2001. Entre os dias 1.380
e 1.470, o total permaneceu em 25.939 atendimentos, enquanto as contas
continuaram sendo cobradas. O rastreamento encontrou buscas repetidas de
rotas entre clientes. A causa da fila persistente ainda precisa ser
isolada em uma partida salva.

## Limitações e próximo passo

Esta não é uma previsão universal de retorno financeiro. A análise
tem somente duas sementes, tarifas mantidas fixas dentro de cada cenário,
nenhuma campanha publicitária paga, equipamento básico de 1998
e nenhuma atualização gradual de CPU, RAM, fonte, armazenamento,
placa-mãe, GPU ou Windows. A reserva de caixa é uma política
dos testes, não um comportamento obrigatório dos jogadores.

Antes de oferecer dicas automáticas ao jogador, testar preço mensal,
demanda reforçada por anúncios, períodos de 720+ dias também com
sete PCs e modernização de peças, além da influência de divisórias.
