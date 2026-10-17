# Calendário e correio do LHS — 1998 a 2030

## Regras aprovadas

- O jogo começa em **1998** e termina no último minuto jogável de **2030**, com 360 dias por ano (12 meses de 30 dias). Não há avanço para 2031. Ao encerrar, o cenário fica disponível para visualização, mas tempo, renda, despesas e RNG deixam de avançar.
- As **oito cartas atualmente esporádicas** são: proteção de menores, licenças de Windows, direitos dos jogos, fornecedor, reserva escolar, campeonato, manutenção preventiva e inspeção elétrica dos Bombeiros.
- As doze histórias do pipeline de consequências ocupam os maiores intervalos livres entre essas oito cartas. As vinte cartas iniciais ficam separadas por pelo menos 360 dias. Retornos e conclusões continuam próximos das escolhas que os provocaram; não são eventos novos. Migrações perto de 2030 omitem histórias que não cabem, sem concentrá-las no fim.
- Cada nova partida sorteia **a ordem, o ano e o dia** de cada carta dentro de janelas distribuídas ao longo dos 33 anos. A distância planejada entre cartas é de pelo menos 360 dias; elas nunca são todas enviadas no começo da campanha.
- O sorteio usa semente própria, guardada no save, e **nunca altera o RNG dos clientes**. Cartas são únicas, com IDs rastreados mesmo após excluir ou compactar mensagens.
- Uma carta dependente do estado (manutenção, quantidade de computadores ou necessidade de licença) só aparece se ainda fizer sentido. Se perder sua janela por já estar resolvida ou por requisitos ausentes, não gera avalanche retroativa.
- A verificação de licenças e direitos autorais possui **sete dias após o aviso** para regularizar. Multas são únicas e só acontecem após a carta, nunca em dias 10 e 12 de 1998. Foi removida a antiga multa aleatória diária de direitos autorais sem aviso.
- O sistema é compatível com salvamentos anteriores: quando não há planejamento persistido, a distribuição começa no dia atual da partida, sem lançar retroativamente todas as cartas pendentes. Cartas existentes são reconhecidas como já entregues.
- Eventos históricos futuros podem ser declarados com **ano exato**: `fixedYearMailDue(state, year, dayOfYear)` somente retorna verdadeiro naquele ano e dia, entre 1998 e 2030. Esse caminho é separado do planejamento esporádico.
- A importação aceita partidas legadas posteriores a 2030, mas posiciona seu relógio no último minuto jogável de 2030, preservando o caixa e os bens.

## Implementação

- `src/sim/mailCalendar.ts`: ano máximo, planejamento e regras de eventos com ano fixo.
- `src/sim/notices.ts`: distribuição dos avisos normativos e multas relativas.
- `src/sim/decisions.ts`: sorteio esporádico das propostas e da inspeção elétrica.
- `src/sim/engine.ts` e `src/main.ts`: limite da simulação, interface e logs.
- `src/sim/types.ts` e `src/sim/saveTransfer.ts`: persistência e migração do calendário.
- `tests/mail-calendar.test.mjs`: várias sementes, distribuição entre anos, saves antigos, multas, idempotência e encerramento em 2030.

O calendário é determinístico por partida; **esporádico** não significa repetição diária nem uma obrigação de preencher todos os anos com correspondência.


## Notificação sonora de correio
O correio utiliza o efeito autoral tratado `mail_notification_01.ogg`, selecionado entre 8 batidas gravadas pelo criador. A interface observa novos IDs de mensagens, independentemente do fluxo de entrega (avisos, decisões, histórias, relatórios). Uma mensagem nova dispara um toque curto. Um item já conhecido, reabertura do correio, leitura, mudança de lida para não lida e retomada de save não emitem som. Os IDs são controlados só na UI, sem alterar economia ou RNG do jogo.

## Cartas históricas integradas
- **2004, dias 121–150:** estudantes de uniforme no horário de aula, com consequências por escolha e retorno.
- **2005, dias 61–90:** novos jogos que exigem GPU e Windows compatíveis, com alternativas de preparação, pesquisa ou adiamento. É um aviso narrativo; não compra equipamentos nem libera licenças. Nenhuma destas duas cartas entra no sorteio das doze histórias esporádicas.
- Cada carta histórica tem registro único por save e não reaparece em outro ano, mesmo após limpeza das mensagens.
