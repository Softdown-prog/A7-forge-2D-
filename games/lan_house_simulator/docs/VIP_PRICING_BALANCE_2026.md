# Revisão de reputação, clientes VIP e preços — Lan House Simulator

Data: 14/10/2026 · Repositório: `games/lan_house_simulator/`

## Problema verificado

A reputação dos cenários médio e grande tendia a 100, pois cada sessão positiva somava pontos sem desaceleração. O preço elevado reduzia o número de visitantes, porém ainda podia gerar mais lucro que o preço justo. Na primeira rodada da auditoria, **R$ 26/h** gerou **R$ 181.287** acima do capital de partida em dois anos, contra **R$ 120.889** com **R$ 12/h**, apesar de menos atendimentos. Isso favorecia a estratégia de cobrar muito caro.

## Correção integrada ao motor

1. **Reputação sustentável:** avaliações positivas têm ganho gradualmente menor conforme se aproximam de um teto de serviço. O teto é 98 para tarifas razoáveis e diminui quando o preço premium não está acompanhado de equipamento. Avaliações negativas preservam seu peso integral. Não há penalização automática apenas por abrir a tela de preços.
2. **VIPs:** sua opinião considera espera, falha de conexão e excesso de preço relativo à qualidade do hardware. Ter máquinas melhores ajuda a justificar uma tarifa maior, mas não elimina reclamações. A elegibilidade VIP continua determinística e dependente da reputação; o sorteio de NPC e o RNG da simulação permanecem independentes.
3. **Demanda:** os preços até R$ 18/h continuam na mesma curva anterior. Acima de R$ 18, uma resistência multiplicativa progressiva `0.84^(preço−18)` é aplicada à demanda existente, sem alterar faturamento diretamente.
4. **Avaliação:** valores superiores a R$ 18/h acrescentam uma penalidade de satisfação por unidade excedente. Sessões com hardware superior continuam ganhando o bônus já implementado.
5. **Sem mudanças visuais:** personagens, sprites, animações, rota dos NPCs, upgrades, custo de manutenção e itens não foram modificados.

## Auditoria de dois anos (1998–1999)

Arquivo: `tests/vip-long-term.test.mjs`. Duas partidas de **720 dias**, 720 minutos de jogo por dia, mesma semente **1933**, capital inicial explícito de **R$ 12.000** para cada cenário e nenhuma injeção recorrente de caixa. Licenciamento de jogos e Windows, filtro de conteúdo, compras de estoque, manutenção e faxina são executados através das funções reais do jogo. Não foram comprados upgrades de hardware nos dois cenários.

| Medida | Preço justo: R$ 12/h | Sobrepreço: R$ 26/h |
| --- | ---: | ---: |
| Clientes atendidos | 14.526 | 1.888 |
| Clientes perdidos por fila | 4.349 | 2 |
| Reputação após 720 dias | 84,14 | 10,00 |
| Participação VIP entre amostras de visitantes | 12,71% | 1,48% |
| Receita acumulada | R$ 224.548 | R$ 54.203 |
| Despesas acumuladas | R$ 103.659 | R$ 32.482 |
| Caixa final | R$ 132.889 | R$ 33.721 |
| Resultado acima do capital inicial (caixa − R$ 12.000) | **R$ 120.889** | **R$ 21.721** |

| Dia | Reputação a R$ 12/h | Reputação a R$ 26/h |
| --- | ---: | ---: |
| 180 | 85,69 | 31,71 |
| 360 | 78,76 | 10,00 |
| 540 | 83,76 | 10,00 |
| 720 | 84,14 | 10,00 |

A baixa quantidade de reclamações de fila em R$ 26/h decorre da falta de visitantes, **não** de melhor atendimento. A queda ao piso de reputação também indica que preços extremos podem ser punitivos demais; os valores intermediários precisam de auditoria antes de considerar a curva definitiva.

## Outras verificações

A suíte completa inclui testes de preço normal preservado até R$ 18, monotonicidade da demanda, avaliação negativa por sobrepreço, compensação de preço por hardware superior, VIPs determinísticos, importação de partidas antigas e conservação mensal do caixa. As nove campanhas existentes de 45 dias e 3/5/7 PCs também rodam no CI para detectar regressões na circulação e nas finanças.

## Limites desta conclusão

O resultado cobre **um contraste entre preços extremos em 1998–1999**, não todas as estratégias. Faltam comparações para preços intermediários e anos posteriores com placas de vídeo, upgrades e redes melhores; o equilíbrio financeiro do salão grande também requer avaliação específica. A aprovação artística e a usabilidade no celular físico continuam tarefas separadas.
