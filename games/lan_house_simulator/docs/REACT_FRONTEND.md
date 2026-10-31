# React no Lan House Simulator — migração progressiva

## Princípio

A interface evolui para React sem reescrever o motor e sem transformar Canvas em componentes React. Primeiro foram migrados **menu principal, guia interativo da abertura e barra superior**. A simulação segue inteiramente em `src/sim/`, e o Canvas continua no mesmo elemento `#game`. As janelas administrativas existentes permanecem DOM/TypeScript até uma próxima etapa.

O build é local e estático: React e ReactDOM estão empacotados em `dist/js/react-entry.js` por esbuild. Esse módulo monta as raízes com `flushSync` antes de carregar `main.js`; esse comportamento é essencial para a compatibilidade com `locateGameElements` e `installMenuControls` e evita uma corrida de DOM. Não montar React depois de `bootstrapGame`, pois destruiria listeners ligados aos botões anteriores.

## Visual e comportamento

- Menu principal com CTA em destaque e contraste mais claro.
- Nova seção React com três abas sobre gestão, expansão e histórias; transições leves e suporte a `prefers-reduced-motion`.
- Barra superior com botões de navegação React, ainda ligados aos adaptadores do jogo.
- CSS continua local, na identidade verde/creme. Não há Google Fonts, CDN nem modificação nas imagens do motor.

## Migrações futuras (fora do escopo desta PR)

HUD de calendário/caixa e painéis de loja, correio e administração, **um por vez**, por portas de aplicação e snapshots com `useSyncExternalStore`. Para cada migração, remover o renderizador DOM anterior para não criar duas fontes de verdade. Medir FPS/mobile e consumo de memória antes de ampliar React.

## Segurança

Manter IDs, foco, painel de consentimento, salvamento/importação, conta/cookies, animações Canvas e funcionamento de cada botão. O builder `website/build.mjs` versiona `react-entry.js` e seus imports como já faz com `main.js`.
