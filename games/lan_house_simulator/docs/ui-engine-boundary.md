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

## Oitavo recorte: editor de móveis e divisórias

- `src/application/layoutEditorPort.ts` disponibiliza objetos editáveis, divisórias, posições, limites do salão, validações e comandos de mover e remover. Busca sempre a partida corrente e delega a validação ao motor.
- `src/ui/layoutEditor.ts` recebe apenas essa porta tipada. Não importa nem acessa `GameState`, `sim/editableObjects`, `sim/walls` ou `sim/shop`.
- `src/main.ts` injeta o callback de câmera `cameraForGame`, preservando a projeção isométrica no render. A camada de aplicação não depende do Canvas.
- O bloco de `pointerdown`, `pointercancel`, `pointerup` e `click` foi preservado **byte a byte**: o limite de 10 pixels, o controle de scroll e a prevenção do click duplicado de 650 ms continuam iguais.
- A escolha de coordenadas para móveis e paredes mantém as fórmulas existentes. Nenhum arquivo da simulação nem formato de save foi alterado.

## Nono recorte: construção e instalação

- `src/application/placementActionsPort.ts` concentra comandos de colocar, girar e reposicionar decoração, construir/remover paredes, instalar/remover portas e instalar PCs nos anexos.
- `src/main.ts` mantém o mesmo canvas, hit testing, raio de toque, zoom e eventos do editor móvel. Agora só chama a porta tipada para operações e consultas de segmentos.
- Os custos, validações de colisão, circulação, disponibilidade e salvamento continuam no motor original. A porta usa `()=>game` após importar saves.

## Décimo recorte: sessão e arquivos de partida

- `src/application/gameSessionPort.ts` coordena leitura do armazenamento local, recuperação do backup, clamp ao carregar saves antigos, criação de campanhas, persistência, substituição atômica, validação de importação JSON e preparação de exportação. Continua delegando as regras originais a `sim/localSave.ts` e `sim/saveTransfer.ts`.
- `src/ui/saveFileControls.ts` trata clique de download, seletor de arquivos, tamanho máximo de 2 MB e mensagens. Não importa `GameState` nem módulos `sim/`.
- `src/main.ts` preserva transições de menu, animações, notificação, confirmação antes de substituir e o contrato de save local/nuvem. Todo comando acessa a partida atual via `()=>game`.
- A troca explícita grava no navegador antes de atribuir `game`. Falhas não substituem a partida visível, nem removem backups fora das políticas existentes.

## Décimo primeiro recorte: menu e transições de partida

- `src/ui/gameMenuControls.ts` registra eventos dos botões Nova Partida, Continuar, Reiniciar, Opções, Som e Voltar ao menu. Ele apenas manipula DOM e chama callbacks, sem acessar `sim/` ou `GameState`.
- `createMenuScreens` gerencia visibilidade do menu/jogo, disponibilidade de Continuar/Exportar e painéis auxiliares. `main.ts` mantém parada de áudio, persistência antes de sair, reinício das animações e baseline de correspondência.
- Nova partida histórica e reinício clássico continuam distintos, incluindo confirmação e tratamento de falha de armazenamento. `sessionPort.replace` persiste antes da troca de `game`.
- Eventos de Canvas, touch, autosave, áudio do jogo e esquema de salvamento permanecem iguais.

## Décimo segundo recorte: relógio de frames e revisão de painéis

- `src/application/frameSchedule.ts` controla exclusivamente as cadências visuais: delta máximo de 80 ms, tempo acumulado, pintura de até 30 FPS no celular, prévia ornamental do menu com intervalo superior a 90 ms e atualização do HUD após 450 ms sem rolagem/toque recente.
- `src/application/panelRevisionCache.ts` mantém a igualdade por `JSON.stringify` dos painéis de loja, avisos, hardware e licenças, incluindo opção de forçar atualização.
- `src/main.ts` continua responsável pelo `requestAnimationFrame`, pelo `stepGame`, pela captura do estado de movimento, pelos sons, pela renderização Canvas e pelo autosave a cada 8 segundos.
- Eventos de toque e os limiares mobile não foram modificados. O relógio da prévia do menu só é atualizado após desenho bem-sucedido.
- Seis testes em `tests/frame-scheduling-boundary.test.mjs` cobrem FPS, tempo, modal, rolagem, toque, cache, menu e fronteira de dependências.

## Décimo terceiro recorte: feedback de áudio e efeitos de quadros

- `src/application/frameFeedbackPort.ts` drena eventos de pagamento, venda, impressão, teclado e falas por uma API tipada que recebe as filas visuais e uma interface mínima de áudio.
- `src/main.ts` mantém a ordem anterior dos efeitos, os contadores, a detecção de novas cartas, desenho do Canvas e as regras de pausa e salvamento.
- São mantidos 12 popups financeiros e 8 falas. Uma venda confirmada toca o áudio mesmo com posição visual ausente. Impressora e teclado validam IDs inteiros.
- A porta usa `()=>game` para acompanhar restores de save, sem acoplar ao objeto de `Soundscape`. Não foram alterados RNG, economia, formato do save ou gestos mobile.
- Testes em `tests/frame-feedback-boundary.test.mjs` protegem esses contratos.

## Décimo quarto recorte: administração PS1

- `src/application/ps1AdminPort.ts` produz snapshots somente-leitura de preço por hora, bancadas, CDs, sessões, desgaste, ocupação, segunda cadeira e ações habilitadas. O estado é resolvido via `()=>game`, inclusive depois de importar saves.
- `src/ui/ps1AdminPanel.ts` renderiza a aba Console/Estações só a partir dessa projeção. Mantém IDs, classes e atributos `data-ps1-repair`, `data-ps1-slot`, `data-ps1-second-seat` usados nos cliques.
- `src/main.ts` passa apenas a porta e callbacks de apresentação, preservando os outros painéis, a política de abas, Canvas e mobile. Nenhuma mudança nas regras de PS1 ou esquema de save.

