# Auditoria econômica histórica — 1998, 2005, 2012 e 2024

Data: 14/10/2026 · Lan House Simulator · Motor real do jogo

## Objetivo

Verificar se os **novos tetos anuais e a inflação por IPCA** produzem uma
lan house economicamente sustentável, levando em conta receitas reais,
reposição de produtos, reparos, limpeza, contas mensais, desgaste, PCs
completos, Windows e qualidade de atendimento. Não confundir inflação
brasileira oficial com preços históricos tabelados de lan houses.

O teto inicial de **R$ 3/h em 1998** e os custos-base dos serviços são
**hipóteses de balanceamento**, não registros históricos de preços.

## Como foi testado

`npm run audit:historical` executa um teste real de **16 campanhas de
120 dias**, em quatro anos de início (1998, 2005, 2012, 2024), com duas
sementes (23, 137) e duas estratégias por ano:

- 1998: tarifa de abertura R$ 2,50/h versus teto R$ 3,00/h, máquinas de
  1998 em ambos os casos.
- 2005: computadores e Windows de 1998 versus kits de plataforma 2005
  completos (CPU, placa-mãe, RAM, armazenamento, fonte), GPU 2005,
  LCD 2005 e Windows XP.
- 2012: base 1998 versus plataforma 2012, GPU 2011, LCD 2012 e Windows 7.
- 2024: base 1998 versus plataforma 2024, GPU 2013, LCD 2024 e Windows 11.

Os computadores custam dinheiro real via API do jogo, com licenças,
internet e contrato de atacado pagos. Todas as campanhas iniciam com
**três PCs**, sem promoção automática; estoque, técnico e faxineiro
são chamados conforme a operação. As partidas são salvas e restauradas
no dia 60. O relatório mede clientes atendidos, vendas, ocupação,
reputação, receita, despesas, margem operacional e resultado líquido.

**Controle de capital:** os 16 cenários foram dotados, *apenas na preparação
experimental*, com `round(R$ 18.000 × índice de inflação do ano)`.
Isto garante verba para comparar máquinas caras sem interferência
de financiamento e **não representa o caixa inicial do jogador**.
Nenhuma receita, visitante ou subsídio é criada durante as campanhas.

Separadamente, **duas campanhas de sobrevivência real** começaram com
os **R$ 850 efetivos de 1998**, sem novo aporte de dinheiro. Pagaram
licenciamento de jogos, programação do filtro de conteúdo, três
licenças Windows 98 e, quando o caixa permitiu, contrato de fornecedor.
Repondo estoque e contratando técnico/limpeza quando necessário.

## Diagnóstico: os serviços causavam o principal prejuízo de 1998

Antes da correção, em uma única campanha de 120 dias a R$ 2,50/h,
com 2.319 clientes, as despesas incluíam:

| Categoria de despesa | Antes da correção | Depois |
|---|---:|---:|
| Técnico (máquinas antigas) | R$ 4.854,00 | R$ 1.067,54 |
| Faxineiro | R$ 3.245,00 | R$ 708,00 |
| Estoque | R$ 1.695,20 | R$ 1.695,20 |
| Contas mensais / cobranças do motor | R$ 2.618,00 | R$ 2.618,00 |

A frequência de serviços e desgaste já era a mesma; o valor nominal
estava preso à economia clássica, mesmo com a hora limitada a R$ 3.
**Não alteramos geração de clientes, probabilidades nem prêmios.**

O cálculo agora usa custos de serviço de **design para 1998**:
faxineiro = R$ 12 por visita; técnico = R$ 4 + R$ 0,16 por ponto de
desgaste. Ambos são indexados por IPCA até o ano da partida, cobrados
pelas APIs reais e registrados em despesas. O custo clássico
(faxineiro R$ 55; técnico R$ 20 + teto de 70% do desgaste)
permanece **intacto nos saves clássicos**.

Assim, em 2024, o custo das visitas volta a ficar próximo dos valores
nominais usados originalmente; o balanceamento não cria um subsídio
permanente para os anos modernos.

## Resultados após correção

