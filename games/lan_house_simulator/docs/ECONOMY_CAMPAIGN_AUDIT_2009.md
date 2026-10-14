# Auditoria econômica de expansão — cenário 2009

## Objetivo e metodologia

Comparar uma lan house com **3, 5 e 7 PCs** usando as mesmas três sementes determinísticas (**23, 137, 72421**), o motor real de simulação, **45 dias** (720 minutos do jogo por dia) e uma configuração de início em **2009**. O capital de teste inicial de **R$ 16.000** por cenário permite comprar e licenciar equipamentos históricos sem conceder receita artificial; as compras são feitas pelas APIs reais do jogo. O ano é definido apenas no fixture de teste, para habilitar hardware de 2009.

O teste percorre 9 campanhas de 45 dias, mede ocupação por amostras a cada 10 minutos e conserva o caixa com `caixa = capital inicial + receitas - despesas`. Decisões das cartas são tomadas por uma política prudente e determinística. Compras de estoque, faxina, manutenção, licenciamento, expansão, hardware, GPU e link de internet usam as mesmas funções chamadas pela UI. A receita operacional exclui **somente** as despesas da configuração inicial; mantém gastos operacionais e contas mensais.

**As medidas são de simulações controladas**, não de um estudo de usuários nem garantia de equilíbrio de todos os anos.

## Comparação antes e depois do desvio local na fila

Os valores são **médias das três sementes** (45 dias), arredondadas.

| Métrica | 3 PCs, antes → depois | 5 PCs, antes → depois | 7 PCs, antes → depois |
| --- | ---: | ---: | ---: |
| Clientes atendidos | 153 → 231 | 178 → 328 | 186 → 352 |
| Ocupação média dos PCs | 5,93% → 10,84% | 3,59% → 8,48% | 2,72% → 6,58% |
| Clientes em deslocamento para fila (média) | 7,32 → 4,35 | 7,56 → 4,35 | 7,45 → 4,06 |
| Receita acumulada | R$ 2.054 → R$ 3.183 | R$ 2.269 → R$ 4.200 | R$ 2.296 → R$ 4.463 |
| Despesas operacionais | R$ 1.382 → R$ 1.798 | R$ 1.578 → R$ 2.105 | R$ 2.061 → R$ 2.379 |
| Resultado operacional | R$ 672 → R$ 1.385 | R$ 691 → R$ 2.095 | R$ 235 → R$ 2.085 |

### Diagnóstico

A maior parte dos NPCs ficava presa na fase de chegada à fila (aproximadamente 7,5 personagens ao mesmo tempo), enquanto poucos chegavam efetivamente ao caixa. O motor **não autorizava desvio de colisão na fase `arriving`**, embora permitisse desvio para outros trajetos. A correção habilita desvio lateral controlado também na chegada à fila **somente quando não há divisórias internas**. A lógica de colisão, reserva do PC e rotas com paredes continua em vigor.

A partir daí, a expansão permite atender mais clientes e os salões de 5 e 7 PCs apresentam menos perda de clientes, sem fabricar pagamentos ou visitas. Há regressões automatizadas para não voltar a uma fila congestionada e para manter a ocupação mínima de cada cenário.

## Limitações e próximas decisões

- **Capital e retorno:** investimentos iniciais são R$ 1.310 (3 PCs), R$ 3.570 (5 PCs), R$ 12.140 (7 PCs). Embora o salão de 7 PCs atenda mais clientes, seu retorno operacional em 45 dias é semelhante ao de 5 PCs. Não concluir que o upgrade mais caro já é economicamente vantajoso.
- **Capacidade ociosa:** ocupação média ainda é baixa; avaliar se a taxa de chegada e a localização do balcão são adequadas antes de aumentar artificialmente a procura.
- **Divisórias:** o desvio lateral só atua em salão sem divisórias; caminhos com paredes e portas continuam exigindo validação física específica.
- **Reputação:** cenários de 5/7 PCs se aproximam do teto de 100; exigir distribuição mais longa de perfis e preços para medir dificuldade.
- **Horizonte:** continuar com vários anos, equilíbrio de hardware, upgrades e preços, empréstimos/capital inicial e sessões reais em desktop/mobile antes de aprovar o balanceamento final.
- **Arte:** o CI verifica o renderer, mas não substitui aprovação visual das capturas pelo usuário.

## Validação

`tests/campaign-profiles.test.mjs` simula nove campanhas com três seeds, verifica integridade financeira diária, número de PCs, licenças, custos, manutenção, compras, decisões, reputação, ocupação, clientes perdidos e estatísticas de fila. `tests/long-campaign.test.mjs` mantém a auditoria separada de 1998. Os números acima foram obtidos pelos registros `BALANCE_PROFILE` do workflow após a correção de fluxo.
