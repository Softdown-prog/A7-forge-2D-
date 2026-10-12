# Assets do Magic Castle

Todos os assets usados pelo jogo devem residir sob `games/magic_castle/assets/`. Nunca carregar diretamente `tools/visitor_forge_2d` em tempo de execução.

- `wizard/`: sprites do mago, gerados pela receita local em `../authoring/wizard/` durante o empacotamento.
- `enemies/`: sprites SVG originais de gosma, morcego e guardião (protótipos em revisão).
- `scene/`: fundo de castelo, plataforma e porta SVG (primeira cena, ainda em revisão).\n- `tiles/`: tiles futuros, se necessários.
- `ui/`: ícones e interface (futuros).
- `audio/`: áudio (futuro).

O fundo e os inimigos já possuem arquivos SVG separados nesta pasta e são carregados pelo Canvas; são **arte provisória em validação**, não assets finais aprovados. Imagens geradas por CI vão ao ZIP, não devem ser duplicadas no repositório sem necessidade. Nomes e direitos de uso devem ser documentados antes de importar assets externos.
