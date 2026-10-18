# Fluidez do jogo — 14/10/2026

## Clientes presos no corredor junto à lixeira — 18/10/2026

O bloqueio da soleira não era o único ponto de retenção. Os lugares de espera das máquinas podiam ocupar o corredor `y=4.48`, formando uma barreira contínua de corpos entre os PCs e a saída, junto à lixeira frontal. Uma busca em grade de 0,5 tile também podia não enxergar passagens estreitas reais. Depois de um desvio, o cliente continuava seguindo todos os pontos antigos mesmo quando o corredor já havia aberto.

Os lugares de espera agora preservam uma faixa livre no corredor e na aproximação da porta. Filas retomadas de saves antigos recalculam os destinos existentes e caminham até os novos lugares, sem reposicionar personagens. A navegação usa a grade de 0,25 tile apenas se a busca normal falhar; segmentos diretos passam pelas mesmas verificações de corpos, móveis e paredes. Quem está saindo reavalia desvios longos a cada quatro minutos, adotando um caminho novo somente quando ele for pelo menos 0,5 tile mais curto.

Dois snapshots gerados pelo simulador reproduzem o problema sem acessar contas reais. No caso da lixeira (seed 13, minuto 417), a saída do cliente 22 levava mais 70 minutos no código publicado e passa a terminar em 21. No cruzamento com a compra de lanche (seed 44, minuto 533), quatro compradores permaneciam presos até o fechamento; os quatro agora concluem as compras e saem até o minuto 591, antes do fechamento no minuto 660. São minutos do jogo, não tempos de carregamento ou benchmarks de telefone.

`tests/exit-circulation.test.mjs` verifica a recuperação, separação física, limites por passo, saída pela porta, contabilidade e save/reload determinístico. `verify_doorway_recovery.mjs out/corridor --corridor` observa a aplicação real em desktop e toque móvel a 160%; o workflow do Pages executa esse caso antes de publicar.

## Fila parada com computadores livres — 18/10/2026

Uma campanha histórica gerada com seed 51 reproduziu um bloqueio na entrada, no minuto 372. Um visitante recém-chegado ocupava o centro da soleira; onze visitantes tentavam sair. A separação mínima entre corpos (0,43 tile) impedia as saídas de atingir o raio da porta (0,32). O recém-chegado também estava cercado. Após mais 240 minutos, as mesmas pessoas continuavam paradas e o total de atendimentos não avançava.

Quando um visitante realmente não consegue dar um passo perto do centro da entrada e há alguém saindo, ele busca um pequeno refúgio lateral. A rota usa uma grade de 0,25 tile, pois a grade normal de 0,5 não alcança o espaço junto à borda. Cada passo continua respeitando paredes e corpos. Depois de liberar as saídas, o visitante retoma sua posição por ordem de chegada. O comportamento só intervém quando o deslocamento normal está bloqueado; a admissão, o RNG e os preços mantêm suas regras.

Saves existentes são recuperados pelo próprio motor. A espera lateral também é persistida para permitir salvar/recarregar durante a manobra. Não remover clientes presos, ampliar o raio da saída, cobrar antecipadamente ou alterar o saldo para liberar circulação.

`tests/doorway-recovery.test.mjs` reproduz as posições do bloqueio, confere recuperação até o PC, saída pela soleira, separação, paredes, contabilidade e save/reload determinístico. `scripts/verify_doorway_recovery.mjs` carrega a mesma fixture em contextos isolados Chromium desktop e toque móvel e observa o RAF real até a retomada, sem reposicionar personagens ou acelerar o relógio. O workflow de publicação executa essa verificação antes de sincronizar o Pages.

O Canvas desenhava a 60 FPS no desktop, mas as posições só mudavam a cada minuto da simulação: quatro vezes por segundo. Isso produzia saltos de aproximadamente 250 ms. A interface também reconstruía listas de painéis fechados a cada 450 ms; piso, paredes externas e decoração fixa eram desenhados em todos os frames.

## Mudanças integradas

- `SceneMotion` apresenta posições e poses intermediárias de clientes, técnicos e faxineiro. Captura o estado anterior ao minuto e cria uma cópia somente para o desenho, sem escrever coordenadas visuais no save. A campanha continua a quatro minutos por segundo, com as mesmas rotas, reservas, pagamentos e RNG.
- Sentar/levantar conserva o computador durante a apresentação. Novas chegadas começam na soleira; atores removidos não deixam fantasmas. Saltos grandes e linhas que atravessariam divisórias não são interpolados. Menu e modos de construção limpam o histórico.
- Catálogo, cartas e listas administrativas são montados quando seu painel/aba está aberto. Abrir ou trocar uma aba atualiza seu conteúdo imediatamente. O diário só reconstrói entradas quando elas mudam.
- Um bitmap local guarda o fundo estático. Expansão, câmera, tamanho do Canvas e compra/realocação de pôster invalidam o cache. Atores, computadores, sombras e objetos com ordenação de profundidade continuam dinâmicos; resolução e arte foram preservadas.

## Medições

Chromium headless, mesma fixture de circulação com salas divididas, 12 segundos por caso após aquecimento de 12 minutos do motor. Comparação local com a versão anterior a esta mudança. O caso móvel usa viewport 414 × 920 e CPU limitada em 4× via CDP: **não representa um telefone físico nem garante esses FPS em todos os aparelhos**.

