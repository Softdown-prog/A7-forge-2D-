# Relatório da refatoração arquitetural consolidada

## Diagnóstico e resultado

Base examinada: `main` em `b73c5aa9ce2f41fbe7802d43053e575c5abf131a`, incluindo documento arquitetural anterior, backlog e commits recentes. Os oito workflows recentes pertinentes da base estavam aprovados. A suíte inicial passou: **1.534 aprovados, zero falhas, nove ignorados intencionalmente** (1.543 testes).

A arquitetura anterior já tinha portas e coordenadores úteis, que foram preservados. O `main.ts`, com 817 linhas, ainda possuía a sessão ativa, composição de painéis, save, estado visual, eventos de Canvas, picking, inicialização e frame. Havia imports do render no motor, ciclos entre catálogos/comandos e quatro componentes DOM que ainda recebiam dados/regras do motor.

Agora `main.ts` apenas importa e executa `bootstrapGame`. Sessão e comandos pertencem à aplicação; DOM e estado visual à UI; cena, câmera, interpolação e overlays ao render; capacidades de plataforma e montagem ao bootstrap. Os testes verificam **zero ciclos executáveis**, motor/aplicação compiláveis **sem DOM** e nenhum import direto de `sim/` na UI. Consulte [a arquitetura final](ui-engine-boundary.md) para os contratos e a ordem de execução.

## Validações reproduzíveis

Executar a partir de `games/lan_house_simulator`.

| Verificação | Resultado local |
| --- | --- |
| `npm ci` | Instalação limpa concluída |
| `npm run build` | Compilação TypeScript e distribuição estática aprovadas |
| `npm run typecheck` | Projeto estrito com imports/argumentos não usados proibidos; motor/aplicação sem DOM aprovados |
| `npm test` | **1.569 testes: 1.560 aprovados, 0 falhas, 9 ignorados intencionalmente** |
| Quatro replays da base, três dias cada | Hash SHA-256 integral idêntico nos modos clássico/histórico, sementes 72421/1543 |
| Fronteiras por módulo | 834 verificações aprovadas antes da validação integral |
| Novos contratos e composição | Atomicidade, getter vivo de todas as portas, transientes, ordem de frame, pausas e Storage bloqueado aprovados |
| `npm run build:site` + `npm run check:site` | 13 páginas, jogo, 14 HTML, 481 referências locais, 280 módulos válidos |
| `node scripts/verify_layout_editor.mjs out/refactor-layout-final` | 1440/414/360 px, mover/girar PC, paredes, remoções, persistência e orientação; zero erros JS |
| `node scripts/verify_mobile_interface.mjs out/refactor-mobile` | 1280/414/360 px, scroll nativo, controles estáveis, CPU 4× mais lenta em mobile, áudio aprovado; zero overflow/erros JS |
| `node scripts/verify_save_on_menu.mjs out/refactor-save` | 1280/414 px: save imediato no menu, pagehide e reload; 11 minutos simulados preservados em cada cenário |
| `node scripts/verify_hardware_ui.mjs out/refactor-hardware` | Seis cenários: 1440/414/360 px × anos 2000/2024; compras, requisitos, recarga, foco e overflow aprovados |
| `node scripts/verify_integrated_engine_campaign.mjs out/refactor-integration` | 35 dias: 1.019 clientes atendidos, 61 sessões PS1, 1.557 compras, 30 dias com entregas, salários/serviços e conta mensal conciliados |
| Cenário integrado de lotação | 360 minutos, 18 atendimentos, 17 saídas e 27 vendas; save e caixa válidos |

Os comandos de build não substituem a suíte. Os nove casos ignorados são campanhas opcionais anuais, históricas, crescimento (dois casos), promoções, hardware e VIPs controladas pelas flags existentes. As auditorias GPU adicionais do worker de simulação continuam habilitadas no CI. Nenhum teste foi desabilitado, marcado para pular ou convertido em sucesso artificial nesta refatoração.

O workflow existente **Lan House Simulator - worker pool** roda no PR em três jobs: simulação, cena/site/Chromium e Forge. O resultado do head publicado fica registrado nos checks do PR e é informado na entrega; a tabela acima registra as execuções locais. Não foram alterados workflows de publicação, VPS, credenciais ou configuração de produção.

O primeiro CI do PR encontrou um bloqueio de ambiente no workflow de navegação da conta: `ubuntu-latest` selecionou Ubuntu 26.04, incompatível com Playwright 1.56.1. O build e os 31 testes Node desse job passaram, mas o navegador não chegou a instalar. O runner **desse teste** foi fixado em Ubuntu 24.04, a mesma versão já usada pelos jobs Canvas/mobile. Não houve atualização de Playwright nem mudança em deploy.

