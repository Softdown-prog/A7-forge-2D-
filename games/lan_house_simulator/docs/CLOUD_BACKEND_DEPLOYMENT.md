# LHS backend — implantação e operação

Estado em 14/10/2026: **backend implantado e validado nos serviços reais**, após reativação do faturamento. Serviço `lhs-backend`, revisão `lhs-backend-00002-gg9`, Firestore `lhs-game`, bucket privado `loyal-road-395203-lhs-saves` e conta de serviço com IAM restrito estão ativos em `us-central1`. URL: https://lhs-backend-1010038095056.us-central1.run.app . GET `/health` retorna 200; `/v1/account` sem token retorna 401. Frontend online e pagamentos continuam desativados.

O backend é separado da simulação. Cloudflare continua servindo o HTML5. O container inclui apenas API e módulos puros do validador de save; não serve assets nem executa o loop do jogo.

## Implantar ou atualizar

No PowerShell 7+, a partir de `games/lan_house_simulator`:

```powershell
./backend/infra/deploy.ps1 -AllowedOrigins @('https://SEU-DOMINIO-CLOUDFLARE')
```

O script para imediatamente quando qualquer comando falha. Confere faturamento, cria recursos separados, publica regras que negam acesso direto ao Firestore, concede IAM apenas ao banco/bucket LHS e implanta usando `gcloud run deploy --source`. Recursos: projeto `loyal-road-395203`, região `us-central1` (Iowa), serviço `lhs-backend`, banco `lhs-game`, bucket `loyal-road-395203-lhs-saves`. Cloud Run: 1 vCPU, 512 MiB, sem GPU, min=0, max=3, concorrência=20 e timeout=30s. Não há alteração nos serviços existentes. O limite de instâncias reduz exposição; não é teto financeiro. Configure alertas de custo no projeto antes de liberar acesso amplo.

O banco nomeado novo não usa a franquia gratuita já atribuída a outro banco do projeto. Bucket privado com acesso público impedido e soft delete desativado: principal + backup são a recuperação proposta; não há histórico ilimitado. A localização não pode ser alterada depois de criado. Não são criadas chaves privadas de service account.

## Conta e frontend

Firebase Authentication existente já permite email/senha. Tokens verificados no servidor, incluindo revogação e email confirmado. Senhas são enviadas diretamente ao Firebase, nunca ao backend/Firestore. O frontend guarda tokens apenas em memória; recarregar exige novo login. Não há SDK remoto nem login obrigatório para jogar.

`online-config.json` vem com `enabled: false`. Após implantar e testar: preencher a chave **pública** do Firebase para essa aplicação e URL real retornada pelo Cloud Run; restringir essa chave às APIs Authentication/Secure Token e às origens necessárias, adicionar domínio autorizado no Firebase e configurar CORS com a origem exata do Cloudflare. Habilitar a integração apenas após revisar os textos de privacidade/termos da operação online. O build do site ajusta `connect-src` apenas quando online estiver habilitado.

A publicação no CH-site continua manual. Este trabalho não publica nem altera o Cloudflare.

## Saves e concorrência

GET `/v1/saves/main`, GET `/v1/saves/main?backup=true`, POST `/v1/saves/main` com `{expectedRevision,save}`. Primeiro save exige revisão `null`; revisão ausente é recusada. Login oferece restauração, sempre com confirmação. Upload exige clique; sem autosave na nuvem. Conteúdo passa pelo mesmo `parseImportedSave` do jogo; limite 2 MB. Arquivos locais e `lhs-save-v1` permanecem disponíveis.

Implementação inicial usa **proxy limitado pela API**, em vez de URL assinada, para validar antes de aceitar. GCS guarda objetos imutáveis; Firestore guarda somente ponteiros principal/backup e revisão. A gravação GCS exige `ifGenerationMatch: 0`; transação Firestore compara a revisão e troca os ponteiros atomicamente. Concorrência gera HTTP 409 e não destrói a versão mais nova. Backup é o principal anterior. Snapshot não concede Cookies nem direitos. Saves inválidos não são promovidos.

Após sucesso, o backup descartado é apagado. Queda do processo entre upload e transação, ou falha de limpeza, pode deixar objeto órfão. Antes da operação pública, adicionar rotina de reconciliação que remova apenas objetos com mais de 24h que não estejam referenciados em nenhum slot. Não aplicar TTL indiscriminado aos saves vivos. URL assinada com staging/validação continua uma otimização posterior.

## Cookies e pagamentos

