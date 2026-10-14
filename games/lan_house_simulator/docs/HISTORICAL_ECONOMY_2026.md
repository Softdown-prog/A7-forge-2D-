# Economia histórica: teto anual, poder de compra e duração de sessões
Data: 14/10/2026 — Lan House Simulator

## Princípio

O salário mínimo **nominal** vigente a partir de maio de 1998 foi
**R$ 130**, segundo o Senado/Câmara. O IBGE publica o IPCA anual de
1998 em diante. Essas fontes oferecem **indicadores macroeconômicos**,
não uma tabela oficial de preços de lan houses. O jogo usa um
**teto de R$ 3,00/h em 1998 como decisão de game design**, nunca como
valor histórico comprovado ou imposição legal.

Fontes: 
- Salário mínimo de 1998: https://legis.senado.gov.br/norma/556500/publicacao/15731824
- Histórico do IPCA: https://www.ibge.gov.br/estatisticas-novoportal/economicas/precos-e-custos/9256-indice-nacional-de-precos-ao-consumidor-amplo.html?=&t=series-historicas

## Dois modos sem quebrar saves

**Nova partida** entra no modo histórico (`economyVersion:2`),
com tarifa de abertura R$ 2,50/h, máximo de R$ 3,00/h em 1998,
reajuste anual pelo IPCA e compensação pela idade dos PCs e Windows.

**Save antigo** conserva o modo clássico: preço R$ 4–40/h e economia
anterior, para não recalcular de surpresa seu caixa, compromissos,
clientes ou histórico. O botão **Ativar economia histórica** no painel
Preços migra explicitamente uma partida antiga. Exige confirmação e
**não** converte valores de caixa, dívidas ou aquisições anteriores.
A mudança é persistida no save e irreversível nesse arquivo.

## Inflação ano a ano

`priceIndex(year)` acumula as variações anuais IPCA anteriores à
data jogável e usa preços nominais de 1998 como base. O teto de
mercado (sem considerar PCs defasados) é calculado em incrementos
de R$ 0,25/h, com arredondamento para baixo:
`floor(3 * priceIndex(year) * 4) / 4`.

Exemplos aproximados da tabela:
- 1998: teto de R$ 3,00/h.
- 2000: aproximadamente R$ 3,25/h.
- 2010: aproximadamente R$ 6,25/h.
- 2024: aproximadamente R$ 14,00/h.

O valor permitido para a loja é o **menor entre o teto do ano e o
teto por qualidade**. A qualidade é calculada a partir dos anos
das peças existentes (CPU, RAM, armazenamento, placa-mãe, GPU,
monitor) e da versão real do Windows de cada estação.
Uma máquina com Windows 98 e hardware de 1998 em 2010 perde
competitividade e não sustenta R$ 18/h. Salões mistos usam a
média das idades ponderadas. Esta é uma aproximação de mercado,
não a prova de um preço histórico.

Os dados IPCA consolidados terminam em 2025 neste catálogo.
A partir de 2026, o último índice conhecido **fica congelado**;
o sistema não inventa índices futuros. Quando as estatísticas
forem atualizadas, a série poderá ser estendida.

## Onde a indexação entra

No modo histórico:
- teto máximo anual da hora (e limite inferior de R$ 0,50/h);
- preços de referência da procura e da satisfação **ajustados
  ao poder de compra** da época;
- contas fixas: aluguel, internet e manutenção (cada parcela
  reajustada pelo mesmo índice);
- tarifa de energia acumulada a cada minuto, substituindo os
  antigos 3% fixos por IPCA anual;
- valores *padrão* de refrigerante, doce e salgado e preço do
  atacado (com fornecedor parceiro aplicado depois);
- sessões cobradas em centavos para evitar perder dinheiro ao
  arredondar contratos fracionados.

Preços do varejo configurados manualmente pelo jogador ficam no
valor nominal informado até nova alteração. Os custos individuais
de CPU, GPU, RAM, placa-mãe, fonte, HD, SSD, plataforma, monitor
e licenças vêm dos catálogos geracionais do jogo e **não recebem
um segundo fator de IPCA**: os próprios preços já mudam por
geração. A revisão de todo o orçamento e da relação entre renda,
aquisição de hardware e expansão continuará no balanceamento.

**Contabilidade da virada**: a conta cobrada no primeiro dia do
ano seguinte aplica o IPCA do mês que acabou, não a tarifa
antecipada do novo ano. A nova tabela passa a valer dali em diante.

## Contratos e preços de sessões

Pacotes expostos ao jogador: 30, 45, 60, 90, 120, 180 e
240 minutos. Os visitantes podem contratar períodos entre
30 minutos e 4 horas de acordo com suas necessidades;
períodos mais longos não ultrapassam o fechamento diário.
O painel mostra o valor nominal por duração e a receita
é calculada proporcionalmente em centavos:
`Math.round(100 * (preçoPorHora * minutos / 60))/100`.

O jogador controla o **valor-base da hora**, com passos de
R$ 0,50/h no modo histórico. Os pacotes são proporcionais,
sem descontos comerciais inventados por duração.
No modo clássico, ficam os contratos e valores antigos.

## Limites e próximos ajustes

Esta etapa corrige a referência monetária do preço da hora, os
custos operacionais indexados e o efeito das máquinas. Não
constitui prova de que R$ 3/h era o preço usual em 1998.
Salário mínimo serve de contexto, não como conversão direta
de tarifa da lan house. As campanhas antigas de R$ 18–24/h
em 2011–2013 continuam comparáveis **somente como testes da
economia clássica**, não como recomendação do modo histórico.

Próximas validações: campanhas históricas de 1998 a 2024,
amortização de computador completo, impacto do varejo e do
custo inicial do equipamento, desemprego/poder de compra,
balanceamento da rentabilidade sem criar receitas artificiais
e teste visual em aparelho móvel real.

## Auditoria pós-implementação

A auditoria econômica com **16 campanhas de 120 dias** de 1998,
2005, 2012 e 2024 identificou que limpeza e técnicos mantinham
custos fixos elevados da economia clássica, enquanto a receita de
1998 havia sido indexada à escala histórica.

Somente no modo histórico, limpeza passou a partir de **R$ 12/visita
em 1998** e reparo a partir de **R$ 4 + R$ 0,16 por ponto de desgaste
em 1998**, ambos corrigidos anualmente por IPCA. São valores de
**balanceamento**, não cotações históricas oficiais de serviços.
Os preços originais continuam no modo clássico.

A conta de uma campanha de 1998 com 2.319 clientes em quatro meses
caiu de R$ 4.854 para R$ 1.067,54 em técnicos e de R$ 3.245
para R$ 708 em faxina, com **os mesmos clientes e receitas**.

Testes adicionais mostram que duas partidas com o capital inicial real
de **R$ 850** puderam pagar as três licenças do Windows 98, o
fornecedor, contas e manutenção, encerrando 120 dias com
R$ 2.916,96 e R$ 2.980,97 de caixa. A primeira alteração manual do
preço de uma mercadoria já não inicializa as demais com preços do
modo clássico.

Leia os métodos, matriz completa, limitações e reprodução em
[`HISTORICAL_AUDIT_2026.md`](HISTORICAL_AUDIT_2026.md).
