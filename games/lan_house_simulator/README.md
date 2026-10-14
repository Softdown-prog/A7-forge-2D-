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

## Identidade visual — Terminal de bairro

O jogo tem uma interface própria inspirada nas lan houses do fim dos anos 90: grafite verde, papel creme, verde de terminal e detalhes em âmbar. O menu mostra o próprio salão dentro de um monitor CRT desenhado com CSS; marca, favicon e 41 ícones SVG são originais e locais.

HUD, sete abas administrativas, catálogo, correspondência, preços, manutenção, estoque, licenças, GPUs e finanças usam a mesma linguagem visual. Os indicadores mostram valores reais do motor. Janelas fecham com Escape, preservam foco e permitem navegar pelas abas com as setas. O menu pausa a partida; sua prévia não avança o save.

Veja o [guia da identidade visual](docs/VISUAL_IDENTITY.md). `scripts/capture_identity.mjs` valida as telas em Chromium a 1440, 414 e 360 px, testa ações pelos ícones e gera o artifact `lhs-visual-identity`, incluindo vídeo MP4 silencioso.

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

Além das pranchas, o worker grava `lhs_circulation_runtime.mp4`: gameplay contínuo da aplicação real com três portas internas, quatro PCs nos anexos e alta lotação. O vídeo usa o loop normal do jogo, sem reposicionar clientes durante a filmagem, e é silencioso. A fixture e a comparação antes/depois estão em [Validação de circulação](docs/CIRCULATION_STRESS_VALIDATION.md). O teste mobile usa emulação touch no Chromium; aprovação artística e teste em aparelho físico continuam pendentes.

### Acabamento dos personagens

A aparência procedural V1 dos personagens é desenhada por `src/render/actorArt.ts` e diferencia figurinos, cabelos, cores e poses sem novas dependências. É visual provisório com intenção estética definida; PNGs capturados pelo worker-scene continuam sendo a etapa de validação antes dos sprites definitivos do A7 Forge.

## Publicação no CH-site (sob demanda)

O jogo continua sendo desenvolvido e testado em `Softdown-prog/A7-forge-2D-`, pasta `games/lan_house_simulator`. Commits aqui **não disparam deploy do site**.

Quando uma versão estiver aprovada para publicação, atualize a integração no repositório `Softdown-prog/CH-site` (branch `main`). O build Astro desse repositório compila o jogo pelo script `scripts/sync-games.mjs` e coloca o HTML5 em `/play/lan-house-simulator/`. Se o Cloudflare Pages estiver vinculado à `main` do CH-site, o commit/merge do site aciona seu deploy automático.

Sem hook, segredo ou workflow entre os dois repositórios. Publicação é decisão explícita, não consequência de cada alteração do jogo.

## Portas e computadores nas alas ampliadas — V3

- **Compras → Instalar porta interna:** depois de construir uma parede, clique em Instalar porta e toque nessa divisória. A parede é substituída por um batente vazado. O custo é R$ 80 por porta; a passagem é atravessável pela navegação dos clientes. Paredes continuam bloqueando a circulação. É possível demolir parede ou porta, sem devolução de dinheiro.
- **Compras → PC no anexo:** após adquirir a ala norte/oeste/leste, selecione os encaixes verdes de PC no Canvas. Cada computador custa R$ 320, inclui bancada CRT, cadeira, cliente sentado, venda de sessões, manutenção e upgrade. Cinco faixas por direção geram até quinze novas posições (além das sete tradicionais).
- **Roteador:** enquanto o trajeto antigo não atravessar paredes, o corredor original continua em uso. Se houver uma barreira, o jogo procura um caminho pelas células da grade, atravessando portas, mas nunca paredes fechadas. Uma instalação inacessível não pode ser comprada; o atendimento não cobra clientes para uma estação sem caminho.
- **Saves e manutenção:** `interiorDoors` e `annexPcs` são opcionais para saves antigos. O jogo preserva índices de hardware e desgaste quando o jogador instala posteriormente um PC tradicional.
- **Próximas melhorias:** refinamento artístico de batentes, controle de quatro orientações para monitores e cadeiras e edição livre de estações. Nesta fase, as estações dos anexos utilizam a orientação gráfica original para preservar o sprite do personagem sentado.
- **Capturas:** `lhs_door_and_annex_pc_desktop.png` / `_mobile.png` são PNGs reais gerados pelo renderer no Chromium.
- O jogo ainda é desenvolvido apenas no A7 Forge 2D, sem integração automática no CH-site.

## Salão ampliado e divisórias procedurais — contrato de construção V2

- **Porta fixa:** entrada/saída permanece na posição original (x=7,5; y=5,35) ao sul. Nenhuma nova compra amplia o sul. Saves antigos com `roomExtensions.south` preservam o piso já comprado, mas a porta fica na referência fixa.
- **Norte, oeste e leste:** cinco compras por direção, cada uma acrescenta **dois tiles**, total de **10 tiles novos por direção**. O salão inicial continua intacto; `roomExtensions.north` é opcional para compatibilidade com saves anteriores.
- **Construir divisórias:** em Compras selecione Construir divisórias, toque na borda de um tile no Canvas para pré-visualizar e instalar. Cada segmento custa **R$ 30**. As paredes são procedurais, encaixadas no grid, visíveis em perspectiva e salvas em `interiorWalls`. A construção bloqueia os segmentos que atravessariam as rotas atuais de entrada, caixa, PCs, máquinas ou visitantes.
- **Remover divisórias:** toque numa parede interna existente; remoção não tem custo, mas não devolve o material comprado. Deixe vãos entre paredes para portas/passagens. O contador de **salas** representa setores da grade separados por divisórias, não áreas funcionais já atendidas por NPCs.
- **Limitações deliberadas desta etapa:** os novos anexos ainda não instalam computadores automaticamente; portas com animação, circulação dos clientes dentro dos novos quartos e posicionamento totalmente livre de mesas serão próximas etapas. **Não conectar salas à lógica de atendimento sem criar roteamento próprio**.
- **Móveis:** mantidos nas quatro direções em slots seguros, inclusive novos encaixes no norte. A fachada/porta e o letreiro externo mantêm posição estável. Arte procedural como placeholder sujeita a validação por PNG.
- **Segurança dos saves:** validar `roomExtensions`, `interiorWalls`, limites dos tiles e colocações antes de importar. Continuação automática no navegador usa a mesma estrutura.
- **Publicação:** exclusivamente no A7 Forge 2D até autorização de integração com o repositório CH-site.
