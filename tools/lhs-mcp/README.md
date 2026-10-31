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

O índice v2 resolve imports **relativos estáticos** (incluindo `.js` que
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
