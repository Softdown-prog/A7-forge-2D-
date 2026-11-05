# Angular como build, artefato e container canônicos

O frontend institucional Angular é canônico. Compilar e testar localmente não
publica por si só; a sincronização é responsabilidade do GitHub Actions após
atualização da `main`.

| Comando/arquivo | Resultado |
| --- | --- |
| `npm run build:site` | Angular AOT + HUD/Canvas, cache do grafo do jogo e prerender público; saída `out/site`. |
| `npm run check:site` | Confere propriedade Angular, metadados, hashes, prerender, páginas privadas e gate financeiro fechado no mesmo `out/site`. |
| `Dockerfile` | Frontend estático Angular, usuário `node`, porta 8080, CSP/cache/404 e `/health`; sem API, dependências de build ou browser na imagem final. |
| `backend/Dockerfile` | API Node 22 com os mesmos módulos de validação de saves e dependências de produção; contexto continua na raiz do LHS. |
| `build:site:legacy` / `check:site:legacy` | Fixture de regressão e rollback em `out/site-legacy`; nunca substitui `out/site`. |
| `build:site:clean` | Build de baixo nível para diagnóstico, antes do prerender. O comando padrão é `build:site`. |

## Abertura do jogo e identidade visual

Os links Jogar levam diretamente a `/game/`, na mesma aba e no mesmo domínio.
O menu Canvas/HUD ocupa sua própria página; não existe iframe no site canônico.
A rota `/jogar/` continua acessível para links antigos, com um link normal para
abrir o jogo. O menu do jogo oferece Voltar ao site, levando à home Angular.
O domínio, o caminho do jogo e a chave dos saves locais permanecem os mesmos.

A apresentação Angular recupera a identidade Terminal de Bairro: monitor CRT,
seções em papel claro, cronologia ilustrada e arte dos saves. Não carrega o CSS
ou o JavaScript institucional legado. Os testes de navegador exercitam o jogo
no documento principal, incluindo compras, PCs/hardware, F5, retorno ao site e
continuação da partida preservada.

## Construir e executar localmente

```sh
cd games/lan_house_simulator
npm ci
npx playwright install --with-deps chromium
npm run build:site
npm run check:site
npm run validate:site:clean

docker build -t lhs-frontend .
docker run --rm --read-only --cap-drop ALL -p 127.0.0.1:8080:8080 lhs-frontend
docker build -f backend/Dockerfile -t lhs-backend .
```

O build instala o toolchain Angular pelo lockfile próprio quando necessário. A
imagem de build instala somente Chromium headless para o prerender. A imagem final
contém o artefato estático e o servidor Node sem dependências adicionais. O runtime
respeita `_headers`, aceita GET/HEAD, devolve 404 real para endereços desconhecidos,
recusa métodos de escrita e não expõe o backend ou arquivos fora da raiz pública.

O CI constrói o Dockerfile padrão e abre o container real no Chromium em
1280/414/360, com filesystem somente leitura, usuário sem privilégios e capabilities
removidas. O workflow de backend constrói explicitamente `backend/Dockerfile` e
confere saúde, autenticação e ausência de frontend na API. O wrapper PowerShell
de Cloud Run monta um contexto temporário com somente os inputs da API; não usa o
Dockerfile padrão do frontend. O parser PowerShell é verificado sem executar
comandos de nuvem.

## Publicação automática no Cloudflare Pages

O workflow `lhs-pages-sync.yml` executa **automaticamente após um push ou merge
na `main`** que modifique `games/lan_house_simulator/**` ou o próprio workflow.
Não executa em pushes de outras branches nem em PRs não mesclados.

1. Usa exclusivamente o SHA do evento de `push` da `main`, sem exigir input manual.
2. Instala dependências, compila Angular, executa contratos e o gate Chromium
   (site real, navegação, checkout e regressões) antes de consultar qualquer
   segredo de publicação. Falha em qualquer etapa impede a sincronização.
3. Confere se o SHA ainda é o HEAD remoto da `main`. Se outro commit chegou
   durante o teste ou a preparação, ignora a publicação obsoleta; uma execução
   da revisão mais recente assume a atualização. A mesma proteção é repetida
   antes do push ao espelho.
4. Publica o mesmo `out/site` aprovado no espelho
   `Softdown-prog/a7-forge-2d`, preservando o hash dos inputs e o manifesto
   `.lhs-approved-site.json`; o Cloudflare recebe o push do espelho.

A concorrência `lhs-pages-production-sync` impede publicações simultâneas.
Quando uma revisão já está espelhada, o workflow não cria novo commit.
O workflow **não implanta a API do Cloud Run**, não credita Cookies nem altera
o modo de pagamentos: essas ações seguem controles independentes.

### Publicação manual e rollback

`workflow_dispatch` continua disponível para recuperação e rollback:
executar na `main`, informar um `source_sha` com 40 caracteres que pertença
à história da `main` e marcar `approve_production: true`. A execução manual
também passa pelos mesmos testes. O mecanismo de bloqueio de commits antigos
é aplicado apenas ao gatilho automático, para permitir rollback explícito.

O job conserva o environment `lhs-production` e a credencial
`LHS_PAGES_MIRROR_SSH_KEY`. **Se houver aprovadores obrigatórios nesse environment,
o GitHub continuará exigindo aprovação humana inclusive para o gatilho automático.**
A liberação dessa regra ou a disponibilidade do segredo são configurações externas
do repositório, não assumidas nem alteradas pelo workflow.

A publicação do front-end, mesmo com testes verdes, não significa aprovação
jurídica, SEO, homologação de pagamentos reais ou validação em Android físico.
Para pagamentos, o front-end só apresenta o checkout se o catálogo e o backend
indicarem produção, e o crédito depende de confirmação pelo servidor.

## Rollback

Guardar o identificador da implantação Cloudflare anterior antes de autorizar a
nova. Preferir restaurar essa implantação pelo painel da hospedagem. O workflow
manual também pode publicar um SHA anterior já mesclado na `main`, com autorização
explícita e a validação correspondente. `out/site-legacy` permite ensaiar o frontend
anterior sem sobrescrever o canônico; uma troca para ele exige uma alteração de
publicação revisada, não um fallback silencioso.

Não restaurar bancos, apagar armazenamento local, sobrescrever saves ou reprocessar
pedidos. O endpoint remoto da API, a origem do site e as chaves locais não mudam.

O `noindex` e a revisão jurídica/SEO continuam questões independentes.
`productionCheckoutEnabled: true` habilita apenas a apresentação do checkout
quando a configuração remota do provedor é válida; não comprova o backend
implantado nem autoriza créditos sem confirmação do pagamento.
