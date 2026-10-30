# TypeScript 7.0.2 — Lan House Simulator

O motor, o Canvas e os dados de gameplay não foram modificados.

- Dependência TypeScript fixada em `7.0.2` e lock reproduzível com binários opcionais por arquitetura.
- `scripts/build.mjs` continua executando `node_modules/typescript/bin/tsc`, um ponto que deve ser validado no CI nativo com Node 22 (sem trocar por npx remoto).
- `tsconfig.engine.json` mantém `types: []` e os testes da simulação seguem sem DOM; `tsconfig.json` mantém `module: NodeNext`, `target: ES2022` e `strict: true`.
- Testes necessários: `npm ci && npm run typecheck && npm test && npm run build:site && npm run check:site`, mais testes de Canvas e mobile definidos na CI do repositório.
- Repositório espelho `Softdown-prog/a7-forge-2d` não foi alterado nesta etapa; sincronizar somente após a validação do principal.
- Não há publicação, deploy ou alteração de serviços na VPS neste PR.

## Dependência transitória para testes AST
Os testes estruturais importam `@typescript/typescript6@6.0.2` exclusivamente para `createSourceFile`, `ScriptTarget` e percorrer AST. O pacote oficial depende do `@typescript/old` (TS 6.0.3). O compilador principal continua em `typescript@7.0.2`; não desativamos os 38 testes que falharam por ausência da API JS.
