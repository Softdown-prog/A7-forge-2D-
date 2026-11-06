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
- A cobrança real e o desbloqueio **ainda não estão conectados ao carteiro** e à compra de jogos. Não confundir a assinatura funcional da loja com uma entrega já integrada.

## Microtarefa 2 — Assinatura na loja (implementada neste PR)

- `src/application/topGamesShopPort.ts` apresenta uma cotação obtida do save atual: preço por edição, status, revistas recebidas, próxima edição e disponibilidade após 2002.
- A categoria **Consoles** mostra a assinatura na loja Angular canônica e na loja DOM: **Assinar**, **Pausar**, **Retomar**, com estado compartilhado e comandos delegados à `ShopActionsPort`. Nenhuma ação Angular altera a simulação diretamente.
- `src/application/shopCatalogRevisionPort.ts` invalida a loja quando um save importado altera a assinatura. Não há segundo catálogo de jogos ou fonte de verdade no front-end.
- Antes da entrega física, o usuário é avisado de que a logística será integrada depois; não existe débito automático ao assinar ou pausar.
- `tests/top-games-shop-integration.test.mjs` exercita assinatura e pausa, reatividade da porta, persistência e renderização; `frontend-angular/scripts/verify_integrated_game.mjs` valida o clique real no Chromium e a ausência de cobrança antecipada.

## Microtarefa 3 — Carteiro físico compartilhado (implementada nesta branch)

- `src/sim/postmanDelivery.ts` mantém o **mesmo carteiro** — uniforme amarelo, calça azul, bolsa, caminho da porta ao balcão e pose de entrega — para Linux e Top Games. Não cria novo NPC, fila paralela ou contador de clientes.
- O roteador escolhe a encomenda apta com data devida mais antiga; a entrega Linux original tem prioridade apenas quando as datas coincidem. Uma revista por percurso. Nenhuma revista aparece diretamente na caixa de entrada antes da entrega.
- A edição Top Games é identificada por `magazine:"top-games"`, `issueId` e `issueIndex`. Saves legados de Linux sem `magazine` permanecem válidos, inclusive com o carteiro em movimento.
- A assinatura, o saldo e a edição são **revalidados no balcão**. Se Tony pausar a assinatura ou gastar o caixa enquanto o carteiro caminha, ele vai embora sem cobrança ou revista. Pagamento, registro no acervo e mensagem de chegada ocorrem uma única vez.
- `src/sim/notices.ts` entrega mensagem informativa sobre o jogo somente após recebimento físico. O item ainda não é um CD/DVD comprado; é conhecimento de revista.
- `tests/top-games-postman-delivery.test.mjs`: caminho real, uniforme, estado intermediário do NPC salvo e restaurado, cobrança única, pausa, falta de caixa, coexistência com Linux e adulteração de job.
- A loja exibe informações verdadeiras sobre a entrega física, e não uma mensagem de funcionalidade futura.

## Próximas microtarefas — separadas
1. Reutilizar `postmanDelivery.ts` e o mesmo ator físico (boné, camiseta amarela, calça azul e bolsa) para entregar revistas Linux **ou** Top Games, mantendo uma única fila de entregas, pagamento na entrega e bloqueio de entrega por rota obstruída.
1. Só depois, conectar `topGamesKnowsGame` à compra/equipamento dos jogos de PS1 e PS2, com migração explícita dos saves existentes para preservar CDs/DVDs já adquiridos, e substituir anúncios gratuitos que exponham títulos ainda desconhecidos.
2. Validar a jornada completa em Chromium desktop/móvel, economias e salvamento, sem liberar novos jogos antes da revista efetivamente recebida.

## Critérios de aceite da etapa 1

- 28 edições únicas e datas de publicação corretas em cada campanha;
- assinatura não implica cobrança nem desbloqueio imediato;
- entrega bem-sucedida registra apenas uma edição e uma cobrança;
- caixa insuficiente, assinatura pausada e data antecipada recusam a entrega;
- estado permanece válido após exportação/importação;
- CI compila e executa `tests/top-games-magazine-foundation.test.mjs` sem afetar testes Linux/PS1/PS2.
