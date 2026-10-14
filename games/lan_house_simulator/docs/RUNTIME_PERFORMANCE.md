# Fluidez do jogo — 14/10/2026

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