## Décimo quinto recorte: indicadores de download dos jogos GPU

- `src/application/gpuDownloadMetersPort.ts` calcula, a partir do save corrente, banda disponível, downloads ativos, pausas e progresso sem mutação.
- `src/ui/gpuDownloadMeters.ts` atualiza apenas os elementos `data-gpu-download-status`, `data-gpu-download-progress` e `data-gpu-bandwidth`; não recria o catálogo e preserva foco, toque e rolagem no celular.
- `main.ts` injeta a nova porta de leitura. Instalação, cancelamento, preços, simulação, RNG e esquema de save não foram alterados.
- `tests/gpu-download-ui-boundary.test.mjs` cobre progresso, pausa, importação de save, aba oculta e a fronteira de dependências.

## Décimo sexto recorte: licenças Windows por computador

- `src/application/windowsLicensePort.ts` projeta licenças, compatibilidade, custos e bloqueios por ano, energia, ocupação, manutenção e saldo a partir da partida corrente.
- `src/ui/windowsLicensePanel.ts` apresenta os controles com os mesmos `data-win-pc` / `data-win-edition` e aplica `syncPanelChildren`, preservando o comportamento do painel mobile.
- O `main.ts` conserva o gatilho por aba e `panelChanged`; as regras de compra, estado do motor e formato do save permanecem intactos.

## Décimo sétimo recorte: contabilidade financeira por computador

- `src/application/stationLedgerPort.ts` projeta sessões, sessões VIP, minutos ocupados, faturamento, rateio de energia e saldo por PC sem entregar referências mutáveis do save.
- `src/ui/stationLedgerPanel.ts` conserva a tabela acessível (`th scope="row"`), formatação pt-BR e `syncPanelChildren`, sem ler diretamente a simulação.
- `main.ts` só injeta a porta e chama o renderizador quando Computadores > Contabilidade está ativo. Nenhuma mudança nas regras financeiras, no Canvas, toque, RNG ou esquema de save.
- `tests/station-ledger-boundary.test.mjs` verifica dados, importação de partida, cópias primitivas e dependências das camadas.

## Décimo oitavo recorte: indicadores financeiros do mês

- `src/application/monthlyFinancePort.ts` consulta a partida atual e projeta ocupação, último comprovante pago, histórico mensal e recomendação de expansão, sem alterar valores ou saves.
- `src/ui/monthlyFinancePanel.ts` atualiza apenas os nós existentes, mantendo IDs e a apresentação original e sem recriar controles nem modificar a navegação mobile.
- `main.ts` injeta `()=>game` e usa o renderizador somente na aba Finanças, preservando o filtro de visibilidade de `setText`.
- `tests/monthly-finance-boundary.test.mjs` verifica formatação, totais, save substituído, DOM estável e separação das camadas. O teste financeiro legado passa a verificar o novo apresentador.
- Simulação, RNG, cobranças, Canvas, autosave e formato de save permanecem inalterados.

## Décimo nono recorte: status e custo da panfletagem

- `src/application/promotionStatusPort.ts` projeta custo, condição de contratação e mensagens a partir da partida ativa, sem modificar a economia.
- `src/ui/promotionStatusPanel.ts` atualiza `promotion-description`, `promotion-status` e o mesmo botão `#launch-promotion`, sem recriar o DOM nem trocar seu listener.
- `src/main.ts` continua responsável pela aba de Finanças e injeta a porta com `()=>game` para reconhecer saves importados.
- As ações de compra continuam em `serviceActionsPort` e `serviceControls`, com a política anterior de save.
- `tests/promotion-status-boundary.test.mjs` verifica preço clássico/histórico, caixa, 20h29/20h30, encerramento, save importado, botão persistente e fronteira sem dependência do motor.
- Não se alteraram motor, RNG, preços, calendário, Canvas, navegação mobile ou formato de save.

## Vigésimo recorte: demonstrativo de caixa e aviso da fatura

- `src/application/financialBalancePort.ts` projeta saldo, entradas, saídas, reconciliação e próxima fatura sem modificar o save, consultando os serviços existentes do motor.
- `src/ui/financialBalancePanel.ts` atualiza os elementos existentes e preserva classes de prejuízo, avisos de discrepância e alerta de fatura a até sete dias da cobrança.
- `main.ts` mantém o filtro de abas, o estado injetado por `()=>game`, o Canvas e os demais painéis sem alteração de regra.
- `tests/financial-balance-boundary.test.mjs` cobre caixa, dívida, formato pt-BR, alerta, datas, restauração de saves e dependências de camadas.
- Antes deste recorte foi corrigido o teste legado `historical-promotion-pricing-roi.test.mjs`: o worker-simulation da etapa anterior falhava por procurar um trecho removido intencionalmente de `main.ts` na 19ª etapa.

## Vigésimo primeiro recorte: equipe, atividade e limpeza

- `src/application/staffStatusPort.ts` reúne o estado somente-leitura de funcionários, diárias, trabalhos, progresso, lixeiras, caixa e custo da limpeza, sempre a partir da partida corrente.
- `src/ui/staffStatusPanel.ts` usa exclusivamente o snapshot para atualizar os controles existentes, os indicadores de progresso e textos, mantendo os listeners e a rolagem mobile.
- `src/main.ts` injeta `()=>game`, preserva a entrada na aba Serviços e mantém o painel de rotas de acesso separado.
- `tests/staff-status-boundary.test.mjs` verifica contrato, saldo insuficiente, atendimento em andamento, importação de save, progresso e estabilidade do DOM.
- Ações de contratação e limpeza seguem em `serviceActionsPort.ts`, sem alteração de regras, salários, jornadas, RNG, Canvas ou esquema de save.

