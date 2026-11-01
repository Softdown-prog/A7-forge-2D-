# LHS Repository MCP — navegação e manutenção de código

Servidor MCP real no transporte `stdio` (JSON-RPC), sem dependências npm.
Usa Node.js 22 e lê arquivos rastreados pelo Git. Por padrão pesquisa
`games/lan_house_simulator`; `--scope .` permite o monorepo inteiro.
O índice identifica caminhos, extensões, tamanhos, símbolos e imports
sem armazenar conteúdo integral dos arquivos no artefato. Busca textual
e leitura por linhas acontecem sob demanda, com limites de resultados.

## GitHub Actions

O workflow `.github/workflows/lhs-mcp-index.yml` executa testes de protocolo
e segurança, cria `out/lhs-mcp-index/catalog.json` e `summary.json`
e publica o artefato `lhs-mcp-catalog`. Permissão `contents: read`.
GitHub Actions é **efêmero**: um processo MCP iniciado pelo job é encerrado
ao fim do workflow. Não existe servidor HTTP permanente, conexão direta ao
ChatGPT ou acesso remoto automático a partir desse artefato.

O workflow atualiza o catálogo a cada push na branch Angular, inclusive quando
arquivos de outros diretórios mudam.
Outras alterações podem ser indexadas ao rodar o workflow manualmente
(quando disponível na branch padrão) ou ampliando seus filtros.
Nenhum push, PR, merge ou deploy é feito pelo processo MCP.

## Rodar num clone local ou num agente com terminal

No diretório raiz do repositório:

```bash
node tools/lhs-mcp/index.mjs --scope . --output out/lhs-mcp-index/catalog.json
node tools/lhs-mcp/server.mjs --scope games/lan_house_simulator
```

Exemplo de configuração de cliente MCP (ajustar para seu checkout e
diretório de execução):

```json
{
  "mcpServers": {
    "lhs-repository": {
      "command": "node",
      "args": ["tools/lhs-mcp/server.mjs", "--scope", "games/lan_house_simulator"]
    }
  }
}
```

Com `--scope .` o MCP pode navegar todo o repositório. Para reutilizar
um índice válido do mesmo commit e escopo: `--index out/lhs-mcp-index/catalog.json`.
Clientes que não podem executar um subprocesso não se conectam diretamente
ao MCP apenas por causa do workflow. Para acesso contínuo seria necessária
uma hospedagem separada e transporte compatível.

## Ferramentas

- `project_status`, `list_directory`, `find_files`, `find_symbols`,
  `search_content`, `file_info`, `read_file`, `refresh_index`.
- `edit_file`, `create_file`, `move_file`, `delete_file`: **prévia por
  padrão**. Para aplicar num checkout local, iniciar com `--allow-write`
  e enviar `dry_run:false` no pedido.
- Editar, mover ou excluir exige `expected_sha256` devolvido por
  `read_file`, bloqueando alterações se o arquivo mudou. Editar exige
  ocorrência exata única. Caminhos escapando do repositório, segredos
  e symlinks são rejeitados.
- Mudanças são locais, não são automaticamente enviadas ao GitHub.
  Precisam de aprovação, testes e operação explícita de Git.

## Responsabilidades

Este MCP não importa o motor, não reimplementa economia, não modifica saves
e não substitui o GitHub MCP: o conector GitHub continua responsável
pelos commits remotos, PRs e revisão. O novo MCP organiza caminhos, símbolos
e edições controladas num checkout.

Pastas como `node_modules`, `dist`, `out` e chaves de acesso não são
indexadas. Binários grandes só entram como metadados (caminho, tamanho).

## Grafo de dependências e análise de impacto

O índice v7 resolve imports **relativos estáticos** (incluindo `.js` que
aponta para módulos TypeScript) em arquivos TS/JS rastreados pelo Git.
As ferramentas `file_dependencies`, `find_dependents` e `impact_analysis`
indicam arquivos que importam o módulo e outros consumidores indiretos,
com limite de profundidade e de resultados. O grafo é uma aproximação:
imports dinâmicos variáveis, aliases TypeScript, injeção em runtime e
referências indiretas não são inferidos. Nenhuma ferramenta altera o código
apenas por consultar o grafo; antes de editar, rode os testes relevantes.

