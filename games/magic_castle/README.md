# Magic Castle — vertical slice 01

Protótipo HTML5 2D lateral independente. Não altera o runtime do City Horizon nem o Draw Engine A7.

## Controles
- A/D ou setas: movimento lateral
- W / Espaço / seta para cima: salto
- Enter / J: lançar magia na direção do personagem
- R: recomeçar
- Celulares: botões de toque abaixo do canvas

## Para jogar
Abra `index.html` em um navegador. Para usar sprites oficiais em vez do desenho provisório incorporado, baixe o artefato do workflow `Magic Castle playable prototype`; ele inclui `assets/wizard/` com os PNGs do mago gerados diretamente da receita versionada no A7.

O protótipo inclui plataforma, gravidade, colisão no chão, câmera fixa, projéteis, três comportamentos de inimigo, HP, invulnerabilidade após dano, vitória e reinício. Inimigos/cenário são placeholders desenhados no Canvas e **não são arte aprovada**. A revisão de sprites e jogabilidade precede promoção para um repositório independente ou publicação.

## Escopo
Somente a sala 1 de 5. Não há ainda áudio, boss, save, menus completos nem assets finalizados de inimigos. O workflow de empacotamento é manual (`workflow_dispatch`) para não gastar Actions com commits de outras ferramentas.
