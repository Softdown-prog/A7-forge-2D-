# Panfletagem e políticas de preço no modo histórico — 1998

Data: 14/10/2026 · Lan House Simulator · economia histórica V2

## Motivação

No modo clássico, panfletagem custa R$ 120 e a hora começa em R$ 12.
No modo histórico lançado no PR #14, a hora passa a R$ 2,50 em 1998,
mas a panfletagem permanecia R$ 120, ou **48 horas de faturamento bruto**.
Isso era uma incoerência interna dos preços, e não uma cotação real de
panfletagem de 1998.

O motor agora conserva **R$ 120** para saves clássicos; para partidas
históricas usa **R$ 24 em 1998**, atualizados por
`round(24 * priceIndex(gameYear) * 100)/100`. A base de R$ 24 é
hipótese de *game design*, não preço histórico comprovado.

A campanha continua oferecendo **multiplicador 1,4** na chance
de chegada de clientes apenas no dia em que é paga. Não foram
alterados RNG, clientes, pagamentos, filas, inventário, reputação,
demanda, horário nem quantidade de visitantes pré-criados.
A interface cota dinamicamente o custo e desabilita a compra
quando o jogador não tem dinheiro suficiente.

## Experimento de balanceamento

`npm run audit:promotions` usa exclusivamente APIs reais de
`createGame(seed,"historical")`, `stepGame(s,120)`,
`setHourlyPrice`, `launchPromotion`, `expandShop`,
`buyComputer`, `stockItem`, `licenseWindows`,
`licenseGames`, `contractSupplier`, `startRepair`
e `requestCleaning`. Sem criar clientes ou inserir dinheiro.

**18 campanhas, 180 dias, duas sementes 23/137**:

- Três PCs: manter R$ 2,50/h; manter R$ 3/h; reajustar
  mensalmente usando apenas resultados observados no mês anterior;
  as três políticas também foram testadas com tentativas de
  panfletagem a cada 30 dias.
- Cinco PCs: manter R$ 2,50/h, R$ 3/h ou reajuste mensal com
  panfletagem. Expansão comprada após o dia 75, conforme disponibilidade.
- Todas começam com **R$ 850**, três PCs, licenças de jogos
  e filtro de conteúdo pagos. Windows, fornecedor, estoque, técnicos
  e faxina também são pagos. Uma reserva **experimental** de
  R$ 550 é usada apenas para grandes aquisições, licenciamento e
  panfletagem; essa reserva não é imposta ao jogador.
- Na estratégia mensal, o preço pode mudar em **R$ 0,25/h**
  conforme ocupação e resultado financeiro **do mês passado**
  (nunca com previsão do futuro), respeitando o teto do ano.
  Não foi instalado nenhum gerente automático no jogo.
- Save exportado/importado no dia 90 e conferência de
  conservação contábil a cada mês.

## Resultado médio de duas sementes em 180 dias

| PCs | Preço/política | Resultado líquido | Clientes | Promoções realmente pagas |
|---:|---|---:|---:|---:|
| 3 | R$ 2,50 fixo | R$ 3.254,41 | 3.466,5 | 0 |
| 3 | **R$ 3,00 fixo** | **R$ 4.814,66** | 3.467,5 | 0 |
| 3 | Gerente mensal | R$ 4.524,22 | 3.504,0 | 0 |
| 3 | R$ 2,50 + panfletagem | R$ 3.248,74 | 3.458,0 | 4 |
| 3 | R$ 3,00 + panfletagem | R$ 4.687,43 | 3.456,5 | 4 |
| 3 | Gerente mensal + panfletagem | R$ 4.313,76 | 3.461,0 | 4 |
| 5 | R$ 2,50 fixo | R$ 2.345,99 | 4.319,5 | 0 |
| 5 | R$ 3,00 fixo | R$ 4.242,95 | 4.324,5 | 0 |
| 5 | Gerente mensal + panfletagem | R$ 3.607,18 | 4.257,0 | 3 |

Todas as campanhas preservaram o caixa e os três computadores
iniciais foram integralmente pagos conforme o contrato do jogo.
A tabela inclui custos operacionais e de expansão.

**Diferenças pareadas (mesmo tamanho e tarifa):**
- Subir de R$ 2,50 para **R$ 3/h** com 3 PCs:
  **+R$ 1.560,25** líquidos. Com 5 PCs: **+R$ 1.896,96**.
- Adicionar panfletagem ao cenário de 3 PCs / R$ 2,50:
  **−R$ 5,67** líquidos após quatro campanhas realmente pagas
  (R$ 96 em anúncios).
- Com 3 PCs / R$ 3,00: **−R$ 127,23** com panfletagem.
- Sobre gerente mensal sem panfletagem: **−R$ 210,46**.
- Cinco PCs com R$ 3,00 ficaram **R$ 571,71 abaixo**
  de três PCs com o **mesmo preço** após o investimento no período.

O custo histórico de panfletagem ficou coerente com a escala
monetária da época. Porém, **a publicidade não teve retorno
financeiro positivo médio** nessas duas sementes, no horizonte
de 180 dias e para os intervalos comprados. Reduzir mais o
custo ou aumentar arbitrariamente a chance de visitantes
apenas para produzir retorno seria manipular o resultado.

A análise reforça que a tarifa por hora tem impacto relevante,
ao passo que a expansão encontra limite de procura. O melhor
preço não foi calibrado globalmente: R$ 3/h é **o teto permitido
em 1998**, não uma recomendação eterna para outras épocas.

## Regressões e reprodução

- `tests/historical-promotion-pricing-roi.test.mjs`: três testes
  rápidos de custo clássico/histórico, IPCA, cobrança e UI;
  auditoria de 18 campanhas **opt-in**.
- `npm run audit:promotions`: executa as 18 campanhas e imprime
  `LHS_PROMOTION_PRICING_CAMPAIGN` e
  `LHS_PROMOTION_PRICING_SUMMARY`.
- Workflow manual *Lan House historical promotion and pricing audit*,
  separado dos três workers convencionais.
- [Resultado da auditoria 38583941104](https://github.com/Softdown-prog/A7-forge-2D-/actions/runs/38583941104):
  quatro testes aprovados, zero falhas.

## O que falta

Amostra pequena: duas sementes, só 1998, 180 dias, três/cinco PCs,
uma campanha em datas fixas por mês e sem alterações de componentes
ou de preço de produtos. Faltam campanhas mais longas, demanda
turística, diferenciação por época, perfil de moradores do bairro,
anúncios com preços por alcance e receita VIP individual.

Essas limitações impedem concluir que publicidade **nunca**
compensa. Antes de mexer no multiplicador ou oferecer recomendações
de investimento, testar outros horários, salões cheios, clientes
perdidos por falta de espaço e modernização de peças.
