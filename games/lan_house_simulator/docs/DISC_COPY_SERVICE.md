# Copiadora de CDs e DVDs

Disponível na loja a partir de 2001 por R$ 900, em partidas históricas e clássicas. Compra única; não exige expansão, posicionamento nem cria novos objetos, colisões ou filas no mapa; a miniatura fica sobre o tampo do balcão já existente. A mesma arte Canvas da torre com quatro unidades ópticas é reaproveitada como miniatura no balcão após a compra. Antes da compra, a torre não aparece.

Após a compra, Administração → Preços mostra preços independentes por CD e DVD, custo da mídia, resultado por cópia, volumes acumulados, faturamento e resultado do serviço. O resultado acumulado exclui o investimento inicial, que entra nas despesas gerais da lan house.

Clientes que já foram atendidos no balcão podem pedir de uma a três cópias junto da sessão. Ao preço de referência, aproximadamente 20% dos perfis procuram o serviço. A escolha usa o ID do visitante, sem consumir RNG, alterar a chegada de clientes ou criar pagamento automático por tempo. Preços maiores reduzem a procura; a carteira limita a quantidade, e a máquina produz até 24 cópias por dia. As cópias não incrementam vendas de alimentos e bebidas nem disparam seus sons.

Valores de design em 2001: CD R$ 3 com mídia R$ 1; DVD R$ 6 com mídia R$ 2. Não são preços históricos pesquisados. No modo histórico, custo da mídia e preço de referência acompanham o índice de custos existente, relativo a 2001. O preço inicial é definido ao comprar; depois fica sob controle do jogador, de R$ 1 a R$ 80 em reais inteiros, sem reajuste automático. A interface destaca preços que dão prejuízo.

Cada venda soma o valor cobrado à receita, o custo de mídia às despesas e a diferença ao caixa. O total recebido no balcão aparece em um único efeito de pagamento, evitando textos sobrepostos. O histórico do PC continua contando apenas a sessão. Compra, preços, volumes e valores são persistidos e validados; saves anteriores sem copiadora continuam válidos. Uma visita não pode repetir o pedido após salvar/carregar.

Validação: testes de motor, compra única, desbloqueio, demanda/preço, carteira, capacidade diária, contabilidade, importação e clientes reais. `scripts/verify_disc_copy.mjs` exercita os controles em 1440/414/360 px, confirma persistência, ausência de erros/rolagem horizontal e comparação de pixels para confirmar que a nova torre aparece sobre o balcão após a compra, mantendo as posições do salão inalteradas.

## Etapa 2 — clientes exclusivamente de cópias
- A compra continua disponível **somente a partir de 2001**, uma vez, por **R$ 900**. Sem aquisição não há procura avulsa, nem vendas.
- Agora existem visitantes que entram apenas para copiar CD/DVD, sem pagar sessão de computador e sem ocupar ou desgastar PCs. Eles usam a mesma porta, os mesmos caminhos, a mesma fila única do balcão e a mesma saída dos outros clientes.
- A procura é sensível aos dois preços, à reputação e à capacidade de 24 unidades por dia. O pedido escolhe CD/DVD pelo ID, com orçamento próprio, sem consumir sorteios do fluxo regular.
- Uma compra só gera caixa e estatísticas ao chegar ao balcão. Sem troco suficiente, capacidade, tempo de expediente ou acesso físico, o cliente sai sem renda fictícia. O contador opcional `discCopier.walkIns` soma apenas atendimentos exclusivos concluídos.
- Administração passa a distinguir sessões de PCs, clientes só de impressão e clientes só de cópias, sem somar os serviços agregados à sessão uma segunda vez.
- Saves anteriores sem `discCopier.walkIns` ou `serviceRequest: "disc-copy"` continuam válidos. Casos adversos são testados por Node e em Chromium desktop/414/360 px.
- Pendente: avaliação física no Android/iOS e balanceamento de procura/retorno em campanhas extensas; a copiadora visual segue apenas na vitrine da loja.

## Equipamento visível e Tony copiando — Etapa 2
- Após a compra, a torre de CDs/DVDs surge sobre a extremidade do balcão. Ela respeita a câmera isométrica e as quatro rotações do balcão, sem ocupar espaço adicional, sem modificar o layout nem registrar novos objetos no save.
- Ao copiar CDs/DVDs com pagamento confirmado, o campo **opcional** `discCopier.lastCopiedMinute` registra o minuto da transação. A torre indica atividade, movimenta um disco na bandeja e Tony faz um gesto curto com os braços. Apenas comprar a copiadora não inicia animação nem gera receita.
- A animação dura até 8 minutos do jogo após uma venda; não muda a lógica de atendimento, preços, patrimônio ou duração das sessões de PC. Se copiadora e impressora tiverem pedidos próximos, ambos os equipamentos podem animar, e Tony gesticula conforme o serviço pago mais recente.
- Partidas salvas antes desta atualização continuam válidas porque o novo campo é opcional. Minutos negativos, fracionários, futuros ou inválidos são rejeitados na importação.
- Os testes `disc-copier-tony.test.mjs` e `verify_disc_copier_tony.mjs` verificam compra, ausência de receita passiva, persistência, coexistência dos equipamentos, quatro rotações e desktop/mobile (1280/414/360 px). As capturas PNG são anexadas ao artefato visual do GitHub Actions.
- Ainda é necessária a avaliação visual em telefone físico, particularmente a legibilidade das bandejas na câmera com zoom mínimo.

## Transparência econômica dos serviços (Etapa 2)
- O painel exibe o **resultado operacional** do CD/DVD, descontando mídias, e **quanto falta para recuperar os R$ 900 investidos** na máquina. Após amortizar, mostra o saldo acumulado depois do investimento inicial.
- A procura avulsa potencial por dia é estimada usando a chance real de entrada e o tempo de admissão. Filas, carteira, expediente e capacidade podem reduzir o total efetivo; nunca confundir previsão matemática de tentativas com clientes atendidos.
- Margens por CD/DVD, preços individuais e avisos existentes de prejuízo permanecem. Não houve reajuste automático, aumento artificial de clientela ou mudança nos preços base: o balanceamento amplo fica para a etapa de campanha completa.
- O cálculo não modifica RNG, salvamento, fluxo dos NPCs, quantidade de CDs/DVDs nem finanças; apenas interpreta valores já registrados no jogo. Testes cobrem anos da campanha, custo de mídias, retorno de investimento, saves e desktop/mobile.
