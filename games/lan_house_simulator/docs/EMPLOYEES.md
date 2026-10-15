# Funcionários contratados: faxineiro e técnico

## Regras do LHS
- O jogador contrata ou dispensa cada funcionário em **Administração → Serviços**. Não existe adiantamento de salário.
- **Contrato remunerado por dia disponível**, inclusive quando não houve serviço. A primeira diária é acumulada na contratação. Dispensar interrompe novas diárias; recontratar no mesmo dia não duplica o pagamento.
- As diárias se acumulam na folha e são pagas uma vez no fechamento de cada mês de 30 dias. A diária do novo mês entra *depois* do pagamento do mês encerrado.
- Custos fictícios para balanceamento em 1998: **faxineiro R$ 210/mês (R$ 7/dia)** e **técnico R$ 330/mês (R$ 11/dia)**. Partidas históricas indexam os valores pelo índice de preços do próprio simulador; no modo clássico eles ficam fixos. Esses números não representam salários oficiais históricos.
- Faxineiro contratado entra automaticamente quando uma lixeira chega a **75%** ou quando há lixo no chão, limpa e sai.
- Técnico contratado atende automaticamente **PC quebrado (100% de desgaste) e sem cliente**, um de cada vez. A próxima visita começa quando ele já saiu.
- Serviços realizados pelos contratados não cobram visita avulsa. Para quem não contratou, os antigos chamados avulsos continuam disponíveis.
- Os mesmos personagens, rotas, animações e tempos de serviço são reutilizados. O jogador não precisa contratar para progredir.

## Integração TypeScript
`src/sim/staff.ts`: contratação/dispensa, salários, último dia remunerado e validação.
`src/sim/services.ts`: detecta trabalho necessário e despacha os profissionais existentes, evitando visitas duplicadas.
`src/sim/engine.ts`: atualiza os contratos na passagem de dia, paga a folha no fechamento e preserva o funcionamento do simulador.
`src/sim/economy.ts`: inclui os salários realmente acumulados em `monthlyBills()`.
`src/main.ts` e `index.html`: botões para contratar/dispensar, folha e serviços avulsos.

Os campos são opcionais no `GameState` e em saves antigos. Testes: `tests/employee-contracts.test.mjs`. Ainda é necessário verificar as telas e os movimentos no navegador real em desktop e celular, além de balancear os salários em campanhas longas.