## Vigésimo segundo recorte: comparador de preços e energia na virada do ano

- `src/application/pricingInsightsPort.ts` projeta procura relativa, avaliação da tarifa, cautelas, comparação de cenários e tarifa futura de energia consultando a partida corrente.
- `src/ui/pricingInsightsPanel.ts` atualiza apenas os textos existentes, sem operações sobre o motor e sem recriação de nós ou alteração de gestos mobile.
- `src/main.ts` preserva o filtro da aba Preços/Análise para as simulações de tarifa; previsão energética continua atualizada como antes.
- `tests/pricing-insights-boundary.test.mjs` verifica cenários clássicos/históricos, limites, formatação, ausência de mutação, restauração de saves e contratos entre módulos.
- `tests/pricing-insights.test.mjs` atualiza somente as verificações de integração para o módulo novo, sem reduzir a cobertura numérica do motor.
- Não altera preço cobrado, RNG, Canvas, relógio, atendimento, esquema de saves ou navegação mobile.

## Vigésimo terceiro recorte: controles de tarifa por hora e pacotes

- `src/application/hourlyPriceStatusPort.ts` calcula somente leituras de tarifa atual, teto anual e do hardware, IPCA, bloqueio de botões e preços por duração a partir do save atual.
- `src/ui/hourlyPriceStatusPanel.ts` apresenta os textos e atualiza os botões existentes sem recriar os controles; recria apenas as linhas da lista de pacotes quando o cache de revisão já permite.
- `src/main.ts` mantém `clampPriceToEra(game)` e a política de refresh de `panelChanged("durations",...)`, injetando `()=>game` para trocar saves sem referências antigas.
- `tests/hourly-price-status-boundary.test.mjs` valida modos clássico/histórico, teto de preço, IPCA, pacotes, troca de save, DOM estável e fronteira entre camadas.
- `tests/historical-economy.test.mjs` confere o novo módulo em vez do cálculo legado em `main.ts`.
- Sem mudanças no fluxo de cobrança, manipulação de preços, RNG, Canvas, gestos mobile ou formato de salvamento.

## Vigésimo quarto recorte: preços rápidos de mercadorias

- `src/application/retailPriceStatusPort.ts` projeta os três preços de venda (refrigerantes, doces e salgadinhos), rótulos e travas entre R$ 1 e R$ 40 a partir da partida atual, sem editar preços.
- `src/ui/retailPriceControlsPanel.ts` monta o painel provisório com os mesmos atributos `data-item`, `data-delta`, textos, ícones e botão para abrir o catálogo.
- `main.ts` preserva o cache `panelChanged("retail",...)` e usa o mesmo `syncPanelChildren` para manter o contêiner e o listener delegado de `pricingControls.ts` no mobile.
- `tests/retail-price-status-boundary.test.mjs` protege preços de motor, travas, save importado, DOM, eventos delegados e separação das camadas.
- Os testes da 23ª etapa foram corrigidos antes desta alteração: a tarifa histórica mínima real é R$ 0,50 e a verificação de fronteira confundiu um comentário com dependência de código.
- Sem alterações em preços de compra/venda, margens, faturamento, RNG, Canvas ou formato de save.

## Vigésimo quinto recorte: preços de impressão e de cópias

- `src/application/deskPricingPort.ts` fornece projeções de preços, limites, custo dos insumos, resultado operacional e recuperação de investimento.
- `src/ui/deskPricingPanel.ts` atualiza os botões já conhecidos dos listeners delegados e mantém `syncPanelChildren` para evitar perder rolagem e foco.
- `src/main.ts` preserva os filtros das subabas e esconde os serviços ainda não comprados.
- `tests/desk-pricing-boundary.test.mjs` verifica limites, margens, economia clássica/histórica, importação de save e controles DOM.
- Não foram alterados RNG, motor econômico, cobrança, Canvas, gestos mobile ou estrutura do save.

## Vigésimo sexto recorte: fornecedor, estoque rápido e conexão de internet

- `src/application/commerceNetworkPort.ts` prepara um DTO somente de leitura com o fornecedor atual, custos dos três lotes, estado e tipo de conexão, liberação por ano, custo da melhoria e preço do técnico.
- `src/ui/commerceNetworkPanel.ts` atualiza os textos e os três botões existentes, sem recriar elementos, instalar listeners ou alterar o foco mobile.
- `src/main.ts` injeta `()=>game`, preservando a instância após importação e delegando toda ação de fornecedor, estoque, upgrade e reparo ao `serviceActionsPort.ts`.
- `tests/commerce-network-boundary.test.mjs` cobre os anos 1998/2002/2007, tarifas, falta de caixa, desconexão, técnico, fornecedor parceiro, importação de saves e estabilidade do DOM.
- Sem alterar regras de contratação, upgrades, despesas, preços, RNG, Canvas, gestos ou esquema de save.

## Vigésimo sétimo recorte: operação e manutenção por computador

- `src/application/pcOperationsPort.ts` calcula somente snapshots de estado ligado, desgaste, reparos, disponibilidade de upgrades, custo do técnico e progresso do atendimento.
- `src/ui/pcOperationsPanel.ts` gera os mesmos controles `data-pc-power`, `data-pc-repair` e `data-pc-upgrade`, incluindo progresso e `data-panel-key`.
- `main.ts` continua responsável por `panelChanged("computers",...)`, `syncPanelChildren`, troca de abas e recuperação de foco após atualização LCD.
- `tests/pc-operations-boundary.test.mjs` protege a contratação avulsa, bloqueio por ocupação, preço e ano de hardware, passagem de save e renderização de controles.
- Sem alterar ações de estação, RNG, Canvas, editor de móveis, navegação touch nem formato do save.