## Catálogo em projetos grandes

O `summary.json` agora inclui `mostReferenced` (módulos com mais imports
recebidos), métricas de arestas do grafo e amostra de imports locais não
resolvidos. Isso ajuda a priorizar a revisão dos arquivos mais utilizados.
Um índice do Actions pode ser reutilizado num checkout local **somente se**
o SHA, a versão do esquema, o escopo e a árvore de arquivos rastreados
estiverem consistentes; se o workspace foi alterado, o MCP reindexa.

## Indexação incremental (índice v7)

Cada entrada rastreada registra o identificador **Git blob OID** e modo do
Git index. Quando o commit muda, o indexador compara esses identificadores
com o catálogo anterior, além de inspecionar o `git diff` da árvore de
trabalho para detectar alterações não commitadas. Reaproveita declarações
e imports apenas nos arquivos intactos; lê e reprocessa os alterados.
O grafo é **sempre recalculado** para refletir a remoção e adição de módulos.
Relata `buildStats.reused`, `scanned` e `deleted`; para conferir a
economia de trabalho, consulte o log ou o `summary.json`.

O GitHub Actions usa `actions/cache` com chave por SHA e prefixo na branch
para recuperar o índice anterior. Uma execução sem cache faz indexação
completa; a seguinte pode reaproveitar registros. O artefato de download
continua contendo o catálogo atualizado completo, não apenas um delta.
No terminal, use `--previous caminho/para/catalog.json` no comando
`index.mjs`. O servidor `--index` reconcilia o catálogo com o checkout
atual, mesmo que o arquivo de cache tenha outro SHA.

**Limites:** o cache depende dos IDs do Git index. Alterações ocultadas
por configurações Git como `assume-unchanged` não podem ser detectadas
com segurança; desative essas flags antes de indexar o projeto.

A etapa de verificação do GitHub Actions também cria um segundo índice
incremental no mesmo checkout e compara as entradas arquivo a arquivo,
exigindo 100% de reaproveitamento quando não há alterações. O resumo
principal continua registrando o reaproveitamento real **entre execuções**.

## Busca contextual de código (índice v7)

A ferramenta `search_context` aceita perguntas curtas em português ou inglês,
por exemplo `comprar PS2`, `fila de clientes` e `salvar partida`.
Usa dicionário pequeno de termos comuns da lan house, correspondência
de identificadores em camelCase, nomes de arquivos, comentários e frequência
de palavras em código. Os resultados vêm ordenados por relevância e
informam os termos encontrados, a origem da correspondência e símbolos
associados para abrir no `read_file`.

**Não usa embeddings, modelos de IA, rede ou custo por consulta.**
É uma busca lexical contextual, não compreende perfeitamente linguagem
natural; novas palavras e sinônimos precisam ser adicionados ao dicionário
com testes. O catálogo não publica o conteúdo completo dos fontes:
somente vocabulário limitado por arquivo e até três títulos/comentários
de contexto. Literais entre aspas não entram no vocabulário. O índice
continua incremental, com cache versionado `v6` no GitHub Actions.

## Benchmark escalável do buscador

`tools/lhs-mcp/benchmark.mjs` gera **em memória** 10.000 e 15.000
registros sintéticos de índice (não cria arquivos no checkout nem faz commits).
Executa 12 perguntas do domínio com respostas conhecidas, três repetições
por consulta, incluindo uma pergunta sem correspondência. Registra mediana,
p95, maior latência, construção do catálogo sintético, memória heap/RSS
observada e acertos top-1/top-5. Falha caso alguma resposta esperada não
apareça no top-5. O CI anexa `lhs-mcp-benchmark` separado do catálogo.

**Interpretação:** esses números medem a busca **em metadados simulados**,
não tempo de git checkout/indexação real nem precisão em tarefas do mundo
real. Os resultados são indicadores de regressão e escala, não SLA.
O vocabulário foi ampliado para licenças, manutenção, desgaste,
fornecedores, reputação, correio, videogames, campanhas e opções.
Como sinônimos mudaram, o esquema do catálogo e o cache passaram para v7.

