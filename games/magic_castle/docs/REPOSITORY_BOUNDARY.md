# Magic Castle — contrato de isolamento de repositório V1

## Objetivo

O Magic Castle é um produto independente que vive provisoriamente em `games/magic_castle/` no repositório A7. Deve ser possível transferir essa **pasta inteira** para a raiz de um novo repositório sem rearranjar seu código de jogo, assets, documentação ou fontes artísticas.

## Regras obrigatórias

1. Código de jogo, configuração, HTML, estilos, testes, fontes de arte, assets e documentação vivem exclusivamente nesta pasta.
2. Não referenciar caminhos relativos `../..` nem carregar arquivos do A7 ou City Horizon em runtime.
3. A7 é uma ferramenta externa de **build**, nunca uma dependência JavaScript do jogo.
4. Receitas específicas do Magic Castle ficam em `authoring/`; PNGs consumidos pelo jogo ficam em `assets/`. Não reutilizar o diretório de exemplos A7 como banco de assets de produção.
5. Arte gerada e não aprovada fica no artifact do CI, não deve virar asset de produção só porque um workflow passou.
6. Evitar qualquer alteração no core A7, no City Horizon ou em seus workflows para tarefas específicas do jogo.
7. Workflows GitHub precisam morar em `.github/workflows/` da raiz enquanto o jogo compartilha este repositório; eles devem chamar scripts/configurações locais ao Magic Castle e ter triggers restritos à sua pasta.
8. Ao migrar, mover o workflow de empacotamento para `.github/workflows/` do novo repositório e ajustar o provisionamento da ferramenta A7. Não há necessidade de transportar a pasta `tools/visitor_forge_2d`.
9. Mudanças em assets exigem origem, receita, versão e revisão visual. Sem sobrescrever assets aprovados por experimentos.

## Layout alvo

```text
games/magic_castle/
  index.html
  game.js
  style.css
  README.md
  assets/
    README.md
    wizard/         # gerado no pacote jogável
    enemies/        # futuro
    tiles/          # futuro
    ui/             # futuro
    audio/          # futuro
  authoring/
    README.md
    wizard/         # receita versionada do mago
  docs/
    REPOSITORY_BOUNDARY.md
  scripts/          # scripts de build próprios (futuros)
  tests/            # testes de jogo (futuros)
```

## Validação de migração

- O jogo é executável usando exclusivamente os arquivos do pacote exportado.
- Nada em `game.js`, `style.css` ou `index.html` importa recursos fora da pasta.
- O workflow gera sprites da receita **local ao jogo** e empacota todos os PNGs utilizados.
- Copiar `games/magic_castle/` para outro checkout e reconstruir com a ferramenta A7 instalada produz o mesmo conjunto de fontes de entrada.