## Vigésimo oitavo recorte: catálogo e seleção de monitores LCD

- `src/application/lcdMonitorsPort.ts` projeta estações disponíveis, LCD instalado, bônus, catálogo das cinco gerações e motivos de bloqueio por ano, hardware, ocupação, energia e caixa. Não compra nem altera kits.
- `src/ui/lcdMonitorsPanel.ts` preserva os mesmos cartões, imagem procedural existente, `data-lcd-select`, `data-lcd-buy`, `aria-pressed` e estado dos botões.
- `main.ts` conserva `selectedLcdPc`, `panelChanged("computers",...)`, geração cacheada das miniaturas, `syncPanelChildren` e recuperação de foco sem rolagem no mobile.
- `tests/lcd-monitors-boundary.test.mjs` valida desbloqueios, custos, geração anterior, ocupação, seleção, save e DOM, sem tocar nas compras do motor.
- Sem alterações no motor econômico, gestos touch, Canvas do salão, regras de compra, RNG ou estrutura de save.

## Vigésimo nono recorte: catálogo de placas de vídeo

- `src/application/gpuCatalogPort.ts` consulta somente o estado atual e projeta GPUs por ano, fonte necessária, bônus, preço, bloqueios e placa instalada.
- `src/ui/gpuCatalogPanel.ts` mantém `data-gpu-select`, `data-gpu-buy`, `aria-pressed`, imagens e reconciliação `syncPanelChildren` sem importar motor.
- `main.ts` preserva `panelChanged("gpuPcChoice",...)`, seleção sincronizada, callbacks de compra e controle mobile; não calcula mais custos e margens das GPUs.
- `tests/gpu-catalog-boundary.test.mjs` cobre desbloqueio, fonte, geração anterior, saldo, técnico, ocupação, importação de saves e os botões.
- Sem mudanças em compras, motor, RNG, editor do salão, Canvas ou estrutura dos saves.

## Trigésimo recorte: catálogo de jogos clássicos e de rede local

- `src/application/classicGamesCatalogPort.ts` concentra o resumo de licenças permanentes, status de cada título, popularidade por época, preços e elegibilidade por contrato básico e Windows, sem comprar nada.
- `src/ui/classicGamesCatalogPanel.ts` gera as mesmas capas, seções por ano, classes, botões `data-era-game-buy` e títulos de indisponibilidade, sem importar o motor.
- `src/main.ts` mantém os filtros das abas, `panelChanged("eraGamePanel",...)`, `syncPanelChildren` e os handlers em `gameLicensingControls.ts`, preservando foco, rolagem e compatibilidade touch.
- `tests/classic-games-catalog-boundary.test.mjs` cobre 1998, 1999, a novidade do Eric em 2000, contratos básicos, Windows, nostalgia, saves e fidelidade do DOM.
- O teste estrutural anterior em `tests/era-games-1998-1999.test.mjs` passa a verificar o cálculo na porta, sem deixar de validar o fluxo de compra.
- Sem alterações em compras, RNG, motor, Canvas, editor, mensalidades ou estrutura de save.

## Trigésimo primeiro recorte: administração de jogos avançados com GPU

- `src/application/gpuGamesCatalogPort.ts` projeta o catálogo de títulos com GPU, pagamentos de licenças, requisitos Windows/GPU, downloads em andamento, condições de instalação, demanda real e cobertura nominal do investimento.
- `src/ui/gpuGamesCatalogPanel.ts` mantém os mesmos atributos `data-gpu-game-buy`, `data-gpu-game-install`, `data-gpu-game-cancel`, `data-gpu-game-install-all`, indicadores de progresso e reconciliação de nós.
- `main.ts` conserva o invalidatório da aba, `installGameLicensingControls`, a atualização de downloads em tempo real via `refreshGpuDownloadMeters` e o controle de estado dos saves.
- Testes `tests/gpu-games-catalog-boundary.test.mjs` e testes legados revisados protegem os textos e regras no novo limite arquitetural.
- Sem alterações nas funções de compra, distribuição gratuita, banda, pausa, RNG, Canvas, controles touch ou estrutura do save.

## Trigésimo segundo recorte: status de regularização de jogos

- `src/application/basicGamesLicenseStatusPort.ts` projeta o custo, saldo e licença única e permanente no modo clássico/histórico sem editar a partida.
- `src/ui/basicGamesLicenseStatusPanel.ts` atualiza `#license-status` e `#license` mantendo a compra pelo controle existente.
- `main.ts` continua com os avisos do correio e controles de licenciamento; a apresentação do status de contrato saiu do loop principal.
- `tests/basic-games-license-status-boundary.test.mjs` tem seis cenários e `tests/basic-games-license.test.mjs` agora valida os novos arquivos.
- Sem alterar compra, cálculo de IPCA, RNG, saves, Canvas ou controles touch.

## Trigésimo terceiro recorte: caixa de correspondências

- `src/application/noticeInboxPort.ts` projeta cartas, botões e motivos de indisponibilidade sem modificar o estado.
- `src/ui/noticeInboxPanel.ts` conserva as classes, os ícones, o botão de leitura e os identificadores das ações e das decisões.
- O fluxo `installNoticeControls` continua responsável por compras, decisões, leitura e salvamento; `main.ts` preserva os avisos de cartas não lidas e o cache de atualização.
- `tests/notice-inbox-boundary.test.mjs` cobre alertas Windows, jogos, segurança, Bombeiros, propostas, saves e DOM.
- Sem alterações no sistema de eventos narrativos, fiscalizações, RNG, motor, Canvas ou gestos touch.

