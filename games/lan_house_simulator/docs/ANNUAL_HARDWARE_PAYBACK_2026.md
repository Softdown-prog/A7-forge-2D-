# Hardware 2013: retorno incremental após um ano

Data: 14/10/2026 · Lan House Simulator
Cenário base: PixelForce 260 comprada para todos os PCs, hardware nível 1.
Código: `tests/annual-hardware-payback.test.mjs`.

## Pergunta

Em 2013, para uma lan house que **já comprou GPUs de 2009**, o que
gera retorno durante um ano: elevar hardware interno ao nível 3,
substituir todas as placas por GPUs 2013, fazer os dois upgrades
ou continuar com as máquinas existentes?

## Experimento pareado e regras

Executadas **16 campanhas contínuas de 360 dias**: sementes 23 e 137,
cinco ou sete PCs e quatro estratégias. Todas iniciam no primeiro dia
de 2013, com R$ 65.000 de capital e **R$ 18/h**. O relógio do jogo
avança 4.147.200 minutos simulados no total e fecha 12 meses, chegando
a 2014. Cada partida salva/importa o estado no dia 180.

Por APIs normais do jogo, todas pagam a mesma base de jogos licenciados,
filtro de conteúdo, fornecedor parceiro, rede nível 3, ampliação do
salão, máquinas, Windows 98 e GPU PixelForce 260 de 2009 em **cada** PC.
Quem moderniza paga o preço integral **sem revender** a GPU antiga.

O controlador de operação é o mesmo para todos: repor cada mercadoria
quando estoque menor que cinco, contratar técnico em PC livre com
desgaste acima de 75%, limpar lixeiras e contratar panfletagem
**paga a cada 15 dias**, totalizando 24 campanhas. Visitas, vendas,
consumo, satisfação, falhas, chuva, manutenção, energia e despesas
são produzidos apenas pelo motor existente; não se fabricam visitas
nem receita.

A conservação `caixa = capital inicial + receita − despesas` é
verificada a cada fechamento. O resultado líquido é **caixa final
menos R$ 65.000**, incluindo toda compra de hardware, custos de energia
e operação, não apenas faturamento bruto. É uma média de **duas
sementes**, não previsão universal.

### Desembolso por tipo de atualização

| Estratégia | Upgrade por PC | 5 PCs | 7 PCs |
|---|---:|---:|---:|
| Manter GPU 2009 e hardware nível 1 | R$ 0 | R$ 0 | R$ 0 |
| Hardware nível 1→2→3 | R$ 720 | R$ 3.600 | R$ 5.040 |
| GPU PixelForce 260→770 | R$ 2.250 | R$ 11.250 | R$ 15.750 |
| Hardware nível 3 + GPU 770 | R$ 2.970 | R$ 14.850 | R$ 20.790 |

A aquisição inicial de cada GPU 2009 custa **R$ 1.150** e está
incluída igualmente no grupo de controle e nas três estratégias
modernizadas; os valores da tabela são **adicionais**.

## Resultado líquido médio em 360 dias

| Política | 5 PCs | Diferença sobre manter 5 | 7 PCs | Diferença sobre manter 7 |
|---|---:|---:|---:|---:|
| Manter GPU 2009 | R$ 137.200 | — | R$ 139.011 | — |
| **Atualizar só hardware nível 3** | **R$ 143.960** | **+R$ 6.760** | **R$ 143.696** | **+R$ 4.685** |
| Trocar só GPUs por 2013 | R$ 127.923 | −R$ 9.277 | R$ 123.157,50 | −R$ 15.853,50 |
| Atualizar hardware + GPUs | R$ 128.506,50 | −R$ 8.693,50 | R$ 126.801,50 | −R$ 12.209,50 |

O diferencial já **desconta o gasto de upgrade**. Com cinco máquinas,
a melhoria apenas do hardware adiciona R$ 6.760 líquidos, apesar do
investimento de R$ 3.600. Em sete PCs, a diferença fica em R$ 4.685
após investir R$ 5.040. O retorno operacional implícito antes do
custo inicial é de R$ 10.360 (cinco PCs) ou R$ 9.725 (sete).

