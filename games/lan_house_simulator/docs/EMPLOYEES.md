# Funcionários contratados: faxineiro e técnico

## Regras do LHS
- O jogador contrata ou dispensa cada funcionário em **Administração → Serviços**. Não existe adiantamento de salário.
- **Contrato mensal com diária apenas por dia efetivamente trabalhado**. Contratar não gera salário antecipado; a primeira diária surge quando o funcionário é despachado para uma ocorrência. Sem limpeza/reparo, não há diária. Dispensa e recontratação no mesmo dia nunca duplicam a cobrança de um dia de serviço.
- As diárias por dias de serviço se acumulam na folha e são pagas uma vez no fechamento de cada mês de 30 dias. Um chamado que atravessa a virada contabiliza um dia em cada ciclo; a diária do novo mês entra *depois* da cobrança do mês encerrado.
- Custos fictícios para balanceamento em 1998: **faxineiro R$ 7/dia trabalhado** (R$ 210 se trabalhar os 30 dias) e **técnico R$ 11/dia trabalhado** (R$ 330 se trabalhar os 30 dias). Partidas históricas indexam os valores pelo índice de preços do próprio simulador; no modo clássico eles ficam fixos. Esses números não representam salários oficiais históricos.
- Faxineiro contratado entra automaticamente quando uma lixeira chega a **75%** ou quando há lixo no chão, limpa e sai.
- Técnico contratado atende automaticamente **PC quebrado (100% de desgaste) e sem cliente**, um de cada vez. A próxima visita começa quando ele já saiu.
- Serviços realizados pelos contratados não cobram visita avulsa. Para quem não contratou, os antigos chamados avulsos continuam disponíveis.
- Os mesmos personagens, rotas, animações e tempos de serviço são reutilizados. O jogador não precisa contratar para progredir.

## Integração TypeScript
`src/sim/staff.ts`: contratação/dispensa, salários, último dia remunerado e validação.
`src/sim/services.ts`: detecta trabalho necessário e despacha os profissionais existentes, evitando visitas duplicadas.
`src/sim/engine.ts`: computa um dia extra para visitas ainda ativas ao virar a data, paga a folha no fechamento e preserva o funcionamento do simulador.
`src/sim/economy.ts`: inclui os salários realmente acumulados em `monthlyBills()`.
`src/main.ts` e `index.html`: botões para contratar/dispensar, diárias, contagem de dias efetivamente trabalhados, folha e serviços avulsos.

Os campos são opcionais no `GameState` e em saves antigos. Testes: `tests/employee-contracts.test.mjs`. Ainda é necessário verificar as telas e os movimentos no navegador real em desktop e celular, além de balancear os salários em campanhas longas.


## Migração de partidas antigas (16/10/2026)
- O campo opcional `employeeWorkedDays` conta os dias de serviço do ciclo atual (separados para faxineiro e técnico). Ele começa ausente em saves antigos; o painel mostra os dias registrados a partir da atualização, não reconstrói histórico impossível.
- A antiga folha `employeePayrollAccrued`, ainda não quitada, permanece integralmente devida. Não há estorno automático nem duplicação de diária já lançada, graças ao `employeeLastAccruedDay` existente.
- Serviços novos recebem `coveredByContract` booleano opcional. Visitas iniciadas como avulsas não viram serviços remunerados pelo contrato se o jogador contratar alguém no meio da visita. Jobs anteriores à atualização sem essa marca continuam válidos e são tratados conforme o contrato ativo.
- Funcionários contratados continuam aparecendo automaticamente ao detectar trabalho. Chamadas manuais pelo jogador também geram diária somente se forem cobertas por contrato; visitas avulsas permanecem cobradas à parte.
- A cobrança mensal não altera os valores de aluguel, energia, custos dos reparos avulsos nem remuneração acumulada em outros sistemas. Testes Node e Chromium desktop/mobile cobrem dias ociosos, simultaneidade, virada de mês, saves legados, dispensas e contratação durante visita avulsa.


