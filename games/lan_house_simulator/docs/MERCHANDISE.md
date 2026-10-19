# Mercadorias e fornecedores

Implementação em `games/lan_house_simulator`, mantendo o motor TypeScript/Canvas e a versão 1 do save.

## Arquitetura preservada

Antes deste incremento, `economy.ts` comprava/vendia três categorias (`soda`, `candy`, `snacks`); `needs.ts` selecionava uma bebida e um alimento por visita; `engine.ts` executava a venda ao alcançar o ponto de atendimento. `retailQueue.ts` já fornecia filas por máquina/prateleira, integradas às rotas e colisões. O fornecedor parceiro já cobrava R$ 180 e descontava 20% nos lotes. `retailArt.ts` já mantinha sprites em cache. `snapshotGameState`, a persistência local/nuvem e exportação preservavam campos do estado e removiam apenas efeitos transitórios.

## Implementação

- `sim/merchandise.ts`: catálogo, quatro fornecedores, preços, custos médios, pedidos, recebimento, escolha e validação do estado opcional `merchandise`.
- `economy.ts`: APIs anteriores delegam ao mesmo módulo; nenhum segundo fluxo de caixa ou estoque.
- `needs.ts` e `engine.ts`: produto escolhido permanece associado à categoria física em `desiredProduct`; preço, estoque e carteira são revalidados ao atender. No máximo uma bebida e um alimento por visita. Consumo diminui necessidades conforme o produto e a qualidade; não gera receita por si.
- `types.ts`: campos opcionais do catálogo, pedido escolhido e gesto de consumo. `isValidSave` valida estoque novo, preços, custos, pedidos duplicados e produto/categoria. Os módulos de exportação e persistência continuam usando o mesmo estado.
- `decisions.ts`: o lote especial do correio mantém sua cobrança original e acrescenta o custo real à avaliação do estoque, sem segunda despesa.
- `ui/merchandisePanel.ts`, `managementPanels.ts`, `main.ts`, `presentation.ts`, HTML/CSS: três painéis, um produto por vez, comparação de custo unitário, preço e margem. Controles não são reconstruídos a cada atualização, mantendo foco e posição de rolagem.
- `render/merchandiseDisplay.ts`, `retailArt.ts`, `scene.ts`: composição limitada à capacidade visual existente e recalculada quando o estoque muda. Identidade e cor entram na chave do cache de sprites. A embalagem e a mão animadas após venda não alteram trajetos nem a colisão.

## Catálogo e progressão

1998: refrigerante, balas, salgadinho, água, chiclete, paçoca, biscoito recheado e chocolate. Em 2001 chega suco; 2005, energético; 2010, refrigerante zero; 2020, biscoito integral. São datas de progressão do jogo, não afirmações sobre lançamento histórico desses alimentos. Até 2030, preços de referência e atacado seguem o índice econômico já existente. Preços alterados pelo jogador permanecem explícitos e não são reajustados automaticamente. Saves clássicos conservam moeda inteira e tabelas clássicas.

| Fornecedor | Custo relativo | Qualidade | Condição |
| --- | ---: | ---: | --- |
| Básico | 100% | 100% | 1 lote, imediato |
| Econômico | 90% | 92% | mínimo 3 lotes, entrega após 720 minutos simulados |
| Selecionado | 120% | 120% | 1 lote, imediato |
| Parceiro | 80% | 100% | 1 lote, imediato, adesão existente de R$ 180 |

Qualidade afeta alívio da necessidade, tolerância ao preço, escolha por perfil e reação visual. Não há crédito automático na reputação. A qualidade e o custo do estoque são médias ponderadas; mercadoria selecionada misturada ao estoque antigo não transforma todas as unidades em premium.

Pedidos são pagos integralmente ao confirmar, com caixa e despesas atualizados uma única vez. O recebimento apenas muda estoque e remove o pedido. O prazo usa o relógio do jogo, persiste em saves e atravessa dias/meses/anos. Não corre com a partida fechada. Máximo de 100 pedidos pendentes, 50 lotes por pedido e 999.999 unidades por produto, contando recebimentos pendentes. Não se aceita entrega após o final de 2030.

