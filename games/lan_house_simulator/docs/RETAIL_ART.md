# Máquinas e expositor — 14/10/2026

O salão usa desenhos Canvas originais de `src/render/retailArt.ts`. A máquina de refrigerantes tem latas cilíndricas, a de doces tem embalagens e espirais, e o expositor tem pacotes CROC, uma marca criada para o jogo. As cores acompanham o Terminal de Bairro.

As portas têm moldura, reflexo de vidro, controles, moedeiro e bandeja de retirada em perspectiva. Laterais com painel de manutenção, ventilação, pés e sombra reforçam o volume. O expositor mantém quatro níveis abertos, com estrutura metálica, etiquetas e letreiro fixado ao móvel; as embalagens têm faces laterais, dobra e selagem.

## Estoque e integração

- A cena lê `inventory.soda`, `inventory.candy` e `inventory.snacks`, sem modificar a partida nem consumir números aleatórios.
- As vitrines mostram até 9 latas, 12 doces ou 20 pacotes. Estoque excedente fica na reserva; não é uma nova capacidade de armazenamento.
- Ao zerar, os produtos desaparecem e o indicador da máquina mostra `--`. Vendas e reposições reais atualizam a vitrine no próximo quadro.
- Posições, dimensões do chão, colisões, rotas de clientes, preços e âncoras de retirada permanecem as mesmas. A profundidade de ordenação do expositor acompanha a expansão para oeste.

## Custo de desenho

Um cache LRU de até 96 sprites por contexto reutiliza o equipamento pronto. A chave inclui zoom, posição subpixel, tipo, estoque visível e os dois estados do indicador. Desenhos com transparência ou transformações externas usam o caminho direto para preservar a composição.

## Verificação

Após `npm run build`, executar:

```sh
node scripts/capture_retail_art.mjs out/retail
node scripts/verify_rendering.mjs
node scripts/capture_scene.mjs out/retail-scene
```

O primeiro comando gera ilustrações nativas e um relatório de 147 comparações entre cache e desenho direto: três zooms, vitrines vazias/parciais/cheias, excedente, indicador, transparência e três limites de expansão. Tolera arredondamento de um nível nos gradientes Canvas e limita separadamente as diferenças maiores; transparência exige igualdade exata. Também verifica reposição paga, ausência de mutação do estado e compras dos três produtos em dois dias simulados com o motor real.

Para comparar com uma versão anterior, fornecer como terceiro argumento o JS compilado antigo de `SceneRenderer`. Sem referência, as duas linhas da galeria mostram o desenho atual. O worker de cena executa a verificação no Chromium.
