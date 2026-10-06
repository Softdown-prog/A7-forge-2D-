# A7 Forge 2D

Ferramenta determinística para desenhar assets 2D por receitas, grafos, pincéis,
camadas e materiais. O núcleo atual é o Draw Engine V2; o Art Planner transforma
uma intenção de planta em uma estrutura compartilhada e quatro vistas coerentes.
Também existem módulos de personagens, cercas, objetos, acabamento e um empacotador
de animação 2D que gera spritesheet, manifesto e GIF de revisão sem depender do Blender.

## Instalação e uso

Python 3.11 ou posterior:

```bash
python -m pip install -e tools/visitor_forge_2d
python -m visitor_forge_2d --help
```

O comando `a7-forge-2d` aponta para o mesmo CLI. Os nomes antigos
`ch-visitor-forge-2d` e `ch-fence-2d` continuam disponíveis.

Desenhar e auditar um grafo reutilizável:

```bash
python -m visitor_forge_2d draw-graph \
  --recipe tools/visitor_forge_2d/examples/draw_engine_field_tree_pilot_01.json \
  --output out/graph
```

Gerar um piloto de personagem pixel art em quatro direções:

```bash
python -m visitor_forge_2d render-pixel-character \
  --recipe tools/visitor_forge_2d/examples/pixel_character_adventurer_01.json \
  --output out/pixel_character
```

O render trabalha na grade final, sem anti-aliasing, e entrega `idle` + quatro
frames de caminhada por direção já conectados ao empacotador de animação.

Empacotar uma sequência de frames 2D já gerados pelo Forge:

```bash
python -m visitor_forge_2d pack-animation \
  --recipe caminho/animation.json \
  --output out/animation
```

O contrato `A7_FORGE_2D_ANIMATION_V1` preserva os pixels originais no
spritesheet; `pixelArt: true` não aplica suavização ou redimensionamento.

Planejar, renderizar e comparar uma planta nas quatro vistas:

```bash
python -m visitor_forge_2d plan-plant \
  --intent tools/visitor_forge_2d/examples/plant_intent_ipe_planner_pilot_01.json \
  --output out/planner
```

`draw-graph` aceita grafos V1 e V2, incluindo formas vetoriais sem distribuição
por campos. `plan-plant` mantém seed e identidade dos galhos entre as vistas e
registra baseline, tentativa de reparo e decisão por vista. Nenhum comando
aprova arte ou promove assets automaticamente ao runtime.

O wheel inclui o código, os dez pincéis PNG e o aviso de licença do libmypaint.
O Draw Engine pode ser instalado e executado fora do checkout com uma receita
fornecida pelo usuário. Receitas de exemplo, catálogos de componentes, definições
e masters de autoria continuam no repositório; os comandos que usam essas
bibliotecas devem ser executados a partir deste checkout.

## Verificação

```bash
python -m pip install pytest
python -m pytest -q tools/visitor_forge_2d/tests
```

O CI executa a suíte completa, instala o wheel em um diretório temporário fora
do checkout e renderiza um grafo real usando os pincéis instalados. Também
exporta pilotos de compatibilidade, campos, clusters e planejamento em quatro
vistas para revisão.

## Documentação

- [Draw Engine V2](tools/visitor_forge_2d/docs/A7_DRAW_ENGINE_V2.md)
- [Art Planner](tools/visitor_forge_2d/docs/A7_ART_PLANNER_V1.md)
- [Correções verificadas](docs/A7_QUALITY_IMPROVEMENTS.md)
- [Módulos legados e autoria](tools/visitor_forge_2d/README.md)

O README legado contém histórico de integrações no City Horizon, que não são
executáveis neste repositório isolado. Aqui existem masters de personagem SOUTH,
EAST e NORTH; o master WEST não está incluído. O comando de revisão das quatro
direções exige todas as fontes e informa a ausência antes de escrever saídas.
O teste diagnóstico do rig WEST verifica o algoritmo, sem inventar ou aprovar
uma imagem artística para essa direção.

Veja a [comparação do ipê amarelo e os controles de copa florida](docs/A7_FLOWERING_REFERENCE.md), com imagens reais antes/depois e receita reproduzível.

Veja também o [refinamento de casca, raízes e estabilidade dos reparos](docs/A7_WOOD_AND_REPAIR.md).

- [Melhorias gerais do desenho: 704 variantes, 44 famílias e comparação real](tools/visitor_forge_2d/docs/A7_GENERAL_DRAWING.md)
