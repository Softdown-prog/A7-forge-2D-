# ADR 0005 — Capas procedurais do PS2 por jogo

## Antes e depois

Antes: `src/ui/ps2CoverArt.ts` reunia os desenhos Canvas de 15 jogos e a montagem final. Depois: um módulo de desenho por jogo em `src/ui/ps2Covers/`. Toda a geometria, preenchimento, ordem de pintura e composição das capas foi mantida; apenas a seleção do desenho foi substituída por um registro explícito.

| Desenho original em `ps2CoverArt.ts` | Novo módulo |
| --- | --- |
| `cidade-em-fuga` | `src/ui/ps2Covers/cidade-em-fuga.ts` |
| `arena-dos-guardioes` | `src/ui/ps2Covers/arena-dos-guardioes.ts` |
| `futsal-de-bairro` | `src/ui/ps2Covers/futsal-de-bairro.ts` |
| `cosmos-2006` | `src/ui/ps2Covers/cosmos-2006.ts` |
| `batida-de-rua` | `src/ui/ps2Covers/batida-de-rua.ts` |
| `pistas-da-montanha` | `src/ui/ps2Covers/pistas-da-montanha.ts` |
| `templo-da-aurora` | `src/ui/ps2Covers/templo-da-aurora.ts` |
| `robos-da-fronteira` | `src/ui/ps2Covers/robos-da-fronteira.ts` |
| `misterio-do-farol` | `src/ui/ps2Covers/misterio-do-farol.ts` |
| `lendas-do-vulcao` | `src/ui/ps2Covers/lendas-do-vulcao.ts` |
| `volei-na-praia` | `src/ui/ps2Covers/volei-na-praia.ts` |
| `corrida-no-gelo` | `src/ui/ps2Covers/corrida-no-gelo.ts` |
| `cidade-dos-inventores` | `src/ui/ps2Covers/cidade-dos-inventores.ts` |
| `guardioes-do-oceano` | `src/ui/ps2Covers/guardioes-do-oceano.ts` |
| `batidas-do-futuro` | `src/ui/ps2Covers/batidas-do-futuro.ts` |

## Contratos preservados

- `src/ui/ps2Covers/primitives.ts`: primitivas originais `polygon`, `stroke`, `circle`.
- `src/ui/ps2Covers/registry.ts`: correspondência explícita dos 15 IDs e respectivos renderizadores.
- `src/ui/ps2CoverArt.ts`: interface `ps2ProceduralCover`, gradiente, títulos, 420×560, PNG, cache e fallback offline por SVG.
- `assets/ps2/covers/*.svg`: arquivos existentes, preservados sem alteração.
- `tests/ps2-cover-module-boundary.test.mjs`: verifica catálogo, número de arquivos, funções exportadas e fallback seguro.
- `tests/ps2-procedural-cover.test.mjs`: mantém os checks existentes de rasterização determinística, cache, integração com Angular e loja nativa.

Sem mudança no catálogo, desbloqueio por revista, economia, jogabilidade, formatos de save ou deploy. Conferir compilação e todas as verificações do GitHub antes de concluir.
