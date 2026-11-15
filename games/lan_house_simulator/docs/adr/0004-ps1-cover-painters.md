# ADR 0004 — Capas procedurais do PS1 por jogo

## Antes e depois

Antes: `src/ui/ps1CoverArt.ts` centralizava 13 desenhos Canvas e a montagem/cache das imagens. Depois: cada desenho foi movido para seu módulo específico, enquanto a API pública `ps1ProceduralCover` continua inalterada.

| Desenho antes em `ps1CoverArt.ts` | Localização nova |
| --- | --- |
| `turbo-circuito` | `src/ui/ps1Covers/turbo-circuito.ts` |
| `gol-de-rua` | `src/ui/ps1Covers/gol-de-rua.ts` |
| `ilha-dos-cristais` | `src/ui/ps1Covers/ilha-dos-cristais.ts` |
| `luta-neon` | `src/ui/ps1Covers/luta-neon.ts` |
| `cosmo-blocos` | `src/ui/ps1Covers/cosmo-blocos.ts` |
| `rally-do-deserto` | `src/ui/ps1Covers/rally-do-deserto.ts` |
| `sombras-do-castelo` | `src/ui/ps1Covers/sombras-do-castelo.ts` |
| `defensores-do-espaco` | `src/ui/ps1Covers/defensores-do-espaco.ts` |
| `selva-perdida` | `src/ui/ps1Covers/selva-perdida.ts` |
| `dragoes-de-aco` | `src/ui/ps1Covers/dragoes-de-aco.ts` |
| `ritmo-da-cidade` | `src/ui/ps1Covers/ritmo-da-cidade.ts` |
| `agentes-da-noite` | `src/ui/ps1Covers/agentes-da-noite.ts` |
| `oceano-profundo` | `src/ui/ps1Covers/oceano-profundo.ts` |

## Integrações afetadas

- `src/ui/ps1Covers/primitives.ts`: funções originais `path`, `line`, `circle` (geometria sem mudanças).
- `src/ui/ps1Covers/registry.ts`: associação explícita dos 13 IDs com as funções de desenho.
- `src/ui/ps1CoverArt.ts`: delega pintura ao registro; preserva gradiente, efeitos, 420×560, títulos, PNG, cache e fallback `assets/ps1/covers/<id>.svg`.
- `tests/ps1-cover-module-boundary.test.mjs`: protege a equivalência catálogo↔módulos e o contrato público.
- `tests/ps1-procedural-cover.test.mjs`: testes já existentes de 13 capas diferentes/determinísticas, cache, integração Angular e SVG fallback.

## Fora do escopo

Sem modificações na economia, save, lógica de desbloqueio Top Games, catálogo de CDs, SVGs existentes ou pinturas PS2. Executar build e CI da branch; não abrir PR, merge ou deploy sem autorização.
