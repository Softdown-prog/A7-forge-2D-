# Fórum Linux — março a agosto de 1999

## História
Tony recebe em março de 1999 uma mensagem de um fórum fictício de estudantes de programação. Em vez de substituir máquinas Windows, passa meses pesquisando o que o grupo precisa, até desbloquear **computadores Linux novos** à venda.

O jogo usa 12 meses de 30 dias:
- 1999/03/01 (dia 421): chega o pedido dos estudantes.
- +30 dias após aceitar a pesquisa: explicações sobre software livre e sistemas Linux.
- +75 dias: escolha de bancadas, hardware e preparação do espaço.
- 1999/08/01 (dia 571): catálogo de máquinas Linux liberado, se a pesquisa já tem 110 dias. Se Tony começou depois, terá que cumprir os 110 dias a partir do início.

## Estações de uma linha diferente
O catálogo da loja na categoria **Computadores e serviços** passa a oferecer dois modelos fictícios:
- **Bancada Linux 99** (R$ 440): mesa técnica, CRT, gabinete de aço, teclado e cadeira. Conforto adicional de 1,5%.
- **Estação Programador 99** (R$ 610): bancada e gabinete reforçado, CRT grafite, periféricos e cadeira. Conforto adicional de 5%.

Custos e nomes são **decisões de game design**, não preços de mercado históricos.

Cada compra cria **um computador físico adicional** na próxima vaga real do salão principal: ocupa espaço, entra nas filas, energia, desgaste, economia por estação e save. A compra é bloqueada sem vaga, dinheiro ou conclusão da pesquisa, assim como uma compra de PC tradicional. Para comprar mais PCs, é necessário ampliar a área principal.

As máquinas são fornecidas **com Linux pré-instalado**, sem licença Windows. A função de instalar Linux nos PCs Windows existentes foi retirada: pesquisar Linux libera hardware, não formatação gratuita dos PCs atuais. Instalar Windows posteriormente numa bancada Linux exige comprar licença específica; o Linux da bancada fica disponível para reinício posterior.

## Programação e público
Estudantes podem pedir **especificamente uma estação Linux operacional**. São clientes reais na fila e pagam por sessões, não geram renda passiva. Os gabinetes, monitores e a bancada Linux têm peças e cores distintas, implementadas no renderizador **Canvas 2D procedural**, sem sprites ou imagens geradas. O monitor mostra programação em terminal mesmo se a conexão externa cair.

**Não existe nesta versão** uma sala nova, fórum navegável, editor de código completo ou eventos em grupo. Essas possibilidades ficam como próximos passos do tema de programação; não confundir a programação apresentada no CRT com um compilador funcional.

## Validação
Verificar com `npm test` (inclui os testes da missão), build do TypeScript, screenshot real do salão e botões da loja no Android. Manter PR #44 em rascunho até confirmar; verificar regressões de Windows, expansão, PS1/PS2, saves anteriores e inserção de um PC principal antes de PCs nos anexos.
