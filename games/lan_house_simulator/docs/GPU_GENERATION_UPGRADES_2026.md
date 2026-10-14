# GPUs 2009 → 2011 → 2013: compras sucessivas e valor incremental

Data: 14/10/2026 · Lan House Simulator · teste: `tests/gpu-generation-path.test.mjs`

## Pergunta
Após instalar uma PixelForce 260 em 2009, vale pagar por outra placa em 2011 e, depois, novamente em 2013? O experimento anterior comparou PCs básicos contra PCs atualizados; esta auditoria compara **máquinas já equipadas**, para não confundir a vantagem de comprar uma primeira GPU com a de substituí-la.

## Cenários reproduzíveis

Foram executadas **12 campanhas contínuas de 900 dias**: duas sementes (23, 137), tarifas constantes de R$ 22/h e R$ 24/h, e três estratégias de atualização:

- **Manter:** dois computadores posteriores do salão (PCs 4 e 5) equipados com PixelForce 260 (`gpu09`) durante toda a campanha.
- **Direto:** manter PixelForce 260 de 2011 até a chegada de 2013 e comprar duas PixelForce 770 (`gpu13`), por R$ 4.500.
- **Gradual:** trocar em 2011 as duas placas por PixelForce 560 (`gpu11`) por R$ 3.180 e depois, em 2013, por duas PixelForce 770, mais R$ 4.500. Custo incremental acumulado: R$ 7.680.

As campanhas **começam em 2011** com ambas as PixelForce 260 já adquiridas pelo preço integral por meio da API; a compra inicial está debitada igualmente em todos os grupos. O simulador avança realmente de 2011 a meados de 2013 (900 dias × 720 minutos), com a virada de ano, licenças de Windows, fornecedor, cinco PCs, expansão, rede, estoque, contas, manutenção e limpeza reais. Não há saltos no tempo, adição artificial de visitantes ou crédito sobre placas usadas.

Capital inicial: R$ 50.000 em todos os cenários. **Resultado líquido = caixa final − R$ 50.000**, depois de investimento e todas as despesas da campanha. As médias abaixo usam duas sementes, não são previsões universais.

## Resultados financeiros (900 dias)

| Tarifa | Manter GPU 2009 | Trocar direto em 2013 | Trocar em 2011 e 2013 |
| --- | ---: | ---: | ---: |
| R$ 22/h · resultado líquido médio | **R$ 206.231,50** | R$ 201.568,50 | R$ 198.545,00 |
| R$ 22/h · atendimentos médios | 13.086,5 | 13.086,5 | 13.108,5 |
| R$ 22/h · reputação média | 97,03 | 97,05 | 97,25 |
| R$ 24/h · resultado líquido médio | **R$ 124.079,00** | R$ 119.560,50 | R$ 116.795,50 |
| R$ 24/h · atendimentos médios | 8.279,5 | 8.296,5 | 8.314,5 |
| R$ 24/h · reputação média | 93,38 | 94,51 | 94,29 |

Os upgrades **não se pagaram nesses cenários**; a estratégia de manter as PixelForce 260 gerou o maior resultado líquido nos dois preços. Os atendimentos e a reputação melhoraram um pouco em alguns grupos modernizados, mas o ganho não cobriu compra e energia adicionais. A atualização em duas gerações custou mais do que a atualização direta, pois o jogo não oferece revenda, reembolso nem desconto de troca.

O resultado **não contradiz** a auditoria anterior: sair de máquinas antigas sem GPU para PCs modernos produziu um ganho grande após um ano. Aqui, a operação já começa com GPUs 2009 e hardware nível 3, portanto o benefício **incremental** é menor.

## Proteções adicionais identificadas no teste

A campanha de 900 dias detectou que, sem um navegador consumindo os eventos, filas temporárias de pagamento, venda, digitação e falas se acumulavam. Em um teste headless, isso podia levar o arquivo JSON a superar o limite de 2 MB imposto pela importação.

O código agora limita cada fila visual a **48 eventos recentes** e a exportação e o salvamento automático **não persistem** essas filas, que não são necessárias para retomar a partida. O arquivo continua contendo caixa, receitas, despesas, móveis, equipamentos, clientes, caminho, datas e informações econômicas. Saves anteriores continuam aceitos; a nova exportação evita gerar um arquivo enorme com animações descartáveis. Foram acrescentados testes que reproduzem um estado superior a 2 MB e conferem preservação do conteúdo importante.

## Interface

A aba **Placas de vídeo**, já no estilo Terminal de Bairro, passa a mostrar o bônus de satisfação da placa oferecida e o **ganho adicional sobre a GPU atualmente instalada no PC selecionado**. Quando já existe uma placa, o painel explica que a nova compra cobra o **valor integral e substitui a anterior sem abatimento**. O custo exibido vem do catálogo vigente; nenhuma nova regra econômica foi introduzida.

## Limites e próximos passos

- Apenas duas sementes, cinco PCs, preços fixos e uma configuração de rede e manutenção; não declarar vencedora universal nenhuma estratégia.
- Não há inflação de preço das placas, financiamento, crédito de revenda ou valor residual implementados.
- Ainda é necessário estudar sete PCs ou mais, mudanças de preço conforme a clientela e renovação em partidas com uso intensivo.
- Os testes visuais automatizados não substituem a aprovação humana em telefone físico.
