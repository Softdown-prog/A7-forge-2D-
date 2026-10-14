# Contabilidade por estação independente do catálogo de peças

Data: 14/10/2026 · Lan House Simulator

## Motivo

O jogo está evoluindo de upgrades genéricos, GPU e LCD para
montagens com CPU, placa-mãe, RAM, fonte, HD, SSD, placa de vídeo
e monitor. Os componentes individuais **ainda não estavam publicados
na main** durante esta etapa: não os duplicamos, simulamos ou sobrescrevemos.
A instrumentação financeira funciona com os equipamentos atuais
e continua útil após a publicação do trabalho em andamento pelo Codex.

## Indicadores realmente medidos

Cada PC acompanha, desde que a medição começou: sessões contratadas
e cobradas com sucesso; sessões VIP e sua receita; minutos realmente
no estágio `using`; e um **rateio contábil igualitário** da energia
por minuto que o motor já acrescentou ao custo energético geral.

A soma das cotas coincide com o consumo financeiro lançado no mesmo
período antes das contas mensais. Entretanto, **não mede watts por PC
nem consumo elétrico real de CPU, placa-mãe, memória, armazenamento,
fonte, GPU ou monitor**. O cálculo global original de energia é
preservado, inclusive com kits LCD, sem dupla cobrança.

A aba **Computadores** mostra por estação sessões, VIPs, uso,
receita de sessões, energia rateada e **saldo parcial**. Este
é apenas receita das sessões menos a cota de energia. Não é lucro,
não é retorno de investimento e não inclui compra de peças,
aluguel, licenças, internet, reparos ou custo de estoque.
Vendas de doces e bebidas seguem na contabilidade global,
sem atribuição especulativa a um computador.

## Compatibilidade

`stationLedger` é opcional para saves anteriores, validado e
persistido nos saves atuais. Saves antigos começam a coletar
a partir de agora; a história anterior não é reconstruída.
A inserção de um PC antes dos anexos desloca o contador existente,
e um PC novo inicia sem sessões nem custos registrados.

Não mudamos catálogos, preço, satisfação, RNG, regras de pagamento,
probabilidades de chegada, upgrades, GPU, LCD ou saves anteriores.
Quando o Codex publicar os componentes completos, conferir sua
modelagem, compatibilidades e energia por peça antes de evoluir
este rateio para custos reais por configuração.

## Validação

`npm test`, `npm run audit`, teste de save antigo/novo, realocação
no anexo e workers de cena/arte. Auditorias de 360 dias permanecem
sob demanda.
