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

## Cuidados

- Não alterar IDs de elementos, esquema do save, RNG, tempo simulado ou política de autosave.
- Não adicionar Angular nem frameworks de interface nesta etapa: o contrato deve ser consumível por qualquer framework.
- Manter renderização de Canvas e posição das estações intactas.
- Novos painéis devem aceitar uma porta tipada (consulta/ação) em vez de chamar serviços do motor dentro de manipuladores de clique.
- Testar troca da instância de jogo, restrições de compra, UI de calendário com painel fechado/aberto, importação de saves e execução de testes completos.

## Próximos recortes

- Extração do restante das ações de preço, hardware e compras de `main.ts` para controladores de aplicação.
- Projeções do HUD e das áreas de administração sem `GameState` nos componentes.
- Sessão do jogo como fachada para novo jogo, importação, nuvem, loop e autosave, separando `main.ts` em bootstrap, controlador e render loop.
- Somente depois disso, considerar Angular, sem reescrever a simulação.
