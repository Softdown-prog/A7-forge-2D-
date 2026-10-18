# Minha Conta · Cookies (implementação inicial, 18/10/2026)

## O que já existe
- Botão **Minha Conta** no menu principal e durante a partida.
- Cinco seções leves: Resumo, Loja Cookies, Meus itens, Histórico e Nuvem.
- O catálogo exibe 6 cosméticos originais, com preço, ano de liberação e efeito.
- Saldo, direitos de uso, transações e gastos totais vêm EXCLUSIVAMENTE do backend autenticado.
- Equipar/desativar é visual; não altera satisfação, dinheiro fictício, pathfinding ou progresso.
- Clique em Resgatar -> confirmação do jogador -> POST autenticado /v1/items/:itemId/purchase
  (transação Firestore, idempotente, sem crédito ou desconto calculado no cliente).
- O menu pode ser aberto sem conexão. Neste caso, o saldo mostra **—** e o resgate é bloqueado;
  não mostra '0 Cookies' sem consultar o servidor.

## Integração com o site e o backend
`online-config.json` habilita a aplicação Firebase já usada em `/conta/` e aponta
para `lhs-backend` no projeto `loyal-road-395203`, região `us-central1`.
Contém somente a chave Web pública restrita; segredos MP e Resend permanecem no servidor.
O build copia `website/account-client.mjs` para o jogo, sem manter outra implementação
de autenticação. Site, Donate e jogo compartilham a sessão da mesma aba por até oito horas;
ao entrar no jogo a identidade é renovada e verificada antes de consultar a carteira.
Logout remove a sessão e os direitos visuais. Email não confirmado não acessa a carteira.

Criar conta e recuperar senha levam ao painel do site, com os mesmos termos e fluxo
de confirmação Resend. Adquirir Cookies leva aos dois cards de Donate na mesma aba,
preservando o login. O jogo não mantém um segundo checkout nem confirma pagamentos por URL.
`PAYMENTS_ENABLED=true` e modo `production` já foram autorizados pelo proprietário para
pagamentos únicos de R$ 5/50 Cookies e R$ 10/100 Cookies; esta integração preserva essa configuração.
O catálogo e os novos campos da conta precisam estar publicados no Cloud Run antes do frontend.

## Endpoints e fonte de verdade
- GET `/v1/config`: catálogo de 6 itens, preços determinados pelo servidor, status de pagamentos.
- GET `/v1/account`: `cookiesBalance`, `cookiesSpentTotal` (somatório de resgates
  confirmados em todo o ledger), `entitlements`, `transactions` recentes (até 40).
- POST `/v1/items/:itemId/purchase`: débito e direito em uma transação Firestore,
  sem nova cobrança quando o item já pertence à conta.
- Saves locais e saves da nuvem NÃO contêm saldos premium confiáveis; nenhuma edição de save
  poderá criar um direito premium.
- O painel não carrega o ledger a cada frame. Refresca somente no login, ao reabrir
  uma sessão autenticada, ao atualizar manualmente e após resgate.
- Saldo negativo decorrente de ajuste/estorno é exibido como recebido, sem esconder a conta;
  nenhum resgate é liberado sem saldo suficiente confirmado pelo servidor.

## Casos já automatizados
- Desktop e celular: botão e 5 abas, catálogo de 6 itens, aviso offline, saldo '—',
  ação de compra inativa em ambiente sem credenciais.
- Simulação E2E sem pagamentos: autenticar, ler saldo de 100 Cookies, resgatar fone
  por 40, confirmar saldo 60, gastos 40, inventário 1, histórico e sair.
- Backend: preços fixos dos 6 itens, resposta 401 sem token, cálculo do total gasto,
  status `PAYMENTS_ENABLED=false`, execução via Docker.
- Capturas sob `out/account-panel`, workflow `lhs-cookie-cosmetics.yml`.

## Limitação atual
As imagens dos produtos dentro do catálogo são ícones de identificação; os
cosméticos procedurais detalhados estão implementados no renderizador do salão
(e podem ser avaliados nos vídeos e capturas de arte separados).
Não tratar os testes simulados como pagamentos reais: a verificação de integração
usa contas descartáveis e Cookies artificiais, sem cobrar ninguém.
