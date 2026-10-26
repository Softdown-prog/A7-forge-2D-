# Separação progressiva: interface x motor (LHS)

## Limite de responsabilidades

- `src/sim/`: regras, simulação, economia, save e validações. **Sem DOM** e sem depender dos componentes visuais.
- `src/render/`: Canvas 2D e geometria. Continua usando o estado da simulação no loop atual; a migração do render é independente da migração dos painéis.
- `src/application/`: adaptadores e *read models* tipados. É a única camada permitida a invocar mutações do motor para painéis já migrados. Não importa DOM.
- `src/ui/`: apresentação e eventos do usuário. Nos painéis migrados, recebe apenas DTOs e comandos, nunca `GameState` ou módulos `sim/*`.
- `src/main.ts`: composição, ciclo de vida, save e loop por enquanto; extração desse orquestrador fica para etapas seguintes.

## Primeiro recorte implementado

1. Mercadorias: `createMerchandisePort(() => game)` recebe um getter, importante quando um save é importado ou a nuvem troca a instância do estado. A UI consulta opções, preços, pedidos e resultados via contrato; não invoca `setMerchandisePrice` nem `orderMerchandise` diretamente.
2. Calendário/clima: `timeWeatherSnapshot(game)` projeta um DTO de leitura, e `renderTimeWeatherPanel` só mexe no DOM recebido.
3. HUD e manutenção dos PCs: `liveStatusSnapshot(game, internetName)` e `computerOperationsSnapshot(game)` fazem todos os cálculos de negócio fora de `ui/presentation.ts`; o módulo de apresentação só atualiza o DOM.
4. O tipo `ActorDirection` pertence a `sim/types.ts`; o renderizador continua reexportando o tipo para compatibilidade, sem que o motor importe o renderizador.
5. Os DTOs contêm primitivas e listas recém-construídas. Um componente não recebe a referência mutável de `game`.
6. `tests/ui-engine-boundary.test.mjs` protege os contratos e proíbe imports de `sim/` ou `render/` nos três módulos de UI migrados.

## Segunda etapa: precificação e eventos

- `src/application/pricingPort.ts` encapsula as ações de alterar a hora, a tarifa da PS1, preços de impressão, cópia de CD/DVD e produtos básicos, além da mudança irreversível de economia clássica para histórica.
- `src/ui/pricingControls.ts` registra eventos DOM e solicita comandos tipados pela porta; não conhece `GameState`, serviços da simulação nem salvamento.
- `src/main.ts` só injeta `() => game` e orquestra notificação, renderização e `save()`. Isso preserva saves substituídos por importação ou pela nuvem.
- As constantes de DOM `retailControls`, `printControls` e `discControls` permanecem no renderizador atual de `main.ts` até a extração das projeções desses painéis.
- `tests/pricing-ui-boundary.test.mjs` verifica deltas, valores inválidos, reentrada no histórico, save importado e ausência de imports diretos para simulação na UI.
- Não houve alterações na engine, na geometria do Canvas nem nos IDs de controles, inclusive os botões delegados usados no celular.

## Terceiro recorte: opiniões dos clientes

- `src/application/customerFeedbackSnapshot.ts` transforma a lista de avaliações e os totais de reputação em DTOs de apresentação.
- `src/ui/customerFeedbackPanel.ts` recebe somente `FeedbackSnapshot`, sem importar `GameState` ou funções de simulação.
- `src/main.ts` injeta o snapshot quando o painel de Finanças > Opiniões está ativo.
- O teste de fronteira garante ausência de imports diretos no presenter e que alterações nos DTOs não modificam a partida.

## Quarto recorte: estações e hardware

- `src/application/stationActionsPort.ts` centraliza a compra de kits de plataforma, peças, GPU, LCD, licenças Windows, reparo, upgrade CRT e energia, validando índice da estação e IDs de catálogo antes de chamar o motor.
- `src/ui/stationControls.ts` escuta os botões já existentes das abas de manutenção, GPUs e licenças; a UI só conhece uma porta tipada e callbacks de seleção/notificação.
- `src/main.ts` injeta `()=>game` para sempre alcançar a instância atual, inclusive após importar ou recuperar partidas da nuvem. Também preserva a sincronização entre seleção de GPU e estação.
- `tests/station-ui-boundary.test.mjs` cobre índices inválidos, catálogo, power toggle com save/restauração, delegação DOM e ausência de dependência direta da simulação.
- Os renderizadores Canvas, o layout de móveis, o formato do save e as regras de compra não foram modificados.

