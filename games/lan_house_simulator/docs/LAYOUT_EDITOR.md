# Salão editável e visualização móvel — 14/10/2026

## Como usar

No salão, use **+ / −** para ampliar, **Ver tudo** para enquadrar e **Tela cheia** quando o navegador permitir. No celular, o mapa inicia em 160% e pode ser percorrido deslizando dentro da janela. O zoom altera a visualização, sem mudar coordenadas, preços ou relógio da simulação.

Abra **Compras → Organizar salão**, mesmo sem comprar decoração. O acesso fica na loja, fora dos controles de visualização do mapa. A partida fica pausada durante a edição. Escolha um objeto pelo toque ou pela lista, toque no destino, use **Girar 90°** e **Confirmar posição**. Antes da confirmação, apenas a prévia muda. **Outro objeto** troca a seleção; **Concluir edição** ou Escape sai do editor.

São editáveis os PCs com mesa/cadeira, balcão com administrador, máquinas de doces e bebidas, prateleira, lixeiras, pôsteres iniciais e decoração comprada. Pôsteres acompanham a parede; os iniciais podem ser transferidos entre fundos e lateral, e os comprados usam encaixes de parede. A fachada e a entrada sul continuam fixas, conforme o contrato do jogo.

PCs em uso ou manutenção precisam ser liberados antes de mover/girar. Lixeiras em limpeza aguardam o serviço. Mover não altera peças, licenças, estoque, desgaste, receita por estação nem cobra novamente pelo objeto.

## Decoração e divisórias

O limite de uma mesinha / duas plantas foi substituído por posições físicas livres. Podem existir várias unidades do mesmo tipo, compartilhando o espaço de piso. Os encaixes adicionais possuem IDs estáveis quando se ampliam alas; compras continuam cobradas individualmente e saves legados continuam reconhecidos. A loja distingue falta de espaço de caixa insuficiente.

Divisórias usam **selecionar → conferir a prévia → confirmar**. Um primeiro toque não compra nem remove material. O segmento selecionado pode ser girado antes de construir. Depois de confirmar, o modo continua aberto para o próximo segmento. Portas também pedem confirmação pelo controle de construção. Para remover, abra **Compras → Remover paredes e portas** ou escolha a divisória na lista de **Organizar salão**. A lista mostra posição e orientação, e destaca o segmento selecionado; não depende de acertar uma linha estreita no mapa.

Uma parede pode desviar a circulação existente se todos os serviços e clientes continuarem acessíveis. Continua proibido cortar objetos, ultrapassar o salão ou fechar o acesso de clientes. O motor recalcula caminhos depois das mudanças; os limites técnicos de divisórias permanecem para proteger o desempenho.

Plantas, mesinhas, pôsteres comprados e pôsteres iniciais podem ser retirados por **Remover item → Confirmar remoção**. **Cancelar remoção** preserva o item. A remoção é gratuita, sem reembolso, libera o encaixe e atualiza os trajetos. PCs, balcão, máquinas, prateleira e lixeiras permanecem como serviços essenciais reposicionáveis.

A retirada normaliza unidades de saves antigos, reduz a quantidade instalada e mantém os outros itens. `removedBuiltPosters`, opcional no save V1, registra apenas índices originais válidos para que pôsteres retirados não voltem após recarregar ou ampliar. O cache do cenário inclui essas retiradas.

## Integração

- `sim/layout.ts`: posições, rotações e pontos de atendimento compartilhados.
- `sim/editableObjects.ts`: objetos iniciais, geometria, validação e mudança gratuita, com atualização de filas e destinos.
- `ui/layoutEditor.ts`: seleção por lista/toque, prévia e confirmação.
- `ui/gameViewport.ts`: zoom, deslocamento por gesto, tela cheia e proteção contra cliques após deslizar.
- `objectPlacements`, opcional no save V1: `{id,x,y,rotation}`. IDs `pc:<índice>` acompanham a inserção de novas estações antes dos anexos, sem trocar equipamentos de dono.
- `furniturePlacements`: permanece usando encaixes validados, agora com mais posições e paredes laterais. Nenhum item é concedido só por adicionar posição ao save.

Assentos, proprietário, atendimento de bebidas/doces e retirada na prateleira acompanham os objetos. A cena gira as peças no plano do mundo, mantendo a altura vertical e mostrando faces visíveis; não gira a imagem inteira. Os caches incluem orientação e têm margem suficiente para evitar corte de gabinetes girados.

## Verificação

```sh
npm test
npm run audit
node scripts/verify_layout_editor.mjs out/layout-editor
node scripts/capture_retail_art.mjs out/layout-retail
node scripts/verify_rendering.mjs out/layout-render
```

A revisão em Chromium usa desktop 1440 e celulares emulados 414/360, toque real no piso, giro, confirmação, pausa, recarga de save compra de segmento com confirmação, cancelamento de remoção, retirada de decoração/pôster inicial/divisória/porta e persistência após recarga. Confere ausência de overflow horizontal da página e erros de JavaScript. Inclui 60 comparações de sprites em três zooms e quatro orientações; o teste varejista cobre mais 147 casos. O teste do motor mantém pagamentos e compras reais após reorganizar o salão.

Emulação não substitui testes em telefone físico. A retirada não revende materiais e não desmonta equipamentos de atendimento.
