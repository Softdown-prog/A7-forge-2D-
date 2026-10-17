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
