# Migração institucional Angular — entrega consolidada da issue #78

**Atualização:** [Angular como build e container canônicos](ANGULAR_CANONICAL_DELIVERY.md)
substitui as instruções históricas de publicação e os caminhos de saída abaixo.

Base: PR #77, mesclado externamente durante a execução. As alterações restantes
estão em um único PR de conclusão, branch `feat/lhs-angular-migration-complete-78`.

Destino único: `frontend-angular/src/site-rewrite/`. O artefato de homologação é
`out/site-clean-angular/`. O workflow `lhs-clean-angular-rewrite.yml` constrói,
testa e anexa esse diretório; não publica, não altera a `main` e não usa credenciais
de pagamento. A implantação pública continua no workflow `lhs-pages-sync.yml`.

## Matriz de paridade

| Rota | Implementação e evidência obrigatória |
| --- | --- |
| `/` | Hero/CTAs, clientes/PCs/finanças, timeline, save por arquivo, FAQ e CTA final; snapshot público sem JS, teclado, gesto e F5. |
| `/jogar/` | Abertura explícita, iframe Canvas + HUD Angular, carregamento/erro/repetição, tela cheia e nova aba; consentimento original preservado. F5 retorna à prévia. |
| `/sobre-o-jogo/` | Narrativa, seis recursos, imagem, CTA e uma timeline; Chromium nas três larguras e snapshot sem JS. |
| `/sobre-nos/` | Marca Softdown, identidade Terminal de Bairro, projeto independente, progresso local e links; Chromium e snapshot. |
| `/ajuda/` | Guia completo, âncoras, sete respostas, pesquisa sem acentos, limpar/foco e nenhum resultado; deep link, F5 e snapshot. |
| `/contato/` | Relatos, suporte privado, email público verificado contra configuração, dados/privacidade; links, F5 e snapshot. |
| `/conta/` | Firebase REST independente, cadastro com consentimento, login, recuperação, confirmação, sessão de oito horas, refresh uma vez, sair, saves principal/backup e histórico privado. Upload limitado/validado exige confirmação e revisão otimista. Chromium com transporte fictício. |
| `/conta/confirmar/` | Códigos sintéticos em fragmento/query, limpeza antes de I/O, confirmação explícita, expiração/erro/F5, CSP e referrer; nunca pré-renderizar dados privados. |
| `/donate/` | Catálogo, revisão autenticada, termos, pedidos sandbox, idempotência persistida por conta/API/pacote, limites, 401/409/410/503/timeout e histórico em Minha conta. Produção preparada com gate fechado. |
| `/termos/` | Dez seções e índice Angular, âncoras, F5 e snapshot. Aviso de revisão permanece até aprovação do responsável. |
| `/privacidade/` | Onze seções e índice, canais de contato, dados locais/nuvem/pagamentos, âncoras e snapshot. Revisão jurídica não é inferida dos testes. |
| `/dados/` | Save e som separados, confirmação/cancelar/Escape, falha de storage e isolamento das demais chaves; sem snapshot privado. |
| `/404/` | `404.html` pré-renderizado sem JS, H1/metadados próprios, resposta 404 para endereço inexistente, navegação e F5; sem fallback SPA com sucesso HTTP indevido. |

A conferência inclui HTML público obtido por GET de `https://lhs.analysepro.com`,
sem executar scripts, autenticar ou consultar APIs financeiras. O inventário
registra data, status final após redirects, hash SHA-256, títulos, seções, links e
CSP. Textos e layout Angular são independentes; equivalência jurídica depende
de revisão humana.

## Executar e conferir

Com Node 24 e as dependências dos três projetos instaladas:

```sh
cd games/lan_house_simulator
npm ci
npm ci --prefix frontend-angular
npm ci --prefix backend
npm install --no-save --no-package-lock playwright@1.56.1
npx playwright install --with-deps chromium
npm run validate:site:clean
```

O comando executa testes Node do jogo e contratos do backend de produção,
lint `no-explicit-any`, AOT/TypeScript estrito, budgets de 1 MB, build e check do
legado, artefato Angular isolado, prerender público, auditoria e todas as suítes
Chromium desktop 1280/mobile 414/360. O backend Nest experimental tem workflow
próprio; seus testes não substituem os contratos do backend Express em produção.
O workflow SAC existente continua obrigatório e verifica pre/build/post e
Guardian em container sem rede na revisão fixa do toolchain.

Evidências em `out/site-clean-angular-browser/`: `validation-results.json`,
`published-route-inventory.json`, `cutover-readiness.json`, relatórios de conta,
confirmação, Donate, `migration-results.json` e capturas. O relatório distingue
SHA de origem e alterações locais; somente Actions do commit final comprovam o
estado exato enviado. Aprovação técnica e autorização para produção são estados
separados; `cutover-readiness.json` permanece `not-ready` nesta entrega.

## Checkout de produção: preparado, desligado

