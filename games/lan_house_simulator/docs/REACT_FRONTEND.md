# Histórico do frontend React — migração concluída para Angular

## Estado atual (22 de novembro de 2026)

O **site canônico e o jogo incorporado** são compilados com Angular. O motor da
simulação permanece TypeScript e Canvas 2D, independente de qualquer framework.

As bibliotecas `react` e `ui-dom` foram removidas das dependências em
`ac1f53c`. O build isolado de compatibilidade (`npm run build`) usa
`src/compat/entry.mjs` e `src/compat/catalogSearch.mjs`, que não têm JSX e não
importam React. Os antigos arquivos `src/react/entry.jsx`,
`src/react/managementUi.jsx` e `src/react/catalogSearch.mjs` foram retirados.

## Por que os nomes `ui-*` e `compat-entry.js` são importantes?

O HTML estático `index.html`, os templates Angular e a folha `style.css`
utilizam IDs/classes neutros `ui-*`. O ponto de entrada legado foi renomeado
para `./js/compat-entry.js`. Nenhum desses elementos instala ou executa React;
eles preservam os contratos de DOM entre Angular e os controladores TypeScript.
A antiga nomenclatura foi eliminada em uma alteração coordenada de HTML,
CSS, scripts Angular, verificadores do site e testes de navegador.

`LHS_GAME_UI=angular` compila somente o motor para o artefato Angular, sem
gerar o bundle de compatibilidade. O fluxo publicado de site canônico usa
`npm run build:site`; o caminho de site legado continua restrito a testes
e não deve ser confundido com a rota oficial de produção.

## Garantias de segurança

O shell de compatibilidade monta os botões **antes** de importar
`./main.js`; os IDs de comandos permanecem estáveis para
`locateGameElements` e os adaptadores TypeScript. O arquivo de busca do
catálogo apenas filtra a apresentação e não manipula economia nem saves.
O motor, pagamentos, conta, preferências, consentimento, renderização Canvas
e importação/exportação de progresso não foram migrados para o shell.

A auditoria `frontend-angular/scripts/audit_migration.mjs` continua bloqueando
qualquer afirmação de prontidão baseada exclusivamente em texto de testes:
a validação com Chromium, dispositivos Android físicos e serviços reais é
uma etapa separada. Nenhum deploy ou merge é autorizado por este documento.

## Próxima limpeza

A próxima etapa pode avaliar remover o *shell* de compatibilidade por completo,
mas isso exige aposentar o caminho de testes standalone e comprovar o fluxo Angular
em CI e no navegador. O nome neutro não implica aprovação de deploy.