## Trigésimo quarto recorte: histórico recente dos acontecimentos

- `src/application/eventLogPort.ts` projeta até seis eventos recentes, preservando ordem e assinatura JSON, além do dia/horário, sem mutar o estado.
- `src/ui/eventLogPanel.ts` mostra os mesmos itens `li`, ícones, textos e elementos `time`, sem importar simulação ou registrar eventos.
- `main.ts` conserva o cache `lastEventSignature` e só redesenha o histórico quando os seis registros visíveis mudam.
- `tests/event-log-boundary.test.mjs` adiciona oito verificações para ícones, datas, limite, integridade do save, importação e DOM.
- Sem modificar o motor, RNG, áudio, autosave, Canvas, editor ou gestos mobile.

## Trigésimo quinto recorte: resumo financeiro e atendimentos

- `src/application/financialAdminOverviewPort.ts` projeta aluguel, internet, manutenção, energia, salários, contas, atendimentos por serviço e entradas/saídas, preservando a inflação e o modo clássico.
- `src/ui/financialAdminOverviewPanel.ts` atualiza os mesmos nós e rótulos, sem ler o estado do motor nem criar DOM.
- `main.ts` continua com o demonstrativo, os fechamentos mensais, o editor e as rotinas de cobrança originais.
- `tests/financial-admin-overview-boundary.test.mjs` inclui oito casos sobre custos históricos, PlayStation, serviços avulsos, troca de save e fronteiras da UI.
- Sem alterações em RNG, preço cobrado, saves, áudio, Canvas ou gestos mobile.

## Trigésimo sexto recorte: avisos de circulação no salão

- `src/application/serviceAccessStatusPort.ts` recebe as ocorrências já calculadas pelo motor e prepara o número de bloqueios, destinos e orientação para abrir passagens.
- `src/ui/serviceAccessStatusPanel.ts` atualiza o painel administrativo, o botão de inspeção e a barra de marcações sobre o Canvas, sem modificar as rotas.
- `main.ts` preserva o cache de 1,6 s, o comando para inspecionar o salão e o desenho real de bloqueios no Canvas.
- `tests/service-access-status-boundary.test.mjs` acrescenta sete verificações para textos, destinos, botões, cache, save e isolamento da interface.
- Não há mudanças no algoritmo de caminhada, colisões, manutenção, funcionários, RNG ou salvamento.

## Trigésimo sétimo recorte: manutenção sem perda de foco

- `src/ui/pcMaintenancePanel.ts` concentra o ciclo de criação offscreen, decoração e reconciliação dos controles de manutenção, preservando scroll e foco em botões hardware e LCD.
- `main.ts` continua responsável pelas escolhas de estação, consultas do motor, contexto da página e invalidatório `panelChanged("computers",...)`; as ações reais permanecem em `installStationControls`.
- Os cenários legados de LCD e operação foram adaptados à nova fronteira; `tests/pc-maintenance-boundary.test.mjs` verifica nove casos de foco, seleção, atualização e ausência de re-renderização de negócio.
- Não há mudança em preços, instalação de peças, desgaste, rota de técnicos, Canvas, RNG ou estrutura de saves.

## Trigésimo oitavo recorte: mensagens e botões da organização do salão

- `src/application/placementStatusPort.ts` projeta estado dos botões e textos para colocar móveis, girar, reorganizar, construir divisórias, portas e instalar PCs anexos, sem mutações.
- `src/ui/placementStatusPanel.ts` aplica os textos e os estados na barra, nos controles existentes e na classe do palco sem tratar compras ou colisões.
- `main.ts` conserva a validação `placementActions.canBuild`, os comandos do Canvas, os gestos touch, preços originais e chamadas de save.
- `tests/placement-status-boundary.test.mjs` adiciona dez verificações de modos, botões, DOM, economia, save e limites arquiteturais.
- Sem mudanças nas regras de giro, compra, instalação, colisão, RNG ou cronologia.

## Trigésimo nono recorte: visibilidade e contador de correspondência

- `src/application/noticeWindowStatusPort.ts` lê a contagem original de cartas não lidas e projeta a janela aberta/fechada sem modificar o estado.
- `src/ui/noticeWindowStatusPanel.ts` atualiza os IDs `notices`, `notices-count` e `open-notices`, mantendo `hidden` e `aria-expanded`.
- `main.ts` preserva a leitura e as decisões, a ação de abrir o Correio, o painel de cartas, os listeners e o save anterior.
- `tests/notice-window-status-boundary.test.mjs` adiciona oito verificações para contagem, abertura, fechamento, estado importado e DOM.
- Sem alterar o calendário das cartas, o motor, o RNG, as compras ou o Canvas.

## Quadragésimo recorte: exibição e controles de serviços do balcão

- `src/ui/deskPricingPanel.ts` assume a exibição dos setores de CDs/DVDs e impressão, reaproveitando as projeções de `deskPricingPort` e os renderizadores de botões já testados.
- `main.ts` informa apenas qual aba está selecionada, quais hosts DOM existem e quais mecanismos de reconciliação usar. Relatórios e controles só são calculados quando o serviço está instalado e a aba correspondente está ativa.
- `tests/desk-pricing-services-boundary.test.mjs` acrescenta onze verificações sobre serviços ausentes, páginas fechadas, preços reais, importação de saves, DOM e fronteira de dependências.
- `tests/desk-pricing-boundary.test.mjs` continua validando a apresentação dos dois preços e aponta para o novo ponto de integração.
- Nenhuma regra de preço, compra, material, demanda avulsa, limite diário, RNG, Canvas ou save foi alterada.

