# Tarifas e ocupação: auditoria de 360 dias (outubro de 2026)

## Questão e alcance

Reexaminar o achado das campanhas de 120 dias antes de modificar o balanceamento:
vale cobrar barato para trazer clientes? A expansão de cinco para sete PCs
se paga num ano? Um gestor que ajusta preço por ocupação mensal ganha mais?

**16 campanhas pareadas:** sementes 23 e 137 × cinco e sete computadores ×
tarifa fixa de R$ 8, R$ 12 ou R$ 18 por hora, ou política mensal começando em
R$ 12. Início: primeiro dia de 2011; final: primeiro dia de 2012.
Um ano equivale a 12 meses de 30 dias ou 259.200 minutos simulados por
campanha. São 4.147.200 minutos simulados no conjunto.

## Operações iguais e contabilidade

Capital de teste R$ 40.000 para todas as partidas. Cada cenário adquire por
APIs comuns: jogos licenciados, filtro de conteúdo, contrato de fornecedor,
internet nível 3, salão ampliado, cinco ou sete PCs instalados e suas licenças
Windows 98. Reposição de refrigerantes/doces/salgadinhos quando estoques caem,
técnico para desgaste acima de 75% com PC livre e limpeza das lixeiras acima
de 75%. Cada 15 dias há panfletagem **paga**: 24 promoções no ano. Os
atendimentos, sessões de 30/45/60/90 minutos, compras de bebida e alimento,
reputação, chuva, falhas da internet, despesas e consumo energético são os
do próprio motor. Nenhum cliente ou recebimento é inserido no estado.

**Resultado líquido** é o caixa final menos os R$ 40.000 iniciais, já
deduzindo instalação, estoque, manutenção, promoções e contas mensais.
O teste protege caixa = capital + receita acumulada − despesas acumuladas,
12 fechamentos de mês, ocupação real minutos-PC/capacidade, tarifa anual de
energia de 3% e importação do save aos 180 dias.

O controlador mensal experimental só lê **a ocupação de PCs no mês já
fechado**, sem acesso a eventos futuros: se ≥55%, sobe R$ 2; se abaixo de
38%, reduz R$ 2; caso contrário mantém. Limites R$ 8 e R$ 18.
**Não é funcionalidade automática adicionada ao jogo.**

## Resultados: média de duas sementes

| Política | Resultado líquido · 5 PCs | Resultado líquido · 7 PCs | Ocupação · 5 PCs | Ocupação · 7 PCs |
| --- | ---: | ---: | ---: | ---: |
| Fixo R$ 8/h | R$ 66.449,00 | R$ 61.062,50 | 36,2% | 27,75% |
| Fixo R$ 12/h | R$ 95.548,00 | R$ 100.902,50 | 34,95% | 28,35% |
| **Fixo R$ 18/h** | **R$ 144.533,50** | **R$ 150.872,00** | 33,85% | 26,35% |
| Mensal por ocupação | R$ 68.208,50 | R$ 66.151,00 | 35,45% | 27,55% |

### Fluxo de clientes e lotação

| Política | Atendidos · 5 PCs | Atendidos · 7 PCs | Clientes perdidos · 5 PCs | Clientes perdidos · 7 PCs |
| --- | ---: | ---: | ---: | ---: |
| Fixo R$ 8/h | 10.318,5 | 10.865,5 | 1.301 | 294 |
| Fixo R$ 12/h | 9.895 | 11.133 | 997 | 217,5 |
| Fixo R$ 18/h | 9.563 | 10.386,5 | 526 | 92 |
| Mensal por ocupação | 10.072,5 | 10.845 | 1.258,5 | 318 |

A demanda de R$ 8/h gerou mais atendimentos que R$ 18/h com cinco PCs,
mas as sessões mais baratas não maximizaram o resultado líquido.
O salário de propaganda e as despesas foram iguais na política de compra,
mas a operação efetiva e sua receita naturalmente variaram.

A ocupação **média** não mostra todo pico: em seis amostras por dia
(2.160 amostras/campanha), o cenário R$ 8 com cinco PCs estava com todos
ocupados em 44 amostras médias, versus cinco amostras com sete PCs. No
cenário R$ 18, 24,5 versus 0,5. Assim, a expansão reduz os picos de
saturação, ainda que a ocupação global fique baixa.

Com R$ 18/h, sete PCs superaram cinco por **R$ 6.338,50 em média**
ao fim de um ano, incluindo as compras extras. Em R$ 8/h a expansão
reduziu o resultado líquido por R$ 5.386,50. Logo, o retorno da expansão
depende de tarifa, horizonte e procura real.

**Falha do controlador ingênuo:** em ambas as sementes e tamanhos o preço
foi R$ 12 no primeiro mês, R$ 10 no segundo e **R$ 8 do terceiro até o
décimo segundo mês**. Uma política que enxerga apenas percentual de
ocupação pode destruir margem sem elevar suficientemente o movimento.
Não integrar essa política ao jogo.

## Por que estes números não contradizem automaticamente o teste de 120 dias?

O teste anterior começou **no fim de 2011** e atravessou 2012, com tarifas
R$ 18/22 e sem esse cronograma periódico de panfletagem. O presente
experimento ocupa **todo o ano de 2011**, com tarifas R$ 8/12/18, operação
contínua maior e 24 promoções pagas. O resultado de sete PCs mais
rentáveis em R$ 18 após 360 dias não implica que eles sejam rentáveis
em 120 dias, nem que a diferença decorra exclusivamente da passagem
do tempo; as estratégias comerciais não são idênticas.

## Como repetir

Executar em `games/lan_house_simulator`:

```sh
npm install
npm run audit:annual
```

O comando compila e roda os 16 cenários, emitindo
`ANNUAL_PRICE_CAMPAIGN` (por semente) e
`ANNUAL_PRICE_SUMMARY` (médias). Para preservar velocidade nas
alterações cotidianas, `npm test` executa as demais regressões e
**pula somente a auditoria anual**. Ela roda integralmente via
`npm run audit:annual` ou ao executar manualmente o workflow
`Lan House Simulator - worker pool` com `workflow_dispatch`.

Primeira execução completa (antes dessa separação):
[GitHub Actions 38548246707](https://github.com/Softdown-prog/A7-forge-2D-/actions/runs/38548246707):
180 testes passaram, 0 falharam (aprox. 319 segundos para a suíte).
Os três workers de simulação, arte e Chromium passaram.

## Próximas decisões (não implementadas)

Mais sementes e janelas móveis de 360 dias para distinguir efeito do
preço, expansão e tempo. Comparar rede lenta, divisórias, custos de
hardware modernizado e promoções com/sem campanha para medir sua
contribuição incremental. Os custos fixos não têm inflação automática
além da energia; qualquer implementação exigiria um contrato e
testes próprios. Revisão visual humana em smartphone permanece aberta.

**Não alteramos** preços de tabela, demanda, satisfação, cobrança,
estoque, clientes, save nem economia do runtime.