No upgrade apenas de GPU, a diferença operacional *antes* do preço das
placas é de aproximadamente +R$ 1.973 (cinco PCs) ou −R$ 103,50
(sete PCs). Com o custo integral de R$ 11.250 ou R$ 15.750, ambas
terminam atrás da alternativa de preservar as PixelForce 260.

### Movimento, lotação e reputação

| Estratégia | Atendidos 5 PCs | Ocupação 5 PCs | Atendidos 7 PCs | Ocupação 7 PCs |
|---|---:|---:|---:|---:|
| Manter | 9.608 | 34,02% | 10.354,5 | 26,33% |
| Só hardware | 9.608 | 33,98% | 10.335,5 | 26,30% |
| Só GPU | 9.724,5 | 34,42% | 10.376 | 26,34% |
| Hardware + GPU | 9.431,5 | 33,37% | 10.335,5 | 26,30% |

A reputação média dos cinco PCs ficou em 95,56 ao manter, 96,48 ao
trocar CPU, 96,33 ao trocar GPU, e 96,73 nas duas melhorias. Para sete
PCs, respectivamente 97,63, 97,89, 97,29, 97,90. A reputação ligeiramente
maior **não garante** recuperação financeira de uma peça cara.

Com GPU antiga, ir de cinco para sete PCs acrescentou R$ 1.811 de
resultado líquido em 360 dias. Atualizando apenas hardware, o resultado
dos sete PCs ficou R$ 264 **abaixo** do conjunto equivalente com cinco.
Não existe uma recomendação de ampliação universal: no modelo testado,
capacidade adicional permanece largamente ociosa.

## Limites e decisões

- Somente **2013**, tarifa R$ 18/h, duas sementes, salões de 5/7 PCs,
  Windows 98 e 24 promoções programadas. Outro preço, ano, sistema,
  lotação, sala dividida e GPU de entrada podem mudar o retorno.
- A troca de todas as GPUs é um extremo comparativo. Em cenário real,
  modernizar uma ou duas estações VIP pode custar menos; **não foi testado
  aqui**.
- Em todas as estratégias, o hardware/GPU novo foi instalado **no começo
  da campanha**, não como compra parcelada ou no momento de quebra.
  Não há financiamento, crédito de troca ou valor residual no jogo.
- As vantagens são medidas pelo motor estocástico real (incluindo
  desdobramentos de RNG); duas sementes pareadas reduzem vieses,
  mas não isolam efeitos causais individualmente nem oferecem intervalos
  de confiança adequados.
- Os dados não justificam alterar a curva de procura, preço das peças,
  satisfação ou custo de energia. Inspeções automáticas visuais não
  substituem aprovação humana em aparelho móvel.

**Próximo trabalho**: testar 1–2 GPUs prioritárias para VIPs, com tarifas
R$ 22/24, demanda variável, salões divididos, e campanhas de duração
superior a 360 dias para verificar amortização gradual.

## Reprodução

Em `games/lan_house_simulator`:

```sh
npm install
npm run audit:hardware
```

O comando compila e roda os 16 cenários, emitindo
`HARDWARE_ANNUAL_CAMPAIGN` por semente e
`HARDWARE_ANNUAL_SUMMARY` com as médias. Pode também ser acionado no
GitHub Actions pelo workflow manual **Lan House - hardware payback audit**.

A suíte cotidiana `npm test` inclui o arquivo, mas **pula só o teste
pesado** para preservar a rapidez das verificações frequentes.

Validação inicial integral:
[GitHub Actions 38553077330](https://github.com/Softdown-prog/A7-forge-2D-/actions/runs/38553077330),
180 testes aprovados, nenhum reprovado; os três workers concluíram
com sucesso. Nenhuma regra econômica do runtime foi alterada.


Validação sobre a versão com cinco kits LCD: [GitHub Actions
38554478363](https://github.com/Softdown-prog/A7-forge-2D-/actions/runs/38554478363).
Foram **189 testes aprovados e nenhum reprovado** (a auditoria anual anterior
estava pulada); a auditoria de hardware executou e reproduziu exatamente
todas as oito médias acima. O worker de arte e o de Chromium, incluindo
as verificações específicas das cinco gerações LCD, também passaram.
Nenhum modelo LCD foi comprado nas campanhas, portanto os resultados
avaliam o parque CRT/GPU anterior e não antecipam o retorno de LCDs.
