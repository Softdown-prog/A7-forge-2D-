# Top Games — revistas mensais de videogame (migração incremental)

## Objetivo

Tony assina a revista fictícia **Top Games**. Cada exemplar que o carteiro entrega na lan house apresenta um jogo diferente. Não é um novo personagem: a rota, a aparência e a lógica de entrega física devem reutilizar o carteiro existente de `postmanDelivery.ts`, usado hoje pela coleção `Informática Livre` sobre Linux.

## Etapa 1 — Fundação da assinatura (implementada neste PR)

- `src/sim/topGamesMagazines.ts` deriva automaticamente 28 edições dos catálogos PS1 (13) e PS2 (15) já existentes, sem duplicar jogos nem anos de lançamento.
- Os 7 títulos iniciais de PS1 recebem edições mensais de janeiro a julho de 2002; novas duplas nos anos 2003–2005. Em 2006 começam as 7 edições PS2, seguidas de duas por ano até 2010.
- A assinatura exige escolha explícita, pode ser pausada e retomada, não tem cobrança inicial e **só cobra na entrega bem-sucedida**. O preço-base por edição em 2002 é R$ 12, corrigido pelo índice do ano corrente.
- Uma edição equivale a **um** jogo conhecido, sem conceder uma cópia física do CD/DVD. A aquisição da mídia na loja continuará sendo uma transação separada.
- Intervalo mínimo de 30 dias entre exemplares. Se Tony assinar tarde, pode receber edições antigas gradualmente, sem cobranças retroativas em lote; edições futuras dependem do ano original de lançamento.
- `topGamesSubscriptionDay`, `topGamesSubscriptionActive`, `topGamesReceivedIssues` e `topGamesLastDeliveryDay` são campos opcionais nos saves antigos. O validador protege duplicidade, IDs falsos, edições futuras e datas incoerentes.
- A entrega e o desbloqueio foram conectados posteriormente nas microtarefas 3 e 4; esta etapa isolava somente o domínio.

## Microtarefa 2 — Assinatura na loja (implementada neste PR)

- `src/application/topGamesShopPort.ts` apresenta uma cotação obtida do save atual: preço por edição, status, revistas recebidas, próxima edição e disponibilidade após 2002.
- A categoria **Consoles** mostra a assinatura na loja Angular canônica e na loja DOM: **Assinar**, **Pausar**, **Retomar**, com estado compartilhado e comandos delegados à `ShopActionsPort`. Nenhuma ação Angular altera a simulação diretamente.
- `src/application/shopCatalogRevisionPort.ts` invalida a loja quando um save importado altera a assinatura. Não há segundo catálogo de jogos ou fonte de verdade no front-end.
- Assinar/pausar nunca cobra. A informação de entrega pelo carteiro é exibida na loja, compartilhando o estado real da simulação.
- `tests/top-games-shop-integration.test.mjs` exercita assinatura e pausa, reatividade da porta, persistência e renderização; `frontend-angular/scripts/verify_integrated_game.mjs` valida o clique real no Chromium e a ausência de cobrança antecipada.

## Microtarefa 3 — Carteiro físico compartilhado (implementada nesta branch)

- `src/sim/postmanDelivery.ts` mantém o **mesmo carteiro** — uniforme amarelo, calça azul, bolsa, caminho da porta ao balcão e pose de entrega — para Linux e Top Games. Não cria novo NPC, fila paralela ou contador de clientes.
- O roteador escolhe a encomenda apta com data devida mais antiga; a entrega Linux original tem prioridade apenas quando as datas coincidem. Uma revista por percurso. Nenhuma revista aparece diretamente na caixa de entrada antes da entrega.
- A edição Top Games é identificada por `magazine:"top-games"`, `issueId` e `issueIndex`. Saves legados de Linux sem `magazine` permanecem válidos, inclusive com o carteiro em movimento.
- A assinatura, o saldo e a edição são **revalidados no balcão**. Se Tony pausar a assinatura ou gastar o caixa enquanto o carteiro caminha, ele vai embora sem cobrança ou revista. Pagamento, registro no acervo e mensagem de chegada ocorrem uma única vez.
- `src/sim/notices.ts` entrega mensagem informativa sobre o jogo somente após recebimento físico. O item ainda não é um CD/DVD comprado; é conhecimento de revista.
- `tests/top-games-postman-delivery.test.mjs`: caminho real, uniforme, estado intermediário do NPC salvo e restaurado, cobrança única, pausa, falta de caixa, coexistência com Linux e adulteração de job.
- A loja exibe informações verdadeiras sobre a entrega física, e não uma mensagem de funcionalidade futura.

