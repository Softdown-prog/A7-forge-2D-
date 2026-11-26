# Retorno da troca de GPUs em 2025, 2028 e 2030

Lan House Simulator · 26/11/2026

## Cenários

A auditoria executa 24 simulações de 330 dias em modo histórico. Em cada
lançamento, duas sementes (23 e 137) comparam manter a GPU anterior ou
substituí-la no primeiro PC. O salão tem três PCs Arena 2024 com Windows 11,
internet nível 3 e os três jogos avançados licenciados. Todas as placas
envolvidas já executam esse catálogo. A troca cobra o preço integral da
nova GPU.

Cada par começa com os mesmos equipamentos, caixa e licenças pagos a
partir de R$ 100.000 de capital de teste. A comparação usa duas tarifas
fixas por par. Uma é o teto permitido antes da compra. A outra é 75%
desse teto, arredondado para baixo em intervalos de R$ 0,25. O motor
processa sessões, estoques, reparos e faturas. A janela de 330 dias
permite comparar 11 faturas quitadas, inclusive no ano final de 2030.
Os saves são exportados e reimportados no dia 150 e ao fim da simulação.

O resultado incremental é a diferença de caixa entre trocar e manter
a placa, depois dos custos de operação e da compra. A energia extra
vem das faturas pagas do salão. A auditoria acompanha as sessões e
sessões VIP da estação, a reputação final e o primeiro mês em que a
troca iguala ou supera o caixa de manter a placa anterior.

## Resultado em 330 dias

Valores médios das duas sementes. As diferenças comparam a troca
com manter a geração anterior à mesma tarifa.

| Troca | Tarifa por hora | Compra | Energia extra | Diferença de caixa |
| --- | ---: | ---: | ---: | ---: |
| 2023 → 2025 | R$ 11,00 | R$ 6.600,00 | R$ 181,00 | −R$ 6.781,00 |
| 2023 → 2025 | R$ 14,75 | R$ 6.600,00 | R$ 182,00 | −R$ 6.782,00 |
| 2025 → 2028 | R$ 9,50 | R$ 7.850,00 | R$ 205,50 | −R$ 8.055,50 |
| 2025 → 2028 | R$ 12,75 | R$ 7.850,00 | R$ 206,00 | −R$ 8.056,00 |
| 2028 → 2030 | R$ 8,25 | R$ 9.250,00 | R$ 222,50 | −R$ 9.472,50 |
| 2028 → 2030 | R$ 11,00 | R$ 9.250,00 | R$ 221,00 | −R$ 9.471,00 |

Nos 12 pares, trocar e manter produziram a mesma receita, o mesmo
número de atendimentos e a mesma contagem de sessões e sessões VIP
no PC comparado. A maior diferença média de reputação foi de 0,01
ponto, na tarifa de R$ 12,75 em 2028. As três trocas ficaram abaixo
do caixa do controle em todos os fechamentos mensais.

O resultado se aplica a substituir uma GPU já apta aos três jogos
avançados em um salão de três PCs. O teto é calculado antes da compra
e mantido no par para medir o efeito isolado da troca. A primeira compra
de GPU e uma mudança de catálogo são cenários distintos do recorte
medido aqui.

## Reprodução

Execute `npm run audit:gpu-modern` na pasta do jogo. O comando emite uma
linha `GPU_MODERN_CAMPAIGN` por comparação e uma linha
`GPU_MODERN_SUMMARY` por tarifa e geração.