## Quadragésimo primeiro recorte: elegibilidade do frame e pausa durante edição

- `src/application/frameActivity.ts` isola os critérios puros que permitem avançar a simulação e capturar movimento enquanto a partida está aberta, sem DOM, Canvas ou motor.
- `main.ts` conserva a ordem original: calcula a elegibilidade, reinicia interpolação quando a condição muda, captura posições antes de `stepGame`, e mantém áudio, HUD e salvamento existentes.
- Correção dos dois testes da 40ª etapa: verificação de abas refatoradas e copiadora adquirida somente após desbloqueio histórico, sem alterações de regras de jogo.
- `tests/frame-activity-boundary.test.mjs` adiciona dez testes, incluindo todas as 256 combinações dos oito estados e a distinção entre fim do movimento e finalização da campanha.
- Sem alteração de FPS, velocidade do relógio, eventos, RNG, política de autosave, formato de save ou gestos mobile.

## Quadragésimo segundo recorte: prévias e camadas de desenho do salão

- `src/render/interactionOverlays.ts` centraliza somente a apresentação das prévias de móveis, reposicionamento, divisórias, portas, PCs anexos e destaque do editor, sem mutar o estado do motor.
- A pintura continua em duas fases: o destaque do editor aparece antes dos popups, enquanto as prévias de compra, giro, parede e PC anexo permanecem depois, conservando a ordem visual.
- `main.ts` conserva gestos touch, `pointermove`, `click`, estado da seleção, comandos da simulação, `SceneRenderer` e controle de FPS.
- `tests/interaction-overlays-boundary.test.mjs` cobre treze cenários de visibilidade, ordem, orientação, fallback de parede, demolição, PC anexo e compatibilidade de saves.
- `tests/simulation.test.mjs` foi atualizado em commit anterior para verificar a porta `frameActivitySnapshot` sem exigir a expressão antiga de pausa no bootstrap.
- Nenhum limite de colisão, posição, cobrança, RNG, save, autosave ou tempo simulado foi modificado.

## Quadragésimo terceiro recorte: monitor de interação para o HUD

- `src/ui/frameInteractionTracker.ts` recebe os mesmos eventos de rolagem, `pointerdown`, `pointerup`, `pointercancel` e perda de foco, mantendo captura, listeners passivos e relógio `performance.now()`.
- `main.ts` continua responsável por agendamento, simulação, observador de visibilidade do Canvas e salvamento, mas consulta um snapshot de atividade visual em vez de manter três variáveis e seus listeners diretamente no bootstrap.
- `tests/frame-interaction-tracker-boundary.test.mjs` adiciona treze verificações dos sinais mobile, ordem e opções de eventos, integridade de saves e limites originais de 450/160/120 ms para atualizar o HUD.
- Gestos touch do editor, cancelamento, `click` de compatibilidade, tempo da simulação, FPS, RNG e formato do save não foram modificados.

## Quadragésimo quarto recorte: catálogo de CDs físicos do PS1

- `src/application/ps1ShopDiscPort.ts` fornece uma projeção somente-leitura dos CDs físicos, preços reais, cópias, elegibilidade, dinheiro e limites; acompanha o save importado.
- `src/ui/ps1ShopDiscCatalog.ts` renderiza os cinco cartões, capas SVG e botões `data-buy-ps1-disc` com o mesmo `dataset.buyPs1Disc` e os mantém imediatamente após a bancada PS1.
- `main.ts` deixa de construir os cartões e mantém as compras delegadas ao `shopControls` existente, sem instalar listeners adicionais.
- `tests/ps1-shop-disc-boundary.test.mjs` cobre doze casos de desbloqueio, valores, limite, importação, estrutura DOM e ligação entre camadas.
- Nenhuma regra de compras, demanda, ano 2002, preço, save, RNG ou Canvas foi alterada.

## Quadragésimo quinto recorte: seleção da posição de PS1 na loja

- `src/application/ps1ShopPlacementPort.ts` projeta os pontos livres da bancada e nomes compreensíveis, consultando sempre o save corrente.
- `src/ui/ps1ShopPlacementPicker.ts` renderiza setas, o seletor oculto `ps1-placement`, o texto acessível e a orientação do salão, sem conhecer o motor.
- O `main.ts` conserva a elegibilidade e a cobrança histórica; o `shopControls` mantém o mesmo clique de compra e o mesmo ID técnico de destino.
- `tests/ps1-shop-placement-boundary.test.mjs` adiciona doze verificações de setas, re-render, espaço ocupado, expansão, importação e separação de dependências.
- Nenhuma regra de venda, saldo, preço, save, RNG, simulação ou gesto mobile foi alterada.

## Quadragésimo sexto recorte: ofertas dos serviços na loja

- `src/application/shopServiceOffersPort.ts` consulta o save corrente, preços e cotações da impressora e copiadora e projeta somente o estado do botão, rótulo e explicação.
- `src/ui/shopServiceOfferButton.ts` aplica as propriedades ao botão existente sem importar o motor.
- `main.ts` preserva os cartões, ilustrações e o clique delegado ao `shopControls`, mas deixa de consultar diretamente as cotações dos dois serviços.
- `tests/shop-service-offers-boundary.test.mjs` cobre 1998/2001, limites de saldo, compra única, modo clássico, importação e independência entre interface e motor.
- Nenhuma regra de compra, preço, RNG, save, Canvas ou gesto mobile foi alterada.

## Quadragésimo sétimo recorte: resumo da loja e do salão

