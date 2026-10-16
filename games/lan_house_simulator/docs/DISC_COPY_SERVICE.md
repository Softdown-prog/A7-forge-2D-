# Copiadora de CDs e DVDs

Disponível na loja a partir de 2001 por R$ 900, em partidas históricas e clássicas. Compra única; não exige expansão, posicionamento nem cria objetos, colisões ou novas filas no mapa. A arte Canvas da torre com quatro unidades ópticas aparece apenas no catálogo.

Após a compra, Administração → Preços mostra preços independentes por CD e DVD, custo da mídia, resultado por cópia, volumes acumulados, faturamento e resultado do serviço. O resultado acumulado exclui o investimento inicial, que entra nas despesas gerais da lan house.

Clientes que já foram atendidos no balcão podem pedir de uma a três cópias junto da sessão. Ao preço de referência, aproximadamente 20% dos perfis procuram o serviço. A escolha usa o ID do visitante, sem consumir RNG, alterar a chegada de clientes ou criar pagamento automático por tempo. Preços maiores reduzem a procura; a carteira limita a quantidade, e a máquina produz até 24 cópias por dia. As cópias não incrementam vendas de alimentos e bebidas nem disparam seus sons.

Valores de design em 2001: CD R$ 3 com mídia R$ 1; DVD R$ 6 com mídia R$ 2. Não são preços históricos pesquisados. No modo histórico, custo da mídia e preço de referência acompanham o índice de custos existente, relativo a 2001. O preço inicial é definido ao comprar; depois fica sob controle do jogador, de R$ 1 a R$ 80 em reais inteiros, sem reajuste automático. A interface destaca preços que dão prejuízo.

Cada venda soma o valor cobrado à receita, o custo de mídia às despesas e a diferença ao caixa. O total recebido no balcão aparece em um único efeito de pagamento, evitando textos sobrepostos. O histórico do PC continua contando apenas a sessão. Compra, preços, volumes e valores são persistidos e validados; saves anteriores sem copiadora continuam válidos. Uma visita não pode repetir o pedido após salvar/carregar.

Validação: testes de motor, compra única, desbloqueio, demanda/preço, carteira, capacidade diária, contabilidade, importação e clientes reais. `scripts/verify_disc_copy.mjs` exercita os controles em 1440/414/360 px, confirma persistência, ausência de erros/rolagem horizontal e comparação exata dos pixels do salão antes/depois da compra.

## Etapa 2 — clientes exclusivamente de cópias
- A compra continua disponível **somente a partir de 2001**, uma vez, por **R$ 900**. Sem aquisição não há procura avulsa, nem vendas.
- Agora existem visitantes que entram apenas para copiar CD/DVD, sem pagar sessão de computador e sem ocupar ou desgastar PCs. Eles usam a mesma porta, os mesmos caminhos, a mesma fila única do balcão e a mesma saída dos outros clientes.
- A procura é sensível aos dois preços, à reputação e à capacidade de 24 unidades por dia. O pedido escolhe CD/DVD pelo ID, com orçamento próprio, sem consumir sorteios do fluxo regular.
- Uma compra só gera caixa e estatísticas ao chegar ao balcão. Sem troco suficiente, capacidade, tempo de expediente ou acesso físico, o cliente sai sem renda fictícia. O contador opcional `discCopier.walkIns` soma apenas atendimentos exclusivos concluídos.
- Administração passa a distinguir sessões de PCs, clientes só de impressão e clientes só de cópias, sem somar os serviços agregados à sessão uma segunda vez.
- Saves anteriores sem `discCopier.walkIns` ou `serviceRequest: "disc-copy"` continuam válidos. Casos adversos são testados por Node e em Chromium desktop/414/360 px.
- Pendente: avaliação física no Android/iOS e balanceamento de procura/retorno em campanhas extensas; a copiadora visual segue apenas na vitrine da loja.
