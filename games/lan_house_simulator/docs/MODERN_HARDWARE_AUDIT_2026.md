# Auditoria multissemente de hardware moderno e preços — 2011/2013

Data: 14/10/2026 · Implementação executável: `tests/modern-hardware-audit.test.mjs`

## Por que esta auditoria existe

A comparação anterior usava uma única semente (1933) em 1998/2009. A pendência do BACKLOG exigia verificar se preços intermediários e placas modernas continuam economicamente coerentes nos anos de 2011 e 2013, sem forçar demanda por causa do upgrade.

## Protocolo

- **36 campanhas de 120 dias:** dois anos iniciais de configuração (2011, 2013) × três sementes (23, 137, 72421) × três tarifas (R$ 18, R$ 22 e R$ 24 por hora) × dois níveis de hardware (controle e moderno).
- **Mais seis campanhas de 360 dias:** 2013, R$ 24/h, três sementes, controles e máquinas atualizadas; o motor atravessa o ano seguinte normalmente.
- Capital inicial igual para todos: **R$ 26.000**. Cinco computadores; mesma ampliação física, rede, contratos de fornecedor e licenças para cada par. Os componentes de hardware são comprados pelas APIs existentes: duas atualizações de nível para cada um dos PCs 4 e 5 e duas placas PixelForce 560 (2011) ou PixelForce 770 (2013). O grupo de controle mantém os PCs antigos.
- O motor simula todas as sessões, fila, queda de internet, vendas, manutenção, limpeza, desgaste e contas mensais. O teste valida `caixa = capital inicial + receitas - despesas` em cada fechamento e registra clientes atendidos, resultado líquido, satisfação, utilização e uso dos PCs traseiros por VIPs.
- Resultado líquido significa **caixa final − R$ 26.000**, incluindo toda a implantação e operação. Resultados financeiros são dinheiro fictício do jogo.

## Resultados após quatro meses (120 dias)

Médias de três sementes. O valor entre parênteses é o número médio de atendimentos.

| Ano | Tarifa | Cinco PCs antigos | PCs 4/5 com upgrade/GPU | Diferença líquida dos upgrades |
|---|---|---:|---:|---:|
| 2011 | R$ 18/h | R$ 39.133 (3.072) | R$ 36.166 (3.129) | −R$ 2.967 |
| 2011 | R$ 22/h | R$ 22.645 (1.615) | R$ 19.630 (1.699) | −R$ 3.014 |
| 2011 | R$ 24/h | R$ 8.091 (804) | R$ 7.755 (1.022) | −R$ 336 |
| 2013 | R$ 18/h | R$ 39.039 (3.072) | R$ 34.284 (3.105) | −R$ 4.755 |
| 2013 | R$ 22/h | R$ 22.569 (1.615) | R$ 18.111 (1.696) | −R$ 4.458 |
| 2013 | R$ 24/h | R$ 8.025 (804) | R$ 6.571 (1.037) | −R$ 1.454 |

Os PCs atualizados receberam mais VIPs, sobretudo com preços altos. O retorno de curto prazo, entretanto, permaneceu negativo em todos os pares médios acima, após descontar investimento e custo operacional.

## Retorno após 360 dias: 2013, R$ 24/h

| Indicador (média de três sementes) | Cinco PCs antigos | PCs 4/5 modernizados |
|---|---:|---:|
| Implantação total | R$ 3.590 | R$ 9.530 |
| Clientes atendidos | 2.019 | 3.272 |
| Reputação final | 39,93 | 94,04 |
| VIPs usando PCs 4/5 (% das amostras VIP em sessão) | 10,33% | 98,97% |
| **Resultado líquido após implantação e operação** | **R$ 22.793** | **R$ 41.829** |

A diferença de resultado médio de **R$ 19.036 a favor do hardware moderno** já desconta a despesa inicial adicional de R$ 5.940. A vantagem foi positiva nas três sementes. Portanto, os quatro meses anteriores eram insuficientes para avaliar a amortização dos PCs modernos nessa configuração específica.

## Significado para a mecânica

O valor dos upgrades vem da melhor experiência, reputação, preferência VIP e manutenção da procura, não de aumentar artificialmente a taxa de chegada. As campanhas mostram que jogar somente alguns meses pode criar uma impressão errada sobre o retorno de uma máquina cara; decisões de upgrade fazem mais sentido com horizonte de longo prazo.

**Limitações:** o controle conserva PCs de nível 1 e sem GPU moderna mesmo em 2013. Isso testa uma renovação profunda, não o retorno incremental de trocar uma GPU 2009 por GPU 2011/2013 em uma lan house já modernizada. O experimento mantém tarifa fixa durante toda a campanha, não calcula financiamento, valor de revenda ou custos de oportunidade, e usa apenas três sementes. Os resultados não provam que R$ 24/h é o melhor preço ou que todas as compras de GPU se pagam.

## Próximos testes

Comparar upgrades incrementais de geração, preços que mudam conforme a reputação e comportamento em espaços fisicamente ampliados. A inspeção no celular real e a aprovação final de sprites continuam independentes desta auditoria.