## Problemas encontrados e tratados

- Dependência de `sim/` em `render/direction` e ciclos envolvendo eras, hardware, layout e comandos: consultas/fundamentos puros foram extraídos com reexports de compatibilidade. Grafo executável agora acíclico.
- Hardware, painel de sexta, HUD noturno e conta/nuvem ainda acoplados ao estado do motor: substituídos por DTOs e comandos tipados; demais portas existentes reutilizadas.
- Asserções estruturais exigindo comportamento em `main.ts`: migradas para o proprietário real. Ligações e ordem usam AST quando apropriado, além dos testes funcionais existentes e novos. Inclui os quatro arquivos destacados na solicitação e toda a família de catálogo/atualização da loja.
- Interpolação, seleção, prévias, rascunho do editor e cache de circulação podiam sobreviver a uma troca de partida. O protocolo único de substituição agora limpa esses dados sem aplicar uma ação ao save novo.
- Imports e função privada de reparo obsoletos foram removidos; regras de reparo continuam no serviço atual. TypeScript agora impede novas declarações/imports sem uso.
- Acesso precoce ao getter de Storage durante composição foi evitado; a recuperação existente continua funcionando em navegação restrita.

Não foi reproduzida regressão econômica de compra do sexto/sétimo PC nem de instalação em anexo na base atual. Os testes agora exercitam esses casos pela aplicação, incluindo recarga de save e recusa de compra acima do limite, sem alterar as regras. A regressão antiga de móveis em mobile também não foi reproduzida: foram preservados os handlers existentes e ampliada a cobertura de toque prolongado, cancelamento, scroll vertical/horizontal, duplicação de click, confirmação e orientação. Arrastos de navegação continuam sem movimentar/comprar objetos.

## Saves, visual e limites da verificação

Chaves, formato, envelope, dados persistidos e preferência de áudio foram preservados. Importar prepara a candidata e só troca o estado depois de gravar; uma falha de quota mantém o estado anterior e não notifica os adaptadores. As portas retidas são comparadas contra a nova partida, sem mutação por consultas. Importação local, nuvem e nova campanha compartilham esse mecanismo.

Não houve substituição de renderer, sprites, objetos, cores ou mecânicas. As alterações em desenho existentes removem apenas declarações/imports sem uso; as novas composições reutilizam os renderizadores. Ritmo de simulação, ordem do frame, limites de repaint, gestos e consumo dos efeitos foram mantidos.

Aparelho físico, aprovação artística e uma restauração autenticada em serviço online real não foram validados nesta execução; o navegador é Chromium com mobile emulado. As APIs de conta continuam cobertas por testes existentes, sem uso de credenciais ou alteração de saldo real. As campanhas opcionais ignoradas na suíte padrão continuam disponíveis pelos comandos do projeto, sem serem apresentadas como executadas.

## Inventário completo de módulos

Módulos TypeScript: **77**, sendo **29 criados** e **48 modificados**. Nenhum módulo foi removido; as fachadas públicas anteriores foram mantidas quando necessário.

### Motor, geometria e dependências

