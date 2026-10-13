# Lan House Simulator (LHS)

Jogo independente de administração de lan house em **TypeScript + HTML5 Canvas 2D**, com câmera isométrica fixa e arte 2D autoral.

> **Status:** vertical slice jogável / protótipo. Formas desenhadas pelo Canvas são placeholders. Nenhum desenho está aprovado para produção.

## História

O protagonista economizou durante anos para abrir a própria lan house. Conseguiu um salão pequeno, um balcão, três computadores e algumas mercadorias. Agora precisa manter o negócio vivo: receber clientes, cobrar por hora, cuidar do estoque, pagar as contas, ampliar os serviços e lidar com imprevistos.

A personalidade do jogo mistura gestão séria com acontecimentos cômicos: clientes fantasiados, uma internet que cai na pior hora, fila no balcão e surpresas do comércio local.

## Executar localmente

Requer Node.js 22+.

```bash
cd games/lan_house_simulator
npm install
npm run build
npm run serve
```

Abra http://localhost:4173 . Para alterar o código, execute `npm run build` novamente e atualize a página.

```bash
npm test
```

## Controles

- Clique no protagonista atrás do balcão para abrir/fechar a administração.
- Ajuste o preço por hora, reponha bebidas/doces, melhore a internet, compre licenças e amplie a loja pelo painel.
- O tempo da simulação corre sem pressionar botões; clientes aparecem conforme preço, reputação, lotação e serviço.
- Os dados são salvos localmente no navegador (localStorage). Botão Reiniciar apaga o progresso.

## Fronteira com A7 Forge

Este diretório pode ser movido integralmente para um repositório independente. O jogo **não importa código Python ou arquivos do A7 no navegador**. Receitas originais ficam em `authoring/`; workers do GitHub Actions podem executar o A7 para produzir PNGs de revisão em artifacts. Somente PNGs aprovados entram em `assets/`.

Documentação canônica:
- [Visão completa da ideia e regras de jogo](docs/GAME_DESIGN.md)
- [Contratos técnicos e arquitetura](docs/ARCHITECTURE.md)
- [Pool de workers e tarefas](docs/WORKER_POOL.md)
- [Backlog](docs/BACKLOG.md)
- [Áudio original do usuário](assets/audio/README.md)

O jogo é uma obra original: figurinos cômicos são arquétipos próprios, sem copiar personagens ou marcas de terceiros.

## Captura de validação visual

O job `worker-scene` gera duas capturas reais do jogo em Chromium (desktop e mobile), com três visitantes posicionados por seed de revisão. Veja o artifact `lhs-visual-validation` na execução do workflow. A câmera permanece fixa, sem telhado e sem exterior. As capturas são de *placeholders*, não de arte aprovada.

### Acabamento dos personagens

A aparência procedural V1 dos personagens é desenhada por `src/render/actorArt.ts` e diferencia figurinos, cabelos, cores e poses sem novas dependências. É visual provisório com intenção estética definida; PNGs capturados pelo worker-scene continuam sendo a etapa de validação antes dos sprites definitivos do A7 Forge.

## Publicação no CH-site (sob demanda)

O jogo continua sendo desenvolvido e testado em `Softdown-prog/A7-forge-2D-`, pasta `games/lan_house_simulator`. Commits aqui **não disparam deploy do site**.

Quando uma versão estiver aprovada para publicação, atualize a integração no repositório `Softdown-prog/CH-site` (branch `main`). O build Astro desse repositório compila o jogo pelo script `scripts/sync-games.mjs` e coloca o HTML5 em `/play/lan-house-simulator/`. Se o Cloudflare Pages estiver vinculado à `main` do CH-site, o commit/merge do site aciona seu deploy automático.

Sem hook, segredo ou workflow entre os dois repositórios. Publicação é decisão explícita, não consequência de cada alteração do jogo.

## Ampliação direcional do salão e rotação de móveis (versão HTML5)

- **Compras → Ampliar salão** mantém a expansão tradicional para PCs, no máximo 2 níveis. Isso preserva os 3 a 7 computadores originais e os saves de quem já jogava antes da novidade.
- **Compras → Ampliar à esquerda (oeste), à direita (leste) ou para frente (sul)** adiciona 2 tiles em cada direção, por compra, com até 2 etapas por direção. O norte fica fixo em `y=0`. Os novos trechos são piso utilizável para decoração, mas **não instalam novos computadores automaticamente**. A entrada muda para a borda sul/leste, mantendo as rotas de atendimento, inclusive dos clientes que já estavam indo embora.
- **Organizar móveis → selecionar um móvel de piso → Girar 90°** percorre quatro orientações, sem cobrar e sem perder as informações de rotação quando o móvel muda de posição. Pôsteres continuam fixados na parede norte; computadores/mesas de PC dependem de uma futura etapa de orientação de assentos, monitores e NPCs e **não rodam** nesta versão.
- As novas ampliações desbloqueiam mais encaixes e aumentam o limite de pôsteres, vasos e mesinhas. Tudo é salvo no mesmo JSON opcional de `roomExtensions` e `furniturePlacements[].rotation`, preservando partidas antigas.
- `src/sim/room.ts` controla limites do piso, preços e transações; `src/sim/shop.ts` valida encaixes/rotações; `src/render/isometric.ts` enquadra o piso expandido sem cortar; `src/render/scene.ts` pinta a geometria. Testes de simulação e capturas reais em Chromium cobrem regressões.
- Esta etapa é somente de desenvolvimento no repositório do **A7 Forge 2D**. Não implica commit ou deploy no CH-site.
