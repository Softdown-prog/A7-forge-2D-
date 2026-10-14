# LHS — contrato de eventos com consequências encadeadas (14/10/2026)

## Regra de design

Uma carta não termina no clique do jogador. Cada decisão deve produzir efeito real na simulação, um retorno coerente com aquela escolha, novas alternativas e uma conclusão persistente. Não criar cartas que apenas cobram dinheiro e encerram o assunto.

## Pipeline implementado nesta versão

1. Carta inicial sorteada de maneira esporádica pelo agendador do LHS, sem ano ou dia fixo e sem interferir no RNG dos clientes.
2. Três escolhas iniciais por história: custos e efeitos reais em caixa, reputação, demanda, desgaste, estoque ou disponibilidade de internet.
3. Registro único da escolha no estado do jogo; uma história sorteada não volta, mesmo se cartas antigas forem compactadas.
4. De 2 a 5 dias depois, uma nova carta conta as consequências específicas da escolha feita, inclusive omissões.
5. O retorno tem duas opções com resultados distintos: reforçar, manter, corrigir ou insistir, conforme o que o jogador fez primeiro.
6. Alguns dias depois, uma carta de conclusão documenta o resultado e encerra a cadeia para sempre naquela campanha.
7. Estado, prazo e modificadores serializados em JSON compatível com saves antigos. Custos históricos de serviço são parâmetros fictícios indexados por ano.

## Doze histórias novas

- Goteira no salão: solução profissional, paliativo ou omissão; risco de desgaste
- Vizinhos reclamando de barulho: isolamento, regras ou ignorar; segunda reclamação e redução real de procura
- Teclado danificado: substituição, reparo ou adiar/cobrar; consequências na estação
- Malware: suporte técnico, restauração ou omissão; travamentos e indisponibilidade
- Diferença no estoque: auditoria, contagem ou omissão; perdas e desabastecimento
- Conta de energia inesperada: revisão, contestação ou aceitar; pressão no caixa
- Fornecedor atrasado: emergência, negociação ou espera; mercadorias e satisfação
- Cliente perdeu trabalho: compensação, crédito de sessão ou recusa; confiança
- Rede local instável: técnico, reconfiguração ou ignorar; perda de atendimento
- Jornal do bairro: investir, conceder entrevista ou recusar; oportunidade sem punição por recusa
- Dados pessoais esquecidos: profissional, limpeza assistida ou omissão; reputação e confiança
- Ação comunitária: ceder horas, dar desconto ou recusar; relações no bairro sem cobrança obrigatória

## Efeitos e persistência

- Multiplicadores de visitantes têm prazo e influenciam visitorArrivalChance, sem inventar receitas.
- Alterações de desgaste afetam pcWear e a manutenção real existente.
- Faltas e reposições alteram inventário, sem estoque negativo.
- Incidentes de rede alteram offlineUntil, afetando o atendimento existente.
- Valores em caixa, despesas e reputação ficam coerentes com a escolha.
- Repetir clique não debita novamente; arquivo importado com flags ou multiplicadores inválidos é rejeitado.
- Nada aqui acessa Google Cloud, Cookies premium ou backend. Jogo continua offline.

## Contrato para futuras cartas

Toda alternativa deve ter efeito concreto e um retorno, inclusive as opções gratuitas e as de ignorar. O retorno não pode repetir o mesmo texto para escolhas distintas. Recusar divulgação ou uma ação comunitária não deve ser tratado como infração. Nenhum evento esporádico volta depois de resolvido na mesma partida. Criar testes de cada ramo, save/importação, falta de caixa, efeitos prolongados e idempotência.

Nesta implementação, as 12 histórias novas recebem o ciclo completo. Também foram incluídas as quatro propostas legadas (fornecedor, escola, campeonato e manutenção), preservando o efeito imediato original de cada escolha e agora acrescentando retorno e conclusão. São 16 cadeias de decisões ao todo. A fiscalização dos Bombeiros conserva sua continuação própria por prazo, multa e regularização.
