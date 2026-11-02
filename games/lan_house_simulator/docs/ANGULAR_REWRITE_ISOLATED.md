# Reescrita institucional Angular — branch isolada

**Branch:** `rewrite/lhs-angular-site-clean`. **PROIBIDO merge na main ou deploy enquanto a reescrita não estiver completa.**

A implementação anterior não era uma reescrita: `website/build.mjs` renderiza o HTML, `website/site.mjs` registra handlers globais e `frontend-angular/src/site/main.ts` monta ilhas Angular por cima. Esse desenho cria duas autoridades para o mesmo DOM, especialmente navegação, FAQ e animações. Não afirmar que Bootstrap ou Alpine existam sem evidência.

## Canonicidade e convivência temporária

**Raiz canônica do front-end:** `frontend-angular/`. Dentro dela, `src/site-rewrite/` é a implementação institucional **nova e única** que deverá sobreviver ao cutover; `src/site/` é a implementação Angular antiga, apenas transitória, e será removida após concluir a substituição e trocar os workflows.
`website/` é **legado de produção**, não a fonte de verdade do novo site. Ela existe para manter o endereço público funcionando até que a aplicação nova tenha paridade funcional e seja aprovada. Não fazer novas funcionalidades institucionais em `website/` nem em `frontend-angular/src/site/`.
`src/` na raiz do LHS contém o motor de jogo TypeScript/Canvas e permanece separado da camada de interface (a UI do jogo usa o projeto Angular `game-ui`). Não apagar a simulação por confundir TypeScript com um segundo framework visual.

A partir desta etapa, o site novo mantém seus recursos em `frontend-angular/src/site-rewrite/public/assets/`. O build independente **não lê imagens nem CSS de `website/`**. Durante a migração, os arquivos legados ainda existem por necessidade da produção; não são usados pelo artefato `out/site-clean-angular/`. Ao completar todos os fluxos, remover `website/` e o `site-shell` legado junto com suas referências em CI/deploy em uma alteração única e testada — não manter duas versões publicáveis.

## Arquitetura substituta
- Aplicação única em `frontend-angular/src/site-rewrite/`, com DOM, templates, estilo e estado próprios.
- Sem importar `website/site.mjs`, `website/content.mjs`, `website/site.css`, React, Alpine ou Bootstrap.
- O motor Canvas é um artefato independente, inserido por iframe isolado. Não reescrever o motor na migração institucional.
- Nenhum sistema novo deve usar `innerHTML`, `document.querySelector` para manipular a interface ou listeners DOM concorrentes.
- Publicação futura deverá servir apenas `out/site-clean-angular/`; o `out/site` atual não deve ser alterado no desenvolvimento.

## Bloqueios de aprovação
- Migrar de verdade todas as páginas, inclusive termos, privacidade, dados, Firebase Auth/saves e Donate/Mercado Pago, antes de cutover.
- Preservar metadados por rota e resolver pré-renderização/SEO. Proibido alegar SEO satisfatório com CSR vazia.
- Testar abertura, deep links, F5, Android Chrome (incluindo viewport e gesto de rolagem), sessões de jogo e cache/CDN.
- Provar zero bundles React, `site.mjs` legado ou estilos do site antigo carregados; nenhum listener duplicado.
- CI com Angular strict, Playwright Chromium desktop/mobile, e validação do endereço público **antes** de concluir qualquer publicação.

O primeiro commit desta branch inicia um projeto Angular independente. Fluxos inacabados permanecem desabilitados nesta prévia e **não** devem substituir a produção.

## Etapa adicional — Conteúdo legal Angular autônomo
- `src/site-rewrite/legal-content.ts` contém conteúdo independente e tipado, com 10 seções de Termos e 11 de Privacidade, sem importar os antigos scripts ou renderizar HTML arbitrário.
- `site-app.html` renderiza índice âncora, seções e links através de bindings Angular. Nada é montado pelo JavaScript legado.
- Esta é **uma versão para revisão editorial/jurídica**, sem publicação; não afirmar equivalência literal ou validade jurídica definitiva. Identificação do operador, provedores e comportamentos da conta/pagamentos ainda precisam homologação.
- Inclusão de testes no Chromium para rotas, links, links âncora e F5, inclusive telas pequenas.