GET `/v1/account` retorna saldo/direitos. POST `/v1/items/:itemId/purchase` consulta catálogo do servidor e usa transação para saldo, direito e ledger. Item já adquirido não é cobrado novamente. Catálogo inicialmente vazio; nenhum visual premium ou efeito funcional foi inventado.

Checkout Mercado Pago está preparado como candidato, **desativado**, com sandbox por padrão. Nenhum preço foi aprovado. POST `/v1/orders` exige pacote e `Idempotency-Key`. GET `/v1/orders/:id` só retorna pedidos do próprio UID. Webhook verifica HMAC/timestamp, consulta pagamento ao Mercado Pago, verifica moeda, valor, ambiente e referência, e grava crédito/ledger atomicamente. Repetição e notificações antigas não recreditam. Estorno parcial reduz crédito proporcionalmente; total/chargeback reverte. Se Cookies foram gastos, saldo pode ficar negativo e bloqueia novas compras; direitos anteriores permanecem para análise/reconciliação manual. Não é política comercial final de estorno.

Antes de habilitar: aprovar provedor/pacotes/preços, configurar `COOKIE_PACKAGES_JSON` e `COOKIE_ITEMS_JSON` exclusivamente no servidor, `PUBLIC_API_URL`, `PAYMENTS_MODE` e segredos `MP_ACCESS_TOKEN`/`MP_WEBHOOK_SECRET` pelo Secret Manager, concedendo `roles/secretmanager.secretAccessor` somente nesses segredos à conta do backend. Não colocar segredos em arquivo versionado ou frontend. Testar Pix/cartão sandbox, duplicação, estorno, chargeback, chamadas concorrentes e pagamentos duplicados no mesmo pedido. Um segundo pagamento no mesmo pedido exige reconciliação manual e não recebe crédito automático. O controle de checkout hospedado aparece somente quando a API informa pagamentos habilitados e pacotes configurados. O jogador abre o link e pode consultar novamente o saldo; itens decorativos ainda exigem catálogo/arte aprovados e integração de propriedade no renderer. Nenhum retorno do navegador confirma pagamento.

## Verificações e pendências para liberação

Node 22+ no container e nos testes. `npm ci` na pasta do jogo; `npm ci` na pasta backend; `npm run build`; `node --test backend/tests/*.test.mjs`; suíte existente do jogo. Os testes locais cobrem inicialização HTTP, autenticação obrigatória, CORS, upload excessivo, JSON inválido, cobrança desativada, assinatura/tampering/expiração, conflitos, valores e reversões; **não substituem testes integrados contra Firestore/GCS/MP**.

O daemon Docker local está indisponível; a imagem não foi construída localmente. Verificação real concluída: `/health` 200, 401 sem token, email não verificado 403, contas isoladas, save/leitura/backup, importação inválida e revisão ausente 400, concorrência com um vencedor e um 409, Cookies inalterados por save adulterado, GCS privado e Firestore negando acesso direto ao jogador. Pagamentos retornam 503, conforme configuração. Origem de navegador não configurada recebe 403. Três contas temporárias e seus dados foram removidos; bucket de saves vazio ao final. Ainda testar falha de rede e abuso sustentado antes de abrir acesso amplo. Testar o container real e IAM, mobile e restauração após fechar/reabrir. Criar procedimento de exclusão de conta/saves e retenção de ledger, reconciliação, monitoramento e orçamento. Login opcional não implica conclusão de antifraude; Firebase signup/Cloud Run requerem monitoramento de abuso antes do acesso amplo.

Referências oficiais: [Cloud Run deploy](https://docs.cloud.google.com/sdk/gcloud/reference/run/deploy), [Firestore/IAM por banco](https://cloud.google.com/firestore/docs/manage-databases), [Mercado Pago Checkout](https://www.mercadopago.com.br/developers/en/reference/online-payments/checkout-pro-preferences/overview).


Verificação local concluída: build TypeScript; suíte de 236 testes (227 aprovados, 9 auditorias opt-in ignoradas, zero falhas); 5 testes backend aprovados; site com 10 páginas, 337 referências e 48 módulos verificados; auditoria npm sem vulnerabilidades conhecidas. Execução local com Node 24 do runtime disponível; o CI adicionado verifica Node 22 e container sem credenciais cloud. O teste explícito `backend/scripts/live-smoke.mjs` validou os serviços reais com contas temporárias e limpeza em `finally`; exige token OAuth administrativo e chave pública Firebase somente em variáveis de ambiente. Não roda automaticamente na suíte local. Pix/cartão/estornos reais e uso pelo frontend Cloudflare ainda não foram ativados nem validados.