## Estados visuais do atendimento — Etapa 3
- **A caminho:** o profissional caminha pela rota real até a lixeira ou estação, com uma pequena identificação sobre a cabeça e status visível em Administração → Serviços.
- **Limpando / Reparando:** ao alcançar o destino, o log anuncia o início; a barra de progresso já existente acompanha a ação no cenário. A Administração apresenta também a porcentagem e, para o técnico, o número do computador atendido.
- **Saindo:** depois de completar o serviço, o profissional usa o caminho existente até a porta. O status informa a saída; o histórico anterior já confirma lixeira limpa ou PC reparado.
- Quando não há chamado, o painel distingue **contratado aguardando necessidade** de **sem contrato**. O progresso é ocultado nos períodos de deslocamento e ociosidade.
- Dois reparos avulsos coexistentes são resumidos sem assumir que há vários técnicos contratados. Serviços em execução têm prioridade sobre chegada/saída na informação consolidada.
- As identificações são sobrepostas no Canvas e os resumos são derivados das fases já salvas. Nenhum novo campo de save, gasto, teleporte, fila, trabalhador ou colisão foi acrescentado.
- Regressão: `tests/staff-presentation.test.mjs` exercita os estados reais, inclusive navegação, conclusão, saves e contabilidade; `scripts/verify_staff_phases.mjs` verifica tela desktop/414/360 px, snapshots Canvas e acessibilidade básica dos indicadores.


## Animação procedural durante o trabalho
- **Faxineiro**: braços articulados seguram a vassoura em dois pontos do cabo, com deslocamento lateral da cabeça de cerdas, sombra e indicação discreta da varredura. Os pés permanecem no piso, sem movimento de caminhada enquanto está limpando.
- **Técnico**: um braço firma o equipamento e a mão dominante oscila com uma pequena chave de fenda; a maleta de ferramentas continua no chão. A animação é mais curta e contida do que a varredura.
- O arquivo `src/render/workerMotion.ts` calcula, apenas a partir do tempo de renderização, a posição das mãos e da ferramenta. `src/render/actorArt.ts` desenha os braços sobre as mesmas coordenadas de trabalho e `src/render/scene.ts` desenha vassoura e chave. As quatro vistas respeitam o flip de perfil existente.
- Somente `job.phase==="working"` ativa as novas poses; para chegada e saída, o personagem continua com a animação de caminhada aprovada.
- Nenhuma receita de corpo, rosto, capacete, colisão, duração, demanda, RNG, salário ou save foi substituída. Os testes `tests/worker-motion.test.mjs` e `scripts/verify_worker_motion.mjs` verificam determinismo, amplitudes, quatro direções, quadros distintos, Canvas do jogo e vídeo `worker_actions.mp4` no artefato de gameplay.


## Proteção de visitas e circulação em salões divididos
- O cálculo de rota conecta **origem → primeiro ponto da grade → corredores → destino**, verificando todas as ligações contra as divisórias. A aproximação à grade não pode deslocar um funcionário para o outro lado de uma parede fechada.
- O técnico só aceita atendimento quando existe um caminho da porta até o ponto de reparo. Se não houver, a interface recebe uma mensagem orientando a abrir uma porta ou reorganizar o salão; nenhuma visita avulsa é cobrada, nem é criada diária contratual.
- O faxineiro prioriza a lixeira mais cheia **entre as alcançáveis**. Se ambas estiverem inacessíveis, recusa o chamado antes do pagamento. Se uma lixeira alcançável foi esvaziada e a outra continua isolada, encerra a visita e deixa o lixo intacto, com aviso no histórico.
- A intervenção sobre geometria acontece antes de qualquer mutação de caixa, folha, RNG ou lista de serviços. Saves existentes mantêm a estrutura anterior; nenhuma migração foi necessária.
- Cobertura em `tests/services-accessibility.test.mjs` e `tests/worker-navigation.test.mjs`: isolamento de lixeira/PC, retorno da passagem, serviço parcial, dia contratado não cobrado sem rota e validação de cada segmento.


## Identificação visual dos destinos sem passagem
- **Administração → Serviços** consulta apenas locais que precisam de limpeza (lixeiras com pelo menos 10% de ocupação ou lixo no chão) ou computadores com desgaste passível de reparo e sem técnico já em atendimento.
- O diagnóstico `src/sim/serviceAccess.ts` consulta `workerRoute`, sem alterar caixa, RNG, funcionários ou saves. Só conta um bloqueio quando não há rota desde a entrada; não deduz uma parede específica pela linha reta entre os dois pontos.
- A relação de destinos inacessíveis aparece na aba Serviços. **Ver bloqueios no salão** fecha o painel administrativo e desenha os marcadores sobre cada computador/lixeira inacessível; **Fechar marcações** volta ao jogo. A câmera, zoom, movimentação e desenho original permanecem intactos.
- O cálculo das rotas é reaproveitado por cerca de 1,6 segundo, evitando busca de caminhos em toda atualização de desenho. Os marcadores são uma sobreposição de Canvas transitória, não um objeto salvo no mundo.
- Testes Node em `tests/service-access-review.test.mjs` cobrem destinos isolados, abertura de passagem, reparo, ausência de falsos alertas e integridade do save. Teste de navegador `scripts/verify_service_access.mjs` cobre visualização, abertura e fechamento, pixels do Canvas e layouts de 1280/414/360 px.


