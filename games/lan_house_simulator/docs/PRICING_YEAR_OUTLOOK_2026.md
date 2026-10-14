# Leitura de preços e custo da virada de ano (14/10/2026)

## Objetivo

Continuar a auditoria após o commit `61af632` sem mudar a curva aprovada de procura,
as chances de chegada, as tarifas, o RNG, os dados persistidos ou o sistema de cobrança.
O painel agora dá ao jogador **informação comparativa**, não uma recomendação de lucro.

## Comparação de preços

A aba **Preços** calcula três possibilidades (atual − R$ 2, atual, atual + R$ 2).
Fora da faixa permitida de R$ 4 a R$ 40, não apresenta uma alternativa inválida.

- **Procura:** proporção da função `demandFactor` de cada alternativa em relação à
  tarifa atual, sob a **mesma** reputação, clima e conectividade.
- **Receita bruta potencial:** o fator de procura multiplicado pelo valor de uma
  sessão-padrão real de **45 minutos** (usando `sessionRevenue` e o arredondamento
  da simulação), também relativo à tarifa atual.
- São **índices relativos**, não resultados absolutos. Não consideram limite de PCs,
  filas, experiência dos clientes, duração variada de sessões, estoque, VIPs,
  manutenção, reputação futura ou despesas. Não são previsão de lucro.

Não há atualização automática de preço; o jogador continua decidindo pelo painel.

## Ano e energia

O calendário do jogo tem 360 dias por ano. `energyCostPerMinute` já multiplica
o consumo por `1.03 ^ min(25, anos decorridos desde 1998)`.
A aba **Finanças** mostra o percentual de alteração da tarifa energética entre
o início do ano atual e o início do seguinte, mantendo o **mesmo conjunto de PCs
e o mesmo consumo ocioso**. É cerca de +3% até atingir o teto de 25 reajustes,
a partir do qual a variação é 0%.

O aluguel, contrato de internet, manutenção básica e preços de atacado não recebem
inflação automática nesse motor. Lançamento de novas peças continua por ano de
disponibilidade, uma coisa diferente da inflação geral.

Ao cruzar a virada de ano, o motor calcula o último minuto de energia com o ano
anterior, paga a cobrança mensal acumulada, zera o medidor e só então usa a nova
tarifa nos minutos seguintes. O preço por hora é preservado, a menos que o jogador
o altere manualmente.

## Proteções

- `tests/pricing-insights.test.mjs`: índices coerentes com as fórmulas existentes,
  limites de R$ 4–40, ausência de efeitos colaterais, teto anual e IDs da interface.
- `tests/annual-pricing-transition.test.mjs`: cobrança e virada no minuto real,
  preservação dos preços, alteração manual e round-trip de save.
- `npm test` e o workflow **Lan House Simulator - worker pool** são as verificações
  previstas. Revisão humana em telefone físico ainda é necessária.

## Pendente

Esta etapa não substitui auditoria de **campanhas completas** com estratégias
dinâmicas, salões de sete ou mais computadores, estresse de clientes ou cenários
inflacionários alternativos. Não elevar custos artificialmente sem medir primeiro.
