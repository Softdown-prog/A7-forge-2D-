# Jogos avançados que exigem GPU — 2005 em diante

Lan House Simulator · especificação de progressão pós-2005

## Objetivo

A GPU **não deve ser julgada só pelo ROI de 2005/2012**: o conteúdo
do jogo continua sendo desenvolvido. A partir de 2005 surge uma nova
categoria de jogos fictícios que **não podem ser licenciados antes de
existir uma máquina com GPU adequada e Windows licenciado**.

O catálogo geral de R$ 450, as licenças Windows individuais e as regras
anteriores a 2005 continuam funcionando sem alteração.

## Títulos fictícios de demonstração

| Jogo | Lançamento | Licença de estabelecimento | GPU mínima | Windows mínimo | Adicional máximo |
|---|---:|---:|---|---|---:|
| Neon Rush Online | 2005 | R$ 580 | PixelForce 6600 | Windows XP | R$ 0,75/h |
| Circuito Competitivo | 2009 | R$ 950 | PixelForce 260 | Windows 7 | R$ 1,25/h |
| Arena do Futuro | 2013 | R$ 1.550 | PixelForce 770 | Windows 7 | R$ 1,75/h |

Nomes, títulos, preços, requisitos e bonificações são hipóteses de
**game design**, não o uso de jogos comerciais ou suas marcas.

A licença avançada é paga **uma única vez pela lan house**, mas não
habilita a execução automaticamente em máquinas inadequadas.
Para licenciar, o jogador precisa de:
- modo histórico, data de lançamento alcançada e contrato básico
  de jogos já regularizado;
- caixa suficiente;
- **ao menos um PC** com GPU igual ou superior, Windows instalado e
  **licença individual do Windows paga**.

Uma instalação de jogo pode habilitar dois ou mais PCs, desde que
cada um continue atendendo seus requisitos de hardware. Se a máquina
deixar de ser compatível, a licença permanece como propriedade do
estabelecimento, mas **não permite cobrança premium** até restaurar a
compatibilidade. Comprar o mesmo título novamente não cobra de novo.

## Funcionamento dos clientes e da tarifa

A partir de 2005, aproximadamente um quarto dos visitantes
(determinados pelo ID, sem sorteio extra) procura jogos avançados.
Eles escolhem **primeiro uma estação disponível e alcançável**
na qual exista um título avançado licenciado que rode de fato.
Se nenhuma estiver disponível, utilizam o atendimento normal
sem adicional, como antes.

A estação sem GPU ou Windows não tem direito ao bônus. A estação
compatível pode cobrar apenas quando o cliente procura jogos
avançados. É uma **tarifa local de sessão**, não um aumento do
preço global de todos os computadores.

O valor aplicado é:

```
taxa_gpu_pc = min(teto_nominal_anual, tarifa_base + maior_bonus_de_jogo_compativel)
sessao = round_centavos(taxa_gpu_pc * minutos_da_sessao / 60)
```

**Não somar bônus** de diferentes jogos para criar pagamento
ilimitado. O máximo por hora continua obedecendo ao
**teto anual do modo histórico**, inclusive depois de 2005.
Se a tarifa base já estiver no teto, o adicional efetivo será zero
até que as condições econômicas mudem.

As receitas são lançadas no caixa e no livro da estação
`stationLedger` já existente. Não há descontos secretos nem
receitas geradas sem cliente. O custo de licenciamento entra
integralmente em `expenses` quando o jogador compra a licença.
Saves antigos que não possuem `licensedGpuGames` continuam
válidos e sem contratos avançados.

## Interface

No painel **Windows / Licenças**, os títulos aparecem a partir
de 2005, com requisitos de GPU/Windows, PCs compatíveis,
valor da licença, explicação do bloqueio e taxa local estimada.
O botão só permite comprar quando a cotação do motor autoriza;
a cotação e a compra compartilham a mesma regra.

## Escopo e passos seguintes

Este é o primeiro mecanismo funcional — não um catálogo final
de dezenas de jogos. Ainda faltam novas GPUs após 2013, requisitos
de hardware mais granulares, diversidade de perfis gamer, demanda
por título, instalação individual e preço ajustável por estação.

**Não recalibrar GPUs com base no ROI anterior**: aqueles estudos
medem períodos que **não possuíam jogos GPU obrigatórios**
e não permitem prever o retorno em 2005+. O próximo estudo
financeiro deve comparar 2005/2009/2013 com e sem jogo licenciado,
GPU em apenas um PC versus vários, custo das licenças,
reputação, ocupação e receita adicional efetivamente paga.

Testes de regressão: `tests/gpu-games-2005.test.mjs`.

## Correio histórico de 2005: publicidade condicionada à oferta real

