# Pacotes de horas e consumo — 14/10/2026

Relato: visitantes aparentemente contratam somente meia hora e não consomem comida/bebida depois de uma partida longa.

## Diagnóstico confirmado

`chooseSessionMinutes` já oferece 30, 45, 60 e 90 minutos. Energia, sede e perfil decidem no atendimento; a espera aumenta necessidades e pode encurtar a sessão. O preço/hora não escolhe diretamente sua duração: ele influencia procura e avaliação. Não foi reproduzida uma limitação geral de 30 minutos no código atual. Sem o save e a versão usada pelo jogador, não é possível identificar a causa exata daquele relato.

O consumo tinha um bloqueio real: a escolha priorizava refrigerante sempre que havia sede, estoque e orçamento. Depois de **uma única compra**, o cliente saía. A fome podia continuar alta, mas não gerava uma segunda compra. Com reposição constante, isto praticamente excluía os alimentos; sem reposição, o estoque inicial acabava e as vendas cessavam. O fornecedor parceiro barateia lotes: não repõe estoque automaticamente.

## Correção

Depois da venda real, a bebida alivia sede e o alimento alivia fome. Um cliente pode comprar **até uma bebida e um alimento por visita**, incluindo doce como alternativa ao salgadinho esgotado. Cada compra exige necessidade, estoque, dinheiro restante e uma rota válida até a máquina. A segunda mercadoria gera seu próprio débito de estoque, receita, efeito/áudio de venda e lixo. Não interrompe a sessão de PC nem cobra o pacote outra vez.

Marcadores opcionais de bebida/alimento e orçamento são preservados em save/importação para impedir repetição após retomar. Personagens de saves antigos continuam aceitos. Clientes com pouco dinheiro, sem necessidade, com produtos caros ou sem estoque continuam podendo sair sem comprar. As regras dos pacotes não foram alteradas neste ajuste.

## Experimento de três dias

Semente 1933, 2.160 minutos de simulação real. Base anterior: commit `052eceb403e56efcd639f5a8bbb312cd54f89137`. Em cada cenário gerenciado, capital de teste R$ 10.000, licença de jogos comprada pela API, reposição de lotes abaixo de cinco unidades a cada hora de jogo e manutenção paga em PCs livres a partir de 75% de desgaste. Nenhum visitante ou venda é inserido. Preços padrão: refrigerante R$ 8, salgadinho R$ 9, doce R$ 5. O script verifica caixa = capital + receita − despesas a cada minuto.

| Tarifa PC | Situação | Antes: bebida / salgadinho / doce | Depois: bebida / salgadinho / doce |
| --- | --- | ---: | ---: |
| R$ 8/h | Estoque reposto | 40 / 0 / 0 | 59 / 32 / 11 |
| R$ 12/h | Estoque reposto | 54 / 0 / 0 | 53 / 28 / 9 |
| R$ 18/h | Estoque reposto | 46 / 0 / 0 | 46 / 23 / 8 |
| R$ 26/h | Estoque reposto | 12 / 0 / 0 | 12 / 4 / 4 |
| R$ 12/h | Produtos a R$ 40 | 0 / 0 / 0 | 0 / 0 / 0 |
| R$ 12/h | Sem reposição | 12 / 10 / 15 | 12 / 10 / 15 |

Sem reposição, as três mercadorias terminaram com estoque zero dentro de três dias nos cenários R$ 8/h e R$ 12/h. Três dias correspondem a cerca de nove minutos reais no ritmo padrão, embora vendas e tempo de esgotamento variem por campanha.

No cenário gerenciado R$ 12/h após a correção, os 63 atendimentos foram: **5 de 30 minutos, 37 de 45, 19 de 60 e 2 de 90**. Antes também havia variedade: 1 / 43 / 17 / 1. O fluxo adicional pelos pontos de venda altera a circulação e, consequentemente, atendimentos/espera; estes resultados não garantem um percentual universal nem encerram o balanceamento.

## Verificação

```sh
npm test
npm run audit
node scripts/audit_customer_spending.mjs out/spending current
node scripts/capture_scene.mjs out/spending/scene
node scripts/capture_identity.mjs out/spending/ui
```

173 testes passaram, incluindo cinco regressões novas: bebida e alimento pela rota real; preço/orçamento/estoque impedindo segunda compra; doce substituindo salgadinho; retomada entre compras sem duplicação; preservação dos pacotes. O roteiro executa nove cenários de preço/operação e registra compras por mercadoria e durações em JSON. As capturas Chromium verificam a cena e a interface de preços/estoque. Auditorias econômicas anteriores descrevem seus respectivos commits: margens futuras devem considerar a nova possibilidade de consumo combinado.