Valores médios de **duas sementes**, em reais nominais do ano da
campanha. `Saldo 120d` inclui compra de equipamentos e licenças;
`Operação 120d` exclui despesas de instalação inicial (mas inclui
contas, energia, serviços e reposição de estoque).

| Ano | Estratégia | Hora | Saldo 120d | Operação 120d |
|---|---|---:|---:|---:|
| 1998 | Preço inicial | R$ 2,50 | **+R$ 2.141,47** | +R$ 3.451,47 |
| 1998 | Teto nominal | R$ 3,00 | **+R$ 3.036,44** | +R$ 4.346,43 |
| 2005 | PCs antigos | R$ 3,50 | **+R$ 2.116,92** | +R$ 3.676,92 |
| 2005 | Kit 2005 completo | R$ 5,00 | −R$ 999,18 | +R$ 7.100,82 |
| 2012 | PCs antigos | R$ 2,75 | −R$ 2.198,18 | −R$ 138,18 |
| 2012 | Kit 2012 completo | R$ 7,00 | −R$ 9.200,18 | +R$ 8.819,82 |
| 2024 | PCs antigos | R$ 5,50 | −R$ 5.130,15 | −R$ 3.070,15 |
| 2024 | Kit 2024 completo | R$ 14,00 | −R$ 17.635,37 | +R$ 12.804,63 |

**Leitura correta:** a modernização melhora a margem operacional
sob essas condições, mas kits de 2012 e 2024 não recuperam seu
investimento em 120 dias. Isso não implica que nunca se pagarão;
campanhas de 360+ dias são necessárias. Computadores de 1998 em
2012–2024 ficam cada vez menos sustentáveis.

### Abertura verdadeira com R$ 850

| Semente | Caixa inicial | Caixa após 30 dias | Caixa após 120 dias | Ganho líquido |
|---|---:|---:|---:|---:|
| 23 | R$ 850,00 | R$ 434,94 | R$ 2.916,96 | **+R$ 2.066,96** |
| 137 | R$ 850,00 | R$ 404,12 | R$ 2.980,97 | **+R$ 2.130,97** |

As menores disponibilidades de caixa medidas foram R$ 157,55 e
R$ 124,77. Em ambas, as três licenças do Windows 98 e o contrato de
fornecedor foram pagos com o próprio fluxo da loja. O **primeiro
mês é o mais apertado**; não adiantar as expansões é importante.

## Correção paralela no varejo

A configuração de um preço manual de produto no modo histórico
antes criava a tabela restante com preços clássicos `8/5/9`
(refrigerante, doce, salgado), permitindo uma inflação implícita
acidental dos outros itens em 1998. A primeira configuração agora
parte dos preços **reais do jogo para o ano corrente**, preservando
os outros itens, inclusive no save importado. Modo clássico mantém
seus valores anteriores.

## Como repetir

- `npm test`: teste curto, validadores e todas as regressões normais.
- `npm run audit:historical`: duas sementes, 16 cenários controlados
  de 120 dias e duas aberturas de R$ 850; produz
  `LHS_HISTORICAL_CAMPAIGN`, `LHS_HISTORICAL_SUMMARY` e
  `LHS_HISTORICAL_STARTUP` no log.
- Workflow GitHub Actions **Lan House historical campaign audit**:
  execução manual sob demanda, para não rodar cerca de
  1,5 milhão de minutos simulados a cada modificação gráfica.

## Limites da conclusão

O estudo não representa cotações reais de equipamentos ou serviços
e não mede lucro contábil com depreciação, impostos e folha salarial.
As 16 campanhas usam capital inicial de laboratório; apenas os dois
testes de abertura usam R$ 850 sem capital extra. Não há desconto por
sessões longas, financiamento de hardware nem cenário com flutuação
de demanda externa. São apenas duas sementes por cenário e 120 dias.

**Próxima etapa:** campanhas de 360–720 dias com mudanças de ano,
amortização por peça, avaliação de compras graduais, decisões de
preço mensal, orçamento real de expansão e validação de procura com
salões maiores; somente depois alterar o balanceamento geral.
