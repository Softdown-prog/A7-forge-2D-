# Funcionários contratados: faxineiro e técnico

## Regras do LHS
- O jogador contrata ou dispensa cada funcionário em **Administração → Serviços**. Não existe adiantamento de salário.
- **Contrato mensal com diária apenas por dia efetivamente trabalhado**. Contratar não gera salário antecipado; a primeira diária surge quando o funcionário é despachado para uma ocorrência. Sem limpeza/reparo, não há diária. Dispensa e recontratação no mesmo dia nunca duplicam a cobrança de um dia de serviço.
- As diárias por dias de serviço se acumulam na folha e são pagas uma vez no fechamento de cada mês de 30 dias. Um chamado que atravessa a virada contabiliza um dia em cada ciclo; a diária do novo mês entra *depois* da cobrança do mês encerrado.
- Custos fictícios para balanceamento em 1998: **faxineiro R$ 7/dia trabalhado** (R$ 210 se trabalhar os 30 dias) e **técnico R$ 11/dia trabalhado** (R$ 330 se trabalhar os 30 dias). Partidas históricas indexam os valores pelo índice de preços do próprio simulador; no modo clássico eles ficam fixos. Esses números não representam salários oficiais históricos.
- Faxineiro contratado entra automaticamente quando uma lixeira chega a **75%** ou quando há lixo no chão, limpa e sai.
- Técnico contratado atende automaticamente **PC quebrado (100% de desgaste) e sem cliente**, um de cada vez. A próxima visita começa quando ele já saiu.
- Serviços realizados pelos contratados não cobram visita avulsa. Para quem não contratou, os antigos chamados avulsos continuam disponíveis.
- Os mesmos personagens, rotas, animações e tempos de serviço são reutilizados. O jogador não precisa contratar para progredir.

## Integração TypeScript
`src/sim/staff.ts`: contratação/dispensa, salários, último dia remunerado e validação.
`src/sim/services.ts`: detecta trabalho necessário e despacha os profissionais existentes, evitando visitas duplicadas.
`src/sim/engine.ts`: computa um dia extra para visitas ainda ativas ao virar a data, paga a folha no fechamento e preserva o funcionamento do simulador.
`src/sim/economy.ts`: inclui os salários realmente acumulados em `monthlyBills()`.
`src/main.ts` e `index.html`: botões para contratar/dispensar, diárias, contagem de dias efetivamente trabalhados, folha e serviços avulsos.

Os campos são opcionais no `GameState` e em saves antigos. Testes: `tests/employee-contracts.test.mjs`. Ainda é necessário verificar as telas e os movimentos no navegador real em desktop e celular, além de balancear os salários em campanhas longas.


## Migração de partidas antigas (16/10/2026)
- O campo opcional `employeeWorkedDays` conta os dias de serviço do ciclo atual (separados para faxineiro e técnico). Ele começa ausente em saves antigos; o painel mostra os dias registrados a partir da atualização, não reconstrói histórico impossível.
- A antiga folha `employeePayrollAccrued`, ainda não quitada, permanece integralmente devida. Não há estorno automático nem duplicação de diária já lançada, graças ao `employeeLastAccruedDay` existente.
- Serviços novos recebem `coveredByContract` booleano opcional. Visitas iniciadas como avulsas não viram serviços remunerados pelo contrato se o jogador contratar alguém no meio da visita. Jobs anteriores à atualização sem essa marca continuam válidos e são tratados conforme o contrato ativo.
- Funcionários contratados continuam aparecendo automaticamente ao detectar trabalho. Chamadas manuais pelo jogador também geram diária somente se forem cobertas por contrato; visitas avulsas permanecem cobradas à parte.
- A cobrança mensal não altera os valores de aluguel, energia, custos dos reparos avulsos nem remuneração acumulada em outros sistemas. Testes Node e Chromium desktop/mobile cobrem dias ociosos, simultaneidade, virada de mês, saves legados, dispensas e contratação durante visita avulsa.


## Estados visuais do atendimento — Etapa 3
- **A caminho:** o profissional caminha pela rota real até a lixeira ou estação, com uma pequena identificação sobre a cabeça e status visível em Administração → Serviços.
- **Limpando / Reparando:** ao alcançar o destino, o log anuncia o início; a barra de progresso já existente acompanha a ação no cenário. A Administração apresenta também a porcentagem e, para o técnico, o número do computador atendido.
- **Saindo:** depois de completar o serviço, o profissional usa o caminho existente até a porta. O status informa a saída; o histórico anterior já confirma lixeira limpa ou PC reparado.
- Quando não há chamado, o painel distingue **contratado aguardando necessidade** de **sem contrato**. O progresso é ocultado nos períodos de deslocamento e ociosidade.
- Dois reparos avulsos coexistentes são resumidos sem assumir que há vários técnicos contratados. Serviços em execução têm prioridade sobre chegada/saída na informação consolidada.
- As identificações são sobrepostas no Canvas e os resumos são derivados das fases já salvas. Nenhum novo campo de save, gasto, teleporte, fila, trabalhador ou colisão foi acrescentado.
- Regressão: `tests/staff-presentation.test.mjs` exercita os estados reais, inclusive navegação, conclusão, saves e contabilidade; `scripts/verify_staff_phases.mjs` verifica tela desktop/414/360 px, snapshots Canvas e acessibilidade básica dos indicadores.
