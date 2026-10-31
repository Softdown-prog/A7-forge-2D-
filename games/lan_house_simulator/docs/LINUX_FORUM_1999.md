# Fórum Linux — revistas impressas (março–agosto de 1999) e máquinas novas (outubro)

## História e progressão

Tony recebe em março de 1999 a mensagem de um fórum fictício de entusiastas de Linux da cidade. O grupo indica uma banca também fictícia, **Banca da Praça Central**, e a assinatura da revista impressa **Informática Livre**. O personagem não conhece Linux ainda; ele aprende por leitura e prática durante meses, sem conhecimento instantâneo ou escolhas artificiais.

A assinatura custa **R$ 8 de adesão** mais **R$ 12 por exemplar entregue**, em valores de design do modo histórico (não são preços reais de uma revista histórica). O jogador ativa a assinatura explicitamente na Correspondência. Não há cobrança se não assinou, e uma revista nunca é cobrada duas vezes. Quando o caixa não tem R$ 12, a entrega fica pendente até haver dinheiro; as edições seguintes chegam com pelo menos 30 dias de separação. A revista não exige internet funcionando.

| Data do calendário do jogo | Edição | Assunto |
|---|---|---|
| 30 de março de 1999 — dia 450 | 1/6 | Software livre, distribuições e o que é Linux |
| 30 de abril — dia 480 | 2/6 | Processadores, memórias e hardware para programação |
| 30 de maio — dia 510 | 3/6 | Terminal, arquivos, diretórios e comandos |
| 30 de junho — dia 540 | 4/6 | Usuários, permissões e segurança |
| 30 de julho — dia 570 | 5/6 | Editores, compilação e ferramentas |
| 30 de agosto — dia 600 | 6/6 | Laboratório Linux, rede local e estações prontas |

**Setembro:** Tony continua estudando a coleção completa; a liberação não é antecipada, mesmo que tenha dinheiro suficiente.

**Outubro:** a partir do dia 631 (1º de outubro de 1999), e desde que seis revistas tenham sido entregues e tenha transcorrido ao menos um mês de estudo desde a última, o correio anuncia a conclusão e a loja libera máquinas Linux físicas.

A janela março–agosto vale para assinaturas feitas em março. Quem começa a missão depois (inclusive saves carregados em anos futuros) recebe os exemplares da coleção como material de arquivo em entregas mensais, e desbloqueia somente depois de completar os seis exemplares e o intervalo de estudo. Portanto, a missão não desaparece permanentemente para jogadores atrasados.

## Máquinas novas, não formatação de Windows

O catálogo oferece duas estações físicas distintas, já equipadas com Linux:
- **Bancada Linux 99 — R$ 440.** Mesa técnica, CRT, gabinete metálico e cadeira.
- **Estação Programador 99 — R$ 610.** Bancada reforçada, CRT grafite e gabinete diferente, com bônus de conforto.

Cada compra ocupa uma nova vaga física na área principal e custa dinheiro de verdade; são usados a fila, atendimento, iluminação, manutenção, desgaste e save existentes. O Windows dos computadores antigos não é substituído. O computador Linux novo não vem com Windows; adquirir Windows exige licença. Os desenhos são Canvas 2D procedural, inclusive as prévias da loja.

Clientes que procuram programação usam PCs Linux existentes, pagam por sessões reais e exibem terminal procedural, mesmo se a internet estiver indisponível. Não existe geração fictícia de receita apenas por assinar revistas.

## Critérios de validação antes da mesclagem

- E-mail de março com banca fictícia e proposta de assinatura.
- Adesão apenas sob confirmação, com caixa suficiente.
- Exatamente seis revistas, entregues mensalmente, preços deduzidos apenas uma vez e visualização no correio.
- Sem dinheiro, entrega pendente e sem aceleração da pesquisa.
- Nenhuma bancada Linux comprável em agosto ou setembro; liberação em outubro para assinantes de março sem atrasos.
- Saves antigos e novos importados sem corrupção, inclusive caixa e estado de assinatura.
- Dois modelos físicos com geometria procedural e compra de verdade; PS1/PS2 e Windows inalterados.
- Testes automatizados completos, CI e validação em navegador desktop e Android antes de mesclar PR #44.

**Não reintroduzir** a coleção rejeitada de 33 acontecimentos anuais do PR #40. Este é um acontecimento específico definido pelo criador.

## Carteiro procedural — entrega das seis revistas

Há agora um **NPC carteiro brasileiro fictício**, com camisa amarela, calça azul, bota preta, boné azul e bolsa lateral de couro, desenhado com o mesmo sistema de personagens Canvas 2D do LHS, sem sprites ou logotipos externos.

Nos dias **30 de março a agosto de 1999**, se a assinatura está ativa e há dinheiro para pagar o exemplar, um carteiro entra pela porta do salão, caminha por uma rota física que respeita as divisórias e os móveis, aproxima-se do balcão e faz um gesto de retirar a revista da bolsa e estendê-la ao Tony. Tony reage com gesto de receber. A entrega leva cinco minutos de simulação e só **ao fim desse encontro** registra a revista no correio e desconta R$ 12. Então o carteiro sai pela entrada. O serviço não ocupa uma vaga de cliente nem gera renda.

A visita e suas fases (`arriving`, `handing`, `leaving`) são persistidas no save. A caminhada é suavizada apenas na apresentação, sem usar RNG nem avançar a missão artificialmente. Se a caixa estiver insuficiente, a visita só é disparada após reunir dinheiro para a edição; a cobrança não é antecipada.

O carteiro foi desenvolvido como personagem independente dos dois funcionários contratados; seu tipo de entrega poderá ser reutilizado para outras encomendas futuramente.
