# Estudo controlado de tarifas históricas dos jogos GPU

Este estudo **não altera as tarifas dos jogadores**. Ele utiliza o motor
econômico existente para comparar três tarifas *legais*, respeitando
automaticamente tanto o teto anual quanto a qualidade média dos PCs:

- **Referência:** R$ 2,50/h ou o limite da estação, se for menor.
- **Intermediária:** ponto médio entre referência e limite, arredondado
  para baixo em incrementos permitidos de R$ 0,25/h.
- **Máxima:** limite horário permitido por `allowableHourlyPrice()`.

Caso duas políticas produzam a mesma tarifa (por restrição de máquinas
antigas), isso deve ser visível no relatório, não mascarado por números
inventados. O adicional por jogo GPU continua limitado também pelo
teto **anual**, e pode cair quando a tarifa básica aumenta.

Cada política cobre os anos **2005, 2009 e 2013**, com **1 ou 2 PCs
compatíveis** (em três PCs originais), duas sementes fixas **23 e 137**,
e **com/sem licença** do título do ano. São **72 campanhas de 90 dias**.
Cada comparação usa hardware, Windows, capital de laboratório
(R$ 100 mil) e semente idênticos; a compra da licença é a única
diferença dentro do par. Estoque, manutenção, limpeza e atendimento
usam a implementação real do jogo.

### Como ler o resultado

O relatório separa preço solicitado/efetivo, teto permitido, sessões
com o jogo, procura, adicional arrecadado, cobertura nominal da licença,
atendimentos, desistências e diferença de saldo entre pares. A diferença
de saldo contém efeitos indiretos de satisfação, movimentação e custos
simulados; **não é lucro garantido de uma campanha real**, nem autoriza
recalibrar custos automaticamente.

Executar: `npm run audit:gpu-pricing`. O workflow armazena
`lhs-gpu-tariff-90day-audit` com o JSON dos 72 cenários, 36 pares e
18 médias. Na suíte curta (`npm test`) a mesma lógica corre por oito
dias para prevenir regressões rápidas.

**Pendências posteriores:** comparar uma campanha iniciada com os
R$ 850 reais do modo histórico; validar progressão natural de Windows,
computadores e licenças sem capital adiantado, e decidir se a demanda
de cada título justifica mudanças no preço da licença.

## Resultados validados — 17 de outubro de 2026

Execução integral aprovada:
[GitHub Actions #39023505586](https://github.com/Softdown-prog/A7-forge-2D-/actions/runs/39023505586).
Artefato `lhs-gpu-tariff-90day-audit` com os 72 registros individuais,
36 comparações pareadas e 18 médias.

| Ano | PCs aptos | Referência (taxa → cobertura) | Intermediária (taxa → cobertura) | Máxima (taxa → cobertura) |
| --- | ---: | --- | --- | --- |
| 2005 | 1 | R$ 2,50 → 19,35% | R$ 3,25 → **19,85%** | R$ 4,25 → 19,70% |
| 2005 | 2 | R$ 2,50 → 36,40% | R$ 3,50 → **38,90%** | R$ 4,75 → 12,05% |
| 2009 | 1 | R$ 2,50 → 10,70% | R$ 3,25 → 9,25% | R$ 4,00 → **10,90%** |
| 2009 | 2 | R$ 2,50 → 18,95% | R$ 3,75 → **19,35%** | R$ 5,25 → 11,35% |
| 2013 | 1 | R$ 2,50 → 5,35% | R$ 3,00 → 5,90% | R$ 3,50 → **5,95%** |
| 2013 | 2 | R$ 2,50 → **11,55%** | R$ 4,00 → 8,65% | R$ 5,75 → 11,20% |

Os números são **médias das sementes 23 e 137** e representam
exclusivamente os adicionais de sessões no jogo avançado divididos
pelo custo nominal de sua licença. Em nenhum dos 18 tratamentos a
licença recuperou 100% de seu preço em 90 dias. O saldo incremental
entre comprar e não comprar a licença ficou negativo em todas as
combinações.

**Achado fundamental:** preço base mais alto não garante adicional
de jogo maior. A tarifa da sessão GPU nunca pode ultrapassar o
teto **anual**. Se o preço comum se aproxima do teto, diminui o
espaço para cobrar o bônus avançado. Em 2005, com dois PCs aptos,
a opção máxima de R$ 4,75/h entregou **R$ 69,84** em adicionais,
contra **R$ 225,63** com a intermediária de R$ 3,50/h.

Os clientes atendidos em cada par com/sem licença permaneceram
iguais nesta amostra, portanto a variação de cobertura **não demonstra**
efeito de aquisição de novos clientes. O capital de R$ 100.000 é uma
condição artificial do laboratório, diferente da progressão com
R$ 850 do início do jogo. Essas comparações não provam que uma tarifa
é globalmente ótima para caixa ou satisfação. A conclusão prática
é **manter os preços e custos do catálogo até estudar a progressão
real com capital restrito**.