| Medida | Desktop antes | Desktop depois | CPU limitada antes | CPU limitada depois |
| --- | ---: | ---: | ---: | ---: |
| FPS médio | 60,0 | 60,0 | 20,6 | 36,2 |
| Intervalo de frame P95 | 16,7 ms | 16,7 ms | 66,8 ms | 33,4 ms |
| Tempo médio de desenho | 1,36 ms | 1,25 ms | 6,80 ms | 5,74 ms |
| Mudanças de posição por segundo em movimento | 4,1 | 58,1 | 3,7 | 36,2 |
| Nós DOM adicionados por segundo | 374,2 | 79,1 | 359,3 | 82,0 |
| Tarefas longas ≥ 50 ms | 0 | 0 | 68 | 1 |

No caso limitado, houve aproximadamente 76% mais frames e 77% menos criação de nós. Números variam com hardware, carga e tamanho do salão. A interpolação introduz até um minuto de jogo (250 ms reais) de atraso visual para apresentar o trajeto concluído, sem atrasar pagamentos ou decisões. Desvios em quinas que não admitem uma linha segura ainda podem ter transição direta.

## Reprodução e regressões

```sh
npm test
npm run audit
node scripts/verify_rendering.mjs out/performance
node scripts/profile_runtime.mjs out/performance current
node scripts/capture_identity.mjs out/identity
node scripts/capture_circulation.mjs out/fluency
```

O perfil registra frames, desenho, posições apresentadas, DOM e tarefas longas em JSON. Sua instrumentação não entra na produção e não impõe limites de FPS frágeis no CI.

A comparação entre desenho com cache e original inclui repetição, expansão paga, compra/realocação real de pôster e compra de planta. Os seis casos tiveram **zero pixels alterados e delta máximo de canal zero**. A verificação roda no worker de cena do CI.

Sete testes novos cobrem posições intermediárias, ausência de mutação, assentos, soleira, reset/remoção, paredes/saltos, funcionários e campanha determinística com 60 apresentações por minuto. Os **160 testes** da versão conjunta passaram. A inspeção Chromium cobre abas, compras, cartas, saves, teclado e três tamanhos de tela; a gravação de circulação usa o RAF da aplicação real, sem reposicionar personagens durante o vídeo.


## Revisão de rolagem e circulação — 14/10/2026

- Corrigido o ramo de desenho que mantinha a prévia do menu ativa com a partida em execução. Não desenhar cena coberta pelos painéis, fora da tela ou enquanto se desloca a página; relógio e serviços continuam funcionando. Efeitos visuais expiram mesmo quando não são pintados.
- Painéis usam revisões do estado relevante: não reconstruir botões e catálogos em atualizações sem mudança. Durante toque/rolagem, aguardar o término do gesto para a atualização periódica; compras e escolhas explícitas continuam atualizando imediatamente. Não criar ícones repetidos no relógio/tempo. Retirado filtro de desfoque do fundo modal.
- Compras têm atendimento por ordem e lugares de espera separados por produto. O acesso à prateleira fica fora da coluna do caixa. A busca de lugares é guardada por layout; expansões, móveis e divisórias invalidam esse resultado. Filas retomadas recalculam destinos após mover equipamentos.
- Saída aceita a travessia da área da soleira (raio 0,32; menor que a separação dos corpos de 0,43), sem exigir convergência de todos ao mesmo ponto exato. Não altera pagamentos nem teletransporta clientes pelo salão.
- Desvios de multidão respeitam intervalo de quatro minutos de jogo por pessoa, preservado no save. Retângulos de equipamentos são calculados uma vez por busca, sem recriar cantos em cada ponto examinado.

Na medição de administração com Chromium e CPU limitada a 4×, em dois segundos, nós adicionados passaram de **380 para 24**, desenhos do menu oculto de **26 para zero**, e tarefas longas de **5 para zero**. O botão observado foi substituído na base e preservado após a correção. Este caso não garante desempenho em telefone físico.

O perfil de 12 segundos da cena com divisórias registrou desktop 60 FPS nas duas versões e emulação móvel 27 → 29,6 FPS, com nós adicionados por segundo 99,2 → 10,4. Ainda houve tarefas longas nesse cenário pesado; não declarar eliminação de todo travamento nem usar estes FPS como requisito rígido do CI. Tempos de desenho do relatório antigo misturavam cena e menu oculto e não são comparáveis diretamente.

`tests/customer-congestion.test.mjs` reproduz oito pessoas na saída/prateleira/máquinas: concluem o fluxo antes da virada diária, mantendo separação física e contabilidade. Cobre também save/reload seguido de mudança da máquina.

`node scripts/verify_mobile_interface.mjs out/mobile-interface` verifica controle preservado, rolagem nativa do painel, troca de peças por toque e ausência de desenho do menu oculto em 1280/414/360. O teste de áudio usa uma venda real, desbloqueio por toque, decodificação dos dois OGG e reprodução via Web Audio. Som de refrigerante continua ocasional: 28% por venda, intervalo de 12 segundos e gravações existentes, sem reativar a lata reprovada. O sorteio só é fixado dentro do teste.
