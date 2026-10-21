# Organização do runtime de personagens do LHS

Esta refatoração **move as implementações existentes sem modificar a política de decisões**. O ponto de entrada `src/sim/engine.ts` mantém a API pública anterior por reexports; scripts, testes e renderização continuam importando-o normalmente.

## Responsabilidades

| Arquivo | Responsabilidade |
| --- | --- |
| `simulationState.ts` | Estado inicial, relógio, dimensões, PCs, caixa de logs e sorteio determinístico existente |
| `customerMotion.ts` | Movimentação física, rotas, colisões, contorno da multidão e desvio para cadeira PS1 |
| `customerFlow.ts` | Reserva/seleção de computadores, circulação da fila, saída lateral do caixa, porta, fala e efeitos visuais |
| `customerArrival.ts` | Criação de visitantes comuns, impressão avulsa e cópia de discos |
| `customerDecisions.ts` | Atendimento no balcão, decisão de PC/PS1/pacote, verificação de orçamento, cobrança e compras |
| `customerLifecycle.ts` | Máquina de estados do visitante: chegar, esperar, usar, avaliar, comprar e sair |
| `engine.ts` | Coordenação do tempo, demanda, expediente, contabilidade mensal, validação de saves e avanços da simulação |

## Contrato de integração

- Um único `stepGame`/relógio e uma única representação de `GameState`; nenhuma engine paralela executa o personagem.
- Navegação, caixa, inventário, orçamento, PC/PS1 e avaliação foram **transferidos**, não reimplementados.
- Nenhuma mudança nos campos, versão ou formato de salvamento. O consumidor antigo da API `engine.ts` permanece compatível.
- Não adicionar novas decisões no `engine.ts` para perfis novos: primeiro observar `customerChoices.ts`, `customerDecisions.ts` e o ciclo em `customerLifecycle.ts`.
- Separação física dos arquivos não significa performance melhor por si só. Os módulos continuam processados por minuto do jogo, nunca por frame.
- Não foram adicionadas classes novas nem alteradas as probabilidades de chegada, preço, satisfação, procura e consumo.

## Validação exigida

Executar `npm test` (inclui build TypeScript e regressões), além dos cenários de caminhada, porta, filas, PS1, gastos e estoque do CI `lan-house-simulator.yml`. Comparar seeds idênticas antes e depois ao introduzir alterações comportamentais futuras.
