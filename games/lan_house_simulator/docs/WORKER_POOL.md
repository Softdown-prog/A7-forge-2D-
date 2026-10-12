# Mini pool de workers — LHS

## O que realmente é o worker pool

O workflow `.github/workflows/lan-house-simulator.yml` executa **3 jobs independentes em paralelo**, sob demanda (workflow_dispatch) ou em push/PR de arquivos do próprio LHS:

1. **worker-simulation:** instala Node, compila TS e executa testes de economia, estados e faturamento.
2. **worker-scene:** compila HTML/CSS/JS, verifica estrutura/documentação e publica o build estático como artifact `lhs-playable-build`.
3. **worker-forge:** instala A7 Forge 2D, renderiza receita simples da máquina de bebida e publica PNGs/metadados de revisão em `lhs-forge-review`.

Cada worker tem timeout e áreas de responsabilidade próprias. **Nenhum deles aprova arte, edita commits ou realiza programação autônoma por IA**. O backlog de implementação está em issues e em `docs/BACKLOG.md`, para execução posterior por desenvolvedor/agente conectado. GitHub Actions é execução da tarefa já codificada, não um programador que inventa mudanças.

## Política operacional

- Trigger restrito a `games/lan_house_simulator/**` e ao workflow próprio; outros projetos não disparam a fila.
- Os 3 jobs podem rodar simultaneamente; arte não bloqueia simulação.
- Artifacts do CI são temporários, `review_ready`, não assets finais.
- Se um job falhar, corrigir sua área sem reprocessar assets aprovados de outras famílias.
- Não criar loop de commits ou PRs automáticos.
- Você pode lançar o workflow manualmente pela guia **Actions > Lan House Simulator - worker pool > Run workflow**.
- Depois de disparar, não é necessário manter o aplicativo ChatGPT aberto para os jobs de CI funcionarem.