`frontend-angular/src/site-rewrite/public/checkout-config.json` contém
`productionCheckoutEnabled: false`. Ele é copiado para a raiz, servido com
`Cache-Control: no-store` e consultado novamente antes de preparar um pedido.
A habilitação requer alteração explícita desse arquivo e aprovação do dono e
do provedor; a flag do backend sozinha não habilita a interface Angular.

O padrão versionado e a validação de homologação permanecem desligados. Após
aprovação, aplicar a configuração no `checkout-config.json` da publicação;
desligar esse mesmo arquivo é o rollback financeiro. Não usar o perfil de
homologação com gate fechado como autorização para ativar pagamentos.

Quando aprovado/configurado, o fluxo pede sessão restaurada, email confirmado,
cotação autoritativa e aceite. O POST envia apenas pacote/termos e a chave de
idempotência; preço e Cookies nunca são aceitos do formulário. Mudança do modo ou
dos valores impede o POST. Um 401 permite uma renovação com a mesma chave; um 410
exige nova revisão/aceite. Falhas incertas e F5 preservam a chave por conta/API;
no máximo três tentativas explícitas são permitidas por intenção. Não há retry
automático de rede nem redirecionamento automático: a URL HTTPS validada é
oferecida como link após preparar o pedido. O retorno do provedor não credita nada.
Os testes habilitam o gate somente por interceptação local, com respostas sintéticas.

## Cutover e rollback após aprovação

1. Revisar o PR único, Actions de seu SHA final, SAC e artefato de homologação.
   Guardar o SHA anterior e o identificador da implantação Cloudflare atual.
2. Validar o artefato em ambiente de homologação com os mesmos `_headers`, 404 e
   caminhos. Conferir no aparelho Android real, conta de teste autorizada e cache/CDN.
   Não importar automaticamente nenhum save, não limpar storage e não trocar domínio.
3. Obter aprovação editorial/jurídica, de metadados/SEO e de publicação. Este PR
   preserva `noindex,nofollow` e `robots.txt` fechado. A retirada desses avisos é
   uma decisão de publicação, após conferir origem canônica e sitemap reais.
4. Em alteração de publicação revisada, fazer o workflow produtivo consumir o
   mesmo build/check/prerender/validação Angular e configurar o Pages para
   `games/lan_house_simulator/out/site-clean-angular`. O comando de build deve
   produzir o artefato completo, inclusive prerender; somente `build:site:clean`
   deixa o HTML público anterior ao snapshot. Não enviar credenciais de produção
   para etapas de testes. A origem e as chaves de storage continuam as mesmas.
5. Após autorização, publicar uma vez e conferir as 13 rotas, erro HTTP 404,
   navegação/iframe/saves, cabeçalhos, assets com hash e configuração sem cache.
   Habilitar pagamentos somente em aprovação específica, independente do cutover.

Se a publicação falhar, reativar a implantação Cloudflare anterior pelo ID
guardado e restaurar o comando `npm run build:site` e a saída
`games/lan_house_simulator/out/site`. Se necessário, reverter somente o commit de
configuração da publicação no repositório. Não restaurar bancos, sobrescrever
saves, apagar storage nem reprocessar pedidos. Desligar o gate financeiro se a
falha envolver checkout. Conferir HTML/configuração revalidada e executar smoke
do endereço público após o rollback.

## Consumidores legados preservados com motivo

| Consumidor | Dependência comprovada e condição para remoção |
| --- | --- |
| Cloudflare e `lhs-pages-sync.yml` | Ainda compilam `website/build.mjs` para `out/site`; remover depois do cutover autorizado e janela de rollback. |
| `scripts/build.mjs` | Copia `website/account-client.mjs` para o contrato de conta do jogo e usa a imagem de reserva do legado. Não remover junto com a migração institucional sem migrar esse consumidor e testar o jogo. |
| Build isolado `npm run build` e verificações do jogo no workflow produtivo | Ainda usam o bootstrap React de compatibilidade; `out/site-clean-angular` remove o bootstrap emitido, mas os testes existentes continuam dependendo da fonte. |
| `site-shell` | Compatibilidade da implantação atual e testes de build anteriores ao cutover. Sem novas funcionalidades institucionais nessa árvore. |

Não remover `website/`, React ou `site-shell` agora: isso quebraria consumidores
ativos e o rollback exigido pela issue. O gate AST impede imports institucionais
dessas árvores no novo aplicativo. O motor Canvas, preços/saves, backend de
produção, segredos e workflow de publicação não são alterados.

## Intervenção humana necessária

- Aprovar textos jurídicos, identidade do operador e informações de provedores.
- Validar metadados, origem/sitemap e autorizar indexação/cutover no Cloudflare.
- Aprovar/configurar o prestador de pagamento e o gate financeiro; nenhum pedido
  real ou homologação financeira é produzido pelos testes.
- Homologar Android físico e integração autenticada com conta de teste autorizada,
  além de validar a aplicação real dos cabeçalhos/cache na hospedagem escolhida.
