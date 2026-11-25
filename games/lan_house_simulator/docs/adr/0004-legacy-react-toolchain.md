# ADR 0004 — Dependências da fixture React

**Substituído pelo [ADR 0005](0005-angular-standalone-game.md).**

O site Angular é o caminho publicado. A build isolada do jogo e os testes
legados ainda exercitam o bootstrap React com o mesmo motor Canvas.

React e ReactDOM passam para o lockfile de `legacy-react/`. O modo React
carrega o instalador e o bundler legados sob demanda. A build Angular usa
o lockfile principal e o do Angular. Cada build continua usando os mesmos
arquivos de entrada, seletores e comandos do jogo que já atendiam seus testes.

Para retirar a fixture, ainda é preciso migrar os consumidores de
`npm run build` que exercitam a UI em `dist/`, incluindo os testes de
interação do jogo e os scripts de captura. Os contratos Angular verificam
que React, ReactDOM e Scheduler ficam fora do lockfile principal.