## Compatibilidade e contabilidade

Os três saldos originais continuam em `inventory`; não são copiados para outro estoque. Os produtos novos começam vazios. Campos opcionais são criados apenas quando necessários. Nenhuma migração cobra o caixa ou cria receita. Os clientes antigos com apenas `desiredItem` compram o produto original correspondente na mesma fila.

O custo de unidades iniciais/legadas é estimado pelo atacado de referência, pois saves antigos não contêm notas de compra. Ajustes genéricos de estoque por eventos históricos mantêm essa base média; não recebem uma despesa inventada. O lote pago do fornecedor por correio usa seu custo explícito. Estatísticas individuais começam neste incremento, sem reconstruir vendas passadas. Margem bruta = receita menos custo das unidades vendidas; não inclui aluguel, energia ou adesão. Esses custos continuam nas Finanças.

## Validação e reprodução

- `npm test`: build TypeScript e regressões gerais, incluindo computadores, PS1, funcionários, eventos e recuperação.
- `node --test tests/merchandise.test.mjs`: migração sem duplicação, preços e anos, orçamento, rejeição a sobrepreço, última unidade, save entre compras, entrega única, limites, cache e proposta antiga do fornecedor.
- Campanhas naturais: 4 fornecedores × 7 dias × anos 1998, 2005, 2020 e 2030; conservação `caixa final = inicial + receita - despesas` e `estoque inicial + comprado = estoque restante + pendente + vendido`. Sem injetar clientes ou receita.
- Quatro campanhas iniciais de 35 dias, começando com os R$ 850 normais, reserva de R$ 500 para contas e mesma configuração regularizada de operação. Contas mensais foram pagas; o saldo permaneceu positivo. Resultado observado: básico R$ 1.169,43; econômico R$ 1.136,74; selecionado R$ 1.050,50; parceiro R$ 1.108,11. São cenários determinísticos, não garantia de lucro para qualquer estratégia. A qualidade superior exige ajustar preço/mix para justificar seu custo; a adesão demora a se pagar.
- `node scripts/verify_merchandise.mjs out/merchandise`: Chromium em 1280, 414 e 360 pixels; pedidos, contratação, preço, foco, overflow, rolagem, recarga e cliente oriundo da simulação normal consumindo água. Aceita `LHS_CHROMIUM` para um executável local. Produz capturas, trace e quadros de vídeo.
- `node scripts/verify_management_panels.mjs`: regressão em seis combinações de largura/época, com CPU reduzida nos perfis mobile; mantém renderização durante rolagem, todas as categorias e os controles existentes.
- O gate de publicação Pages e o workflow geral incluem o novo teste de navegador. A conclusão local não equivale a confirmação de publicação.

Foi corrigida também uma flutuação preexistente em `cookie-cosmetics.test.mjs`: o teste comparava a data de exportação de duas chamadas diferentes, podendo falhar por 1 ms. Agora compara o estado persistido, que é o contrato relevante.

Validação local final: 586 testes descobertos, 577 aprovados, 9 auditorias opcionais ignoradas e nenhuma falha. O teste de mercadorias passou nas três larguras; o teste de painéis passou nas seis combinações de largura/época, com 22–23 desenhos durante a janela de rolagem mobile sob CPU 4× reduzida. Foi produzido um MP4 de 20 segundos do cliente nº 2 gerado pela simulação.

## Limites deste incremento

Não há validade/perecimento, lotes FIFO, entrega com veículo, cancelamento ou reembolso de pedido. Não há implantação de novos equipamentos. A animação de consumo é um pequeno gesto com embalagem, preservando os sprites atuais. Mobile foi validado por emulação Chromium e gestos; não em aparelho físico. Campanhas não representam uma auditoria exaustiva de todas as estratégias até 2030.
