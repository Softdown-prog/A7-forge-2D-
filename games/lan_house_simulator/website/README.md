# Site próprio do Lan House Simulator

Site estático, sem framework ou dependência de runtime. Reutiliza a marca e os 41 ícones do Terminal de Bairro. A imagem da home é um quadro real do Canvas do jogo, otimizado em WebP (cerca de 49 KB), não uma promessa de gráficos diferentes.

## Construir e conferir

```sh
npm run build:site
npm run check:site
node --test tests/website.test.mjs
```

`build:site` recompila o jogo atual e gera `out/site/`, incluindo o jogo completo em `/game/`. Não reconstrua enquanto outro processo utiliza o `dist/` do jogo. A página `/jogar/` carrega o iframe apenas após o clique, com tela cheia quando suportada e abertura em outra aba. Saves continuam na mesma origem; arquivos JSON são o caminho para transferir dados de um domínio antigo.

Rotas: `/`, `/jogar/`, `/sobre-o-jogo/`, `/sobre-nos/`, `/ajuda/`, `/contato/`, `/termos/`, `/privacidade/`, `/dados/` e `404.html`. Cada página entrega conteúdo HTML completo, título, descrição, dados estruturados, foco visível e navegação sem depender de renderização por JavaScript. Animações respeitam `prefers-reduced-motion` e podem ser pausadas no rodapé. O menu móvel funciona por botão e Escape; sem JS a navegação continua visível.

O site não pede cadastro, não envia a partida para servidores e não instala analytics, anúncios ou fontes remotas. A página de dados remove apenas `lhs-save-v1` ou `lhs.sound`, com confirmação, e nunca usa `localStorage.clear()`.

## Domínio e operação pública

O proprietário escolheu definir o contato depois. `config.mjs` mantém `operator`, `email`, `origin` e `hosting` pendentes; não derivar esses dados de credenciais, Git commits ou conta da plataforma. A prévia usa `mode: "preview"`, `noindex` e `robots.txt` sem indexação. Não existe email fictício nem formulário que finge enviar mensagens.

Antes de mudar para `mode: "public"`, preencher identidade do responsável, email privado funcional, domínio HTTPS e `hosting: {provider, retention, countries, legalBasis}` com informações verificadas da operação contratada. As bases legais devem corresponder às finalidades e aos tratamentos reais. Conferir contratos dos operadores e salvaguardas para transferências internacionais. Revisar as seções que descrevem a prévia privada quando mudar de provedor; elas são claramente identificadas como prévia. O build público rejeita dados essenciais ausentes.

Ao configurar domínio público, o build adiciona canonical, URL de compartilhamento e sitemap, sem inventar domínio. `_headers` contém CSP com hashes dos dados estruturados, restrições de câmera/microfone/geolocalização, cache com revalidação e políticas de referência. Confirme o suporte desses cabeçalhos no host escolhido. O arquivo `404.html` é compatível com hosts estáticos que reconhecem essa convenção.

Para Cloudflare Pages ou outra hospedagem estática: diretório de trabalho `games/lan_house_simulator`, instalar dependências de desenvolvimento, comando `npm run build:site`, saída `out/site`. Não configurar fallback de SPA: as páginas possuem `index.html` próprio. No site já registrado em Sites, manter o ID e atualizar a mesma publicação; a cópia hospedada inclui o build estático, separado do repositório de desenvolvimento do jogo.

A visão aprovada em `docs/ONLINE_COOKIES_CLOUD_CONTRACT.md` mantém a campanha gratuita e planeja Cookies (biscoitos) para personalizações opcionais. O site distingue planejamento de funcionalidade: não cria conta, loja, cobrança ou integração em nuvem. Essa moeda futura não é cookie HTTP.

## Termos e privacidade

Os textos foram escritos para os dados e recursos observados no código em 14/10/2026: save e som locais, leitura/exportação de JSON, áudio servido pela própria origem, sem SDK de pagamento ou conta online. Não se afirma que provedores jamais processam dados; a prévia informa acesso e infraestrutura separadamente.

Fontes oficiais consultadas:

- [LGPD — Lei 13.709/2018](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm): informação ao titular, direitos e atenção a crianças/adolescentes.
- [Resolução CD/ANPD 2/2022](https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-2-de-27-de-janeiro-de-2022): canal de comunicação e obrigações de agentes de pequeno porte. Não presumir enquadramento ou dispensa.
- [ANPD — Cookies e Proteção de Dados Pessoais](https://www.gov.br/anpd/pt-br/assuntos/noticias-periodo-eleitoral/anpd-lanca-guia-orientativo-201ccookies-e-protecao-de-dados-pessoais201d): transparência e controle sobre tecnologias de armazenamento.
- [Código de Defesa do Consumidor](https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm): preservar direitos legais, sem cláusula genérica de exoneração.
- Políticas dos provedores: [Cloudflare](https://www.cloudflare.com/pt-br/privacypolicy/), [OpenAI](https://openai.com/pt-BR/policies/privacy-policy/), [GitHub](https://docs.github.com/pt/site-policy/privacy-policies/github-general-privacy-statement).

São textos iniciais pesquisados, não certificação jurídica. Contas, nuvem, anúncios, pagamentos ou formulários futuros exigem atualização das políticas antes de serem ativados. Não antecipar práticas inexistentes.

## Limites da verificação

O verificador confere todas as páginas, referências locais, âncoras, IDs, módulos, metadados, hashes de CSP e carregamento sob demanda. Os testes verificam exclusão seletiva de dados e validação de configuração. A revisão visual no navegador depende da disponibilidade do controle de navegador autorizado por Sites; não substituir esse caminho por um navegador improvisado. Conferência em aparelho físico e validação da hospedagem pública ficam para o lançamento.


## Atualização da arte e prevenção de versões misturadas

Depois de alterar a arte de balcão, administrador ou salão: `npm run build`, instalar Chromium de Playwright e executar `node scripts/capture_site_salon.mjs`. O quadro WebP gerado usa o mesmo renderizador do jogo e continua abaixo de 100 KB; depois executar `npm run build:site` e `npm run check:site`.

O build do site atribui a mesma revisão a main.js e a todos os imports estáticos/dinâmicos de módulos do jogo, ao CSS e à imagem do salão. Isso impede misturar arquivos antigos em cache com código novo. A imagem de reserva do menu é copiada também para o build isolado, em `assets/ui/salon-preview.webp`.

`verify_live_site_preview.mjs` simula módulos antigos sem revisão recusando essas URLs, verifica carregamento e desenho da partida em desktop/celular, e deve passar antes da sincronização para o repositório ligado ao Pages.
