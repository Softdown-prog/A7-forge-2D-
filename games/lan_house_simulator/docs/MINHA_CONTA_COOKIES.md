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

## Por que a conta ainda aparece desconectada no deploy
O arquivo `online-config.json` distribuído neste repositório está explicitamente com
`enabled:false` e `firebaseApiKey:""`. Não inserir uma chave fictícia e não iniciar
uma sessão sem autenticação. As credenciais de publicação e o registro da aplicação no
Firebase pertencem ao operador do serviço; não foram criados automaticamente neste PR.

Para habilitar, configurar o cliente com a **chave pública Web API do Firebase**,
`enabled:true` e URL HTTPS do Cloud Run no `online-config.json`.
A URL da API já consta no arquivo como referência, mas ainda é necessário verificar
se o backend foi implantado e se o projeto Firebase correspondente está ativo.
Não colocar credenciais privadas de servidor, tokens, senha ou segredo MP nesse JSON.
Configurar `ALLOWED_ORIGINS` no backend para o domínio do site real e testar CORS.
Após configurar, executar a suíte e publicar primeiro em staging; ativar cobranças
reais somente após revisão de pagamentos, estornos, regras e atendimento.

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
(e podem ser avaliados nos vídeos e capturas de arte separados). A integração com
conta online REAL ainda depende da configuração pública Firebase/Cloud Run e de
validar o servidor implantado. Não tratar os testes simulados como compras reais.
