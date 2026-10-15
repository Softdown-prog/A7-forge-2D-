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
- Não há clientes exclusivos de impressão nesta etapa. Novos serviços de digitalização e trabalhos escolares, equipamento visual e fila dedicada dependem de design e testes posteriores.

## Testes
`tests/print-service.test.mjs` cobre compra, limite, demanda, falta de caixa, preço, custo, persistência, dados inválidos, compatibilidade e venda real no loop de atendimento. Antes de considerar arte aprovada, revisar loja e painéis reais em desktop e telefone físico.
