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
