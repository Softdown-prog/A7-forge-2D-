# Donate

Página `/donate/`, vinculada à carteira Cookies existente, com dois apoios únicos aprovados em 17/10/2026:

| Apoio | Cookies |
| --- | --- |
| R$ 5 | 50 |
| R$ 10 | 100 |

Ofertas canônicas em `donate-packages.mjs`: o cliente não define valor nem quantidade. Conta com email confirmado obrigatória. A página inclui cadastro/login na mesma tela, preservando a sessão somente em memória. Jogo gratuito, cosméticos futuros explicitamente indisponíveis; nenhuma vantagem de campanha. Nenhum catálogo ou item fictício foi publicado.

## Fluxo

1. `/v1/config` informa disponibilidade e modo. A interface pública só inicia pagamentos em `production` habilitada.
2. Jogador confirma os termos e solicita `POST /v1/orders` com `packageId`, `acceptedTerms: true` e cabeçalho `Idempotency-Key` UUID.
3. API valida identidade/email, cria pedido imutável por UID/modo/chave e preferência Checkout Pro. Lock transacional bloqueia criações simultâneas. Link hospedado é validado por hostname exato e vence em 24h. Os dados do cartão não passam pelo LHS.
4. Jogador abre o link explicitamente em outra aba. As URLs de retorno levam a `/donate/?order=...`; parâmetros do navegador nunca concedem créditos.
5. Webhook `payment`: HMAC, janela temporal, consulta autenticada do pagamento, recebedor, aplicação (quando fornecida), ambiente, referência, BRL e valor do pedido. Transação atômica altera carteira, lançamento, status e resumo por conta. Duplicatas ou notificações antigas não creditam novamente. Estorno parcial é proporcional, completo/chargeback reverte. Saldo pode ficar negativo se créditos estornados já foram gastos, bloqueando novas compras.
6. `GET /v1/orders/:id` exige dono e reconcilia com consulta autenticada ao provedor caso a notificação atrase. `/v1/orders` lista os últimos apoios da conta, sem dados de outra identidade. Botão “Conferir” atualiza pedido e saldo. Não há polling contínuo.

Sandbox escreve `cookiesBalanceSandbox`, nunca o saldo real `cookiesBalance`. Pedidos e lançamentos são separados por modo. Doações de teste não são disponibilizadas aos visitantes pela interface pública.

As contas oficiais `test_user`, identificadas pela consulta autenticada `/users/me`, podem retornar `live_mode=true`. Nesse caso, o sandbox utiliza `init_point`, valida o recebedor de teste e mantém os créditos exclusivamente na carteira sandbox. Credenciais legadas com `live_mode=false` utilizam `sandbox_init_point`. Uma conta marcada como `test_user` é recusada quando o backend está em produção. A interface tem dois cards de pagamento único, cada um com seu botão e link de checkout autenticado, sem plano ou cobrança recorrente.

## Cloud Run

Preservar serviço `lhs-backend`, projeto `loyal-road-395203`, região `us-central1`, 1 vCPU/512 MiB, mín. 0/máx. 3. Implantar imagem sem `--env-vars-file` para não apagar configurações existentes.

- `MP_ACCESS_TOKEN`: referência versionada do Secret Manager para o ambiente correto; nunca no frontend/Cloudflare.
- `MP_WEBHOOK_SECRET`: assinatura completa de Webhooks da aplicação `7080581682108091`, no Secret Manager. Não é o Client Secret. O MCP só mostra a assinatura mascarada; sua inclusão exige o painel do proprietário.
- `MP_APPLICATION_ID=7080581682108091`
- `PUBLIC_API_URL=https://lhs-backend-1010038095056.us-central1.run.app`
- `PUBLIC_SITE_URL=https://lhs.analysepro.com`
- `PAYMENTS_MODE=sandbox` ou `production`, sem misturar credenciais.
- `PAYMENTS_ENABLED=false` até credenciais, assinatura e validação do fluxo estarem concluídas. A página informa indisponibilidade e não inicia pagamento nesse estado.

Aplicação MP `lhs-site-donate`, evento `payment`, URL de produção/teste `/webhooks/mercadopago`. Nenhuma Public Key necessária para checkout hospedado. O backend não executa o jogo. Alterar o modo não copia saldos de teste para reais.

## Validação

`node --test backend/tests/*.test.mjs tests/account-client.test.mjs tests/donate.test.mjs tests/website.test.mjs`, `npm run build:site`, `npm run check:site`. Testes cobrem preço, dupla criação, notificações duplicadas/antigas, valores adulterados, isolamento de recebedor/ambiente/UID, estorno parcial, chargeback e recuperação por consulta ao provedor. Uma validação local com provedor simulado não substitui pagamento sandbox real.