- `src/application/shopOverviewPort.ts` centraliza a projeção somente-leitura da quantidade de objetos organizáveis, divisórias/portas removíveis, dinheiro, PCs, medidas do salão, ampliação por direção e número de salas. Consulta o save ativo em cada atualização.
- `src/ui/shopOverviewPanel.ts` atualiza os mesmos IDs `organize-furniture`, `demolish-walls` e `shop-cash`, sem importar o motor ou registrar ouvintes.
- `main.ts` conserva `panelChanged("shop")`, os eventos de organização/demolição, a compra, a rolagem e o Canvas, delegando apenas o texto e estado do resumo.
- `tests/shop-overview-boundary.test.mjs` verifica textos originais, dinheiro, capacidades, expansão oeste/leste/norte, divisórias, save importado, DOM e limites de dependência.
- Nenhuma regra de compra, preço, geração de cliente, RNG, save, autosave ou gesto mobile foi alterada.

## Quadragésimo oitavo recorte: oferta da bancada de PlayStation na loja

- `src/application/ps1ShopOfferPort.ts` projeta a disponibilidade e a descrição do botão de compra da bancada PS1 a partir do save ativo: modo histórico, 2002, três bancadas, vagas livres e saldo.
- `src/ui/ps1ShopOfferButton.ts` atualiza somente o texto e a habilitação do botão, preservando o atributo `data-buy="ps1"` e o evento delegado ao controlador da loja.
- `main.ts` deixa de calcular essas condições e mantém o seletor de posições e a montagem visual já separados nos recortes anteriores.
- `tests/ps1-shop-offer-boundary.test.mjs` cobre 14 casos, incluindo ano, modo clássico, dinheiro, limites, vagas ocupadas, saves importados, DOM e dependências.
- Nenhuma regra do motor, preço, venda, save, RNG, Canvas, autosave ou controle de toque foi alterada.

## Quadragésimo nono recorte: montagem visual dos cartões e miniaturas da loja

- `src/ui/shopCatalogCard.ts` cria os mesmos artigos, títulos, rótulos, ícones e botões de compra, além de centralizar o cache das miniaturas em Canvas da impressora, copiadora e PlayStation 1.
- A interface conserva a ordem dos elementos, `data-buy`, `data-item`, `aria-hidden`, dimensões 640×360 das miniaturas e o seletor de PS1 já separado.
- `main.ts` continua projetando preços, vagas e elegibilidade, além de gerenciar o clique delegado em `shopControls`, mas deixa de construir nós do catálogo e desenhar miniaturas.
- `tests/shop-catalog-card-boundary.test.mjs` acrescenta doze testes para montagem DOM, ícones, miniaturas, cache, rótulos, indicadores de móveis e fronteiras das camadas.
- Sem mudança de compra, economia, save, RNG, simulação, gestos mobile ou arte do jogo.

## Quinquagésimo recorte: ofertas comuns da loja e correção de regressão

- `src/application/shopCatalogOffersPort.ts` projeta de forma somente-leitura as ofertas comuns da loja: preço, dinheiro, disponibilidade, limites de PC principal, vagas em anexos, direções de expansão, divisórias e decoração; acompanha a instância ativa do save.
- `src/application/shopCatalogGuidance.ts` guarda as mensagens e rótulos existentes; `src/ui/shopGuidance.ts` mantém exportações compatíveis com consumidores e testes antigos.
- `src/ui/shopCatalogOfferButton.ts` aplica somente texto e estado do botão, sem importar o motor; as ofertas especializadas de PS1, copiadora e impressora continuam com prioridade.
- `main.ts` apenas compõe as portas, mantém a ordem dos cartões e o clique delegado ao `shopControls`, sem calcular os limites no renderizador.
- `tests/shop-catalog-offers-boundary.test.mjs` inclui dezesseis verificações de equivalência com o cálculo anterior, expansões, saldos, vagas, móveis, serviços, save importado e fronteiras entre camadas.
- Corrigido o stub de DOM de `tests/shop-catalog-card-boundary.test.mjs` para reproduzir `replaceChildren()`, que limpa conteúdo e `innerHTML` no navegador real; isso resolve a falha de um teste no 49º recorte.
- Nenhuma regra de compra, colisão, RNG, autosave, desenho da cena ou gesto mobile foi alterada.

## Quinquagésimo primeiro recorte: atualização e acessibilidade do shell administrativo

- `src/ui/adminShell.ts` centraliza a atualização dos rótulos visíveis em Administração, com as mesmas verificações de subpágina oculta, elemento inexistente e texto inalterado. Mantém o formato monetário brasileiro e o estado `hidden`/`aria-expanded` das janelas.
- `main.ts` deixa de manter a função DOM de `setText`, o formatador de valores e as atribuições diretas de visibilidade/atributos, mas conserva ordem, condições de render, eventos, abas e todos os ports de simulação.
- `tests/admin-shell-boundary.test.mjs` acrescenta doze testes de DOM, subpáginas ocultas, atualização sem repetição, formato `pt-BR`, acessibilidade e fronteira UI/motor.
- Corrigido `tests/shop-catalog-offers-boundary.test.mjs`: o cenário que exige botão de PC disponível agora cria primeiro uma vaga na área principal, removendo a falsa expectativa responsável pelo único teste falho do recorte 50.
- Não foram alterados o motor, a lógica de vendas, os saves, a geração aleatória, o Canvas, os preços ou os gestos mobile.

## Quinquagésimo segundo recorte: renderizador administrativo de preços

