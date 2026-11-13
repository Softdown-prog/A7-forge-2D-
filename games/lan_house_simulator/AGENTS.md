# Lan House Simulator — regras locais para agentes

1. Identifique o módulo proprietário antes de editar e leia somente seus consumidores, contratos e testes relevantes. Prefira uma responsabilidade por arquivo.
2. `src/application/portGroups/` compõe as portas por assunto (consoles, finanças e preços/promoções); `gamePorts.ts` conserva a API pública sem implementar cada grupo. `src/sim/` contém regras de negócio puras; `src/application/` expõe comandos e consultas; `src/ui/` consome portas; `src/render/` desenha; `src/bootstrap/` compõe.
3. Não importe entre famílias irmãs de arte `posters`, `retail`, `computers`, `actors`, nem entre diferentes aparências, pôsteres ou definições de histórias. Compartilhe apenas por módulos neutros. Portão: `tests/feature-boundaries.test.mjs`.
4. Bancadas PS1 e PS2 também são módulos independentes em `src/render/scene/stations/`; adicione novos tipos ao `registry.ts` desse diretório, sem alterar diretamente a cena para desenhar um console.
5. Cada pintor de pôster mora em seu arquivo e é cadastrado por uma linha em `src/render/posters/registry.ts`. Duplicatas são erro; não modificar `posterArt.ts` para adicionar um pintor.
6. Preserve IDs, ordens e formatos dos saves; não mude mecânica ao reorganizar código. Não crie fallback silencioso de arte para uma peça desconhecida.
7. Execute `npm run typecheck`, `npm test`, `npm run build:site` e `npm run check:site`, além dos testes de navegador impactados. Compilar não substitui validar a cena real.
8. Trabalhe na branch designada. Não faça merge, deploy nem altere outro projeto sem autorização. Não invente cotas de RAM/CPU ou proibições de tamanho de pasta.
9. Documente as decisões e as exceções de fronteira em `docs/adr/`. Referência inicial: `docs/adr/0001-feature-fences-and-registries.md`.
