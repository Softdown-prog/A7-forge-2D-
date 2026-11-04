# Reconstrução progressiva do site LHS em Angular

Registro histórico da implementação por ilhas. Para a aplicação institucional
única em `src/site-rewrite/`, consulte a [entrega consolidada da issue #78](ANGULAR_MIGRATION_DELIVERY.md).
Não adicionar funcionalidades institucionais à árvore transitória `src/site/`.

## Estado auditado (01/11/2026)
- `website/content.mjs`, `website/build.mjs` e `website/site.css` geram o site institucional estático; `site.mjs` mantém as interações de menu, eras, FAQ e abertura do iframe.
- `frontend-angular/src/main.ts` é o Angular do **jogo**; `frontend-angular/src/site/main.ts` é um entrypoint **separado** e novo para o site.
- A produção `out/site` contém o jogo Angular, não o bootstrap React. React permanece no `dist/` legado para testes, sem evidência de que ele esteja executando na vitrine atual.

## Contrato de migração
- Migrar **uma área por etapa**: navegação -> timeline -> FAQ -> cabeçalho/rodapé -> páginas de conteúdo -> conta/Donate, sem misturar regras de cobrança ou do Canvas.
- Cada componente novo é Angular standalone, OnPush, com HTML semântico. Nunca importar componentes React nem copiar handlers velhos.
- Reutilizar os tokens de `website/site.css` e os SVGs existentes; não criar duas identidades visuais.
- Preservar HTML estático de fallback e SEO durante a migração. O objetivo final é prerender Angular (SSG) para as páginas públicas, não um shell CSR vazio.
- `LHS_SITE_ANGULAR_CANDIDATE=1` gera a prévia em `out/site-angular`; a produção `out/site` mantém a navegação anterior até validar cada etapa no navegador.
- Não remover dependências React usadas por scripts de regressão antes de migrar esses scripts.
- Cobrir desktop 1280px, mobile 414px/360px, links, teclado, toque, CSP, erros de JS, acessibilidade básica e regressões do jogo antes de publicar.

## Etapa 1 — navegação
- `frontend-angular/src/site/site-navigation.ts`: links e menu mobile refeitos em Angular, sem React.
- `frontend-angular/src/site/main.ts`: entrypoint institucional isolado.
- `website/build.mjs`: constrói o entrypoint apenas na prévia; o site publicado é preservado.
- `frontend-angular/scripts/verify_full_site.mjs`: navegação Angular do site candidato em Chromium, seguida pela verificação do iframe Canvas.
- **Critério de avanço:** Chromium verde, comparação visual e nenhum erro de navegação/DOM duplicado.

## Etapa 2 — linha do tempo (prévia Angular)
- `frontend-angular/src/site/site-timeline.ts` substitui os controles e o painel de épocas por estado Angular OnPush, sem React.
- `website/content.mjs` continua entregando HTML estático válido para SEO e fallback sem JavaScript.
- A prévia Angular recebe os dados canônicos de `eras` por atributo JSON HTML-escapado; produção continua com os handlers antigos.
- Os testes de navegador verificam `/` e `/sobre-o-jogo/`, mouse/toque, quatro anos, SVGs, teclado e largura mobile antes dos testes do jogo.

## Etapa 3 — Ajuda e FAQ (somente prévia Angular)
- O componente Angular em frontend-angular/src/site/site-help.ts renderiza as sete respostas canônicas com HTML semântico, signals e change detection OnPush; sem React.
- website/content.mjs mantém a fonte original dos textos, e o builder só adiciona JSON escapado e o host Angular na página /ajuda/ da prévia out/site-angular.
- O FAQ original já está presente no HTML compilado antes do JavaScript, garantindo fallback e indexação de conteúdo. Na hidratação da prévia, o componente toma posse da seção sem listeners JavaScript duplicados.
- Playwright em Chromium verifica 1280, 414 e 360 px, seleção de perguntas por toque/teclado, consulta sem acentos, vários termos, ausência de resultados, limpeza e recuperação do estado aberto.
- FAQ reduzido da página inicial permanece HTML nativo até uma etapa posterior. Produção out/site não usa o componente novo.

## Etapa 4 — cabeçalho e rodapé (prévia isolada)
- `frontend-angular/src/site/site-header.ts` compõe a marca e o botão Menu com o `SiteNavigationComponent` já migrado. O cabeçalho completo deixa de ser controlado por HTML/JS manual na prévia.
- `frontend-angular/src/site/site-footer.ts` reproduz marca, links, direitos, edição e preferência por movimento reduzido; o controle de animação usa signals, OnPush e reage à preferência do sistema.
- `website/build.mjs` conserva HTML semântico e links pré-renderizados para SEO/no-JS. Somente `out/site-angular` recebe os marcadores de upgrade.
- `website/site.mjs` mantém animações e comportamento da produção, mas não conecta listeners duplicados ao rodapé Angular.
- O Chromium deverá verificar cabeçalho e rodapé reais, links/ícones, menu mobile, Escape, controle de animações e responsividade nas larguras 1280/414/360; jogo e conta seguem protegidos.

## Correção emergencial — recarregamento (F5) e cache
- O fluxo de validação anterior cobria abertura inicial, mas **não testava recarregar /, /ajuda/, /conta/ e /jogar/**; não atribuir aprovação anterior ao F5.
- O build Cloudflare remove o TTL de uma hora dos recursos /assets/*, exigindo revalidação de JS/CSS/SVG após atualização; /game/js/* e /game/__angular/* também exigem revalidação.
- Playwright agora visita rotas reais por URL, faz page.reload, exige HTTP 200, navegação única e funcional (inclusive mobile), busca FAQ após refresh, e testa F5 durante uma partida seguido de reinicialização real do Canvas Angular.
- A validação roda tanto no out/site pré-publicação quanto no candidato out/site-angular. Não equivale a teste na URL Cloudflare após deploy, que precisa de smoke remoto separado quando o domínio estiver acessível.