## Microtarefa 4 — Descoberta de jogos pela Top Games (implementada nesta branch)

- `src/sim/topGamesUnlockGate.ts`: guarda **sem dependências cíclicas** dos catálogos PS1/PS2. Cada edição recebida física e regularmente marca o seu jogo como conhecido pelo Tony; a mera assinatura não libera uma mídia.
- `src/sim/ps1.ts` e `src/sim/ps2.ts`: compras de novas mídias em campanhas novas exigem o título conhecido e respeitam também o **ano de lançamento**, limite de cópias, bancada instalada e caixa. O botão desabilitado não substitui a verificação no próprio motor.
- `src/application/ps1ShopDiscPort.ts` e `src/application/ps2Port.ts`: projetam `magazineLocked`, permitindo que Angular e loja nativa expliquem claramente “Leia a revista Top Games”. Sem duplicação de regras no front-end.
- **Política de migração deliberada:** `createGame(..., "historical")` inclui `topGamesUnlockMode:"magazines"` nas partidas *novas*. Saves criados antes do recurso não têm este marcador; continuam com o fluxo antigo e preservam **todas** as cópias, estações e compras, sem cobrança retroativa ou congelamento de progressão. Não se adiciona o marcador automaticamente durante a importação. Mesmo nas campanhas novas, uma mídia já possuída pode ser recomprada (sem perder a licença) caso o histórico de revistas seja interrompido.
- `isValidSave` valida o novo marcador e impede marcadores malformados ou modo clássico com política de revista. O histórico das 28 edições segue validado separadamente.
- Testes: `tests/top-games-discovery-gate.test.mjs` comprova tentativa de compra direta bloqueada (sem alterar estado), chegada física real da primeira edição, liberação seletiva, acervo separado, política de save antigo, trava PS2, import/export, validação de marcador e projeções Angular. Testes antigos de contratos de consoles representam explicitamente saves anteriores à coleção.
- `frontend-angular/scripts/verify_integrated_game.mjs` passou a exigir dois cenários reais de loja Angular: sem revista correspondente (compra bloqueada) e com a primeira edição recebida (compra efetiva e salva).

## Antes de mesclar

1. **Verificar todos os workflows**: typecheck, SAC, regressões da simulação, Playwright Chromium desktop/mobile e ausência de erros de runtime. O build sozinho não aprova a feature.
2. O script `scripts/render_ps1_admin.mjs` tinha contagem obsoleta de cinco capas apesar de sete lançamentos em 2002; agora valida as sete, mantendo as exigências de arte decodificada e geometria da interface.
3. O Playwright Angular de PS2 passava a aguardar indefinidamente dimensões intrínsecas de PNG mesmo quando o próprio componente usava seu fallback local SVG. Agora aceita **PNG original ou SVG local decodificado**, jamais fonte externa, e inclui diagnósticos de dimensão e URL caso falhe.
4. Considerar num passo posterior esconder nomes/capas de títulos ainda desconhecidos e substituir avisos anuais que usam a expressão “desbloqueado em {ano}” por “publicado em {ano}”. A trava de compra já está no motor.

## Critérios de aceite da etapa 1

- 28 edições únicas e datas de publicação corretas em cada campanha;
- assinatura não implica cobrança nem desbloqueio imediato;
- entrega bem-sucedida registra apenas uma edição e uma cobrança;
- caixa insuficiente, assinatura pausada e data antecipada recusam a entrega;
- estado permanece válido após exportação/importação;
- CI compila e executa `tests/top-games-magazine-foundation.test.mjs` sem afetar testes Linux/PS1/PS2.