## Etapa Dados locais — reescrita Angular exclusiva
- `frontend-angular/src/site-rewrite/local-data.ts` e `local-data.html` oferecem gerenciamento autônomo de **apenas** `lhs-save-v1` e `lhs.sound`; nenhuma importação de `website/data-controls.mjs` ou JS que reescreva DOM.
- Exclusão separada com `<dialog>` nativo, confirmação explícita, cancelamento/Escape, status acessível e tratamento de bloqueio do `localStorage`. Não há `localStorage.clear()` nem remoção de chaves de outros aplicativos.
- A partida deve ser fechada antes da exclusão; saves já baixados e arquivos da conta/nuvem não são removidos. **Não** foi introduzido controle de exclusão de nuvem ou import/export independente: a exportação permanece no menu Canvas do jogo, que será validado na etapa de conta e saves.
- O Chromium deve cobrir o cancelamento e a confirmação, isolamento de chaves, recuperação após F5, teclado/toque e erro de armazenamento nas três larguras. Produção continua inalterada.

## Conta e saves na nuvem — client Angular isolado
- O cliente e controlador foram reescritos em TypeScript em `src/site-rewrite/account-client.ts`, `account.ts` e `account.html`, sem importar `website/account.mjs` nem `website/account-client.mjs`.
- Mantém Firebase email/senha (consulta de email confirmado), expiração da sessão de oito horas, renovação de token, sair da conta, checagem autenticada do backend e status de conta.
- Upload requer JSON exportado pelo jogo e validação via `/game/js/sim/saveTransfer.js`, com limite de 2 MB, confirmação nativa e revisão otimista `expectedRevision`. HTTP 409 obriga conferir a revisão antes de novo envio. Download principal/backup também valida o arquivo.
- O envio nunca altera a partida local. Os testes devem interceptar Firebase/API com dados fictícios, sem criar contas reais nem publicar o site.
- A confirmação de email por link foi implementada na etapa seguinte, abaixo. A integração com Donate permanece pendente e bloqueia o cutover.

## Continuação após PR #54 — confirmação de email Angular

