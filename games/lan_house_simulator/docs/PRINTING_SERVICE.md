# LHS — Impressão de documentos no balcão (primeira etapa)

## Objetivo
Ampliar as fontes de receita sem converter o Lan House Simulator em um jogo diferente. Impressão é um serviço de balcão, como a copiadora de CDs/DVDs existente: nenhum objeto físico novo é adicionado ao mapa neste primeiro incremento.

## Regras
- Comprar impressora por R$ 320 no catálogo da loja, uma única vez.
- Em Administração → Preços, definir o valor por página: modo histórico de R$ 0,50 a R$ 20 em passos de R$ 0,50; saves clássicos usam R$ 1 a R$ 20 em números inteiros para manter a compatibilidade da contabilidade antiga.
- Clientes já atendidos podem pedir de uma a quatro páginas ao passar pelo balcão. Nem todo cliente pede. Preço elevado reduz a demanda.
- Papel e tinta custam R$ 0,45 por página em 1998 no modo histórico, indexados pelo índice do jogo. No modo clássico, o custo por página é R$ 1 inteiro, preservando os saves V1.
- Capacidade do primeiro modelo: 35 páginas por dia. Sem estoque externo nem renda automática. Cliente precisa ter dinheiro para pagar.
- Pedidos são determinísticos por ID, não consomem RNG de chegadas e são processados no máximo uma vez por visita. O valor entra no caixa, na receita e nas despesas, separado das receitas de uso dos PCs.
- `printer` e `printChecked` são opcionais nos saves existentes; a importação valida preços, contadores, dia e dinheiro. O efeito de pagamento do balcão soma corretamente impressão, CD/DVD e sessão sem atribuir impressão à receita de uma estação.
- Clientes que procuram apenas impressão agora entram fisicamente pela mesma porta e fila do balcão e saem sem usar nenhum PC. Não pagam sessão, não desgastam computador e só geram receita após atendimento real.
- Procura avulsa tem sorteio determinístico independente do RNG de clientes regulares, proporcional ao preço, respeita expediente, capacidade de 35 páginas/dia e espaço da fila. Não há renda passiva nem teleportes.
- O contador opcional `printer.walkIns` diferencia visitantes de impressão dos atendimentos por PC. O indicador de atendimentos soma ambos, sem alterar a métrica de sessões `served` dos saves antigos.
- A ordem dos clientes na fila é única: o atendimento avulso respeita o caixa ocupado, o limite diário e não passa à frente de quem veio jogar.
- A etapa não adiciona nova máquina visível no mapa; digitalização, trabalhos escolares e fila dedicada permanecem para avaliação futura.

## Testes
`tests/print-service.test.mjs` cobre compra, limite, demanda, falta de caixa, preço, custo, persistência, dados inválidos, compatibilidade e venda real no loop de atendimento. Antes de considerar arte aprovada, revisar loja e painéis reais em desktop e telefone físico.

## Expansão comercial — visitantes avulsos
Testes da simulação validam compra sem PC, capacidade, contabilidade, determinismo de chegadas, importação de saves e ausência de receita duplicada. Uma regressão em Chromium confirma o fluxo real na interface desktop/mobile. Ainda depende de playtest físico e campanhas mais longas antes de balanceamento final.

## Arte do equipamento e atendimento do Tony (15/10/2026)
- A impressora já era vendida por R$ 320; o cartão agora contém uma ilustração procedural 2.5D própria, em Canvas, na mesma linguagem da copiadora.
- Depois de adquirir o equipamento, o serviço é ativado e a impressora aparece sobre o balcão existente. A arte utiliza o pivô e rotação do balcão, sem ocupar nova posição, alterar colisões ou gerar custo adicional.
- Tony permanece atrás do balcão: respiração leve quando ocioso; após impressão paga, movimenta braços por um curto período. A impressora pisca a luz e ejeta papel durante a animação.
- O campo printer.lastPrintedMinute é opcional e validado, de modo que saves anteriores continuam válidos. Ausência do dado ou compra sem venda deixam a impressora inativa.
- QA em Chromium verifica preço, compra, bloqueio da segunda compra, desenho real da loja e do salão, diferença entre quadros parados/ativos e ausência de alterações de layout em desktop, 414px e 360px.
- Aprovação de acabamento, posição e gestos finais ainda exige avaliação visual em telefone físico.
