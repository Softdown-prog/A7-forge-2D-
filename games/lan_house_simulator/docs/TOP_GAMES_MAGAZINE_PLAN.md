# Top Games — revistas mensais de videogame (migração incremental)

## Objetivo

Tony assina a revista fictícia **Top Games**. Cada exemplar que o carteiro entrega na lan house apresenta um jogo diferente. Não é um novo personagem: a rota, a aparência e a lógica de entrega física devem reutilizar o carteiro existente de `postmanDelivery.ts`, usado hoje pela coleção `Informática Livre` sobre Linux.

## Etapa 1 — Fundação da assinatura (neste PR)

- `src/sim/topGamesMagazines.ts` deriva automaticamente 28 edições dos catálogos PS1 (13) e PS2 (15) já existentes, sem duplicar jogos nem anos de lançamento.
- Os 7 títulos iniciais de PS1 recebem edições mensais de janeiro a julho de 2002; novas duplas nos anos 2003–2005. Em 2006 começam as 7 edições PS2, seguidas de duas por ano até 2010.
- A assinatura exige escolha explícita, pode ser pausada e retomada, não tem cobrança inicial e **só cobra na entrega bem-sucedida**. O preço-base por edição em 2002 é R$ 12, corrigido pelo índice do ano corrente.
- Uma edição equivale a **um** jogo conhecido, sem conceder uma cópia física do CD/DVD. A aquisição da mídia na loja continuará sendo uma transação separada.
- Intervalo mínimo de 30 dias entre exemplares. Se Tony assinar tarde, pode receber edições antigas gradualmente, sem cobranças retroativas em lote; edições futuras dependem do ano original de lançamento.
- `topGamesSubscriptionDay`, `topGamesSubscriptionActive`, `topGamesReceivedIssues` e `topGamesLastDeliveryDay` são campos opcionais nos saves antigos. O validador protege duplicidade, IDs falsos, edições futuras e datas incoerentes.
- **Ainda não há botão na loja, carteiro Top Games ou trava de compra do PS1/PS2.** Esses sistemas continuam operando como antes até que a cadeia completa esteja funcional. Não confundir fundação lógica com recurso já publicável.

## Próximas microtarefas — separadas

1. Criar uma opção de assinatura Top Games no catálogo da loja Angular e no fluxo de compra, usando uma porta de aplicação de leitura e comandos. Não duplicar estado de domínio na UI.
2. Reutilizar `postmanDelivery.ts` e o mesmo ator físico (boné, camiseta amarela, calça azul e bolsa) para entregar revistas Linux **ou** Top Games, mantendo uma única fila de entregas, pagamento na entrega e bloqueio de entrega por rota obstruída.
3. Só depois, conectar `topGamesKnowsGame` à compra/equipamento dos jogos de PS1 e PS2, com migração explícita dos saves existentes para preservar CDs/DVDs já adquiridos, e substituir anúncios gratuitos que exponham títulos ainda desconhecidos.
4. Validar a jornada completa em Chromium desktop/móvel, economias e salvamento, sem liberar novos jogos antes da revista efetivamente recebida.

## Critérios de aceite da etapa 1

- 28 edições únicas e datas de publicação corretas em cada campanha;
- assinatura não implica cobrança nem desbloqueio imediato;
- entrega bem-sucedida registra apenas uma edição e uma cobrança;
- caixa insuficiente, assinatura pausada e data antecipada recusam a entrega;
- estado permanece válido após exportação/importação;
- CI compila e executa `tests/top-games-magazine-foundation.test.mjs` sem afetar testes Linux/PS1/PS2.
