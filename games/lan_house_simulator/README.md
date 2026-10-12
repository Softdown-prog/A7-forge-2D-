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