As decisões de divulgação e pesquisa podem ser tomadas antes da compra de GPUs,
mas **somente produzem o bônus temporário de procura** se houver pelo menos um
jogo avançado licenciado, lançado e utilizável em algum PC com GPU e Windows
licenciado adequados. Investir antecipadamente pode melhorar a reputação,
mas não gera automaticamente clientes por serviços que ainda não são oferecidos.
O acompanhamento gratuito de uma pesquisa não provoca desgaste, penalidade de
procura ou reputação. A compatibilidade é recalculada na decisão; não é gravada
como uma flag nova no save. O mecanismo normal de cobrança por sessão segue
inalterado.
O texto de conclusão também diferencia a pesquisa/espera sem novos prejuízos de
um plano de divulgação efetivamente concluído; não afirma perdas genéricas para
quem escolheu não investir.

## Preferências por título (primeira etapa)

A partir de 2005, cerca de um quarto dos visitantes deseja um jogo GPU
específico, escolhido deterministicamente pelo ID do cliente entre os
títulos **já lançados** no ano. Em 2005 apenas Neon Rush; a partir de 2009,
há procura tanto por Neon Rush quanto por Circuito Competitivo; em 2013
a procura se distribui pelos três títulos. A preferência independe de
quais jogos a lan house comprou e não consome números aleatórios adicionais.

O visitante procura primeiro um computador alcançável, ligado, livre e
capaz de executar **o jogo desejado com licença**, não apenas qualquer
jogo GPU. Sem estação disponível para esse título, continua usando
o atendimento normal: paga a tarifa básica, sem cobrar pelo jogo de
outro cliente. A regra vale inclusive quando uma máquina tem diversos
títulos; o bônus vem do jogo procurado, respeitando o teto anual.

A preferência viaja no salvamento do cliente ativo, para não mudar após
recarregar. Saves anteriores com `gpuGamer` mas sem `preferredGpuGame`
continuam usando a seleção e o adicional antigos até que esse cliente
encerre sua sessão. O catálogo, as licenças por estabelecimento, as
relações de hardware e o RNG original permanecem intactos. Esta etapa
não cria tela extra, compra obrigatória ou receita sem atendimento.

## Medição da procura por jogo GPU

Na aba **Windows / Licenças**, cada título avançado exibe pedidos de
clientes que realmente entraram, sessões atendidas com o título desejado,
sessões comuns e pedidos ainda sem sessão concluída. Essa última diferença
inclui visitantes ainda na fila e visitantes que desistiram; não representa
automaticamente vendas perdidas. A medição inclui apenas o adicional
efetivamente recebido, sem atribuir artificialmente todo o preço da sessão
ao jogo.

Os contadores são opcionais no save e acumulam a partir desta versão.
Não se reconstrói o passado de um save antigo. Visitantes importados que
já estão na fila com título identificado têm seu pedido conciliado na
hora do atendimento. A medição não modifica caixa, RNG, circulação,
limites de preço nem licenças.

## Cobertura do custo nominal da licença (não é lucro)

O painel compara **somente o adicional em sessões reais** do título
com seu custo de licenciamento em reais, sem incluir a tarifa comum.
Exemplo: R$ 100 em adicionais de um jogo de R$ 580 representam
17,2% de cobertura nominal e ainda faltam R$ 480. Mesmo quando
atingir 100%, isso **não significa que houve lucro**: o cálculo
não desconta placa de vídeo, Windows, plataforma, energia, funcionários,
manutenção, aluguel ou outros investimentos. Ele tampouco assume que
a procura ainda pendente seria atendida ou que todos os jogadores
teriam comprado uma sessão premium.

A métrica é parcial e começa a valer com a coleta de procura;
saves antigos não podem reconstruir adicionais anteriores à medição.
O cartão também exibe a tarifa de **seu próprio jogo**, e não o
adicional máximo de outro título licenciado na mesma estação.

## Auditoria de 90 dias por campanha

O teste `npm run audit:gpu-licenses` compara os anos de 2005, 2009 e
2013, sementes 23 e 137, e um ou dois PCs equipados. Para cada cenário
são executados dois braços de 90 dias, com **hardware e Windows iguais**;
um compra apenas a licença do título e outro não. A simulação real
registra receita, despesa total, saldo, ocupação observada, pedidos,
sessões pagas e adicionais. Visitas de reparo, reposição de estoque e
limpeza continuam usando as APIs econômicas do jogo, sem inventar vendas.

A diferença entre braços não deve ser interpretada como retorno causal
isolado sem ressalvas: filas, ocupação e satisfação podem mudar depois
da licença. Os dados são um diagnóstico de balanceamento, não autorização
para alterar preços automaticamente. O teste padrão `npm test`
executa versão curta de 8 dias; o workflow executa também a auditoria
completa de 90 dias.

## Importação monetária nas campanhas longas

A importação do modo histórico aceita resíduos de ponto flutuante inferiores
a **0,0001 centavo** em saldos e tarifas. Em 90 dias, milhares de operações
podem resultar internamente em `94492.13000001055`, equivalente a
R$ 94.492,13. Essa diferença é insignificante e não deve invalidar o save.
Frações de centavo materiais continuam bloqueadas. Nenhuma taxa, despesa
ou venda é alterada por esta correção.