- Modificado: [src/sim/computerModels.ts](../src/sim/computerModels.ts).
- Modificado: [src/sim/crowdNavigation.ts](../src/sim/crowdNavigation.ts).
- Modificado: [src/sim/customerDecisions.ts](../src/sim/customerDecisions.ts).
- Modificado: [src/sim/customerFlow.ts](../src/sim/customerFlow.ts).
- Modificado: [src/sim/customerMotion.ts](../src/sim/customerMotion.ts).
- Criado: [src/sim/direction.ts](../src/sim/direction.ts).
- Modificado: [src/sim/economy.ts](../src/sim/economy.ts).
- Modificado: [src/sim/editableObjects.ts](../src/sim/editableObjects.ts).
- Modificado: [src/sim/engine.ts](../src/sim/engine.ts).
- Modificado: [src/sim/era.ts](../src/sim/era.ts).
- Criado: [src/sim/eraCatalog.ts](../src/sim/eraCatalog.ts).
- Modificado: [src/sim/eraGames.ts](../src/sim/eraGames.ts).
- Modificado: [src/sim/financialClarity.ts](../src/sim/financialClarity.ts).
- Modificado: [src/sim/financialReview.ts](../src/sim/financialReview.ts).
- Modificado: [src/sim/fridayMeetup.ts](../src/sim/fridayMeetup.ts).
- Criado: [src/sim/furnitureLayout.ts](../src/sim/furnitureLayout.ts).
- Criado: [src/sim/gameDefaults.ts](../src/sim/gameDefaults.ts).
- Modificado: [src/sim/gpu.ts](../src/sim/gpu.ts).
- Modificado: [src/sim/gpuGames.ts](../src/sim/gpuGames.ts).
- Modificado: [src/sim/hardware.ts](../src/sim/hardware.ts).
- Modificado: [src/sim/historicalEconomy.ts](../src/sim/historicalEconomy.ts).
- Criado: [src/sim/layoutGeometry.ts](../src/sim/layoutGeometry.ts).
- Modificado: [src/sim/multiplayerVisitors.ts](../src/sim/multiplayerVisitors.ts).
- Modificado: [src/sim/navigation.ts](../src/sim/navigation.ts).
- Modificado: [src/sim/pricingInsights.ts](../src/sim/pricingInsights.ts).
- Modificado: [src/sim/ps1.ts](../src/sim/ps1.ts).
- Modificado: [src/sim/retailQueue.ts](../src/sim/retailQueue.ts).
- Modificado: [src/sim/serviceAccess.ts](../src/sim/serviceAccess.ts).
- Criado: [src/sim/serviceLayout.ts](../src/sim/serviceLayout.ts).
- Modificado: [src/sim/services.ts](../src/sim/services.ts).
- Modificado: [src/sim/shop.ts](../src/sim/shop.ts).
- Modificado: [src/sim/simulationState.ts](../src/sim/simulationState.ts).
- Criado: [src/sim/stationLayout.ts](../src/sim/stationLayout.ts).
- Modificado: [src/sim/stationPower.ts](../src/sim/stationPower.ts).
- Modificado: [src/sim/stations.ts](../src/sim/stations.ts).
- Modificado: [src/sim/walls.ts](../src/sim/walls.ts).
- Modificado: [src/sim/workerNavigation.ts](../src/sim/workerNavigation.ts).

### Contratos, casos de uso e sessão

- Criado: [src/application/accountGamePort.ts](../src/application/accountGamePort.ts).
- Criado: [src/application/contracts.ts](../src/application/contracts.ts).
- Criado: [src/application/fridayMeetupPort.ts](../src/application/fridayMeetupPort.ts).
- Criado: [src/application/gameApplication.ts](../src/application/gameApplication.ts).
- Criado: [src/application/gameFramePort.ts](../src/application/gameFramePort.ts).
- Criado: [src/application/gamePorts.ts](../src/application/gamePorts.ts).
- Criado: [src/application/hardwarePanelPort.ts](../src/application/hardwarePanelPort.ts).
- Criado: [src/application/mailNotifications.ts](../src/application/mailNotifications.ts).
- Modificado: [src/application/merchandisePort.ts](../src/application/merchandisePort.ts).
- Criado: [src/application/nightPresentation.ts](../src/application/nightPresentation.ts).
- Criado: [src/application/nightTournamentHudPort.ts](../src/application/nightTournamentHudPort.ts).

### DOM, controles e estado visual

- Modificado: [src/ui/cloudControls.ts](../src/ui/cloudControls.ts).
- Modificado: [src/ui/fridayMeetupPanel.ts](../src/ui/fridayMeetupPanel.ts).
- Criado: [src/ui/gameElements.ts](../src/ui/gameElements.ts).
- Criado: [src/ui/gamePanels.ts](../src/ui/gamePanels.ts).
- Modificado: [src/ui/hardwarePanel.ts](../src/ui/hardwarePanel.ts).
- Modificado: [src/ui/layoutEditor.ts](../src/ui/layoutEditor.ts).
- Modificado: [src/ui/menuPreviewPainter.ts](../src/ui/menuPreviewPainter.ts).
- Modificado: [src/ui/nightTournamentHud.ts](../src/ui/nightTournamentHud.ts).
- Criado: [src/ui/placementController.ts](../src/ui/placementController.ts).
- Criado: [src/ui/runtimeControls.ts](../src/ui/runtimeControls.ts).
- Criado: [src/ui/runtimeLoop.ts](../src/ui/runtimeLoop.ts).
- Criado: [src/ui/runtimeSessionController.ts](../src/ui/runtimeSessionController.ts).
- Criado: [src/ui/runtimeUiState.ts](../src/ui/runtimeUiState.ts).
- Modificado: [src/ui/serviceAccessInspectionCache.ts](../src/ui/serviceAccessInspectionCache.ts).

