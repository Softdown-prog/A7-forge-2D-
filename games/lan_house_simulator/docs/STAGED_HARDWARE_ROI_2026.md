# Auditoria de modernização gradual de computadores — 2005 e 2012

Lan House Simulator (LHS) · 14 de outubro de 2026

## Pergunta do backlog

O empreendedor deveria trocar **CPU, RAM, HD/SSD, placa-mãe, fonte, GPU
e Windows** todos de uma vez? Ou vale atualizar peças baratas primeiro
e reservar upgrades completos para o momento certo?

Esta auditoria usa o **modo histórico** lançado no LHS, não as
comparações da economia clássica com R$ 18–24/h.

## Métodos

- **20 campanhas**: anos de abertura **2005 e 2012**, sementes
  **23 e 137**, cinco políticas por época, **240 dias** cada.
- Todas começam com três PCs de 1998, na mesma época e mesmo capital
  experimental **round(R$ 16.000 × índice IPCA do ano)**.
  **Não** reproduz o dinheiro inicial real de R$ 850 de uma
  nova partida de 1998. É um orçamento de laboratório para
  permitir compras contemporâneas que não caberiam em R$ 850.
- Compras via APIs oficiais do motor: peças avulsas `buyPart`,
  `buyPlatform`, `buyGpu`, licenças `licenseWindows`,
  `upgradeInternet`, fornecedor, jogos e filtro; toda despesa
  sai do caixa do jogo e entra na contabilidade.
- A tarifa é inicialmente definida no **teto permitido pelo ano e
  pela qualidade média das três estações**. O preço não muda
  durante os 240 dias. Isso é um cenário de comparação, não
  uma recomendação automática de tarifa.
- Reposição do varejo, reparos, limpeza, energia e contas são reais.
  O save é exportado/importado no dia 120; há conservação contábil,
  verificação mensal de ocupação, limites monetários e componentes
  instalados.

### Estratégias exatas

| Estratégia | Hardware e licença adquiridos |
|---|---|
| `legacy` | Três PCs originais de 1998, Windows 98 licenciado |
| `partial` | Nos três PCs: CPU **Bairro 800 (Slot 1)**, RAM **SDRAM 256 MB**, HD **IDE 20 GB**, Windows XP, mantendo placa-mãe Slot 1 e fonte originais |
| `one-kit` | Kit de plataforma do ano + Windows da época em **um PC**; outros dois com Windows 98 |
| `all-kits` | Kit de plataforma 2005 (**Turbo 2005**) ou 2012 (**Quad 2012**, com SSD) e Windows XP/7 **nos três PCs** |
| `all-kits-gpu` | Três kits modernos, três licenças Windows contemporâneas e três GPUs pagas: **PixelForce 6600 (2005)** ou **PixelForce 560 (2011)** |

Compatibilidade de socket, RAM DDR/SDRAM, disco IDE/SATA,
potência da fonte e requisitos do Windows respeitada.
Não há troca de preços, FPS ou probabilidades feita pelo teste.

## Resultados — 240 dias

**Médias de duas sementes; valores em reais nominais do próprio ano.**
`Resultado líquido` inclui investimentos e todas as despesas.
`Operação` retira apenas o investimento inicial do balanço
para distinguir margens correntes de compras de peças.