## Posição dos trabalhadores junto aos equipamentos (revisão de vídeo)
- O técnico usa `technicianWorkPoint()`, ao lado da cadeira no corredor, em vez de ficar sobre a mesa. A geometria gira com o computador; `technicianContactPoint()` mantém a área da estação que realmente será atendida.
- O faxineiro usa `cleanerWorkPoint()`, ao lado da lixeira e não no centro do recipiente. A simulação anda até a mesma âncora que o renderer usa: não há teleporte de personagem ao iniciar ou terminar uma animação.
- `canTraverseLocalStep()` verifica que o ponto onde o funcionário fica e a máquina/lixeira não estão separados por uma divisória fechada. O diagnóstico da aba Serviços reutiliza essas posições, preservando a recusa de chamados inacessíveis antes da cobrança.
- Enquanto ocorre o serviço, um contorno suave no destino e uma linha discreta conectam trabalhador e objeto: é gráfico, sem impacto na colisão ou economia.
- O workflow cria `staff_full_cycle.mp4` (entrada, serviço, saída e fim do chamado) e `service_blockages.mp4` (lixeira isolada, PC isolado, passagem livre), sem menu sobre a cena. Os dois arquivos ficam no artefato `lhs-real-gameplay-video`.
- Regressões: `tests/staff-worksites.test.mjs` e `scripts/record_staff_diagnostics.mjs` verificam quatro orientações de PC, acesso, âncoras de pés, conclusão real dos serviços e fases do ciclo no Chromium.

## Refinamento de contato das ferramentas (16/10/2026)
- A vassoura continua sincronizada com as mãos, e pequenos rastros curtos no piso da lixeira respondem à mesma senoide de `workerMotion("sweeping")`. Poeira discreta, sem partículas persistentes nem alteração da geometria.
- O técnico mantém o gesto da chave e ganha um reflexo metálico pequeno no contato do equipamento, sincronizado com `workerMotion("repairing")`, sem solda/raios chamativos.
- O efeito é calculado em `src/render/workEffects.ts` com a posição física real da lixeira ou PC, renderizado no `SceneRenderer` após o personagem. Não usa RNG nem altera tempo, cobrança, rota, funcionários ou saves.
- Nova suíte `tests/work-effects.test.mjs` verifica sincronia, ausência de flash permanente, determinismo e integridade do estado. `scripts/verify_worker_motion.mjs` agora captura `worker_contact_small_zoom.png` em sala ampliada, além das quatro direções e do vídeo.


## Próxima etapa de jogabilidade — evento de 2004
- Após o acabamento dos serviços dos funcionários, o correio recebe um acontecimento de 2004 relacionado à presença de alunos uniformizados durante as aulas. O assunto é tratado como **pedido da escola local**, não regra nacional.
- O evento usa `school-uniform-policy` no sistema de histórias já existente, com consequências, retorno e encerramento. Não interfere no caminho, salário ou renderização de funcionários.
- Testes `school-uniform-2004.test.mjs` e `verify_uniform_2004.mjs` cobrem calendário, economia, decisões, save e apresentação na caixa de correio do jogo.

## Passada ancorada ao deslocamento — faxineiro e técnico (21/10/2026)
- A animação de chegada/saída dos profissionais agora usa a mesma fase de passada por distância projetada no piso e a mesma direção isométrica de oito vistas dos clientes, conforme `walkCycle.ts` e `screenViewForMotion()`.
- `SceneMotion` mantém distância acumulada de cada reparo (por PC) e da limpeza somente na camada visual; interpolação e direção usam o deslocamento real, nunca o próximo waypoint.
- Funcionário parado mantém os pés parados. Varrer e reparar continuam com animações específicas de mãos e ferramentas; não há caminhada durante o serviço.
- Salários, duração, rotas, divisórias, posições, reservas e formato de save permanecem idênticos. Deslocamentos inválidos/teleporte não criam passadas.
- Testes em `tests/worker-motion.test.mjs` comparam deslocamento, distância, direção, animação parada, serviço, reinício do interpolador e ausência de dados visuais no save. A cena aplica `walkDistance`/`screenView` somente para os profissionais em deslocamento.
