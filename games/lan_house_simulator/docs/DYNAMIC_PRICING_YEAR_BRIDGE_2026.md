# Tarifas fixas e dinâmicas na virada 2011 → 2012

Data: 14/10/2026 · Lan House Simulator · validação: `tests/dynamic-pricing-year-bridge.test.mjs`

## Pergunta

O reajuste manual de R$ 18 para R$ 22 ao mudar de ano melhora o resultado?
E ampliar a loja de cinco para sete computadores altera essa conclusão?

A análise usa **16 campanhas contínuas de 120 dias**, com sementes 23 e 137, duas
capacidades (5 e 7 PCs) e quatro políticas de preço:

- **Fixo 18**: cobrar R$ 18/h durante os 120 dias.
- **Fixo 22**: cobrar R$ 22/h durante os 120 dias.
- **Subir**: cobrar R$ 18/h durante os 60 dias finais de 2011; alterar pela API
  para R$ 22/h na chegada de 2012 e mantê-los pelos 60 dias seguintes.
- **Descer**: cobrar R$ 22/h durante os 60 dias finais de 2011; alterar pela API
  para R$ 18/h na chegada de 2012 e mantê-los pelos 60 dias seguintes.

## Método e proteção contra números inventados

Começo em 2011, dia 301, com caixa de R$ 30.000 em todos os grupos. Por APIs
normais da simulação, cada loja compra licença de jogos, proteção de conteúdo,
fornecedor parceiro, internet disponível, ampliação, computadores e uma licença
Windows 98 para cada máquina. Os sete PCs custam mais na implantação;
não recebem subsídio, desconto ou crédito de revenda.

Nos 120 dias contínuos, um controlador de manutenção repõe lotes abaixo de
cinco unidades, contrata técnicos para PCs livres com desgaste alto e solicita
limpeza quando há lixeiras cheias. É a mesma política para todos os grupos.
Todos os atendimentos, compras combinadas de bebida/comida, saídas, pagamentos,
chuva, queda de internet, custo de energia, contas e satisfação passam pelo motor
do jogo. Não há visitas nem vendas fabricadas. O preço só muda em 2012 quando
a política determina. O teste verifica a conservação exata do caixa, teto de
clientes, salvamento/restauração e checkpoints a cada 30 dias.

**Resultado líquido = caixa final − R$ 30.000**, após compras iniciais e
despesas do período. Valores abaixo são médias de **duas sementes**,
não estimativas de arrecadação garantida.

## Resultado financeiro

| Estratégia | Resultado líquido médio · 5 PCs | Resultado líquido médio · 7 PCs |
| --- | ---: | ---: |
| R$ 18/h fixos | **R$ 43.814,50** | **R$ 42.860,50** |
| R$ 22/h fixos | R$ 25.726,00 | R$ 23.646,00 |
| Subir R$ 18 → 22 em 2012 | R$ 35.722,00 | R$ 33.443,00 |
| Descer R$ 22 → 18 em 2012 | R$ 34.587,50 | R$ 32.764,50 |

### Atendimentos e ocupação

| Estratégia | Atendimentos · 5 PCs | Ocupação amostrada · 5 PCs | Atendimentos · 7 PCs | Ocupação amostrada · 7 PCs |
| --- | ---: | ---: | ---: | ---: |
| Fixo 18 | 3.152,5 | 33,4% | 3.309,5 | 26,75% |
| Fixo 22 | 1.602,5 | 18,55% | 1.654 | 14,15% |
| Subir | 2.427 | 28,75% | 2.483 | 18,95% |
| Descer | 2.369 | 26,5% | 2.442 | 19,15% |

Vendas médias de produtos por campanha: com cinco PCs, **2.783** no fixo 18,
**2.001** no fixo 22, **2.442** ao subir e **2.371,5** ao descer. Com sete
PCs, respectivamente **2.837**, **2.036,5**, **2.457,5** e **2.408,5**.
As vendas refletem o sistema recente de consumo combinado de bebida e alimento.

## Interpretação

1. R$ 18/h teve o maior resultado líquido nos dois portes para estas
   sementes, datas e regras de compra. O acréscimo por sessão em R$ 22/h
   não compensou a redução da demanda e do consumo complementar.
2. Ter sete PCs produziu alguns atendimentos adicionais, mas a capacidade
   ficou proporcionalmente mais ociosa e o custo inicial não se recuperou
   no horizonte de 120 dias. Isso **não** prova que sete PCs são ruins em
   campanhas longas ou com outro perfil de procura.
3. Subir o preço na virada piorou o resultado em relação a manter R$ 18/h;
   baixá-lo melhorou o resultado frente a manter R$ 22/h.
4. O motor **não** reajusta o preço do usuário automaticamente. A tarifa
   de energia aumenta cerca de 3% por ano até seu limite, enquanto aluguel,
   mensalidade de internet, manutenção básica e atacado permanecem sem
   inflação automática neste modelo. Não foi introduzida inflação fictícia.

## Limitações e trabalho seguinte

- Só duas sementes e apenas quatro trajetórias de preço; não extrapolar
  para a economia completa, nem chamar R$ 18 de equilíbrio universal.
- Não testamos reação de preços mensais, promoções simultâneas, operação com
  paredes/divisórias complexas, financiamento ou depreciação com revenda.
- Para determinar retorno de sete PCs são necessárias campanhas de 360+
  dias e cenários de alta ocupação.
- A inspeção móvel automatizada do workflow não substitui a aprovação em
  dispositivo físico real.

Logs e JSONs por cenário são emitidos como `DYNAMIC_YEAR_BRIDGE` e
`DYNAMIC_YEAR_SUMMARY` no worker `worker-simulation` do CI.
A alteração é **somente auditoria**: nenhuma regra de preço, visita ou
compra foi ajustada.