| Ano | Estratégia | Tarifa/h | Compra e preparação inicial | Resultado líquido | Resultado operacional | Diferença versus legado |
|---|---|---:|---:|---:|---:|---:|
| 2005 | Legado 1998 | R$ 3,50 | R$ 1.560 | **+R$ 5.686,18** | +R$ 7.246,18 | — |
| 2005 | CPU/RAM/HD/XP avulsos | R$ 4,25 | R$ 3.180 | **+R$ 8.560,04** | +R$ 11.740,04 | +R$ 2.873,86 |
| 2005 | Um PC modernizado | R$ 4,00 | R$ 2.720 | **+R$ 7.189,60** | +R$ 9.909,60 | +R$ 1.503,42 |
| 2005 | Três kits completos | R$ 5,00 | R$ 5.040 | **+R$ 9.244,12** | +R$ 14.284,12 | +R$ 3.557,94 |
| 2005 | Três kits + GPUs | R$ 5,00 | R$ 6.360 | **+R$ 7.721,65** | +R$ 14.081,65 | +R$ 2.035,47 |
| 2012 | Legado 1998 | R$ 2,75 | R$ 2.060 | **−R$ 2.575,59** | −R$ 515,59 | — |
| 2012 | CPU/RAM/HD/XP avulsos | R$ 2,75 | R$ 3.680 | **−R$ 2.370,22** | +R$ 1.309,78 | +R$ 205,37 |
| 2012 | Um PC modernizado | R$ 3,75 | R$ 4.510 | **−R$ 309,85** | +R$ 4.200,15 | +R$ 2.265,74 |
| 2012 | Três kits completos | R$ 7,00 | R$ 9.410 | **+R$ 8.629,88** | +R$ 18.039,88 | +R$ 11.205,47 |
| 2012 | Três kits + GPUs | R$ 7,00 | R$ 14.180 | **+R$ 2.532,51** | +R$ 16.712,51 | +R$ 5.108,10 |

**Conclusões restritas às condições do ensaio:**

1. Em 2005, CPU/RAM/HD e XP avulsos criam boa alternativa intermediária:
   resultado **R$ 2.873,86 acima** do legado, com investimento total
   menor que a troca das três plataformas.
2. Renovar as três plataformas venceu em ambas as épocas.
   Em 2012, preservar as máquinas de 1998 resulta até em margem
   operacional negativa, enquanto três kits completos permitem
   maior tarifa e operação positiva.
3. Comprar GPU avulsa nas três máquinas **reduziu o resultado
   versus ter as mesmas plataformas sem GPU**: cerca de R$ 1.522,47
   em 2005 e **R$ 6.097,37** em 2012. O investimento em GPU foi
   cobrado integralmente, sem revenda.
4. As diferenças são majoritariamente explicadas pelo teto de tarifa
   permitido pela geração média; a ocupação amostrada não prova
   que GPUs nunca melhoram a experiência.

Não confundir "custos de instalação inicial" com todo o custo de
capital de uma lan house: o laboratório começa com três PCs de
1998 já instalados. Também não é uma projeção de valor presente,
depreciação, tributos ou prazo de amortização em toda a vida útil.

## Reprodução e testes

```sh
cd games/lan_house_simulator
npm install
npm run audit:staged-hardware
```

A suíte comum `npm test` executa só duas regressões rápidas,
validando CPU/placa-mãe Slot 1 vs 478, RAM DDR vs SDRAM,
HD IDE, Windows XP/7, GPU, orçamento e save. A auditoria pesada
fica no workflow **Lan House staged hardware ROI audit**,
acionado manualmente.

[Execução real das 20 campanhas, sucesso](https://github.com/Softdown-prog/A7-forge-2D-/actions/runs/38586662951).
Cada linha `LHS_STAGED_HARDWARE_CAMPAIGN` contém todos os KPIs
e oito fechamentos mensais; `LHS_STAGED_HARDWARE_SUMMARY` agrega
as duas sementes por estratégia/ano.

## Limitações e backlog seguinte

Amostra pequena (duas sementes), horizonte de 240 dias, três PCs,
caixa experimental, peças compradas imediatamente, tarifa máxima
fixada no começo, sem financiamento, anúncios ou modernização
parcelada no calendário real da campanha. Portanto, não generalizar
o resultado para salões de 5–7 PCs, épocas posteriores, procura
turística ou VIPs. Não há IVA, salários fixos ou depreciação financeira.

Próxima auditoria: **comprar upgrades por etapas ao longo dos meses**
com caixa efetivamente acumulado, variando tarifas de modo não
oracular, qualidade da procura VIP, GPUs somente nos PCs
mais utilizados e expansões em 5–7 estações. Só depois
decidir se ajustes de balanceamento são necessários.
