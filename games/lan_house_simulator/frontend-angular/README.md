# LHS Angular 22 — migração da interface

Primeira etapa isolada da migração de React para Angular do Lan House Simulator. NÃO substitui ainda a interface publicada. A main, o jogo Canvas 2D, src/sim, src/application, src/render, src/bootstrap e os contratos de save continuam intactos.

## Por que um workspace separado?

O motor usa TypeScript 7.0.2; Angular 22 aceita TypeScript 6.0.x. Por isso este workspace usa seu próprio TypeScript 6.0.2 e não altera as dependências do jogo.

Requisitos: Node.js 22.22.3+ compatível com Angular 22. Dentro de frontend-angular execute:

- npm install
- npm run build

O build cria frontend-angular/dist/game-ui/browser com JavaScript Angular estático, sem servidor Next.js, Node em produção, Zone.js ou acesso direto ao motor. A integração na página do jogo só acontecerá após checagens de CI, navegador, controles e mobile.

## Limites de responsabilidade

- Angular assume elementos interativos do menu, tour, ações superiores, navegação rápida, categorias, busca na loja, atalhos administrativos e navegação por abas. Os workspaces de computadores/serviços e a faixa Angular de abas acionam os controles nativos do TypeScript; a interface legada só será escondida na etapa final de ativação Angular.
- Eventos de interface e cliques nas ações originais continuam a comunicar com o controlador TypeScript via DOM.
- Nenhuma regra de preços, disponibilidade, estoque, saves, clientes, animação, Canvas, renderização ou ciclo do jogo pode ser reimplementada em Angular.
- IDs existentes permanecem idênticos, inclusive os nomes legados react-*, porque muitos adaptadores e testes ainda dependem deles. A renomeação será feita com mudança coordenada dos contratos.

## Menu e transferência de partidas

A apresentação de opções (efeitos sonoros) e importação/exportação de partidas também foi implementada em componentes Angular isolados. As interfaces TypeScript `installMenuControls` e `installSaveFileControls` continuam responsáveis pelas ações, confirmação, persistência e leitura de arquivo. O arquivo atual `index.html` segue usando seus controles originais até a conversão final; os hosts `angular-save-transfer` e `angular-menu-preferences` ficam apenas no documento de prévia enquanto não for possível retirar o React do jogo sem quebra.

## HUD, clima e correspondência

Os componentes Angular agora recebem snapshots somente leitura por eventos de apresentação: `lhs:time-weather-updated`, `lhs:notice-status-updated` e `lhs:notice-inbox-updated`. Os dados e decisões continuam nos ports TypeScript. O adaptador da caixa de correio preserva seu renderizador legado quando a lista não é marcada `data-angular-owned="true"` e deixa o Angular renderizar quando este atributo está presente.

**Ainda falta:** teste E2E real de cartas e janelas, mobile e troca atômica de toda a interface. Não inserir os hosts de prévia no `index.html` do jogo em produção até remover o React.

## Próximas etapas

1. Completar o port das ilhas React, gerar lockfile do workspace Angular e validar o build pelo CI.
2. No PR de ativação, trocar somente o bundle de bootstrap React pelo Angular, preservar a importação externa de js/main.js, e migrar os testes de contrato.
3. Transferir progressivamente os painéis imperativos de src/ui para componentes Angular usando portas read-only e comandos, sem trazer o motor para dentro do framework.
4. Migrar a interface do site e os fluxos de conta e doações sem alterar serviços externos/contratos; conservar páginas estáticas/SEO.
5. Validar mobile 360/414px, teclado, toque, compra, estoque, PS1/PS2, saves, Firebase e deploy Cloudflare. Somente depois remover React e código morto.

O PR preliminar foi **fechado sem merge**. Continuar somente na branch de migração; não abrir novo PR até 100% de paridade e autorização explícita. Não mesclar por aparência ou pelo simples fato de Angular compilar.
