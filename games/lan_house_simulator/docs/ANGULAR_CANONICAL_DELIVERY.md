# Angular como build, artefato e container canônicos

A continuação do PR #79 promove o aplicativo institucional Angular a padrão do
repositório. **Não executa merge, publicação Pages ou implantação da API.**

| Comando/arquivo | Resultado |
| --- | --- |
| `npm run build:site` | Angular AOT + HUD/Canvas, cache do grafo do jogo e prerender público; saída `out/site`. |
| `npm run check:site` | Confere propriedade Angular, metadados, hashes, prerender, páginas privadas e gate financeiro fechado no mesmo `out/site`. |
| `Dockerfile` | Frontend estático Angular, usuário `node`, porta 8080, CSP/cache/404 e `/health`; sem API, dependências de build ou browser na imagem final. |
| `backend/Dockerfile` | API Node 22 com os mesmos módulos de validação de saves e dependências de produção; contexto continua na raiz do LHS. |
| `build:site:legacy` / `check:site:legacy` | Fixture de regressão e rollback em `out/site-legacy`; nunca substitui `out/site`. |
| `build:site:clean` | Build de baixo nível para diagnóstico, antes do prerender. O comando padrão é `build:site`. |

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

## Publicação Pages sob autorização

O workflow `lhs-pages-sync.yml` tem apenas `workflow_dispatch`. Exige:

1. Executar a definição da `main`, passando `source_sha` completo de um commit
   já mesclado nela e `approve_production: true`.
2. Passar build, checks, Chromium, contas e regressões existentes antes de acessar
   a credencial do espelho. O ambiente GitHub `lhs-production` permite configurar
   revisores obrigatórios; essa configuração externa não é presumida como feita.
3. Copiar para o espelho os mesmos bytes de `out/site` que foram testados. O
   manifesto `.lhs-approved-site.json`, fora da pasta pública, vincula SHA aprovado,
   hash dos inputs e hash do artefato.
4. No Cloudflare, `npm run build:site` reconhece esse manifesto, confere os hashes
   e executa o check canônico sem recompilar. A saída continua `out/site`; o build
   do espelho não precisa de Chromium nem de um segundo toolchain Angular.

Alterar fonte ou artefato depois da aprovação reprova a verificação. Ausência do
manifesto no repositório fonte usa a compilação Angular normal. O manifesto não
autoriza publicação: essa autorização pertence ao workflow manual e ao dono.

Nenhum workflow de PR nem um push/merge na `main` aciona esta publicação. As
configurações efetivas da hospedagem e de revisores do ambiente devem ser conferidas
antes da ativação; não foram alteradas por esta tarefa.

## Rollback

Guardar o identificador da implantação Cloudflare anterior antes de autorizar a
nova. Preferir restaurar essa implantação pelo painel da hospedagem. O workflow
manual também pode publicar um SHA anterior já mesclado na `main`, com autorização
explícita e a validação correspondente. `out/site-legacy` permite ensaiar o frontend
anterior sem sobrescrever o canônico; uma troca para ele exige uma alteração de
publicação revisada, não um fallback silencioso.

Não restaurar bancos, apagar armazenamento local, sobrescrever saves ou reprocessar
pedidos. O endpoint remoto da API, a origem do site e as chaves locais não mudam.

`noindex`, avisos jurídicos e `productionCheckoutEnabled: false` permanecem. A
promoção do build não equivale a aprovação jurídica/SEO, do provedor financeiro,
de Android físico, de indexação ou de publicação.
