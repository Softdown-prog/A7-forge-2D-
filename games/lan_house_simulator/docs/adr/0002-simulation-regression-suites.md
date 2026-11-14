# ADR 0002 — suítes de regressão da simulação por domínio

## Contexto
`tests/simulation.test.mjs` reunia 63 casos heterogêneos em um único arquivo de aproximadamente 50 KB. A reorganização **não altera motores, regras, saves ou verificações**; somente distribui os testes e seus imports no mesmo diretório, preservando os caminhos relativos.

## Mapa da separação
| Arquivo agora | Casos originais | Responsabilidade |
| --- | ---: | --- |
| `tests/simulation.test.mjs` | 24 | Economia, atendimento, filas, fornecedores e eventos de venda |
| `tests/simulation-customer-retail.test.mjs` | 13 | Necessidades, compras, hardware e apresentação vinculada à simulação |
| `tests/simulation-runtime-ui.test.mjs` | 11 | Menu, importação/exportação, móveis, controles e áudio |
| `tests/simulation-layout.test.mjs` | 15 | Expansões, câmera, rotas, paredes, portas e PCs anexos |

Os 63 blocos `test(...)` originais são preservados integralmente, em sua ordem, com as mesmas asserções e imports relativos. `tests/simulation-suite-boundary.test.mjs` verifica os quatro proprietários e detecta perdas grosseiras ou títulos duplicados.

## Regra para próximas separações
Antes de mover um teste, verificar fixtures, imports, consumidores, scripts explícitos e workflows. Depois da mudança, executar `npm run typecheck`, `npm test`, `npm run build:site`, `npm run check:site` e testes reais de navegador afetados. O glob `tests/*.test.mjs` do `package.json` continua descobrindo as quatro suítes automaticamente. Não aceitar PR ou merge com check vermelho.