## Benchmark físico com 10 mil e 15 mil arquivos Git

O módulo `tools/lhs-mcp/benchmark-physical.mjs` cria repositórios Git
**descartáveis** no diretório temporário do runner e gera exatamente 10.000
e 15.000 arquivos TypeScript rastreados. Executa `git add` e `git commit`
apenas nesses repositórios de teste, nunca no checkout de produção.

Aferições: preparação da amostra, índice completo (`cold`), índice
inalterado (`warm`), reindexação incremental após modificação de 1% dos
arquivos e pequenas adições/remoções, e nova indexação completa. Os
catálogos incremental e completo precisam ser **idênticos** em todas as
entradas e estatísticas. Também confere a busca contextual no índice físico.

O workflow executa ambos os tamanhos com limite de seis minutos para a
etapa, produz `lhs-mcp-physical-benchmark` e apaga a árvore temporária
mesmo quando o teste lança erro. O relatório diferencia tempo de criação
do Git, tempo de indexação, quantidade reaproveitada, heap, RSS final e
pico observado de RSS. Desempenho medido em runners compartilhados
não representa SLA e os fontes sintéticos não replicam a complexidade
de cada módulo real da lan house.

## Busca contextual acelerada

A partir desta etapa, `prepareContextSearch` prepara, por objeto de índice,
um mapa invertido de termos para arquivos. A consulta `search_context`
inspeciona somente os candidatos relacionados aos termos pedidos, sem
repetir a extração de palavras de todos os nomes/símbolos. Um novo
`buildIndex`/refresh cria novo índice e descarta naturalmente a cache
antiga (armazenada por `WeakMap`). Não editar `index.files` no mesmo
objeto depois de preparar a busca. A cache **não** entra no artefato Git.

## Avaliação de relevância em arquivos reais

`tools/lhs-mcp/evaluate-real.mjs` contém doze intenções de busca com
arquivos de referência existentes em `games/lan_house_simulator/src/`.
A avaliação executa a mesma busca contextual usada pelo MCP sobre o
catálogo **real** do GitHub Actions e registra posição do arquivo esperado,
hit@1, hit@5, hit@10, latência e cinco primeiros resultados. O relatório
`lhs-mcp-real-relevance` é publicado no CI. Rankings fora do top-5
são exibidos como limitações, não são ocultados por ajustes automáticos.
O ensaio mede localização de arquivos previamente rotulados, não qualidade
de compreensão de código nem todas as consultas possíveis.

O conjunto de vocabulário v6 reconhece `transfer`/exportação,
`imported`/importação, `controls`/controles e `partida`/save.
Ajustes são guiados por erros identificados na avaliação real, que mantém
exemplos não triviais para verificar regressões de ranking.

## Revisão do ranking de propriedade (v7)

A pontuação dá maior peso a termos no **nome do arquivo e em declarações
locais**, em vez de repetições de termos em arquivos agregadores. Quando um
módulo possui basename exato equivalente a um conceito pedido (por exemplo,
`ps2.ts`), recebe bônus controlado; arquivos com nomes compostos, como
`ps2Art.ts`, não recebem esse bônus por substring. Foi ampliado o
vocabulário para desenhar/renderizar, catálogo e cartões. As avaliações
reais continuam orientando melhorias e seus resultados são publicados,
incluindo regressões observadas. Não substitui leitura da implementação.

### Validação de responsabilidade

O ranking também reconhece um módulo específico dentro de `src/sim`
quando a intenção pede simulação daquele assunto, sem priorizá-lo em
perguntas que exigem outra especialidade, como arte visual. A suíte inclui
um teste de não interferência entre PS2 simulação e PS2 arte, além de
uma regra de CI para preservar 12/12 resultados reais no top 5 e pelo
menos 7/12 na primeira posição. Essas garantias são sobre as consultas
rotuladas, não sobre toda pesquisa possível.