- `src/ui/adminPricingSections.ts` agrupa as atualizações de preço por hora, pacotes, análise da tarifa, projeção de energia e preços rápidos de produtos com as mesmas condições de aba ativa, disponibilidade de elementos e revisão de dados.
- `main.ts` mantém o ajuste de tarifas de saves legados (`clampPriceToEra`), os ports do save atual, o controle de revisão e a seção de impressão/copiadora, mas delega a apresentação dos preços a um único módulo tipado.
- `tests/admin-pricing-sections-boundary.test.mjs` acrescenta doze testes de subpáginas, reconstrução condicional, textos, botões, ícones, variação histórica/clássica e preservação das fronteiras UI/motor.
- Os testes arquiteturais de hora, cenários de tarifa e varejo passam a verificar a nova localização dos renderizadores, mantendo as mesmas exigências de integração e de revisão.
- Nenhum cálculo de economia, regra de compra, estado de save, gesto mobile ou desenho de Canvas foi alterado.

## Quinquagésimo terceiro recorte: composição dos painéis de Finanças

- `src/ui/adminFinanceSections.ts` coordena apresentação de caixa, despesas, balanço, opiniões dos clientes, contas mensais, atividade e panfletagem por meio de portas somente-leitura.
- Mantidas duas fases de atualização: resumo do caixa antes de preços e computadores; atividade e mensalidade depois das demais áreas.
- Opiniões só são consultadas quando Finanças > Opiniões está ativa e a revisão mudou; aviso de fechamento só é consultado na página Balanço.
- `tests/admin-finance-sections-boundary.test.mjs` acrescenta doze testes de visibilidade, ordem, acessibilidade, preservação dos nós e limites de dependência.
- Nenhuma regra da economia, save, aleatoriedade, Canvas, compras ou interface de toque foi alterada.

## Quinquagésimo quarto recorte: páginas de operação, manutenção e hardware dos computadores

- `src/ui/adminComputerSections.ts` coordena a tabela de receita por PC, as páginas de operação, hardware, Windows e monitores, preservando o container destacado, a reconciliação DOM e o foco do painel `pcMaintenancePanel`.
- `main.ts` continua com os cálculos, a instância ativa, a revisão dos painéis, a seleção da estação e os controladores delegados; a interface usa apenas callbacks para montar as páginas.
- `tests/admin-computer-sections-boundary.test.mjs` acrescenta quatorze casos de abas abertas/fechadas, ledger, revisões, seleção, montagem destacada, reconciliação e fronteiras entre UI e motor.
- Os testes antigos de integração de PC, LCD e receita por estação devem apontar para o novo módulo sem perder as verificações de foco e compatibilidade.
- Corrigido antes deste recorte o teste legado de panfletagem que ainda exigia o renderizador financeiro dentro de `main.ts`.
- Nenhuma lógica de compra, manutenção, desgaste, energia, saves, RNG, renderização Canvas ou toque foi modificada.

## Quinquagésimo quinto recorte: GPU e licenças de jogos

- `src/ui/adminGpuLicenseSections.ts` coordena as telas da GPU, licenças Windows, catálogo clássico, catálogo de jogos avançados e atualizações de download a partir de portas somente-leitura, mantendo os elementos e seletores existentes.
- `main.ts` guarda o estado da partida, seleção de PC e as assinaturas de revisão, mas não organiza diretamente a apresentação desses catálogos.
- Os controles de compra de GPU, instalação, licenciamento e cancelamento continuam nas portas e handlers delegados existentes; os downloads continuam a progredir com o painel fechado.
- `tests/admin-gpu-license-sections-boundary.test.mjs` cobre doze casos de abas, revisão, seleção, limites, progresso e fronteira UI/motor.
- Testes de integração anteriores passam a verificar os métodos nas novas camadas, evitando falsas regressões por mudanças de localização.
- Sem alteração de preços, licenças, calendário, saves, RNG, Canvas, filas ou gestos mobile.

## Quinquagésimo sexto recorte: consoles, equipe e diagnóstico de acesso

- `src/ui/adminServicesConsoles.ts` reúne a apresentação de PlayStation, estado dos funcionários e relatório de acesso ao salão por portas somente-leitura, sem importar regras do motor.
- A inspeção de rotas mantém sua chamada **sob demanda**, somente quando Administração > Serviços > Acesso está aberta; o overlay no Canvas permanece externo e não foi alterado.
- As bancadas PlayStation continuam sendo reconstruídas apenas quando sua subpágina está ativa. Botões já registrados para serviços e PS1 são mantidos.
- `tests/admin-services-consoles-boundary.test.mjs` acrescenta treze testes das abas, preços, estados, medidores, bloqueios e isolamento do motor.
- A falha legada do teste de licença básica do 55º recorte foi corrigida no commit imediatamente anterior.
- Nenhuma economia, IA dos clientes, save, RNG, geometria, arte Canvas ou toque mobile foi modificada.

## Cuidados

- Não alterar IDs de elementos, esquema do save, RNG, tempo simulado ou política de autosave.
- Não adicionar Angular nem frameworks de interface nesta etapa: o contrato deve ser consumível por qualquer framework.
- Manter renderização de Canvas e posição das estações intactas.
- Novos painéis devem aceitar uma porta tipada (consulta/ação) em vez de chamar serviços do motor dentro de manipuladores de clique.
- Testar troca da instância de jogo, restrições de compra, UI de calendário com painel fechado/aberto, importação de saves e execução de testes completos.

## Próximos recortes

- Incrementar testes automatizados de toque mobile e projeção isométrica no editor sem alterar seus limiares de gesto nem o canvas.
- Projeções do HUD e das áreas de administração sem `GameState` nos componentes; dividir o renderizador administrativo grande em atualizações menores.
- Concluir a separação do loop (efeitos/audio/render), do bootstrap e dos renderizadores administrativos, preservando o motor e o save.
- Somente depois disso, considerar Angular, sem reescrever a simulação.