## Quinto recorte: serviços e funcionários

- `src/application/serviceActionsPort.ts` isola reposição de estoque rápido, fornecedor, panfletagem, internet, jogos, contratação/demissão e limpeza. Recebe `()=>game` para alcançar partidas importadas/restauradas.
- `src/ui/serviceControls.ts` associa os IDs atuais dos botões à porta, sem importar `sim/` nem calcular preços/folha de pagamento.
- Política legada de salvamento preservada: botões de contratação e demissão só persistem no êxito; as demais tentativas continuam notificando, redesenhando e salvando como anteriormente.
- `tests/service-ui-boundary.test.mjs` cobre migração de save, validação de entradas, ano de internet, conexão offline, botões desabilitados e política de persistência.
- Não foram alterados Canvas, navegação dos funcionários, RNG, conteúdo de saves ou lógica econômica.

## Sexto recorte: jogos por era e bancadas PlayStation

- `src/application/gameLicensingPort.ts`: contrato de aplicação para licenças de jogos por época e GPU, distribuição dos jogos entre computadores, instalação/remover e cancelamento de downloads. As validações definitivas e os débitos continuam no motor.
- `src/ui/gameLicensingControls.ts`: só associa os botões já existentes aos comandos, preservando a prioridade cancelar > instalar em todos > instalar/remover > licenciar.
- `src/application/ps1ActionsPort.ts`: compra de bancada, CD físico, troca de disco, segunda cadeira e manutenção. `discAt(index)` fornece apenas o valor atual para restaurar um seletor inválido.
- `src/ui/ps1Controls.ts`: manipula clique do CD na vitrine, seleção de disco e botões das bancadas. Ações das bancadas salvam somente em caso de sucesso; tentativas de compra continuam com salvamento e renderização como antes.
- `main.ts` apenas compõe os adaptadores e continua responsável pelo loop e pelo salvamento, sem passar `GameState` à UI migrada.
- `tests/game-console-ui-boundary.test.mjs`: cobre IDs inválidos, licenciamento e download, saves substituídos, compras e manutenção de PS1, além de delegação de eventos DOM. Os testes legados de GPU/jogos foram ajustados para exigir a porta, e não chamadas diretas do motor no `main.ts`.

## Sétimo recorte: compras da loja e correspondência

- `src/application/shopActionsPort.ts` centraliza computador, expansões, impressora, copiadora e bancada PS1; valida direções e consulta espaço livre antes de iniciar a colocação.
- `src/ui/shopControls.ts` apenas delega os botões `data-buy` ao motor via porta, ou ao estado visual de colocação. Preserva a navegação no celular e o listener separado de CDs da PS1.
- `src/application/noticeActionsPort.ts` oferece ações de abrir/revisar correio, decidir, ler e contratar programador, sempre lendo `()=>game`.
- `src/ui/noticeControls.ts` encapsula cliques e navegação do correio sem importar `sim/`.
- Layout, toque mobile, pathfinding, render Canvas, esquema de save e valores econômicos inalterados.

## Cuidados

- Não alterar IDs de elementos, esquema do save, RNG, tempo simulado ou política de autosave.
- Não adicionar Angular nem frameworks de interface nesta etapa: o contrato deve ser consumível por qualquer framework.
- Manter renderização de Canvas e posição das estações intactas.
- Novos painéis devem aceitar uma porta tipada (consulta/ação) em vez de chamar serviços do motor dentro de manipuladores de clique.
- Testar troca da instância de jogo, restrições de compra, UI de calendário com painel fechado/aberto, importação de saves e execução de testes completos.

## Próximos recortes

- Separar futuramente o editor de posicionamento, movimentação e divisórias, com teste real no celular antes de modificar gestos.
- Projeções do HUD e das áreas de administração sem `GameState` nos componentes.
- Sessão do jogo como fachada para novo jogo, importação, nuvem, loop e autosave, separando `main.ts` em bootstrap, controlador e render loop.
- Somente depois disso, considerar Angular, sem reescrever a simulação.