O vocabulário v8 distingue `arte`/`artwork` de simulação. Para
perguntas mais longas, bônus pelo nome exato do módulo só são aplicados
quando ele também corresponde a todos os conceitos pedidos. Isso evita
que regras do PS2 sejam privilegiadas em pesquisas por arte.

## Consulta de funcionalidade e dependentes (grafo)

A ferramenta MCP **`trace_feature`** combina `search_context` com os
imports TS/JS relativos resolvidos em `dependencies`. Retorna até 15
candidatos ordenados por relevância lexical e um ajuste estrutural limitado,
separando `directDependencies` (arquivos que o candidato importa),
`directDependents` (quem o importa), totais e relações com outros
candidatos relevantes. Também mostra `topCandidateImpact`, com alcance
indireto limitado a três saltos e 30 resultados.

O resultado `graphHint` pode sugerir `potential-provider`,
`potential-consumer`, `intermediary` ou evidência insuficiente. Uma
importação prova apenas uma referência estática, **não** que o arquivo é o
único responsável por uma funcionalidade; inspeção do fonte e testes
continuam necessários. O gráfico em memória é preparado uma vez por
objeto de índice via `WeakMap`, sem persistência e sem execuções de código.
A ferramenta é somente leitura e mantém as restrições de escopo do índice.

## Planejamento de alterações antes de editar

`plan_change` é a **18ª ferramenta MCP**, somente leitura. Recebe uma
intenção em português ou inglês e retorna um plano de revisão baseado
exclusivamente nos arquivos indexados: candidatos a proprietários da função,
consumidores diretos, dependências que devem ser examinadas e possíveis
arquivos afetados pelo grafo de imports estáticos (até três saltos).

A ferramenta relaciona testes rastreados por imports **reais** (incluindo
imports de `tests/../dist/js/...js`, associados ao `src/...ts` quando
existe) ou, com menor confiança, palavras no nome do teste. Apresenta
separadamente o tipo de evidência. Resultados ficam limitados a cinco
candidatos, 40 arquivos de revisão e 20 testes. Lista comandos existentes
no `games/lan_house_simulator/package.json`: `npm run typecheck` e
`npm test`. **Não executa os comandos, não altera arquivos nem garante
cobertura de teste**: o agente deve ler o código e validar antes de fazer
qualquer commit. Relações dinâmicas e eventos do Canvas não são plenamente
representados pelo grafo estático.

Na seleção de testes, importar o **principal candidato** é evidência
direta; importar apenas um candidato secundário ou uma dependência
compartilhada exige também correspondência com o assunto no nome do
teste. Isso reduz falsos positivos causados por módulos centrais como
`engine.ts`. Continua sendo uma sugestão, não medição de cobertura.

## Revisão automática de diffs de commits (sem alterações)

A ferramenta MCP `review_diff` consulta **somente** o diff Git entre
`HEAD^` (padrão) e `HEAD`, ou um SHA Git completo de 40 caracteres como
base. A comparação restringe-se ao diretório `games/lan_house_simulator`.
O resultado lista os fontes alterados, módulos potencialmente afetados por
imports reversos, referências ainda não resolvidas após exclusões/renomes,
possíveis testes associados e comandos de validação já existentes.

A ferramenta é **somente leitura**, não executa comandos do projeto nem
aprova/mescla commits. As sugestões não substituem a leitura do diff ou a
validação funcional. O gráfico representa o checkout atual: uma exclusão
não pode recuperar as dependências históricas sem indexar o commit anterior.
A seleção de testes usa imports rastreados; nomes de testes são indício
menos forte. Arquivos sensíveis ou fora da pasta do jogo não são expostos.

O GitHub Actions usa checkout com histórico de pelo menos dois commits,
executa uma revisão após indexar e publica `lhs-mcp-diff-review`, mesmo
quando o último commit só altera ferramentas MCP e nenhum arquivo do jogo.
Para baixar ou reproduzir localmente:

```bash
node tools/lhs-mcp/diff-review-cli.mjs --base HEAD^ --output out/lhs-mcp-diff-review/report.json
```