### Canvas, picking e apresentação

- Modificado: [src/render/actorArt.ts](../src/render/actorArt.ts).
- Modificado: [src/render/direction.ts](../src/render/direction.ts).
- Criado: [src/render/gameScene.ts](../src/render/gameScene.ts).
- Modificado: [src/render/isometric.ts](../src/render/isometric.ts).
- Criado: [src/render/menuPreviewPainter.ts](../src/render/menuPreviewPainter.ts).
- Modificado: [src/render/nightPrizePresentation.ts](../src/render/nightPrizePresentation.ts).
- Modificado: [src/render/nightReopening.ts](../src/render/nightReopening.ts).
- Modificado: [src/render/premiumRoomArt.ts](../src/render/premiumRoomArt.ts).
- Modificado: [src/render/ps1Art.ts](../src/render/ps1Art.ts).
- Modificado: [src/render/scene.ts](../src/render/scene.ts).
- Criado: [src/render/scenePicking.ts](../src/render/scenePicking.ts).

### Compatibilidade de eventos de áudio

- Modificado: [src/audio/mailNotification.ts](../src/audio/mailNotification.ts).

### Composição e capacidades do navegador

- Criado: [src/bootstrap/bootstrapGame.ts](../src/bootstrap/bootstrapGame.ts).
- Criado: [src/bootstrap/browserServices.ts](../src/bootstrap/browserServices.ts).

### Ponto de entrada

- Modificado: [src/main.ts](../src/main.ts).

### Configuração e validação

- `.github/workflows/lhs-account-navigation.yml`: runner de testes fixado em Ubuntu 24.04 para compatibilidade com o Playwright existente.
- `tsconfig.engine.json` e `types/headless-runtime.d.ts`: compilação sem navegador.
- `tsconfig.json`: flags de declarações e parâmetros sem uso.
- `package.json`: comando `typecheck`; teste inclui a compilação sem DOM.
- `scripts/verify_layout_editor.mjs`: regressão de mudança de orientação em mobile.
- `tests/fixtures/architecture-baseline-b73c5aa.json`: baseline capturado antes de mudar o motor.
- `tests/helpers/sourceGraph.mjs`: imports/AST e componentes fortemente conectados.
- `tests/helpers/composition.mjs`: verificação do proprietário real de chamadas e de sua ordem.
- `tests/simulation-foundation-boundary.test.mjs`, `tests/remaining-panel-contracts.test.mjs`, `tests/application-composition.test.mjs`, `tests/runtime-composition.test.mjs`: novas verificações funcionais e de arquitetura.

Arquivos de teste existentes atualizados (somente expectativas de arquitetura e reforço de regressões):

