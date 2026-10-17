# Estudo controlado de tarifas históricas dos jogos GPU

Este estudo **não altera as tarifas dos jogadores**. Ele utiliza o motor
econômico existente para comparar três tarifas *legais*, respeitando
automaticamente tanto o teto anual quanto a qualidade média dos PCs:

- **Referência:** R$ 2,50/h ou o limite da estação, se for menor.
- **Intermediária:** ponto médio entre referência e limite, arredondado
  para baixo em incrementos permitidos de R$ 0,25/h.
- **Máxima:** limite horário permitido por `allowableHourlyPrice()`.

Caso duas políticas produzam a mesma tarifa (por restrição de máquinas
antigas), isso deve ser visível no relatório, não mascarado por números
inventados. O adicional por jogo GPU continua limitado também pelo
teto **anual**, e pode cair quando a tarifa básica aumenta.

Cada política cobre os anos **2005, 2009 e 2013**, com **1 ou 2 PCs
compatíveis** (em três PCs originais), duas sementes fixas **23 e 137**,
e **com/sem licença** do título do ano. São **72 campanhas de 90 dias**.
Cada comparação usa hardware, Windows, capital de laboratório
(R$ 100 mil) e semente idênticos; a compra da licença é a única
diferença dentro do par. Estoque, manutenção, limpeza e atendimento
usam a implementação real do jogo.

### Como ler o resultado

O relatório separa preço solicitado/efetivo, teto permitido, sessões
com o jogo, procura, adicional arrecadado, cobertura nominal da licença,
atendimentos, desistências e diferença de saldo entre pares. A diferença
de saldo contém efeitos indiretos de satisfação, movimentação e custos
simulados; **não é lucro garantido de uma campanha real**, nem autoriza
recalibrar custos automaticamente.

Executar: `npm run audit:gpu-pricing`. O workflow armazena
`lhs-gpu-tariff-90day-audit` com o JSON dos 72 cenários, 36 pares e
18 médias. Na suíte curta (`npm test`) a mesma lógica corre por oito
dias para prevenir regressões rápidas.

**Pendências posteriores:** comparar uma campanha iniciada com os
R$ 850 reais do modo histórico; validar progressão natural de Windows,
computadores e licenças sem capital adiantado, e decidir se a demanda
de cada título justifica mudanças no preço da licença.
