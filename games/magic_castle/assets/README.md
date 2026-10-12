# Assets do Magic Castle

Todos os assets usados pelo jogo devem residir sob `games/magic_castle/assets/`. Nunca carregar diretamente `tools/visitor_forge_2d` em tempo de execução.

- `wizard/`: sprites do mago, gerados pela receita local em `../authoring/wizard/` durante o empacotamento.
- `enemies/`: sprites de inimigos aprovados (futuros).
- `tiles/`: chão, plataformas e cenários aprovados (futuros).
- `ui/`: ícones e interface (futuros).
- `audio/`: áudio (futuro).

Os desenhos temporários dos inimigos e do cenário estão em `game.js`; não são assets aprovados. Imagens geradas por CI vão ao ZIP, não devem ser duplicadas no repositório sem necessidade. Nomes e direitos de uso devem ser documentados antes de importar assets externos.