- [tests/admin-area-tabs-boundary.test.mjs](../tests/admin-area-tabs-boundary.test.mjs).
- [tests/admin-computer-sections-boundary.test.mjs](../tests/admin-computer-sections-boundary.test.mjs).
- [tests/admin-finance-sections-boundary.test.mjs](../tests/admin-finance-sections-boundary.test.mjs).
- [tests/admin-gpu-license-sections-boundary.test.mjs](../tests/admin-gpu-license-sections-boundary.test.mjs).
- [tests/admin-hardware-revisions-boundary.test.mjs](../tests/admin-hardware-revisions-boundary.test.mjs).
- [tests/admin-panel-revisions-boundary.test.mjs](../tests/admin-panel-revisions-boundary.test.mjs).
- [tests/admin-pricing-sections-boundary.test.mjs](../tests/admin-pricing-sections-boundary.test.mjs).
- [tests/admin-services-consoles-boundary.test.mjs](../tests/admin-services-consoles-boundary.test.mjs).
- [tests/admin-shell-boundary.test.mjs](../tests/admin-shell-boundary.test.mjs).
- [tests/basic-games-license-status-boundary.test.mjs](../tests/basic-games-license-status-boundary.test.mjs).
- [tests/basic-games-license.test.mjs](../tests/basic-games-license.test.mjs).
- [tests/classic-games-catalog-boundary.test.mjs](../tests/classic-games-catalog-boundary.test.mjs).
- [tests/commerce-network-boundary.test.mjs](../tests/commerce-network-boundary.test.mjs).
- [tests/desk-pricing-boundary.test.mjs](../tests/desk-pricing-boundary.test.mjs).
- [tests/desk-pricing-services-boundary.test.mjs](../tests/desk-pricing-services-boundary.test.mjs).
- [tests/era-games-1998-1999.test.mjs](../tests/era-games-1998-1999.test.mjs).
- [tests/event-log-boundary.test.mjs](../tests/event-log-boundary.test.mjs).
- [tests/event-log-refresh-boundary.test.mjs](../tests/event-log-refresh-boundary.test.mjs).
- [tests/feedback-popup-painter-boundary.test.mjs](../tests/feedback-popup-painter-boundary.test.mjs).
- [tests/financial-admin-overview-boundary.test.mjs](../tests/financial-admin-overview-boundary.test.mjs).
- [tests/financial-balance-boundary.test.mjs](../tests/financial-balance-boundary.test.mjs).
- [tests/financial-review.test.mjs](../tests/financial-review.test.mjs).
- [tests/frame-activity-boundary.test.mjs](../tests/frame-activity-boundary.test.mjs).
- [tests/frame-event-dispatch-boundary.test.mjs](../tests/frame-event-dispatch-boundary.test.mjs).
- [tests/frame-feedback-boundary.test.mjs](../tests/frame-feedback-boundary.test.mjs).
- [tests/frame-interaction-tracker-boundary.test.mjs](../tests/frame-interaction-tracker-boundary.test.mjs).
- [tests/frame-presentation-coordinator-boundary.test.mjs](../tests/frame-presentation-coordinator-boundary.test.mjs).
- [tests/frame-scheduling-boundary.test.mjs](../tests/frame-scheduling-boundary.test.mjs).
- [tests/frame-simulation-coordinator-boundary.test.mjs](../tests/frame-simulation-coordinator-boundary.test.mjs).
- [tests/frame-viewport-state-boundary.test.mjs](../tests/frame-viewport-state-boundary.test.mjs).
- [tests/frame-visual-layers-boundary.test.mjs](../tests/frame-visual-layers-boundary.test.mjs).
- [tests/game-console-ui-boundary.test.mjs](../tests/game-console-ui-boundary.test.mjs).
- [tests/game-menu-ui-boundary.test.mjs](../tests/game-menu-ui-boundary.test.mjs).
- [tests/game-popularity.test.mjs](../tests/game-popularity.test.mjs).
- [tests/game-session-ui-boundary.test.mjs](../tests/game-session-ui-boundary.test.mjs).
- [tests/gpu-catalog-boundary.test.mjs](../tests/gpu-catalog-boundary.test.mjs).
- [tests/gpu-download-ui-boundary.test.mjs](../tests/gpu-download-ui-boundary.test.mjs).
- [tests/gpu-games-2005.test.mjs](../tests/gpu-games-2005.test.mjs).
- [tests/gpu-games-catalog-boundary.test.mjs](../tests/gpu-games-catalog-boundary.test.mjs).
- [tests/gpu.test.mjs](../tests/gpu.test.mjs).
- [tests/historical-economy.test.mjs](../tests/historical-economy.test.mjs).
- [tests/historical-promotion-pricing-roi.test.mjs](../tests/historical-promotion-pricing-roi.test.mjs).
- [tests/hourly-price-status-boundary.test.mjs](../tests/hourly-price-status-boundary.test.mjs).
- [tests/interaction-overlays-boundary.test.mjs](../tests/interaction-overlays-boundary.test.mjs).
- [tests/layout-ui-boundary.test.mjs](../tests/layout-ui-boundary.test.mjs).
- [tests/lcd-monitors-boundary.test.mjs](../tests/lcd-monitors-boundary.test.mjs).
- [tests/lcd-preview-cache-boundary.test.mjs](../tests/lcd-preview-cache-boundary.test.mjs).
- [tests/mail-notification-audio.test.mjs](../tests/mail-notification-audio.test.mjs).
- [tests/menu-scene-preview-boundary.test.mjs](../tests/menu-scene-preview-boundary.test.mjs).
- [tests/monthly-finance-boundary.test.mjs](../tests/monthly-finance-boundary.test.mjs).
- [tests/notice-inbox-boundary.test.mjs](../tests/notice-inbox-boundary.test.mjs).
- [tests/notice-window-refresh-boundary.test.mjs](../tests/notice-window-refresh-boundary.test.mjs).
- [tests/notice-window-status-boundary.test.mjs](../tests/notice-window-status-boundary.test.mjs).
- [tests/page-save-lifecycle-boundary.test.mjs](../tests/page-save-lifecycle-boundary.test.mjs).
- [tests/pc-maintenance-boundary.test.mjs](../tests/pc-maintenance-boundary.test.mjs).
- [tests/pc-operations-boundary.test.mjs](../tests/pc-operations-boundary.test.mjs).
- [tests/placement-actions-boundary.test.mjs](../tests/placement-actions-boundary.test.mjs).
- [tests/placement-status-boundary.test.mjs](../tests/placement-status-boundary.test.mjs).
- [tests/pricing-insights-boundary.test.mjs](../tests/pricing-insights-boundary.test.mjs).
- [tests/pricing-insights.test.mjs](../tests/pricing-insights.test.mjs).
- [tests/pricing-ui-boundary.test.mjs](../tests/pricing-ui-boundary.test.mjs).
- [tests/printer-audio.test.mjs](../tests/printer-audio.test.mjs).
- [tests/promotion-status-boundary.test.mjs](../tests/promotion-status-boundary.test.mjs).
- [tests/ps1-admin-boundary.test.mjs](../tests/ps1-admin-boundary.test.mjs).
- [tests/ps1-shop-disc-boundary.test.mjs](../tests/ps1-shop-disc-boundary.test.mjs).
- [tests/ps1-shop-offer-boundary.test.mjs](../tests/ps1-shop-offer-boundary.test.mjs).
- [tests/ps1-shop-placement-boundary.test.mjs](../tests/ps1-shop-placement-boundary.test.mjs).
- [tests/retail-price-status-boundary.test.mjs](../tests/retail-price-status-boundary.test.mjs).
- [tests/runtime-interaction-bindings-boundary.test.mjs](../tests/runtime-interaction-bindings-boundary.test.mjs).
- [tests/service-access-inspection-cache-boundary.test.mjs](../tests/service-access-inspection-cache-boundary.test.mjs).
- [tests/service-access-status-boundary.test.mjs](../tests/service-access-status-boundary.test.mjs).
- [tests/service-ui-boundary.test.mjs](../tests/service-ui-boundary.test.mjs).
- [tests/shop-catalog-card-boundary.test.mjs](../tests/shop-catalog-card-boundary.test.mjs).
- [tests/shop-catalog-offers-boundary.test.mjs](../tests/shop-catalog-offers-boundary.test.mjs).
- [tests/shop-catalog-refresh-boundary.test.mjs](../tests/shop-catalog-refresh-boundary.test.mjs).
- [tests/shop-catalog-renderer-boundary.test.mjs](../tests/shop-catalog-renderer-boundary.test.mjs).
- [tests/shop-catalog-revision-boundary.test.mjs](../tests/shop-catalog-revision-boundary.test.mjs).
- [tests/shop-notice-ui-boundary.test.mjs](../tests/shop-notice-ui-boundary.test.mjs).
- [tests/shop-overview-boundary.test.mjs](../tests/shop-overview-boundary.test.mjs).
- [tests/shop-service-offers-boundary.test.mjs](../tests/shop-service-offers-boundary.test.mjs).
- [tests/simulation.test.mjs](../tests/simulation.test.mjs).
- [tests/soda-audio.test.mjs](../tests/soda-audio.test.mjs).
- [tests/sound-input-bindings-boundary.test.mjs](../tests/sound-input-bindings-boundary.test.mjs).
- [tests/sound-preference-port-boundary.test.mjs](../tests/sound-preference-port-boundary.test.mjs).
- [tests/staff-status-boundary.test.mjs](../tests/staff-status-boundary.test.mjs).
- [tests/station-ledger-boundary.test.mjs](../tests/station-ledger-boundary.test.mjs).
- [tests/station-revision-boundary.test.mjs](../tests/station-revision-boundary.test.mjs).
- [tests/station-ui-boundary.test.mjs](../tests/station-ui-boundary.test.mjs).
- [tests/website.test.mjs](../tests/website.test.mjs).
- [tests/windows-license-boundary.test.mjs](../tests/windows-license-boundary.test.mjs).

### Documentação

- `docs/ui-engine-boundary.md`: reescrito como arquitetura final.
- `docs/BACKLOG.md`: entrega consolidada, mantendo pendências de produto/aparelho físico.
- `docs/architecture-refactor-report.md`: diagnóstico, verificação e inventário desta entrega.

## Integração

Branch: `refactor/lhs-complete-architecture`, originada da `main` atual examinada. Os commits lógicos e os checks estão na [comparação com main](https://github.com/Softdown-prog/A7-forge-2D-/compare/main...refactor/lhs-complete-architecture). A entrega é um único Pull Request; nenhum merge nem publicação em main foi realizado.
