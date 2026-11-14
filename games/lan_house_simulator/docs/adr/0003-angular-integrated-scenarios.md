# ADR 0003 — Cenários de integração Angular independentes

## Objetivo

Manter a execução Playwright original de `frontend-angular/scripts/verify_integrated_game.mjs` e seu arquivo `results.json`, mas evitar que toda a auditoria de migração e integração continue em um único script. Uma separação é válida somente quando o **código original de cada cenário** é preservado, com a mesma ordem, dados, ações reais no navegador e asserções.

## Mapa da primeira etapa

| Antes | Agora | Responsabilidade | Retorno |
| --- | --- | --- | --- |
| `verify_integrated_game.mjs` (bloco LGPD) | `scripts/integrated-qa/privacy.mjs` | Consentimento, expiração após 30 dias, reload e storage essencial | `privacyChoices` |
| `verify_integrated_game.mjs` (bloco PS1/PS2 bloqueado) | `scripts/integrated-qa/consoleReleaseGates.mjs` | Anos de lançamento, limites financeiros, revistas, botões desabilitados e capturas reais | `blocked` |
| `verify_integrated_game.mjs` (bloco revista) | `scripts/integrated-qa/topGamesMagazineGates.mjs` | Segredo dos jogos, compra liberada após a entrega, persistência e PS2 | `magazineShop` |

A sequência do script continua sendo: cenário integrado principal, LGPD, editor de layout, conta/doações, gestão de estoque, bloqueios PS1/PS2, revista Top Games, relatório JSON e fechamento de Chromium/servidor. Os três módulos recebem serviços explícitos do orquestrador; não abrem navegador separado, não criam pagamentos reais e não mudam saves.

O teste `tests/angular-integrated-scenario-boundary.test.mjs` verifica importações, ordem, cenário proprietário e relatório final. A integração real em Chromium continua indispensável, pois a checagem de código-fonte sozinha não prova a jogabilidade.

## Próximos passos

Extrair os demais cenários somente após essa etapa passar no CI, evitando duplicar rotas ou refazer testes já cobertos. Não abrir PR, não fazer merge e não executar deploy sem autorização.

A prévia `lhs-angular-ui-preview.yml` também executa `node --check` nos três novos módulos antes da instalação de Chromium e inclui o teste de fronteira de cenários na verificação prévia de UI. Isso mantém o portão de sintaxe equivalente ao anterior.

O auditor `frontend-angular/scripts/audit_migration.mjs` agora reúne a evidência do orquestrador com os módulos `integrated-qa/*.mjs` somente se eles estiverem **importados e aguardados** (`await`) no fluxo principal. Isso corrige a leitura pré-modularização sem confundir arquivos isolados com testes executados. O teste do auditor verifica também a exclusão de módulos desconectados.

## Segunda etapa — layout mobile, conta/doações e estoque

| Bloco antes em `verify_integrated_game.mjs` | Arquivo novo | Relatório mantido |
| --- | --- | --- |
| Editor Canvas por toque | `frontend-angular/scripts/integrated-qa/mobileLayoutEditor.mjs` | `layoutEditorResults` |
| Conta e doação com rotas de serviços simuladas | `frontend-angular/scripts/integrated-qa/accountDonation.mjs` | `accountDonationResults` |
| Catálogo, preço, pedidos e persistência | `frontend-angular/scripts/integrated-qa/stockManagement.mjs` | `stockManagementResults` |

Cada bloco foi transportado integralmente, com as mesmas asserções, estado real do jogo, navegações Chromium, capturas, intercepções de rede e recarregamentos. A ordem de execução e os sete grupos de `results.json` não mudaram. `audit_migration.mjs` agrega a evidência somente de módulos efetivamente importados e aguardados (`await`). Os testes de fronteira, os testes negativos do auditor e a checagem de sintaxe do workflow acompanharam os novos caminhos. Os contadores de asserções, navegações e contextos antes/depois foram comparados.