- Base auditada: `7a085971ee4f074b5db3ca9d4093e0d132159f7f` (merge do PR #54). A conta e os saves já estão implementados no novo site; a rota `/conta/confirmar/` ainda era placeholder.
- `email-confirmation.ts/.html` e `email-confirmation-client.ts`, na raiz canônica Angular, agora são os únicos donos da nova rota. Nenhum import do JS legado de confirmação, manipulação concorrente do DOM, persistência do código, auto-login ou alteração de saves.
- Aceita o link marcado de Resend `#codigo=...` e ação Firebase `?mode=verifyEmail&oobCode=...`. Rejeita códigos duplicados/ambíguos, inválidos ou outro modo. Remove fragmento e query antes do primeiro trabalho assíncrono; falha de limpeza impede confirmação.
- Não confia em `apiKey`/`continueUrl` vindos do link. Usa somente `/account-config.json` e endpoint fixo Firebase `accounts:update`, com código no POST, timeout e referrer de origem. A página compilada tem meta referrer `no-referrer`. Links Firebase com código na query inevitavelmente chegam no primeiro request HTTP: preferir os links marcados em fragmento para não registrar códigos no servidor.
- O envio exige clique explícito para evitar consumo por scanners de email. Bloqueia cliques simultâneos e descarta o código após sucesso ou erro permanente; falhas transitórias permitem nova tentativa na mesma página. F5 não repete o envio nem recupera o código; o usuário precisa reabrir o email se recarregar antes de confirmar.
- Testes Node exercitam o cliente TypeScript real compilado em memória; Chromium cobre desktop1280/mobile414/360, toque, deep links/F5, HTTP/expiração/sem conexão, CSP, chave/redirect não confiáveis e preservação de storage. Firebase/API são interceptados; não são criadas contas reais ou enviadas mensagens.
- O projeto `site-rewrite` desativa somente a injeção de CSS crítico/carregador inline gerada pelo otimizador; JS/CSS continuam minificados e servidos como arquivos, compatíveis com a CSP sem unsafe-inline. Jogo e site-shell não mudam.
- O workflow isolado agora também roda em PRs e produz evidências da confirmação antes dos cenários completos de conta/site. Nada muda o deploy ou o artefato legado de produção.

### Pendências para Angular completo / cutover

1. Donate/Mercado Pago ainda está desabilitado na nova UI; migrar cliente e fluxo com sandbox/mocks antes de qualquer pagamento real.
2. Pré-renderização/SEO/metadados por rota, conteúdo institucional restante e revisão editorial/jurídica precisam homologação; o shell CSR não é SEO completo.
3. Confirmar paridade dos painéis ainda imperativos do jogo separadamente do site; não substituir a simulação/Canvas por UI.
4. Só remover `website/`, `site-shell` e dependências React após paridade e regressões completas; validar Android real e fluxo de cache/CDN/publicação em etapa explicitamente autorizada.

Esta etapa avança a migração, mas **não declara o frontend inteiro concluído**. Continua sem merge/publicação.

### Microetapa — Donate institucional Angular (somente leitura)
- Catálogo e FAQ próprios em `src/site-rewrite/donate.ts`/`donate.html`, sem qualquer script de `website/`.
- Consulta exclusivamente `/account-config.json` e `/v1/config`, sem credenciais. Os dois botões ficam desabilitados mesmo quando o backend declara pagamentos ativos.
- Não cria pedidos, não recebe checkout, não credita Cookies, não confia em parâmetros de retorno do provedor. A integração autenticada, idempotência e histórico são a próxima etapa.
- Testes devem interceptar toda chamada externa e verificar atualização visual, F5 e ausência de requisições de pedidos.

### Microetapa seguinte — metadados estáticos por rota, ainda sem prerender

- Fonte única de títulos e descrições em `src/site-rewrite/page-metadata.json`, consumida pelo Angular e pelo build isolado.
- Cada rota recebe título/description/Open Graph próprios no HTML servido, antes de iniciar o JavaScript. Rota 404 e confirmação de email também são cobertas; a confirmação mantém `referrer=no-referrer`.
- A prévia continua `noindex,nofollow`, com `robots.txt` bloqueando indexação; domínio canônico não foi presumido.
- **Não é SSR ou prerender do conteúdo.** O corpo segue CSR; SEO e publicação só serão homologados após pré-renderização, paridade completa e análise editorial.
- `check:site:clean` valida os HTMLs gerados e Chromium valida título/descrição/OG por rota em desktop e mobile.
- O workflow isolado passa a observar a branch `feat/lhs-angular-next-stage-20261101`, sem mudanças no deploy da `main`.


### Microetapa — histórico de Donate autenticado e somente leitura

- A página `/donate/` oferece consulta manual de até 10 pedidos da própria conta, exclusivamente `GET /v1/orders`, reutilizando o cliente Firebase Angular com sessão e confirmação de email.
- O transporte permite essa rota **somente com GET sem corpo**; a UI não solicita `POST /v1/orders`, não gera idempotency keys, não abre checkout e não confirma Cookies por parâmetros de retorno.
- Pedidos são validados com modelo tipado e rótulos controlados; respostas inválidas falham fechadas e status desconhecidos não aparecem como pagamento aprovado.
- Sem consulta automática ao abrir a página, com orientações para login/verificação. Os botões de compra continuam desabilitados mesmo se o backend anunciar pagamentos ativos.
- Testes Node exercitam o parser TypeScript real; Chromium usa contas e pedidos sintéticos, com requests externos interceptados e cenários desktop/mobile, sessão ausente, email não confirmado, lista válida e payload inválido.
- Não é ativação de pagamentos, SSR/prerender ou autorização de deploy; frontend público segue independente.


### Microetapa — histórico particular movido para Minha conta
- O histórico autenticado deixou a página pública `/donate/`. Ela mantém apenas o catálogo, FAQ e o link `/conta/#apoios` para acessar a área privada.
- Após entrar e confirmar o email, o dashboard Angular oferece duas abas: `Salvamentos` (padrão, sem regressão nos controles de save) e `Pagamentos e apoios`. O deep link seleciona a segunda aba sem consultar automaticamente a API.
- A consulta é explicitamente acionada pelo jogador através do cliente Firebase Angular e usa somente `GET /v1/orders`, validando os dados com `readDonateOrders`.
- Ao sair da conta, o histórico em memória é apagado. F5 não recarrega a lista sem novo clique. A navegação não credita Cookies, não cria pedidos nem abre checkout.
- Os testes do Chromium exercitam login, email não confirmado, navegação Donate → Minha conta, F5, logout, Android e respostas sintéticas válidas/inválidas. Produção e `main` não são publicadas por esta etapa.


### Microetapa — HTML público pré-renderizado por Chromium, antes do cutover
- `scripts/prerender_clean_angular_site.mjs` executa o bundle Angular já compilado em um Chromium isolado, sem acessar a rede externa, e grava **HTML estático real** das oito páginas públicas: início, jogar, sobre o jogo, sobre nós, ajuda, contato, termos e privacidade.
- O bundle Angular e seus eventos são preservados. Uma segunda passagem verifica que o JavaScript pode reabrir a página sem duplicar header, H1 ou footer; outra valida HTML acessível com JavaScript desativado.
- Conta, confirmação de email, Donate e dados locais **não** são pré-renderizados, evitando exposição de sessões ou informações privadas. `angular-prerender-manifest.json` documenta essa lista fechada.
- Isto é um **snapshot de browser em build isolado**, não Angular SSR/hydration; mudanças de conteúdo dinâmico exigem novo build. Não cobre indexação completa nem autoriza publicar o domínio. `robots.txt` e `noindex,nofollow` permanecem bloqueando indexação.
- O workflow de pesquisa executa a pré-renderização antes da bateria Chromium existente. O comando legado `build:site:clean` continua produzindo CSR como base; o snapshot é uma segunda etapa explicitamente invocada.


### Microetapa — contrato de checkout simulado, sem transações reais
- `frontend-angular/src/site-rewrite/checkout-contract.ts` define um contrato tipado e independente para a futura integração de pagamento, **sem ser importado pela UI pública**.
- O contrato rejeita ausência de conta verificada, falta de aceite dos termos, pacote não aprovado, chave de idempotência inválida, catálogo de produção, resposta de preço incorreta e URLs que não pertençam ao domínio HTTPS de **sandbox** do Mercado Pago.
- O preço/cookies são exclusivamente os valores do catálogo entregue pelo backend simulado (`GET /v1/config`); o futuro pedido usa somente `{packageId,acceptedTerms:true}` com chave de idempotência informada pelo chamador. A resposta permanece explicitamente `not-confirmed` e nunca altera saldo.
- O adapter é injetado apenas nos testes Node com fixtures sintéticas; nenhum acesso real ao Firebase, Mercado Pago ou ao backend acontece nesse fluxo.
- A rota `/donate/` mantém os dois botões desabilitados. A integração autenticada real `POST /v1/orders` **não** está ligada e exigirá revisão separada; o histórico privado em Minha conta continua só de leitura.
- Esta etapa não muda a `main`, não faz deploy e não autoriza cobrança de usuário.
- A CI também executa um `tsc --noEmit` dedicado ao contrato, com `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noUnusedLocals` e verificações rigorosas antes dos testes Node.


### Microetapa — revisão de apoio no Angular, liberada somente em sandbox
- O Angular passa a reconhecer `paymentsMode=sandbox` com `paymentsEnabled=true` e mostra exclusivamente nesse modo o botão **Revisar apoio de teste**, preservando os botões de pagamento real desabilitados.
- Após um clique, a página exige sessão Firebase restaurada e email confirmado antes de consultar o catálogo `GET /v1/config`. A prévia utiliza `validateSandboxQuote` e mostra preço/Cookies autorizados pelo servidor, não valores de formulários ou parâmetros de URL.
- A etapa pede aceite explícito dos termos, mas **Finalizar simulação** apenas altera o estado visual. Não executa `POST /v1/orders`, não abre checkout, não credita Cookies e não faz pagamentos.
- Sem sessão ou com email não verificado, encaminha o jogador a Minha conta. Mudanças de ambiente, respostas inválidas e erros falham sem pagamento. Fechar a revisão limpa valores e aceite.
- O teste Chromium isolado usa login/refresh/lookup e catálogo sintéticos nas larguras 1280/414/360, exige zero requisições de pedido e não libera produção. O contrato completo de criação de pedido continua coberto apenas por unit tests com mock e sem conexão real.

### Microetapa — orçamentos de bundle no Angular 22
- As builds de produção `game-ui`, `site-shell` e `site-rewrite` passam a rejeitar bundles iniciais maiores que `1mb` e avisar acima de `500kb`, via `budgets` nativo do Angular CLI. O CI isolado bloqueia a mudança caso a build exceda o teto.
- O build `site-rewrite` mediu `210,75 kB` no último workflow aprovado (antes da mudança). O valor é uma referência de build, não uma medição de rede em produção.
- Mantemos `outputHashing: none` intencionalmente até a adaptação dos caminhos `main.js`/`styles.css` e da estratégia de cache, que dependem de nomes estáveis no gerador do site. **Não** ativar `all` sem revalidar pré-renderização, Chromium e Cloudflare Pages.
- `tests/clean-site-angular-build-policy.test.mjs` testa os três budgets e confirma que as flags rigorosas do Angular/TypeScript continuam herdadas pelos projetos, sem exigir duplicações de flags implícitas em `strict`.
- Sem alteração no deployment, nas rotas de checkout ou na `main`.


### Microetapa — cache busting com hash no site Angular isolado
- Apenas `site-rewrite` de produção usa `outputHashing: all`; `game-ui` e `site-shell` permanecem com nomes fixos até uma migração própria, preservando a compatibilidade do motor de jogo.
- O gerador lê o `index.html` real do Angular CLI, valida os nomes com hash e religa os caminhos para `/assets/site/<nome-com-hash>` sem presumir `main.js` ou `styles.css`. O manifesto `angular-site-assets.json` registra os arquivos gerados.
- A política `_headers` usa regras exatas para cada arquivo JavaScript/CSS com hash com `max-age=31536000, immutable`. HTML, `account-config.json`, `online-config.json` e `/game/*` não compartilham esse cache longo.
- Verificações estáticas garantem nomes com hash, manifesto, referências no HTML, ausência de JS/CSS antigos e cache por arquivo. Os testes de pré-renderização e Chromium validam que o site inicializa e recarrega após o hash.
- Nenhuma mudança no site publicado, em pagamentos, nos nomes do bundle do jogo ou na `main`. A política de produção Cloudflare Pages ainda precisa ser validada ao fazer o cutover.


### Microetapa — transporte autenticado de pedidos SOMENTE sandbox (sem interface)
- Um adapter TypeScript independente `checkout-sandbox-adapter.ts` é conectado a `simulateSandboxCheckout` apenas por testes de contrato. **Donate não importa nem chama esse adapter**; botões reais continuam bloqueados.
- `SiteAccountClient.postSandboxOrder` valida pacote, aceite e UUID, exige sessão e consulta `GET /v1/config` em modo sandbox, revalida o email por Firebase e envia somente `{packageId,acceptedTerms:true}` com headers `Idempotency-Key`, `Authorization` e `X-LHS-Sandbox-Only: true`. Falhas 401 reutilizam a mesma chave de idempotência.
- O backend reconhece `X-LHS-Sandbox-Only: true` e **rejeita** criação em `PAYMENTS_MODE=production`, mesmo se o ambiente mudar depois da checagem do navegador. Requisições antigas sem o header continuam com o fluxo existente, que permanece fora desta nova interface Angular.
- Testes Node com transporte sintético verificam corpo, token, header, pacote, idempotência, modo produção, email não confirmado, sessão ausente e erros. Nenhuma solicitação real ao Firebase, Mercado Pago ou backend é feita pelos testes.
- Não ocorre checkout, crédito de Cookies, deploy, merge ou habilitação do pagamento de produção. Integrar o botão a esse transporte requer uma etapa posterior e novos testes Chromium específicos.


### Microetapa — preparo de pedido sandbox explícito na interface Angular
- `/donate/` só exibe **Preparar pedido sandbox** após `paymentsMode=sandbox`, sessão restaurada, email verificado e aceite explícito dos termos. O botão de pagamentos reais continua desabilitado e a simulação local anterior permanece separada.
- O cliente executa `simulateSandboxCheckout` com `createAuthenticatedSandboxAdapter`: valida o catálogo novamente, compara preço e Cookies com a revisão antes de enviar e mantém a mesma chave UUID por pacote em tentativas após incerteza de rede. Uma resposta 410 invalida a chave para a próxima tentativa.
- Após um pedido sandbox válido, a interface exibe apenas a referência reduzida do pedido (12 caracteres), nunca redireciona ao provedor, nunca usa dados de retorno de URL para dar crédito e não declara pagamento aprovado.
- A UI não importa código legado, o backend bloqueia o cabeçalho sandbox em modo produção e o Chromium intercepta TODOS os pedidos para testar erro 503, repetição com mesma chave, sucesso e mudança do backend para produção antes do POST. **Nenhuma requisição real de pagamento é feita nos testes.**
- Publicação, fusão na `main`, checkout de produção e recebimento de dinheiro seguem fora do escopo.


### Microetapa — cabeçalho sandbox sem fallback de produção
- `assertSandboxOrderIntent` rejeita valores incorretos, ausentes de conteúdo, repetidos ou com capitalização inesperada no cabeçalho `X-LHS-Sandbox-Only` (HTTP 400). Se o cabeçalho declara `true`, pedidos em `PAYMENTS_MODE=production` são recusados (HTTP 409), independentemente da última consulta do navegador.
- A ausência do cabeçalho preserva o fluxo legado existente, sem remover as exigências de autenticação, email verificado, aceite dos termos e `PAYMENTS_ENABLED`.
- Os testes unitários do backend cobrem combinações de modo e cabeçalho; a suíte de segurança Angular afirma a chamada explícita ao validador. Não são efetuadas transações reais.

### Microetapa — URLs de checkout vinculadas ao ambiente do pedido
- `validCheckout` passa a exigir HTTPS, origem exata do Mercado Pago, sem porta personalizada, credenciais ou fragmento, e o caminho `/checkout/v1/redirect` com um único `pref_id` preenchido.
- Para sandbox comum, aceita apenas `sandbox.mercadopago.com.br` ou `sandbox.mercadopago.com`. Em produção, apenas `www.mercadopago.com.br` ou `www.mercadopago.com`. Um **vendedor de testes identificado pelo backend** pode usar o domínio `www` mesmo em sandbox, mas continua com carteira `cookiesBalanceSandbox`, nunca créditos reais.
- A mesma validação é obrigatória ao criar preferências e ao devolver URLs persistidas em novas tentativas com a mesma chave; URLs incompatíveis resultam em erro 502, sem redirecionamento ou crédito.
- `backend/tests/payments.test.mjs` exercita ambientes cruzados, URL hostil, caminho/fragmento/porta inválidos e repetição idempotente com URL adulterada. O checkout de produção permanece desabilitado na interface Angular e não houve deploy.


### Microetapa — gate de imports da migração Angular (AST)

- `scripts/check_clean_angular_imports.mjs` inspeciona **todos** os arquivos TypeScript em `frontend-angular/src/site-rewrite/`, usando a AST do TypeScript já instalada no projeto Angular. Não executa nenhum módulo do aplicativo.
- Imports e reexports locais precisam permanecer na árvore canônica e apontar para arquivos presentes. Os imports externos permitidos são `@angular/*` e `rxjs`; imports de React, `website/`, `src/site/` e pacotes desconhecidos são rejeitados. Import dinâmico com destino não literal e CommonJS também reprovam. A única exceção explícita é o import via `const` local do validador de save do motor (`/game/js/sim/saveTransfer.js`) em `account.ts`, com caminho exato comprovado por AST; não é código do site institucional legado.
- A CI isolada executa casos positivos, casos quebrados e falso positivo (texto e comentário contendo uma expressão semelhante a import). Conta, Donate, confirmações e demais componentes participam automaticamente da varredura.
- O gate **não** substitui AOT, testes Playwright/Android, prova do bundle ou revisão de pagamentos. Não realiza cutover nem deploy, e o motor TypeScript/Canvas não foi alterado.

### Microetapa — abertura do jogo encapsulada no Angular
- A rota `/jogar/` passa a renderizar `GameLauncherComponent` standalone, OnPush, em `src/site-rewrite/game-launcher.ts` e `game-launcher.html`.
- O componente é o único dono da prévia, botão e iframe `/game/`. O `SiteApp` deixa de controlar `gameOpen` e `startGame`, sem inserir listeners nativos nem mover o motor TypeScript/Canvas para o Angular.
- A abertura continua explícita e o jogo não é carregado antes do clique; F5 volta à prévia. Testes estáticos verificam dono único e IDs; Chromium testa clique desktop, toque mobile, carregamento real do menu no iframe e F5 nas larguras 1280/414/360.
- O site legado e a produção permanecem inalterados; não há manipulação de saves, pagamentos, merge ou deploy nesta etapa.

### Microetapa — Ajuda com componente Angular standalone
- `/ajuda/` agora monta `<lhs-help-search>`, único dono do Signal de pesquisa, filtros, botão Limpar e lista de respostas. A raiz `SiteApp` não controla esse estado.
- `faq` e `normalizeSearch` permanecem no catálogo Angular existente. A busca ignora caixa/acentos e não consulta rede ou JS legado; Limpar restaura sete respostas e o foco.
- Testes estruturais mais Chromium validam busca com acentos, ausência de resultados, toque e clique, foco e F5 em desktop e mobile.
- Só afeta a versão Angular isolada; nenhum deploy, cutover, alteração Canvas ou pagamento.

### Microetapa — timeline de computadores Angular com estado isolado
- `/ ` e `/sobre-o-jogo/` continuam a exibir os quatro marcos (1998, 2005, 2012 e 2024). A apresentação agora é controlada exclusivamente por `EraTimelineComponent` standalone em `era-timeline.ts` e `era-timeline.html` com OnPush + Signals.
- `SiteApp` deixa de possuir `era`, `selectedEra` e `selectEra`. O catálogo permanece em `site-data.ts`; o simulador Canvas, as datas e regras da economia não são alterados.
- Testes de arquitetura e Chromium desktop/mobile validam a troca de 2024 e 2005, os botões `aria-pressed`, imagens e o retorno à seleção inicial após F5, além da ausência nas demais rotas.
- Mudança isolada em branch, sem deploy ou cutover.

### Microetapa — cabeçalho e menu mobile encapsulados no Angular
- `SiteHeaderComponent` standalone, OnPush, usa um Signal próprio para o menu e recebe a rota por `input.required<SitePath>()`. A raiz `SiteApp` não gerencia mais `openMenu` nem os handlers do cabeçalho.
- Preserva logo, links do catálogo Angular, `#site-nav`, `aria-expanded` e `aria-current`. Escape é tratado com um único `@HostListener` Angular, sem registro manual de listeners nativos.
- Testes de fronteira e Chromium verificam montagem única, rota atual, abertura por toque/teclado, fechamento por Escape, reload F5 e comportamento responsivo.
- A alteração fica na prévia Angular isolada: não modifica Canvas, saves, checkout, Cloudflare nem faz cutover.
- A CSP estrita do site usa `style-src 'self'`: o cabeçalho não declara `styles:[]` inline no decorator. Sua regra `display:block` fica na folha externa `site.css`, e um teste impede reintroduzir estilos inline no componente.
