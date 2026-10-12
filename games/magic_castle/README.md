# Magic Castle — vertical slice 01

Protótipo HTML5 2D lateral independente. Não altera o runtime do City Horizon nem o Draw Engine A7.

## Organização e futura migração

Todo o jogo e suas fontes de arte ficam nesta pasta. A receita do mago está em `authoring/wizard/`, os PNGs do pacote em `assets/wizard/` e o contrato para um repositório próprio em [`docs/REPOSITORY_BOUNDARY.md`](docs/REPOSITORY_BOUNDARY.md). O A7 é apenas a ferramenta externa usada na geração dos PNGs. O workflow GitHub fica excepcionalmente na raiz em `.github/workflows/magic-castle-prototype.yml` por exigência do GitHub.

## Controles
- A/D ou setas: movimento lateral
- W / Espaço: salto\n- ↑ / Shift junto da porta após eliminar os inimigos: subir ao próximo andar
- Enter / J: lançar magia na direção do personagem
- R: recomeçar
- Celulares: botões de toque abaixo do canvas

## Celulares e tablets\n\nLayout responsivo em retrato ou paisagem, com controles de dois dedos (andar + pular ou disparar), botões grandes, respeito às áreas seguras de tela e recuperação de teclas pressionadas quando o aplicativo perde foco. A câmera mantém a área lógica de 800×450, sem distorcer o pixel art. É recomendado jogar em paisagem. O modo paisagem compacto dispõe comandos sobrepostos nas laterais. Reinício disponível por botão de interface.\n\n## Para jogar
Abra `index.html` em um navegador. Para usar sprites oficiais em vez do desenho provisório incorporado, baixe o artefato do workflow `Magic Castle playable prototype`; ele inclui `assets/wizard/` com os PNGs do mago gerados diretamente da receita versionada no A7.

O protótipo inclui plataforma, gravidade, colisão no chão, câmera fixa, projéteis, três comportamentos de inimigo, HP, invulnerabilidade após dano, vitória e reinício. Inimigos/cenário são placeholders desenhados no Canvas e **não são arte aprovada**. A revisão de sprites e jogabilidade precede promoção para um repositório independente ou publicação.

## Escopo
Somente as salas 1 e 2 do plano de 5 andares. Não há ainda áudio, boss, save, menus completos nem assets finalizados de inimigos. O workflow aceita execução manual e mudanças restritas à pasta do jogo; commits de outras ferramentas não devem dispará-lo.

## Segundo andar e progresso

Duas salas próprias, com dois inimigos por andar. Ao vencer os inimigos aproxime-se da porta e use seta para cima, Shift ou o botão ENTRAR no mobile. A transição em cubos é desenhada diretamente pelo Canvas (sem dependência do A7 em runtime). Barra de vida com cinco pontos; no segundo andar uma poção recupera até dois pontos, uma única vez. Após concluir o andar 2 a partida termina em vitória. `stages.js` define salas, regras de porta e cura.
