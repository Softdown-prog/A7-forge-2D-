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
- A tela de confirmação de email por link e integração com Donate ainda são etapas distintas e bloqueiam o cutover.
