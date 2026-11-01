# Reescrita institucional Angular — branch isolada

**Branch:** `rewrite/lhs-angular-site-clean`. **PROIBIDO merge na main ou deploy enquanto a reescrita não estiver completa.**

A implementação anterior não era uma reescrita: `website/build.mjs` renderiza o HTML, `website/site.mjs` registra handlers globais e `frontend-angular/src/site/main.ts` monta ilhas Angular por cima. Esse desenho cria duas autoridades para o mesmo DOM, especialmente navegação, FAQ e animações. Não afirmar que Bootstrap ou Alpine existam sem evidência.

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
