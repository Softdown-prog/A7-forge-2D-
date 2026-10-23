# Benchmark de capacidade — LHS

O jogo de produção continua admitindo no máximo **14 clientes simultâneos**.
Este benchmark **não muda gameplay, saves, economia, limite de NPCs ou renderização**.

## Execução

Rode o workflow **LHS - Capacity Benchmark** no GitHub Actions, ou localmente:

~~~sh
cd games/lan_house_simulator
npm ci
npm run build
npm install --no-save --no-package-lock playwright@1.56.1
npx playwright install chromium
node scripts/benchmark_capacity.mjs out/capacity
~~~

Resultados no artefato lhs-capacity-benchmark, com capacity_profile.json e README.md.

## O que significa cada linha

- **14/30/50/100:** número de personagens sintéticos **desenhados e/ou processados**; não representa clientes organicamente admitidos, pagamentos ou capacidade dos computadores.
- **Node:** a simulação real por 90 minutos de jogo em duas sementes, com movimentos de teste em 25% dos agentes; nenhuma operação Canvas. Relata média, p95, p99 e máximo em milissegundos por minuto de jogo.
- **Chromium desktop:** renderização real do LHS no navegador, por 7 segundos.
- **Chromium touch-cpu4:** viewport 414×920 e CPU do Chromium com desaceleração 4×; **não é benchmark de um telefone físico**.
- **FPS do requestAnimationFrame ≠ desenhos por segundo:** o LHS limita o desenho a aproximadamente 30 FPS em dispositivos de toque. Use a coluna canvasDrawsPerSecond para acompanhar o desempenho real da cena.
- **P95/P99 do desenho:** custo do SceneRenderer.draw. **P95/P99 de frame:** intervalos de callback da tela e travamentos visíveis; o jogo pode gastar tempo também na simulação, efeitos e UI.
- **Picos maiores que 50 ms, Long Tasks e erros:** ajudam a detectar engasgos que médias escondem.

## Limitações e próximos passos

O cenário utiliza expansão do salão pelas APIs existentes, mas posiciona clientes sintéticos em regiões livres. Usa parcialmente o ciclo de movimento, e não reproduz todas as decisões, filas, vendas, congestionamento de entrada, memória de uma campanha de meses ou utilização de PCs. **Não conclua que 100 clientes são jogáveis com base somente nesses dados.**

Compare o custo entre 14/30/50/100 no **mesmo runner** e na mesma versão de código. Se o Node escalar mal, investigar colisão/navegação e um Web Worker; se o Canvas escalar mal, investigar cache e draw de sprites; se os frame gaps crescerem sem crescimento proporcional do desenho, medir UI, GC e tarefas da thread principal. Confirmar depois em um aparelho Android real.
